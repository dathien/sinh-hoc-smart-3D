import { AnnotationMode } from '../../../context/SmartLabelContext';

export interface AnchorPoint2D {
  id: string;
  numberIndex: number; // Consistent 1-based index by partId order in model
  name: string;
  scientificName: string;
  colorHex: string;
  canvasX: number; // Position inside center canvas (px)
  canvasY: number; // Position inside center canvas (px)
  depth: number; // NDC z (-1..1)
  priority: number;
  isSelected: boolean;
}

export interface PlacedSideLabel {
  anchor: AnchorPoint2D;
  side: 'left' | 'right';
  top: number; // Y coordinate in container space (px)
  height: number; // Measured or estimated card height (px)
}

export interface PlacedNumberPin {
  anchor: AnchorPoint2D;
  x: number; // Center X in canvas space
  y: number; // Center Y in canvas space
  radius: number;
}

export type EffectiveLayoutMode =
  | 'three-zone'
  | 'numbered-legend'
  | 'legend-only'
  | 'selected-only'
  | 'hidden';

export interface SmartLayoutResult {
  layoutMode: EffectiveLayoutMode;
  sideWidth: number;
  leftLabels: PlacedSideLabel[];
  rightLabels: PlacedSideLabel[];
  numberPins: PlacedNumberPin[];
  fallbackReason?: string;
}

export interface RectBox {
  id: string;
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface CollisionAuditMetrics {
  overlappingLabelCount: number;
  clippedLabelCount: number;
  outOfBoundsLabelCount: number;
  legacyLabelCount: number;
  modelObstructionCount: number;
}

export const MIN_VERTICAL_GAP = 10;
export const EDGE_MARGIN = 12;

/**
 * Estimates height of a wrapped Vietnamese label card before real DOM measurement arrives.
 */
export function estimateLabelHeight(
  text: string,
  fontSize: number,
  columnWidth: number,
  isSelected: boolean,
): number {
  const effFont = isSelected ? Math.max(fontSize, 18) : Math.max(fontSize, 15);
  const innerWidth = Math.max(100, columnWidth - 28); // padding + border
  const avgCharWidth = effFont * 0.57;
  const charsPerLine = Math.max(8, Math.floor(innerWidth / avgCharWidth));
  const words = text.trim().split(/\s+/);
  let lines = 1;
  let currentLen = 0;
  for (const w of words) {
    if (currentLen === 0) {
      currentLen = w.length;
    } else if (currentLen + 1 + w.length <= charsPerLine) {
      currentLen += 1 + w.length;
    } else {
      lines += 1;
      currentLen = w.length;
    }
  }
  const lineHeight = effFont * 1.38;
  return Math.ceil(lines * lineHeight + 18); // vertical padding 8*2 + 2px border
}

/**
 * Splits anchors cleanly into left and right zones using hysteresis so camera orbit
 * doesn't flicker labels back and forth across the midline, and rebalances if one column
 * is overloaded.
 */
export function assignSidesWithHysteresis(
  anchors: AnchorPoint2D[],
  canvasWidth: number,
  previousSides: Map<string, 'left' | 'right'>,
): { left: AnchorPoint2D[]; right: AnchorPoint2D[] } {
  const midX = canvasWidth / 2;
  const hysteresis = Math.min(26, canvasWidth * 0.05);
  const left: AnchorPoint2D[] = [];
  const right: AnchorPoint2D[] = [];

  for (const a of anchors) {
    const prev = previousSides.get(a.id);
    let side: 'left' | 'right';
    if (prev === 'left' && a.canvasX <= midX + hysteresis) {
      side = 'left';
    } else if (prev === 'right' && a.canvasX >= midX - hysteresis) {
      side = 'right';
    } else {
      side = a.canvasX < midX ? 'left' : 'right';
    }
    if (side === 'left') left.push(a);
    else right.push(a);
  }

  // Rebalance if difference > 1 by moving items closest to the horizontal center
  while (left.length - right.length > 1) {
    let bestIdx = 0;
    let bestX = -Infinity;
    for (let i = 0; i < left.length; i++) {
      if (left[i].canvasX > bestX) {
        bestX = left[i].canvasX;
        bestIdx = i;
      }
    }
    right.push(left.splice(bestIdx, 1)[0]);
  }
  while (right.length - left.length > 1) {
    let bestIdx = 0;
    let bestX = Infinity;
    for (let i = 0; i < right.length; i++) {
      if (right[i].canvasX < bestX) {
        bestX = right[i].canvasX;
        bestIdx = i;
      }
    }
    left.push(right.splice(bestIdx, 1)[0]);
  }

  // Sort top-to-bottom by projected Y to prevent leader-line crossings
  left.sort((a, b) => a.canvasY - b.canvasY || a.numberIndex - b.numberIndex);
  right.sort((a, b) => a.canvasY - b.canvasY || a.numberIndex - b.numberIndex);

  return { left, right };
}

/**
 * Distributes labels vertically in a side column with guaranteed >= MIN_VERTICAL_GAP
 * spacing and strict clamping inside [EDGE_MARGIN, containerHeight - EDGE_MARGIN].
 */
export function resolveVerticalColumn(
  anchors: AnchorPoint2D[],
  side: 'left' | 'right',
  containerHeight: number,
  columnWidth: number,
  fontSize: number,
  measuredHeights: Record<string, number>,
): { placed: PlacedSideLabel[]; fits: boolean; requiredHeight: number } {
  if (anchors.length === 0) {
    return { placed: [], fits: true, requiredHeight: 0 };
  }

  const heights = anchors.map((a) => {
    const measured = measuredHeights[a.id];
    if (typeof measured === 'number' && measured > 20) {
      return Math.ceil(measured);
    }
    return estimateLabelHeight(a.name, fontSize, columnWidth, a.isSelected);
  });

  const totalHeights = heights.reduce((sum, h) => sum + h, 0);
  const totalGaps = Math.max(0, anchors.length - 1) * MIN_VERTICAL_GAP;
  const requiredHeight = totalHeights + totalGaps + EDGE_MARGIN * 2;
  const availableHeight = Math.max(0, containerHeight);

  if (requiredHeight > availableHeight) {
    return { placed: [], fits: false, requiredHeight };
  }

  // Start each label centered on its anchor Y, clamped inside bounds
  const tops = anchors.map((a, idx) => {
    const h = heights[idx];
    const desired = a.canvasY - h / 2;
    return Math.max(EDGE_MARGIN, Math.min(availableHeight - EDGE_MARGIN - h, desired));
  });

  // Forward pass: push overlapping labels downward
  for (let i = 1; i < tops.length; i++) {
    const minTop = tops[i - 1] + heights[i - 1] + MIN_VERTICAL_GAP;
    if (tops[i] < minTop) {
      tops[i] = minTop;
    }
  }

  // Backward pass: if last label exceeds bottom edge, shift upward cleanly
  const lastIdx = tops.length - 1;
  const maxLastTop = availableHeight - EDGE_MARGIN - heights[lastIdx];
  if (tops[lastIdx] > maxLastTop) {
    tops[lastIdx] = maxLastTop;
    for (let i = lastIdx - 1; i >= 0; i--) {
      const maxTop = tops[i + 1] - MIN_VERTICAL_GAP - heights[i];
      if (tops[i] > maxTop) {
        tops[i] = maxTop;
      }
    }
  }

  // Final strict safety verification
  const fitsAfterPass =
    tops[0] >= EDGE_MARGIN - 0.5 &&
    tops[lastIdx] + heights[lastIdx] <= availableHeight - EDGE_MARGIN + 0.5;

  if (!fitsAfterPass) {
    return { placed: [], fits: false, requiredHeight };
  }

  const placed: PlacedSideLabel[] = anchors.map((anchor, idx) => ({
    anchor,
    side,
    top: Math.round(tops[idx]),
    height: heights[idx],
  }));

  return { placed, fits: true, requiredHeight };
}

/**
 * Places compact numbered circular pins inside the canvas with 2D repulsion so
 * pins never overlap each other or exit the canvas bounds.
 */
export function resolveNumberPinCollisions(
  anchors: AnchorPoint2D[],
  canvasWidth: number,
  canvasHeight: number,
  pinRadius = 15,
): { pins: PlacedNumberPin[]; fits: boolean } {
  if (anchors.length === 0) return { pins: [], fits: true };
  if (canvasWidth < pinRadius * 4 || canvasHeight < pinRadius * 4) {
    return { pins: [], fits: false };
  }

  const margin = pinRadius + 8;
  const minDist = pinRadius * 2 + 6;
  const pins: PlacedNumberPin[] = anchors.map((a) => ({
    anchor: a,
    x: Math.max(margin, Math.min(canvasWidth - margin, a.canvasX)),
    y: Math.max(margin, Math.min(canvasHeight - margin, a.canvasY)),
    radius: pinRadius,
  }));

  for (let iter = 0; iter < 32; iter++) {
    let moved = false;
    for (let i = 0; i < pins.length; i++) {
      for (let j = i + 1; j < pins.length; j++) {
        let dx = pins[j].x - pins[i].x;
        let dy = pins[j].y - pins[i].y;
        let dist = Math.hypot(dx, dy);
        if (dist < 0.01) {
          const angle = ((i + j) * 2.39996) % (Math.PI * 2);
          dx = Math.cos(angle);
          dy = Math.sin(angle);
          dist = 1;
        }
        if (dist < minDist) {
          const push = (minDist - dist) * 0.55;
          const nx = dx / dist;
          const ny = dy / dist;
          pins[i].x -= nx * push;
          pins[i].y -= ny * push;
          pins[j].x += nx * push;
          pins[j].y += ny * push;
          moved = true;
        }
      }
    }
    for (const p of pins) {
      p.x = Math.max(margin, Math.min(canvasWidth - margin, p.x));
      p.y = Math.max(margin, Math.min(canvasHeight - margin, p.y));
    }
    if (!moved) break;
  }

  // Verify zero remaining overlaps between pins
  for (let i = 0; i < pins.length; i++) {
    for (let j = i + 1; j < pins.length; j++) {
      const dist = Math.hypot(pins[j].x - pins[i].x, pins[j].y - pins[i].y);
      if (dist < pinRadius * 2 + 2) {
        return { pins: [], fits: false };
      }
    }
  }

  return { pins, fits: true };
}

/**
 * Main layout coordinator computing exact non-overlapping label placement or clean fallback.
 */
export function computeSmartLabelLayout(params: {
  mode: AnnotationMode;
  anchors: AnchorPoint2D[];
  containerWidth: number;
  containerHeight: number;
  fontSize: number;
  measuredHeights: Record<string, number>;
  previousSides: Map<string, 'left' | 'right'>;
}): SmartLayoutResult {
  const { mode, anchors, containerWidth, containerHeight, fontSize, measuredHeights, previousSides } =
    params;

  if (mode === 'hidden' || anchors.length === 0) {
    return {
      layoutMode: 'hidden',
      sideWidth: 0,
      leftLabels: [],
      rightLabels: [],
      numberPins: [],
    };
  }

  if (mode === 'selected-only') {
    return {
      layoutMode: 'selected-only',
      sideWidth: 0,
      leftLabels: [],
      rightLabels: [],
      numberPins: [],
    };
  }

  if (mode === 'numbered') {
    const pinRes = resolveNumberPinCollisions(anchors, containerWidth, containerHeight);
    if (!pinRes.fits) {
      return {
        layoutMode: 'legend-only',
        sideWidth: 0,
        leftLabels: [],
        rightLabels: [],
        numberPins: [],
        fallbackReason: 'Vùng hiển thị nhỏ: tự động chuyển sang bảng chú giải tương tác.',
      };
    }
    return {
      layoutMode: 'numbered-legend',
      sideWidth: 0,
      leftLabels: [],
      rightLabels: [],
      numberPins: pinRes.pins,
    };
  }

  // MODE: 'smart' -> attempt Three-Zone (Left ~20-24% | Center Canvas ~52-60% | Right ~20-24%)
  const minCenterCanvasWidth = 310;
  const desiredSideWidth = Math.max(
    168,
    Math.min(248, Math.round(containerWidth * 0.22 + (fontSize - 16) * 3.5)),
  );
  const centerWidth = containerWidth - desiredSideWidth * 2;

  if (containerWidth >= 700 && centerWidth >= minCenterCanvasWidth) {
    const { left, right } = assignSidesWithHysteresis(anchors, centerWidth, previousSides);
    const leftCol = resolveVerticalColumn(
      left,
      'left',
      containerHeight,
      desiredSideWidth,
      fontSize,
      measuredHeights,
    );
    const rightCol = resolveVerticalColumn(
      right,
      'right',
      containerHeight,
      desiredSideWidth,
      fontSize,
      measuredHeights,
    );

    if (leftCol.fits && rightCol.fits) {
      return {
        layoutMode: 'three-zone',
        sideWidth: desiredSideWidth,
        leftLabels: leftCol.placed,
        rightLabels: rightCol.placed,
        numberPins: [],
      };
    }
  }

  // Automatic fallback when area is insufficient (narrow width, high font size, or dense labels)
  const pinRes = resolveNumberPinCollisions(anchors, containerWidth, containerHeight);
  if (pinRes.fits) {
    return {
      layoutMode: 'numbered-legend',
      sideWidth: 0,
      leftLabels: [],
      rightLabels: [],
      numberPins: pinRes.pins,
      fallbackReason: 'Tự động chuyển sang chế độ Đánh số & Chú giải để giữ trọn chữ rõ ràng.',
    };
  }

  return {
    layoutMode: 'legend-only',
    sideWidth: 0,
    leftLabels: [],
    rightLabels: [],
    numberPins: [],
    fallbackReason: 'Tự động chuyển sang bảng chú giải tương tác bên dưới mô hình.',
  };
}

/**
 * Pure geometric audit for automated collision verification (Section 22).
 */
export function auditLabelRects(
  labelRects: RectBox[],
  containerRect: { left: number; top: number; right: number; bottom: number },
  canvasRect: { left: number; top: number; right: number; bottom: number },
  clippedCount = 0,
  legacyLabelCount = 0,
): CollisionAuditMetrics {
  let overlappingLabelCount = 0;
  let outOfBoundsLabelCount = 0;
  let modelObstructionCount = 0;
  const eps = 0.5;

  for (let i = 0; i < labelRects.length; i++) {
    const a = labelRects[i];
    if (
      a.left < containerRect.left - eps ||
      a.top < containerRect.top - eps ||
      a.right > containerRect.right + eps ||
      a.bottom > containerRect.bottom + eps
    ) {
      outOfBoundsLabelCount += 1;
    }

    // Check overlap with center 3D canvas zone
    const overlapsCanvas =
      a.left < canvasRect.right - eps &&
      a.right > canvasRect.left + eps &&
      a.top < canvasRect.bottom - eps &&
      a.bottom > canvasRect.top + eps;
    if (overlapsCanvas) {
      modelObstructionCount += 1;
    }

    for (let j = i + 1; j < labelRects.length; j++) {
      const b = labelRects[j];
      const overlaps =
        a.left < b.right - eps &&
        a.right > b.left + eps &&
        a.top < b.bottom - eps &&
        a.bottom > b.top + eps;
      if (overlaps) {
        overlappingLabelCount += 1;
      }
    }
  }

  return {
    overlappingLabelCount,
    clippedLabelCount: clippedCount,
    outOfBoundsLabelCount,
    legacyLabelCount,
    modelObstructionCount,
  };
}
