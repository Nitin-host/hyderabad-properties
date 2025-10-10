import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  Play,
  Pause,
  RefreshCw,
  Volume2,
  VolumeX,
  CornerDownLeft,
  UploadCloud,
  Maximize,
  Minimize,
} from "lucide-react";

const NeonVideoPlayer = ({
  src,
  poster,
  onReplace,
  onDelete,
  fullScreen = true,
  canEdit = false,
  className = "",
  autoPlay = false,
}) => {
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const progressRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [localSrc, setLocalSrc] = useState(src);
  const [isSeeking, setIsSeeking] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => setLocalSrc(src), [src]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.volume = volume;
    v.muted = muted;
    if (autoPlay) v.play().catch(() => {});
  }, []);

  const togglePlay = useCallback(async () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused || v.ended) {
      await v.play().catch(() => {});
      setIsPlaying(true);
    } else {
      v.pause();
      setIsPlaying(false);
    }
  }, []);

  const handleReplay = () => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = 0;
    v.play().catch(() => {});
    setIsPlaying(true);
  };

  const formatTime = (s = 0) => {
    if (!Number.isFinite(s)) return "00:00";
    const sec = Math.floor(s % 60)
      .toString()
      .padStart(2, "0");
    const min = Math.floor((s / 60) % 60)
      .toString()
      .padStart(2, "0");
    const hr = Math.floor(s / 3600)
      .toString()
      .padStart(2, "0");
    return hr === "00" ? `${min}:${sec}` : `${hr}:${min}:${sec}`;
  };

  const handleTimeUpdate = () => {
    const v = videoRef.current;
    if (!v || isSeeking) return;
    setCurrent(v.currentTime);
  };

  const handleLoadedMetadata = () => {
    const v = videoRef.current;
    if (!v) return;
    setDuration(isFinite(v.duration) ? v.duration : 0);
  };

  const handleVolumeChange = (value) => {
    const v = videoRef.current;
    if (!v) return;
    const vol = Math.max(0, Math.min(1, value));
    setVolume(vol);
    v.volume = vol;
    setMuted(vol === 0);
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    const newMuted = !muted;
    setMuted(newMuted);
    v.muted = newMuted;
  };

  const handleReplaceFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setLocalSrc(url);
    if (onReplace) await onReplace(file);
  };

  const handleDelete = () => {
    setLocalSrc(null);
    if (onDelete) onDelete();
  };

    useEffect(() => {
        const handleFsChange = () =>
        setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener("fullscreenchange", handleFsChange);
        return () =>
        document.removeEventListener("fullscreenchange", handleFsChange);
    }, []);

  // --- Fullscreen ---
   const toggleFullscreen = () => {
     const containerEl = containerRef.current;
     if (!containerEl) return;

     if (!document.fullscreenElement) {
       containerEl.requestFullscreen().catch(console.error);
       setIsFullscreen(true);
     } else {
       document.exitFullscreen().catch(console.error);
       setIsFullscreen(false);
     }
   };

  // --- Seek handling ---
  const handleSeek = (clientX) => {
    const bar = progressRef.current;
    const v = videoRef.current;
    if (!bar || !v || !duration) return;
    const rect = bar.getBoundingClientRect();
    let pct = (clientX - rect.left) / rect.width;
    pct = Math.max(0, Math.min(1, pct));
    v.currentTime = pct * duration;
    setCurrent(pct * duration);
  };

  const handlePointerDown = (e) => {
    setIsSeeking(true);
    handleSeek(e.clientX || (e.touches && e.touches[0].clientX));
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp, { once: true });
  };

  const handlePointerMove = (e) => handleSeek(e.clientX);
  const handlePointerUp = () => {
    setTimeout(() => setIsSeeking(false), 50);
    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerup", handlePointerUp);
  };

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("timeupdate", handleTimeUpdate);
    v.addEventListener("loadedmetadata", handleLoadedMetadata);
    v.addEventListener("ended", () => setIsPlaying(false));
    return () => {
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("timeupdate", handleTimeUpdate);
      v.removeEventListener("loadedmetadata", handleLoadedMetadata);
    };
  }, [duration, isSeeking]);

  const percent = duration ? Math.min(100, (current / duration) * 100) : 0;

  // --- Upload UI if no video exists ---
  if (!localSrc && canEdit) {
    return (
      <div
        className={`border-2 border-dashed border-gray-600 rounded-lg p-4 ${className}`}
      >
        <input
          type="file"
          accept="video/*"
          onChange={handleReplaceFile}
          className="hidden"
          id="video-upload"
        />
        <label
          htmlFor="video-upload"
          className="flex flex-col items-center justify-center cursor-pointer"
        >
          <UploadCloud className="w-8 h-8 text-gray-400 mb-2" />
          <span className="text-gray-300">Click to upload video</span>
        </label>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative rounded-2xl overflow-hidden ${className} ${
        isFullscreen ? "fullscreen" : ""
      }`}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      tabIndex={0}
      role="region"
      aria-label="Neon video player"
    >
      <div
        className="absolute inset-0 pointer-events-none rounded-2xl"
        style={{
          boxShadow:
            "0 6px 30px rgba(99,102,241,0.12), 0 0 40px rgba(124,58,237,0.12), inset 0 0 40px rgba(59,130,246,0.06)",
          border: "1px solid rgba(255,255,255,0.04)",
        }}
      />
      <div className="relative bg-black">
        <video
          ref={videoRef}
          src={localSrc}
          poster={poster}
          className="w-full h-64 md:h-80 object-cover bg-black"
          controls={false}
          playsInline
        />

        {/* Big Play */}
        <button
          aria-label={isPlaying ? "Pause" : "Play"}
          onClick={togglePlay}
          className={`absolute inset-0 flex items-center justify-center transition-all duration-200 ${
            hovering ? "opacity-100" : "opacity-0"
          }`}
          style={{
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.25), rgba(0,0,0,0.45))",
          }}
        >
          <div
            className="p-4 rounded-full backdrop-blur-sm border border-white/10 transform transition-transform hover:scale-105"
            style={{
              boxShadow:
                "0 6px 30px rgba(59,130,246,0.14), 0 0 24px rgba(168,85,247,0.08)",
            }}
          >
            {isPlaying ? (
              <Pause className="w-12 h-12 text-white" />
            ) : (
              <Play className="w-12 h-12 text-white" />
            )}
          </div>
        </button>

        {/* Replace + Delete + Fullscreen */}
        {canEdit && (
          <div className="absolute top-3 right-3 z-20 flex gap-2">
            <label
              title="Replace video"
              className="flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium cursor-pointer
                bg-gradient-to-r from-blue-600/80 via-purple-600/70 to-pink-600/60
                hover:scale-105 transition-transform"
            >
              <UploadCloud size={16} className="text-white" />
              <input
                type="file"
                accept="video/*"
                className="hidden"
                onChange={handleReplaceFile}
              />
            </label>
            {onDelete && (
              <button
                onClick={handleDelete}
                title="Delete video"
                className="p-2 rounded-full bg-red-600/70 hover:bg-red-600/90 text-white transition"
              >
                Delete
              </button>
            )}
          </div>
        )}
      </div>

      {/* Controls */}
      <div
        className="absolute left-0 right-0 bottom-0 z-30 p-4 bg-gradient-to-t from-black/70 to-transparent"
        style={{ backdropFilter: "blur(6px)" }}
      >
        <div
          ref={progressRef}
          className="relative h-2 rounded-full bg-white/6 cursor-pointer"
          onPointerDown={handlePointerDown}
        >
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background:
                "linear-gradient(90deg, rgba(241, 189, 99, 0.18), rgba(247, 196, 85, 0.18))",
            }}
          />
          <div
            className="absolute left-0 top-0 h-full rounded-full transition-width duration-100"
            style={{
              width: `${percent}%`,
              background:
                "linear-gradient(90deg,rgba(232, 166, 103, 1) 23%, rgba(237, 221, 83, 1) 91%)",
              boxShadow: "0 6px 20px rgba(99,102,241,0.12)",
            }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full shadow-lg"
            style={{
              left: `${percent}%`,
              transform: `translate(-50%, 0%)`,
              background: "linear-gradient(180deg,#f6d365,#fda085)",
            }}
          />
        </div>

        <div className="mt-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              aria-label={isPlaying ? "Pause" : "Play"}
              className="p-2 rounded-md bg-white/6 hover:bg-white/10 transition"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 text-white" />
              ) : (
                <Play className="w-5 h-5 text-white" />
              )}
            </button>
            <button
              onClick={handleReplay}
              title="Replay"
              className="p-2 rounded-md bg-white/6 hover:bg-white/10 transition"
            >
              <CornerDownLeft className="w-5 h-5 text-white" />
            </button>
            <div className="text-xs text-white/90 ml-1 font-mono">
              {formatTime(current)} / {formatTime(duration)}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={toggleMute}
                aria-label={muted ? "Unmute" : "Mute"}
                className="p-2 rounded-md bg-white/6 hover:bg-white/10 transition"
              >
                {muted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-white" />
                ) : (
                  <Volume2 className="w-4 h-4 text-white" />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={muted ? 0 : volume}
                onChange={(e) => handleVolumeChange(Number(e.target.value))}
                className="w-24"
                style={{ accentColor: "#8b5cf6" }}
              />
            </div>
            {/* Fullscreen */}
            {fullScreen && (
              <button
                onClick={toggleFullscreen}
                title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                className="p-2 rounded-full bg-gray-700/70 hover:bg-gray-700/90 text-white transition"
              >
                {isFullscreen ? (
                  <Minimize className="w-4 h-4" />
                ) : (
                  <Maximize className="w-4 h-4" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NeonVideoPlayer;