import React from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { useOnlineStatus } from './useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 font-medium text-ui-min">
        <Wifi className="w-4 h-4 text-emerald-700" />
        Trực tuyến
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-300 text-amber-950 font-semibold text-ui-min">
      <WifiOff className="w-4 h-4 text-amber-700" />
      Ngoại tuyến (Dữ liệu đã lưu sẵn sàng)
    </span>
  );
};
