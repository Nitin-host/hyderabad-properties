import React, { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";

function isIosDevice() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const iOS = /iPad|iPhone|iPod/.test(ua);
  const iPadOs =
    navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  return iOS || iPadOs;
}

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [visible, setVisible] = useState(false);
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    if (sessionStorage.getItem("pwa-install-dismissed") === "1") return;

    if (isIosDevice()) {
      setIosHint(true);
      setVisible(true);
      return;
    }

    const onBeforeInstall = (event) => {
      event.preventDefault();
      setDeferredPrompt(event);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  const dismiss = () => {
    sessionStorage.setItem("pwa-install-dismissed", "1");
    setVisible(false);
    setDeferredPrompt(null);
  };

  const install = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed left-3 right-3 z-[60] bottom-[5.75rem] lg:bottom-4">
      <div className="mx-auto max-w-lg rounded-2xl border border-line bg-surface/95 backdrop-blur-xl shadow-xl p-3 flex items-start gap-3">
        <div className="mt-0.5 rounded-xl bg-brand/15 text-brand p-2 shrink-0">
          {iosHint ? <Share size={18} /> : <Download size={18} />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-fg">Install RR Properties</p>
          <p className="text-xs text-muted mt-0.5">
            {iosHint
              ? "On iPhone, tap Share, then Add to Home Screen."
              : "Add this app to your home screen for quicker access."}
          </p>
          {!iosHint && (
            <button
              type="button"
              onClick={install}
              className="mt-2 text-xs font-semibold px-3 py-1.5 rounded-lg bg-brand text-brand-fg"
            >
              Install app
            </button>
          )}
        </div>
        <button
          type="button"
          aria-label="Dismiss install prompt"
          onClick={dismiss}
          className="p-1 rounded-lg text-muted hover:text-fg hover:bg-raised"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
