import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

/**
 * App-level error boundary.
 * Catches render errors from any child and shows a recovery UI
 * instead of a white screen.
 *
 * Must be a class component — React does not support error boundaries
 * as function components.
 */
export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error('[ErrorBoundary] Uncaught render error:', error, info.componentStack);
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    handleReload = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-surface-300 flex items-center justify-center p-6">
                    <div className="glass-card p-8 max-w-md w-full text-center space-y-6">
                        <div className="text-5xl">Something broke</div>
                        <p className="text-white/60 text-sm">
                            An unexpected error occurred. You can try again or reload the page.
                        </p>
                        {import.meta.env.DEV && this.state.error && (
                            <pre className="text-left text-xs text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg p-3 overflow-auto max-h-40">
                                {this.state.error.message}
                            </pre>
                        )}
                        <div className="flex gap-3">
                            <button
                                onClick={this.handleRetry}
                                className="flex-1 py-3 rounded-xl font-semibold btn-primary"
                            >
                                Try Again
                            </button>
                            <button
                                onClick={this.handleReload}
                                className="flex-1 py-3 rounded-xl font-semibold bg-white/10 text-white/70 hover:bg-white/20 transition-colors"
                            >
                                Reload Page
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
