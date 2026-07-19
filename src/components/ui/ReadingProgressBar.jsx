// src/components/ui/ReadingProgressBar.jsx
// A thin progress bar at top of page showing reading progress.
import { useState, useEffect } from 'react';

const ReadingProgressBar = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      const scrollTop = el.scrollTop || document.body.scrollTop;
      const scrollHeight = el.scrollHeight - el.clientHeight;
      if (scrollHeight <= 0) return;
      setProgress(Math.round((scrollTop / scrollHeight) * 100));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: `${progress}%`,
        height: '3px',
        background: 'linear-gradient(90deg, #6d28d9, #8b5cf6, #f59e0b)',
        zIndex: 10000,
        transition: 'width 0.1s linear',
        boxShadow: '0 0 8px rgba(139,92,246,0.7)',
        borderRadius: '0 2px 2px 0',
      }}
    />
  );
};

export default ReadingProgressBar;
