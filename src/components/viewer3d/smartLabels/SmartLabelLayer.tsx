import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useSmartLabels } from '../../../context/SmartLabelContext';
import { ModelPartInfo } from '../../../types/biology';
import {
  AnchorPoint2D,
  computeSmartLabelLayout,
  PlacedSideLabel,
} from './labelLayoutEngine';

interface SmartLabelLayerProps {
  anchors: AnchorPoint2D[];
  parts: ModelPartInfo[];
  selectedPartId: string | null;
  onSelectPart?: (partId: string | null) => void;
  enabled?: boolean;
  children: React.ReactNode;
}

export const SmartLabelLayer: React.FC<SmartLabelLayerProps> = ({
  anchors,
  parts,
  selectedPartId,
  onSelectPart,
  enabled = true,
  children,
}) => {
  const { settings, effectiveFontSize } = useSmartLabels();
  const stageRef = useRef<HTMLDivElement | null>(null);
  const canvasWrapRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const previousSidesRef = useRef<Map<string, 'left' | 'right'>>(new Map());

  const [stageSize, setStageSize] = useState({ width: 920, height: 560 });
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0, width: 920, height: 560 });
  const [measuredHeights, setMeasuredHeights] = useState<Record<string, number>>({});
  const [fontsVersion, setFontsVersion] = useState(0);

  // Re-measure after web fonts finish loading so Vietnamese diacritics never clip
  useEffect(() => {
    let active = true;
    if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        if (active) setFontsVersion((v) => v + 1);
      });
    }
    return () => {
      active = false;
    };
  }, []);

  // Measure stage & center canvas wrapper coordinates via ResizeObserver
  const syncStageGeometry = useCallback(() => {
    const stageEl = stageRef.current;
    if (!stageEl) return;
    const sRect = stageEl.getBoundingClientRect();
    const nextW = Math.round(sRect.width);
    const nextH = Math.round(sRect.height);
    if (nextW > 0 && nextH > 0) {
      setStageSize((prev) =>
        Math.abs(prev.width - nextW) > 1 || Math.abs(prev.height - nextH) > 1
          ? { width: nextW, height: nextH }
          : prev,
      );
    }

    const canvasEl = canvasWrapRef.current;
    if (canvasEl) {
      const cRect = canvasEl.getBoundingClientRect();
      const ox = Math.round(cRect.left - sRect.left);
      const oy = Math.round(cRect.top - sRect.top);
      const cw = Math.round(cRect.width);
      const ch = Math.round(cRect.height);
      setCanvasOffset((prev) =>
        Math.abs(prev.x - ox) > 1 ||
        Math.abs(prev.y - oy) > 1 ||
        Math.abs(prev.width - cw) > 1 ||
        Math.abs(prev.height - ch) > 1
          ? { x: ox, y: oy, width: cw, height: ch }
          : prev,
      );
    }
  }, []);

  useEffect(() => {
    const stageEl = stageRef.current;
    if (!stageEl) return;
    syncStageGeometry();
    const ro = new ResizeObserver(() => {
      syncStageGeometry();
    });
    ro.observe(stageEl);
    if (canvasWrapRef.current) {
      ro.observe(canvasWrapRef.current);
    }
    return () => ro.disconnect();
  }, [syncStageGeometry, settings.mode, enabled]);

  const effectiveMode = enabled ? settings.mode : 'hidden';

  const layout = useMemo(() => {
    if (!enabled || effectiveMode === 'hidden') {
      return computeSmartLabelLayout({
        mode: 'hidden',
        anchors: [],
        containerWidth: stageSize.width,
        containerHeight: stageSize.height,
        fontSize: effectiveFontSize,
        measuredHeights,
        previousSides: previousSidesRef.current,
      });
    }
    return computeSmartLabelLayout({
      mode: effectiveMode,
      anchors,
      containerWidth: stageSize.width,
      containerHeight: stageSize.height,
      fontSize: effectiveFontSize,
      measuredHeights,
      previousSides: previousSidesRef.current,
    });
  }, [
    enabled,
    effectiveMode,
    anchors,
    stageSize.width,
    stageSize.height,
    effectiveFontSize,
    measuredHeights,
    fontsVersion,
  ]);

  // Persist hysteresis side assignment when three-zone succeeds
  useEffect(() => {
    if (layout.layoutMode === 'three-zone') {
      const nextMap = new Map<string, 'left' | 'right'>();
      layout.leftLabels.forEach((l) => nextMap.set(l.anchor.id, 'left'));
      layout.rightLabels.forEach((r) => nextMap.set(r.anchor.id, 'right'));
      previousSidesRef.current = nextMap;
    }
  }, [layout]);

  // Keep canvas offset synced whenever layoutMode or sideWidth changes
  useLayoutEffect(() => {
    syncStageGeometry();
  }, [layout.layoutMode, layout.sideWidth, syncStageGeometry]);

  // Measure actual rendered heights of side label cards via getBoundingClientRect()
  useLayoutEffect(() => {
    if (layout.layoutMode !== 'three-zone') return;
    const nextHeights: Record<string, number> = {};
    let changed = false;

    cardRefs.current.forEach((el, id) => {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const h = Math.ceil(rect.height);
      if (h > 0) {
        nextHeights[id] = h;
        if (Math.abs((measuredHeights[id] ?? 0) - h) >= 2) {
          changed = true;
        }
      }
    });

    if (changed) {
      setMeasuredHeights((prev) => ({ ...prev, ...nextHeights }));
    }
  }, [
    layout.layoutMode,
    layout.sideWidth,
    layout.leftLabels.length,
    layout.rightLabels.length,
    effectiveFontSize,
    selectedPartId,
    fontsVersion,
  ]);

  // Reset measured heights when font size or column width changes significantly so estimation refreshes cleanly
  useEffect(() => {
    setMeasuredHeights({});
  }, [effectiveFontSize, layout.sideWidth]);

  const setCardRef = useCallback(
    (id: string) => (el: HTMLButtonElement | null) => {
      if (el) cardRefs.current.set(id, el);
      else cardRefs.current.delete(id);
    },
    [],
  );

  // Build unified numbered list for legend panel
  const legendItems = useMemo(() => {
    const visibleAnchorMap = new Map<string, AnchorPoint2D>();
    anchors.forEach((a) => visibleAnchorMap.set(a.id, a));
    return parts.map((part, idx) => ({
      part,
      numberIndex: idx + 1,
      isVisibleInScene: visibleAnchorMap.has(part.id),
    }));
  }, [parts, anchors]);

  const selectedPart = useMemo(
    () => parts.find((p) => p.id === selectedPartId) ?? null,
    [parts, selectedPartId],
  );
  const selectedAnchor = useMemo(
    () => anchors.find((a) => a.id === selectedPartId) ?? null,
    [anchors, selectedPartId],
  );

  if (!enabled) {
    return <div className="relative w-full h-full min-h-[380px]">{children}</div>;
  }

  const isThreeZone = layout.layoutMode === 'three-zone';
  const showLegendBelow =
    layout.layoutMode === 'numbered-legend' || layout.layoutMode === 'legend-only';
  const showSelectedPanelBelow = layout.layoutMode === 'selected-only';

  const renderSideCard = (item: PlacedSideLabel) => {
    const isSel = item.anchor.isSelected;
    const cardFontSize = isSel ? Math.max(effectiveFontSize, 18) : Math.max(effectiveFontSize, 15);
    return (
      <button
        key={item.anchor.id}
        ref={setCardRef(item.anchor.id)}
        type="button"
        onClick={() => onSelectPart?.(item.anchor.id)}
        style={{
          top: `${item.top}px`,
          fontSize: `${cardFontSize}px`,
          lineHeight: 1.35,
        }}
        className={`absolute left-2.5 right-2.5 z-30 px-2.5 py-2 rounded-lg border text-left font-semibold whitespace-normal break-words transition-colors cursor-pointer ${
          isSel
            ? 'bg-teal-700 text-white border-teal-300 shadow-lg ring-2 ring-teal-300/60'
            : 'bg-slate-900/95 text-slate-50 border-slate-600/90 hover:bg-slate-800 hover:border-teal-400 shadow-md'
        }`}
      >
        <span className="inline-flex items-start gap-2 w-full">
          <span
            className="mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 border border-white/60"
            style={{ backgroundColor: item.anchor.colorHex }}
            aria-hidden="true"
          />
          <span className="flex-1 min-w-0">{item.anchor.name}</span>
        </span>
      </button>
    );
  };

  const renderLeaderLinesSvg = () => {
    if (!settings.showLeaderLines) return null;

    if (isThreeZone) {
      const allPlaced = [...layout.leftLabels, ...layout.rightLabels];
      return (
        <svg
          className="pointer-events-none absolute inset-0 w-full h-full z-20"
          width={stageSize.width}
          height={stageSize.height}
          viewBox={`0 0 ${Math.max(1, stageSize.width)} ${Math.max(1, stageSize.height)}`}
          aria-hidden="true"
        >
          {allPlaced.map((item) => {
            const isSel = item.anchor.isSelected;
            const ax = canvasOffset.x + item.anchor.canvasX;
            const ay = canvasOffset.y + item.anchor.canvasY;
            const ly = item.top + item.height / 2;
            const isLeft = item.side === 'left';
            const lx = isLeft ? layout.sideWidth - 10 : stageSize.width - layout.sideWidth + 10;
            const elbowX = isLeft
              ? Math.min(ax, canvasOffset.x + 16)
              : Math.max(ax, canvasOffset.x + canvasOffset.width - 16);

            const points = `${lx},${ly} ${elbowX},${ly} ${ax},${ay}`;
            const strokeColor = isSel ? '#2DD4BF' : 'rgba(226, 232, 240, 0.85)';
            const strokeWidth = isSel ? 2.5 : 1.5;

            return (
              <g key={item.anchor.id}>
                {/* High-contrast dark halo for visibility against bright or dark 3D meshes */}
                <polyline
                  points={points}
                  fill="none"
                  stroke="rgba(2, 6, 23, 0.88)"
                  strokeWidth={strokeWidth + 2.4}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <polyline
                  points={points}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx={lx} cy={ly} r={isSel ? 3.5 : 2.5} fill={strokeColor} />
                <circle
                  cx={ax}
                  cy={ay}
                  r={isSel ? 6 : 4.5}
                  fill="rgba(2, 6, 23, 0.9)"
                  stroke={isSel ? '#2DD4BF' : '#FFFFFF'}
                  strokeWidth={isSel ? 2 : 1.5}
                />
                <circle cx={ax} cy={ay} r={isSel ? 3 : 2.2} fill={item.anchor.colorHex} />
              </g>
            );
          })}
        </svg>
      );
    }

    if (layout.layoutMode === 'selected-only' && selectedAnchor) {
      const ax = canvasOffset.x + selectedAnchor.canvasX;
      const ay = canvasOffset.y + selectedAnchor.canvasY;
      const targetX = Math.max(40, Math.min(stageSize.width - 40, ax));
      const targetY = Math.max(24, stageSize.height - 6);

      return (
        <svg
          className="pointer-events-none absolute inset-0 w-full h-full z-20"
          width={stageSize.width}
          height={stageSize.height}
          viewBox={`0 0 ${Math.max(1, stageSize.width)} ${Math.max(1, stageSize.height)}`}
          aria-hidden="true"
        >
          <polyline
            points={`${targetX},${targetY} ${ax},${ay}`}
            fill="none"
            stroke="rgba(2, 6, 23, 0.9)"
            strokeWidth={5}
            strokeLinecap="round"
          />
          <polyline
            points={`${targetX},${targetY} ${ax},${ay}`}
            fill="none"
            stroke="#2DD4BF"
            strokeWidth={2.5}
            strokeLinecap="round"
          />
          <circle cx={ax} cy={ay} r={6.5} fill="rgba(2, 6, 23, 0.92)" stroke="#2DD4BF" strokeWidth={2.2} />
          <circle cx={ax} cy={ay} r={3.2} fill={selectedAnchor.colorHex} />
        </svg>
      );
    }

    return null;
  };

  return (
    <div className="flex flex-col w-full h-full min-h-[380px] bg-[#081414] rounded-xl overflow-hidden">
      {/* Main 3D Stage (Three-Zone Grid OR Full-Width Canvas) */}
      <div
        ref={stageRef}
        className="relative flex-1 min-h-[320px] w-full"
        style={
          isThreeZone
            ? {
                display: 'grid',
                gridTemplateColumns: `${layout.sideWidth}px minmax(0, 1fr) ${layout.sideWidth}px`,
              }
            : { display: 'block' }
        }
      >
        {/* Left Label Zone (outside 3D canvas) */}
        {isThreeZone && (
          <div
            className="relative h-full bg-[#071212] border-r border-slate-800/90"
            aria-label="Chú thích bên trái"
          >
            {layout.leftLabels.map(renderSideCard)}
          </div>
        )}

        {/* Center 3D Canvas Zone */}
        <div
          ref={canvasWrapRef}
          className="relative w-full h-full min-w-0 min-h-[320px] overflow-hidden"
        >
          {children}

          {/* Numbered Pins Layer (only in numbered-legend mode when pins fit cleanly) */}
          {layout.layoutMode === 'numbered-legend' && layout.numberPins.length > 0 && (
            <>
              {settings.showLeaderLines && (
                <svg
                  className="pointer-events-none absolute inset-0 w-full h-full z-10"
                  aria-hidden="true"
                >
                  {layout.numberPins.map((pin) => {
                    const dist = Math.hypot(pin.x - pin.anchor.canvasX, pin.y - pin.anchor.canvasY);
                    if (dist < 6) return null;
                    return (
                      <g key={`pin-line-${pin.anchor.id}`}>
                        <line
                          x1={pin.x}
                          y1={pin.y}
                          x2={pin.anchor.canvasX}
                          y2={pin.anchor.canvasY}
                          stroke="rgba(2, 6, 23, 0.9)"
                          strokeWidth={4}
                        />
                        <line
                          x1={pin.x}
                          y1={pin.y}
                          x2={pin.anchor.canvasX}
                          y2={pin.anchor.canvasY}
                          stroke={pin.anchor.isSelected ? '#2DD4BF' : '#E2E8F0'}
                          strokeWidth={1.8}
                        />
                        <circle
                          cx={pin.anchor.canvasX}
                          cy={pin.anchor.canvasY}
                          r={3.5}
                          fill={pin.anchor.colorHex}
                          stroke="#FFFFFF"
                          strokeWidth={1.2}
                        />
                      </g>
                    );
                  })}
                </svg>
              )}

              {layout.numberPins.map((pin) => {
                const isSel = pin.anchor.isSelected;
                return (
                  <button
                    key={pin.anchor.id}
                    type="button"
                    onClick={() => onSelectPart?.(pin.anchor.id)}
                    aria-label={`${pin.anchor.numberIndex}. ${pin.anchor.name}`}
                    title={`${pin.anchor.numberIndex}. ${pin.anchor.name}`}
                    style={{
                      left: `${pin.x}px`,
                      top: `${pin.y}px`,
                      transform: 'translate(-50%, -50%)',
                      fontSize: '15px',
                    }}
                    className={`absolute z-20 w-8 h-8 rounded-full font-bold font-mono-tabular flex items-center justify-center border-2 shadow-md transition-transform cursor-pointer ${
                      isSel
                        ? 'bg-teal-600 text-white border-white scale-110 ring-2 ring-teal-300'
                        : 'bg-slate-900/95 text-white border-teal-400/90 hover:bg-teal-700'
                    }`}
                  >
                    {pin.anchor.numberIndex}
                  </button>
                );
              })}
            </>
          )}
        </div>

        {/* Right Label Zone (outside 3D canvas) */}
        {isThreeZone && (
          <div
            className="relative h-full bg-[#071212] border-l border-slate-800/90"
            aria-label="Chú thích bên phải"
          >
            {layout.rightLabels.map(renderSideCard)}
          </div>
        )}

        {/* Unified SVG Leader Line Overlay */}
        {renderLeaderLinesSvg()}
      </div>

      {/* Interactive Legend Panel (outside canvas for Numbered / Auto-fallback modes) */}
      {showLegendBelow && legendItems.length > 0 && (
        <div
          className="bg-[#0B1B1B] border-t border-slate-700/90 px-3.5 py-3 space-y-2 max-h-[210px] overflow-y-auto"
          aria-label="Bảng chú giải các bộ phận mô hình 3D"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-semibold text-teal-200 text-ui-min">
              Bảng chú giải tương tác ({legendItems.length} bộ phận)
            </span>
            {layout.fallbackReason && (
              <span className="text-slate-300 text-ui-min">{layout.fallbackReason}</span>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {legendItems.map(({ part, numberIndex, isVisibleInScene }) => {
              const isSel = selectedPartId === part.id;
              const fontSz = isSel ? Math.max(effectiveFontSize, 18) : Math.max(effectiveFontSize, 15);
              return (
                <button
                  key={part.id}
                  type="button"
                  onClick={() => onSelectPart?.(part.id)}
                  style={{ fontSize: `${fontSz}px`, lineHeight: 1.35 }}
                  className={`min-h-[44px] px-3 py-2 rounded-lg border text-left flex items-start gap-2.5 whitespace-normal break-words transition-colors cursor-pointer ${
                    isSel
                      ? 'bg-teal-700 text-white border-teal-300 shadow-md'
                      : isVisibleInScene
                        ? 'bg-slate-900/95 text-slate-100 border-slate-700 hover:border-teal-400'
                        : 'bg-slate-900/50 text-slate-400 border-slate-800'
                  }`}
                >
                  <span
                    className={`mt-0.5 w-6 h-6 rounded-full shrink-0 inline-flex items-center justify-center font-bold font-mono-tabular text-[15px] ${
                      isSel ? 'bg-white text-teal-800' : 'bg-teal-800 text-teal-50'
                    }`}
                  >
                    {numberIndex}
                  </span>
                  <span className="flex-1 min-w-0 font-semibold">{part.vietnameseName}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected-Only Focus Bar (outside canvas so it never obscures the 3D model) */}
      {showSelectedPanelBelow && (
        <div
          className="bg-[#0B1B1B] border-t border-teal-700/70 px-4 py-3"
          aria-label="Chú thích bộ phận đang chọn"
        >
          {selectedPart ? (
            <div className="space-y-1">
              <div
                className="font-bold text-teal-200 flex flex-wrap items-center gap-2 whitespace-normal break-words"
                style={{ fontSize: `${Math.max(effectiveFontSize, 18)}px`, lineHeight: 1.35 }}
              >
                <span
                  className="w-3 h-3 rounded-full shrink-0 border border-white/70"
                  style={{ backgroundColor: selectedPart.colorHex }}
                  aria-hidden="true"
                />
                <span>{selectedPart.vietnameseName}</span>
                <span className="font-normal text-slate-300">({selectedPart.scientificName})</span>
              </div>
              <p
                className="text-slate-200 whitespace-normal break-words"
                style={{ fontSize: `${Math.max(effectiveFontSize, 15)}px`, lineHeight: 1.45 }}
              >
                <strong className="text-white">Chức năng: </strong>
                {selectedPart.function}
              </p>
            </div>
          ) : (
            <div className="text-slate-200 text-ui-min">
              Chế độ chỉ hiện bộ phận đang chọn: Nhấp trực tiếp vào một bộ phận trên mô hình 3D hoặc chọn trong thẻ Thành phần.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
