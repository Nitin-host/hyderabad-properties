import { propertiesAPI } from "../services/api";

const DEFAULT_PART_SIZE = 8 * 1024 * 1024;
const PART_CONCURRENCY = 2;
const PART_RETRIES = 3;

async function uploadPartWithRetry({
  propertyId,
  uploadId,
  key,
  partNumber,
  blob,
}) {
  let lastError;
  for (let attempt = 1; attempt <= PART_RETRIES; attempt++) {
    try {
      const form = new FormData();
      form.append("chunk", blob, `part-${partNumber}`);
      form.append("uploadId", uploadId);
      form.append("key", key);
      form.append("partNumber", String(partNumber));

      const res = await propertiesAPI.uploadVideoPart(propertyId, form);
      const etag = res?.data?.etag;
      if (!etag) throw new Error("Missing ETag for uploaded part");
      return etag;
    } catch (err) {
      lastError = err;
      await new Promise((r) => setTimeout(r, 400 * attempt));
    }
  }
  throw lastError || new Error(`Failed to upload part ${partNumber}`);
}

export async function uploadVideoInChunks({
  propertyId,
  file,
  onProgress,
}) {
  if (!file) throw new Error("No video file selected");
  if (!file.size) throw new Error("Video file is empty");

  const init = await propertiesAPI.initVideoUpload(propertyId, {
    fileName: file.name,
    fileSize: file.size,
    contentType: file.type || "video/mp4",
  });

  const { uploadId, key, partSize } = init.data || {};
  if (!uploadId || !key) {
    throw new Error("Failed to start chunked video upload");
  }

  const size = partSize || DEFAULT_PART_SIZE;
  const partCount = Math.ceil(file.size / size);
  const parts = new Array(partCount);
  let completed = 0;

  try {
    let next = 0;
    const workers = Array.from(
      { length: Math.min(PART_CONCURRENCY, partCount) },
      async () => {
        while (next < partCount) {
          const index = next++;
          const partNumber = index + 1;
          const start = index * size;
          const blob = file.slice(start, Math.min(file.size, start + size));
          const etag = await uploadPartWithRetry({
            propertyId,
            uploadId,
            key,
            partNumber,
            blob,
          });
          parts[index] = { PartNumber: partNumber, ETag: etag };
          completed += 1;
          onProgress?.(Math.round((completed / partCount) * 100));
        }
      }
    );

    await Promise.all(workers);

    return propertiesAPI.completeVideoUpload(propertyId, {
      uploadId,
      key,
      fileName: file.name,
      parts,
    });
  } catch (err) {
    try {
      await propertiesAPI.abortVideoUpload(propertyId, { uploadId, key });
    } catch {
      // ignore abort errors
    }
    throw err;
  }
}
