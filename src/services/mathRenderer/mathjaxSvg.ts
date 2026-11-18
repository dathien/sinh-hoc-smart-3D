import { mathjax } from 'mathjax-full/js/mathjax.js';
import { TeX } from 'mathjax-full/js/input/tex.js';
import { SVG } from 'mathjax-full/js/output/svg.js';
import { liteAdaptor } from 'mathjax-full/js/adaptors/liteAdaptor.js';
import { RegisterHTMLHandler } from 'mathjax-full/js/handlers/html.js';
import { AllPackages } from 'mathjax-full/js/input/tex/AllPackages.js';

const adaptor = liteAdaptor();
RegisterHTMLHandler(adaptor);

const texInput = new TeX({
  packages: AllPackages,
});

// fontCache: 'none' embeds glyph paths directly into each SVG so exported SVGs are 100% standalone
const svgOutput = new SVG({
  fontCache: 'none',
});

const mathDocument = mathjax.document('', {
  InputJax: texInput,
  OutputJax: svgOutput,
});

export interface RenderFormulaResult {
  svgMarkup: string;
  error?: string;
}

/**
 * Normalizes minor MathLive-specific LaTeX macros into standard TeX compatible with MathJax.
 */
export function normalizeLatexForMathJax(latex: string): string {
  return latex
    .replace(/\\placeholder\{([^}]*)\}/g, '$1')
    .replace(/\\mars/g, '\\text{♂}')
    .replace(/\\female/g, '\\text{♀}')
    .replace(/\\rightleftharpoons/g, '\\rightleftharpoons ')
    .replace(/′/g, "'")
    .trim();
}

export function renderLatexToSvg(latex: string, display = true): RenderFormulaResult {
  if (!latex || !latex.trim()) {
    return { svgMarkup: '' };
  }
  try {
    const cleanLatex = normalizeLatexForMathJax(latex);
    const node = mathDocument.convert(cleanLatex, { display });
    const rawHtml = adaptor.innerHTML(node);
    // Extract standalone <svg ...>...</svg>
    const match = rawHtml.match(/<svg[\s\S]*<\/svg>/i);
    if (!match) {
      return { svgMarkup: '', error: 'Không thể tạo SVG từ công thức này.' };
    }
    // Ensure xmlns is present for standalone SVG export
    let svgStr = match[0];
    if (!svgStr.includes('xmlns="http://www.w3.org/2000/svg"')) {
      svgStr = svgStr.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    return { svgMarkup: svgStr };
  } catch (err) {
    return {
      svgMarkup: '',
      error: err instanceof Error ? err.message : 'Lỗi kết xuất công thức.',
    };
  }
}

export function downloadSvgFile(svgMarkup: string, filename = 'cong-thuc-sinh-hoc.svg'): void {
  if (!svgMarkup) return;
  const standaloneSvg = svgMarkup.startsWith('<?xml')
    ? svgMarkup
    : `<?xml version="1.0" encoding="UTF-8"?>\n${svgMarkup}`;
  const blob = new Blob([standaloneSvg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function exportSvgToPngFile(
  svgMarkup: string,
  options: {
    scale?: 1 | 2 | 3;
    background?: 'transparent' | 'white';
    filename?: string;
  } = {},
): Promise<boolean> {
  if (!svgMarkup) return false;
  const scale = options.scale ?? 2;
  const background = options.background ?? 'white';
  const filename = options.filename ?? `cong-thuc-sinh-hoc-${scale}x.png`;

  return new Promise((resolve) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgMarkup, 'image/svg+xml');
    const svgEl = doc.querySelector('svg');
    if (!svgEl) {
      resolve(false);
      return;
    }

    // Read intrinsic dimensions or compute from viewBox
    const viewBoxAttr = svgEl.getAttribute('viewBox');
    let widthPx = 400;
    let heightPx = 120;
    if (viewBoxAttr) {
      const parts = viewBoxAttr.trim().split(/[\s,]+/).map(Number);
      if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
        const aspect = parts[2] / parts[3];
        heightPx = 96;
        widthPx = Math.max(80, Math.round(heightPx * aspect));
      }
    }

    svgEl.setAttribute('width', `${widthPx}`);
    svgEl.setAttribute('height', `${heightPx}`);
    svgEl.setAttribute('style', 'color: #0F172A;');

    const serialized = new XMLSerializer().serializeToString(svgEl);
    const svgBlob = new Blob([serialized], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();

    img.onload = () => {
      const padding = 24 * scale;
      const canvas = document.createElement('canvas');
      canvas.width = widthPx * scale + padding * 2;
      canvas.height = heightPx * scale + padding * 2;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        resolve(false);
        return;
      }
      if (background === 'white') {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.drawImage(img, padding, padding, widthPx * scale, heightPx * scale);
      URL.revokeObjectURL(url);

      canvas.toBlob((pngBlob) => {
        if (!pngBlob) {
          resolve(false);
          return;
        }
        const pngUrl = URL.createObjectURL(pngBlob);
        const a = document.createElement('a');
        a.href = pngUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(pngUrl);
        resolve(true);
      }, 'image/png');
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(false);
    };

    img.src = url;
  });
}
