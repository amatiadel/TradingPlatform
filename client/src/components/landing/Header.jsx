import React, { useState } from 'react';

const Header = ({ onCreateAccount, onSignIn }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      // Account for fixed header height (70px) when scrolling
      const headerHeight = 70;
      const y = element.getBoundingClientRect().top + window.scrollY - headerHeight;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
    setIsMenuOpen(false);
  };

  return (
    <header className="header">
      <div className="header-container">
        {/* Logo */}
        <div className="logo">
          <img 
            src="/assets/landing/logo.svg" 
            alt="ORLIX" 
            className="logo-img"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'block';
            }}
          />
          <div className="logo-text" style={{ display: 'none' }}>
            ORLIX
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="nav-desktop">
          <a href="#features" onClick={() => scrollToSection('features')} className="nav-link">
            Features
          </a>
          <a href="#how-it-works" onClick={() => scrollToSection('how-it-works')} className="nav-link">
            How it works
          </a>
        </nav>

        {/* Auth Buttons */}
        <div className="auth-buttons">
          <button onClick={onSignIn} className="btn-secondary">
            Sign In
          </button>
          <button onClick={onCreateAccount} className="btn-primary">
            Sign Up
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button 
          className="mobile-menu-btn"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          <span className={`hamburger ${isMenuOpen ? 'open' : ''}`}></span>
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="mobile-menu">
          <nav className="nav-mobile">
            <a href="#features" onClick={() => scrollToSection('features')} className="nav-link">
              Features
            </a>
            <a href="#how-it-works" onClick={() => scrollToSection('how-it-works')} className="nav-link">
              How it works
            </a>
            <div className="mobile-auth-buttons">
              <button onClick={onSignIn} className="btn-secondary">
                Sign In
              </button>
              <button onClick={onCreateAccount} className="btn-primary">
                Sign Up
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
