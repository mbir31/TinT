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
  Move
} from 'lucide-react';

interface ImageCropperModalProps {
  imageSrc: string;
  onCropComplete: (croppedDataUrl: string) => void;
  onClose: () => void;
  language: Language;
  onNewImageSelected?: (newSrc: string) => void;
}

export const ImageCropperModal: React.FC<ImageCropperModalProps> = ({
  imageSrc,
  onCropComplete,
  onClose,
  language,
  onNewImageSelected
}) => {
  const t = TRANSLATIONS[language];
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [imageObj, setImageObj] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Load image object whenever imageSrc changes
  useEffect(() => {
    if (!imageSrc) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImageObj(img);
      setZoom(1);
      setRotation(0);
      setPosition({ x: 0, y: 0 });
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Handle Drag / Pan Events
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    e.preventDefault();
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
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

  // Perform Final Crop on High-Resolution Canvas
  const handleConfirmCrop = useCallback(() => {
    if (!imageObj) return;
    setIsProcessing(true);
    soundEngine.playTap();
    hapticsEngine.trigger('medium');

    try {
      const outputSize = 320; // High resolution square for tokens and badges
      const canvas = document.createElement('canvas');
      canvas.width = outputSize;
      canvas.height = outputSize;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        setIsProcessing(false);
        return;
      }

      // Fill with smooth background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, outputSize, outputSize);

      ctx.save();
      // Move to center of canvas
      ctx.translate(outputSize / 2, outputSize / 2);
      ctx.rotate((rotation * Math.PI) / 180);

      // Sizing ratio relative to crop window
      // Crop container display box is 240px wide
      const displaySize = 240;
      const scaleFactor = outputSize / displaySize;

      const scaledZoom = zoom * scaleFactor;
      const scaledX = position.x * scaleFactor;
      const scaledY = position.y * scaleFactor;

      // Draw image centered with offsets
      const imgAspect = imageObj.width / imageObj.height;
      let drawW: number;
      let drawH: number;

      if (imgAspect >= 1) {
        drawH = outputSize * scaledZoom;
        drawW = drawH * imgAspect;
      } else {
        drawW = outputSize * scaledZoom;
        drawH = drawW / imgAspect;
      }

      // If rotated 90 or 270, adjust coordinates
      if (rotation === 90) {
        ctx.drawImage(imageObj, -drawW / 2 + scaledY, -drawH / 2 - scaledX, drawW, drawH);
      } else if (rotation === 180) {
        ctx.drawImage(imageObj, -drawW / 2 - scaledX, -drawH / 2 - scaledY, drawW, drawH);
      } else if (rotation === 270) {
        ctx.drawImage(imageObj, -drawW / 2 - scaledY, -drawH / 2 + scaledX, drawW, drawH);
      } else {
        ctx.drawImage(imageObj, -drawW / 2 + scaledX, -drawH / 2 + scaledY, drawW, drawH);
      }

      ctx.restore();

      // Export as optimized WebP or JPEG
      const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.92);
      onCropComplete(croppedDataUrl);
    } catch (err) {
      console.error('Failed to crop image:', err);
    } finally {
      setIsProcessing(false);
    }
  }, [imageObj, rotation, zoom, position, onCropComplete]);

  // File replacement handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result && onNewImageSelected) {
        onNewImageSelected(result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Drag & drop new file support
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-[#073B4C]/70 backdrop-blur-md select-none animate-in fade-in duration-200"
      onPointerUp={handlePointerUp}
    >
      <div
        className="relative w-full max-w-md bg-white rounded-2xl sm:rounded-[32px] border-3 sm:border-4 border-[#073B4C] shadow-[6px_6px_0px_0px_#073B4C] sm:shadow-[10px_10px_0px_0px_#073B4C] flex flex-col max-h-[94vh] overflow-hidden"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        {/* Modal Top Header */}
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
          {/* Visual Crop Box Container */}
          <div
            ref={containerRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onWheel={handleWheel}
            className="relative w-[220px] h-[220px] sm:w-[240px] sm:h-[240px] rounded-2xl sm:rounded-[28px] border-3 sm:border-4 border-[#073B4C] bg-slate-900 overflow-hidden shadow-[4px_4px_0px_0px_#073B4C] cursor-grab active:cursor-grabbing touch-none flex items-center justify-center"
          >
            {/* Movable and Scalable Image Layer */}
            {imageObj && (
              <div
                style={{
                  transform: `translate(${position.x}px, ${position.y}px) rotate(${rotation}deg) scale(${zoom})`,
                  transformOrigin: 'center center',
                  transition: isDragging ? 'none' : 'transform 0.05s ease-out'
                }}
                className="pointer-events-none select-none flex items-center justify-center"
              >
                <img
                  src={imageSrc}
                  alt="Crop preview"
                  draggable={false}
                  className="max-w-none w-56 h-56 object-contain pointer-events-none"
                />
              </div>
            )}

            {/* Grid & Token Mask Overlay */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              {/* Rounded Square Mask Guide */}
              <div className="w-[190px] h-[190px] sm:w-[210px] sm:h-[210px] rounded-2xl sm:rounded-[24px] border-2 border-white/80 shadow-[0_0_0_9999px_rgba(7,59,76,0.55)] flex flex-col justify-between p-2">
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
              <span className="text-[11px] font-black text-[#073B4C] min-w-8 text-right">
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

        {/* Modal Sticky Footer Action */}
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
