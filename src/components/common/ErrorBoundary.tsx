import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallbackTitle?: string },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode; fallbackTitle?: string }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, message: error?.message || 'Đã xảy ra lỗi hiển thị mô-đun.' };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 space-y-3 text-rose-950">
          <div className="flex items-center gap-2 font-bold text-ui-card-title">
            <AlertCircle className="w-6 h-6 text-rose-700" />
            <span>{this.props.fallbackTitle ?? 'Không thể hiển thị nội dung này'}</span>
          </div>
          <p className="text-ui-body">{this.state.message}</p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, message: '' })}
            className="min-h-[44px] px-4 py-2 rounded-lg bg-rose-700 text-white font-semibold inline-flex items-center gap-2 text-ui-min"
          >
            <RotateCcw className="w-4 h-4" /> Thử tải lại
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
