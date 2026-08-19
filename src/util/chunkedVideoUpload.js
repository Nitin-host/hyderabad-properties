import { propertiesAPI } from "../services/api";

const DEFAULT_PART_SIZE = 8 * 1024 * 1024;
const DIRECT_CONCURRENCY = 4;
const PROXY_CONCURRENCY = 2;
const PART_RETRIES = 3;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function normalizeEtag(etag) {
  if (!etag) return "";
  return String(etag).replace(/"/g, "");
}

async function uploadPartToR2(url, blob) {
  const res = await fetch(url, { method: "PUT", body: blob });
  if (!res.ok) {
    throw new Error(`Direct R2 upload failed (${res.status})`);
  }
  const etag = normalizeEtag(res.headers.get("etag") || res.headers.get("ETag"));
  if (!etag) {
    throw new Error("Missing ETag from R2. Expose the ETag header in bucket CORS.");
  }
  return etag;
}

async function uploadPartViaApi({
  propertyId,
  uploadId,
  key,
  partNumber,
  blob,
}) {
  const form = new FormData();
  form.append("chunk", blob, `part-${partNumber}`);
  form.append("uploadId", uploadId);
  form.append("key", key);
  form.append("partNumber", String(partNumber));

  const res = await propertiesAPI.uploadVideoPart(propertyId, form);
  const etag = normalizeEtag(res?.data?.etag);
  if (!etag) throw new Error("Missing ETag for uploaded part");
  return etag;
}

async function uploadPartWithRetry(task) {
  let lastError;
  for (let attempt = 1; attempt <= PART_RETRIES; attempt++) {
    try {
      if (task.directUrl) {
        return await uploadPartToR2(task.directUrl, task.blob);
      }
      return await uploadPartViaApi(task);
    } catch (err) {
      lastError = err;
      await sleep(400 * attempt);
    }
  }
  throw lastError || new Error(`Failed to upload part ${task.partNumber}`);
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

  const { uploadId, key, partSize, partUrls, directUpload } = init.data || {};
  if (!uploadId || !key) {
    throw new Error("Failed to start chunked video upload");
  }

  const size = partSize || DEFAULT_PART_SIZE;
  const partCount = Math.ceil(file.size / size);
  const urlByPart = new Map(
    (partUrls || []).map((p) => [Number(p.partNumber), p.url])
  );
  let useDirect = Boolean(directUpload && urlByPart.size);
  const concurrency = useDirect ? DIRECT_CONCURRENCY : PROXY_CONCURRENCY;
  const parts = new Array(partCount);
  let uploadedBytes = 0;

  try {
    let next = 0;
    const workers = Array.from(
      { length: Math.min(concurrency, partCount) },
      async () => {
        while (next < partCount) {
          const index = next++;
          const partNumber = index + 1;
          const start = index * size;
          const blob = file.slice(start, Math.min(file.size, start + size));
          try {
            const etag = await uploadPartWithRetry({
              propertyId,
              uploadId,
              key,
              partNumber,
              blob,
              directUrl: useDirect ? urlByPart.get(partNumber) : "",
            });
            parts[index] = { PartNumber: partNumber, ETag: etag };
          } catch (err) {
            if (useDirect) {
              useDirect = false;
              const etag = await uploadPartWithRetry({
                propertyId,
                uploadId,
                key,
                partNumber,
                blob,
              });
              parts[index] = { PartNumber: partNumber, ETag: etag };
            } else {
              throw err;
            }
          }
          uploadedBytes += blob.size;
          onProgress?.(Math.min(100, Math.round((uploadedBytes / file.size) * 100)));
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
