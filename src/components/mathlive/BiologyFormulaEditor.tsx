import React, { useEffect, useRef, useState } from 'react';
import { MathfieldElement } from 'mathlive';
import 'mathlive/fonts.css';
import {
  Check,
  ClipboardCopy,
  ClipboardPaste,
  Download,
  Eraser,
  FileImage,
  Keyboard,
  Redo2,
  RotateCcw,
  Trash2,
  Undo2,
  X,
} from 'lucide-react';
import { SymbolButtonDef } from '../../data/formulas/symbolGroups';
import {
  downloadSvgFile,
  exportSvgToPngFile,
  renderLatexToSvg,
} from '../../services/mathRenderer/mathjaxSvg';
import { FormulaRendererSVG } from '../formula/FormulaRendererSVG';
import { BiologySymbolToolbar } from './BiologySymbolToolbar';

// Configure MathLive offline assets once
if (typeof window !== 'undefined') {
  MathfieldElement.fontsDirectory = '/mathlive/fonts';
  MathfieldElement.soundsDirectory = '/mathlive/sounds';
}

interface BiologyFormulaEditorProps {
  initialLatex: string;
  defaultGroupId?: string;
  title?: string;
  onApply?: (newLatex: string, svgMarkup: string) => void;
  onCancel?: () => void;
  inlinePreview?: boolean;
  startEditing?: boolean;
}

export const BiologyFormulaEditor: React.FC<BiologyFormulaEditorProps> = ({
  initialLatex,
  defaultGroupId = 'genetics',
  title,
  onApply,
  onCancel,
  inlinePreview = false,
  startEditing = true,
}) => {
  const [isEditing, setIsEditing] = useState(startEditing);
  const [savedLatex, setSavedLatex] = useState(initialLatex);
  const [draftLatex, setDraftLatex] = useState(initialLatex);
  const [activeGroupId, setActiveGroupId] = useState(defaultGroupId);
  const [showAdvancedLatex, setShowAdvancedLatex] = useState(false);
  const [pngScale, setPngScale] = useState<1 | 2 | 3>(2);
  const [pngBackground, setPngBackground] = useState<'white' | 'transparent'>('white');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const mfContainerRef = useRef<HTMLDivElement | null>(null);
  const mfInstanceRef = useRef<MathfieldElement | null>(null);

  useEffect(() => {
    setSavedLatex(initialLatex);
    setDraftLatex(initialLatex);
    if (mfInstanceRef.current && mfInstanceRef.current.value !== initialLatex) {
      mfInstanceRef.current.setValue(initialLatex, { silenceNotifications: true });
    }
  }, [initialLatex]);

  useEffect(() => {
    if (!isEditing || !mfContainerRef.current) return;

    const container = mfContainerRef.current;
    container.innerHTML = '';

    const mf = new MathfieldElement();
    mf.value = draftLatex;
    mf.mathVirtualKeyboardPolicy = 'manual';
    mf.setAttribute('aria-label', 'Trình soạn thảo công thức Sinh học');

    const handleInput = () => {
      setDraftLatex(mf.getValue('latex'));
    };

    mf.addEventListener('input', handleInput);
    container.appendChild(mf);
    mfInstanceRef.current = mf;

    // Focus field after mount
    requestAnimationFrame(() => {
      mf.focus();
    });

    return () => {
      mf.removeEventListener('input', handleInput);
      if (window.mathVirtualKeyboard) {
        window.mathVirtualKeyboard.hide();
      }
      mfInstanceRef.current = null;
    };
  }, [isEditing]);

  const notify = (msg: string) => {
    setStatusMessage(msg);
    window.setTimeout(() => {
      setStatusMessage((prev) => (prev === msg ? null : prev));
    }, 2600);
  };

  const handleInsertSymbol = (symbol: SymbolButtonDef) => {
    const mf = mfInstanceRef.current;
    if (!mf) return;
    mf.focus();
    mf.insert(symbol.latex, {
      insertionMode: 'replaceSelection',
      selectionMode: 'placeholder',
      focus: true,
    });
    setDraftLatex(mf.getValue('latex'));
  };

  const handleInsertPreset = (presetLatex: string) => {
    const mf = mfInstanceRef.current;
    if (!mf) return;
    mf.focus();
    const current = mf.getValue('latex').trim();
    if (!current) {
      mf.setValue(presetLatex);
    } else {
      mf.insert(presetLatex, {
        insertionMode: 'replaceSelection',
        selectionMode: 'placeholder',
        focus: true,
      });
    }
    setDraftLatex(mf.getValue('latex'));
  };

  const handleUndo = () => {
    const mf = mfInstanceRef.current;
    if (!mf) return;
    mf.executeCommand('undo');
    setDraftLatex(mf.getValue('latex'));
  };

  const handleRedo = () => {
    const mf = mfInstanceRef.current;
    if (!mf) return;
    mf.executeCommand('redo');
    setDraftLatex(mf.getValue('latex'));
  };

  const handleBackspace = () => {
    const mf = mfInstanceRef.current;
    if (!mf) return;
    mf.focus();
    mf.executeCommand('deleteBackward');
    setDraftLatex(mf.getValue('latex'));
  };

  const handleClearAll = () => {
    const mf = mfInstanceRef.current;
    if (!mf) return;
    mf.setValue('');
    mf.focus();
    setDraftLatex('');
  };

  const handleCopy = async () => {
    try {
      const textToCopy = draftLatex;
      await navigator.clipboard.writeText(textToCopy);
      notify('Đã sao chép công thức vào bộ nhớ tạm.');
    } catch {
      notify('Trình duyệt không cho phép truy cập clipboard tự động.');
    }
  };

  const handlePaste = async () => {
    const mf = mfInstanceRef.current;
    if (!mf) return;
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        mf.focus();
        mf.insert(text, { insertionMode: 'replaceSelection', focus: true });
        setDraftLatex(mf.getValue('latex'));
        notify('Đã dán công thức tại vị trí con trỏ.');
      }
    } catch {
      notify('Hãy nhấn Ctrl+V trực tiếp vào ô công thức để dán.');
    }
  };

  const handleToggleVirtualKeyboard = () => {
    const mf = mfInstanceRef.current;
    if (!mf || !window.mathVirtualKeyboard) return;
    mf.focus();
    if (window.mathVirtualKeyboard.visible) {
      window.mathVirtualKeyboard.hide();
    } else {
      window.mathVirtualKeyboard.show();
    }
  };

  const handleApply = () => {
    const currentVal = mfInstanceRef.current?.getValue('latex') ?? draftLatex;
    const { svgMarkup } = renderLatexToSvg(currentVal);
    setSavedLatex(currentVal);
    setDraftLatex(currentVal);
    onApply?.(currentVal, svgMarkup);
    if (inlinePreview) {
      setIsEditing(false);
    }
    notify('Đã áp dụng công thức.');
  };

  const handleCancel = () => {
    setDraftLatex(savedLatex);
    if (mfInstanceRef.current) {
      mfInstanceRef.current.setValue(savedLatex, { silenceNotifications: true });
    }
    onCancel?.();
    if (inlinePreview) {
      setIsEditing(false);
    }
  };

  const handleExportSvg = () => {
    const { svgMarkup, error } = renderLatexToSvg(isEditing ? draftLatex : savedLatex);
    if (error || !svgMarkup) {
      notify('Không thể xuất SVG: công thức đang trống hoặc chưa hợp lệ.');
      return;
    }
    downloadSvgFile(svgMarkup, 'cong-thuc-sinh-hoc.svg');
    notify('Đã xuất tệp SVG độc lập.');
  };

  const handleExportPng = async () => {
    const { svgMarkup, error } = renderLatexToSvg(isEditing ? draftLatex : savedLatex);
    if (error || !svgMarkup) {
      notify('Không thể xuất PNG: công thức đang trống.');
      return;
    }
    const ok = await exportSvgToPngFile(svgMarkup, {
      scale: pngScale,
      background: pngBackground,
      filename: `cong-thuc-sinh-hoc-${pngScale}x.png`,
    });
    notify(ok ? `Đã xuất ảnh PNG (${pngScale}x).` : 'Không thể tạo ảnh PNG.');
  };

  if (inlinePreview && !isEditing) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex-1 min-w-[200px]">
          {title && <div className="font-semibold text-slate-800 text-ui-label mb-1">{title}</div>}
          <FormulaRendererSVG
            latex={savedLatex}
            onClick={() => setIsEditing(true)}
            title="Nhấp vào công thức để chỉnh sửa trực tiếp"
          />
          <p className="text-slate-500 text-ui-min mt-1">
            Nhấp vào công thức để chỉnh sửa. Chọn ký hiệu trên thanh công cụ và nhấn Áp dụng để lưu.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="min-h-[44px] px-4 py-2 rounded-lg bg-teal-700 text-white font-medium hover:bg-teal-800 transition-colors text-ui-min"
          >
            Chỉnh sửa công thức
          </button>
          <button
            type="button"
            onClick={handleExportSvg}
            className="min-h-[44px] px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 transition-colors text-ui-min inline-flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            Xuất SVG
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5 space-y-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-slate-900 text-ui-card-title">
            {title ?? 'Trình soạn thảo công thức Sinh học trực quan'}
          </h3>
          <p className="text-slate-600 text-ui-min">
            Nhấp vào khung công thức, chọn ký hiệu bên dưới để chèn tại vị trí con trỏ và nhấn Áp dụng.
          </p>
        </div>

        <button
          type="button"
          onClick={handleToggleVirtualKeyboard}
          className="min-h-[44px] px-3.5 py-2 rounded-lg border border-slate-300 bg-slate-50 text-slate-800 font-medium hover:bg-slate-100 transition-colors inline-flex items-center gap-2 text-ui-min"
        >
          <Keyboard className="w-4 h-4 text-teal-700" />
          Bàn phím ảo
        </button>
      </div>

      {/* MathLive Interactive Field */}
      <div className="space-y-2">
        <div ref={mfContainerRef} className="w-full" />
      </div>

      {/* Quick Action Bar */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleUndo}
          className="min-h-[44px] px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 inline-flex items-center gap-1.5 text-ui-min"
        >
          <Undo2 className="w-4 h-4" />
          Hoàn tác
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleRedo}
          className="min-h-[44px] px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 inline-flex items-center gap-1.5 text-ui-min"
        >
          <Redo2 className="w-4 h-4" />
          Làm lại
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleBackspace}
          className="min-h-[44px] px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 inline-flex items-center gap-1.5 text-ui-min"
        >
          <Eraser className="w-4 h-4" />
          Xóa
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleClearAll}
          className="min-h-[44px] px-3 py-2 rounded-lg border border-slate-200 bg-white text-rose-700 hover:bg-rose-50 inline-flex items-center gap-1.5 text-ui-min"
        >
          <Trash2 className="w-4 h-4" />
          Xóa tất cả
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleCopy}
          className="min-h-[44px] px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 inline-flex items-center gap-1.5 text-ui-min"
        >
          <ClipboardCopy className="w-4 h-4" />
          Sao chép
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handlePaste}
          className="min-h-[44px] px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 inline-flex items-center gap-1.5 text-ui-min"
        >
          <ClipboardPaste className="w-4 h-4" />
          Dán
        </button>
      </div>

      {/* 10 Biology Symbol Groups */}
      <BiologySymbolToolbar
        activeGroupId={activeGroupId}
        onSelectGroup={setActiveGroupId}
        onInsertSymbol={handleInsertSymbol}
        onInsertPreset={handleInsertPreset}
      />

      {/* Live MathJax SVG Output Preview + Export */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-semibold text-slate-800 text-ui-label">
            Xem trước hiển thị chuẩn (SVG sắc nét):
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex items-center gap-1.5 text-slate-700 text-ui-min">
              <span>Độ phân giải PNG:</span>
              <select
                value={pngScale}
                onChange={(e) => setPngScale(Number(e.target.value) as 1 | 2 | 3)}
                className="min-h-[44px] px-2.5 py-1 rounded-lg border border-slate-300 bg-white text-slate-900 text-ui-min"
              >
                <option value={1}>1x</option>
                <option value={2}>2x</option>
                <option value={3}>3x</option>
              </select>
            </label>
            <label className="inline-flex items-center gap-1.5 text-slate-700 text-ui-min">
              <span>Nền PNG:</span>
              <select
                value={pngBackground}
                onChange={(e) => setPngBackground(e.target.value as 'white' | 'transparent')}
                className="min-h-[44px] px-2.5 py-1 rounded-lg border border-slate-300 bg-white text-slate-900 text-ui-min"
              >
                <option value="white">Nền trắng</option>
                <option value="transparent">Nền trong suốt</option>
              </select>
            </label>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 overflow-x-auto min-h-[72px] flex items-center justify-center">
          <FormulaRendererSVG latex={draftLatex} />
        </div>

        {statusMessage && (
          <div className="text-teal-800 bg-teal-50 border border-teal-200 rounded-lg px-3 py-2 text-ui-min font-medium">
            {statusMessage}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExportSvg}
              className="min-h-[44px] px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 font-medium hover:bg-slate-100 inline-flex items-center gap-2 text-ui-min"
            >
              <Download className="w-4 h-4 text-blue-600" />
              Xuất SVG
            </button>
            <button
              type="button"
              onClick={handleExportPng}
              className="min-h-[44px] px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 font-medium hover:bg-slate-100 inline-flex items-center gap-2 text-ui-min"
            >
              <FileImage className="w-4 h-4 text-teal-700" />
              Xuất PNG
            </button>
            <button
              type="button"
              onClick={() => setShowAdvancedLatex((v) => !v)}
              className="min-h-[44px] px-3 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 text-ui-min"
            >
              {showAdvancedLatex ? 'Ẩn tùy chọn nâng cao' : 'Tùy chọn nâng cao'}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCancel}
              className="min-h-[44px] px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 font-medium hover:bg-slate-100 inline-flex items-center gap-1.5 text-ui-button"
            >
              <X className="w-4 h-4" />
              Hủy
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="min-h-[44px] px-5 py-2 rounded-lg bg-teal-700 text-white font-semibold hover:bg-teal-800 shadow-sm inline-flex items-center gap-1.5 text-ui-button"
            >
              <Check className="w-4 h-4" />
              Áp dụng
            </button>
          </div>
        </div>

        {/* Hidden by default optional advanced LaTeX mode */}
        {showAdvancedLatex && (
          <div className="pt-3 border-t border-slate-200 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-slate-700 text-ui-min">
                Chế độ mã công thức nâng cao (không bắt buộc):
              </span>
              <button
                type="button"
                onClick={() => {
                  setDraftLatex(savedLatex);
                  if (mfInstanceRef.current) mfInstanceRef.current.setValue(savedLatex);
                }}
                className="min-h-[44px] px-3 py-1 rounded-lg border border-slate-300 bg-white text-slate-700 text-ui-min inline-flex items-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                Khôi phục gốc
              </button>
            </div>
            <input
              type="text"
              value={draftLatex}
              onChange={(e) => {
                const next = e.target.value;
                setDraftLatex(next);
                if (mfInstanceRef.current) {
                  mfInstanceRef.current.setValue(next, { silenceNotifications: true });
                }
              }}
              className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 font-mono-tabular text-ui-min"
            />
          </div>
        )}
      </div>
    </div>
  );
};
