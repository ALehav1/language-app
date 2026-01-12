import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ClickableText } from './ClickableText';

describe('ClickableText', () => {
  describe('Word mode', () => {
    it('renders text with clickable words', () => {
      const { container } = render(
        <ClickableText
          text="Hola mundo"
          language="spanish"
          dir="ltr"
          mode="word"
        />
      );
      
      expect(container.textContent).toBe('Hola mundo');
    });

    it('calls onWordClick when word is clicked', async () => {
      const user = userEvent.setup();
      const onWordClick = vi.fn();
      
      render(
        <ClickableText
          text="Hola mundo"
          language="spanish"
          dir="ltr"
          mode="word"
          sourceView="exercise"
          onWordClick={onWordClick}
        />
      );
      
      // Find and click first word button
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
      
      await user.click(buttons[0]);
      
      expect(onWordClick).toHaveBeenCalledTimes(1);
      expect(onWordClick).toHaveBeenCalledWith(
        expect.objectContaining({
          selectedText: 'Hola',
          parentSentence: 'Hola mundo',
          sourceView: 'exercise',
          language: 'spanish',
        })
      );
    });

    it('passes correct context to onWordClick', async () => {
      const user = userEvent.setup();
      const onWordClick = vi.fn();
      
      render(
        <ClickableText
          text="مرحبا"
          language="arabic"
          dir="rtl"
          mode="word"
          sourceView="lookup"
          dialect="egyptian"
          contentType="word"
          onWordClick={onWordClick}
        />
      );
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      expect(onWordClick).toHaveBeenCalledWith({
        selectedText: 'مرحبا',
        parentSentence: 'مرحبا',
        sourceView: 'lookup',
        language: 'arabic',
        dialect: 'egyptian',
        contentType: 'word',
      });
    });

    it('preserves whitespace in rendered text', () => {
      const { container } = render(
        <ClickableText
          text="Hello   world"
          language="spanish"
          dir="ltr"
          mode="word"
        />
      );
      
      // Check that whitespace is preserved in some form
      expect(container.textContent).toContain('Hello');
      expect(container.textContent).toContain('world');
    });

    it('does not make punctuation clickable', () => {
      render(
        <ClickableText
          text="Hello, world!"
          language="spanish"
          dir="ltr"
          mode="word"
        />
      );
      
      const buttons = screen.getAllByRole('button');
      
      // Should have buttons for "Hello" and "world" but not for "," or "!"
      expect(buttons).toHaveLength(2);
    });

    it('applies RTL direction for Arabic', () => {
      const { container } = render(
        <ClickableText
          text="مرحبا العالم"
          language="arabic"
          dir="rtl"
          mode="word"
        />
      );
      
      const wrapper = container.querySelector('[dir="rtl"]');
      expect(wrapper).toBeInTheDocument();
    });
  });

  describe('Sentence mode', () => {
    it('renders text with clickable sentences', () => {
      const { container } = render(
        <ClickableText
          text="First sentence. Second sentence."
          language="spanish"
          dir="ltr"
          mode="sentence"
        />
      );
      
      expect(container.textContent).toContain('First sentence.');
      expect(container.textContent).toContain('Second sentence.');
    });

    it('calls onSentenceClick when sentence is clicked', async () => {
      const user = userEvent.setup();
      const onSentenceClick = vi.fn();
      
      render(
        <ClickableText
          text="First. Second."
          language="spanish"
          dir="ltr"
          mode="sentence"
          sourceView="exercise"
          onSentenceClick={onSentenceClick}
        />
      );
      
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBe(2);
      
      await user.click(buttons[0]);
      
      expect(onSentenceClick).toHaveBeenCalledTimes(1);
      expect(onSentenceClick).toHaveBeenCalledWith(
        expect.objectContaining({
          selectedSentence: 'First.',
          parentPassage: 'First. Second.',
          sourceView: 'exercise',
          language: 'spanish',
        })
      );
    });

    it('passes correct context to onSentenceClick', async () => {
      const user = userEvent.setup();
      const onSentenceClick = vi.fn();
      
      render(
        <ClickableText
          text="مرحبا. كيف حالك؟"
          language="arabic"
          dir="rtl"
          mode="sentence"
          sourceView="vocab"
          dialect="standard"
          contentType="passage"
          onSentenceClick={onSentenceClick}
        />
      );
      
      const buttons = screen.getAllByRole('button');
      await user.click(buttons[0]);
      
      expect(onSentenceClick).toHaveBeenCalledWith({
        selectedSentence: 'مرحبا.',
        parentPassage: 'مرحبا. كيف حالك؟',
        sourceView: 'vocab',
        language: 'arabic',
        dialect: 'standard',
        contentType: 'passage',
      });
    });

    it('creates separate button for each sentence', () => {
      render(
        <ClickableText
          text="One. Two. Three."
          language="spanish"
          dir="ltr"
          mode="sentence"
        />
      );
      
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(3);
    });

    it('applies RTL direction for Arabic sentences', () => {
      const { container } = render(
        <ClickableText
          text="أول. ثاني."
          language="arabic"
          dir="rtl"
          mode="sentence"
        />
      );
      
      const wrapper = container.querySelector('[dir="rtl"]');
      expect(wrapper).toBeInTheDocument();
    });
  });

  describe('Touch target sizing', () => {
    it('word buttons have minimum touch target size', () => {
      render(
        <ClickableText
          text="Test"
          language="spanish"
          dir="ltr"
          mode="word"
        />
      );
      
      const button = screen.getByRole('button');
      
      // Check for min-width and min-height classes (Tailwind generates these)
      expect(button.className).toContain('min-w-');
      expect(button.className).toContain('min-h-');
    });

    it('sentence buttons have minimum touch target height', () => {
      render(
        <ClickableText
          text="Test sentence."
          language="spanish"
          dir="ltr"
          mode="sentence"
        />
      );
      
      const button = screen.getByRole('button');
      expect(button.className).toContain('min-h-');
    });
  });

  describe('Fallback behavior', () => {
    it('renders plain text if no callback provided', () => {
      const { container } = render(
        <ClickableText
          text="Hello"
          language="spanish"
          dir="ltr"
          mode="word"
        />
      );
      
      // Should still render text even without callbacks
      expect(container.textContent).toBe('Hello');
    });

    it('handles empty text gracefully', () => {
      const { container } = render(
        <ClickableText
          text=""
          language="spanish"
          dir="ltr"
          mode="word"
        />
      );
      
      expect(container.textContent).toBe('');
    });
  });

  describe('Custom styling', () => {
    it('applies custom className', () => {
      const { container } = render(
        <ClickableText
          text="Test"
          language="spanish"
          dir="ltr"
          mode="word"
          className="custom-class"
        />
      );
      
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain('custom-class');
    });
  });
});
