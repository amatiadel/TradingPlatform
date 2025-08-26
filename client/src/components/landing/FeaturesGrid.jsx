import React from 'react';

const FeaturesGrid = () => {
  const features = [
    {
      icon: '⚡',
      title: 'Instant Execution',
      description: 'Execute trades instantly with our high-speed platform. No delays, no waiting.'
    },
    {
      icon: '💰',
      title: 'Real-time Payouts',
      description: 'Get your winnings instantly. No waiting periods, immediate access to your profits.'
    },
    {
      icon: '🎯',
      title: 'Demo & Real Accounts',
      description: 'Practice with demo funds or trade with real money. Switch seamlessly between accounts.'
    },
    {
      icon: '🔒',
      title: 'Secure Balances',
      description: 'Your funds are protected with bank-level security. Safe deposits and withdrawals.'
    },
    {
      icon: '📱',
      title: 'Mobile Ready',
      description: 'Trade anywhere, anytime. Fully responsive design works on all devices.'
    },
    {
      icon: '📊',
      title: 'Advanced Charts',
      description: 'Professional trading charts with real-time data and technical indicators.'
    }
  ];

  return (
    <section id="features" className="features">
      <div className="features-container">
        <div className="section-header">
          <h2 className="section-title">Why Choose Our Platform?</h2>
          <p className="section-subtitle">
            Experience the future of binary options trading with our cutting-edge features
          </p>
        </div>

        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <div className="feature-icon">
                <span className="icon">{feature.icon}</span>
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

export default FeaturesGrid;
