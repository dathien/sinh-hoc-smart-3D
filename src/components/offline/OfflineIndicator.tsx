import React from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { useOnlineStatus } from './useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) {
    return (
      <span
        role="status"
        aria-live="polite"
        title="Đang kết nối trực tuyến"
        className="inline-flex items-center gap-1.5 min-h-[40px] px-2.5 py-1.5 rounded-lg bg-emerald-50/90 border border-emerald-200 text-emerald-900 font-medium text-ui-min select-none shrink-0"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" aria-hidden="true" />
        <Wifi className="w-4 h-4 text-emerald-700 shrink-0" aria-hidden="true" />
        <span>Trực tuyến</span>
      </span>
    );
  }

  return (
    <span
      role="status"
      aria-live="polite"
      title="Đang ngoại tuyến – Dữ liệu đã lưu sẵn sàng sử dụng"
      className="inline-flex items-center gap-1.5 min-h-[40px] px-2.5 py-1.5 rounded-lg bg-amber-50 border border-amber-300 text-amber-950 font-semibold text-ui-min select-none shrink-0"
    >
      <span className="w-2 h-2 rounded-full bg-amber-600 shrink-0" aria-hidden="true" />
      <WifiOff className="w-4 h-4 text-amber-700 shrink-0" aria-hidden="true" />
      <span>Ngoại tuyến</span>
    </span>
  );
};
