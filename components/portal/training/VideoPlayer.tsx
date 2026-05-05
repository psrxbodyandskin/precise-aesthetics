"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Maximize2,
  Pause,
  Play,
  Volume2,
  VolumeX,
} from "lucide-react";

import { cn } from "@/lib/utils";

interface VideoPlayerProps {
  videoUrl: string;
  moduleId: string;
  practiceUserId: string;
  initialPositionSeconds: number;
  initialWatchPercentage: number;
  durationSeconds: number | null;
  requiredWatchPercentage: number;
  onWatchComplete: () => void;
}

// P9 — Custom HTML5 video player with server-trusted progress.
//
// Tracks max-seen position; saves to /api/portal/training/modules/[id]/progress
// every 10s of new playback (debounced). Also flushes on pause,
// visibilitychange, and unload (sendBeacon for reliability).
//
// Lock seeking past unwatched portion on first watch — once
// watch_percentage hits required, scrubbing unlocks fully.
export function VideoPlayer({
  videoUrl,
  moduleId,
  practiceUserId,
  initialPositionSeconds,
  initialWatchPercentage,
  durationSeconds,
  requiredWatchPercentage,
  onWatchComplete,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastSavedRef = useRef<{ time: number; percent: number }>({
    time: 0,
    percent: initialWatchPercentage,
  });
  const maxPositionRef = useRef<number>(initialPositionSeconds);
  const completionFiredRef = useRef<boolean>(
    initialWatchPercentage >= requiredWatchPercentage,
  );

  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [position, setPosition] = useState(initialPositionSeconds);
  const [duration, setDuration] = useState(durationSeconds ?? 0);
  const [percent, setPercent] = useState(initialWatchPercentage);

  const unlocked = percent >= requiredWatchPercentage;

  const saveProgress = useCallback(
    (data: { positionSeconds: number; watchPercentage: number }) => {
      const body = JSON.stringify({
        practiceUserId,
        watchPercentage: data.watchPercentage,
        lastPositionSeconds: Math.floor(data.positionSeconds),
      });
      // sendBeacon for unload reliability; fall back to fetch
      if (typeof navigator !== "undefined" && navigator.sendBeacon) {
        const blob = new Blob([body], { type: "application/json" });
        navigator.sendBeacon(
          `/api/portal/training/modules/${moduleId}/progress`,
          blob,
        );
      } else {
        fetch(`/api/portal/training/modules/${moduleId}/progress`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
          keepalive: true,
        }).catch(() => {});
      }
      lastSavedRef.current = {
        time: data.positionSeconds,
        percent: data.watchPercentage,
      };
    },
    [moduleId, practiceUserId],
  );

  // Resume from last position once metadata loads
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onLoaded = () => {
      if (initialPositionSeconds > 0 && initialPositionSeconds < v.duration) {
        v.currentTime = initialPositionSeconds;
      }
      if (!duration && v.duration) setDuration(v.duration);
    };
    v.addEventListener("loadedmetadata", onLoaded);
    return () => v.removeEventListener("loadedmetadata", onLoaded);
  }, [initialPositionSeconds, duration]);

  // Time updates → max-seen + percent
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTime = () => {
      const t = v.currentTime;
      if (t > maxPositionRef.current) maxPositionRef.current = t;
      setPosition(t);
      const total = v.duration || duration || 1;
      const newPercent = Math.min(
        100,
        Math.max(percent, Math.round((maxPositionRef.current / total) * 100)),
      );
      if (newPercent !== percent) setPercent(newPercent);

      // Save every 10s
      if (
        Math.abs(t - lastSavedRef.current.time) >= 10 ||
        newPercent > lastSavedRef.current.percent
      ) {
        saveProgress({ positionSeconds: t, watchPercentage: newPercent });
      }

      // Fire completion event once
      if (
        !completionFiredRef.current &&
        newPercent >= requiredWatchPercentage
      ) {
        completionFiredRef.current = true;
        onWatchComplete();
      }
    };
    v.addEventListener("timeupdate", onTime);
    return () => v.removeEventListener("timeupdate", onTime);
  }, [
    percent,
    duration,
    requiredWatchPercentage,
    onWatchComplete,
    saveProgress,
  ]);

  // Save on pause, visibility change, unload
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const flush = () => {
      saveProgress({
        positionSeconds: v.currentTime,
        watchPercentage: percent,
      });
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flush();
    };
    v.addEventListener("pause", flush);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", flush);
    return () => {
      v.removeEventListener("pause", flush);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", flush);
    };
  }, [percent, saveProgress]);

  // Lock forward-seek past max-seen until unlocked
  useEffect(() => {
    const v = videoRef.current;
    if (!v || unlocked) return;
    const onSeeking = () => {
      if (v.currentTime > maxPositionRef.current + 1) {
        v.currentTime = maxPositionRef.current;
      }
    };
    v.addEventListener("seeking", onSeeking);
    return () => v.removeEventListener("seeking", onSeeking);
  }, [unlocked]);

  function togglePlay() {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play();
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  }

  function toggleMute() {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  }

  function seek(value: number) {
    const v = videoRef.current;
    if (!v) return;
    if (!unlocked && value > maxPositionRef.current + 1) {
      // Lock forward seek
      return;
    }
    v.currentTime = value;
  }

  function fullscreen() {
    const c = containerRef.current;
    if (!c) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      c.requestFullscreen?.();
    }
  }

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden rounded-md border border-ink-700/15 bg-black"
    >
      <video
        ref={videoRef}
        src={videoUrl}
        className="block w-full"
        playsInline
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
      />

      {/* Custom controls */}
      <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-gradient-to-t from-black/80 to-transparent px-3 py-2">
        <button
          type="button"
          onClick={togglePlay}
          aria-label={playing ? "Pause" : "Play"}
          className="rounded-sm p-1.5 text-cream-50 hover:text-brand-300"
        >
          {playing ? (
            <Pause className="size-4" strokeWidth={1.5} />
          ) : (
            <Play className="size-4" strokeWidth={1.5} />
          )}
        </button>

        <span
          className="font-body text-caption text-cream-50"
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {formatTime(position)}
        </span>

        <input
          type="range"
          min={0}
          max={duration || 100}
          step={0.5}
          value={position}
          onChange={(e) => seek(Number(e.target.value))}
          className={cn(
            "flex-1 accent-brand-300",
            !unlocked && "cursor-not-allowed",
          )}
          aria-label="Scrub"
        />

        <span
          className="font-body text-caption text-cream-50"
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {formatTime(duration)}
        </span>

        <button
          type="button"
          onClick={toggleMute}
          aria-label={muted ? "Unmute" : "Mute"}
          className="rounded-sm p-1.5 text-cream-50 hover:text-brand-300"
        >
          {muted ? (
            <VolumeX className="size-4" strokeWidth={1.5} />
          ) : (
            <Volume2 className="size-4" strokeWidth={1.5} />
          )}
        </button>

        <button
          type="button"
          onClick={fullscreen}
          aria-label="Fullscreen"
          className="rounded-sm p-1.5 text-cream-50 hover:text-brand-300"
        >
          <Maximize2 className="size-4" strokeWidth={1.5} />
        </button>
      </div>

      {/* Progress strip — shows watched portion + required threshold */}
      <div
        className="absolute inset-x-0 bottom-0 h-1 bg-cream-50/15"
        aria-hidden="true"
      >
        <div
          className="h-full bg-brand-500"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
