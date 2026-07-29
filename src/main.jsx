// src/main.jsx
import { StrictMode, Component } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';

// Global Error Boundary — catches any uncaught React render errors
// Prevents total white/black screen on unexpected crash
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[AttaNovel] Uncaught render error:', error, info);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
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
            Terjadi kesalahan yang tidak terduga. Silakan muat ulang halaman.
          </p>
          {import.meta.env.DEV && this.state.error && (
            <pre style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: '8px',
              padding: '12px',
              fontSize: '0.75rem',
              color: '#fca5a5',
              maxWidth: '90vw',
              overflowX: 'auto',
              textAlign: 'left',
            }}>
              {this.state.error.toString()}
            </pre>
          )}
          <button
            onClick={this.handleReload}
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
