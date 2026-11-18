import React, { useState } from 'react';
import { Download, Smartphone } from 'lucide-react';
import { usePWAInstall } from './usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { canInstall, isInstalled, promptInstall } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          if (canInstall) {
            promptInstall();
          } else {
            setShowGuide(true);
          }
        }}
        className="min-h-[44px] px-3.5 py-2 rounded-lg border border-teal-600 bg-teal-50 text-teal-900 hover:bg-teal-100 inline-flex items-center gap-2 font-semibold text-ui-min transition-colors"
      >
        <Download className="w-4 h-4 text-teal-700" />
        Cài đặt ứng dụng
      </button>

      {showGuide && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-white rounded-2xl p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center gap-2.5 text-teal-800">
              <Smartphone className="w-6 h-6" />
              <h3 className="font-bold text-ui-card-title">Hướng dẫn cài đặt SINH HỌC SMART 3D</h3>
            </div>
            <div className="space-y-2.5 text-slate-700 text-ui-body">
              <p>
                <strong>Trên máy tính (Chrome / Edge):</strong> Nhấn biểu tượng <em>Cài đặt (màn hình có dấu mũi tên)</em> ở góc phải thanh địa chỉ trình duyệt.
              </p>
              <p>
                <strong>Trên iPhone / iPad (Safari):</strong> Nhấn nút <em>Chia sẻ (Share)</em> ở thanh công cụ → chọn <em>Thêm vào Màn hình chính (Add to Home Screen)</em>.
              </p>
              <p>
                <strong>Trên Android (Chrome):</strong> Mở trình đơn 3 chấm → chọn <em>Cài đặt ứng dụng</em>.
              </p>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="min-h-[44px] px-5 py-2 rounded-lg bg-teal-700 text-white font-semibold text-ui-min"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
