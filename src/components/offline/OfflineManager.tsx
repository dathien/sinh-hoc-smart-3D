import React, { useEffect, useState } from 'react';
import { CheckCircle2, Database, Download, HardDrive, Trash2 } from 'lucide-react';
import { CURRICULUM_LESSONS } from '../../data/curriculum/lessons';
import { FORMULA_LIBRARY } from '../../data/formulas/formulaLibrary';
import { LAB_DEFINITIONS } from '../../data/labsMeta';
import { storageService } from '../../services/storage/indexedDb';
import { OfflinePackageInfo } from '../../types/biology';

const BASE_PACKAGES: Omit<OfflinePackageInfo, 'status' | 'progress'>[] = [
  { id: 'pkg-curriculum-10', title: 'Gói 01 · Bài học & Thuật ngữ Sinh học 10', description: 'Tế bào, Sinh học phân tử cơ bản, Phân bào, Vi sinh vật & Virus.', estimatedSizeKB: 420 },
  { id: 'pkg-curriculum-11', title: 'Gói 02 · Bài học & Thuật ngữ Sinh học 11', description: 'Trao đổi chất, Quang hợp C3–C4–CAM, Tuần hoàn, Hô hấp, Cảm ứng.', estimatedSizeKB: 460 },
  { id: 'pkg-curriculum-12', title: 'Gói 03 · Bài học & Thuật ngữ Sinh học 12', description: 'Di truyền phân tử, Quy luật Mendel, Quần thể, Tiến hóa, Sinh thái.', estimatedSizeKB: 510 },
  { id: 'pkg-formulas', title: 'Gói 04 · Thư viện 15+ Công thức & Ký hiệu Sinh học', description: 'Dữ liệu MathJax SVG và bộ ký hiệu MathLive soạn thảo ngoại tuyến.', estimatedSizeKB: 380 },
  { id: 'pkg-anatomy', title: 'Gói 05 · Dữ liệu Lab 01 – Giải phẫu người 3D', description: 'Tim đập, Phổi – Cơ hoành và cấu hình nạp mô hình GLB.', estimatedSizeKB: 340 },
  { id: 'pkg-cell', title: 'Gói 06 · Dữ liệu Lab 02 – Thế giới Tế bào & Màng', description: 'Tế bào nhân thực/nhân sơ, Ti thể, Lục lạp, Vận chuyển qua màng.', estimatedSizeKB: 390 },
  { id: 'pkg-virus', title: 'Gói 07 · Dữ liệu Lab 03 – Virus & Vi sinh vật', description: '6 mô hình virus (T4, SARS-CoV-2, Cúm A, HIV-1, Adenovirus, TMV).', estimatedSizeKB: 310 },
  { id: 'pkg-molbio', title: 'Gói 08 · Dữ liệu Lab 04 – DNA, RNA & Protein', description: 'Bảng 64 codon, Phiên mã, Dịch mã, Operon lac.', estimatedSizeKB: 290 },
  { id: 'pkg-1bna', title: 'Gói 09 · Mẫu phân tử 1BNA ngoại tuyến (3Dmol.js)', description: 'Tọa độ PDB tinh thể tia X phân tử B-DNA xoắn kép 1BNA.', estimatedSizeKB: 180 },
  { id: 'pkg-division', title: 'Gói 10 · Dữ liệu Lab 06 – Phân bào 3D', description: 'Nguyên phân, Giảm phân I & II, bảng theo dõi NST và chromatid.', estimatedSizeKB: 260 },
  { id: 'pkg-plant-animal', title: 'Gói 11 · Dữ liệu Lab 07 & 08 – Sinh lí Thực vật & Động vật', description: 'Mạch gỗ, Khí khổng, Tuần hoàn, Nephron, Synapse.', estimatedSizeKB: 370 },
  { id: 'pkg-genetics-evo', title: 'Gói 12 · Dữ liệu Lab 09 & 10 – Di truyền & Tiến hóa', description: 'Bảng Punnett, Hardy–Weinberg, Mô phỏng quần thể có seed.', estimatedSizeKB: 280 },
  { id: 'pkg-ecology', title: 'Gói 13 · Dữ liệu Lab 11 – Sinh thái học 3D', description: '5 hệ sinh thái, Tháp năng lượng và Chu trình vật chất.', estimatedSizeKB: 300 },
  { id: 'pkg-wetlab', title: 'Gói 14 · Dữ liệu Lab 12 – 7 Thí nghiệm Thực hành Ảo', description: 'Quy trình chuẩn Lugol, Biuret, Benedict, Amylase, Co nguyên sinh.', estimatedSizeKB: 320 },
];

export const OfflineManager: React.FC = () => {
  const [packages, setPackages] = useState<OfflinePackageInfo[]>(() =>
    BASE_PACKAGES.map((b) => ({ ...b, status: 'not-downloaded', progress: 0 })),
  );
  const [storageUsageText, setStorageUsageText] = useState('Đang kiểm tra dung lượng trình duyệt...');

  const refreshState = async () => {
    const saved = await storageService.getOfflinePackages();
    const map = new Map(saved.map((s) => [s.id, s]));
    setPackages(
      BASE_PACKAGES.map((b) => {
        const hit = map.get(b.id);
        return hit
          ? { ...b, status: hit.status, progress: hit.progress, updatedAt: hit.updatedAt }
          : { ...b, status: 'not-downloaded', progress: 0 };
      }),
    );

    if (navigator.storage?.estimate) {
      const est = await navigator.storage.estimate();
      const usedMB = ((est.usage ?? 0) / (1024 * 1024)).toFixed(2);
      const quotaMB = ((est.quota ?? 0) / (1024 * 1024)).toFixed(0);
      setStorageUsageText(`Đã dùng ${usedMB} MB / Giới hạn cấp phát ${quotaMB} MB`);
    } else {
      setStorageUsageText('Trình duyệt đã bật lưu trữ ngoại tuyến IndexedDB');
    }
  };

  useEffect(() => {
    refreshState();
  }, []);

  const buildPayloadForPackage = (pkgId: string) => {
    if (pkgId === 'pkg-curriculum-10') return CURRICULUM_LESSONS.filter((l) => l.grade === 10);
    if (pkgId === 'pkg-curriculum-11') return CURRICULUM_LESSONS.filter((l) => l.grade === 11);
    if (pkgId === 'pkg-curriculum-12') return CURRICULUM_LESSONS.filter((l) => l.grade === 12);
    if (pkgId === 'pkg-formulas') return FORMULA_LIBRARY;
    return { labs: LAB_DEFINITIONS, cachedAt: new Date().toISOString() };
  };

  const downloadPackage = async (pkg: OfflinePackageInfo) => {
    setPackages((prev) =>
      prev.map((p) => (p.id === pkg.id ? { ...p, status: 'downloading', progress: 45 } : p)),
    );
    const payload = buildPayloadForPackage(pkg.id);

    // Also cache core app assets in Cache Storage if available
    if (typeof caches !== 'undefined') {
      try {
        const cache = await caches.open('sinh-hoc-smart-offline-v1');
        await cache.put(
          `/offline-pack/${pkg.id}.json`,
          new Response(JSON.stringify(payload), {
            headers: { 'Content-Type': 'application/json' },
          }),
        );
      } catch {
        // IndexedDB fallback below still guarantees persistence
      }
    }

    await storageService.saveOfflinePackage({
      ...pkg,
      status: 'ready',
      progress: 100,
      updatedAt: new Date().toLocaleString('vi-VN'),
      payload,
    });
    await refreshState();
  };

  const downloadAll = async () => {
    for (const pkg of packages) {
      if (pkg.status !== 'ready') {
        await downloadPackage(pkg);
      }
    }
  };

  const removePackage = async (id: string) => {
    await storageService.deleteOfflinePackage(id);
    if (typeof caches !== 'undefined') {
      try {
        const cache = await caches.open('sinh-hoc-smart-offline-v1');
        await cache.delete(`/offline-pack/${id}.json`);
      } catch {
        // ignore
      }
    }
    await refreshState();
  };

  const readyCount = packages.filter((p) => p.status === 'ready').length;

  return (
    <div className="space-y-5">
      <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="font-bold text-slate-900 text-ui-lab inline-flex items-center gap-2.5">
            <Database className="w-7 h-7 text-teal-700" />
            Quản lí Dữ liệu Học tập Ngoại tuyến (Offline PWA)
          </h2>
          <p className="text-slate-600 text-ui-body">
            Tải trước bài học, công thức và dữ liệu thí nghiệm vào IndexedDB & Cache Storage để dạy học ngay cả khi phòng học không có Internet.
          </p>
          <div className="inline-flex items-center gap-2 text-slate-700 font-medium text-ui-min pt-1">
            <HardDrive className="w-4 h-4 text-blue-600" />
            <span>{storageUsageText}</span>
            <span>·</span>
            <span>Đã sẵn sàng {readyCount}/14 gói dữ liệu</span>
          </div>
        </div>

        <button
          type="button"
          onClick={downloadAll}
          className="min-h-[48px] px-5 py-2.5 rounded-xl bg-teal-700 text-white hover:bg-teal-800 font-semibold inline-flex items-center gap-2 text-ui-button shadow-sm"
        >
          <Download className="w-5 h-5" />
          Tải toàn bộ 14 gói dùng ngoại tuyến
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {packages.map((pkg) => (
          <div
            key={pkg.id}
            className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between gap-3"
          >
            <div className="space-y-1">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-bold text-slate-900 text-ui-card-title">{pkg.title}</h3>
                {pkg.status === 'ready' && (
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-ui-min shrink-0">
                    <CheckCircle2 className="w-4 h-4" /> Sẵn sàng
                  </span>
                )}
              </div>
              <p className="text-slate-600 text-ui-min">{pkg.description}</p>
              <div className="text-slate-500 font-mono-tabular text-ui-min">
                Ước tính: ~{pkg.estimatedSizeKB} KB {pkg.updatedAt ? `· Cập nhật: ${pkg.updatedAt}` : ''}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              {pkg.status === 'ready' ? (
                <button
                  type="button"
                  onClick={() => removePackage(pkg.id)}
                  className="min-h-[44px] px-3.5 py-2 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 inline-flex items-center gap-1.5 text-ui-min font-medium"
                >
                  <Trash2 className="w-4 h-4" /> Xóa bộ nhớ đệm
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => downloadPackage(pkg)}
                  disabled={pkg.status === 'downloading'}
                  className="min-h-[44px] px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 inline-flex items-center gap-1.5 text-ui-min font-semibold"
                >
                  <Download className="w-4 h-4" />
                  {pkg.status === 'downloading' ? 'Đang tải...' : 'Tải xuống gói này'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
