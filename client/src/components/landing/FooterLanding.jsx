import React from 'react';

const FooterLanding = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    company: [
      { name: 'About Us', href: '#about' },
      { name: 'Contact', href: '#contact' },
      { name: 'Support', href: '#support' }
    ],
    legal: [
      { name: 'Terms of Service', href: '#terms' },
      { name: 'Privacy Policy', href: '#privacy' },
      { name: 'Risk Disclosure', href: '#risk' }
    ],
    trading: [
      { name: 'How to Trade', href: '#how-to-trade' },
      { name: 'Trading Guide', href: '#guide' },
      { name: 'FAQ', href: '#faq' }
    ]
  };

  const socialLinks = [
    { name: 'Twitter', icon: '🐦', href: 'https://twitter.com/binaryoptionsdemo' },
    { name: 'LinkedIn', icon: '💼', href: 'https://linkedin.com/company/binaryoptionsdemo' },
    { name: 'Telegram', icon: '📱', href: 'https://t.me/binaryoptionsdemo' }
  ];

  return (
    <footer className="footer-landing">
      <div className="footer-container">
        <div className="footer-content">
          {/* Company Info */}
          <div className="footer-section">
            <div className="footer-logo">
              <img
                src="/assets/landing/logo.svg"
                alt="Binary Options Demo"
                className="footer-logo-img"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
              <div className="footer-logo-text" style={{ display: 'none' }}>
                Binary Options Demo
              </div>
            </div>
            <p className="footer-description">
              The most advanced binary options trading platform with instant execution and real-time payouts.
            </p>
            <div className="social-links">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-link"
                  aria-label={social.name}
                >
                  <span className="social-icon">{social.icon}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Company Links */}
          <div className="footer-section">
            <h4 className="footer-title">Company</h4>
            <ul className="footer-links">
              {footerLinks.company.map((link, index) => (
                <li key={index}>
                  <a href={link.href} className="footer-link">{link.name}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div className="footer-section">
            <h4 className="footer-title">Legal</h4>
            <ul className="footer-links">
              {footerLinks.legal.map((link, index) => (
                <li key={index}>
                  <a href={link.href} className="footer-link">{link.name}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Trading Links */}
          <div className="footer-section">
            <h4 className="footer-title">Trading</h4>
            <ul className="footer-links">
              {footerLinks.trading.map((link, index) => (
                <li key={index}>
                  <a href={link.href} className="footer-link">{link.name}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="footer-bottom">
          <div className="footer-bottom-content">
            <p className="copyright">
              © {currentYear} Binary Options Demo. All rights reserved.
            </p>
            <div className="footer-bottom-links">
              <a href="#admin" className="footer-link">Admin</a>
              <span className="separator">•</span>
              <a href="#status" className="footer-link">Platform Status</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default FooterLanding;
