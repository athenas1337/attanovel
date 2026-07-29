// src/main.jsx
import { StrictMode, Component } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';

// Global Error Boundary — shows the actual error message so we can debug
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[AttaNovel] Render error:', error);
    console.error('[AttaNovel] Component stack:', info?.componentStack);
    this.setState({ info });
  }

  render() {
    if (this.state.hasError) {
      const err = this.state.error;
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0b0817',
          color: '#ede9fe',
          fontFamily: 'Inter, sans-serif',
          padding: '2rem',
          textAlign: 'center',
          gap: '1rem',
        }}>
          <div style={{ fontSize: '3rem' }}>📖</div>
          <h1 style={{ fontSize: '1.5rem', color: '#a78bfa', margin: 0 }}>
            AttaNovel
          </h1>
          <p style={{ color: '#7c6fa0', margin: 0, maxWidth: 380, lineHeight: 1.6 }}>
            Terjadi kesalahan. Silakan muat ulang halaman.
          </p>
          {/* Show error details — helps diagnose production issues */}
          <pre style={{
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: '8px',
            padding: '14px 16px',
            fontSize: '0.72rem',
            color: '#fca5a5',
            maxWidth: '90vw',
            overflowX: 'auto',
            textAlign: 'left',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}>
            {err?.toString?.() || 'Unknown error'}
            {'\n\n'}
            {this.state.info?.componentStack?.split('\n').slice(0, 8).join('\n')}
          </pre>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: 'linear-gradient(135deg, #6d28d9, #8b5cf6)',
                color: '#fff',
                border: 'none',
                padding: '12px 28px',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: '600',
              }}
            >
              🔄 Muat Ulang
            </button>
            <button
              onClick={() => { window.location.href = '/attanovel/'; }}
              style={{
                background: 'rgba(139,92,246,0.15)',
                color: '#a78bfa',
                border: '1px solid rgba(139,92,246,0.3)',
                padding: '12px 28px',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '0.9rem',
              }}
            >
              🏠 Ke Beranda
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
