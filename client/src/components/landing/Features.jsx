import React from 'react';

const Features = () => {
  const features = [
    {
      icon: '/assets/landing/fire.webp',
      title: 'Instant Execution',
      description: 'Execute trades instantly with our high-speed platform. No delays, no waiting.'
    },
    {
      icon: '/assets/landing/money.webp',
      title: 'Real-time Payouts',
      description: 'Get your winnings instantly. No waiting periods or complex withdrawal processes.'
    },
    {
      icon: '/assets/landing/books.webp',
      title: 'Demo & Real Accounts',
      description: 'Practice risk-free with demo accounts, then switch to real trading when ready.'
    },
    {
      icon: '/assets/landing/shield.webp',
      title: 'Secure Balances',
      description: 'Your funds are protected with bank-level security and encryption.'
    },
    {
      icon: '/assets/landing/finish.webp',
      title: 'Mobile Ready',
      description: 'Trade anywhere, anytime with our fully responsive mobile platform.'
    },
    {
      icon: '/assets/landing/love.webp',
      title: 'Advanced Charts',
      description: 'Professional-grade charts with real-time data and technical indicators.'
    }
  ];

  return (
    <section id="features" className="features">
      <div className="features-container">
        <div className="section-header">
          <h2 className="section-title">Why Choose Us</h2>
          <p className="section-subtitle">
            Experience the future of binary options trading with our advanced platform
          </p>
        </div>

        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <div className="feature-icon">
                <img src={feature.icon} alt={feature.title} className="icon" />
              </div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
