import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("Planty error boundary:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-dvh p-8 text-center bg-surface-secondary">
          <div className="w-20 h-20 rounded-3xl bg-red-100 flex items-center justify-center mb-6 shadow-card">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#C46240" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 8v4" />
              <path d="M12 16h.01" />
            </svg>
          </div>
          <h2 className="text-title-lg text-text-primary mb-2 tracking-tight">Something went wrong</h2>
          <p className="text-[15px] text-text-tertiary mb-8 max-w-sm leading-relaxed">
            Planty hit an unexpected error. Try refreshing the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-green-600 text-white rounded-2xl font-semibold hover:bg-green-700 pressable shadow-card"
          >
            Refresh
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
