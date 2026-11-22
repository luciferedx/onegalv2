import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Camera,
  ChevronLeft,
  ChevronRight,
  Copy,
  Edit3,
  Heart,
  Info,
  Pause,
  Play,
  Share2,
  Trash2,
  Volume2,
  VolumeX,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import {
  formatDuration,
  formatFileSize,
  GalleryMediaItem,
} from '../utils/galleryLogic';

interface FullScreenMediaViewerProps {
  items: GalleryMediaItem[];
  initialIndex: number;
  autoPlayVideos: boolean;
  fullScreenScrolling: boolean;
  showFullExifLocation: boolean;
  onClose: () => void;
  onFavorite: (item: GalleryMediaItem) => void;
  onShare: (item: GalleryMediaItem) => void;
  onCopy: (item: GalleryMediaItem) => void;
  onRename: (item: GalleryMediaItem) => void;
  onDelete: (item: GalleryMediaItem) => void;
  onCaptureFrame: (dataUrl: string, sourceItem: GalleryMediaItem, timestampMs: number) => void;
}

const SPEED_OPTIONS = [0.5, 1.0, 1.5, 2.0] as const;

export const FullScreenMediaViewer: React.FC<FullScreenMediaViewerProps> = ({
  items,
  initialIndex,
  autoPlayVideos,
  fullScreenScrolling,
  showFullExifLocation,
  onClose,
  onFavorite,
  onShare,
  onCopy,
  onRename,
  onDelete,
  onCaptureFrame,
}) => {
  const [activeId, setActiveId] = useState<string>(
    () => items[Math.max(0, Math.min(initialIndex, items.length - 1))]?.id ?? ''
  );
  const index = Math.max(
    0,
    items.findIndex((item) => item.id === activeId)
  );
  const [showChrome, setShowChrome] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  // Photo zoom state (1x..10x)
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragDismissY, setDragDismissY] = useState(0);
  const pointerStartRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const lastTapRef = useRef<number>(0);

  // Media3-style Video Player state
  const [isPlaying, setIsPlaying] = useState(autoPlayVideos);
  const [isMuted, setIsMuted] = useState(false);
  const [speed, setSpeed] = useState<(typeof SPEED_OPTIONS)[number]>(1.0);
  const [currentMs, setCurrentMs] = useState(0);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubMs, setScrubMs] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const posterImageRef = useRef<HTMLImageElement | null>(null);

  const currentItem = items[index];

  const resetZoom = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setDragDismissY(0);
  }, []);

  const goPrev = useCallback(() => {
    if (index > 0) {
      resetZoom();
      setActiveId(items[index - 1].id);
      setCurrentMs(0);
      setIsPlaying(autoPlayVideos);
    }
  }, [index, items, resetZoom, autoPlayVideos]);

  const goNext = useCallback(() => {
    if (index < items.length - 1) {
      resetZoom();
      setActiveId(items[index + 1].id);
      setCurrentMs(0);
      setIsPlaying(autoPlayVideos);
    }
  }, [index, items, resetZoom, autoPlayVideos]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showDetails) setShowDetails(false);
        else onClose();
      } else if (e.key === 'ArrowLeft') {
        goPrev();
      } else if (e.key === 'ArrowRight') {
        goNext();
      } else if (e.key === 'ArrowUp') {
        setShowDetails(true);
      } else if (e.key === ' ' && currentItem?.type === 'video') {
        e.preventDefault();
        setIsPlaying((p) => !p);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [goPrev, goNext, onClose, showDetails, currentItem?.type]);

  useEffect(() => {
    if (!currentItem || currentItem.type !== 'video') return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = currentItem.src;
    img.onload = () => {
      posterImageRef.current = img;
    };
  }, [currentItem]);

  useEffect(() => {
    if (!currentItem || currentItem.type !== 'video') return;
    const duration = Math.max(currentItem.durationMs, 15_000);
    let rafId = 0;
    let lastTime = performance.now();

    const drawFrame = (timeMs: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w = canvas.width;
      const h = canvas.height;
      const progress = (timeMs % duration) / duration;
      const poster = posterImageRef.current;

      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, w, h);

      if (poster && poster.complete && poster.naturalWidth > 0) {
        const scale = 1.04 + Math.sin(progress * Math.PI * 2) * 0.035;
        const driftX = Math.cos(progress * Math.PI * 2) * 18;
        const driftY = Math.sin(progress * Math.PI * 2) * 10;
        const aspect = poster.naturalWidth / poster.naturalHeight;
        const targetW = w * scale;
        const targetH = targetW / aspect;
        const drawY = (h - targetH) / 2 + driftY;
        const drawX = (w - targetW) / 2 + driftX;
        ctx.drawImage(poster, drawX, drawY, targetW, targetH);

        const shimmer = ctx.createLinearGradient(0, 0, w, h);
        const alpha = 0.06 + Math.sin(progress * Math.PI * 4) * 0.03;
        shimmer.addColorStop(0, `rgba(255,255,255,${alpha.toFixed(3)})`);
        shimmer.addColorStop(1, 'rgba(0,0,0,0.12)');
        ctx.fillStyle = shimmer;
        ctx.fillRect(0, 0, w, h);
      } else {
        const [c1, c2, c3] = currentItem.videoPalette ?? ['#0B0B0E', '#1C1C1E', '#3A3A3D'];
        const grad = ctx.createLinearGradient(0, 0, w, h);
        grad.addColorStop(0, c1);
        grad.addColorStop(0.55, c2);
        grad.addColorStop(1, c3);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
      }

      ctx.fillStyle = 'rgba(0, 0, 0, 0.52)';
      ctx.fillRect(16, 16, 138, 24);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
      ctx.font = '600 12px "JetBrains Mono", monospace';
      ctx.fillText(`MEDIA3 · ${formatDuration(timeMs)}`, 24, 32);
    };

    const tick = (now: number) => {
      const dt = now - lastTime;
      lastTime = now;
      if (isPlaying && !isScrubbing) {
        setCurrentMs((prev) => {
          const next = (prev + dt * speed) % duration;
          drawFrame(next);
          return next;
        });
      } else {
        drawFrame(isScrubbing ? scrubMs : currentMs);
      }
      rafId = requestAnimationFrame(tick);
    };

    drawFrame(isScrubbing ? scrubMs : currentMs);
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [currentItem, isPlaying, isScrubbing, scrubMs, speed, currentMs]);

  if (!currentItem) return null;

  const durationMs = Math.max(currentItem.durationMs, 15_000);
  const displayMs = isScrubbing ? scrubMs : currentMs;
  const dismissProgress = Math.min(1, Math.abs(dragDismissY) / 220);

  const handleSurfaceClick = () => {
    const now = Date.now();
    if (currentItem.type === 'image' && now - lastTapRef.current < 280) {
      if (zoom > 1.05) {
        resetZoom();
      } else {
        setZoom(3);
      }
      lastTapRef.current = 0;
      return;
    }
    lastTapRef.current = now;
    setShowChrome((v) => !v);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    pointerStartRef.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!pointerStartRef.current) return;
    const dx = e.clientX - pointerStartRef.current.x;
    const dy = e.clientY - pointerStartRef.current.y;
    if (zoom > 1.05) {
      setPan({ x: pointerStartRef.current.panX + dx, y: pointerStartRef.current.panY + dy });
    } else if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 10) {
      setDragDismissY(dy);
    }
  };

  const handlePointerUp = () => {
    if (dragDismissY > 110) {
      onClose();
      return;
    }
    if (dragDismissY < -90) {
      setShowDetails(true);
    }
    setDragDismissY(0);
    pointerStartRef.current = null;
  };

  const handleCapturePng = () => {
    const canvas = canvasRef.current;
    let dataUrl = currentItem.src;
    if (canvas) {
      try {
        dataUrl = canvas.toDataURL('image/png');
      } catch {
        dataUrl = currentItem.src;
      }
    }
    onCaptureFrame(dataUrl, currentItem, displayMs);
  };

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(currentItem.dateTakenMs));

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Viewing ${currentItem.displayName}`}
      className="absolute inset-0 z-50 flex flex-col overflow-hidden select-none"
      style={{
        backgroundColor: `rgba(0, 0, 0, ${(1 - dismissProgress * 0.72).toFixed(2)})`,
      }}
    >
      {/* Floating Frosted Glass Top Toolbar */}
      <div
        className={`absolute top-3 left-3 right-3 z-20 transition-opacity duration-200 ${
          showChrome ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-[24px] bg-[#1C1C1E]/84 backdrop-blur-xl border border-white/[0.14] shadow-xl">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close full screen viewer"
            className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-full text-white hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-white truncate">{formattedDate}</p>
            <p className="text-[11px] text-[#A1A1AA] truncate font-mono">
              {currentItem.displayName}
            </p>
          </div>

          {currentItem.type === 'image' && (
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(1, Number((z - 1).toFixed(1))))}
                aria-label="Zoom out"
                disabled={zoom <= 1}
                className="min-w-[34px] min-h-[34px] flex items-center justify-center rounded-full text-white/90 hover:bg-white/10 disabled:opacity-35 transition-colors"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-[11px] font-mono tabular-nums text-white/85 w-8 text-center">
                {zoom.toFixed(1)}x
              </span>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(10, Number((z + 1).toFixed(1))))}
                aria-label="Zoom in"
                disabled={zoom >= 10}
                className="min-w-[34px] min-h-[34px] flex items-center justify-center rounded-full text-white/90 hover:bg-white/10 disabled:opacity-35 transition-colors"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowDetails(true)}
            aria-label="Show media details and EXIF"
            className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-full text-white hover:bg-white/10 transition-colors"
          >
            <Info className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Media Viewport */}
      <div
        className={`relative flex-1 flex items-center justify-center overflow-hidden touch-none ${
          fullScreenScrolling ? 'p-0' : 'py-16 px-2'
        }`}
        onClick={handleSurfaceClick}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{
          transform: `translate3d(0, ${dragDismissY}px, 0) scale(${(1 - dismissProgress * 0.22).toFixed(3)})`,
          transition: pointerStartRef.current
            ? 'none'
            : 'transform 220ms cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        {currentItem.type === 'video' ? (
          <canvas
            ref={canvasRef}
            width={720}
            height={480}
            data-testid="media3-video-canvas"
            className="max-w-full max-h-full w-full h-auto object-contain rounded-lg"
          />
        ) : (
          <img
            src={currentItem.src}
            alt={currentItem.displayName}
            referrerPolicy="no-referrer"
            draggable={false}
            className="max-w-full max-h-full object-contain select-none"
            style={{
              transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
              transition: pointerStartRef.current
                ? 'none'
                : 'transform 220ms cubic-bezier(0.22, 1, 0.36, 1)',
            }}
          />
        )}

        {showChrome && index > 0 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goPrev();
            }}
            aria-label="Previous item"
            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[#1C1C1E]/80 backdrop-blur-md border border-white/[0.14] text-white flex items-center justify-center hover:bg-[#2C2C2E] transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        {showChrome && index < items.length - 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goNext();
            }}
            aria-label="Next item"
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[#1C1C1E]/80 backdrop-blur-md border border-white/[0.14] text-white flex items-center justify-center hover:bg-[#2C2C2E] transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Bottom Floating Glassmorphic Controls */}
      <div
        className={`absolute bottom-3 left-3 right-3 z-20 transition-opacity duration-200 ${
          showChrome ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {currentItem.type === 'video' ? (
          <div className="rounded-[26px] bg-[#1C1C1E]/86 backdrop-blur-xl border border-white/[0.14] px-3.5 py-3 shadow-2xl space-y-2.5">
            {isScrubbing && (
              <div className="flex justify-center">
                <span className="px-3 py-1 rounded-full bg-white text-black text-xs font-mono font-semibold tabular-nums">
                  {formatDuration(scrubMs)} / {formatDuration(durationMs)}
                </span>
              </div>
            )}

            <div className="space-y-1">
              <input
                type="range"
                aria-label="Video timeline scrubber"
                min={0}
                max={durationMs}
                value={Math.round(displayMs)}
                onPointerDown={() => setIsScrubbing(true)}
                onPointerUp={() => {
                  setCurrentMs(scrubMs);
                  setIsScrubbing(false);
                }}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setScrubMs(val);
                  setCurrentMs(val);
                }}
                className="w-full accent-white h-1.5 bg-white/25 rounded-lg cursor-pointer"
              />
              <div className="flex items-center justify-between text-[11px] font-mono tabular-nums text-[#A1A1AA]">
                <span className="text-white">{formatDuration(displayMs)}</span>
                <span>{formatDuration(durationMs)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-1.5">
              <div className="flex items-center gap-0.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsPlaying((p) => !p)}
                  aria-label={isPlaying ? 'Pause video' : 'Play video'}
                  className="min-w-[38px] min-h-[38px] flex items-center justify-center rounded-full text-white hover:bg-white/10 transition-colors"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </button>
                <button
                  type="button"
                  onClick={() => setIsMuted((m) => !m)}
                  aria-label={isMuted ? 'Unmute video' : 'Mute video'}
                  className="min-w-[38px] min-h-[38px] flex items-center justify-center rounded-full text-white hover:bg-white/10 transition-colors"
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>

              <div
                className="flex items-center gap-0.5 bg-white/10 rounded-xl p-0.5 shrink-0"
                role="group"
                aria-label="Playback speed"
              >
                {SPEED_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setSpeed(opt)}
                    className={`px-1.5 py-1 text-[11px] font-mono tabular-nums rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                      speed === opt
                        ? 'bg-white text-black font-semibold'
                        : 'text-[#A1A1AA] hover:text-white'
                    }`}
                  >
                    {opt}x
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleCapturePng}
                aria-label="Capture current video frame as PNG"
                className="flex items-center gap-1 px-2.5 py-2 rounded-xl bg-white hover:bg-[#E5E5EA] text-black text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Capture</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-[28px] bg-[#1C1C1E]/86 backdrop-blur-xl border border-white/[0.14] px-2 py-2 shadow-2xl flex items-center justify-around">
            <button
              type="button"
              onClick={() => onFavorite(currentItem)}
              aria-label={currentItem.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              className="flex flex-col items-center gap-1 min-w-[48px] py-1 text-white hover:opacity-80 transition-opacity"
            >
              <Heart
                className={`w-5 h-5 ${currentItem.isFavorite ? 'fill-white text-white' : ''}`}
              />
              <span className="text-[10px] text-[#A1A1AA]">Favorite</span>
            </button>

            <button
              type="button"
              onClick={() => onShare(currentItem)}
              aria-label="Share item"
              className="flex flex-col items-center gap-1 min-w-[48px] py-1 text-white hover:opacity-80 transition-opacity"
            >
              <Share2 className="w-5 h-5" />
              <span className="text-[10px] text-[#A1A1AA]">Share</span>
            </button>

            <button
              type="button"
              onClick={() => onCopy(currentItem)}
              aria-label="Copy to album or external drive"
              className="flex flex-col items-center gap-1 min-w-[48px] py-1 text-white hover:opacity-80 transition-opacity"
            >
              <Copy className="w-5 h-5" />
              <span className="text-[10px] text-[#A1A1AA]">Copy</span>
            </button>

            <button
              type="button"
              onClick={() => onRename(currentItem)}
              aria-label="Rename item"
              className="flex flex-col items-center gap-1 min-w-[48px] py-1 text-white hover:opacity-80 transition-opacity"
            >
              <Edit3 className="w-5 h-5" />
              <span className="text-[10px] text-[#A1A1AA]">Rename</span>
            </button>

            <button
              type="button"
              onClick={() => onDelete(currentItem)}
              aria-label="Delete item"
              className="flex flex-col items-center gap-1 min-w-[48px] py-1 text-white hover:text-[#FF453A] transition-colors"
            >
              <Trash2 className="w-5 h-5" />
              <span className="text-[10px] text-[#A1A1AA]">Delete</span>
            </button>
          </div>
        )}
      </div>

      {/* One UI Swipe-Up Details & EXIF Bottom Sheet */}
      {showDetails && (
        <div
          className="absolute inset-0 z-30 bg-black/55 backdrop-blur-xs flex items-end"
          onClick={() => setShowDetails(false)}
        >
          <div
            role="region"
            aria-label="Media EXIF and storage details"
            className="w-full max-h-[80%] overflow-y-auto onegal-scroll rounded-t-[26px] bg-[#161618] border-t border-white/[0.14] p-5 text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full bg-white/25 mx-auto mb-4" />
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Details</h3>
              <button
                type="button"
                onClick={() => setShowDetails(false)}
                aria-label="Close details sheet"
                className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs text-[#8E8E93]">File name</dt>
                <dd className="font-mono text-[13px] break-all mt-0.5">{currentItem.displayName}</dd>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <dt className="text-xs text-[#8E8E93]">Date &amp; time</dt>
                  <dd className="mt-0.5">{formattedDate}</dd>
                </div>
                <div>
                  <dt className="text-xs text-[#8E8E93]">File size</dt>
                  <dd className="mt-0.5 tabular-nums">{formatFileSize(currentItem.sizeBytes)}</dd>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <dt className="text-xs text-[#8E8E93]">Resolution</dt>
                  <dd className="mt-0.5 tabular-nums">
                    {currentItem.width} × {currentItem.height} px
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-[#8E8E93]">Format</dt>
                  <dd className="mt-0.5 font-mono text-xs">{currentItem.mimeType}</dd>
                </div>
              </div>
              <div>
                <dt className="text-xs text-[#8E8E93]">Storage path</dt>
                <dd className="mt-0.5 font-mono text-xs text-white/90 break-all">
                  {currentItem.storagePath}
                  {currentItem.displayName}
                </dd>
              </div>

              {showFullExifLocation && currentItem.exif ? (
                <div className="pt-3 mt-3 border-t border-white/[0.1] space-y-2.5">
                  <p className="text-xs font-semibold text-[#8E8E93]">Camera EXIF &amp; Location</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <dt className="text-xs text-[#8E8E93]">Device</dt>
                      <dd className="mt-0.5">{currentItem.exif.cameraModel}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-[#8E8E93]">Lens</dt>
                      <dd className="mt-0.5">{currentItem.exif.lens}</dd>
                    </div>
                  </div>
                  <div>
                    <dt className="text-xs text-[#8E8E93]">Exposure</dt>
                    <dd className="mt-0.5 font-mono text-xs tabular-nums">
                      {currentItem.exif.aperture} · {currentItem.exif.shutter} ·{' '}
                      {currentItem.exif.focalLength} · {currentItem.exif.iso}
                    </dd>
                  </div>
                  {currentItem.exif.gps && (
                    <div>
                      <dt className="text-xs text-[#8E8E93]">GPS coordinates</dt>
                      <dd className="mt-0.5 font-mono text-xs tabular-nums">
                        {currentItem.exif.gps}
                      </dd>
                    </div>
                  )}
                </div>
              ) : (
                !showFullExifLocation && (
                  <div className="pt-3 mt-3 border-t border-white/[0.1]">
                    <p className="text-xs text-[#8E8E93]">
                      Full EXIF &amp; GPS location hidden (configurable in Gallery settings)
                    </p>
                  </div>
                )
              )}
            </dl>
          </div>
        </div>
      )}
    </div>
  );
};
