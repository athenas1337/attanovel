// src/components/ui/NovelProgressCard.jsx
import { Link } from 'react-router-dom';
import { BookOpen, Clock } from 'lucide-react';
import { getReadingProgress } from '../../hooks/useReadingProgress';

const NovelProgressCard = ({ novel }) => {
  const progress = getReadingProgress(novel.id);
  return (
    <Link to={`/novel/${novel.id}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div style={{
        background: 'rgba(255,255,255,0.04)', borderRadius: 12, overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.07)', transition: 'transform 0.2s, border-color 0.2s',
      }}
      onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
      >
        <div style={{ position: 'relative', aspectRatio: '2/3', overflow: 'hidden', background: '#1a1030' }}>
          {novel.cover
            ? <img src={novel.cover} alt={novel.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>📖</div>
          }
          {progress && (
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '6px 8px', background: 'linear-gradient(transparent, rgba(0,0,0,0.8))' }}>
              <div style={{ height: 3, background: 'rgba(255,255,255,0.2)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${progress.percent}%`, background: 'linear-gradient(90deg, #8b5cf6, #f59e0b)', transition: 'width 0.3s' }} />
              </div>
              <span style={{ fontSize: '0.65rem', color: '#d1d5db', marginTop: 3, display: 'block' }}>{progress.percent}% dibaca</span>
            </div>
          )}
        </div>
        <div style={{ padding: '10px 12px' }}>
          <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: '700', color: '#ede9fe', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3 }}>
            {novel.title}
          </h4>
          <p style={{ margin: '4px 0 0', fontSize: '0.73rem', color: '#7c6fa0' }}>
            {novel.authorName || 'Anonim'}
          </p>
          {progress && (
            <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.7rem', color: '#8b5cf6' }}>
              <Clock size={10} /> Terakhir dibaca
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};
export default NovelProgressCard;
