import React from 'react';

const HowItWorks = () => {
  const steps = [
    {
      number: '1',
      icon: '/assets/landing/finish.webp',
      title: 'Create Account',
      description: 'Sign up in seconds with just your email. No complex verification required.'
    },
    {
      number: '2',
      icon: '/assets/landing/books.webp',
      title: 'Choose Pair & Stake',
      description: 'Select your preferred currency pair and set your investment amount.'
    },
    {
      number: '3',
      icon: '/assets/landing/money.webp',
      title: 'Close & Payout',
      description: 'Watch the market and close your position. Get instant payouts on wins.'
    }
  ];

  return (
    <section id="how-it-works" className="how-it-works">
      <div className="how-it-works-container">
        <div className="section-header">
          <h2 className="section-title">How It Works</h2>
          <p className="section-subtitle">
            Get started in three simple steps
          </p>
        </div>

        <div className="steps-container">
          {steps.map((step, index) => (
            <div key={index} className="step-item">
              <div className="step-number">{step.number}</div>
              <div className="step-icon">
                <img src={step.icon} alt={step.title} className="icon" />
              </div>
              <h3 className="step-title">{step.title}</h3>
              <p className="step-description">{step.description}</p>
            </div>
          ))}
        </div>

        <div className="demo-real-teaser">
          <div className="teaser-content">
            <h3>Demo & Real Accounts</h3>
            <p>
              Start with our demo account to practice risk-free, then switch to real trading
              when you're ready. Use the account switcher in the app to toggle between modes.
            </p>
            <div className="teaser-features">
              <div className="teaser-feature">
                <span className="feature-dot demo"></span>
                <span>Demo: Practice with virtual funds</span>
              </div>
              <div className="teaser-feature">
                <span className="feature-dot real"></span>
                <span>Real: Trade with actual money</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
