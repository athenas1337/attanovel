// src/App.jsx
import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// Layout
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import ParticleBackground from './components/layout/ParticleBackground';

// Auth
import AuthModal from './components/auth/AuthModal';

// Pages
import Home from './pages/Home';
import Discover from './pages/Discover';
import NovelDetail from './pages/NovelDetail';
import ReadChapter from './pages/ReadChapter';
import Profile from './pages/Profile';
import Library from './pages/Library';

// Writer Pages
import Dashboard from './pages/Writer/Dashboard';
import CreateNovel from './pages/Writer/CreateNovel';
import NovelManager from './pages/Writer/NovelManager';
import EditChapter from './pages/Writer/EditChapter';

import './styles/globals.css';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  return children;
};

// Layout wrapper (with Navbar + Footer)
const WithLayout = ({ children, onOpenAuth }) => (
  <>
    <Navbar onOpenAuth={onOpenAuth} />
    <main style={{ paddingTop: '64px', position: 'relative', zIndex: 1 }}>
      {children}
    </main>
    <Footer />
  </>
);

// Editor Layout (full-screen, no navbar/footer)
const EditorLayout = ({ children }) => <>{children}</>;

function AppRoutes() {
  const [authModal, setAuthModal] = useState(null); // 'login' | 'register' | null
  const openAuth = (mode) => setAuthModal(mode);
  const closeAuth = () => setAuthModal(null);

  return (
    <>
      <ParticleBackground />

      {authModal && (
        <AuthModal mode={authModal} onClose={closeAuth} />
      )}

      <Routes>
        {/* Public routes with Navbar + Footer */}
        <Route path="/" element={
          <WithLayout onOpenAuth={openAuth}>
            <Home onOpenAuth={openAuth} />
          </WithLayout>
        } />
        <Route path="/discover" element={
          <WithLayout onOpenAuth={openAuth}>
            <Discover />
          </WithLayout>
        } />
        <Route path="/novel/:novelId" element={
          <WithLayout onOpenAuth={openAuth}>
            <NovelDetail onOpenAuth={openAuth} />
          </WithLayout>
        } />
        <Route path="/library" element={
          <WithLayout onOpenAuth={openAuth}>
            <Library />
          </WithLayout>
        } />
        <Route path="/profile" element={
          <WithLayout onOpenAuth={openAuth}>
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          </WithLayout>
        } />
        <Route path="/profile/:userId" element={
          <WithLayout onOpenAuth={openAuth}>
            <Profile />
          </WithLayout>
        } />

        {/* Read chapter — minimal layout */}
        <Route path="/novel/:novelId/chapter/:chapterId" element={
          <ReadChapter onOpenAuth={openAuth} />
        } />

        {/* Writer routes with Navbar + Footer */}
        <Route path="/writer/dashboard" element={
          <WithLayout onOpenAuth={openAuth}>
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          </WithLayout>
        } />
        <Route path="/writer/create" element={
          <WithLayout onOpenAuth={openAuth}>
            <ProtectedRoute>
              <CreateNovel />
            </ProtectedRoute>
          </WithLayout>
        } />
        <Route path="/writer/novel/:novelId" element={
          <WithLayout onOpenAuth={openAuth}>
            <ProtectedRoute>
              <NovelManager />
            </ProtectedRoute>
          </WithLayout>
        } />

        {/* Chapter Editor — full screen */}
        <Route path="/writer/novel/:novelId/chapter/:chapterId" element={
          <EditorLayout>
            <ProtectedRoute>
              <EditChapter />
            </ProtectedRoute>
          </EditorLayout>
        } />

        {/* 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'rgba(26, 20, 48, 0.95)',
            color: '#ede9fe',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            backdropFilter: 'blur(12px)',
            borderRadius: '12px',
            fontSize: '0.875rem',
          },
          success: {
            iconTheme: { primary: '#10b981', secondary: '#fff' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#fff' },
          },
        }}
      />
    </>
  );
}

function App() {
  return (
    <BrowserRouter basename="/attanovel">
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
