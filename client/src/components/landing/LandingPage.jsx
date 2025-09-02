import React, { useState, useEffect } from 'react';
import DesktopLanding from './DesktopLanding';
import MobileLanding from './MobileLanding';

// Custom hook for detecting screen size with multiple methods
const useScreenSize = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      // Method 1: CSS Media Query (most reliable)
      const mediaQuery = window.matchMedia('(max-width: 767px)');
      const isMobileByCSS = mediaQuery.matches;
      
      // Method 2: Window width
      const width = window.innerWidth;
      const isMobileByWidth = width < 768;
      
      // Method 3: User agent detection
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobileByUserAgent = /mobile|android|iphone|ipad|phone|blackberry|opera mini|mobile|tablet|ipod|silk/i.test(userAgent);
      
      // Method 4: Touch capability
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      // Method 5: Check if we're in device emulator mode
      const isInEmulator = width < 500 || window.outerWidth < 500 || 
                          (window.screen && window.screen.width < 500) ||
                          (window.screen && window.screen.availWidth < 500);
      
      // Combine methods for more reliable detection
      const mobile = isMobileByCSS || isInEmulator || (isMobileByWidth && (isMobileByUserAgent || hasTouch));
      
      console.log('Screen size check:', { 
        width, 
        outerWidth: window.outerWidth,
        screenWidth: window.screen?.width,
        availWidth: window.screen?.availWidth,
        isMobileByCSS, 
        isMobileByWidth, 
        isMobileByUserAgent, 
        hasTouch,
        isInEmulator,
        finalResult: mobile,
        breakpoint: 768 
      });
      
      setIsMobile(mobile);
    };

    // Check on mount
    checkScreenSize();

    // Add resize listener
    window.addEventListener('resize', checkScreenSize);
    
    // Add media query listener
    const mediaQuery = window.matchMedia('(max-width: 767px)');
    mediaQuery.addEventListener('change', checkScreenSize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', checkScreenSize);
      mediaQuery.removeEventListener('change', checkScreenSize);
    };
  }, []);

  return isMobile;
};

const LandingPage = () => {
  const isMobile = useScreenSize();

  console.log('LandingPage render - isMobile:', isMobile, 'Component:', isMobile ? 'MobileLanding' : 'DesktopLanding');

  // Only render one component at a time for performance
  return isMobile ? <MobileLanding /> : <DesktopLanding />;
};

export default LandingPage;
