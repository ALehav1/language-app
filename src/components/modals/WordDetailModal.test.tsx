import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WordDetailModal } from './WordDetailModal';
import type { WordSelectionContext } from '../../types/selection';
import * as openai from '../../lib/openai';
import { LanguageProvider } from '../../contexts/LanguageContext';
import * as useSavedWordsModule from '../../hooks/useSavedWords';

vi.mock('../../lib/openai');
vi.mock('../../hooks/useSavedWords');

describe('WordDetailModal', () => {
  const mockSelection: WordSelectionContext = {
    selectedText: 'مرحبا',
    parentSentence: 'مرحبا كيف حالك؟',
    sourceView: 'exercise',
    language: 'arabic',
    dialect: 'egyptian',
    contentType: 'sentence',
  };

  const mockLookupResult = {
    detected_language: 'arabic' as const,
    arabic_word: 'مرحبا',
    arabic_word_egyptian: 'مرحبا',
    translation: 'hello',
    pronunciation_standard: 'marḥaban',
    pronunciation_egyptian: 'marḥaba',
    letter_breakdown: [
      { letter: 'م', name: 'meem', sound: 'm' },
      { letter: 'ر', name: 'ra', sound: 'r' },
      { letter: 'ح', name: 'ḥa', sound: 'ḥ' },
      { letter: 'ب', name: 'ba', sound: 'b' },
      { letter: 'ا', name: 'alif', sound: 'a' },
    ],
    hebrew_cognate: {
      root: 'רחב',
      meaning: 'wide, spacious',
      notes: 'Related to welcoming with open arms',
    },
    example_sentences: [],
    word_context: undefined,
  };

  const mockSaveWord = vi.fn();

  const renderWithProvider = (ui: React.ReactElement) => {
    return render(<LanguageProvider>{ui}</LanguageProvider>);
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    vi.mocked(openai.lookupWord).mockImplementation(async () => mockLookupResult);
    
    vi.mocked(useSavedWordsModule.useSavedWords).mockReturnValue({
      words: [],
      loading: false,
      error: null,
      saveWord: mockSaveWord,
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
    });
  });

  describe('Modal behavior', () => {
    it('does not render when closed', () => {
      const { container } = renderWithProvider(
        <WordDetailModal
          isOpen={false}
          onClose={vi.fn()}
          selection={mockSelection}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('renders when open', () => {
      renderWithProvider(
        <WordDetailModal
          isOpen={true}
          onClose={vi.fn()}
          selection={mockSelection}
        />
      );

      expect(screen.getByText('Word Details')).toBeInTheDocument();
    });

    it('calls onClose when close button clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      renderWithProvider(
        <WordDetailModal
          isOpen={true}
          onClose={onClose}
          selection={mockSelection}
        />
      );

      const closeButton = screen.getByLabelText('Close');
      await user.click(closeButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when backdrop clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      const { container } = renderWithProvider(
        <WordDetailModal
          isOpen={true}
          onClose={onClose}
          selection={mockSelection}
        />
      );

      const backdrop = container.querySelector('.fixed.inset-0');
      if (backdrop) {
        await user.click(backdrop);
        expect(onClose).toHaveBeenCalledTimes(1);
      }
    });
  });

  describe('Word lookup and display', () => {
    it('fetches word details on open', async () => {
      renderWithProvider(
        <WordDetailModal
          isOpen={true}
          onClose={vi.fn()}
          selection={mockSelection}
        />
      );

      // Wait for word to appear in DOM (proves lookup completed)
      const wordElement = await screen.findByText('مرحبا', {}, { timeout: 3000 });
      expect(wordElement).toBeInTheDocument();
      
      expect(openai.lookupWord).toHaveBeenCalledWith('مرحبا', { language: 'arabic', dialect: 'egyptian' });
    });

    it('shows loading state while fetching', () => {
      renderWithProvider(
        <WordDetailModal
          isOpen={true}
          onClose={vi.fn()}
          selection={mockSelection}
        />
      );

      expect(screen.getByText('Loading word details...')).toBeInTheDocument();
    });

    it('displays word details after loading', async () => {
      renderWithProvider(
        <WordDetailModal
          isOpen={true}
          onClose={vi.fn()}
          selection={mockSelection}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('مرحبا')).toBeInTheDocument();
      });

      expect(screen.getByText('hello')).toBeInTheDocument();
      expect(screen.getByText('marḥaban')).toBeInTheDocument();
      expect(screen.getByText('marḥaba')).toBeInTheDocument();
    });

    it('displays context information', async () => {
      renderWithProvider(
        <WordDetailModal
          isOpen={true}
          onClose={vi.fn()}
          selection={mockSelection}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/From exercise/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/"مرحبا كيف حالك؟"/)).toBeInTheDocument();
    });

    it('displays Hebrew cognate for Arabic word when present', async () => {
      const wordSelection: WordSelectionContext = {
        ...mockSelection,
        contentType: 'word',
      };

      renderWithProvider(
        <WordDetailModal
          isOpen={true}
          onClose={vi.fn()}
          selection={wordSelection}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Hebrew Connection')).toBeInTheDocument();
      });

      expect(screen.getByText('רחב')).toBeInTheDocument();
      expect(screen.getByText('wide, spacious')).toBeInTheDocument();
    });

    it('hides Hebrew cognate for Arabic sentence even when present', async () => {
      renderWithProvider(
        <WordDetailModal
          isOpen={true}
          onClose={vi.fn()}
          selection={mockSelection}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('مرحبا')).toBeInTheDocument();
      });

      expect(screen.queryByText('Hebrew Connection')).not.toBeInTheDocument();
      expect(screen.queryByText('רחב')).not.toBeInTheDocument();
    });

    it('hides Hebrew cognate for Spanish word even when present', async () => {
      const spanishSelection: WordSelectionContext = {
        selectedText: 'hola',
        parentSentence: 'hola amigo',
        sourceView: 'exercise',
        language: 'spanish',
        dialect: 'latam',
        contentType: 'word',
      };

      renderWithProvider(
        <WordDetailModal
          isOpen={true}
          onClose={vi.fn()}
          selection={spanishSelection}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('مرحبا')).toBeInTheDocument();
      });

      expect(screen.queryByText('Hebrew Connection')).not.toBeInTheDocument();
    });

    it('displays letter breakdown', async () => {
      renderWithProvider(
        <WordDetailModal
          isOpen={true}
          onClose={vi.fn()}
          selection={mockSelection}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Letter Breakdown')).toBeInTheDocument();
      });

      expect(screen.getByText('م')).toBeInTheDocument();
      expect(screen.getByText('meem')).toBeInTheDocument();
      expect(screen.getByText('/m/')).toBeInTheDocument();
    });

    it('handles lookup error gracefully', async () => {
      vi.mocked(openai.lookupWord).mockRejectedValue(new Error('API Error'));

      renderWithProvider(
        <WordDetailModal
          isOpen={true}
          onClose={vi.fn()}
          selection={mockSelection}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('API Error')).toBeInTheDocument();
      });
    });
  });

  describe('Save functionality', () => {
    it('shows save button after word loads', async () => {
      renderWithProvider(
        <WordDetailModal
          isOpen={true}
          onClose={vi.fn()}
          selection={mockSelection}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Save to My Vocabulary')).toBeInTheDocument();
      });
    });

    it('calls saveWord with correct parameters when save clicked', async () => {
      const user = userEvent.setup();

      renderWithProvider(
        <WordDetailModal
          isOpen={true}
          onClose={vi.fn()}
          selection={mockSelection}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Save to My Vocabulary')).toBeInTheDocument();
      });

      const saveButton = screen.getByText('Save to My Vocabulary');
      await user.click(saveButton);

      expect(mockSaveWord).toHaveBeenCalledWith(
        expect.objectContaining({
          word: 'مرحبا',
          translation: 'hello',
          pronunciation_standard: 'marḥaban',
          pronunciation_egyptian: 'marḥaba',
        }),
        expect.objectContaining({
          content_type: 'sentence',
          full_text: 'مرحبا كيف حالك؟',
        })
      );
    });

    it('shows saved state after save completes', async () => {
      const user = userEvent.setup();
      mockSaveWord.mockResolvedValue(undefined);

      renderWithProvider(
        <WordDetailModal
          isOpen={true}
          onClose={vi.fn()}
          selection={mockSelection}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Save to My Vocabulary')).toBeInTheDocument();
      });

      const saveButton = screen.getByText('Save to My Vocabulary');
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockSaveWord).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(screen.getByText('Saved to My Vocabulary')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('shows already saved state if word is already saved', async () => {
      vi.mocked(useSavedWordsModule.useSavedWords).mockReturnValue({
        words: [],
        loading: false,
        error: null,
        saveWord: mockSaveWord,
        updateStatus: vi.fn(),
        deleteWord: vi.fn(),
        archiveWord: vi.fn(),
        recordPractice: vi.fn(),
        saveAsActive: vi.fn(),
        isWordSaved: vi.fn().mockReturnValue(true),
        getSavedWord: vi.fn(),
        isActive: vi.fn(),
        updateMemoryAids: vi.fn(),
        refetch: vi.fn(),
        topics: [],
        counts: { total: 0, active: 0, learned: 0 },
      });

      renderWithProvider(
        <WordDetailModal
          isOpen={true}
          onClose={vi.fn()}
          selection={mockSelection}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Saved to My Vocabulary')).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });
});
