import React, { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Replace,
  Settings,
  Trash2,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { notifyWarning } from "../util/Notifications";

const isM3U8 = (s = "") => /\.m3u8(\?|#|$)/i.test(s);
const isFileM3U8 = (f) =>
  f?.type === "application/vnd.apple.mpegurl" ||
  f?.type === "application/x-mpegURL" ||
  /\.m3u8$/i.test(f?.name || "");

const NeonVideoPlayer = ({
  src,
  poster,
  onReplace,
  onDelete,
  fullScreen = true,
  canEdit = false,
  className = "",
  autoPlay = false,
  showQualityNotice = true,
}) => {
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const hideTimerRef = useRef(null);

  // State
  const [localSrc, setLocalSrc] = useState(src || "");
  const [isLocalFile, setIsLocalFile] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [levels, setLevels] = useState([]);
  const [qualityLabel, setQualityLabel] = useState("Auto");
  const [hoverTime, setHoverTime] = useState(null);
  const [hoverX, setHoverX] = useState(0);
  const lastTapRef = useRef(0);
  const [showSkipOverlay, setShowSkipOverlay] = useState(null); // "forward" | "backward" | null
  const isTouchDevice =
    "ontouchstart" in window || navigator.maxTouchPoints > 0;

  const [qualityNotice, setQualityNotice] = useState(null);

  // Reset source when prop changes
  useEffect(() => {
    setLocalSrc(src || "");
    setIsLocalFile(false);
  }, [src]);

  // Initialize HLS or native video
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !localSrc) return;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const isHLS = isM3U8(localSrc);

    if (isLocalFile && isHLS) {
      notifyWarning("Local .m3u8 playlists cannot play directly.");
      return;
    }

    if (isHLS && Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true });
      hlsRef.current = hls;
      hls.loadSource(localSrc);
      hls.attachMedia(video);

      // ✅ Wait until manifest is parsed, then autoplay
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (autoPlay) {
          video
            .play()
            .catch((err) =>
              console.warn("Autoplay blocked by browser:", err.message)
            );
        }
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
        const lv = hls.levels?.[data.level];
        const label = lv?.height ? `${lv.height}p` : "Auto";
        setQualityLabel(label);

        if (showQualityNotice) setQualityNotice(`Quality: ${label}`);
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = setTimeout(() => setQualityNotice(null), 2000);
      });
    } else {
      video.src = localSrc;
      if (autoPlay) {
        video
          .play()
          .catch((err) =>
            console.warn("Autoplay blocked by browser:", err.message)
          );
      }
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [localSrc, autoPlay]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      // if clicked outside menu or settings button, close menu
      if (!e.target.closest(".settings-menu, .settings-toggle")) {
        setShowSettings(false);
      }
    };

    // delay listener attachment slightly to avoid instant close
    const timer = setTimeout(() => {
      document.addEventListener("click", handleClickOutside);
    }, 50);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  // Video events
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const onLoaded = () => setDuration(v.duration || 0);
    const onPlay = () => {
      setIsPlaying(true);
      pokeControls();
    };
    const onPause = () => setIsPlaying(false);
    const onTime = () => setCurrent(v.currentTime);
    const onEnd = () => setIsPlaying(false);

    v.addEventListener("loadedmetadata", onLoaded);
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("ended", onEnd);

    return () => {
      v.removeEventListener("loadedmetadata", onLoaded);
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("ended", onEnd);
    };
  }, []);

  // Auto-hide controls
  const pokeControls = () => {
    setShowControls(true);
    document.body.style.cursor = "default";
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      setShowControls(false);
      // document.body.style.cursor = "none";
    }, 3000);
  };

  useEffect(() => {
    const container = containerRef.current;
    const video = videoRef.current;
    if (!container || !video) return;

    const onMove = () => pokeControls();
    container.addEventListener("mousemove", onMove);
    video.addEventListener("mousemove", onMove);
    container.addEventListener("touchstart", onMove);
    container.addEventListener("touchmove", onMove);

    pokeControls();

    return () => {
      container.removeEventListener("mousemove", onMove);
      video.removeEventListener("mousemove", onMove);
      container.removeEventListener("touchstart", onMove);
      container.removeEventListener("touchmove", onMove);
      clearTimeout(hideTimerRef.current);
    };
  }, []);

  const handleDoubleTap = (e) => {
    const now = Date.now();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const half = rect.width / 2;

    if (now - lastTapRef.current < 300) {
      // double-tap detected
      if (x > half) {
        skipForward();
        setShowSkipOverlay("forward");
      } else {
        skipBackward();
        setShowSkipOverlay("backward");
      }

      // remove overlay after 700 ms
      setTimeout(() => setShowSkipOverlay(null), 700);
    }

    lastTapRef.current = now;
  };

  useEffect(() => {
    if (isTouchDevice) return; // Skip on mobile/tablet

    const handleKey = (e) => {
      const v = videoRef.current;
      if (!v) return;

      if (e.code === "ArrowRight") {
        v.currentTime = Math.min(v.currentTime + 10, v.duration);
      } else if (e.code === "ArrowLeft") {
        v.currentTime = Math.max(v.currentTime - 10, 0);
      } else if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isTouchDevice]);

  useEffect(() => {
    const onFsChange = () => {
      const isFs =
        !!document.fullscreenElement ||
        !!document.webkitFullscreenElement ||
        !!document.mozFullScreenElement ||
        !!document.msFullscreenElement;
      setIsFullscreen(isFs);
    };
    document.addEventListener("fullscreenchange", onFsChange);
    document.addEventListener("webkitfullscreenchange", onFsChange);
    document.addEventListener("mozfullscreenchange", onFsChange);
    document.addEventListener("MSFullscreenChange", onFsChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFsChange);
      document.removeEventListener("webkitfullscreenchange", onFsChange);
      document.removeEventListener("mozfullscreenchange", onFsChange);
      document.removeEventListener("MSFullscreenChange", onFsChange);
    };
  }, []);

  // Controls
  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    v.paused ? v.play() : v.pause();
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    const next = !muted;
    v.muted = next;
    setMuted(next);
  };

  const isIOS = (() => {
    if (typeof navigator === "undefined") return false;
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  })();


  const toggleFullscreen = async () => {
    if (!fullScreen) return; // Disabled by prop
    const el = containerRef.current;
    const v = videoRef.current;
    if (!el || !v) return;

    try {
      // iOS (use native video fullscreen)
      if (isIOS) {
        if (typeof v.webkitEnterFullscreen === "function") {
          v.webkitEnterFullscreen();
          setIsFullscreen(true);
          return;
        }
      }
      // Standard Fullscreen API
      if (!document.fullscreenElement) {
        if (el.requestFullscreen) {
          await el.requestFullscreen();
        } else if (el.webkitRequestFullscreen) {
          // webkit prefixed (older Safari)
          el.webkitRequestFullscreen();
        } else if (el.msRequestFullscreen) {
          el.msRequestFullscreen();
        } else {
          // last resort: try native video fullscreen
          if (typeof v.webkitEnterFullscreen === "function") {
            v.webkitEnterFullscreen();
            setIsFullscreen(true);
            return;
          }
        }
        setIsFullscreen(true);
      } else {
        // Exit fullscreen
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
          document.msExitFullscreen();
        } else {
          // No API to exit; if we entered via video.webkitEnterFullscreen(), user closes manually
        }
        setIsFullscreen(false);
      }
    } catch (err) {
      console.warn("Fullscreen toggle failed:", err);
      // Best-effort: if webkitEnterFullscreen exists, try it as fallback
      try {
        if (typeof v.webkitEnterFullscreen === "function") {
          v.webkitEnterFullscreen();
          setIsFullscreen(true);
        }
      } catch (e) {
        console.error("webkitEnterFullscreen fallback failed:", e);
      }
    }
  };

  const handleReplay = () => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = 0;
    v.play();
  };

  const handleSeek = (e) => {
    const v = videoRef.current;
    if (!v) return;
    const newTime = parseFloat(e.target.value);
    v.currentTime = newTime;
    setCurrent(newTime);
  };

  const skipForward = () => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.min(v.currentTime + 10, v.duration);
  };

  const skipBackward = () => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(v.currentTime - 10, 0);
  };

  const changeSpeed = (rate) => {
    const v = videoRef.current;
    if (!v) return;
    v.playbackRate = rate;
    setPlaybackRate(rate);
    setShowSettings(false);
  };

  const changeQuality = (index) => {
    const hls = hlsRef.current;
    if (!hls) return;

    if (index === "auto") {
      hls.currentLevel = -1;
      setQualityLabel("Auto");
      setQualityNotice("Quality: Auto");
    } else {
      hls.currentLevel = index;
      const lv = hls.levels?.[index];
      const label = lv?.height ? `${lv.height}p` : "Auto";
      setQualityLabel(label);
      if (showQualityNotice) setQualityNotice(`Quality: ${label}`);
    }

    clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setQualityNotice(null), 2000);
    setShowSettings(false);
  };

  const changeVolume = (e) => {
    const v = videoRef.current;
    if (!v) return;
    const val = parseFloat(e.target.value);
    v.volume = val;
    setVolume(val);
    setMuted(val === 0);
  };

  const formatTime = (s = 0) => {
    s = Math.max(0, Math.round(s));
    const sec = `${s % 60}`.padStart(2, "0");
    const min = `${Math.floor((s / 60) % 60)}`.padStart(2, "0");
    const hr = Math.floor(s / 3600);
    return hr ? `${hr}:${min}:${sec}` : `${min}:${sec}`;
  };

  // Hover time preview
  const handleHover = (e) => {
    const rect = e.target.getBoundingClientRect();
    const percent = (e.nativeEvent.offsetX / rect.width) * duration;
    setHoverTime(percent);
    setHoverX(e.nativeEvent.offsetX);
  };
  const handleLeave = () => setHoverTime(null);

  const handleReplaceFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (isFileM3U8(file)) {
      notifyWarning("Local .m3u8 cannot play directly.");
      e.target.value = null;
      return;
    }
    const url = URL.createObjectURL(file);
    setLocalSrc(url);
    setIsLocalFile(true);
    onReplace?.(file);
  };

  const handleDelete = () => {
    setLocalSrc("");
    setIsLocalFile(false);
    onDelete?.();
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full bg-black rounded-xl overflow-hidden ${className}`}
      onMouseMove={pokeControls}
      onDoubleClick={toggleFullscreen}
    >
      <video
        ref={videoRef}
        poster={poster}
        className="w-full max-h-[85vh] object-contain bg-black z-0 rounded-md"
        style={{
          pointerEvents: "auto",
          display: "block",
          margin: "0 auto",
          WebkitUserSelect: "none",
          WebkitTouchCallout: "none",
        }}
        playsInline
        webkit-playsinline="true"
        x5-playsinline="true"
        muted={muted}
        onClick={togglePlay}
        onTouchStart={isTouchDevice ? handleDoubleTap : undefined}
        onDoubleClick={(e) => {
          // Desktop double-click = fullscreen only if allowed
          if (!isTouchDevice && fullScreen) toggleFullscreen(e);
        }}
      />

      {/* Double-tap skip overlay */}
      {showSkipOverlay && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-40">
          {showSkipOverlay === "forward" && (
            <div className="animate-pulse text-white text-lg sm:text-2xl font-semibold bg-black/60 px-4 py-2 rounded-lg">
              +10 s ▶
            </div>
          )}
          {showSkipOverlay === "backward" && (
            <div className="animate-pulse text-white text-lg sm:text-2xl font-semibold bg-black/60 px-4 py-2 rounded-lg">
              ◀ 10 s
            </div>
          )}
        </div>
      )}

      {/* 🆕 Quality change overlay */}
      {showQualityNotice && qualityNotice && (
        <div className="absolute top-4 right-4 bg-black/70 text-white text-xs sm:text-sm px-3 py-1 rounded-md shadow-md z-50 animate-fade-in">
          {qualityNotice}
        </div>
      )}

      {/* Replace/Delete */}
      {canEdit && (
        <div className="absolute top-3 right-3 z-40 flex gap-2">
          <label
            title="Replace video"
            className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium cursor-pointer bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:scale-105 transition-transform text-white"
          >
            <Replace size={16} />
            <input
              type="file"
              accept="video/*,.m3u8"
              className="hidden"
              onChange={handleReplaceFile}
            />
          </label>
          {onDelete && (
            <button
              aria-label="Delete the video"
              onClick={handleDelete}
              title="Delete video"
              className="px-3 py-1 rounded-full bg-red-600 hover:bg-red-700 text-white transition text-xs flex items-center gap-1"
            >
              <Trash2 size={16} /> Delete
            </button>
          )}
        </div>
      )}

      {/* Controls */}
      <div
        className={`absolute bottom-0 left-0 right-0 px-3 sm:px-5 py-3 sm:py-4 z-30
        bg-gradient-to-t from-black/85 to-transparent backdrop-blur-md
        transition-opacity duration-300 flex flex-col gap-2
        ${showControls ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        style={{
          paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 6px)",
          minHeight: "70px",
        }}
      >
        {/* Progress bar + hover preview */}
        <div className="relative w-full mb-1 sm:mb-2">
          <input
            type="range"
            min="0"
            max={duration || 0}
            step="0.1"
            value={current}
            onChange={handleSeek}
            onMouseMove={handleHover}
            onMouseLeave={handleLeave}
            className="w-full h-1 bg-gray-400 rounded-lg cursor-pointer appearance-none accent-white"
          />
          {hoverTime !== null && (
            <div
              className="absolute -top-6 text-xs text-white bg-black/80 px-2 py-0.5 rounded"
              style={{ left: hoverX - 20 }}
            >
              {formatTime(hoverTime)}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 sm:gap-3 flex-nowrap overflow-visible w-full">
          {/* Left */}
          <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-shrink overflow-hidden">
            <button
              type="button"
              aria-label={isPlaying ? "Pause video" : "Play video"}
              onClick={togglePlay}
              className="p-2 hover:bg-white/15 rounded"
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            </button>
            <button
              type="button"
              aria-label="Skip backward 10 seconds"
              onClick={skipBackward}
              className="p-2 hover:bg-white/15 rounded"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              aria-label="Skip forward 10 seconds"
              onClick={skipForward}
              className="p-2 hover:bg-white/15 rounded"
            >
              <ChevronRight size={18} />
            </button>
            <button
              type="button"
              aria-label="Replace"
              onClick={handleReplay}
              className="p-2 hover:bg-white/15 rounded"
            >
              <RotateCcw size={18} />
            </button>
            <span className="text-xs font-mono whitespace-nowrap">
              {formatTime(current)} / {formatTime(duration)}
            </span>
          </div>
          {/* Right */}
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <button
              type="button"
              aria-label={muted || volume === 0 ? "Unmute" : "Mute"}
              onClick={toggleMute}
              className="p-2 hover:bg-white/15 rounded"
            >
              {muted || volume === 0 ? (
                <VolumeX size={18} />
              ) : (
                <Volume2 size={18} />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={changeVolume}
              className="w-20 cursor-pointer accent-white hidden sm:block"
            />

            {/* Settings */}
            <div className="relative">
              <button
                type="button"
                aria-label="Video Settings"
                onClick={() => setShowSettings((s) => (s ? false : "main"))}
                className={`settings-toggle p-2 hover:bg-white/15 rounded transition-transform ${
                  showSettings ? "rotate-45" : ""
                }`}
                title="Settings"
              >
                <Settings size={18} />
              </button>

              {showSettings && (
                <div
                  className="settings-menu absolute bottom-12 right-0 w-56 rounded-xl shadow-2xl bg-black/90 backdrop-blur-md text-white border border-white/10 overflow-hidden transition-all duration-300 animate-fade-in z-50"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Main Menu */}
                  {showSettings === "main" && (
                    <div className="flex flex-col">
                      <button
                        type="button"
                        aria-label="Playback speed"
                        className="flex justify-between items-center px-4 py-2 text-sm hover:bg-white/10 transition"
                        onClick={() => setShowSettings("speed")}
                      >
                        <span>Playback speed</span>
                        <span className="text-gray-400">{playbackRate}x</span>
                      </button>
                      <button
                        type="button"
                        aria-label="Video quality"                      
                        className="flex justify-between items-center px-4 py-2 text-sm hover:bg-white/10 transition"
                        onClick={() => setShowSettings("quality")}
                      >
                        <span>Quality</span>
                        <span className="text-gray-400">{qualityLabel}</span>
                      </button>
                    </div>
                  )}

                  {/* Speed Submenu */}
                  {showSettings === "speed" && (
                    <div className="flex flex-col">
                      <button
                        type="button"
                        aria-label="Options for speed"
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium border-b border-white/10 hover:bg-white/10"
                        onClick={() => setShowSettings("main")}
                      >
                        <ChevronLeft size={16} />
                        <span>Speed</span>
                      </button>
                      {[0.5, 1, 1.25, 1.5, 2].map((r) => (
                        <button
                          key={r}
                          aria-label="Select the number for Speed of the video"
                          onClick={() => {
                            changeSpeed(r);
                            setShowSettings("main");
                          }}
                          className={`px-4 py-2 text-left text-sm hover:bg-white/10 ${
                            playbackRate === r ? "text-yellow-400" : ""
                          }`}
                        >
                          {r}x
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Quality Submenu */}
                  {showSettings === "quality" && (
                    <div className="flex flex-col text-sm">
                      <button
                        type="button"
                        aria-label="Options for quality"
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium border-b border-white/10 hover:bg-white/10"
                        onClick={() => setShowSettings("main")}
                      >
                        <ChevronLeft size={16} />
                        <span>Quality</span>
                      </button>

                      {/* 🆕 Data Saver */}
                      <button
                        type="button"
                        aria-label="Data Saver Quality"
                        onClick={() => {
                          const hls = hlsRef.current;
                          if (hls && hls.levels && hls.levels.length > 0) {
                            hls.currentLevel = 0; // lowest available level
                            setQualityLabel("Data Saver");
                            // show overlay
                            setQualityNotice("Quality: Data Saver");
                            clearTimeout(hideTimerRef.current);
                            hideTimerRef.current = setTimeout(
                              () => setQualityNotice(null),
                              2000
                            );
                          }
                          setShowSettings("main");
                        }}
                        className={`px-4 py-2 text-left hover:bg-white/10 ${
                          qualityLabel === "Data Saver" ? "text-yellow-400" : ""
                        }`}
                      >
                        Data Saver
                      </button>

                      {/* Auto */}
                      <button
                        type="button"
                        aria-label="Auto Quality"
                        onClick={() => {
                          changeQuality("auto");
                          setShowSettings("main");
                        }}
                        className={`px-4 py-2 text-left hover:bg-white/10 ${
                          qualityLabel === "Auto" ? "text-yellow-400" : ""
                        }`}
                      >
                        Auto
                      </button>

                      {/* Specific Quality Levels */}
                      {levels.map((lv) => (
                        <button
                          type="button"
                          aria-label="Select the number for Quality of the video"
                          key={lv.index}
                          onClick={() => {
                            changeQuality(lv.index);
                            setShowSettings("main");
                          }}
                          className={`px-4 py-2 text-left hover:bg-white/10 ${
                            qualityLabel === `${lv.height}p`
                              ? "text-yellow-400"
                              : ""
                          }`}
                        >
                          {lv.height ? `${lv.height}p` : `Level ${lv.index}`}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {fullScreen && (
              <button
                type="button"
                aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                onClick={toggleFullscreen}
                className="p-2 hover:bg-white/15 rounded"
              >
                {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NeonVideoPlayer;