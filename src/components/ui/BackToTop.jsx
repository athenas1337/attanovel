// src/components/ui/BackToTop.jsx
import { useState, useEffect } from 'react';
import { ChevronUp } from 'lucide-react';

const BackToTop = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollUp = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  if (!visible) return null;

  return (
    <button
      onClick={scrollUp}
      title="Kembali ke atas"
      style={{
        position: 'fixed',
        bottom: '28px',
        right: '28px',
        zIndex: 999,
        width: '44px',
        height: '44px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #6d28d9, #8b5cf6)',
        color: '#fff',
        border: '2px solid rgba(255,255,255,0.18)',
        boxShadow: '0 4px 24px rgba(109,40,217,0.5)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',
        animation: 'fadeInUp 0.3s ease',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'scale(1.12) translateY(-3px)';
        e.currentTarget.style.boxShadow = '0 8px 32px rgba(109,40,217,0.7)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'scale(1) translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 24px rgba(109,40,217,0.5)';
      }}
    >
      <ChevronUp size={20} />
    </button>
  );
};

export default BackToTop;
