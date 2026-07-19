// src/components/ui/ShareDropdown.jsx
// Shareable dropdown with copy link + social share buttons
import { useState, useRef, useEffect } from 'react';
import { Share2, Link2, ExternalLink, Check } from 'lucide-react';
import toast from 'react-hot-toast';

const ShareDropdown = ({ title, url }) => {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(url || window.location.href);
    setCopied(true);
    toast.success('Link berhasil disalin! 🔗');
    setTimeout(() => setCopied(false), 2000);
    setOpen(false);
  };

  const shareText = encodeURIComponent(`Baca "${title}" di AttaNovel!`);
  const shareUrl = encodeURIComponent(url || window.location.href);

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setOpen(!open)}
        className="btn btn-outline"
        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', fontSize: '0.85rem' }}
        title="Bagikan Novel"
      >
        <Share2 size={15} />
        Bagikan
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          right: 0,
          background: 'rgba(26,20,48,0.98)',
          border: '1px solid rgba(139,92,246,0.3)',
          borderRadius: '12px',
          padding: '8px',
          minWidth: '180px',
          zIndex: 100,
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          backdropFilter: 'blur(12px)',
          animation: 'fadeInUp 0.2s ease',
        }}>
          <button
            onClick={handleCopy}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              width: '100%', padding: '10px 12px', borderRadius: '8px',
              background: 'transparent', border: 'none', color: 'var(--color-text)',
              cursor: 'pointer', fontSize: '0.85rem', transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(139,92,246,0.15)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            {copied ? <Check size={15} color="#10b981" /> : <Link2 size={15} />}
            {copied ? 'Disalin!' : 'Salin Link'}
          </button>
          <a
            href={`https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`}
            target="_blank" rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              width: '100%', padding: '10px 12px', borderRadius: '8px',
              background: 'transparent', border: 'none', color: 'var(--color-text)',
              cursor: 'pointer', fontSize: '0.85rem', textDecoration: 'none', transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(139,92,246,0.15)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <ExternalLink size={15} color="#1d9bf0" />
            Twitter / X
          </a>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`}
            target="_blank" rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              width: '100%', padding: '10px 12px', borderRadius: '8px',
              background: 'transparent', border: 'none', color: 'var(--color-text)',
              cursor: 'pointer', fontSize: '0.85rem', textDecoration: 'none', transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(139,92,246,0.15)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <ExternalLink size={15} color="#1877f2" />
            Facebook
          </a>
        </div>
      )}
    </div>
  );
};

export default ShareDropdown;
