import React from 'react';

const Hero = ({ onCreateAccount, onSignIn }) => {
  return (
    <section className="hero">
      <div className="hero-content">
        <div className="hero-text">
          <h1 className="hero-title">
            Trade smarter.
            <br />
            Trade simpler.
          </h1>
          <p className="hero-subtitle">
            Binary options & instant payouts — demo & real accounts.
          </p>

          <div className="hero-cta">
            <button onClick={onCreateAccount} className="btn-primary btn-large">
              Create Account
            </button>
            <button onClick={onSignIn} className="btn-secondary btn-large">
              Sign In
            </button>
          </div>

          <div className="trust-indicators">
            <div className="trust-item">
              <span className="trust-icon">🔒</span>
              <span>Regulated Demo</span>
            </div>
            <div className="trust-item">
              <span className="trust-icon">🛡️</span>
              <span>Secure Platform</span>
            </div>
            <div className="trust-item">
              <span className="trust-icon">📞</span>
              <span>24/7 Support</span>
            </div>
          </div>
        </div>

        <div className="hero-visual">
          <div className="trading-preview">
            <div className="preview-header">
              <div className="preview-title">Live Trading</div>
              <div className="preview-status">
                <span className="status-dot"></span>
                Connected
              </div>
            </div>
            <div className="preview-chart">
              <div className="chart-container">
                <div className="price-up">$1.2345 ↗</div>
                <div className="chart-mini">
                  <svg viewBox="0 0 100 50" className="mini-chart">
                    <path
                      d="M0,40 L20,35 L40,30 L60,25 L80,20 L100,15"
                      stroke="#00ff88"
                      strokeWidth="2"
                      fill="none"
                    />
                  </svg>
                </div>
              </div>
            </div>
            <div className="preview-actions">
              <button className="btn-call">CALL</button>
              <button className="btn-put">PUT</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
