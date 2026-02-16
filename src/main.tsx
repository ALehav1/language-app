import React, { lazy, Suspense, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import './index.css';
import { LanguageProvider } from './contexts/LanguageContext';
import { ToastProvider } from './contexts/ToastContext';
import { LanguageBadge } from './components/LanguageBadge';
import { RouteGuard } from './components/RouteGuard';
import { ErrorBoundary } from './components/ErrorBoundary';

// Route-level code splitting — each page loads on demand
const MainMenu = lazy(() => import('./features/home/MainMenu').then(m => ({ default: m.MainMenu })));
const LessonLibrary = lazy(() => import('./features/lessons/LessonLibrary').then(m => ({ default: m.LessonLibrary })));
const ExerciseView = lazy(() => import('./features/exercises/ExerciseView').then(m => ({ default: m.ExerciseView })));
const VocabularyLanding = lazy(() => import('./features/vocabulary/VocabularyLanding').then(m => ({ default: m.VocabularyLanding })));
const MyVocabularyView = lazy(() => import('./features/vocabulary/MyVocabularyView').then(m => ({ default: m.MyVocabularyView })));
const MySentencesView = lazy(() => import('./features/sentences/MySentencesView').then(m => ({ default: m.MySentencesView })));
const MyPassagesView = lazy(() => import('./features/passages/MyPassagesView').then(m => ({ default: m.MyPassagesView })));
const LookupView = lazy(() => import('./features/lookup/LookupView').then(m => ({ default: m.LookupView })));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
      <div className="text-6xl mb-4">404</div>
      <h1 className="text-2xl font-bold text-white mb-2">Page not found</h1>
      <p className="text-white/50 mb-6 max-w-xs">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link
        to="/"
        className="btn-primary px-6 py-3 rounded-xl font-semibold"
      >
        Go Home
      </Link>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LanguageProvider>
      <ToastProvider>
        <BrowserRouter>
          <ScrollToTop />
          <ErrorBoundary>
          <Suspense fallback={
            <div className="min-h-screen bg-surface-300 flex items-center justify-center">
              <div className="text-white/60 text-lg">Loading...</div>
            </div>
          }>
          <RouteGuard>
            <div className="min-h-screen bg-surface-300">
              <LanguageBadge />
              <Routes>
              <Route path="/" element={<MainMenu />} />
              <Route path="/lessons" element={<LessonLibrary />} />
              <Route path="/exercise/:lessonId" element={<ExerciseView />} />
              <Route path="/vocabulary" element={<VocabularyLanding />} />
              <Route path="/vocabulary/word" element={<MyVocabularyView />} />
              <Route path="/vocabulary/sentence" element={<MySentencesView />} />
              <Route path="/vocabulary/dialog" element={<MySentencesView />} />
              <Route path="/vocabulary/passage" element={<MyPassagesView />} />
              <Route path="/words" element={<Navigate to="/vocabulary/word" replace />} />
              <Route path="/saved" element={<Navigate to="/vocabulary/word" replace />} />
              <Route path="/sentences" element={<Navigate to="/vocabulary/sentence" replace />} />
              <Route path="/passages" element={<Navigate to="/vocabulary/passage" replace />} />
              <Route path="/lookup" element={<LookupView />} />
              <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
          </RouteGuard>
          </Suspense>
          </ErrorBoundary>
        </BrowserRouter>
      </ToastProvider>
    </LanguageProvider>
  </React.StrictMode>
);
