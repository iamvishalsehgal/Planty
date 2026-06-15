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
        <div className="flex flex-col items-center justify-center min-h-dvh p-8 text-center bg-cream-300">
          <div className="w-20 h-20 rounded-full bg-clay-100 flex items-center justify-center mb-6">
            <span className="text-4xl">🪴</span>
          </div>
          <h2 className="text-title-lg text-text-primary mb-2">Something went wrong</h2>
          <p className="text-body-md text-text-tertiary mb-6 max-w-sm">
            Planty hit an unexpected error. Try refreshing the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-sage-600 text-white rounded-2xl font-medium hover:bg-sage-700 transition-colors"
          >
            Refresh
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
