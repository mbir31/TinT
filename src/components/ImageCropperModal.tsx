/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Language } from '../types';
import { TRANSLATIONS } from '../i18n/translations';
import { soundEngine } from '../engine/soundEngine';
import { hapticsEngine } from '../engine/hapticsEngine';
import {
  X,
  Check,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Crop as CropIcon,
  UploadCloud,
  Move,
  RotateCcw
} from 'lucide-react';

interface ImageCropperModalProps {
  imageSrc: string;
  onCropComplete: (croppedDataUrl: string) => void;
  onClose: () => void;
  language: Language;
  onNewImageSelected?: (newSrc: string) => void;
}

const VIEWPORT_SIZE = 240; // Exact preview box dimension in pixels
const OUTPUT_SIZE = 360;   // High-res output square in pixels

export const ImageCropperModal: React.FC<ImageCropperModalProps> = ({
  imageSrc,
  onCropComplete,
  onClose,
  language,
  onNewImageSelected
}) => {
  const t = TRANSLATIONS[language];
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [imageObj, setImageObj] = useState<HTMLImageElement | null>(null);
  const [baseDimensions, setBaseDimensions] = useState<{ w: number; h: number }>({
    w: VIEWPORT_SIZE,
    h: VIEWPORT_SIZE
  });

  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Multi-touch & pointer tracking
  const activePointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const pinchStartDistRef = useRef<number | null>(null);
  const zoomAtPinchStartRef = useRef<number>(1);

  // Load image object and compute natural aspect-ratio base fitting
  useEffect(() => {
    if (!imageSrc) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImageObj(img);
      const naturalW = img.naturalWidth || img.width || VIEWPORT_SIZE;
      const naturalH = img.naturalHeight || img.height || VIEWPORT_SIZE;
      const aspect = naturalW / naturalH;

      let w = VIEWPORT_SIZE;
      let h = VIEWPORT_SIZE;

      // Fit the image naturally inside the viewport so it covers the square cleanly
      if (aspect >= 1) {
        h = VIEWPORT_SIZE;
        w = VIEWPORT_SIZE * aspect;
      } else {
        w = VIEWPORT_SIZE;
        h = VIEWPORT_SIZE / aspect;
      }

      setBaseDimensions({ w, h });
      setZoom(1);
      setRotation(0);
      setPosition({ x: 0, y: 0 });
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Pointer Down (Mouse & Touch)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}

    activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (activePointersRef.current.size === 1) {
      setIsDragging(true);
      dragStartRef.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y
      };
    } else if (activePointersRef.current.size === 2) {
      // Initialize pinch to zoom
      const pts = Array.from(activePointersRef.current.values()) as Array<{ x: number; y: number }>;
      if (pts.length >= 2) {
        const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        pinchStartDistRef.current = dist;
        zoomAtPinchStartRef.current = zoom;
      }
    }
  };

  // Pointer Move (Pan & Pinch)
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!activePointersRef.current.has(e.pointerId)) return;
    e.preventDefault();
    activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (activePointersRef.current.size === 1 && isDragging) {
      setPosition({
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y
      });
    } else if (activePointersRef.current.size === 2 && pinchStartDistRef.current) {
      const pts = Array.from(activePointersRef.current.values()) as Array<{ x: number; y: number }>;
      if (pts.length >= 2) {
        const currentDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        const ratio = currentDist / pinchStartDistRef.current;
        const newZoom = Math.min(3.5, Math.max(0.6, zoomAtPinchStartRef.current * ratio));
        setZoom(newZoom);
      }
    }
  };

  // Pointer Up & Cancel
  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
    activePointersRef.current.delete(e.pointerId);

    if (activePointersRef.current.size === 0) {
      setIsDragging(false);
      pinchStartDistRef.current = null;
    } else if (activePointersRef.current.size === 1) {
      const pts = Array.from(activePointersRef.current.values()) as Array<{ x: number; y: number }>;
      const remainingPt = pts[0];
      if (remainingPt) {
        dragStartRef.current = {
          x: remainingPt.x - position.x,
          y: remainingPt.y - position.y
        };
      }
      pinchStartDistRef.current = null;
    }
  };

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const delta = e.deltaY * -0.002;
    setZoom((prev) => Math.min(3.5, Math.max(0.6, prev + delta)));
  };

  // Rotate 90 degrees clockwise
  const handleRotate = () => {
    soundEngine.playTap();
    hapticsEngine.trigger('tap');
    setRotation((r) => (r + 90) % 360);
  };

  // Reset position & zoom
  const handleReset = () => {
    soundEngine.playTap();
    hapticsEngine.trigger('tap');
    setPosition({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
  };

  // Perform Final Crop with mathematically congruent Canvas transform
  const handleConfirmCrop = useCallback(() => {
    if (!imageObj) return;
    setIsProcessing(true);
    soundEngine.playTap();
    hapticsEngine.trigger('medium');

    try {
      const scaleFactor = OUTPUT_SIZE / VIEWPORT_SIZE;
      const canvas = document.createElement('canvas');
      canvas.width = OUTPUT_SIZE;
      canvas.height = OUTPUT_SIZE;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        setIsProcessing(false);
        return;
      }

      // Smooth white background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

      ctx.save();

      // 1. Move to canvas center + scaled screen position (exact match to CSS transform)
      ctx.translate(
        OUTPUT_SIZE / 2 + position.x * scaleFactor,
        OUTPUT_SIZE / 2 + position.y * scaleFactor
      );

      // 2. Rotate around translated center
      ctx.rotate((rotation * Math.PI) / 180);

      // 3. Scale by zoom factor
      ctx.scale(zoom * scaleFactor, zoom * scaleFactor);

      // 4. Draw image with exact base dimensions centered at (0, 0)
      ctx.drawImage(
        imageObj,
        -baseDimensions.w / 2,
        -baseDimensions.h / 2,
        baseDimensions.w,
        baseDimensions.h
      );

      ctx.restore();

      // Export as high quality JPEG
      const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.92);
      onCropComplete(croppedDataUrl);
    } catch (err) {
      console.error('Failed to crop image:', err);
    } finally {
      setIsProcessing(false);
    }
  }, [imageObj, baseDimensions, rotation, zoom, position, onCropComplete]);

  // File replacement handler with safe MIME & size checks
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validMimeTypes.includes(file.type) || file.size > 5 * 1024 * 1024) {
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result && onNewImageSelected) {
        onNewImageSelected(result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Drag & drop new file support with safe MIME & size checks
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    const validMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (file && validMimeTypes.includes(file.type) && file.size <= 5 * 1024 * 1024) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result && onNewImageSelected) {
          onNewImageSelected(result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-[#073B4C]/70 backdrop-blur-md select-none animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-white rounded-2xl sm:rounded-[32px] border-3 sm:border-4 border-[#073B4C] shadow-[6px_6px_0px_0px_#073B4C] sm:shadow-[10px_10px_0px_0px_#073B4C] flex flex-col max-h-[94vh] overflow-hidden"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-3.5 sm:p-4 border-b-2 sm:border-b-3 border-[#073B4C] bg-[#FFF9F0] flex-shrink-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-[#EF476F] border-2 border-[#073B4C] shadow-[2px_2px_0px_0px_#073B4C] flex items-center justify-center text-white flex-shrink-0">
              <CropIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-lg font-black text-[#073B4C] leading-none">
                {t.cropPhotoTitle}
              </h2>
              <span className="text-[10px] sm:text-xs font-bold text-[#4A4E69]">
                {t.cropInstruction}
              </span>
            </div>
          </div>
          <button
            id="btn-close-cropper"
            onClick={() => {
              soundEngine.playTap();
              onClose();
            }}
            className="p-1.5 sm:p-2 rounded-xl sm:rounded-2xl bg-white border-2 border-[#073B4C] text-[#073B4C] shadow-[2px_2px_0px_0px_#EF476F] active:translate-x-0.5 active:translate-y-0.5 transition-all"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Cropping Canvas Viewport */}
        <div className="p-3 sm:p-4 flex flex-col items-center gap-3 bg-[#FFFDF9] overflow-y-auto">
          {/* Visual Crop Box Container (Exactly 240px by 240px) */}
          <div
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onWheel={handleWheel}
            style={{ width: `${VIEWPORT_SIZE}px`, height: `${VIEWPORT_SIZE}px` }}
            className="relative rounded-2xl sm:rounded-[28px] border-3 sm:border-4 border-[#073B4C] bg-slate-900 overflow-hidden shadow-[4px_4px_0px_0px_#073B4C] cursor-grab active:cursor-grabbing touch-none flex items-center justify-center select-none"
          >
            {/* Movable & Scalable Image Layer */}
            {imageObj && (
              <div
                style={{
                  width: `${baseDimensions.w}px`,
                  height: `${baseDimensions.h}px`,
                  transform: `translate(${position.x}px, ${position.y}px) rotate(${rotation}deg) scale(${zoom})`,
                  transformOrigin: 'center center',
                  transition: isDragging ? 'none' : 'transform 0.05s ease-out'
                }}
                className="flex-shrink-0 flex items-center justify-center pointer-events-none select-none relative"
              >
                <img
                  src={imageSrc}
                  alt="Crop preview"
                  draggable={false}
                  style={{
                    width: `${baseDimensions.w}px`,
                    height: `${baseDimensions.h}px`
                  }}
                  className="max-w-none max-h-none block object-contain pointer-events-none select-none"
                />
              </div>
            )}

            {/* Precision Grid & Token Mask Overlay */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              {/* Center crosshair & grid overlay */}
              <div className="w-[200px] h-[200px] rounded-2xl border-2 border-white/80 shadow-[0_0_0_9999px_rgba(7,59,76,0.55)] flex flex-col justify-between p-2">
                <div className="w-full flex justify-between">
                  <span className="w-3 h-3 border-t-2 border-l-2 border-white" />
                  <span className="w-3 h-3 border-t-2 border-r-2 border-white" />
                </div>
                {/* Center crosshair */}
                <div className="self-center flex items-center justify-center opacity-40">
                  <Move className="w-6 h-6 text-white" />
                </div>
                <div className="w-full flex justify-between">
                  <span className="w-3 h-3 border-b-2 border-l-2 border-white" />
                  <span className="w-3 h-3 border-b-2 border-r-2 border-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Controls Bar: Zoom Slider & Rotate */}
          <div className="w-full flex flex-col gap-2.5 px-2">
            {/* Zoom Slider */}
            <div className="flex items-center gap-2 bg-[#FFF9F0] px-3 py-2 rounded-xl border-2 border-[#073B4C] shadow-[2px_2px_0px_0px_#073B4C]">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(0.6, z - 0.15))}
                className="p-1 rounded-lg text-[#073B4C] hover:bg-amber-200 transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <input
                id="cropper-zoom-range"
                type="range"
                min="0.6"
                max="3.0"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="flex-1 accent-[#118AB2] cursor-pointer"
              />
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(3.0, z + 0.15))}
                className="p-1 rounded-lg text-[#073B4C] hover:bg-amber-200 transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <span className="text-[11px] font-black text-[#073B4C] min-w-8 text-right font-mono">
                {Math.round(zoom * 100)}%
              </span>
            </div>

            {/* Quick Action Buttons: Rotate & Choose Other Photo */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                id="btn-rotate-photo"
                onClick={handleRotate}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white border-2 border-[#073B4C] text-[#073B4C] text-xs font-black shadow-[2px_2px_0px_0px_#073B4C] hover:bg-amber-50 active:translate-x-0.5 active:translate-y-0.5 transition-all"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>{t.rotatePhoto}</span>
              </button>

              <button
                type="button"
                id="btn-reset-crop"
                onClick={handleReset}
                className="px-3 py-2 rounded-xl bg-white border-2 border-[#073B4C] text-[#073B4C] text-xs font-black shadow-[2px_2px_0px_0px_#073B4C] hover:bg-amber-50 active:translate-x-0.5 active:translate-y-0.5 transition-all"
                title="Reset Position"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#EF476F]" />
              </button>

              <button
                type="button"
                id="btn-pick-another-photo"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[#FFF9F0] border-2 border-[#073B4C] text-[#073B4C] text-xs font-black shadow-[2px_2px_0px_0px_#073B4C] hover:bg-amber-100 active:translate-x-0.5 active:translate-y-0.5 transition-all"
              >
                <UploadCloud className="w-3.5 h-3.5 text-[#118AB2]" />
                <span>{t.changePhoto}</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-3 sm:p-4 border-t-2 sm:border-t-3 border-[#073B4C] bg-[#FFF9F0] flex gap-2 flex-shrink-0">
          <button
            type="button"
            id="btn-cancel-crop"
            onClick={onClose}
            className="flex-1 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-white border-2 border-[#073B4C] text-[#073B4C] font-black text-xs sm:text-sm shadow-[2px_2px_0px_0px_#073B4C] hover:bg-slate-50 active:translate-x-0.5 active:translate-y-0.5 transition-all"
          >
            {t.cancel}
          </button>

          <button
            type="button"
            id="btn-apply-crop"
            disabled={isProcessing}
            onClick={handleConfirmCrop}
            className="flex-[2] py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-[#06D6A0] border-2 sm:border-3 border-[#073B4C] text-[#073B4C] font-black text-xs sm:text-sm shadow-[3px_3px_0px_0px_#073B4C] hover:bg-[#05c493] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>{isProcessing ? '...' : t.applyCrop}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
