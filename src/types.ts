export interface ColorWheelSetting {
  hue: number; // 0 to 360 degrees
  amount: number; // 0.0 to 1.0 (0% to 100%)
}

export interface ColorGradeSettings {
  // Exposure & Tone
  exposure: number; // -3.0 to +3.0 stops
  brightness: number; // -100 to +100
  contrast: number; // -100 to +100
  saturation: number; // -100 to +100
  vibrance: number; // -100 to +100
  
  // White Balance
  temperature: number; // -100 to +100 (cool/warm)
  tint: number; // -100 to +100 (green/magenta)
  
  // Dynamic Range
  highlights: number; // -100 to +100
  shadows: number; // -100 to +100
  whites: number; // -100 to +100
  blacks: number; // -100 to +100
  clarity: number; // -100 to +100

  // 3-Way Color Wheels
  shadowsColor: ColorWheelSetting;
  midtonesColor: ColorWheelSetting;
  highlightsColor: ColorWheelSetting;

  // Effects & Optics
  grain: number; // 0 to 100 (organic film grain amount)
  vignette: number; // 0 to 100 (lens peripheral vignette darkening)
  vignetteFeather?: number; // 10 to 100 (softness of vignette falloff)
}

export interface ColorPreset {
  id: string;
  name: string;
  category: 'Standard' | 'Film' | 'Creative' | 'Stylized';
  description: string;
  settings: ColorGradeSettings;
}

export interface SavedLook {
  id: string;
  name: string;
  createdAt: number;
  description?: string;
  settings: ColorGradeSettings;
  thumbnail?: string;
}

export type CompareMode = 'single' | 'ab-toggle' | 'split-vertical' | 'side-by-side';

export type ScopeType = 'waveform' | 'parade' | 'vectorscope' | 'histogram';

export type MediaType = 'image' | 'video';

export interface VideoPlaybackState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackRate: number;
  isLooping: boolean;
  isMuted: boolean;
  volume: number;
  quality: '540p' | '720p' | 'native';
}

export interface SampleMedia {
  id: string;
  name: string;
  category: string;
  url: string;
  type?: MediaType;
  duration?: string;
  resolution?: string;
}

export interface GeminiLookAnalysis {
  aestheticSummary: string;
  dominantTones: string;
  contrastProfile: string;
  suggestedAction: string;
  recommendedGrade: ColorGradeSettings;
  isFallback?: boolean;
  note?: string;
}

export interface GeminiVariationItem {
  id: string;
  title: string;
  description: string;
  settings: ColorGradeSettings;
}
