import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import './index.css';
import { LanguageProvider } from './contexts/LanguageContext';
import { ToastProvider } from './contexts/ToastContext';
import { LanguageBadge } from './components/LanguageBadge';
import { RouteGuard } from './components/RouteGuard';
import { MainMenu } from './features/home/MainMenu';
import { LessonLibrary } from './features/lessons/LessonLibrary';
import { ExerciseView } from './features/exercises/ExerciseView';
import { VocabularyLanding } from './features/vocabulary/VocabularyLanding';
import { MyVocabularyView } from './features/vocabulary/MyVocabularyView';
import { MySentencesView } from './features/sentences/MySentencesView';
import { MyPassagesView } from './features/passages/MyPassagesView';
import { LookupView } from './features/lookup/LookupView';

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
        </BrowserRouter>
      </ToastProvider>
    </LanguageProvider>
  </React.StrictMode>
);
