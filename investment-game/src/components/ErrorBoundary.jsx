import React from 'react';
import { logEvent } from '../store/eventLog.js';
import { useRecordingStore } from '../store/recordingStore.js';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    logEvent('error_boundary', 'error', { message: error?.message, stack: info?.componentStack });
    useRecordingStore.getState().stop?.();
  }
  render() {
    if (this.state.error) {
      return (
        <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-canvas p-8 text-ink">
          <h1 className="text-heading">Something went wrong</h1>
          <p className="text-body">Please hand the tablet to the enumerator.</p>
          <button
            className="min-h-touch rounded-lg bg-action-green px-6 py-3 text-white"
            onClick={() => this.setState({ error: null })}
          >
            Resume
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
