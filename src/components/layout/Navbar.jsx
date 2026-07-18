// src/components/layout/Navbar.jsx
import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  BookOpen, PenLine, User, Search, Menu, X,
  LogOut, ChevronDown, Crown, Compass, Home
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { logoutUser } from '../../firebase/auth';
import toast from 'react-hot-toast';
import './Navbar.css';

const Navbar = ({ onOpenAuth }) => {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchVal, setSearchVal] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchVal.trim()) {
      navigate(`/discover?q=${encodeURIComponent(searchVal.trim())}`);
      setSearchVal('');
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    setProfileOpen(false);
    toast.success('Berhasil keluar!');
    navigate('/');
  };

  const navLinks = [
    { to: '/', label: 'Beranda', icon: <Home size={16} /> },
    { to: '/discover', label: 'Jelajahi', icon: <Compass size={16} /> },
  ];

  return (
    <nav className="navbar">
      <div className="navbar__inner container">
        {/* Logo */}
        <Link to="/" className="navbar__logo">
          <Crown size={22} className="navbar__logo-icon" />
          <span>Atta<span className="navbar__logo-accent">Novel</span></span>
        </Link>

        {/* Desktop Nav Links */}
        <div className="navbar__links">
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`navbar__link ${location.pathname === link.to ? 'active' : ''}`}
            >
              {link.icon}
              {link.label}
            </Link>
          ))}
        </div>

        {/* Search */}
        <form className="navbar__search" onSubmit={handleSearch}>
          <Search size={16} className="navbar__search-icon" />
          <input
            type="text"
            placeholder="Cari novel..."
            value={searchVal}
            onChange={e => setSearchVal(e.target.value)}
            className="navbar__search-input"
          />
        </form>

        {/* Actions */}
        <div className="navbar__actions">
          {user ? (
            <>
              <Link to="/writer/dashboard" className="btn btn-outline btn-sm">
                <PenLine size={14} />
                Tulis
              </Link>
              <div className="navbar__profile" onClick={() => setProfileOpen(!profileOpen)}>
                <div className="navbar__avatar">
                  {userProfile?.avatar
                    ? <img src={userProfile.avatar} alt="" />
                    : <User size={18} />
                  }
                </div>
                <ChevronDown size={14} className={`navbar__chevron ${profileOpen ? 'open' : ''}`} />
                {profileOpen && (
                  <div className="navbar__dropdown" onClick={e => e.stopPropagation()}>
                    <div className="navbar__dropdown-header">
                      <strong>{userProfile?.displayName || user.displayName || 'Pengguna'}</strong>
                      <span>{user.email}</span>
                    </div>
                    <div className="navbar__dropdown-divider" />
                    <Link to="/profile" className="navbar__dropdown-item" onClick={() => setProfileOpen(false)}>
                      <User size={15} /> Profil Saya
                    </Link>
                    <Link to="/writer/dashboard" className="navbar__dropdown-item" onClick={() => setProfileOpen(false)}>
                      <BookOpen size={15} /> Novel Saya
                    </Link>
                    <div className="navbar__dropdown-divider" />
                    <button className="navbar__dropdown-item danger" onClick={handleLogout}>
                      <LogOut size={15} /> Keluar
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <button className="btn btn-outline btn-sm" onClick={() => onOpenAuth('login')}>
                Masuk
              </button>
              <button className="btn btn-primary btn-sm" onClick={() => onOpenAuth('register')}>
                Daftar
              </button>
            </>
          )}

          {/* Mobile menu button */}
          <button className="navbar__hamburger" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {menuOpen && (
        <div className="navbar__mobile animate-fadeIn">
          <form className="navbar__mobile-search" onSubmit={handleSearch}>
            <Search size={16} />
            <input
              type="text"
              placeholder="Cari novel..."
              value={searchVal}
              onChange={e => setSearchVal(e.target.value)}
            />
          </form>
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className="navbar__mobile-link"
              onClick={() => setMenuOpen(false)}
            >
              {link.icon} {link.label}
            </Link>
          ))}
          {user ? (
            <>
              <Link to="/writer/dashboard" className="navbar__mobile-link" onClick={() => setMenuOpen(false)}>
                <PenLine size={16} /> Tulis Novel
              </Link>
              <Link to="/profile" className="navbar__mobile-link" onClick={() => setMenuOpen(false)}>
                <User size={16} /> Profil Saya
              </Link>
              <button className="navbar__mobile-link danger" onClick={() => { handleLogout(); setMenuOpen(false); }}>
                <LogOut size={16} /> Keluar
              </button>
            </>
          ) : (
            <div className="navbar__mobile-auth">
              <button className="btn btn-outline" onClick={() => { onOpenAuth('login'); setMenuOpen(false); }}>Masuk</button>
              <button className="btn btn-primary" onClick={() => { onOpenAuth('register'); setMenuOpen(false); }}>Daftar</button>
            </div>
          )}
        </div>
      )}

      {profileOpen && <div className="navbar__backdrop" onClick={() => setProfileOpen(false)} />}
    </nav>
  );
};

export default Navbar;
