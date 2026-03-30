import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div style={{
          padding: '24px',
          maxWidth: '600px',
          margin: '40px auto',
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '12px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}>
          <h2 style={{
            color: '#dc2626',
            fontSize: '20px',
            fontWeight: '600',
            marginBottom: '12px',
          }}>
            出错了
          </h2>
          <p style={{
            color: '#991b1b',
            fontSize: '14px',
            marginBottom: '16px',
          }}>
            应用运行时发生错误，请刷新页面重试。
          </p>
          {this.state.error && (
            <details style={{
              background: '#fff',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #fecaca',
            }}>
              <summary style={{
                color: '#7f1d1d',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer',
                marginBottom: '8px',
              }}>
                错误详情
              </summary>
              <pre style={{
                fontSize: '12px',
                color: '#991b1b',
                overflow: 'auto',
                maxHeight: '300px',
                margin: 0,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
              }}>
                {this.state.error.toString()}
              </pre>
            </details>
          )}
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '16px',
              padding: '10px 20px',
              background: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
            }}
          >
            刷新页面
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
