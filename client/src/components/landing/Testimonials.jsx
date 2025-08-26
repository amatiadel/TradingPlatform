import React from 'react';

const Testimonials = () => {
  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Day Trader',
      avatar: '👩‍💼',
      quote: 'The instant payouts are incredible. I\'ve never experienced such fast execution before.'
    },
    {
      name: 'Mike Chen',
      role: 'Retail Investor',
      avatar: '👨‍💻',
      quote: 'Perfect for beginners. The demo account helped me learn without risking real money.'
    },
    {
      name: 'Emma Davis',
      role: 'Professional Trader',
      avatar: '👩‍🎓',
      quote: 'The mobile app is fantastic. I can trade anywhere, anytime with full functionality.'
    }
  ];

  return (
    <section className="testimonials">
      <div className="testimonials-container">
        <div className="section-header">
          <h2 className="section-title">What Our Users Say</h2>
          <p className="section-subtitle">
            Join thousands of satisfied traders
          </p>
        </div>

        <div className="testimonials-grid">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="testimonial-card">
              <div className="testimonial-content">
                <div className="quote-icon">"</div>
                <p className="testimonial-quote">{testimonial.quote}</p>
              </div>
              <div className="testimonial-author">
                <div className="author-avatar">
                  <span className="avatar">{testimonial.avatar}</span>
                </div>
                <div className="author-info">
                  <div className="author-name">{testimonial.name}</div>
                  <div className="author-role">{testimonial.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
