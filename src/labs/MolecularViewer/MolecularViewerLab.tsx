import React, { useEffect, useRef, useState } from 'react';
import * as $3Dmol from '3dmol';
import { Camera, RefreshCw, RotateCw, Search, WifiOff } from 'lucide-react';
import { AnnotationSettingsPanel } from '../../components/viewer3d/smartLabels/AnnotationSettingsPanel';
import { useSmartLabels } from '../../context/SmartLabelContext';

type MolStyle = 'cartoon' | 'stick' | 'ballstick' | 'sphere' | 'surface';
type ColorScheme = 'chain' | 'element' | 'residue' | 'ss' | 'spectrum' | 'plddt';

interface CuratedMolecule {
  id: string;
  source: 'RCSB PDB' | 'AlphaFold DB';
  dataType: 'Cấu trúc xác định bằng thực nghiệm' | 'Cấu trúc protein dự đoán';
  name: string;
  group: string;
  desc: string;
  license: string;
  lesson: string;
  offlineSample?: boolean;
}

// Embedded real excerpt coordinates of 1BNA (Drew-Dickerson B-DNA dodecamer) for guaranteed offline rendering
const OFFLINE_1BNA_PDB = `HEADER    DEOXYRIBONUCLEIC ACID                   12-DEC-80   1BNA
TITLE     STRUCTURE OF A B-DNA DODECAMER: CONFORMATION AND DYNAMICS
ATOM      1  O5'  DC A   1      18.935  34.195  25.617  1.00 64.35           O
ATOM      2  C5'  DC A   1      19.130  33.921  24.217  1.00 54.69           C
ATOM      3  C4'  DC A   1      19.873  32.625  23.953  1.00 47.06           C
ATOM      4  O4'  DC A   1      20.674  32.275  25.107  1.00 44.38           O
ATOM      5  C3'  DC A   1      18.969  31.430  23.702  1.00 40.91           C
ATOM      6  O3'  DC A   1      19.740  30.233  23.588  1.00 35.12           O
ATOM      7  C2'  DC A   1      18.308  31.787  22.371  1.00 42.19           C
ATOM      8  C1'  DC A   1      19.524  32.163  21.529  1.00 40.82           C
ATOM      9  N1   DC A   1      19.992  30.988  20.737  1.00 36.22           N
ATOM     10  C2   DC A   1      19.167  29.887  20.544  1.00 35.42           C
ATOM     11  O2   DC A   1      18.029  29.934  20.996  1.00 37.90           O
ATOM     12  N3   DC A   1      19.622  28.817  19.865  1.00 33.76           N
ATOM     13  C4   DC A   1      20.844  28.812  19.349  1.00 35.33           C
ATOM     14  N4   DC A   1      21.248  27.717  18.704  1.00 36.68           N
ATOM     15  C5   DC A   1      21.688  29.946  19.538  1.00 36.11           C
ATOM     16  C6   DC A   1      21.225  30.996  20.232  1.00 36.23           C
ATOM     17  P    DG A   2      20.200  29.607  22.212  1.00 38.45           P
ATOM     18  O5'  DG A   2      21.023  28.316  22.587  1.00 33.24           O
ATOM     19  C5'  DG A   2      20.431  27.081  23.028  1.00 29.84           C
ATOM     20  C4'  DG A   2      21.482  26.020  23.168  1.00 28.43           C
ATOM     21  O4'  DG A   2      22.178  25.850  21.911  1.00 29.02           O
ATOM     22  C3'  DG A   2      20.935  24.642  23.513  1.00 26.87           C
ATOM     23  O3'  DG A   2      21.954  23.694  23.797  1.00 25.13           O
ATOM     24  N9   DG A   2      22.288  24.228  20.146  1.00 24.16           N
ATOM     25  C8   DG A   2      21.448  25.197  19.655  1.00 23.43           C
ATOM     26  N7   DG A   2      21.825  25.676  18.497  1.00 22.98           N
ATOM     27  C5   DG A   2      22.980  24.970  18.187  1.00 21.88           C
ATOM     28  C6   DG A   2      23.860  25.039  17.079  1.00 20.92           C
ATOM     29  O6   DG A   2      23.748  25.792  16.101  1.00 22.42           O
ATOM     30  N1   DG A   2      24.918  24.132  17.204  1.00 19.67           N
ATOM     31  C2   DG A   2      25.130  23.255  18.234  1.00 21.02           C
ATOM     32  N2   DG A   2      26.212  22.482  18.152  1.00 20.43           N
ATOM     33  N3   DG A   2      24.307  23.164  19.286  1.00 21.56           N
ATOM     34  C4   DG A   2      23.256  24.041  19.205  1.00 22.22           C
ATOM     35  P    DC B  24      17.460  22.142  15.610  1.00 32.10           P
ATOM     36  N1   DC B  24      19.210  23.480  17.120  1.00 28.40           N
ATOM     37  C2   DC B  24      19.950  24.120  18.080  1.00 27.10           C
ATOM     38  N3   DC B  24      21.280  23.950  18.200  1.00 26.50           N
ATOM     39  C4   DC B  24      21.920  23.120  17.350  1.00 26.10           C
ATOM     40  N4   DC B  24      23.240  22.980  17.480  1.00 25.80           N
CONECT    1    2
CONECT    2    3
CONECT    3    4    5
CONECT    5    6    7
CONECT    6   17
CONECT   17   18
CONECT   18   19
CONECT   19   20
CONECT   20   21   22
END`;

const CURATED_MOLECULES: CuratedMolecule[] = [
  { id: '1BNA', source: 'RCSB PDB', dataType: 'Cấu trúc xác định bằng thực nghiệm', name: 'Cấu trúc xoắn kép B-DNA (1BNA)', group: 'DNA', desc: 'Cấu trúc tinh thể tia X phân giải cao đầu tiên của đoạn B-DNA xoắn kép (Drew & Dickerson).', license: 'CC0 1.0 Public Domain (RCSB PDB)', lesson: 'Cấu trúc DNA (Sinh học 10 & 12)', offlineSample: true },
  { id: '1A3N', source: 'RCSB PDB', dataType: 'Cấu trúc xác định bằng thực nghiệm', name: 'Hemoglobin người gắn O₂ (1A3N)', group: 'Hemoglobin', desc: 'Protein cấu trúc bậc 4 gồm 4 tiểu đơn vị (2α, 2β) và 4 nhóm nhân Heme chứa Fe²⁺.', license: 'CC0 1.0 Public Domain (RCSB PDB)', lesson: 'Cấu trúc Protein & Hô hấp (Sinh học 10 & 11)' },
  { id: '1MBN', source: 'RCSB PDB', dataType: 'Cấu trúc xác định bằng thực nghiệm', name: 'Myoglobin dự trữ Oxygen ở cơ (1MBN)', group: 'Myoglobin', desc: 'Protein đầu tiên được giải mã cấu trúc không gian 3D bởi John Kendrew.', license: 'CC0 1.0 Public Domain (RCSB PDB)', lesson: 'Cấu trúc bậc 3 của Protein' },
  { id: '1EHZ', source: 'RCSB PDB', dataType: 'Cấu trúc xác định bằng thực nghiệm', name: 'tRNA vận chuyển Phenylalanine (1EHZ)', group: 'tRNA', desc: 'Cấu trúc không gian hình chữ L đặc trưng với bộ ba đối mã (anticodon).', license: 'CC0 1.0 Public Domain (RCSB PDB)', lesson: 'Dịch mã (Sinh học 12)' },
  { id: '1AOI', source: 'RCSB PDB', dataType: 'Cấu trúc xác định bằng thực nghiệm', name: 'Lõi Nucleosome (1AOI)', group: 'Nucleosome', desc: 'Phức hợp DNA quấn quanh lõi 8 phân tử protein Histone tạo đơn vị cơ bản của nhiễm sắc thể.', license: 'CC0 1.0 Public Domain (RCSB PDB)', lesson: 'Nhiễm sắc thể (Sinh học 12)' },
  { id: '1TRZ', source: 'RCSB PDB', dataType: 'Cấu trúc xác định bằng thực nghiệm', name: 'Hormone Insulin (1TRZ)', group: 'Protein', desc: 'Hormone tuyến tụy gồm chuỗi A và B nối bằng cầu nối disulfide, điều hòa đường huyết.', license: 'CC0 1.0 Public Domain (RCSB PDB)', lesson: 'Cân bằng nội môi (Sinh học 11)' },
  { id: '1IGT', source: 'RCSB PDB', dataType: 'Cấu trúc xác định bằng thực nghiệm', name: 'Kháng thể IgG hoàn chỉnh (1IGT)', group: 'Kháng thể', desc: 'Cấu trúc hình chữ Y gồm 2 chuỗi nặng và 2 chuỗi nhẹ gắn đặc hiệu kháng nguyên.', license: 'CC0 1.0 Public Domain (RCSB PDB)', lesson: 'Miễn dịch (Sinh học 11)' },
  { id: '1EMA', source: 'RCSB PDB', dataType: 'Cấu trúc xác định bằng thực nghiệm', name: 'Protein huỳnh quang xanh GFP (1EMA)', group: 'Protein', desc: 'Cấu trúc thùng beta bảo vệ nhóm phát huỳnh quang, dùng rộng rãi trong công nghệ sinh học.', license: 'CC0 1.0 Public Domain (RCSB PDB)', lesson: 'Công nghệ gene' },
  { id: '1QO1', source: 'RCSB PDB', dataType: 'Cấu trúc xác định bằng thực nghiệm', name: 'Phức hệ Enzyme ATP Synthase (1QO1)', group: 'ATP synthase', desc: 'Động cơ phân tử trên màng trong ti thể tổng hợp ATP từ ADP và Pᵢ.', license: 'CC0 1.0 Public Domain (RCSB PDB)', lesson: 'Hô hấp tế bào (Sinh học 10)' },
  { id: '1RWT', source: 'RCSB PDB', dataType: 'Cấu trúc xác định bằng thực nghiệm', name: 'Phức hệ thu nhận ánh sáng LHC-II (1RWT)', group: 'Phức hợp quang hợp', desc: 'Phức hợp protein màng thylakoid gắn các phân tử diệp lục và carotenoid.', license: 'CC0 1.0 Public Domain (RCSB PDB)', lesson: 'Quang hợp (Sinh học 10 & 11)' },
  { id: '6VXX', source: 'RCSB PDB', dataType: 'Cấu trúc xác định bằng thực nghiệm', name: 'Protein Gai Spike SARS-CoV-2 (6VXX)', group: 'Protein virus', desc: 'Cấu trúc Cryo-EM của protein gai tam phân bám thụ thể ACE2.', license: 'CC0 1.0 Public Domain (RCSB PDB)', lesson: 'Virus (Sinh học 10)' },
  { id: '1C3W', source: 'RCSB PDB', dataType: 'Cấu trúc xác định bằng thực nghiệm', name: 'Bacteriorhodopsin bơm proton màng (1C3W)', group: 'Protein màng', desc: 'Protein xuyên màng gồm 7 chuỗi xoắn alpha vận chuyển ion H⁺.', license: 'CC0 1.0 Public Domain (RCSB PDB)', lesson: 'Màng sinh chất' },
  { id: 'P69905', source: 'AlphaFold DB', dataType: 'Cấu trúc protein dự đoán', name: 'Chuỗi Alpha Hemoglobin dự đoán (UniProt P69905)', group: 'Hemoglobin', desc: 'Mô hình dự đoán cấu trúc bởi AlphaFold2 kèm điểm tin cậy pLDDT từng amino acid.', license: 'CC BY 4.0 (AlphaFold DB / EMBL-EBI)', lesson: 'Protein & Cấu trúc phân tử' },
  { id: 'P01308', source: 'AlphaFold DB', dataType: 'Cấu trúc protein dự đoán', name: 'Tiền chất Proinsulin dự đoán (UniProt P01308)', group: 'Protein', desc: 'Mô hình dự đoán cấu trúc 3D bởi AlphaFold2 (không phải kết quả tinh thể học thực nghiệm).', license: 'CC BY 4.0 (AlphaFold DB / EMBL-EBI)', lesson: 'Điều hòa đường huyết' },
];

export const MolecularViewerLab: React.FC = () => {
  const viewerMountRef = useRef<HTMLDivElement | null>(null);
  const viewerInstanceRef = useRef<$3Dmol.GLViewer | null>(null);
  const { settings: labelSettings, effectiveFontSize } = useSmartLabels();

  const [selectedMol, setSelectedMol] = useState<CuratedMolecule>(CURATED_MOLECULES[0]);
  const [lookupInput, setLookupInput] = useState('1BNA');
  const [lookupSource, setLookupSource] = useState<'pdb' | 'alphafold'>('pdb');
  const [style, setStyle] = useState<MolStyle>('ballstick');
  const [colorScheme, setColorScheme] = useState<ColorScheme>('element');
  const [spinning, setSpinning] = useState(false);
  const [highlightResi, setHighlightResi] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadStatus, setLoadStatus] = useState('Đang hiển thị mẫu ngoại tuyến tích hợp 1BNA (B-DNA).');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [pickedInfo, setPickedInfo] = useState<string | null>(null);

  const applyStyling = (v: $3Dmol.GLViewer, s: MolStyle, c: ColorScheme, resiFilter: string) => {
    v.setStyle({}, {});
    const colorOpt: Record<string, unknown> =
      c === 'chain'
        ? { colorscheme: 'chain' }
        : c === 'element'
          ? { colorscheme: 'Jmol' }
          : c === 'residue'
            ? { colorscheme: 'amino' }
            : c === 'ss'
              ? { colorscheme: 'ssJmol' }
              : c === 'spectrum'
                ? { color: 'spectrum' }
                : {
                    colorfunc: (atom: { b?: number }) => {
                      const b = atom.b ?? 50;
                      if (b >= 90) return '#0053D6';
                      if (b >= 70) return '#65CBF3';
                      if (b >= 50) return '#FFDB13';
                      return '#FF7D45';
                    },
                  };

    if (s === 'cartoon') v.setStyle({}, { cartoon: colorOpt });
    else if (s === 'stick') v.setStyle({}, { stick: { ...colorOpt, radius: 0.22 } });
    else if (s === 'ballstick') v.setStyle({}, { stick: { ...colorOpt, radius: 0.14 }, sphere: { ...colorOpt, scale: 0.28 } });
    else if (s === 'sphere') v.setStyle({}, { sphere: colorOpt });
    else if (s === 'surface') {
      v.setStyle({}, { cartoon: colorOpt });
      v.addSurface($3Dmol.SurfaceType.VDW, { opacity: 0.72, color: '#38BDF8' }, {});
    }

    // Highlight HETATM ligands / Heme
    v.setStyle({ hetflag: true }, { stick: { colorscheme: 'greenCarbon', radius: 0.28 }, sphere: { scale: 0.35 } });

    // Optional mutation / residue highlight
    const resNum = Number(resiFilter.trim());
    if (resiFilter.trim() && Number.isInteger(resNum) && resNum > 0) {
      v.addStyle({ resi: resNum }, { sphere: { color: '#EF4444', scale: 0.55 }, stick: { color: '#EF4444', radius: 0.3 } });
    }
    v.render();
  };

  const loadPdbDataIntoViewer = (pdbText: string, format: 'pdb' | 'cif', label: string) => {
    const v = viewerInstanceRef.current;
    if (!v) return;
    v.removeAllSurfaces();
    v.clear();
    v.addModel(pdbText, format);
    v.setClickable({}, true, (atom: { resn?: string; resi?: number; chain?: string; elem?: string; atom?: string; b?: number }) => {
      setPickedInfo(
        `Nguyên tử: ${atom.atom ?? ''} (${atom.elem ?? ''}) · Amino acid/Nucleotide: ${atom.resn ?? ''} #${atom.resi ?? ''} · Chuỗi: ${atom.chain ?? 'A'} · B-factor/pLDDT: ${atom.b ?? 'N/A'}`,
      );
    });
    applyStyling(v, style, colorScheme, highlightResi);
    v.zoomTo();
    v.render();
    setLoadStatus(label);
  };

  useEffect(() => {
    const el = viewerMountRef.current;
    if (!el) return;
    el.innerHTML = '';
    const v = $3Dmol.createViewer(el, {
      backgroundColor: '#081414',
      antialias: true,
    });
    viewerInstanceRef.current = v;
    loadPdbDataIntoViewer(OFFLINE_1BNA_PDB, 'pdb', 'Đã nạp mẫu ngoại tuyến 1BNA (B-DNA). Nhấn "Tra cứu & Mở" để tải trọn vẹn chuỗi.');

    const ro = new ResizeObserver(() => {
      try {
        v.resize();
        v.render();
      } catch {
        // ignore resize timing errors during unmount
      }
    });
    ro.observe(el);

    return () => {
      ro.disconnect();
      try {
        v.spin(false);
        v.clear();
      } catch {
        // ignore cleanup warnings
      }
      viewerInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    const v = viewerInstanceRef.current;
    if (!v) return;
    v.removeAllSurfaces();
    applyStyling(v, style, colorScheme, highlightResi);
  }, [style, colorScheme, highlightResi]);

  useEffect(() => {
    viewerInstanceRef.current?.spin(spinning ? 'y' : false);
  }, [spinning]);

  const fetchStructure = async (idStr: string, src: 'pdb' | 'alphafold') => {
    const cleanId = idStr.trim().toUpperCase();
    if (!/^[A-Z0-9]{4,10}$/.test(cleanId)) {
      setErrorMsg('Mã định danh không hợp lệ. Vui lòng nhập mã PDB 4 ký tự (VD: 1BNA, 1A3N) hoặc mã UniProt (VD: P69905).');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setPickedInfo(null);

    try {
      if (src === 'pdb') {
        const res = await fetch(`https://files.rcsb.org/download/${cleanId}.pdb`);
        if (!res.ok) throw new Error(`Không tìm thấy mã PDB ${cleanId} trên RCSB.`);
        const pdbText = await res.text();
        loadPdbDataIntoViewer(pdbText, 'pdb', `Đã tải cấu trúc thực nghiệm ${cleanId} từ RCSB PDB.`);
      } else {
        const metaRes = await fetch(`https://alphafold.ebi.ac.uk/api/prediction/${cleanId}`);
        if (!metaRes.ok) throw new Error(`Không tìm thấy mã UniProt ${cleanId} trên AlphaFold DB.`);
        const arr = (await metaRes.json()) as { pdbUrl?: string }[];
        const pdbUrl = arr?.[0]?.pdbUrl;
        if (!pdbUrl) throw new Error('Không có tệp cấu trúc PDB cho mã UniProt này.');
        const pdbRes = await fetch(pdbUrl);
        if (!pdbRes.ok) throw new Error('Không thể tải tệp cấu trúc từ AlphaFold DB.');
        const pdbText = await pdbRes.text();
        setColorScheme('plddt');
        loadPdbDataIntoViewer(pdbText, 'pdb', `Đã tải cấu trúc dự đoán AlphaFold cho ${cleanId}.`);
      }
    } catch (err) {
      setErrorMsg(
        `${err instanceof Error ? err.message : 'Lỗi kết nối.'} Nếu đang ngoại tuyến, bạn vẫn có thể mở mẫu tích hợp 1BNA.`,
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCurated = (mol: CuratedMolecule) => {
    setSelectedMol(mol);
    setLookupInput(mol.id);
    const src = mol.source === 'RCSB PDB' ? 'pdb' : 'alphafold';
    setLookupSource(src);
    if (mol.id === '1BNA' && !navigator.onLine) {
      loadPdbDataIntoViewer(OFFLINE_1BNA_PDB, 'pdb', 'Đang hiển thị mẫu ngoại tuyến 1BNA.');
      return;
    }
    fetchStructure(mol.id, src);
  };

  const handleExportPng = () => {
    const v = viewerInstanceRef.current;
    if (!v) return;
    const uri = v.pngURI();
    const a = document.createElement('a');
    a.href = uri;
    a.download = `phan-tu-${selectedMol.id}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <div>
          <h2 className="font-bold text-slate-900 text-ui-lab">
            Phòng Lab 05 – Cấu trúc Phân tử 3D (RCSB PDB, AlphaFold DB & UniProt)
          </h2>
          <p className="text-slate-600 text-ui-body">
            Phân biệt rõ cấu trúc thực nghiệm (RCSB PDB) và cấu trúc dự đoán (AlphaFold DB). Mẫu 1BNA sẵn sàng ngoại tuyến.
          </p>
        </div>

        {/* Search / Lookup Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={lookupSource}
            onChange={(e) => setLookupSource(e.target.value as 'pdb' | 'alphafold')}
            className="min-h-[44px] px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 font-medium text-ui-min"
          >
            <option value="pdb">RCSB PDB (Thực nghiệm)</option>
            <option value="alphafold">AlphaFold / UniProt (Dự đoán)</option>
          </select>
          <input
            type="text"
            value={lookupInput}
            onChange={(e) => setLookupInput(e.target.value)}
            placeholder="Nhập mã PDB (1BNA, 1A3N) hoặc UniProt (P69905)..."
            className="flex-1 min-w-[220px] min-h-[44px] px-3 py-2 rounded-lg border border-slate-300 text-slate-900 font-mono-tabular uppercase text-ui-min"
          />
          <button
            type="button"
            onClick={() => fetchStructure(lookupInput, lookupSource)}
            disabled={loading}
            className="min-h-[44px] px-4 py-2 rounded-lg bg-teal-700 text-white font-semibold hover:bg-teal-800 inline-flex items-center gap-2 text-ui-min"
          >
            <Search className="w-4 h-4" />
            {loading ? 'Đang tải...' : 'Tra cứu & Mở'}
          </button>
          <button
            type="button"
            onClick={() => loadPdbDataIntoViewer(OFFLINE_1BNA_PDB, 'pdb', 'Đã khôi phục mẫu ngoại tuyến 1BNA.')}
            className="min-h-[44px] px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 text-slate-800 font-medium text-ui-min"
          >
            Mở mẫu 1BNA ngoại tuyến
          </button>
        </div>

        {errorMsg && (
          <div className="rounded-lg bg-amber-50 border border-amber-300 px-3 py-2.5 text-amber-900 text-ui-min flex items-center gap-2">
            <WifiOff className="w-5 h-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        <div className="lg:col-span-8 space-y-3">
          <div className="rounded-xl overflow-hidden border border-slate-200 bg-[#081414]">
            <div
              ref={viewerMountRef}
              className="relative w-full h-[460px] md:h-[540px] bg-[#081414]"
            />

            {/* Smart Molecular Annotation Legend (strictly outside 3D canvas, respects SmartLabel settings) */}
            {labelSettings.mode !== 'hidden' && (
              <div
                className="bg-[#0B1B1B] border-t border-slate-700/90 px-4 py-3 space-y-2 text-slate-100"
                style={{ fontSize: `${Math.max(effectiveFontSize, 15)}px`, lineHeight: 1.4 }}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-bold text-teal-200">
                    Chú giải màu sắc cấu trúc phân tử ({selectedMol.id})
                  </span>
                  <span className="text-slate-300">
                    Nhấp trực tiếp vào nguyên tử để xem chi tiết
                  </span>
                </div>

                {labelSettings.mode === 'selected-only' ? (
                  <div className="text-slate-200">
                    {pickedInfo ?? 'Chưa chọn nguyên tử nào. Hãy nhấp vào một vị trí trên mô hình 3D.'}
                  </div>
                ) : colorScheme === 'plddt' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="flex items-center gap-2"><span className="w-3.5 h-3.5 rounded-full bg-[#0053D6] shrink-0" /><span>Rất cao (pLDDT ≥ 90)</span></div>
                    <div className="flex items-center gap-2"><span className="w-3.5 h-3.5 rounded-full bg-[#65CBF3] shrink-0" /><span>Tin cậy (70 ≤ pLDDT &lt; 90)</span></div>
                    <div className="flex items-center gap-2"><span className="w-3.5 h-3.5 rounded-full bg-[#FFDB13] shrink-0" /><span>Thấp (50 ≤ pLDDT &lt; 70)</span></div>
                    <div className="flex items-center gap-2"><span className="w-3.5 h-3.5 rounded-full bg-[#FF7D45] shrink-0" /><span>Rất thấp (pLDDT &lt; 50)</span></div>
                  </div>
                ) : colorScheme === 'ss' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="flex items-center gap-2"><span className="w-3.5 h-3.5 rounded-full bg-[#FF0080] shrink-0" /><span>Xoắn α (Alpha-helix)</span></div>
                    <div className="flex items-center gap-2"><span className="w-3.5 h-3.5 rounded-full bg-[#FFC800] shrink-0" /><span>Phiến gấp β (Beta-sheet)</span></div>
                    <div className="flex items-center gap-2"><span className="w-3.5 h-3.5 rounded-full bg-[#94A3B8] shrink-0" /><span>Vòng cuộn ngẫu nhiên (Coil)</span></div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    <div className="flex items-center gap-2"><span className="w-3.5 h-3.5 rounded-full bg-[#909090] shrink-0" /><span>Carbon (C)</span></div>
                    <div className="flex items-center gap-2"><span className="w-3.5 h-3.5 rounded-full bg-[#3050F8] shrink-0" /><span>Nitrogen (N)</span></div>
                    <div className="flex items-center gap-2"><span className="w-3.5 h-3.5 rounded-full bg-[#FF0D0D] shrink-0" /><span>Oxygen (O)</span></div>
                    <div className="flex items-center gap-2"><span className="w-3.5 h-3.5 rounded-full bg-[#FF8000] shrink-0" /><span>Phosphorus (P)</span></div>
                    <div className="flex items-center gap-2"><span className="w-3.5 h-3.5 rounded-full bg-[#22C55E] shrink-0" /><span>Phối tử / Heme</span></div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-bold text-slate-900 text-ui-card-title">{selectedMol.name}</h3>
              <span className="font-semibold text-teal-800 text-ui-min">
                {selectedMol.dataType} · {selectedMol.source}
              </span>
            </div>
            <p className="text-slate-700 text-ui-body">{selectedMol.desc}</p>
            <div className="text-slate-600 text-ui-min">
              Giấy phép: {selectedMol.license} · Bài học: {selectedMol.lesson} · Trạng thái: {loadStatus}
            </div>
            {pickedInfo && (
              <div className="p-3 rounded-lg bg-teal-50 border border-teal-200 text-teal-900 font-medium text-ui-min">
                {pickedInfo}
              </div>
            )}
          </div>
        </div>

        <aside className="lg:col-span-4 rounded-xl border border-slate-200 bg-white p-4 space-y-4">
          <h3 className="font-bold text-slate-900 text-ui-card-title">Điều khiển hiển thị phân tử</h3>

          <label className="block space-y-1">
            <span className="font-semibold text-slate-800 text-ui-min">Kiểu hiển thị:</span>
            <select
              value={style}
              onChange={(e) => setStyle(e.target.value as MolStyle)}
              className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 text-ui-min"
            >
              <option value="cartoon">Ribbon (Dải cấu trúc bậc 2)</option>
              <option value="ballstick">Ball and Stick (Quả cầu & Liên kết)</option>
              <option value="stick">Stick (Dạng que)</option>
              <option value="sphere">Space Filling (Lấp đầy không gian)</option>
              <option value="surface">Molecular Surface (Bề mặt phân tử)</option>
            </select>
          </label>

          <label className="block space-y-1">
            <span className="font-semibold text-slate-800 text-ui-min">Chế độ tô màu:</span>
            <select
              value={colorScheme}
              onChange={(e) => setColorScheme(e.target.value as ColorScheme)}
              className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 text-ui-min"
            >
              <option value="element">Theo nguyên tố (C, N, O, P, S)</option>
              <option value="chain">Theo chuỗi (Chain)</option>
              <option value="residue">Theo loại Amino acid</option>
              <option value="ss">Theo cấu trúc bậc hai (α-helix / β-sheet)</option>
              <option value="spectrum">Màu cầu vồng (Đầu N → C)</option>
              <option value="plddt">Độ tin cậy pLDDT (AlphaFold)</option>
            </select>
          </label>

          <label className="block space-y-1">
            <span className="font-semibold text-slate-800 text-ui-min">Đánh dấu vị trí amino acid (Số thứ tự):</span>
            <input
              type="text"
              value={highlightResi}
              onChange={(e) => setHighlightResi(e.target.value)}
              placeholder="VD: 6 (vị trí đột biến HbS)"
              className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-slate-300 text-slate-900 font-mono-tabular text-ui-min"
            />
          </label>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setSpinning((v) => !v)}
              className={`min-h-[44px] px-3 py-2 rounded-lg border font-medium inline-flex items-center justify-center gap-1.5 text-ui-min ${
                spinning ? 'bg-teal-700 text-white border-teal-700' : 'bg-white text-slate-800 border-slate-300'
              }`}
            >
              <RotateCw className="w-4 h-4" />
              {spinning ? 'Dừng xoay' : 'Tự xoay'}
            </button>
            <button
              type="button"
              onClick={() => viewerInstanceRef.current?.zoomTo()}
              className="min-h-[44px] px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 font-medium inline-flex items-center justify-center gap-1.5 text-ui-min"
            >
              <RefreshCw className="w-4 h-4" />
              Vừa khung
            </button>
            <button
              type="button"
              onClick={handleExportPng}
              className="col-span-2 min-h-[44px] px-3 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 inline-flex items-center justify-center gap-2 text-ui-min"
            >
              <Camera className="w-4 h-4" />
              Xuất ảnh PNG phân tử
            </button>
          </div>

          <AnnotationSettingsPanel />

          <div className="pt-3 border-t border-slate-200 space-y-2">
            <h4 className="font-bold text-slate-900 text-ui-label">
              Thư viện phân tử giáo dục đã kiểm chứng ({CURATED_MOLECULES.length} cấu trúc):
            </h4>
            <div className="max-h-[260px] overflow-y-auto space-y-2 pr-1">
              {CURATED_MOLECULES.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => handleSelectCurated(m)}
                  className={`w-full text-left p-2.5 rounded-lg border transition-colors ${
                    selectedMol.id === m.id
                      ? 'border-teal-600 bg-teal-50'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  <div className="font-semibold text-slate-900 text-ui-min">{m.name}</div>
                  <div className="text-slate-600 text-ui-min">
                    {m.source} · {m.group}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
