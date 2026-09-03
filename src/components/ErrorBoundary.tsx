import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
  info: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, info: null };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Vẫn log ra console cho ai có devtools
    console.error('[ErrorBoundary] Lỗi khi render:', error, info.componentStack);
    this.setState({ info });
  }

  render() {
    const { error, info } = this.state;

    if (error) {
      return (
        <div
          style={{
            minHeight: '100vh',
            padding: 20,
            background: '#fff3f3',
            color: '#7a1212',
            fontFamily: 'monospace',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            fontSize: 14,
            lineHeight: 1.5,
          }}
        >
          <h1 style={{ fontSize: 18, marginBottom: 12 }}>🔴 App bị lỗi khi hiển thị</h1>
          <div style={{ marginBottom: 12 }}>
            <strong>Thông báo lỗi:</strong>
            <br />
            {error.message}
          </div>
          {error.stack && (
            <div style={{ marginBottom: 12 }}>
              <strong>Stack:</strong>
              <br />
              {error.stack}
            </div>
          )}
          {info?.componentStack && (
            <div>
              <strong>Component gây lỗi:</strong>
              <br />
              {info.componentStack}
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
