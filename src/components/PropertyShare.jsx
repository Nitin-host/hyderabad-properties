import React, { useState } from "react";
import { Share2, Copy, Facebook } from "lucide-react";

const PropertyShare = ({ propertyId }) => {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  const shareUrl = `${window.location.origin}/property/${propertyId}`;
  const shareText = "Check out this property I found!";

  // Copy link
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setOpen(false); // close dropdown
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // Native share (mobile)
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Property Listing",
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        console.error("Share failed:", err);
      }
    } else {
      handleCopy(); // fallback
    }
    setOpen(false); // close dropdown
  };

  // Social media share
  const socialShare = (platform) => {
    const url = encodeURIComponent(shareUrl);
    const text = encodeURIComponent(shareText);

    let shareLink = "";
    switch (platform) {
      case "facebook":
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        break;
      case "twitter":
        shareLink = `https://twitter.com/intent/tweet?url=${url}&text=${text}`;
        break;
      case "whatsapp":
        shareLink = `https://api.whatsapp.com/send?text=${text}%20${url}`;
        break;
      default:
        return;
    }
    window.open(shareLink, "_blank", "width=600,height=400");
    setOpen(false); // close dropdown after click
  };

  return (
    <div className="relative inline-block">
      {/* Share button */}
      <button
        onClick={() => setOpen(!open)}
        className="p-3 rounded-full hover:bg-gray-800 transition"
      >
        <Share2 size={16} />
      </button>

      {/* Share options dropdown (opens upwards) */}
      {open && (
        <div className="absolute bottom-full right-0 mb-2 w-48 bg-gray-700 border rounded shadow-lg z-50">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2 hover:bg-gray-800 w-full text-left text-white"
          >
            <Copy size={16} /> Copy Link
          </button>

          <button
            onClick={() => socialShare("facebook")}
            className="flex items-center gap-2 px-4 py-2 hover:bg-gray-800 w-full text-left text-white"
          >
            <Facebook size={16} style={{ color: "#1877F2" }} /> Facebook
          </button>

          {/* Twitter (X) */}
          <button
            onClick={() => socialShare("twitter")}
            className="flex items-center gap-2 px-5 py-2 hover:bg-gray-800 w-full text-left text-white"
          >
            <span className="font-bold text-white bg-black rounded-full w-5 h-5 flex items-center justify-center">
              X
            </span>{" "}
            Twitter
          </button>

          {/* WhatsApp */}
          <button
            onClick={() => socialShare("whatsapp")}
            className="flex items-center gap-2 px-4 py-2 hover:bg-gray-800 w-full text-left text-white"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="#25D366"
            >
              <path d="M12.04 2C6.48 2 2 6.48 2 12.04c0 2.11.55 4.08 1.5 5.78L2 22l4.38-1.45A9.965 9.965 0 0012.04 22C17.6 22 22.08 17.52 22.08 12.04S17.6 2 12.04 2zm0 18c-1.73 0-3.34-.52-4.7-1.4l-.34-.21-2.61.87.88-2.53-.22-.35A7.958 7.958 0 014.04 12c0-4.42 3.6-8.04 8.04-8.04s8.04 3.62 8.04 8.04-3.6 8.04-8.04 8.04z" />
              <path d="M17.3 14.2c-.3-.15-1.8-.9-2.07-1-.27-.1-.46-.15-.65.15s-.75.95-.9 1.15-.33.2-.6.05a7.4 7.4 0 01-2.18-1.34 8.09 8.09 0 01-1.5-1.86c-.16-.3 0-.46.13-.6.13-.13.3-.33.45-.5.15-.16.2-.27.3-.45.1-.15.05-.33-.03-.5s-.65-1.5-.9-2.07c-.23-.55-.45-.48-.65-.48h-.55c-.2 0-.5.05-.77.37s-1 1-1 2.44 1.03 2.83 1.18 3.03 2.03 3.08 4.92 4.3c.69.3 1.23.48 1.65.61.69.2 1.32.17 1.82.1.55-.08 1.8-.74 2.06-1.46.26-.72.26-1.33.18-1.46-.07-.13-.26-.2-.57-.35z" />
            </svg>{" "}
            WhatsApp
          </button>

          <button
            onClick={handleNativeShare}
            className="flex items-center gap-2 px-4 py-2 hover:bg-gray-800 w-full text-left text-white"
          >
            <Share2 size={16} /> Native Share
          </button>
        </div>
      )}

      {/* Copy feedback */}
      {/* Copy feedback (center of page with fade) */}
        {copied && (
             <div
                className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
                        bg-gray-800 text-green-400 px-3 py-2 rounded shadow-lg z-50
                        text-xs sm:text-sm md:text-base
                        max-w-xs sm:max-w-sm md:max-w-md
                        text-center
                        opacity-0 animate-fadeInOut"
            >
            ✅ Link copied!
            </div>
        )}

    </div>
  );
};

export default PropertyShare;
