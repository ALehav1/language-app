import { useNavigate } from 'react-router-dom';

/**
 * MySentencesView - Browse and practice saved spoken Arabic sentences.
 * Phase 15: Placeholder until saved_sentences table is created.
 */
export function MySentencesView() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-surface-300 p-4">
            {/* Header */}
            <header className="flex items-center justify-between mb-6">
                <button
                    onClick={() => navigate('/')}
                    className="touch-btn w-10 h-10 flex items-center justify-center rounded-xl bg-white/10"
                    aria-label="Back to menu"
                >
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <h1 className="text-xl font-bold text-white">My Sentences</h1>
                <div className="w-10" /> {/* Spacer for centering */}
            </header>

            {/* Empty state */}
            <div className="flex flex-col items-center justify-center py-20">
                <div className="text-6xl mb-4">💬</div>
                <h2 className="text-xl font-bold text-white mb-2">No sentences yet</h2>
                <p className="text-white/50 text-center mb-6 max-w-xs">
                    Save spoken Arabic phrases from Lookup to practice them here
                </p>
                <button
                    onClick={() => navigate('/lookup')}
                    className="btn-primary px-6 py-3 rounded-xl font-semibold"
                >
                    Go to Lookup
                </button>
            </div>
        </div>
    );
}
