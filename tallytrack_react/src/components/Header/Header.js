// src/components/Header/Header.js
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Header.css';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (path) => {
    return location.pathname === path ? 'nav-link active' : 'nav-link';
  };

  return (
    <header className={`header ${isScrolled ? 'scrolled' : ''}`} id="header">
      <div className="container">
        <div className="header-content">
          <div className="logo">
            <img 
              src="/Assets/img/Asset7.png" 
              alt="TallyTrack Africa" 
              className="logo-img" 
              onClick={() => window.location.href = '/'}
            />
            <span className="logo-text" style={{display: 'none'}}>TALLYTRACK</span>
          </div>
          
          <nav className="main-nav">
            <Link to="/" className={isActive('/')}>Home</Link>
            <Link to="/dashboard" className={isActive('/dashboard')}>Dashboard</Link>
            <Link to="/#categories" className="nav-link">Categories</Link>
            <Link to="/about" className={isActive('/about')}>About</Link>
            <Link to="/contact" className={isActive('/contact')}>Contact Us</Link>
          </nav>
          
          <div className="auth-container" style={{display: 'none'}}>
            <a href="#" className="btn btn-outline">Login</a>
            <a href="#" className="btn btn-primary">Register</a>
          </div>
          
          <button className="mobile-menu-toggle">
            <i className="fas fa-bars"></i>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;