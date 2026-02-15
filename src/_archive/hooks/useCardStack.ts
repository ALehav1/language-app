import { useState, useCallback, useEffect } from 'react';
import type { Lesson, CardAction, CardStatus } from '../types/lesson';

interface CardState {
    lesson: Lesson;
    status: CardStatus;
}

interface UseCardStackOptions {
    initialLessons: Lesson[];
    onActionComplete?: (action: CardAction) => void;
    persistKey?: string;
}

interface UndoState {
    action: CardAction;
    previousCards: CardState[];
    timestamp: number;
}

export function useCardStack({ initialLessons, onActionComplete, persistKey }: UseCardStackOptions) {
    const [cards, setCards] = useState<CardState[]>(() => {
        // Try to restore from localStorage
        if (persistKey) {
            const saved = localStorage.getItem(persistKey);
            if (saved) {
                try {
                    return JSON.parse(saved);
                } catch {
                    // Invalid data, use initial
                }
            }
        }
        return initialLessons.map(lesson => ({ lesson, status: 'active' as CardStatus }));
    });

    // Undo state - stores last action for 5 seconds
    const [undoState, setUndoState] = useState<UndoState | null>(null);

    // Persist to localStorage
    useEffect(() => {
        if (persistKey) {
            localStorage.setItem(persistKey, JSON.stringify(cards));
        }
    }, [cards, persistKey]);

    // Get active lessons (not dismissed or saved)
    const activeLessons = cards
        .filter(c => c.status === 'active' || c.status === 'later')
        .map(c => c.lesson);

    // Get saved lessons
    const savedLessons = cards
        .filter(c => c.status === 'saved')
        .map(c => c.lesson);

    const handleAction = useCallback((action: CardAction) => {
        // Save current state for undo (only for dismiss/save/later actions)
        if (action.type !== 'start') {
            setUndoState({
                action,
                previousCards: [...cards.map(c => ({ ...c }))],
                timestamp: Date.now(),
            });

            // Auto-clear undo after 5 seconds
            setTimeout(() => {
                setUndoState(prev => {
                    if (prev && Date.now() - prev.timestamp >= 5000) {
                        return null;
                    }
                    return prev;
                });
            }, 5000);
        }

        setCards(prev => {
            const newCards = [...prev];
            const cardIndex = newCards.findIndex(c => c.lesson.id === action.lessonId);

            if (cardIndex === -1) return prev;

            switch (action.type) {
                case 'dismiss':
                    newCards[cardIndex].status = 'dismissed';
                    break;
                case 'save':
                    newCards[cardIndex].status = 'saved';
                    break;
                case 'later':
                    // Move to end of array
                    const [card] = newCards.splice(cardIndex, 1);
                    card.status = 'later';
                    newCards.push(card);
                    break;
                case 'start':
                    // Handle navigation externally
                    break;
            }

            return newCards;
        });

        onActionComplete?.(action);
    }, [onActionComplete, cards]);

    const resetCards = useCallback(() => {
        setCards(initialLessons.map(lesson => ({ lesson, status: 'active' })));
    }, [initialLessons]);

    const resetWithLessons = useCallback((newLessons: Lesson[]) => {
        // Preserve status for lessons that exist in both old and new
        setCards(prev => {
            const statusMap = new Map(prev.map(c => [c.lesson.id, c.status]));
            return newLessons.map(lesson => ({
                lesson,
                status: statusMap.get(lesson.id) || 'active',
            }));
        });
    }, []);

    // Undo last action
    const undoLastAction = useCallback(() => {
        if (undoState) {
            setCards(undoState.previousCards);
            setUndoState(null);
        }
    }, [undoState]);

    // Check if undo is available
    const canUndo = undoState !== null;

    return {
        activeLessons,
        savedLessons,
        handleAction,
        resetCards,
        resetWithLessons,
        totalCards: cards.length,
        remainingCards: activeLessons.length,
        undoLastAction,
        canUndo,
        lastActionType: undoState?.action.type,
    };
}
