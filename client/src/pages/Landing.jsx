import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Hero from '../components/landing/Hero';
import TrustBar from '../components/landing/TrustBar';
import Features from '../components/landing/Features';
import HowItWorks from '../components/landing/HowItWorks';
import MiniHistory from '../components/landing/MiniHistory';
import Testimonials from '../components/landing/Testimonials';
import FooterLanding from '../components/landing/FooterLanding';
import Header from '../components/landing/Header';
import './landing-scroll-fix.css';

const Landing = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Update page metadata
    document.title = 'Binary Options Demo — Trade Smarter, Trade Simpler';
    
    // Add meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = 'Binary options & instant payouts — demo & real accounts. Trade smarter with our secure platform featuring real-time charts and instant execution.';
      document.head.appendChild(meta);
    }

    // Add JSON-LD schema
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "Binary Options Demo",
      "description": "Binary options trading platform with demo and real accounts",
      "url": window.location.origin,
      "logo": `${window.location.origin}/assets/landing/logo.svg`,
      "sameAs": [
        "https://twitter.com/binaryoptionsdemo",
        "https://linkedin.com/company/binaryoptionsdemo"
      ]
    });
    document.head.appendChild(script);

    // Enable scrolling for landing page
    document.body.classList.add('landing-page-active');

    // debug only - remove after fix confirmed
    console.log('HTML overflow:', getComputedStyle(document.documentElement).overflow);
    console.log('BODY overflow:', getComputedStyle(document.body).overflow);
    console.log('ROOT overflow:', getComputedStyle(document.getElementById('root')).overflow);
    // Try programmatic scroll test
    window.scrollTo({ top: 200, behavior: 'smooth' });
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 700);

    return () => {
      // Cleanup
      const existingScript = document.querySelector('script[type="application/ld+json"]');
      if (existingScript) {
        existingScript.remove();
      }
      document.body.classList.remove('landing-page-active');
    };
  }, []);

  const handleCreateAccount = () => {
    navigate('/signup');
  };

  const handleSignIn = () => {
    navigate('/login');
  };

  return (
    <div className="landing-page">
      <Header onCreateAccount={handleCreateAccount} onSignIn={handleSignIn} />
      <main className="landing-main">
        <Hero onCreateAccount={handleCreateAccount} onSignIn={handleSignIn} />
        <TrustBar />
        <Features />
        <HowItWorks />
        <MiniHistory />
        <Testimonials />
      </main>
      <FooterLanding />
    </div>
  );
};

export default Landing;
