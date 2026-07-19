// src/components/layout/Footer.jsx
import { Link } from 'react-router-dom';
import { Crown, Heart, ExternalLink, Mail, Globe } from 'lucide-react';
import './Footer.css';

const GENRES = [
  'Fantasy', 'Romance', 'Action', 'Mystery', 'Horror',
  'Sci-Fi', 'Drama', 'Thriller', 'Comedy',
];

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer__inner container">
        <div className="footer__top">
          {/* Brand */}
          <div className="footer__brand">
            <Link to="/" className="footer__logo">
              <Crown size={20} />
              Atta<span>Novel</span>
            </Link>
            <p className="footer__desc">
              Platform menulis dan membaca novel terbaik. Sampaikan imajinasi Anda kepada dunia.
            </p>
            <div className="footer__socials">
              <a href="https://github.com/athenas1337/attanovel" target="_blank" rel="noopener noreferrer" className="footer__social-btn" aria-label="GitHub">
                <Globe size={18} />
              </a>
              <a href="mailto:support@attanovel.com" className="footer__social-btn" aria-label="Email Dukungan">
                <Mail size={18} />
              </a>
              <a href="https://github.com/athenas1337/attanovel" target="_blank" rel="noopener noreferrer" className="footer__social-btn" aria-label="Repository">
                <ExternalLink size={18} />
              </a>
            </div>
          </div>

          {/* Links */}
          <div className="footer__links-grid">
            <div className="footer__links-col">
              <h4>Platform</h4>
              <Link to="/discover">Jelajahi Novel</Link>
              <Link to="/writer/dashboard">Mulai Menulis</Link>
              <Link to="/leaderboard">Peringkat</Link>
              <Link to="/social">Komunitas Sosial</Link>
              <Link to="/">Beranda</Link>
            </div>
            <div className="footer__links-col">
              <h4>Genre</h4>
              {GENRES.map(g => (
                <Link key={g} to={`/discover?genre=${g.toLowerCase()}`}>{g}</Link>
              ))}
            </div>
            <div className="footer__links-col">
              <h4>Dukungan</h4>
              <Link to="/writer-guide">Panduan Penulis</Link>
              <Link to="/faq">FAQ</Link>
              <Link to="/activity">Riwayat Aktivitas</Link>
              <Link to="/terms">Syarat &amp; Ketentuan</Link>
              <Link to="/privacy">Kebijakan Privasi</Link>
            </div>
          </div>
        </div>

        <div className="footer__bottom">
          <p>
            © 2024–2026 AttaNovel. Dibuat dengan <Heart size={14} className="footer__heart" /> oleh{' '}
            <span className="footer__creator">Atha</span>. All rights reserved.
          </p>
          <p className="footer__tech">
            Powered by Firebase &amp; React
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
