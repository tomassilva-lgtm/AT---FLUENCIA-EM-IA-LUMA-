/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ColorGradeSettings,
  CompareMode,
  ColorPreset,
  MediaType,
  VideoPlaybackState,
  SampleMedia,
} from './types';
import { defaultGrade, applyColorGrade, presets } from './color-engine';
import { sampleFrames, sampleVideos, generateCalibrationFrame } from './data/samples';
import { TopBar } from './components/TopBar';
import { ImageViewer } from './components/ImageViewer';
import { ScopeViewer } from './components/ScopeViewer';
import { ControlPanel } from './components/ControlPanel';
import { ColorWheelsPanel } from './components/ColorWheelsPanel';
import { PresetPanel } from './components/PresetPanel';
import { LookManager } from './components/LookManager';
import { GeminiAiPanel } from './components/GeminiAiPanel';
import { SampleMediaModal } from './components/SampleMediaModal';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { MobileActionArea } from './components/MobileActionArea';
import {
  Palette,
  Sliders,
  Clapperboard,
  Bookmark,
  Sparkles,
  RotateCcw,
  Undo2,
  Redo2,
} from 'lucide-react';

export default function App() {
  // Color Grade Settings State
  const [colorSettings, setColorSettings] = useState<ColorGradeSettings>(defaultGrade);
  const colorSettingsRef = useRef<ColorGradeSettings>(defaultGrade);
  colorSettingsRef.current = colorSettings;

  // Undo & Redo History State
  const [undoStack, setUndoStack] = useState<ColorGradeSettings[]>([]);
  const [redoStack, setRedoStack] = useState<ColorGradeSettings[]>([]);
  const lastCommittedSettingsRef = useRef<ColorGradeSettings>(defaultGrade);
  const isInteractingRef = useRef<boolean>(false);
  const interactionDebounceRef = useRef<number | null>(null);

  // Helper to deep clone settings object
  const cloneSettings = (s: ColorGradeSettings): ColorGradeSettings => ({
    ...s,
    shadowsColor: { ...s.shadowsColor },
    midtonesColor: { ...s.midtonesColor },
    highlightsColor: { ...s.highlightsColor },
  });

  // Continuous updater for sliders & wheels:
  // Snapshot pre-drag state once onto undoStack when interaction begins
  const handleContinuousColorChange = useCallback((newSettings: ColorGradeSettings) => {
    if (!isInteractingRef.current) {
      isInteractingRef.current = true;
      setUndoStack((prev) => [...prev.slice(-30), cloneSettings(lastCommittedSettingsRef.current)]);
      setRedoStack([]);
    }

    setColorSettings(newSettings);

    if (interactionDebounceRef.current) {
      clearTimeout(interactionDebounceRef.current);
    }
    interactionDebounceRef.current = window.setTimeout(() => {
      isInteractingRef.current = false;
      lastCommittedSettingsRef.current = cloneSettings(colorSettingsRef.current);
    }, 450);
  }, []);

  // Discrete action updater (presets, reset all, looks, AI grades):
  // Immediately pushes current state onto undoStack and applies new settings
  const handleDiscreteColorChange = useCallback((newSettings: ColorGradeSettings) => {
    if (interactionDebounceRef.current) {
      clearTimeout(interactionDebounceRef.current);
    }
    isInteractingRef.current = false;

    const sanitized: ColorGradeSettings = {
      ...defaultGrade,
      ...newSettings,
      shadowsColor: { ...defaultGrade.shadowsColor, ...(newSettings.shadowsColor || {}) },
      midtonesColor: { ...defaultGrade.midtonesColor, ...(newSettings.midtonesColor || {}) },
      highlightsColor: { ...defaultGrade.highlightsColor, ...(newSettings.highlightsColor || {}) },
    };

    setUndoStack((prev) => [...prev.slice(-30), cloneSettings(colorSettingsRef.current)]);
    setRedoStack([]);
    setColorSettings(sanitized);
    lastCommittedSettingsRef.current = cloneSettings(sanitized);
  }, []);

  // Undo last action handler
  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;

    if (interactionDebounceRef.current) {
      clearTimeout(interactionDebounceRef.current);
    }
    isInteractingRef.current = false;

    const previousState = undoStack[undoStack.length - 1];
    const newUndo = undoStack.slice(0, -1);

    setRedoStack((prev) => [...prev.slice(-30), cloneSettings(colorSettingsRef.current)]);
    setUndoStack(newUndo);
    setColorSettings(previousState);
    lastCommittedSettingsRef.current = cloneSettings(previousState);
  }, [undoStack]);

  // Redo handler
  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;

    if (interactionDebounceRef.current) {
      clearTimeout(interactionDebounceRef.current);
    }
    isInteractingRef.current = false;

    const nextState = redoStack[redoStack.length - 1];
    const newRedo = redoStack.slice(0, -1);

    setUndoStack((prev) => [...prev.slice(-30), cloneSettings(colorSettingsRef.current)]);
    setRedoStack(newRedo);
    setColorSettings(nextState);
    lastCommittedSettingsRef.current = cloneSettings(nextState);
  }, [redoStack]);

  // Keyboard shortcut listener: Ctrl+Z / Cmd+Z (Undo), Ctrl+Shift+Z / Cmd+Shift+Z / Ctrl+Y (Redo), ? (Shortcuts)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      } else if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setIsShortcutsModalOpen((prev) => !prev);
      } else if (!e.ctrlKey && !e.metaKey && !e.altKey && e.key.toLowerCase() === 's') {
        // Toggle split vertical compare
        e.preventDefault();
        setCompareMode((prev) => (prev === 'split-vertical' ? 'single' : 'split-vertical'));
      } else if (!e.ctrlKey && !e.metaKey && !e.altKey && e.key.toLowerCase() === 'b') {
        // Toggle side-by-side compare
        e.preventDefault();
        setCompareMode((prev) => (prev === 'side-by-side' ? 'single' : 'side-by-side'));
      } else if (!e.ctrlKey && !e.metaKey && !e.altKey && e.key.toLowerCase() === 'w') {
        // Toggle Scopes expand / minimize
        e.preventDefault();
        setIsScopesExpanded((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  // Media Source Type & Frame States
  const [mediaType, setMediaType] = useState<MediaType>('image');
  const [originalImageData, setOriginalImageData] = useState<ImageData | null>(null);
  const [gradedImageData, setGradedImageData] = useState<ImageData | null>(null);
  const [imageFileName, setImageFileName] = useState<string>('cinematic-portrait-35mm.jpg');
  const [currentSampleUrl, setCurrentSampleUrl] = useState<string>(sampleFrames[0].url);

  // Video Playback State
  const [videoPlaybackState, setVideoPlaybackState] = useState<VideoPlaybackState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    playbackRate: 1,
    isLooping: true,
    isMuted: true,
    volume: 1,
    quality: '720p',
  });

  // Viewer & Navigation States
  const [compareMode, setCompareMode] = useState<CompareMode>('single');
  const [sidebarTab, setSidebarTab] = useState<'wheels' | 'controls' | 'presets' | 'looks' | 'ai'>('wheels');
  const [isSampleModalOpen, setIsSampleModalOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [isScopesExpanded, setIsScopesExpanded] = useState(false);

  // References
  const processingRef = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const rawDataBufferRef = useRef<ImageData | null>(null);
  const gradedDataBufferRef = useRef<ImageData | null>(null);
  const isFrameBusyRef = useRef<boolean>(false);

  // Load an image URL into originalImageData
  const loadImageFromUrl = useCallback((url: string, fileName: string) => {
    // Pause and clear video if transitioning from video
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.src = '';
    }

    setMediaType('image');
    setImageFileName(fileName);
    setCurrentSampleUrl(url);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // Scale down if oversized to ensure responsive 60fps canvas operations
      const maxDim = 1920;
      let w = img.naturalWidth;
      let h = img.naturalHeight;
      if (w > maxDim || h > maxDim) {
        if (w > h) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, w, h);
      const data = ctx.getImageData(0, 0, w, h);
      setOriginalImageData(data);
    };

    img.onerror = () => {
      console.warn('Network sample load failed, generating high-fidelity calibration frame.');
      const fallback = generateCalibrationFrame();
      setOriginalImageData(fallback);
      setImageFileName('calibration_pattern_rec709.raw');
    };

    img.src = url;
  }, []);

  // Frame extraction from video element with buffer pooling and frame-drop prevention
  const extractFrameFromVideo = useCallback(
    (forcedQuality?: '540p' | '720p' | 'native') => {
      const video = videoRef.current;
      if (!video || video.readyState < 2) return;

      const nativeW = video.videoWidth;
      const nativeH = video.videoHeight;
      if (!nativeW || !nativeH) return;

      // Prevent concurrent frame processing overrun (causes UI locks/stutter)
      if (isFrameBusyRef.current) return;
      isFrameBusyRef.current = true;

      try {
        const q = forcedQuality || videoPlaybackState.quality;
        let targetW = nativeW;
        let targetH = nativeH;

        if (q === '540p') {
          const maxW = 960;
          if (nativeW > maxW) {
            targetW = maxW;
            targetH = Math.round((nativeH * maxW) / nativeW);
          }
        } else if (q === '720p') {
          const maxW = 1280;
          if (nativeW > maxW) {
            targetW = maxW;
            targetH = Math.round((nativeH * maxW) / nativeW);
          }
        }

        if (!offscreenCanvasRef.current) {
          offscreenCanvasRef.current = document.createElement('canvas');
        }
        const canvas = offscreenCanvasRef.current;
        if (canvas.width !== targetW || canvas.height !== targetH) {
          canvas.width = targetW;
          canvas.height = targetH;
          rawDataBufferRef.current = null;
          gradedDataBufferRef.current = null;
        }

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        ctx.drawImage(video, 0, 0, targetW, targetH);
        const rawData = ctx.getImageData(0, 0, targetW, targetH);
        setOriginalImageData(rawData);

        // Reuse targetBuffer to avoid continuous Garbage Collector sweeps at 30-60fps
        if (
          !gradedDataBufferRef.current ||
          gradedDataBufferRef.current.width !== targetW ||
          gradedDataBufferRef.current.height !== targetH
        ) {
          gradedDataBufferRef.current = new ImageData(targetW, targetH);
        }

        const graded = applyColorGrade(
          rawData,
          colorSettingsRef.current,
          gradedDataBufferRef.current
        );
        setGradedImageData(graded);
      } finally {
        isFrameBusyRef.current = false;
      }
    },
    [videoPlaybackState.quality]
  );

  // Load a video URL into video element
  const loadVideoFromUrl = useCallback(
    (url: string, fileName: string) => {
      setMediaType('video');
      setImageFileName(fileName);
      setCurrentSampleUrl(url);

      const video = videoRef.current;
      if (video) {
        video.pause();
        video.src = url;
        video.load();
      }
    },
    []
  );

  // Initial mount load
  useEffect(() => {
    loadImageFromUrl(sampleFrames[0].url, sampleFrames[0].name);
  }, [loadImageFromUrl]);

  // Video Frame presentation loop while playing
  useEffect(() => {
    if (mediaType !== 'video' || !videoPlaybackState.isPlaying) return;
    const video = videoRef.current;
    if (!video) return;

    let callbackId: number | null = null;
    let animId: number | null = null;
    let isCancelled = false;

    const onFrame = () => {
      if (isCancelled) return;
      extractFrameFromVideo();

      if ('requestVideoFrameCallback' in video) {
        callbackId = (video as any).requestVideoFrameCallback(onFrame);
      } else {
        animId = requestAnimationFrame(onFrame);
      }
    };

    if ('requestVideoFrameCallback' in video) {
      callbackId = (video as any).requestVideoFrameCallback(onFrame);
    } else {
      animId = requestAnimationFrame(onFrame);
    }

    return () => {
      isCancelled = true;
      if (callbackId !== null && 'cancelVideoFrameCallback' in video) {
        (video as any).cancelVideoFrameCallback(callbackId);
      }
      if (animId !== null) {
        cancelAnimationFrame(animId);
      }
    };
  }, [mediaType, videoPlaybackState.isPlaying, extractFrameFromVideo]);

  // Real-time deterministic pixel processing loop for images or when paused/adjusting sliders
  useEffect(() => {
    if (!originalImageData) return;

    // If video is actively playing, the video frame callback loop handles grading
    if (mediaType === 'video' && videoPlaybackState.isPlaying) {
      return;
    }

    if (processingRef.current) {
      cancelAnimationFrame(processingRef.current);
    }

    processingRef.current = requestAnimationFrame(() => {
      const graded = applyColorGrade(originalImageData, colorSettings);
      setGradedImageData(graded);
    });

    return () => {
      if (processingRef.current) {
        cancelAnimationFrame(processingRef.current);
      }
    };
  }, [originalImageData, colorSettings, mediaType, videoPlaybackState.isPlaying]);

  // Handle uploaded media file (Image or MP4 video)
  const handleMediaUploaded = (file: File) => {
    const isVideo =
      file.type.startsWith('video/') ||
      file.name.toLowerCase().endsWith('.mp4') ||
      file.name.toLowerCase().endsWith('.webm');

    if (isVideo) {
      if (currentSampleUrl && currentSampleUrl.startsWith('blob:')) {
        URL.revokeObjectURL(currentSampleUrl);
      }
      const blobUrl = URL.createObjectURL(file);
      loadVideoFromUrl(blobUrl, file.name);
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          loadImageFromUrl(e.target.result as string, file.name);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Video Transport Handlers
  const handleTogglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch((err) => console.warn('Playback resume blocked:', err));
    } else {
      video.pause();
    }
  }, []);

  const handleSeek = useCallback(
    (time: number) => {
      const video = videoRef.current;
      if (!video) return;
      video.currentTime = Math.max(0, Math.min(video.duration || 0, time));
      extractFrameFromVideo();
    },
    [extractFrameFromVideo]
  );

  const handleStepFrame = useCallback(
    (direction: 'prev' | 'next') => {
      const video = videoRef.current;
      if (!video) return;
      video.pause();
      const delta = direction === 'next' ? 1 / 30 : -1 / 30;
      video.currentTime = Math.max(
        0,
        Math.min(video.duration || 0, video.currentTime + delta)
      );
      extractFrameFromVideo();
    },
    [extractFrameFromVideo]
  );

  const handleToggleLoop = useCallback(() => {
    setVideoPlaybackState((prev) => {
      const nextLoop = !prev.isLooping;
      if (videoRef.current) videoRef.current.loop = nextLoop;
      return { ...prev, isLooping: nextLoop };
    });
  }, []);

  const handleToggleMute = useCallback(() => {
    setVideoPlaybackState((prev) => {
      const nextMute = !prev.isMuted;
      if (videoRef.current) videoRef.current.muted = nextMute;
      return { ...prev, isMuted: nextMute };
    });
  }, []);

  const handleVolumeChange = useCallback((vol: number) => {
    setVideoPlaybackState((prev) => {
      if (videoRef.current) {
        videoRef.current.volume = vol;
        videoRef.current.muted = vol === 0;
      }
      return { ...prev, volume: vol, isMuted: vol === 0 };
    });
  }, []);

  const handleSpeedChange = useCallback((rate: number) => {
    setVideoPlaybackState((prev) => {
      if (videoRef.current) videoRef.current.playbackRate = rate;
      return { ...prev, playbackRate: rate };
    });
  }, []);

  const handleQualityChange = useCallback(
    (q: '540p' | '720p' | 'native') => {
      setVideoPlaybackState((prev) => ({ ...prev, quality: q }));
      extractFrameFromVideo(q);
    },
    [extractFrameFromVideo]
  );

  // Reset all adjustments to default neutral
  const handleResetAll = useCallback(() => {
    handleDiscreteColorChange(defaultGrade);
  }, [handleDiscreteColorChange]);

  // Apply a preset
  const handleApplyPreset = useCallback(
    (preset: ColorPreset) => {
      handleDiscreteColorChange(preset.settings);
    },
    [handleDiscreteColorChange]
  );

  // Export graded frame as PNG / JPEG (handles still image or current video frame at native resolution)
  const handleExportImage = useCallback(
    (format: 'png' | 'jpeg') => {
      const video = videoRef.current;
      if (mediaType === 'video' && video && video.readyState >= 2) {
        const nativeW = video.videoWidth || 1920;
        const nativeH = video.videoHeight || 1080;
        const capCanvas = document.createElement('canvas');
        capCanvas.width = nativeW;
        capCanvas.height = nativeH;
        const cCtx = capCanvas.getContext('2d', { willReadFrequently: true });
        if (cCtx) {
          cCtx.drawImage(video, 0, 0, nativeW, nativeH);
          const raw = cCtx.getImageData(0, 0, nativeW, nativeH);
          const graded = applyColorGrade(raw, colorSettings);
          capCanvas.getContext('2d')?.putImageData(graded, 0, 0);

          const mime = format === 'png' ? 'image/png' : 'image/jpeg';
          const quality = format === 'jpeg' ? 0.95 : undefined;
          const dataUrl = capCanvas.toDataURL(mime, quality);

          const a = document.createElement('a');
          a.href = dataUrl;
          const baseName = imageFileName.replace(/\.[^/.]+$/, '');
          const timeSec = Math.round(video.currentTime * 100) / 100;
          a.download = `${baseName}_frame_${timeSec}s_graded_${Date.now()}.${
            format === 'png' ? 'png' : 'jpg'
          }`;
          a.click();
          return;
        }
      }

      if (!gradedImageData) return;

      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = gradedImageData.width;
      exportCanvas.height = gradedImageData.height;
      const ctx = exportCanvas.getContext('2d');
      if (!ctx) return;

      ctx.putImageData(gradedImageData, 0, 0);

      const mime = format === 'png' ? 'image/png' : 'image/jpeg';
      const quality = format === 'jpeg' ? 0.95 : undefined;
      const dataUrl = exportCanvas.toDataURL(mime, quality);

      const a = document.createElement('a');
      a.href = dataUrl;
      const baseName = imageFileName.replace(/\.[^/.]+$/, '');
      a.download = `${baseName}_graded_${Date.now()}.${format === 'png' ? 'png' : 'jpg'}`;
      a.click();
    },
    [mediaType, imageFileName, gradedImageData, colorSettings]
  );

  // Still frame capture shortcut
  const handleCaptureStill = useCallback(() => {
    handleExportImage('png');
  }, [handleExportImage]);

  // Helper to capture base64 preview for Gemini or thumbnails
  const getCanvasImageDataUrl = useCallback(() => {
    if (!gradedImageData) return undefined;
    // Scale down for fast payload transfer to AI
    const thumbCanvas = document.createElement('canvas');
    const scale = Math.min(1, 960 / Math.max(gradedImageData.width, gradedImageData.height));
    thumbCanvas.width = Math.round(gradedImageData.width * scale);
    thumbCanvas.height = Math.round(gradedImageData.height * scale);

    const tCtx = thumbCanvas.getContext('2d');
    if (!tCtx) return undefined;

    // First draw full into temporary canvas
    const fullCanvas = document.createElement('canvas');
    fullCanvas.width = gradedImageData.width;
    fullCanvas.height = gradedImageData.height;
    fullCanvas.getContext('2d')?.putImageData(gradedImageData, 0, 0);

    tCtx.drawImage(fullCanvas, 0, 0, thumbCanvas.width, thumbCanvas.height);
    return thumbCanvas.toDataURL('image/jpeg', 0.85);
  }, [gradedImageData]);

  const getCanvasThumbnail = useCallback(() => {
    if (!gradedImageData) return undefined;
    const thumbCanvas = document.createElement('canvas');
    thumbCanvas.width = 160;
    thumbCanvas.height = 90;
    const tCtx = thumbCanvas.getContext('2d');
    if (!tCtx) return undefined;

    const fullCanvas = document.createElement('canvas');
    fullCanvas.width = gradedImageData.width;
    fullCanvas.height = gradedImageData.height;
    fullCanvas.getContext('2d')?.putImageData(gradedImageData, 0, 0);

    tCtx.drawImage(fullCanvas, 0, 0, 160, 90);
    return thumbCanvas.toDataURL('image/jpeg', 0.7);
  }, [gradedImageData]);

  // Check if any adjustments are modified from default
  const isAnyModified =
    Math.abs(colorSettings.exposure) > 0.001 ||
    colorSettings.brightness !== 0 ||
    colorSettings.contrast !== 0 ||
    colorSettings.saturation !== 0 ||
    colorSettings.vibrance !== 0 ||
    colorSettings.temperature !== 0 ||
    colorSettings.tint !== 0 ||
    colorSettings.highlights !== 0 ||
    colorSettings.shadows !== 0 ||
    colorSettings.whites !== 0 ||
    colorSettings.blacks !== 0 ||
    colorSettings.clarity !== 0 ||
    colorSettings.shadowsColor.amount > 0 ||
    colorSettings.midtonesColor.amount > 0 ||
    colorSettings.highlightsColor.amount > 0;

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0f1014] text-[#d6d9e0] font-sans select-none overflow-hidden">
      {/* Hidden native HTML5 Video element powering the frame decoding engine */}
      <video
        ref={videoRef}
        playsInline
        preload="auto"
        crossOrigin="anonymous"
        loop={videoPlaybackState.isLooping}
        muted={videoPlaybackState.isMuted}
        onLoadedMetadata={(e) => {
          const v = e.currentTarget;
          setVideoPlaybackState((prev) => ({
            ...prev,
            duration: v.duration || 0,
            currentTime: 0,
            isPlaying: false,
          }));
          v.currentTime = 0.05;
        }}
        onSeeked={() => {
          extractFrameFromVideo();
        }}
        onTimeUpdate={(e) => {
          const v = e.currentTarget;
          setVideoPlaybackState((prev) => ({
            ...prev,
            currentTime: v.currentTime,
          }));
        }}
        onPlay={() => {
          setVideoPlaybackState((prev) => ({ ...prev, isPlaying: true }));
        }}
        onPause={() => {
          setVideoPlaybackState((prev) => ({ ...prev, isPlaying: false }));
          extractFrameFromVideo();
        }}
        onEnded={() => {
          setVideoPlaybackState((prev) => ({ ...prev, isPlaying: false }));
        }}
        className="hidden"
      />

      {/* Top Application Navigation Bar */}
      <TopBar
        onImportMedia={handleMediaUploaded}
        onResetAll={handleResetAll}
        onUndo={handleUndo}
        canUndo={undoStack.length > 0}
        onRedo={handleRedo}
        canRedo={redoStack.length > 0}
        onOpenSaveLook={() => setSidebarTab('looks')}
        onExportImage={handleExportImage}
        compareMode={compareMode}
        onToggleCompare={() =>
          setCompareMode((m) => (m === 'single' ? 'split-vertical' : 'single'))
        }
        onOpenAiTools={() => setSidebarTab('ai')}
        isAiToolsOpen={sidebarTab === 'ai'}
        mediaType={mediaType}
        onOpenShortcuts={() => setIsShortcutsModalOpen(true)}
      />

      {/* Main Workspace (50% Viewing on Left, 50% Configuration on Right on Desktop/Landscape) */}
      <div
        id="main-workspace"
        className="workspace-split-container flex-1 overflow-hidden"
      >
        {/* 1. Video Viewport Area (Left-Top on Desktop, First on Mobile) */}
        <section
          id="video-viewport-section"
          className="workspace-video-area flex flex-col overflow-hidden"
          aria-label="Cinema Video Viewport"
        >
          <ImageViewer
            originalImageData={originalImageData}
            gradedImageData={gradedImageData}
            imageFileName={imageFileName}
            compareMode={compareMode}
            onCompareModeChange={setCompareMode}
            onImageUploaded={handleMediaUploaded}
            onSelectSample={() => setIsSampleModalOpen(true)}
            mediaType={mediaType}
            videoPlaybackState={videoPlaybackState}
            onTogglePlay={handleTogglePlay}
            onSeek={handleSeek}
            onStepFrame={handleStepFrame}
            onToggleLoop={handleToggleLoop}
            onToggleMute={handleToggleMute}
            onVolumeChange={handleVolumeChange}
            onSpeedChange={handleSpeedChange}
            onQualityChange={handleQualityChange}
            onCaptureStill={handleCaptureStill}
          />
        </section>

        {/* Dedicated Action Area for Mobile & Tablet: Between Video Preview Area and Color Settings Area */}
        <MobileActionArea
          compareMode={compareMode}
          onToggleCompare={() =>
            setCompareMode((m) => (m === 'single' ? 'split-vertical' : 'single'))
          }
          onOpenAiTools={() => setSidebarTab('ai')}
          isAiToolsOpen={sidebarTab === 'ai'}
          onOpenSaveLook={() => setSidebarTab('looks')}
          onResetAll={handleResetAll}
        />

        {/* 2. Configuration Area (Right 50% on Desktop, Directly Below Video & Actions on Mobile) */}
        <aside
          id="color-grading-sidebar"
          className="workspace-config-area flex flex-col bg-[#0f1014] shadow-2xl"
          aria-label="Color Grading Configuration Station"
        >
          {/* Sidebar Navigation Tabs - LUMA Design System */}
          <div className="flex items-center justify-between px-2 pt-2 bg-[#0f1014] border-b border-[#3b3756] overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-1 flex-nowrap shrink-0">
              <button
                id="sidebar-tab-wheels"
                type="button"
                onClick={() => setSidebarTab('wheels')}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg transition-all cursor-pointer border-t border-x ${
                  sidebarTab === 'wheels'
                    ? 'bg-[#222131] text-[#f5f3fe] border-[#3b3756] border-b-transparent shadow-sm'
                    : 'text-[#9a96b4] hover:text-[#f5f3fe] hover:bg-[#222131]/50 border-transparent'
                }`}
              >
                <Palette className={`w-3.5 h-3.5 ${sidebarTab === 'wheels' ? 'text-[#dcd2fa]' : 'text-[#9a96b4]'}`} />
                <span>Rodas</span>
              </button>

              <button
                id="sidebar-tab-controls"
                type="button"
                onClick={() => setSidebarTab('controls')}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg transition-all cursor-pointer border-t border-x ${
                  sidebarTab === 'controls'
                    ? 'bg-[#222131] text-[#f5f3fe] border-[#3b3756] border-b-transparent shadow-sm'
                    : 'text-[#9a96b4] hover:text-[#f5f3fe] hover:bg-[#222131]/50 border-transparent'
                }`}
              >
                <Sliders className={`w-3.5 h-3.5 ${sidebarTab === 'controls' ? 'text-[#dcd2fa]' : 'text-[#9a96b4]'}`} />
                <span>Controles</span>
              </button>

              <button
                id="sidebar-tab-presets"
                type="button"
                onClick={() => setSidebarTab('presets')}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg transition-all cursor-pointer border-t border-x ${
                  sidebarTab === 'presets'
                    ? 'bg-[#222131] text-[#f5f3fe] border-[#3b3756] border-b-transparent shadow-sm'
                    : 'text-[#9a96b4] hover:text-[#f5f3fe] hover:bg-[#222131]/50 border-transparent'
                }`}
              >
                <Clapperboard className={`w-3.5 h-3.5 ${sidebarTab === 'presets' ? 'text-[#dcd2fa]' : 'text-[#9a96b4]'}`} />
                <span>Presets</span>
              </button>

              <button
                id="sidebar-tab-looks"
                type="button"
                onClick={() => setSidebarTab('looks')}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg transition-all cursor-pointer border-t border-x ${
                  sidebarTab === 'looks'
                    ? 'bg-[#222131] text-[#f5f3fe] border-[#3b3756] border-b-transparent shadow-sm'
                    : 'text-[#9a96b4] hover:text-[#f5f3fe] hover:bg-[#222131]/50 border-transparent'
                }`}
              >
                <Bookmark className={`w-3.5 h-3.5 ${sidebarTab === 'looks' ? 'text-[#dcd2fa]' : 'text-[#9a96b4]'}`} />
                <span>Looks</span>
              </button>

              <button
                id="sidebar-tab-ai"
                type="button"
                onClick={() => setSidebarTab('ai')}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg transition-all cursor-pointer border-t border-x ${
                  sidebarTab === 'ai'
                    ? 'bg-[#222131] text-[#f5f3fe] border-[#3b3756] border-b-transparent shadow-sm'
                    : 'text-[#9a96b4] hover:text-[#f5f3fe] hover:bg-[#222131]/50 border-transparent'
                }`}
              >
                <Sparkles className={`w-3.5 h-3.5 ${sidebarTab === 'ai' ? 'text-[#dcd2fa]' : 'text-[#9a96b4]'}`} />
                <span>Look IA</span>
              </button>
            </div>

            <div className="flex items-center gap-1 mb-1 shrink-0 ml-2">
              {undoStack.length > 0 && (
                <button
                  id="btn-sidebar-undo"
                  type="button"
                  onClick={handleUndo}
                  title="Desfazer última ação (Ctrl+Z)"
                  className="p-1 text-[#9a96b4] hover:text-[#dcd2fa] transition-colors cursor-pointer rounded hover:bg-[#222131]"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                </button>
              )}
              {redoStack.length > 0 && (
                <button
                  id="btn-sidebar-redo"
                  type="button"
                  onClick={handleRedo}
                  title="Refazer ação (Ctrl+Shift+Z)"
                  className="p-1 text-[#9a96b4] hover:text-[#dcd2fa] transition-colors cursor-pointer rounded hover:bg-[#222131]"
                >
                  <Redo2 className="w-3.5 h-3.5" />
                </button>
              )}
              {isAnyModified && (
                <button
                  id="btn-quick-reset-all"
                  type="button"
                  onClick={handleResetAll}
                  title="Redefinir todas as configurações para o neutro"
                  className="p-1 text-[#9a96b4] hover:text-[#f5f3fe] transition-colors cursor-pointer rounded hover:bg-[#222131]"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Tab Content Panel Container */}
          <div className="workspace-tab-content flex-1 p-3">
            {sidebarTab === 'wheels' && (
              <div className="flex flex-col gap-3">
                <ColorWheelsPanel
                  settings={colorSettings}
                  onChange={handleContinuousColorChange}
                />
                {/* Secondary basic sliders below wheels for quick access */}
                <div className="border-t border-[#3b3756] pt-3">
                  <h4 className="text-[11px] font-semibold text-[#9a96b4] uppercase tracking-wider mb-2">
                    Exposição Básica &amp; Balanço de Branco
                  </h4>
                  <ControlPanel
                    settings={colorSettings}
                    onChange={handleContinuousColorChange}
                  />
                </div>
              </div>
            )}

            {sidebarTab === 'controls' && (
              <ControlPanel
                settings={colorSettings}
                onChange={handleContinuousColorChange}
              />
            )}

            {sidebarTab === 'presets' && (
              <PresetPanel
                currentSettings={colorSettings}
                onApplyPreset={handleApplyPreset}
              />
            )}

            {sidebarTab === 'looks' && (
              <LookManager
                currentSettings={colorSettings}
                onApplySettings={handleDiscreteColorChange}
                getCanvasThumbnail={getCanvasThumbnail}
              />
            )}

            {sidebarTab === 'ai' && (
              <GeminiAiPanel
                currentSettings={colorSettings}
                getCanvasImageDataUrl={getCanvasImageDataUrl}
                onApplyGrade={handleDiscreteColorChange}
              />
            )}
          </div>
        </aside>

        {/* 3. Real-Time Scopes Area (Left-Bottom on Desktop, Below Configuration on Mobile) */}
        <section
          id="scopes-section"
          className={`workspace-scopes-area flex flex-col overflow-hidden ${
            isScopesExpanded ? 'scopes-expanded' : 'scopes-collapsed'
          }`}
          aria-label="Real-Time Scopes and Telemetry Station"
        >
          <div className="flex-1 h-full overflow-hidden">
            <ScopeViewer
              imageData={gradedImageData}
              isExpanded={isScopesExpanded}
              onToggleExpand={() => setIsScopesExpanded((prev) => !prev)}
            />
          </div>
        </section>
      </div>

      {/* Rodapé / Créditos da Aplicação */}
      <footer
        id="app-footer"
        className="flex-shrink-0 py-2 px-4 bg-[#0f1014] border-t border-[#3b3756] text-center text-xs text-[#9a96b4] select-text z-20"
      >
        <p>
          Trabalho realizado por: <span className="text-[#f5f3fe] font-medium">Julia Rodrigues</span> e <span className="text-[#f5f3fe] font-medium">Tomás Moreira</span>
        </p>
      </footer>

      {/* Sample Media Picker Modal */}
      <SampleMediaModal
        isOpen={isSampleModalOpen}
        onClose={() => setIsSampleModalOpen(false)}
        currentUrl={currentSampleUrl}
        onSelectSample={(sample: SampleMedia) => {
          if (sample.type === 'video') {
            loadVideoFromUrl(sample.url, sample.name);
          } else {
            loadImageFromUrl(sample.url, sample.name);
          }
        }}
        onSelectCalibration={() => {
          const calib = generateCalibrationFrame();
          setOriginalImageData(calib);
          setImageFileName('SMPTE_Macbeth_Calibration_Chart.raw');
        }}
      />

      {/* Keyboard Shortcuts Discovery Modal */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
      />
    </div>
  );
}
