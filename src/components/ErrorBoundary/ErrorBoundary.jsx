// ========================================
// Error Boundary — Catch React crashes
// ========================================
import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-boundary__card">
            <div className="error-boundary__icon">⚠️</div>
            <h2>Something went wrong</h2>
            <p>WriteAI encountered an unexpected error. Your documents are safe in local storage.</p>
            <pre className="error-boundary__details">
              {this.state.error?.message || 'Unknown error'}
            </pre>
            <button className="error-boundary__btn" onClick={this.handleReload}>
              Reload WriteAI
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
