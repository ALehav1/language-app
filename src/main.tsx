import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import { MainMenu } from './features/home/MainMenu';
import { LessonFeed } from './features/lessons/LessonFeed';
import { ExerciseView } from './features/exercises/ExerciseView';
import { MyVocabularyView } from './features/vocabulary/MyVocabularyView';
import { MySentencesView } from './features/sentences/MySentencesView';
import { MyPassagesView } from './features/passages/MyPassagesView';
import { LookupView } from './features/lookup/LookupView';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <div className="min-h-screen bg-surface-300">
        <Routes>
          <Route path="/" element={<MainMenu />} />
          <Route path="/lessons" element={<LessonFeed />} />
          <Route path="/exercise/:lessonId" element={<ExerciseView />} />
          <Route path="/words" element={<MyVocabularyView />} />
          <Route path="/saved" element={<MyVocabularyView />} /> {/* Legacy route */}
          <Route path="/sentences" element={<MySentencesView />} />
          <Route path="/passages" element={<MyPassagesView />} />
          <Route path="/lookup" element={<LookupView />} />
        </Routes>
      </div>
    </BrowserRouter>
  </React.StrictMode>
);
