import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import { LessonFeed } from './features/lessons/LessonFeed';
import { ExerciseView } from './features/exercises/ExerciseView';
import { MyVocabularyView } from './features/vocabulary/MyVocabularyView';
import { BottomNav } from './components/BottomNav';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <div className="min-h-screen bg-surface-300 pb-16">
        <Routes>
          <Route path="/" element={<LessonFeed />} />
          <Route path="/exercise/:lessonId" element={<ExerciseView />} />
          <Route path="/saved" element={<MyVocabularyView />} />
        </Routes>
        <BottomNav />
      </div>
    </BrowserRouter>
  </React.StrictMode>
);
