// src/components/layout/Footer.jsx
import { Link } from 'react-router-dom';
import { Crown, Heart, ExternalLink, Mail, Globe } from 'lucide-react';
import './Footer.css';

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
              Platform menulis dan membaca novel fantasy terbaik. Sampaikan imajinasi Anda kepada dunia.
            </p>
            <div className="footer__socials">
              <a href="https://github.com/Atha" target="_blank" rel="noopener noreferrer" className="footer__social-btn" aria-label="Website">
                <Globe size={18} />
              </a>
              <a href="mailto:atha@attanovel.com" className="footer__social-btn" aria-label="Email">
                <Mail size={18} />
              </a>
              <a href="https://github.com/Atha/attanovel" target="_blank" rel="noopener noreferrer" className="footer__social-btn" aria-label="Link">
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
              <Link to="/">Beranda</Link>
            </div>
            <div className="footer__links-col">
              <h4>Genre</h4>
              <Link to="/discover?genre=fantasy">Fantasy</Link>
              <Link to="/discover?genre=romance">Romance</Link>
              <Link to="/discover?genre=action">Action</Link>
              <Link to="/discover?genre=mystery">Mystery</Link>
            </div>
            <div className="footer__links-col">
              <h4>Dukungan</h4>
              <a href="#">Panduan Penulis</a>
              <a href="#">FAQ</a>
              <a href="#">Syarat & Ketentuan</a>
              <a href="#">Kebijakan Privasi</a>
            </div>
          </div>
        </div>

        <div className="footer__bottom">
          <p>
            © 2024 AttaNovel. Dibuat dengan <Heart size={14} className="footer__heart" /> oleh{' '}
            <span className="footer__creator">Atha</span>. All rights reserved.
          </p>
          <p className="footer__tech">
            Powered by Firebase & React
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
