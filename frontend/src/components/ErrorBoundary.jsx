import { Component } from 'react';

class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="text-red-500 text-center mt-10">
          <h2>Something went wrong</h2>
          <p>{this.state.error?.message || 'Please refresh the page or try again later.'}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;