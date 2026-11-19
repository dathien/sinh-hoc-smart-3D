/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useState } from 'react';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { AppLayout } from './components/layout/AppLayout';
import { GlobalSmartLabelProvider } from './context/SmartLabelContext';
import { LAB_DEFINITIONS } from './data/labsMeta';
import { CurriculumGradePage } from './pages/CurriculumGradePage';
import { FormulaAndDiagramPage } from './pages/FormulaAndDiagramPage';
import { GuidePage } from './pages/GuidePage';
import { HomePage } from './pages/HomePage';
import { LabsHubPage } from './pages/LabsHubPage';
import { ModelLibraryPage } from './pages/ModelLibraryPage';
import { OfflinePage } from './pages/OfflinePage';
import { AppPage, FontScaleMode, GradeLevel, LabId } from './types/biology';

interface NavState {
  page: AppPage;
  labId: LabId;
  lessonId: string | null;
}

const FONT_SCALE_KEY = 'sinh_hoc_smart_3d_font_scale';

export default function App() {
  const [nav, setNav] = useState<NavState>({
    page: 'home',
    labId: 'cell',
    lessonId: null,
  });
  const [history, setHistory] = useState<NavState[]>([]);
  const [fontScale, setFontScale] = useState<FontScaleMode>(() => {
    if (typeof window === 'undefined') return 'standard';
    const saved = window.localStorage.getItem(FONT_SCALE_KEY);
    if (saved === 'standard' || saved === 'large' || saved === 'presentation') return saved;
    return 'standard';
  });
  const [isPresentation, setIsPresentation] = useState(false);

  // Apply font scale class on <html>
  useEffect(() => {
    const html = document.documentElement;
    html.classList.remove('font-scale-standard', 'font-scale-large', 'font-scale-presentation');
    const activeScale = isPresentation ? 'presentation' : fontScale;
    html.classList.add(`font-scale-${activeScale}`);
    window.localStorage.setItem(FONT_SCALE_KEY, fontScale);
  }, [fontScale, isPresentation]);

  // ESC exits presentation mode
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isPresentation) {
        setIsPresentation(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isPresentation]);

  const pushNav = useCallback((next: NavState) => {
    setHistory((h) => [...h.slice(-15), nav]);
    setNav(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [nav]);

  const handleNavigatePage = (page: AppPage) => {
    pushNav({ ...nav, page, lessonId: null });
  };

  const handleOpenLab = (labId: LabId) => {
    pushNav({ page: 'labs', labId, lessonId: null });
  };

  const handleOpenLesson = (grade: GradeLevel, lessonId: string) => {
    const page: AppPage = grade === 10 ? 'grade10' : grade === 11 ? 'grade11' : 'grade12';
    pushNav({ ...nav, page, lessonId });
  };

  const handleBack = () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setNav(prev);
  };

  const breadcrumbLabel =
    nav.page === 'labs'
      ? LAB_DEFINITIONS.find((l) => l.id === nav.labId)?.title
      : undefined;

  return (
    <GlobalSmartLabelProvider
      isPresentation={isPresentation}
      onChangePresentation={setIsPresentation}
    >
      <AppLayout
        currentPage={nav.page}
        breadcrumbLabel={breadcrumbLabel}
        canGoBack={history.length > 0}
        onBack={handleBack}
        onNavigate={handleNavigatePage}
        fontScale={fontScale}
        onChangeFontScale={setFontScale}
        isPresentation={isPresentation}
        onTogglePresentation={() => setIsPresentation((v) => !v)}
      >
        <ErrorBoundary>
          {nav.page === 'home' && (
            <HomePage
              onNavigatePage={handleNavigatePage}
              onOpenLab={handleOpenLab}
              onOpenLesson={handleOpenLesson}
            />
          )}

          {(nav.page === 'grade10' || nav.page === 'grade11' || nav.page === 'grade12') && (
            <CurriculumGradePage
              grade={nav.page === 'grade10' ? 10 : nav.page === 'grade11' ? 11 : 12}
              selectedLessonId={nav.lessonId}
              onSelectLesson={(lessonId) => setNav((s) => ({ ...s, lessonId }))}
              onOpenLab={handleOpenLab}
            />
          )}

          {nav.page === 'labs' && (
            <LabsHubPage
              activeLabId={nav.labId}
              onSelectLab={(labId) => setNav((s) => ({ ...s, labId }))}
            />
          )}

          {nav.page === 'models' && <ModelLibraryPage onOpenLab={handleOpenLab} />}

          {(nav.page === 'formulas' || nav.page === 'diagrams') && (
            <FormulaAndDiagramPage
              initialTab={nav.page === 'diagrams' ? 'diagrams' : 'formulas'}
            />
          )}

          {nav.page === 'guide' && (
            <GuidePage onOpenLab={handleOpenLab} onNavigatePage={handleNavigatePage} />
          )}

          {nav.page === 'offline' && <OfflinePage />}
        </ErrorBoundary>
      </AppLayout>
    </GlobalSmartLabelProvider>
  );
}
