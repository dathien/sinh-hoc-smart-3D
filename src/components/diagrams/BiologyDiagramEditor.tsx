import React, { useEffect, useRef, useState } from 'react';
import {
  Download,
  FileImage,
  Plus,
  Redo2,
  Save,
  Trash2,
  Undo2,
} from 'lucide-react';
import { BiologyFormulaEditor } from '../mathlive/BiologyFormulaEditor';
import { renderLatexToSvg } from '../../services/mathRenderer/mathjaxSvg';
import { SavedDiagramRecord, storageService } from '../../services/storage/indexedDb';

interface DiagramNode {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  text: string;
  latex?: string;
  color: string;
  shape: 'rect' | 'rounded' | 'circle';
}

interface DiagramEdge {
  id: string;
  fromId: string;
  toId: string;
  label?: string;
}

interface DiagramTemplate {
  id: string;
  name: string;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
}

const TEMPLATES: DiagramTemplate[] = [
  {
    id: 'central-dogma',
    name: 'Dòng thông tin di truyền (DNA → mRNA → Protein)',
    nodes: [
      { id: 'n1', x: 70, y: 150, w: 180, h: 74, text: 'DNA (Gene)', latex: '\\mathrm{DNA}', color: '#0D9488', shape: 'rounded' },
      { id: 'n2', x: 350, y: 150, w: 190, h: 74, text: 'mRNA (5′ → 3′)', latex: '\\mathrm{mRNA}\\;(5^{\\prime}\\rightarrow 3^{\\prime})', color: '#2563EB', shape: 'rounded' },
      { id: 'n3', x: 640, y: 150, w: 190, h: 74, text: 'Chuỗi Polypeptide', color: '#16A34A', shape: 'rounded' },
    ],
    edges: [
      { id: 'e1', fromId: 'n1', toId: 'n2', label: 'Phiên mã' },
      { id: 'e2', fromId: 'n2', toId: 'n3', label: 'Dịch mã' },
    ],
  },
  {
    id: 'genetic-cross',
    name: 'Sơ đồ lai 1 cặp tính trạng (P → F₁ → F₂)',
    nodes: [
      { id: 'c1', x: 100, y: 50, w: 220, h: 68, text: 'P: AA (Đỏ) × aa (Trắng)', latex: 'P:\\; AA \\times aa', color: '#0D9488', shape: 'rect' },
      { id: 'c2', x: 100, y: 165, w: 220, h: 68, text: 'Gp: A ; a', color: '#2563EB', shape: 'rounded' },
      { id: 'c3', x: 100, y: 280, w: 220, h: 68, text: 'F₁: 100% Aa (Đỏ)', color: '#16A34A', shape: 'rounded' },
      { id: 'c4', x: 470, y: 280, w: 300, h: 68, text: 'F₂: 1 AA : 2 Aa : 1 aa (3 Đỏ : 1 Trắng)', color: '#D97706', shape: 'rect' },
    ],
    edges: [
      { id: 'ce1', fromId: 'c1', toId: 'c2', label: 'Giảm phân' },
      { id: 'ce2', fromId: 'c2', toId: 'c3', label: 'Thụ tinh' },
      { id: 'ce3', fromId: 'c3', toId: 'c4', label: 'F₁ × F₁' },
    ],
  },
  {
    id: 'food-chain',
    name: 'Chuỗi thức ăn & Dòng năng lượng (SVSX → SVTT → Phân giải)',
    nodes: [
      { id: 'f1', x: 40, y: 150, w: 170, h: 74, text: 'Cỏ (SV sản xuất)', color: '#16A34A', shape: 'rounded' },
      { id: 'f2', x: 260, y: 150, w: 175, h: 74, text: 'Châu chấu (Bậc 1)', color: '#D97706', shape: 'rounded' },
      { id: 'f3', x: 485, y: 150, w: 175, h: 74, text: 'Ếch đồng (Bậc 2)', color: '#2563EB', shape: 'rounded' },
      { id: 'f4', x: 705, y: 150, w: 165, h: 74, text: 'Rắn (Bậc 3)', color: '#DC2626', shape: 'rounded' },
      { id: 'f5', x: 370, y: 310, w: 210, h: 68, text: 'Vi khuẩn & Nấm (Phân giải)', color: '#78350F', shape: 'rect' },
    ],
    edges: [
      { id: 'fe1', fromId: 'f1', toId: 'f2', label: '~10%' },
      { id: 'fe2', fromId: 'f2', toId: 'f3', label: '~10%' },
      { id: 'fe3', fromId: 'f3', toId: 'f4', label: '~10%' },
      { id: 'fe4', fromId: 'f4', toId: 'f5', label: 'Xác hữu cơ' },
    ],
  },
  {
    id: 'carbon-cycle',
    name: 'Chu trình Carbon',
    nodes: [
      { id: 'cb1', x: 330, y: 40, w: 240, h: 70, text: 'CO₂ trong khí quyển', latex: '\\mathrm{CO_2}', color: '#0284C7', shape: 'rounded' },
      { id: 'cb2', x: 90, y: 210, w: 220, h: 72, text: 'Thực vật (Quang hợp)', color: '#16A34A', shape: 'rounded' },
      { id: 'cb3', x: 580, y: 210, w: 220, h: 72, text: 'Động vật & Phân giải', color: '#D97706', shape: 'rounded' },
    ],
    edges: [
      { id: 'cbe1', fromId: 'cb1', toId: 'cb2', label: 'Quang hợp' },
      { id: 'cbe2', fromId: 'cb2', toId: 'cb3', label: 'Dinh dưỡng' },
      { id: 'cbe3', fromId: 'cb3', toId: 'cb1', label: 'Hô hấp' },
    ],
  },
  {
    id: 'nitrogen-cycle',
    name: 'Chu trình Nitrogen',
    nodes: [
      { id: 'ni1', x: 330, y: 35, w: 220, h: 68, text: 'Khí quyển (N₂)', latex: '\\mathrm{N_2}', color: '#2563EB', shape: 'rounded' },
      { id: 'ni2', x: 70, y: 190, w: 220, h: 72, text: 'Vi khuẩn cố định đạm (NH₄⁺)', color: '#0D9488', shape: 'rounded' },
      { id: 'ni3', x: 350, y: 310, w: 210, h: 72, text: 'Thực vật hấp thụ NO₃⁻', color: '#16A34A', shape: 'rounded' },
      { id: 'ni4', x: 610, y: 190, w: 220, h: 72, text: 'Vi khuẩn phản nitrate hóa', color: '#D97706', shape: 'rounded' },
    ],
    edges: [
      { id: 'nie1', fromId: 'ni1', toId: 'ni2', label: 'Cố định N₂' },
      { id: 'nie2', fromId: 'ni2', toId: 'ni3', label: 'Nitrate hóa' },
      { id: 'nie3', fromId: 'ni3', toId: 'ni4', label: 'Phân giải' },
      { id: 'nie4', fromId: 'ni4', toId: 'ni1', label: 'Trả N₂' },
    ],
  },
  {
    id: 'cell-cycle',
    name: 'Chu trình Tế bào (G₁ → S → G₂ → M)',
    nodes: [
      { id: 'cc1', x: 350, y: 45, w: 190, h: 70, text: 'Pha G₁ (Sinh trưởng)', color: '#0D9488', shape: 'rounded' },
      { id: 'cc2', x: 620, y: 170, w: 195, h: 70, text: 'Pha S (Nhân đôi DNA)', color: '#2563EB', shape: 'rounded' },
      { id: 'cc3', x: 350, y: 300, w: 190, h: 70, text: 'Pha G₂ (Chuẩn bị)', color: '#D97706', shape: 'rounded' },
      { id: 'cc4', x: 80, y: 170, w: 195, h: 70, text: 'Pha M (Nguyên phân)', color: '#DC2626', shape: 'rounded' },
    ],
    edges: [
      { id: 'cce1', fromId: 'cc1', toId: 'cc2', label: 'Điểm kiểm soát' },
      { id: 'cce2', fromId: 'cc2', toId: 'cc3' },
      { id: 'cce3', fromId: 'cc3', toId: 'cc4' },
      { id: 'cce4', fromId: 'cc4', toId: 'cc1', label: '2 tế bào con' },
    ],
  },
];

export const BiologyDiagramEditor: React.FC = () => {
  const [title, setTitle] = useState(TEMPLATES[0].name);
  const [nodes, setNodes] = useState<DiagramNode[]>(TEMPLATES[0].nodes);
  const [edges, setEdges] = useState<DiagramEdge[]>(TEMPLATES[0].edges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(TEMPLATES[0].nodes[0].id);
  const [connectFromId, setConnectFromId] = useState<string | null>(null);
  const [history, setHistory] = useState<{ nodes: DiagramNode[]; edges: DiagramEdge[] }[]>([]);
  const [future, setFuture] = useState<{ nodes: DiagramNode[]; edges: DiagramEdge[] }[]>([]);
  const [savedList, setSavedList] = useState<SavedDiagramRecord[]>([]);
  const [showFormulaModal, setShowFormulaModal] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const dragStateRef = useRef<{ id: string; dx: number; dy: number } | null>(null);

  useEffect(() => {
    storageService.getSavedDiagrams().then(setSavedList);
  }, []);

  const pushHistory = (nextNodes: DiagramNode[], nextEdges: DiagramEdge[]) => {
    setHistory((h) => [...h.slice(-20), { nodes, edges }]);
    setFuture([]);
    setNodes(nextNodes);
    setEdges(nextEdges);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setFuture((f) => [...f, { nodes, edges }]);
    setHistory((h) => h.slice(0, -1));
    setNodes(prev.nodes);
    setEdges(prev.edges);
  };

  const handleRedo = () => {
    if (future.length === 0) return;
    const next = future[future.length - 1];
    setHistory((h) => [...h, { nodes, edges }]);
    setFuture((f) => f.slice(0, -1));
    setNodes(next.nodes);
    setEdges(next.edges);
  };

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) ?? null;

  const handleLoadTemplate = (tplId: string) => {
    const tpl = TEMPLATES.find((t) => t.id === tplId);
    if (!tpl) return;
    setTitle(tpl.name);
    pushHistory(
      tpl.nodes.map((n) => ({ ...n })),
      tpl.edges.map((e) => ({ ...e })),
    );
    setSelectedNodeId(tpl.nodes[0]?.id ?? null);
  };

  const handleAddNode = () => {
    const id = `node-${Date.now()}`;
    const newNode: DiagramNode = {
      id,
      x: 120 + (nodes.length % 4) * 50,
      y: 80 + (nodes.length % 3) * 60,
      w: 190,
      h: 72,
      text: 'Khối nội dung mới',
      color: '#0D9488',
      shape: 'rounded',
    };
    pushHistory([...nodes, newNode], edges);
    setSelectedNodeId(id);
  };

  const handleDeleteSelected = () => {
    if (!selectedNodeId) return;
    pushHistory(
      nodes.filter((n) => n.id !== selectedNodeId),
      edges.filter((e) => e.fromId !== selectedNodeId && e.toId !== selectedNodeId),
    );
    setSelectedNodeId(null);
  };

  const handleSaveToDb = async () => {
    const record: SavedDiagramRecord = {
      id: `diag-${Date.now()}`,
      title: title.trim() || 'Sơ đồ Sinh học chưa đặt tên',
      templateType: 'custom',
      nodesJson: JSON.stringify(nodes),
      edgesJson: JSON.stringify(edges),
      updatedAt: new Date().toISOString(),
    };
    await storageService.saveDiagram(record);
    const updated = await storageService.getSavedDiagrams();
    setSavedList(updated);
    setStatusMsg('Đã lưu sơ đồ vào bộ nhớ ngoại tuyến trình duyệt.');
  };

  const getSvgString = () => {
    if (!svgRef.current) return '';
    const clone = svgRef.current.cloneNode(true) as SVGSVGElement;
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    return new XMLSerializer().serializeToString(clone);
  };

  const handleExportSvg = () => {
    const markup = getSvgString();
    if (!markup) return;
    const blob = new Blob([markup], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'so-do-sinh-hoc.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportPng = () => {
    const markup = getSvgString();
    if (!markup) return;
    const blob = new Blob([markup], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1800;
      canvas.height = 880;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      canvas.toBlob((png) => {
        if (!png) return;
        const pUrl = URL.createObjectURL(png);
        const a = document.createElement('a');
        a.href = pUrl;
        a.download = 'so-do-sinh-hoc.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(pUrl);
      }, 'image/png');
    };
    img.src = url;
  };

  const handlePointerMoveSvg = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!dragStateRef.current || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const scaleX = 900 / rect.width;
    const scaleY = 440 / rect.height;
    const nextX = Math.max(10, Math.min(720, (e.clientX - rect.left) * scaleX - dragStateRef.current.dx));
    const nextY = Math.max(10, Math.min(350, (e.clientY - rect.top) * scaleY - dragStateRef.current.dy));
    const targetId = dragStateRef.current.id;
    setNodes((prev) => prev.map((n) => (n.id === targetId ? { ...n, x: nextX, y: nextY } : n)));
  };

  return (
    <div className="space-y-5">
      {/* Toolbar & Template Selector */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex-1 min-w-[240px]">
            <label className="block font-semibold text-slate-800 text-ui-min mb-1">Tên sơ đồ bài giảng:</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-slate-300 text-slate-900 font-semibold text-ui-body"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-5">
            <button
              type="button"
              onClick={handleAddNode}
              className="min-h-[44px] px-3.5 py-2 rounded-lg bg-teal-700 text-white hover:bg-teal-800 inline-flex items-center gap-1.5 font-semibold text-ui-min"
            >
              <Plus className="w-4 h-4" /> Thêm khối
            </button>
            <button
              type="button"
              onClick={() => {
                if (!selectedNodeId) return;
                setConnectFromId(connectFromId ? null : selectedNodeId);
              }}
              className={`min-h-[44px] px-3.5 py-2 rounded-lg border font-medium text-ui-min ${
                connectFromId ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-800 border-slate-300'
              }`}
            >
              {connectFromId ? 'Nhấp khối đích để nối mũi tên' : 'Nối mũi tên'}
            </button>
            <button
              type="button"
              onClick={handleUndo}
              disabled={history.length === 0}
              className="min-h-[44px] px-3 py-2 rounded-lg border border-slate-300 bg-white disabled:opacity-40 inline-flex items-center gap-1 text-ui-min"
            >
              <Undo2 className="w-4 h-4" /> Hoàn tác
            </button>
            <button
              type="button"
              onClick={handleRedo}
              disabled={future.length === 0}
              className="min-h-[44px] px-3 py-2 rounded-lg border border-slate-300 bg-white disabled:opacity-40 inline-flex items-center gap-1 text-ui-min"
            >
              <Redo2 className="w-4 h-4" /> Làm lại
            </button>
            <button
              type="button"
              onClick={handleSaveToDb}
              className="min-h-[44px] px-3.5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 inline-flex items-center gap-1.5 font-semibold text-ui-min"
            >
              <Save className="w-4 h-4" /> Lưu sơ đồ
            </button>
            <button
              type="button"
              onClick={handleExportSvg}
              className="min-h-[44px] px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 inline-flex items-center gap-1.5 text-ui-min"
            >
              <Download className="w-4 h-4" /> Xuất SVG
            </button>
            <button
              type="button"
              onClick={handleExportPng}
              className="min-h-[44px] px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 inline-flex items-center gap-1.5 text-ui-min"
            >
              <FileImage className="w-4 h-4" /> Xuất PNG
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200">
          <span className="font-semibold text-slate-700 text-ui-min py-2">Mẫu sơ đồ có sẵn:</span>
          {TEMPLATES.map((tpl) => (
            <button
              key={tpl.id}
              type="button"
              onClick={() => handleLoadTemplate(tpl.id)}
              className="min-h-[44px] px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-teal-50 text-slate-800 border border-slate-200 text-ui-min font-medium"
            >
              {tpl.name}
            </button>
          ))}
        </div>

        {statusMsg && (
          <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-ui-min font-medium">
            {statusMsg}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Interactive SVG Canvas */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-3">
          <svg
            ref={svgRef}
            viewBox="0 0 900 440"
            className="w-full h-[420px] bg-slate-50 rounded-lg border border-slate-200 touch-none select-none"
            onPointerMove={handlePointerMoveSvg}
            onPointerUp={() => {
              dragStateRef.current = null;
            }}
          >
            <defs>
              <marker id="bio-arrow" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#334155" />
              </marker>
            </defs>

            {/* Edges */}
            {edges.map((edge) => {
              const from = nodes.find((n) => n.id === edge.fromId);
              const to = nodes.find((n) => n.id === edge.toId);
              if (!from || !to) return null;
              const x1 = from.x + from.w / 2;
              const y1 = from.y + from.h / 2;
              const x2 = to.x + to.w / 2;
              const y2 = to.y + to.h / 2;
              const mx = (x1 + x2) / 2;
              const my = (y1 + y2) / 2;
              return (
                <g key={edge.id}>
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="#334155"
                    strokeWidth={2.5}
                    markerEnd="url(#bio-arrow)"
                  />
                  {edge.label && (
                    <g transform={`translate(${mx}, ${my - 12})`}>
                      <rect x={-55} y={-14} width={110} height={24} rx={6} fill="#FFFFFF" stroke="#CBD5E1" />
                      <text x={0} y={3} textAnchor="middle" fontSize={15} fontWeight={600} fill="#0F172A">
                        {edge.label}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

            {/* Nodes */}
            {nodes.map((node) => {
              const isSel = node.id === selectedNodeId;
              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  style={{ cursor: 'grab' }}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    if (connectFromId && connectFromId !== node.id) {
                      const newEdge: DiagramEdge = {
                        id: `edge-${Date.now()}`,
                        fromId: connectFromId,
                        toId: node.id,
                        label: 'Liên kết',
                      };
                      pushHistory(nodes, [...edges, newEdge]);
                      setConnectFromId(null);
                      return;
                    }
                    setSelectedNodeId(node.id);
                    if (!svgRef.current) return;
                    const rect = svgRef.current.getBoundingClientRect();
                    const scaleX = 900 / rect.width;
                    const scaleY = 440 / rect.height;
                    dragStateRef.current = {
                      id: node.id,
                      dx: (e.clientX - rect.left) * scaleX - node.x,
                      dy: (e.clientY - rect.top) * scaleY - node.y,
                    };
                  }}
                >
                  <rect
                    width={node.w}
                    height={node.h}
                    rx={node.shape === 'rect' ? 4 : node.shape === 'circle' ? 36 : 14}
                    fill={node.color}
                    stroke={isSel ? '#0F172A' : '#FFFFFF'}
                    strokeWidth={isSel ? 3.5 : 2}
                  />
                  <text
                    x={node.w / 2}
                    y={node.h / 2 + 5}
                    textAnchor="middle"
                    fontSize={16}
                    fontWeight={700}
                    fill="#FFFFFF"
                  >
                    {node.text.length > 26 ? `${node.text.slice(0, 24)}…` : node.text}
                  </text>
                </g>
              );
            })}
          </svg>
          <p className="text-slate-600 text-ui-min mt-2">
            Kéo thả trực tiếp các khối trên bảng để sắp xếp bố cục. Nhấp vào khối để sửa nội dung hoặc chèn công thức.
          </p>
        </div>

        {/* Node Inspector & Saved Diagrams */}
        <div className="lg:col-span-4 space-y-4">
          {selectedNode ? (
            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-ui-card-title">Chỉnh sửa khối đang chọn</h3>
                <button
                  type="button"
                  onClick={handleDeleteSelected}
                  className="min-h-[44px] px-3 py-1.5 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 inline-flex items-center gap-1 text-ui-min"
                >
                  <Trash2 className="w-4 h-4" /> Xóa
                </button>
              </div>

              <label className="block space-y-1">
                <span className="font-medium text-slate-800 text-ui-min">Nội dung chữ:</span>
                <input
                  type="text"
                  value={selectedNode.text}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNodes((prev) => prev.map((n) => (n.id === selectedNode.id ? { ...n, text: val } : n)));
                  }}
                  className="w-full min-h-[44px] px-3 rounded-lg border border-slate-300 text-ui-body"
                />
              </label>

              <div className="grid grid-cols-2 gap-2">
                <label className="space-y-1">
                  <span className="font-medium text-slate-800 text-ui-min">Màu khối:</span>
                  <select
                    value={selectedNode.color}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNodes((prev) => prev.map((n) => (n.id === selectedNode.id ? { ...n, color: val } : n)));
                    }}
                    className="w-full min-h-[44px] px-2 rounded-lg border border-slate-300 text-ui-min"
                  >
                    <option value="#0D9488">Xanh ngọc</option>
                    <option value="#2563EB">Xanh dương</option>
                    <option value="#16A34A">Xanh lá</option>
                    <option value="#D97706">Hổ phách</option>
                    <option value="#DC2626">Đỏ</option>
                    <option value="#78350F">Nâu</option>
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="font-medium text-slate-800 text-ui-min">Chiều rộng:</span>
                  <input
                    type="number"
                    min={120}
                    max={340}
                    step={10}
                    value={selectedNode.w}
                    onChange={(e) => {
                      const val = Math.max(120, Math.min(340, Number(e.target.value) || 180));
                      setNodes((prev) => prev.map((n) => (n.id === selectedNode.id ? { ...n, w: val } : n)));
                    }}
                    className="w-full min-h-[44px] px-2 rounded-lg border border-slate-300 font-mono-tabular text-ui-min"
                  />
                </label>
              </div>

              <button
                type="button"
                onClick={() => setShowFormulaModal(true)}
                className="w-full min-h-[44px] px-4 py-2 rounded-lg border border-teal-600 text-teal-800 bg-teal-50 hover:bg-teal-100 font-semibold text-ui-min"
              >
                Gắn công thức Sinh học trực quan vào khối
              </button>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl p-4 text-slate-600 text-ui-body">
              Nhấp vào một khối trên sơ đồ để chỉnh sửa nhãn, màu sắc hoặc kích thước.
            </div>
          )}

          {savedList.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
              <h4 className="font-bold text-slate-900 text-ui-label">Sơ đồ đã lưu ({savedList.length})</h4>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {savedList.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200">
                    <button
                      type="button"
                      onClick={() => {
                        setTitle(item.title);
                        setNodes(JSON.parse(item.nodesJson));
                        setEdges(JSON.parse(item.edgesJson));
                      }}
                      className="text-left font-medium text-slate-800 hover:text-teal-700 text-ui-min flex-1"
                    >
                      {item.title}
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await storageService.deleteDiagram(item.id);
                        setSavedList(await storageService.getSavedDiagrams());
                      }}
                      className="min-h-[44px] px-2 text-rose-600 text-ui-min"
                    >
                      Xóa
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showFormulaModal && selectedNode && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="max-w-3xl w-full bg-white rounded-2xl p-5 shadow-xl">
            <BiologyFormulaEditor
              initialLatex={selectedNode.latex ?? 'p^2 + 2pq + q^2 = 1'}
              title={`Chèn công thức vào khối: ${selectedNode.text}`}
              onCancel={() => setShowFormulaModal(false)}
              onApply={(newLatex) => {
                const { svgMarkup } = renderLatexToSvg(newLatex, false);
                if (svgMarkup || newLatex) {
                  setNodes((prev) =>
                    prev.map((n) =>
                      n.id === selectedNode.id
                        ? { ...n, latex: newLatex, text: newLatex.replace(/\\mathrm\{([^}]*)\}/g, '$1').slice(0, 28) }
                        : n,
                    ),
                  );
                }
                setShowFormulaModal(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
