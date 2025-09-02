import React, { useState } from 'react';

const NewHero = ({ onCreateAccount, onSignIn, hideSignIn = false }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  console.log('NewHero render - props:', { onCreateAccount: !!onCreateAccount, onSignIn: !!onSignIn, hideSignIn });
  console.log('NewHero render - layout type:', hideSignIn ? 'MOBILE' : 'DESKTOP');
  console.log('Mobile menu state:', isMobileMenuOpen);

  const toggleMobileMenu = () => {
    const newState = !isMobileMenuOpen;
    setIsMobileMenuOpen(newState);
    
    // Add/remove body class for mobile menu state
    if (newState) {
      document.body.classList.add('mobile-menu-open');
    } else {
      document.body.classList.remove('mobile-menu-open');
    }
    
    console.log('Mobile menu toggled to:', newState);
  };

  return (
    <section 
      className="new-hero"
      style={hideSignIn ? { marginTop: '-250px', paddingTop: '0px' } : {}}
    >
      {/* Background Image */}
      <div 
        className="hero-background-image"
        style={hideSignIn ? { marginTop: '-250px', paddingTop: '0px' } : {}}
      >
        <img 
          src="/assets/landing/person-phone.png" 
          alt="Person holding a phone" 
          className="person-phone-bg"
        />
        {/* Background SVG overlay */}
        <div className="hero-background">
          <svg width="100%" height="100%" viewBox="0 0 2076 2236" fill="none" xmlns="http://www.w3.org/2000/svg" className="background-svg" preserveAspectRatio="xMidYMid slice">
            <path fillRule="evenodd" clipRule="evenodd" d="M1947.51 27.973C1930 33.0114 1917.94 49.0305 1917.94 67.2495V764.959C1917.94 783.083 1935.31 796.155 1952.73 791.143L2046.18 764.249C2063.69 759.211 2075.75 743.192 2075.75 724.973V27.2637C2075.75 9.13986 2058.38 -3.93271 2040.97 1.07939L1947.51 27.973ZM1722.94 491.237C1722.94 473.018 1735 456.999 1752.51 451.961L1845.97 425.067C1863.38 420.055 1880.75 433.128 1880.75 451.252V1148.96C1880.75 1167.18 1868.69 1183.2 1851.18 1188.24L1757.73 1215.13C1740.31 1220.14 1722.94 1207.07 1722.94 1188.95V491.237ZM381.044 1120.39C381.044 1102.17 393.103 1086.15 410.612 1081.11L504.067 1054.22C521.484 1049.21 538.849 1062.28 538.849 1080.4V2153.44C538.849 2171.66 526.79 2187.68 509.281 2192.72L415.826 2219.61C398.409 2224.62 381.044 2211.55 381.044 2193.43V1120.39ZM1336.94 885.226C1336.94 867.007 1349 850.988 1366.51 845.95L1459.97 819.056C1477.38 814.044 1494.75 827.116 1494.75 845.24V1511.68C1494.75 1529.9 1482.69 1545.91 1465.18 1550.95L1371.73 1577.85C1354.31 1582.86 1336.94 1569.79 1336.94 1551.66V885.226ZM982.761 1144.34C965.253 1149.38 953.193 1165.4 953.193 1183.62V1850.05C953.193 1868.18 970.558 1881.25 987.975 1876.24L1081.43 1849.34C1098.94 1844.3 1111 1828.29 1111 1810.07V1143.63C1111 1125.51 1093.63 1112.43 1076.22 1117.45L982.761 1144.34ZM1145.09 1061.26C1145.09 1043.04 1157.15 1027.02 1174.65 1021.98L1268.11 995.087C1285.53 990.075 1302.89 1003.15 1302.89 1021.27V1801.24C1302.89 1819.46 1290.83 1835.47 1273.32 1840.51L1179.87 1867.41C1162.45 1872.42 1145.09 1859.35 1145.09 1841.22V1061.26ZM601.331 1271.74C583.823 1276.78 571.764 1292.8 571.764 1311.02V1977.46C571.764 1995.58 589.129 2008.65 606.546 2003.64L700.001 1976.75C717.509 1971.71 729.569 1955.69 729.569 1937.47V1271.03C729.569 1252.91 712.204 1239.84 694.787 1244.85L601.331 1271.74ZM190.297 1489.29C190.297 1471.07 202.356 1455.05 219.865 1450.01L313.32 1423.12C330.737 1418.1 348.102 1431.18 348.102 1449.3V1999.94C348.102 2018.16 336.043 2034.17 318.534 2039.21L225.079 2066.11C207.662 2071.12 190.297 2058.05 190.297 2039.92V1489.29ZM29.8647 1618.01C12.3562 1623.05 0.296875 1639.07 0.296875 1657.29V2207.92C0.296875 2226.05 17.6619 2239.12 35.0789 2234.11L128.534 2207.21C146.043 2202.18 158.102 2186.16 158.102 2167.94V1617.3C158.102 1599.18 140.737 1586.1 123.32 1591.12L29.8647 1618.01ZM762.484 1226.34C762.484 1208.12 774.543 1192.1 792.052 1187.07L885.507 1160.17C902.924 1155.16 920.289 1168.23 920.289 1186.36V1736.99C920.289 1755.21 908.23 1771.23 890.721 1776.27L797.266 1803.16C779.849 1808.18 762.484 1795.1 762.484 1776.98V1226.34ZM1559.5 1023.81C1542 1028.85 1529.94 1044.87 1529.94 1063.09V1613.72C1529.94 1631.85 1547.3 1644.92 1564.72 1639.91L1658.17 1613.01C1675.68 1607.97 1687.74 1591.95 1687.74 1573.74V1023.1C1687.74 1004.98 1670.38 991.903 1652.96 996.915L1559.5 1023.81Z" fill="#FFFFFF"/>
          </svg>
        </div>
      </div>

      {/* Floating Navigation */}
      <nav className="hero-navigation floating">
        <div className="nav-container">
          {/* Desktop Layout */}
          {!hideSignIn && (
            <>
              <div className="nav-left">
                <div className="logo-container">
                  <span className="logo-text">ORLIX</span>
                </div>
              </div>
              <div className="nav-center">
                <div className="nav-links-container">
                  <div className="nav-links">
                    <a href="#trading" className="nav-link">Trading</a>
                    <a href="#about" className="nav-link">About</a>
                    <a href="#help" className="nav-link">Help</a>
                  </div>
                </div>
              </div>
              <div className="nav-right">
                <button onClick={onSignIn} className="btn-signin">Sign in</button>
                <button onClick={onCreateAccount} className="btn-try-free">Try for free</button>
              </div>
            </>
          )}

          {/* Mobile Layout */}
          {hideSignIn && (
            <>
                             <div className="nav-left">
                 <button 
                   className="mobile-menu-btn" 
                   onClick={toggleMobileMenu}
                                        style={{
                       background: 'rgba(255, 255, 255, 0.1)',
                       border: '1px solid rgba(255, 255, 255, 0.3)',
                       borderRadius: '25px',
                       padding: '40px 24px',
                       cursor: 'pointer',
                       display: 'flex',
                       alignItems: 'center',
                       justifyContent: 'center',
                       marginTop: '40px'
                     }}
                 >
                                           <div 
                         className={`hamburger ${isMobileMenuOpen ? 'open' : ''}`}
                         style={{
                           width: '40px',
                           height: '4px',
                           backgroundColor: 'white',
                           position: 'relative',
                           transition: 'all 0.3s ease'
                         }}
                       >
                         <div style={{
                           content: '',
                           position: 'absolute',
                           width: '40px',
                           height: '4px',
                           backgroundColor: 'white',
                           top: '-12px',
                           transition: 'all 0.3s ease'
                         }}></div>
                         <div style={{
                           content: '',
                           position: 'absolute',
                           width: '40px',
                           height: '4px',
                           backgroundColor: 'white',
                           bottom: '-12px',
                           transition: 'all 0.3s ease'
                         }}></div>
                       </div>
                  </button>
              </div>
                                 <div className="nav-center">
                     <div className="logo-container">
                       <span className="logo-text" style={{ fontSize: '60px', fontWeight: '700', marginTop: '40px' }}>ORLIX</span>
                     </div>
                   </div>
                                 <div className="nav-right">
                     <button 
                       onClick={onCreateAccount} 
                       className="btn-try-free"
                       style={{
                         background: 'rgba(255, 255, 255, 0.1)',
                         border: '1px solid rgba(255, 255, 255, 0.3)',
                         borderRadius: '25px',
                         padding: '16px 24px',
                         cursor: 'pointer',
                         display: 'flex',
                         alignItems: 'center',
                         justifyContent: 'center',
                         marginTop: '40px'
                       }}
                     >
                       <svg 
                         xmlns="http://www.w3.org/2000/svg" 
                         width="60" 
                         height="60" 
                         viewBox="0 0 24 24" 
                         fill="none"
                         style={{ color: 'white' }}
                       >
                         <path 
                           fill-rule="evenodd" 
                           clip-rule="evenodd" 
                           d="M19 5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v1.667a1 1 0 0 0 2 0V5h10v14H7v-1.667a1 1 0 1 0-2 0V19a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V5Z" 
                           fill="currentColor"
                         />
                         <path 
                           fill-rule="evenodd" 
                           clip-rule="evenodd" 
                           d="M9.48 8.273a1 1 0 0 1 1.413.04l2.834 3a1 1 0 0 1 0 1.374l-2.834 3a1 1 0 1 1-1.454-1.374L10.68 13H4a1 1 0 1 1 0-2h6.68L9.44 9.687a1 1 0 0 1 .04-1.414Z" 
                           fill="currentColor"
                         />
                       </svg>
                     </button>
                   </div>
            </>
          )}
        </div>
        
                 {/* Mobile Menu */}
         {hideSignIn && isMobileMenuOpen && (
           <div 
             className={`mobile-menu ${isMobileMenuOpen ? 'open' : ''}`}
           >
             {/* Top Section with Close Icon and Start for Free Button */}
             <div style={{
               display: 'flex',
               justifyContent: 'space-between',
               alignItems: 'center',
               padding: '40px 20px 20px',
               borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
             }}>
               {/* Close Icon - Top Left */}
               <button 
                 onClick={toggleMobileMenu}
                 style={{
                   background: 'none',
                   border: 'none',
                   color: 'white',
                   fontSize: '40px',
                   cursor: 'pointer',
                   padding: '16px',
                   display: 'flex',
                   alignItems: 'center',
                   justifyContent: 'center'
                 }}
               >
                 ✕
               </button>

               {/* Start for Free Button - Top Center */}
               <button 
                 onClick={onCreateAccount}
                 style={{
                   background: 'linear-gradient(135deg, #0066ff 0%, #00ff88 100%)',
                   color: '#000',
                   border: 'none',
                   borderRadius: '25px',
                   padding: '20px 40px',
                   fontSize: '56px',
                   fontWeight: '700',
                   cursor: 'pointer',
                   display: 'flex',
                   alignItems: 'center',
                   justifyContent: 'center',
                   boxShadow: '0 8px 25px rgba(0, 255, 136, 0.3)',
                   transition: 'all 0.3s ease'
                 }}
               >
                 Start for free
               </button>

               {/* Empty div for spacing - balances the layout */}
               <div style={{ width: '40px' }}></div>
             </div>

            {/* Menu Items */}
            <div style={{ padding: '20px' }}>
                             {/* Trading */}
               <div style={{
                 display: 'flex',
                 justifyContent: 'space-between',
                 alignItems: 'center',
                 padding: '20px 0',
                 borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                 color: 'white',
                 fontSize: '60px',
                 fontWeight: '600'
               }}>
                 <span>Trading</span>
                 <span style={{ fontSize: '30px' }}>▼</span>
               </div>

               {/* About */}
               <div style={{
                 display: 'flex',
                 justifyContent: 'space-between',
                 alignItems: 'center',
                 padding: '20px 0',
                 borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                 color: 'white',
                 fontSize: '60px',
                 fontWeight: '600'
               }}>
                 <span>About</span>
                 <span style={{ fontSize: '30px' }}>▼</span>
               </div>

               {/* Help */}
               <div style={{
                 display: 'flex',
                 justifyContent: 'space-between',
                 alignItems: 'center',
                 padding: '20px 0',
                 borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                 color: 'white',
                 fontSize: '60px',
                 fontWeight: '600'
               }}>
                 <span>Help</span>
                 <span style={{ fontSize: '30px' }}>▼</span>
               </div>

                                  {/* Login Button */}
                   <div 
                     onClick={onSignIn}
                     style={{
                       width: '100%',
                       color: '#00ff88',
                       border: 'none',
                       padding: '20px 0',
                       fontSize: '60px',
                       fontWeight: '700',
                       cursor: 'pointer',
                       marginTop: '30px',
                       display: 'flex',
                       alignItems: 'center',
                       justifyContent: 'space-between',
                       borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                     }}
                   >
                     <span>Login</span>
                     <svg 
                       xmlns="http://www.w3.org/2000/svg" 
                       width="60" 
                       height="60" 
                       viewBox="0 0 24 24" 
                       fill="none"
                       style={{ color: '#00ff88' }}
                     >
                       <path 
                         fill-rule="evenodd" 
                         clip-rule="evenodd" 
                         d="M19 5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v1.667a1 1 0 0 0 2 0V5h10v14H7v-1.667a1 1 0 1 0-2 0V19a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V5Z" 
                         fill="currentColor"
                       />
                       <path 
                         fill-rule="evenodd" 
                         clip-rule="evenodd" 
                         d="M9.48 8.273a1 1 0 0 1 1.413.04l2.834 3a1 1 0 0 1 0 1.374l-2.834 3a1 1 0 1 1-1.454-1.374L10.68 13H4a1 1 0 1 1 0-2h6.68L9.44 9.687a1 1 0 0 1 .04-1.414Z" 
                         fill="currentColor"
                       />
                     </svg>
                   </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Content - Centered */}
      <div 
        className="hero-content-centered"
        style={hideSignIn ? {
          marginTop: 'clamp(100px, 20vh, 200px)'
        } : {}}
      >
        <div className="hero-text-centered">
          <h1 
            className="hero-headline-centered"
            style={hideSignIn ? {
              fontSize: 'clamp(3rem, 12vw, 6rem)',
              lineHeight: '1.2',
              maxWidth: '90vw',
              wordWrap: 'break-word'
            } : {}}
          >
            <span>Build confidence</span>
            <span>with every trade</span>
          </h1>
          <div className="hero-cta-centered">
            <button 
              onClick={onCreateAccount} 
              className="btn-start-now"
              style={hideSignIn ? {
                fontSize: 'clamp(1.5rem, 6vw, 3rem)',
                padding: 'clamp(1rem, 4vw, 2rem) clamp(3rem, 12vw, 6rem)',
                borderRadius: 'clamp(1rem, 4vw, 2rem)',
                fontWeight: '800'
              } : {}}
            >
              Start now for $0
            </button>
            <a 
              href="#learn-more" 
              className="learn-more-link"
              style={hideSignIn ? {
                fontSize: 'clamp(1.2rem, 5vw, 2.5rem)',
                fontWeight: '700'
              } : {}}
            >
              Learn more &gt;
            </a>
          </div>
        </div>
        
        {/* Feature Badges - Inside Hero */}
        <div 
          className="feature-badges-inside"
          style={hideSignIn ? {
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 'clamp(1rem, 4vw, 2rem)',
            maxWidth: '90vw',
            margin: '0 auto',
            marginTop: 'clamp(4rem, 10vw, 8rem)'
          } : {}}
        >
          <div 
            className="badge"
            style={hideSignIn ? {
              fontSize: 'clamp(1rem, 4vw, 2rem)',
              padding: 'clamp(1rem, 3vw, 1.5rem)',
              textAlign: 'center',
              borderRadius: 'clamp(1rem, 4vw, 2rem)',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)'
            } : {}}
          >
            <img 
              src="/assets/landing/fire.webp" 
              alt="Modern platform" 
              className="badge-icon"
              style={hideSignIn ? {
                width: 'clamp(2rem, 8vw, 4rem)',
                height: 'clamp(2rem, 8vw, 4rem)'
              } : {}}
            />
            <span className="badge-text">Modern platform</span>
          </div>
          <div 
            className="badge"
            style={hideSignIn ? {
              fontSize: 'clamp(1rem, 4vw, 2rem)',
              padding: 'clamp(1rem, 3vw, 1.5rem)',
              textAlign: 'center',
              borderRadius: 'clamp(1rem, 4vw, 2rem)',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)'
            } : {}}
          >
            <img 
              src="/assets/landing/love.webp" 
              alt="Useful features" 
              className="badge-icon"
              style={hideSignIn ? {
                width: 'clamp(2rem, 8vw, 4rem)',
                height: 'clamp(2rem, 8vw, 4rem)'
              } : {}}
            />
            <span className="badge-text">Useful features</span>
          </div>
          <div 
            className="badge"
            style={hideSignIn ? {
              fontSize: 'clamp(1rem, 4vw, 2rem)',
              padding: 'clamp(1rem, 3vw, 1.5rem)',
              textAlign: 'center',
              borderRadius: 'clamp(1rem, 4vw, 2rem)',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)'
            } : {}}
          >
            <img 
              src="/assets/landing/finish.webp" 
              alt="Easy start" 
              className="badge-icon"
              style={hideSignIn ? {
                width: 'clamp(2rem, 8vw, 4rem)',
                height: 'clamp(2rem, 8vw, 4rem)'
              } : {}}
            />
            <span className="badge-text">Easy start</span>
          </div>
          <div 
            className="badge"
            style={hideSignIn ? {
              fontSize: 'clamp(1rem, 4vw, 2rem)',
              padding: 'clamp(1rem, 3vw, 1.5rem)',
              textAlign: 'center',
              borderRadius: 'clamp(1rem, 4vw, 2rem)',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)'
            } : {}}
          >
            <img 
              src="/assets/landing/books.webp" 
              alt="Learning center" 
              className="badge-icon"
              style={hideSignIn ? {
                width: 'clamp(2rem, 8vw, 4rem)',
                height: 'clamp(2rem, 8vw, 4rem)'
              } : {}}
            />
            <span className="badge-text">Learning center</span>
          </div>
          <div 
            className="badge"
            style={hideSignIn ? {
              fontSize: 'clamp(1rem, 4vw, 2rem)',
              padding: 'clamp(1rem, 3vw, 1.5rem)',
              textAlign: 'center',
              borderRadius: 'clamp(1rem, 4vw, 2rem)',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)'
            } : {}}
          >
            <img 
              src="/assets/landing/money.webp" 
              alt="Quick withdrawals" 
              className="badge-icon"
              style={hideSignIn ? {
                width: 'clamp(2rem, 8vw, 4rem)',
                height: 'clamp(2rem, 8vw, 4rem)'
              } : {}}
            />
            <span className="badge-text">Quick withdrawals</span>
          </div>
          <div 
            className="badge"
            style={hideSignIn ? {
              fontSize: 'clamp(1rem, 4vw, 2rem)',
              padding: 'clamp(1rem, 3vw, 1.5rem)',
              textAlign: 'center',
              borderRadius: 'clamp(1rem, 4vw, 2rem)',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)'
            } : {}}
          >
            <img 
              src="/assets/landing/shield.webp" 
              alt="Trusted broker" 
              className="badge-icon"
              style={hideSignIn ? {
                width: 'clamp(2rem, 8vw, 4rem)',
                height: 'clamp(2rem, 8vw, 4rem)'
              } : {}}
            />
            <span className="badge-text">Trusted broker</span>
          </div>
        </div>

        {/* Fade to Black Overlay - Mobile Only */}
        {hideSignIn && (
          <div
            style={{
              position: 'absolute',
              bottom: '0',
              left: '0',
              right: '0',
              height: 'clamp(100px, 20vh, 200px)',
              background: 'linear-gradient(to bottom, transparent 0%, rgba(0, 0, 0, 0.3) 50%, rgba(0, 0, 0, 0.9) 100%)',
              pointerEvents: 'none',
              zIndex: 5
            }}
          />
        )}
      </div>
    </section>
  );
};

export default NewHero;
