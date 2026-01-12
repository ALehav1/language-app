import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SentenceDetailModal } from './SentenceDetailModal';
import type { SentenceSelectionContext } from '../../types/selection';
import * as useSavedWordsModule from '../../hooks/useSavedWords';

vi.mock('../../hooks/useSavedWords');
vi.mock('./WordDetailModal', () => ({
  WordDetailModal: () => null,
}));

describe('SentenceDetailModal', () => {
  const mockSelection: SentenceSelectionContext = {
    selectedSentence: 'مرحبا كيف حالك؟',
    parentPassage: 'هذا نص طويل. مرحبا كيف حالك؟ شكرا.',
    sourceView: 'vocab',
    language: 'arabic',
    dialect: 'egyptian',
    contentType: 'passage',
  };

  const mockSaveWord = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
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
      const { container } = render(
        <SentenceDetailModal
          isOpen={false}
          onClose={vi.fn()}
          selection={mockSelection}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('renders when open', () => {
      render(
        <SentenceDetailModal
          isOpen={true}
          onClose={vi.fn()}
          selection={mockSelection}
        />
      );

      expect(screen.getByText('Sentence Details')).toBeInTheDocument();
    });

    it('calls onClose when close button clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(
        <SentenceDetailModal
          isOpen={true}
          onClose={onClose}
          selection={mockSelection}
        />
      );

      const closeButton = screen.getByLabelText('Close');
      await user.click(closeButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Sentence display', () => {
    it('displays the selected sentence', () => {
      render(
        <SentenceDetailModal
          isOpen={true}
          onClose={vi.fn()}
          selection={mockSelection}
        />
      );

      expect(screen.getByText('مرحبا كيف حالك؟')).toBeInTheDocument();
    });

    it('displays context information', () => {
      render(
        <SentenceDetailModal
          isOpen={true}
          onClose={vi.fn()}
          selection={mockSelection}
        />
      );

      expect(screen.getByText(/From vocab/i)).toBeInTheDocument();
      expect(screen.getByText(/vocab.*passage/i)).toBeInTheDocument();
    });

    it('shows parent passage indicator when present', () => {
      render(
        <SentenceDetailModal
          isOpen={true}
          onClose={vi.fn()}
          selection={mockSelection}
        />
      );

      expect(screen.getByText(/Part of larger passage/i)).toBeInTheDocument();
    });

    it('applies RTL direction for Arabic', () => {
      const { container } = render(
        <SentenceDetailModal
          isOpen={true}
          onClose={vi.fn()}
          selection={mockSelection}
        />
      );

      const sentenceElements = container.querySelectorAll('[dir="rtl"]');
      expect(sentenceElements.length).toBeGreaterThan(0);
    });
  });

  describe('Word clicking', () => {
    it('renders clickable words', () => {
      render(
        <SentenceDetailModal
          isOpen={true}
          onClose={vi.fn()}
          selection={mockSelection}
        />
      );

      const buttons = screen.getAllByRole('button');
      const wordButtons = buttons.filter(btn => 
        btn.textContent && /^[ء-ي]+$/.test(btn.textContent.trim())
      );
      
      expect(wordButtons.length).toBe(3);
    });
  });

  describe('Save functionality', () => {
    it('shows save sentence button', () => {
      render(
        <SentenceDetailModal
          isOpen={true}
          onClose={vi.fn()}
          selection={mockSelection}
        />
      );

      expect(screen.getByText('Save This Sentence')).toBeInTheDocument();
    });

    it('calls saveWord when save clicked', async () => {
      const user = userEvent.setup();
      mockSaveWord.mockResolvedValue(undefined);

      render(
        <SentenceDetailModal
          isOpen={true}
          onClose={vi.fn()}
          selection={mockSelection}
        />
      );

      const saveButton = screen.getByText('Save This Sentence');
      await user.click(saveButton);

      expect(mockSaveWord).toHaveBeenCalledWith(
        expect.objectContaining({ word: 'مرحبا كيف حالك؟' }),
        expect.objectContaining({ content_type: 'passage', full_text: 'مرحبا كيف حالك؟' })
      );
    });

    it('shows saved state after save completes', async () => {
      const user = userEvent.setup();
      mockSaveWord.mockResolvedValue(undefined);

      render(
        <SentenceDetailModal
          isOpen={true}
          onClose={vi.fn()}
          selection={mockSelection}
        />
      );

      const saveButton = screen.getByText('Save This Sentence');
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Sentence Saved')).toBeInTheDocument();
      });
    });
  });
});
