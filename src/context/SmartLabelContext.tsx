import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type AnnotationMode = 'smart' | 'numbered' | 'selected-only' | 'hidden';
export type VisibleAnnotationMode = Exclude<AnnotationMode, 'hidden'>;

export interface SmartLabelSettings {
  mode: AnnotationMode;
  lastVisibleMode: VisibleAnnotationMode;
  fontSize: number; // 15 to 30 px
  showLeaderLines: boolean;
}

const STORAGE_KEY = 'sinh_hoc_smart_3d_smart_labels_v1';

export const DEFAULT_SMART_LABEL_SETTINGS: SmartLabelSettings = {
  mode: 'smart',
  lastVisibleMode: 'smart',
  fontSize: 16,
  showLeaderLines: true,
};

function loadSavedSettings(): SmartLabelSettings {
  if (typeof window === 'undefined') return DEFAULT_SMART_LABEL_SETTINGS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SMART_LABEL_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<SmartLabelSettings>;
    const validModes: AnnotationMode[] = ['smart', 'numbered', 'selected-only', 'hidden'];
    const validVisibleModes: VisibleAnnotationMode[] = ['smart', 'numbered', 'selected-only'];
    const mode = validModes.includes(parsed.mode as AnnotationMode)
      ? (parsed.mode as AnnotationMode)
      : DEFAULT_SMART_LABEL_SETTINGS.mode;
    const lastVisibleMode = validVisibleModes.includes(parsed.lastVisibleMode as VisibleAnnotationMode)
      ? (parsed.lastVisibleMode as VisibleAnnotationMode)
      : mode !== 'hidden'
        ? mode
        : 'smart';
    const fontSize =
      typeof parsed.fontSize === 'number' && Number.isFinite(parsed.fontSize)
        ? Math.max(15, Math.min(30, Math.round(parsed.fontSize)))
        : DEFAULT_SMART_LABEL_SETTINGS.fontSize;
    const showLeaderLines =
      typeof parsed.showLeaderLines === 'boolean'
        ? parsed.showLeaderLines
        : DEFAULT_SMART_LABEL_SETTINGS.showLeaderLines;

    return { mode, lastVisibleMode, fontSize, showLeaderLines };
  } catch {
    return DEFAULT_SMART_LABEL_SETTINGS;
  }
}

interface SmartLabelContextValue {
  settings: SmartLabelSettings;
  isPresentation: boolean;
  effectiveFontSize: number;
  isVisible: boolean;
  setMode: (mode: AnnotationMode) => void;
  toggleQuickVisibility: () => void;
  setFontSize: (px: number) => void;
  setShowLeaderLines: (show: boolean) => void;
  resetDefaults: () => void;
  setIsPresentation: (value: boolean) => void;
  togglePresentation: () => void;
}

const SmartLabelContext = createContext<SmartLabelContextValue | null>(null);

export const GlobalSmartLabelProvider: React.FC<{
  children: React.ReactNode;
  isPresentation?: boolean;
  onChangePresentation?: (val: boolean) => void;
}> = ({ children, isPresentation: controlledPres, onChangePresentation }) => {
  const [settings, setSettings] = useState<SmartLabelSettings>(loadSavedSettings);
  const [internalPres, setInternalPres] = useState(false);

  const isPresentation = controlledPres ?? internalPres;

  const setIsPresentation = useCallback(
    (val: boolean) => {
      if (onChangePresentation) {
        onChangePresentation(val);
      } else {
        setInternalPres(val);
      }
    },
    [onChangePresentation],
  );

  const togglePresentation = useCallback(() => {
    setIsPresentation(!isPresentation);
  }, [isPresentation, setIsPresentation]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // Ignore storage quota errors in private browsing
    }
  }, [settings]);

  const setMode = useCallback((mode: AnnotationMode) => {
    setSettings((prev) => ({
      ...prev,
      mode,
      lastVisibleMode: mode !== 'hidden' ? mode : prev.lastVisibleMode,
    }));
  }, []);

  const toggleQuickVisibility = useCallback(() => {
    setSettings((prev) => {
      if (prev.mode === 'hidden') {
        return { ...prev, mode: prev.lastVisibleMode || 'smart' };
      }
      return { ...prev, mode: 'hidden', lastVisibleMode: prev.mode };
    });
  }, []);

  const setFontSize = useCallback((px: number) => {
    const clamped = Math.max(15, Math.min(30, Math.round(px)));
    setSettings((prev) => ({ ...prev, fontSize: clamped }));
  }, []);

  const setShowLeaderLines = useCallback((show: boolean) => {
    setSettings((prev) => ({ ...prev, showLeaderLines: show }));
  }, []);

  const resetDefaults = useCallback(() => {
    setSettings(DEFAULT_SMART_LABEL_SETTINGS);
  }, []);

  const effectiveFontSize = isPresentation ? Math.max(settings.fontSize, 20) : settings.fontSize;

  const value = useMemo<SmartLabelContextValue>(
    () => ({
      settings,
      isPresentation,
      effectiveFontSize,
      isVisible: settings.mode !== 'hidden',
      setMode,
      toggleQuickVisibility,
      setFontSize,
      setShowLeaderLines,
      resetDefaults,
      setIsPresentation,
      togglePresentation,
    }),
    [
      settings,
      isPresentation,
      effectiveFontSize,
      setMode,
      toggleQuickVisibility,
      setFontSize,
      setShowLeaderLines,
      resetDefaults,
      setIsPresentation,
      togglePresentation,
    ],
  );

  return <SmartLabelContext.Provider value={value}>{children}</SmartLabelContext.Provider>;
};

export function useSmartLabels(): SmartLabelContextValue {
  const ctx = useContext(SmartLabelContext);
  if (!ctx) {
    // Safe fallback if a viewer is ever rendered outside the provider
    return {
      settings: DEFAULT_SMART_LABEL_SETTINGS,
      isPresentation: false,
      effectiveFontSize: 16,
      isVisible: true,
      setMode: () => {},
      toggleQuickVisibility: () => {},
      setFontSize: () => {},
      setShowLeaderLines: () => {},
      resetDefaults: () => {},
      setIsPresentation: () => {},
      togglePresentation: () => {},
    };
  }
  return ctx;
}
