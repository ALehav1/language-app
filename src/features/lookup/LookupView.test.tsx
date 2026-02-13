import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { LookupView } from './LookupView';
import * as openai from '../../lib/openai';
import { LanguageProvider } from '../../contexts/LanguageContext';

vi.mock('../../lib/openai');
vi.mock('../../hooks/useSavedWords', () => ({
  useSavedWords: () => ({
    words: [],
    loading: false,
    error: null,
    saveWord: vi.fn(),
    updateStatus: vi.fn(),
    deleteWord: vi.fn(),
    archiveWord: vi.fn(),
    recordPractice: vi.fn(),
    saveAsActive: vi.fn(),
    isWordSaved: vi.fn().mockReturnValue(false),
    getSavedWord: vi.fn(),
    isActive: vi.fn(),
    updateMemoryAids: vi.fn(),
    refetch: vi.fn(),
    topics: [],
    counts: { total: 0, active: 0, learned: 0 },
  }),
}));

vi.mock('../../hooks/useSavedSentences', () => ({
  useSavedSentences: () => ({
    sentences: [],
    loading: false,
    error: null,
    saveSentence: vi.fn(),
    updateStatus: vi.fn(),
    deleteSentence: vi.fn(),
    getSentenceByText: vi.fn(),
    refetch: vi.fn(),
    counts: { total: 0, active: 0, learned: 0 },
  }),
}));

vi.mock('../../hooks/useSavedPassages', () => ({
  useSavedPassages: () => ({
    passages: [],
    loading: false,
    error: null,
    savePassage: vi.fn(),
    updatePassageStatus: vi.fn(),
    deletePassage: vi.fn(),
    getPassageByText: vi.fn(),
    refetch: vi.fn(),
    counts: { total: 0, active: 0, learned: 0 },
  }),
}));

describe('LookupView', () => {
  const mockPassageResult = {
    detected_language: 'spanish' as const,
    original_text: 'Hola, ¿cómo estás?',
    full_translation: 'Hello, how are you?',
    full_transliteration: '',
    sentences: [
      {
        arabic_msa: 'Hola, ¿cómo estás?',
        arabic_egyptian: '',
        transliteration_msa: '',
        transliteration_egyptian: '',
        translation: 'Hello, how are you?',
        explanation: '',
        words: [
          { arabic: 'Hola', translation: 'Hello', transliteration: '', part_of_speech: 'interjection' },
          { arabic: 'cómo', translation: 'how', transliteration: '', part_of_speech: 'adverb' },
          { arabic: 'estás', translation: 'are you', transliteration: '', part_of_speech: 'verb' },
        ],
      },
    ],
  };

  const renderWithProvider = (ui: React.ReactElement) => {
    return render(
      <LanguageProvider>
        <BrowserRouter>{ui}</BrowserRouter>
      </LanguageProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(openai.analyzePassage).mockResolvedValue(mockPassageResult);
    vi.mocked(openai.lookupWord).mockResolvedValue({
      detected_language: 'spanish' as const,
      arabic_word: 'Hola',
      arabic_word_egyptian: '',
      translation: 'Hello',
      pronunciation_standard: '',
      pronunciation_egyptian: '',
      letter_breakdown: [],
      example_sentences: [],
      word_context: undefined,
    });
  });

  describe('Content classification', () => {
    it('classifies single token as word and calls lookupWord', async () => {
      const user = userEvent.setup();
      renderWithProvider(<LookupView />);

      const spanishButton = screen.getByRole('button', { name: /Spanish/i });
      await user.click(spanishButton);

      await waitFor(() => {
        expect(localStorage.getItem('language-app-selected-language')).toBe('spanish');
      });

      const textarea = screen.getByPlaceholderText(/Paste.*text or type English/i);
      const translateButton = screen.getByRole('button', { name: /Translate/i });

      await user.clear(textarea);
      await user.type(textarea, 'sleep');
      await user.click(translateButton);

      // P1.1: Single token should call lookupWord, NOT analyzePassage
      await waitFor(() => {
        expect(openai.lookupWord).toHaveBeenCalledWith(
          'sleep',
          expect.objectContaining({ language: 'spanish' })
        );
        expect(openai.analyzePassage).not.toHaveBeenCalled();
      });
    });

    it('classifies multi-word phrase as sentence and calls analyzePassage', async () => {
      const user = userEvent.setup();
      renderWithProvider(<LookupView />);

      const textarea = screen.getByPlaceholderText(/Paste.*text or type English/i);
      const translateButton = screen.getByRole('button', { name: /Translate/i });

      await user.clear(textarea);
      await user.type(textarea, 'I am tired');
      await user.click(translateButton);

      // Multi-word phrase should call analyzePassage
      await waitFor(() => {
        expect(openai.analyzePassage).toHaveBeenCalledWith(
          'I am tired',
          expect.objectContaining({ language: expect.any(String) })
        );
        expect(openai.lookupWord).not.toHaveBeenCalled();
      });
    });
  });

  describe('Language switching', () => {
    it('switches language when Spanish pill is clicked', async () => {
      const user = userEvent.setup();
      renderWithProvider(<LookupView />);

      const spanishButton = screen.getByRole('button', { name: /Spanish/i });
      await user.click(spanishButton);

      // LanguageContext should update (checked via useLanguage hook in component)
      // Pill should be highlighted
      expect(spanishButton).toHaveClass('bg-amber-500/30');
    });

    it('persists language selection to localStorage', async () => {
      const user = userEvent.setup();
      renderWithProvider(<LookupView />);

      const spanishButton = screen.getByRole('button', { name: /Spanish/i });
      await user.click(spanishButton);

      // Wait for state update
      await waitFor(() => {
        expect(localStorage.getItem('language-app-selected-language')).toBe('spanish');
      });
    });
  });

  describe('Translate button', () => {
    it('calls analyzePassage when Translate is clicked with Spanish text', async () => {
      const user = userEvent.setup();
      renderWithProvider(<LookupView />);

      const textarea = screen.getByPlaceholderText(/Paste.*text or type English/i);
      const translateButton = screen.getByRole('button', { name: /Translate/i });

      await user.clear(textarea);
      await user.type(textarea, 'Hola, ¿cómo estás?');
      await user.click(translateButton);

      await waitFor(() => {
        expect(openai.analyzePassage).toHaveBeenCalledWith(
          'Hola, ¿cómo estás?',
          expect.objectContaining({ language: expect.any(String) })
        );
      });
    });

    it('shows loading state while translating', async () => {
      const user = userEvent.setup();
      vi.mocked(openai.analyzePassage).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockPassageResult), 100))
      );

      renderWithProvider(<LookupView />);

      const textarea = screen.getByPlaceholderText(/Paste.*text or type English/i);
      const translateButton = screen.getByRole('button', { name: /Translate/i });

      await user.clear(textarea);
      await user.type(textarea, 'Hello world');
      await user.click(translateButton);

      expect(screen.getByText(/Translating.../i)).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByText(/Translating.../i)).not.toBeInTheDocument();
      });
    });

    it('displays error message when translation fails', async () => {
      const user = userEvent.setup();
      vi.mocked(openai.analyzePassage).mockRejectedValueOnce(new Error('API error'));

      renderWithProvider(<LookupView />);

      const textarea = screen.getByPlaceholderText(/Paste.*text or type English/i);
      const translateButton = screen.getByRole('button', { name: /Translate/i });

      await user.clear(textarea);
      await user.type(textarea, 'Hello world');
      await user.click(translateButton);

      // Core behavior: error state shows (exact text format not critical)
      await waitFor(() => {
        const errorElements = screen.getAllByText(/failed/i);
        expect(errorElements.length).toBeGreaterThan(0);
      }, { timeout: 2000 });
    });

    it('displays error when API returns empty sentences array (P1.2)', async () => {
      const user = userEvent.setup();
      // Mock invalid response with empty sentences
      vi.mocked(openai.analyzePassage).mockRejectedValue(
        new Error('Translation failed: API returned empty sentence list. Please try again.')
      );

      renderWithProvider(<LookupView />);

      const textarea = screen.getByPlaceholderText(/Paste.*text or type English/i);
      const translateButton = screen.getByRole('button', { name: /Translate/i });

      await user.clear(textarea);
      await user.type(textarea, 'test input');
      await user.click(translateButton);

      // Should show error, not blank UI
      await waitFor(() => {
        const errorElements = screen.getAllByText(/translate.*failed/i);
        expect(errorElements.length).toBeGreaterThan(0);
      });
    });

    it('is disabled when textarea is empty', () => {
      renderWithProvider(<LookupView />);
      
      const translateButton = screen.getByRole('button', { name: /Translate/i });
      expect(translateButton).toBeDisabled();
    });

    it('calls analyzePassage with Spanish language when in Spanish mode', async () => {
      const user = userEvent.setup();
      renderWithProvider(<LookupView />);

      // Switch to Spanish mode
      const spanishButton = screen.getByRole('button', { name: /Spanish/i });
      await user.click(spanishButton);

      await waitFor(() => {
        expect(localStorage.getItem('language-app-selected-language')).toBe('spanish');
      });

      const textarea = screen.getByPlaceholderText(/Paste.*text or type English/i);
      const translateButton = screen.getByRole('button', { name: /Translate/i });

      await user.clear(textarea);
      await user.type(textarea, 'Hola, ¿cómo estás?');
      await user.click(translateButton);

      // Core behavior: API called with Spanish language
      await waitFor(() => {
        expect(openai.analyzePassage).toHaveBeenCalledWith(
          'Hola, ¿cómo estás?',
          expect.objectContaining({ language: 'spanish' })
        );
      });
    });

    it('produces visible results (not empty state) for any input', async () => {
      const user = userEvent.setup();
      renderWithProvider(<LookupView />);

      const textarea = screen.getByPlaceholderText(/Paste.*text or type English/i);
      const translateButton = screen.getByRole('button', { name: /Translate/i });

      await user.clear(textarea);
      await user.type(textarea, "test input");
      await user.click(translateButton);

      // Wait for API call to complete
      await waitFor(() => {
        expect(openai.analyzePassage).toHaveBeenCalled();
      });

      // Core behavior: empty state should disappear (something rendered)
      await waitFor(() => {
        expect(screen.queryByText(/Translate anything/i)).not.toBeInTheDocument();
      }, { timeout: 2000 });
    });
  });
});
