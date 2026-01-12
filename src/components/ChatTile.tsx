import { useState } from 'react';
import { openai } from '../lib/openai';

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

interface ChatTileProps {
    word: string;
    translation: string;
    context?: string;
    savedMessages: ChatMessage[];
    onMessagesChange: (messages: ChatMessage[]) => void;
}

export function ChatTile({ word, translation, context, savedMessages, onMessagesChange }: ChatTileProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: ChatMessage = { role: 'user', content: input.trim() };
        const updatedMessages = [...savedMessages, userMessage];
        onMessagesChange(updatedMessages);
        setInput('');
        setIsLoading(true);

        try {
            const systemPrompt = `You are a helpful Arabic language tutor. The student is learning about the word/phrase "${word}" which means "${translation}".${context ? ` Context: ${context}` : ''} Answer their questions briefly (2-3 sentences max), focusing on practical usage and cultural insights.`;

            const response = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: systemPrompt },
                    ...updatedMessages.map(m => ({ role: m.role, content: m.content })),
                ],
                max_tokens: 150,
            });

            const assistantMessage: ChatMessage = {
                role: 'assistant',
                content: response.choices[0].message.content || 'Sorry, I could not generate a response.',
            };

            onMessagesChange([...updatedMessages, assistantMessage]);
        } catch (error) {
            console.error('[ChatTile] Error:', error);
            const errorMessage: ChatMessage = {
                role: 'assistant',
                content: 'Sorry, I encountered an error. Please try again.',
            };
            onMessagesChange([...updatedMessages, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const suggestionPrompts = [
        'How do I use this in conversation?',
        'What are similar words or phrases?',
        'When should I use this vs alternatives?',
    ];

    return (
        <div className="glass-card overflow-hidden">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <span className="text-lg">💬</span>
                    <span className="font-semibold text-white">Ask About This Word</span>
                    {savedMessages.length > 0 && (
                        <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">
                            {savedMessages.length}
                        </span>
                    )}
                </div>
                <svg
                    className={`w-5 h-5 text-white/60 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isExpanded && (
                <div className="px-4 pb-4">
                    {/* Chat history */}
                    {savedMessages.length > 0 && (
                        <div className="mb-3 space-y-2 max-h-60 overflow-y-auto">
                            {savedMessages.map((msg, idx) => (
                                <div
                                    key={idx}
                                    className={`text-sm p-2 rounded-lg ${
                                        msg.role === 'user'
                                            ? 'bg-amber-500/20 text-amber-100 ml-8'
                                            : 'bg-white/10 text-white/90 mr-8'
                                    }`}
                                >
                                    {msg.content}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Suggestion prompts */}
                    {savedMessages.length === 0 && (
                        <div className="mb-3 space-y-2">
                            <div className="text-xs text-white/40 mb-2">Try asking:</div>
                            {suggestionPrompts.map((prompt, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setInput(prompt)}
                                    className="w-full text-left text-sm text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 px-3 py-2 rounded-lg transition-colors"
                                >
                                    {prompt}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Input */}
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Ask a question..."
                            className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/40 text-sm focus:outline-none focus:border-purple-500/50"
                            disabled={isLoading}
                        />
                        <button
                            onClick={handleSend}
                            disabled={!input.trim() || isLoading}
                            className="px-4 py-2 bg-purple-500/20 text-purple-300 rounded-lg hover:bg-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isLoading ? '...' : 'Send'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
