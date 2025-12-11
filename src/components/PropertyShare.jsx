import React, { useRef, useState, useEffect } from "react";
import { Share2 } from "lucide-react";

/**
 * NativeShareButton (fixed)
 */
export default function NativeShareButton({
  propertyId,
  sharePath,
  origin,
  // keep fallback static defaults here, but we'll read live values at share time
  shareTitle = "Check this out",
  shareText = "Check out this property I found!",
  onShare,
  className = "",
}) {
  const [toast, setToast] = useState(null); // null | "copied" | "shared" | "error"
  const toastTimerRef = useRef(null);

  // SSR-safe origin
  const getOrigin = () => {
    if (origin) return origin.replace(/\/+$/, "");
    if (
      typeof window !== "undefined" &&
      window.location &&
      window.location.origin
    ) {
      return window.location.origin.replace(/\/+$/, "");
    }
    return "";
  };

  const buildShareUrl = () => {
    const base = getOrigin();
    if (sharePath) {
      const p = sharePath.startsWith("/") ? sharePath : `/${sharePath}`;
      return base ? `${base}${p}` : p;
    }
    if (propertyId) {
      return base
        ? `${base}/property/${encodeURIComponent(propertyId)}`
        : `/property/${encodeURIComponent(propertyId)}`;
    }
    return base || "";
  };

  const shareUrl = buildShareUrl();

  // Clipboard fallback (async)
  const writeToClipboard = async (text) => {
    if (
      typeof navigator !== "undefined" &&
      navigator.clipboard &&
      navigator.clipboard.writeText
    ) {
      return navigator.clipboard.writeText(text);
    }
    // legacy fallback
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.left = "-99999px";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      if (!ok) throw new Error("copy failed");
      return Promise.resolve();
    } catch (err) {
      return Promise.reject(err);
    }
  };

  const showToast = (type) => {
    setToast(type);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 2000);
  };

  // helper: read current document title and meta description safely at share time
  const getLiveTitleAndDesc = () => {
    let liveTitle = shareTitle;
    let liveDesc = "";

    if (typeof document !== "undefined") {
      if (document.title) liveTitle = document.title;

      const meta = document.querySelector('meta[name="description"]');
      if (meta) {
        // read the meta's content attribute
        const content = meta.getAttribute("content");
        if (content) liveDesc = content;
      }
    }

    return { liveTitle, liveDesc };
  };

  const handleNativeShare = async () => {
    // Read fresh values when user clicks (so we pick up dynamic title/meta)
    const { liveTitle, liveDesc } = getLiveTitleAndDesc();
    const textToShare = liveDesc ? `${liveDesc}` : shareText;
    console.log("Sharing with:", liveTitle, textToShare, shareUrl);
    // Prefer native share if available
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: liveTitle,
          text: textToShare,
          url: shareUrl,
        });
        showToast("shared");
        if (onShare) onShare({ platform: "native", url: shareUrl });
      } catch (err) {
        // user cancelled or share failed -> fallback to copy
        console.debug("Native share cancelled/failed:", err);
        try {
          await writeToClipboard(shareUrl);
          showToast("copied");
          if (onShare) onShare({ platform: "copy", url: shareUrl });
        } catch (e) {
          console.error("Fallback copy failed:", e);
          showToast("error");
        }
      }
    } else {
      // no native share -> fallback to copy
      try {
        await writeToClipboard(shareUrl);
        showToast("copied");
        if (onShare) onShare({ platform: "copy", url: shareUrl });
      } catch (err) {
        console.error("Copy fallback failed:", err);
        showToast("error");
      }
    }
  };

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  return (
    <>
      <button
        type="button"
        aria-label="Share the property"
        onClick={handleNativeShare}
        className={`p-3 rounded-full hover:bg-gray-800 transition ${className}`}
        title="Share"
      >
        <Share2 size={16} aria-hidden="true" />
      </button>

      {/* small toast in top center */}
      {toast === "copied" && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-4 left-1/2 transform -translate-x-1/2
                     bg-gray-800 text-green-400 px-3 py-2 rounded shadow-lg z-50 text-sm"
        >
          ✅ Link copied!
        </div>
      )}

      {toast === "shared" && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-4 left-1/2 transform -translate-x-1/2
                     bg-gray-800 text-green-400 px-3 py-2 rounded shadow-lg z-50 text-sm"
        >
          ✅ Shared!
        </div>
      )}

      {toast === "error" && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-4 left-1/2 transform -translate-x-1/2
                     bg-gray-800 text-red-400 px-3 py-2 rounded shadow-lg z-50 text-sm"
        >
          ⚠️ Unable to share
        </div>
      )}
    </>
  );
}