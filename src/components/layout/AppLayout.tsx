import React from 'react';
import { ArrowLeft, ChevronRight, Home } from 'lucide-react';
import { AppPage, FontScaleMode } from '../../types/biology';
import { MainNavigation } from './MainNavigation';

interface AppLayoutProps {
  currentPage: AppPage;
  breadcrumbLabel?: string;
  canGoBack: boolean;
  onBack: () => void;
  onNavigate: (page: AppPage) => void;
  fontScale: FontScaleMode;
  onChangeFontScale: (mode: FontScaleMode) => void;
  isPresentation: boolean;
  onTogglePresentation: () => void;
  children: React.ReactNode;
}

const PAGE_NAMES: Record<AppPage, string> = {
  home: 'Trang chủ',
  grade10: 'Sinh học 10',
  grade11: 'Sinh học 11',
  grade12: 'Sinh học 12',
  labs: 'Phòng Lab 3D',
  models: 'Thư viện mô hình',
  formulas: 'Thư viện Công thức & Trình soạn thảo',
  diagrams: 'Trình tạo Sơ đồ Sinh học',
  guide: 'Hướng dẫn sử dụng',
  offline: 'Quản lí dữ liệu ngoại tuyến',
};

export const AppLayout: React.FC<AppLayoutProps> = ({
  currentPage,
  breadcrumbLabel,
  canGoBack,
  onBack,
  onNavigate,
  fontScale,
  onChangeFontScale,
  isPresentation,
  onTogglePresentation,
  children,
}) => {
  return (
    <div className={`min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A] ${isPresentation ? 'presentation-active' : ''}`}>
      <MainNavigation
        currentPage={currentPage}
        onNavigate={onNavigate}
        fontScale={fontScale}
        onChangeFontScale={onChangeFontScale}
        isPresentation={isPresentation}
        onTogglePresentation={onTogglePresentation}
      />

      {currentPage !== 'home' && (
        <div className="max-w-[1440px] w-full mx-auto px-4 pt-4 flex flex-wrap items-center justify-between gap-3 no-print">
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-slate-600 text-ui-min">
            <button
              type="button"
              onClick={() => onNavigate('home')}
              className="min-h-[44px] inline-flex items-center gap-1 hover:text-teal-700 font-medium"
            >
              <Home className="w-4 h-4" /> Trang chủ
            </button>
            <ChevronRight className="w-4 h-4" />
            <span className="font-semibold text-slate-900">{PAGE_NAMES[currentPage]}</span>
            {breadcrumbLabel && (
              <>
                <ChevronRight className="w-4 h-4" />
                <span className="text-teal-800 font-semibold">{breadcrumbLabel}</span>
              </>
            )}
          </nav>

          {canGoBack && (
            <button
              type="button"
              onClick={onBack}
              className="min-h-[44px] px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-medium inline-flex items-center gap-1.5 text-ui-min"
            >
              <ArrowLeft className="w-4 h-4" /> Quay lại trang trước
            </button>
          )}
        </div>
      )}

      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 py-6">
        {children}
      </main>

      <footer className="bg-white border-t border-slate-200 py-5 px-4 mt-8 no-print">
        <div className="max-w-[1440px] mx-auto flex flex-wrap items-center justify-between gap-3 text-slate-700 text-ui-min">
          <div className="font-semibold text-slate-900">
            Copyright © 2026 – Phát triển bởi Thầy Hồ Nguyễn Đa Thiện.
          </div>
          <div className="text-slate-600">
            SINH HỌC SMART 3D · Chương trình GDPT 2018 (Lớp 10, 11, 12)
          </div>
        </div>
      </footer>
    </div>
  );
};
