import React, { useRef, useState, useEffect } from "react";
import {
  Play,
  Pause,
  Repeat,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Replace,
  Clock,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { notifyWarning } from "../util/Notifications";

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
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [localSrc, setLocalSrc] = useState(src);

  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobileView(mobile);
      if (!mobile) setShowVolumeSlider(false); // show slider on desktop by default
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);


  useEffect(() => setLocalSrc(src), [src]);
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.volume = volume;
    v.muted = muted;
    if (autoPlay) v.play().catch(() => {});
  }, [volume, muted, autoPlay]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const syncState = () => {
      setIsPlaying(!v.paused);
      setCurrent(v.currentTime);
      setDuration(v.duration || 0);
    };
    const onEndFullscreen = () => {
      setIsFullscreen(false);
    };

    v.addEventListener("loadedmetadata", syncState);
    v.addEventListener("play", () => setIsPlaying(true));
    v.addEventListener("pause", () => setIsPlaying(false));
    v.addEventListener("timeupdate", () => setCurrent(v.currentTime));
    v.addEventListener("ended", () => setIsPlaying(false));
    v.addEventListener("webkitendfullscreen", onEndFullscreen);

    return () => {
      v.removeEventListener("loadedmetadata", syncState);
      v.removeEventListener("play", () => setIsPlaying(true));
      v.removeEventListener("pause", () => setIsPlaying(false));
      v.removeEventListener("timeupdate", () => setCurrent(v.currentTime));
      v.removeEventListener("webkitendfullscreen", onEndFullscreen);
    };
  }, []);

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFsChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  useEffect(() => {
    const handleKey = (e) => {
      const v = videoRef.current;
      if (!v) return;

      switch (e.code) {
        case "ArrowRight": // forward 10s
          v.currentTime = Math.min(v.currentTime + 10, duration);
          setCurrent(v.currentTime);
          break;
        case "ArrowLeft": // backward 10s
          v.currentTime = Math.max(v.currentTime - 10, 0);
          setCurrent(v.currentTime);
          break;
        case "Space": // play/pause toggle
          e.preventDefault(); // prevent page scroll
          togglePlay();
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [duration, isPlaying]);

  const play = () => videoRef.current?.play();
  const pause = () => videoRef.current?.pause();
  const togglePlay = () => (isPlaying ? pause() : play());
  const handleReplay = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      play();
    }
  };
  const toggleFullscreen = () => {
    const v = videoRef.current;
    const containerEl = containerRef.current;
    if (!v || !containerEl) return;
    if ("webkitEnterFullscreen" in v) {
      v.webkitEnterFullscreen();
      setIsFullscreen(true);
    } else if (!document.fullscreenElement) {
      containerEl.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };
  const handleVolumeChange = (val) => {
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      setMuted(val === 0);
    }
  };

  const toggleMute = () => {
    setMuted((prev) => !prev);
    if (videoRef.current) videoRef.current.muted = !muted;
  };

  const toggleVolumeSlider = () => {
    if (isMobileView) {
      setShowVolumeSlider((v) => !v);
    } else {
      toggleMute();
    }
  };

  const handleSeek = (e) => {
    const rect = e.target.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    const time = pct * duration;
    if (videoRef.current) videoRef.current.currentTime = time;
    setCurrent(time);
  };

  const handleReplaceFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    console.log('file.size', file.size);
    if (file.size > 250 * 1024 * 1024) {
      notifyWarning("File size must be 250MB or less");
      e.target.value = null;
      return;
    }
    const url = URL.createObjectURL(file);
    setLocalSrc(url);
    onReplace?.(file);
  };

  const handleDelete = () => {
    setLocalSrc(null);
    onDelete?.();
  };

  const formatTime = (s = 0) => {
    s = Math.round(s);
    const sec = `${s % 60}`.padStart(2, "0");
    const min = `${Math.floor(s / 60)}`.padStart(2, "0");
    const hr = Math.floor(s / 3600);
    return hr ? `${hr}:${min}:${sec}` : `${min}:${sec}`;
  };
  const fsClass = isFullscreen ? "neon-fs" : "";

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
          <Replace className="w-8 h-8 text-gray-400 mb-2" />
          <span className="text-gray-300">Click to upload video</span>
        </label>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full ${fsClass} ${className}`}
    >
      <video
        ref={videoRef}
        src={localSrc}
        poster={poster}
        className="w-full h-full object-cover bg-black"
        controls={false}
        playsInline
        muted={autoPlay}
        autoPlay={autoPlay}
        tabIndex={0}
        aria-label="Custom Video Player"
        onClick={togglePlay}
      />
      {/* Left -10s Seek Button */}
      <button
        onClick={() => {
          if (videoRef.current) {
            videoRef.current.currentTime = Math.max(
              videoRef.current.currentTime - 10,
              0
            );
            setCurrent(videoRef.current.currentTime);
          }
        }}
        aria-label="Seek backward 10 seconds"
        className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white rounded-full p-3 z-20 transition flex items-center justify-center gap-1"
        style={{ userSelect: "none", width: 50, height: 50 }}
      >
        <Clock size={20} />
        <span className="font-mono text-sm">10s</span>
      </button>

      {/* Right +10s Seek Button */}
      <button
        onClick={() => {
          if (videoRef.current) {
            videoRef.current.currentTime = Math.min(
              videoRef.current.currentTime + 10,
              duration
            );
            setCurrent(videoRef.current.currentTime);
          }
        }}
        aria-label="Seek forward 10 seconds"
        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white rounded-full p-3 z-20 transition flex items-center justify-center gap-1"
        style={{ userSelect: "none", width: 50, height: 50 }}
      >
        <Clock size={20} />
        <span className="font-mono text-sm">10s</span>
      </button>

      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent z-10">
        <div
          className="relative h-2 rounded-full bg-white/6 cursor-pointer"
          onClick={handleSeek}
        >
          <div
            className="absolute left-0 top-0 h-full rounded-full transition-width duration-100"
            style={{
              width: `${duration ? (current / duration) * 100 : 0}%`,
              background:
                "linear-gradient(90deg,rgba(232, 166, 103, 1) 23%, rgba(237, 221, 83, 1) 91%)",
              boxShadow: "0 6px 20px rgba(99,102,241,0.12)",
            }}
          />
        </div>
        <div className="mt-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
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
              type="button"
              onClick={handleReplay}
              title="Replay"
              className="p-2 rounded-md bg-white/6 hover:bg-white/10 transition"
            >
              <Repeat className="w-5 h-5 text-white" />
            </button>
            <div className="text-xs text-white/90 ml-1 font-mono">
              {formatTime(current)} / {formatTime(duration)}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleVolumeSlider}
              aria-label={muted ? "Unmute" : "Mute"}
              className="p-2 rounded-md bg-white/6 hover:bg-white/10 transition"
            >
              {muted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-white" />
              ) : (
                <Volume2 className="w-4 h-4 text-white" />
              )}
            </button>
            {(!isMobileView || showVolumeSlider) && (
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={muted ? 0 : volume}
                onChange={(e) => handleVolumeChange(Number(e.target.value))}
                className="w-24"
                style={{ accentColor: "#E8A667" }}
              />
            )}
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
      {canEdit && (
        <div className="absolute top-3 right-3 z-20 flex gap-2">
          <label
            title="Replace video"
            className="flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium cursor-pointer bg-gradient-to-r from-blue-600/80 via-purple-600/70 to-pink-600/60 hover:scale-105 transition-transform"
          >
            <Replace size={16} className="text-white" />
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
  );
};

export default NeonVideoPlayer;