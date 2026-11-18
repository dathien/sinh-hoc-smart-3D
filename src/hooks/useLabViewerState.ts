import { useCallback, useRef, useState } from 'react';
import { ModelViewer3DHandle } from '../components/viewer3d/ModelViewer3D';
import { QualityLevel } from '../types/biology';

export function useLabViewerState(defaultPlaying = true) {
  const viewerRef = useRef<ModelViewer3DHandle | null>(null);
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null);
  const [hiddenPartIds, setHiddenPartIds] = useState<string[]>([]);
  const [isolatedPartId, setIsolatedPartId] = useState<string | null>(null);
  const [autoRotate, setAutoRotate] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const [opacityLevel, setOpacityLevel] = useState(1);
  const [clipY, setClipY] = useState(1.1);
  const [clipX, setClipX] = useState(1.1);
  const [explodeFactor, setExplodeFactor] = useState(0);
  const [isPlaying, setIsPlaying] = useState(defaultPlaying);
  const [speed, setSpeed] = useState(1);
  const [quality, setQuality] = useState<QualityLevel>('standard');
  const [simStepOffset, setSimStepOffset] = useState(0);

  const toggleHidePart = useCallback((id: string) => {
    setHiddenPartIds((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  }, []);

  const resetViewAndParts = useCallback(() => {
    setSelectedPartId(null);
    setHiddenPartIds([]);
    setIsolatedPartId(null);
    setOpacityLevel(1);
    setClipY(1.1);
    setClipX(1.1);
    setExplodeFactor(0);
    setSimStepOffset(0);
    viewerRef.current?.setCameraPreset('initial');
  }, []);

  return {
    viewerRef,
    selectedPartId,
    setSelectedPartId,
    hiddenPartIds,
    toggleHidePart,
    isolatedPartId,
    setIsolatedPartId,
    autoRotate,
    setAutoRotate,
    showLabels,
    setShowLabels,
    opacityLevel,
    setOpacityLevel,
    clipY,
    setClipY,
    clipX,
    setClipX,
    explodeFactor,
    setExplodeFactor,
    isPlaying,
    setIsPlaying,
    speed,
    setSpeed,
    quality,
    setQuality,
    simStepOffset,
    setSimStepOffset,
    resetViewAndParts,
  };
}
