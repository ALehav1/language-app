import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
              </Routes>
            </div>
          </RouteGuard>
        </BrowserRouter>
      </ToastProvider>
    </LanguageProvider>
  </React.StrictMode>
);
