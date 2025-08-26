import React from 'react';

const TrustBar = () => {
  const stats = [
    { value: '10K+', label: 'Active Users' },
    { value: '99.99%', label: 'Uptime' },
    { value: '< 100ms', label: 'Execution Speed' },
    { value: '24/7', label: 'Support' }
  ];

  const trustLogos = [
    { name: 'SSL Secure', icon: '🔒' },
    { name: 'Regulated', icon: '📋' },
    { name: 'Instant Payouts', icon: '⚡' },
    { name: 'Mobile Ready', icon: '📱' }
  ];

  return (
    <section className="trust-bar">
      <div className="trust-container">
        {/* Stats */}
        <div className="stats-grid">
          {stats.map((stat, index) => (
            <div key={index} className="stat-item">
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Trust Logos */}
        <div className="trust-logos">
          {trustLogos.map((logo, index) => (
            <div key={index} className="trust-logo">
              <span className="logo-icon">{logo.icon}</span>
              <span className="logo-text">{logo.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustBar;
