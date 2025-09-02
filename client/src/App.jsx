import React, { useEffect, useRef, useState, useCallback } from "react";
import { createChart } from "lightweight-charts";
import { saveState, loadState } from "./utils/storage.js";
import { saveUserState, loadUserState, USER_STORAGE_KEYS } from "./utils/userStorage.js";
import { useAuth } from "./AuthContext";
import io from "socket.io-client";
import TimezoneSelector from "./components/TimezoneSelector";
import { formatInOffset, DEFAULT_TIMEZONE_OFFSET, TIMEZONE_STORAGE_KEY } from "./utils/timezone";

/**
 * BINANCE API PAGINATION IMPLEMENTATION
 * 
 * This component implements infinite scrolling for historical candles using Binance API pagination.
 * 
 * Key Features:
 * 1. Initial Load: Loads 500 latest candles on chart initialization
 * 2. Lazy Loading: Automatically loads older candles when user scrolls left
 * 3. Real-time Updates: WebSocket stream provides live candle updates
 * 4. Rate Limiting: Respects Binance API limits (1200 requests/minute)
 * 5. Duplicate Prevention: Merges data without creating duplicate candles
 * 
 * Implementation Details:
 * - Uses Binance Kline endpoint: GET /api/v3/klines?symbol=BTCUSDT&interval=1m&limit=500&endTime=...
 * - Scroll detection via lightweight-charts timeScale subscription
 * - Throttled scroll events (300ms) to prevent API spam
 * - Automatic data merging with existing candles
 * - Visual loading indicators for user feedback
 * 
 * Data Flow:
 * 1. User scrolls left → detect visible range change
 * 2. Check if approaching earliest loaded data
 * 3. Throttle and call loadHistoricalCandles()
 * 4. Fetch from Binance API with endTime parameter
 * 5. Merge new candles with existing data
 * 6. Update chart with complete dataset
 * 7. Real-time WebSocket updates continue working
 */

// Removed TradeLineOverlay component - using simple price lines + corner labels instead

export default function App() {
  // Responsive layout state
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState('chart'); // chart, panel, sidebar

  // Responsive layout detection
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      const mobile = width <= 1024;
      console.log('Screen width:', width, 'isMobile:', mobile);
      setIsMobile(mobile);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    // Add orientation change listener for mobile devices
    window.addEventListener('orientationchange', () => {
      // Delay to allow orientation change to complete
      setTimeout(checkScreenSize, 100);
    });
    
    // Add visual viewport change listener for mobile browsers
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', checkScreenSize);
    }
    
    return () => {
      window.removeEventListener('resize', checkScreenSize);
      window.removeEventListener('orientationchange', checkScreenSize);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', checkScreenSize);
      }
    };
  }, []);

  // Removed complex mobile chart styling effects - using default Lightweight Charts behavior

  // Effect to manage body class for mobile trading controls
  useEffect(() => {
    if (isMobile) {
      // Add body class to prevent scrolling issues
      document.body.classList.add('mobile-trading-active');
      
      return () => {
        // Remove body class when component unmounts or mobile state changes
        document.body.classList.remove('mobile-trading-active');
      };
    }
  }, [isMobile]);

  // CSS to hide chart branding elements and fix mobile layout
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .tv-lightweight-charts canvas {
        /* Hide any canvas-based branding */
      }
      .tv-lightweight-charts svg {
        /* Hide SVG branding elements */
      }
      .tv-lightweight-charts [data-role="logo"],
      .tv-lightweight-charts [data-role="branding"],
      .tv-lightweight-charts [data-role="watermark"] {
        display: none !important;
      }
      /* Hide any elements with specific branding classes or IDs */
      .tv-lightweight-charts .branding,
      .tv-lightweight-charts .logo,
      .tv-lightweight-charts .watermark {
        display: none !important;
      }
      /* More aggressive hiding of branding elements */
      .tv-lightweight-charts *[class*="logo"],
      .tv-lightweight-charts *[class*="branding"],
      .tv-lightweight-charts *[class*="watermark"],
      .tv-lightweight-charts *[id*="logo"],
      .tv-lightweight-charts *[id*="branding"],
      .tv-lightweight-charts *[id*="watermark"] {
        display: none !important;
      }
      /* Hide any SVG elements that might contain branding */
      .tv-lightweight-charts svg[data-role="logo"],
      .tv-lightweight-charts svg[data-role="branding"],
      .tv-lightweight-charts svg[data-role="watermark"] {
        display: none !important;
      }
      
      /* Mobile trade page animations */
      @keyframes slideInFromBottom {
        0% {
          transform: translateY(100%);
          opacity: 0;
        }
        100% {
          transform: translateY(0);
          opacity: 1;
        }
      }
      
      @keyframes slideOutToBottom {
        0% {
          transform: translateY(0);
          opacity: 1;
        }
        100% {
          transform: translateY(100%);
          opacity: 0;
        }
      }
      
                      /* Mobile chart axis styling */
        @media (max-width: 1024px) {
          /* Chart area mobile sizing */
          .chart-area-mobile {
            height: calc(100vh - 280px) !important;
            height: calc(100dvh - 280px) !important;
            min-height: 400px !important;
            max-height: none !important;
          }
          
          /* Small mobile devices */
          @media (max-height: 700px) {
            .chart-container-mobile {
              height: calc(100vh - 280px) !important;
              height: calc(100dvh - 280px) !important;
              min-height: 350px !important;
              max-height: none !important;
            }
            
            .chart-area-mobile {
              height: calc(100vh - 280px) !important;
              height: calc(100dvh - 280px) !important;
              min-height: 350px !important;
              max-height: none !important;
            }
          }
          
          /* Medium mobile devices */
          @media (min-height: 701px) and (max-height: 900px) {
            .chart-container-mobile {
              height: calc(100vh - 280px) !important;
              height: calc(100dvh - 280px) !important;
              min-height: 400px !important;
              max-height: none !important;
            }
            
            .chart-area-mobile {
              height: calc(100vh - 280px) !important;
              height: calc(100dvh - 280px) !important;
              min-height: 400px !important;
              max-height: none !important;
            }
          }
          
          /* Large mobile devices */
          @media (min-height: 901px) {
            .chart-container-mobile {
              height: calc(100vh - 280px) !important;
              height: calc(100dvh - 280px) !important;
              min-height: 450px !important;
              max-height: none !important;
            }
            
            .chart-area-mobile {
              height: calc(100vh - 280px) !important;
              height: calc(100dvh - 280px) !important;
              min-height: 450px !important;
              max-height: none !important;
            }
          }
        /* Symbol selector dropdown options styling - make them dark like platform */
        .mobile-symbol-select option {
          background: #1a1a1a !important;
          color: white !important;
          font-size: 16px !important;
          padding: 8px !important;
        }
        
        .mobile-timeframe-select option {
          background: #1a1a1a !important;
          color: white !important;
          font-size: 16px !important;
          padding: 8px !important;
        }
        .tv-lightweight-charts .tv-price-axis__label,
        .tv-lightweight-charts .tv-time-axis__label {
          font-size: 16px !important; /* Consistent size for all text */
          font-weight: bold !important;
        }
        
        /* Additional targeting for any chart text elements */
        .tv-lightweight-charts text {
          font-size: 16px !important;
          font-weight: bold !important;
        }
        
        /* Fix for mobile viewport height issues */
        html, body {
          height: 100%;
          overflow: hidden;
        }
        
        #root {
          height: 100vh;
          height: 100dvh; /* Dynamic viewport height for mobile */
          height: -webkit-fill-available;
        }
        
        /* Ensure mobile trading controls stay visible */
        .mobile-trading-controls {
          position: fixed !important;
          bottom: 0 !important;
          left: 0 !important;
          right: 0 !important;
          z-index: 1000 !important;
          background: #1a1a1a !important;
          border-top: 2px solid #2a2a2a !important;
          min-height: 280px !important;
          box-shadow: 0 -4px 20px rgba(0,0,0,0.5) !important;
        }
        
        /* Prevent body scroll on mobile when trading controls are visible */
        body.mobile-trading-active {
          overflow: hidden !important;
          position: fixed !important;
          width: 100% !important;
        }
        
        /* Ensure chart container maintains proper dimensions */
        .chart-container-mobile {
          /* Full page height minus trading controls */
          height: calc(100vh - 280px) !important;
          height: calc(100dvh - 280px) !important;
          min-height: 400px !important;
          max-height: none !important;
        }
        
        /* Chart container dimensions */
        .chart-container-mobile > div {
          width: 100% !important;
          height: 100% !important;
          min-height: inherit !important;
        }
        
        /* Chart ref div dimensions */
        .chart-container-mobile div[ref] {
          width: 100% !important;
          height: 100% !important;
          min-height: inherit !important;
        }
        
        /* Force chart ref div to expand */
        .chart-container-mobile > div:last-child {
          flex: 1 !important;
          height: 100% !important;
          min-height: 100% !important;
        }
        
        /* Force chart to fill container */
        .chart-container-mobile canvas {
          width: 100% !important;
          height: 100% !important;
          display: block !important;
        }
        
        /* Force chart content to expand */
        .chart-container-mobile .tv-lightweight-charts {
          height: 100% !important;
          min-height: 100% !important;
        }
        
        /* Ensure chart series fills container */
        .chart-container-mobile svg {
          height: 100% !important;
          min-height: 100% !important;
        }
        
        /* Ensure chart area has full page dimensions */
        .chart-area-mobile {
          height: calc(100vh - 280px) !important;
          height: calc(100dvh - 280px) !important;
          overflow: hidden !important;
        }
        
        /* Force chart to expand and fill space */
        .chart-area-mobile .tv-lightweight-charts {
          height: 100% !important;
          min-height: 100% !important;
        }
        
        /* Ensure chart container expands */
        .chart-container-mobile {
          display: flex !important;
          flex-direction: column !important;
          justify-content: stretch !important;
          align-items: stretch !important;
        }
        
        /* Allow chart interaction through countdowns */
        .chart-container-mobile .trade-countdown-labels {
          pointer-events: none !important;
        }
        
        .chart-container-mobile .trade-countdown-labels > div {
          pointer-events: none !important;
        }
        
        /* Hide loading indicators on mobile */
        @media (max-width: 1024px) {
          /* Hide loading indicator on mobile */
          .loading-indicator {
            display: none !important;
          }
          
          /* Hide historical data loading indicator on mobile */
          .historical-loading-indicator {
            display: none !important;
          }
        }
        
        /* Mobile-specific: Make text and symbols 2 times bigger */
        /* Account switcher text and symbols */
        .account-selector .account-switcher {
          font-size: 24px !important;
        }
        
        .account-selector .account-switcher button {
          font-size: 24px !important;
        }
        
        .account-selector .account-switcher span {
          font-size: 24px !important;
        }
        
        /* Mobile header symbol and timeframe selectors */
        .mobile-symbol-selector select,
        .mobile-timeframe-selector select {
          font-size: 40px !important;
        }
        
        /* Mobile account switcher text */
        .account-selector > div > div > span:first-child {
          font-size: 44px !important;
        }
        
        .account-selector > div > div > span:last-child {
          font-size: 32px !important;
        }
        
        /* Timeframe and time selector */
        .mobile-trading-controls select,
        .mobile-trading-controls input[type="text"] {
          font-size: 36px !important;
        }
        
        /* Investment input */
        .mobile-trading-controls input[type="number"] {
          font-size: 36px !important;
        }
        
        /* Your payout text */
        .mobile-trading-controls .payout-display {
          font-size: 32px !important;
        }
        
        /* Up and down buttons */
        .mobile-trading-controls button[onclick*="place"] {
          font-size: 40px !important;
        }
        
        .mobile-trading-controls button[onclick*="place"] span {
          font-size: 48px !important;
        }
        
        /* Chart and trades navigation buttons */
        .mobile-trading-controls button[onclick*="setActiveTab"] {
          font-size: 32px !important;
        }
        
        /* Mobile header elements */
        .mobile-trading-controls .time-investment-row input,
        .mobile-trading-controls .time-investment-row select {
          font-size: 36px !important;
        }
        
        /* Mobile trading controls overall text */
        .mobile-trading-controls * {
          font-size: 32px !important;
        }
        
        /* Specific overrides for better readability */
        .mobile-trading-controls input,
        .mobile-trading-controls select,
        .mobile-trading-controls button {
          font-size: 32px !important;
        }
        
        .mobile-trading-controls .payout-display {
          font-size: 32px !important;
        }
        
        .mobile-trading-controls .trade-buttons button {
          font-size: 40px !important;
        }
        
        .mobile-trading-controls .trade-buttons button span:first-child {
          font-size: 48px !important;
        }
        
        .mobile-trading-controls .trade-buttons button span:last-child {
          font-size: 36px !important;
        }
        
        /* Chart and Trades navigation buttons */
        .mobile-trading-controls button[onclick*="setActiveTab"] {
          font-size: 32px !important;
        }
        
        .mobile-trading-controls button[onclick*="showMobileTradePage"] {
          font-size: 32px !important;
        }
        
        /* Chart area text - make bigger for mobile */
        .chart-container-mobile text,
        .chart-container-mobile .tv-lightweight-charts text {
          font-size: 32px !important;
        }
        
        /* Chart axis labels */
        .chart-container-mobile .tv-lightweight-charts .tv-price-axis__label,
        .chart-container-mobile .tv-lightweight-charts .tv-time-axis__label {
          font-size: 32px !important;
        }
        
        /* Trades section text - make bigger for mobile */
        .mobile-trading-controls .trades-section,
        .mobile-trading-controls .trades-section * {
          font-size: 32px !important;
        }
        
        /* Active trades display */
        .mobile-trading-controls .active-trades,
        .mobile-trading-controls .active-trades * {
          font-size: 32px !important;
        }
        
        /* History trades display */
        .mobile-trading-controls .history-trades,
        .mobile-trading-controls .history-trades * {
          font-size: 32px !important;
        }
        
        /* Mobile trade page text - make bigger */
        .mobile-trade-page,
        .mobile-trade-page * {
          font-size: 32px !important;
        }
        
        /* Mobile trade page navigation tabs */
        .mobile-trade-page button {
          font-size: 32px !important;
        }
        
        /* Mobile trade page content */
        .mobile-trade-page .trade-content,
        .mobile-trade-page .trade-content * {
          font-size: 32px !important;
        }
        
        /* Account switcher dropdown text */
        .account-switcher,
        .account-switcher * {
          font-size: 32px !important;
        }
        
        .account-switcher button {
          font-size: 32px !important;
        }
        
        .account-switcher div {
          font-size: 32px !important;
        }
        
        /* Time picker popup text */
        .time-picker-popup,
        .time-picker-popup * {
          font-size: 32px !important;
        }
        
        .time-picker-popup button {
          font-size: 32px !important;
        }
        
        .time-picker-popup input {
          font-size: 32px !important;
        }
        
        /* Modal text - make bigger for mobile */
        .modal-content,
        .modal-content * {
          font-size: 32px !important;
        }
        
        .modal-content button {
          font-size: 32px !important;
        }
        
        .modal-content input {
          font-size: 32px !important;
        }
        
        .modal-content h2 {
          font-size: 48px !important;
        }
        
        /* Mobile trading controls positioning */
        .mobile-trading-controls {
          position: fixed !important;
          bottom: 0 !important;
          left: 0 !important;
          right: 0 !important;
          z-index: 1000 !important;
          background: #1a1a1a !important;
          border-top: 2px solid #2a2a2a !important;
          min-height: 280px !important;
          box-shadow: 0 -4px 20px rgba(0,0,0,0.5) !important;
        }
        
        /* Prevent body scroll on mobile when trading controls are visible */
        body.mobile-trading-active {
          overflow: hidden !important;
          position: fixed !important;
          width: 100% !important;
        }
        
        /* Mobile Trades Page - Make ALL text 2 times bigger */
        .mobile-trade-page h1 {
          font-size: 32px !important; /* Was 16px */
        }
        
        .mobile-trade-page .trade-content {
          font-size: 32px !important;
        }
        
        /* Navigation tabs */
        .mobile-trade-page button[onclick*="setActiveTab"] {
          font-size: 32px !important; /* Was 16px */
        }
        
        /* Active trades content - 20% smaller for mobile */
        .mobile-trade-page .trade-content .active-trades-tab * {
          font-size: 26px !important; /* 20% smaller than 32px */
        }
        
        .mobile-trade-page .trade-content .active-trades-tab .trade-symbol {
          font-size: 26px !important; /* 20% smaller than 32px */
        }
        
        .mobile-trade-page .trade-content .active-trades-tab .countdown {
          font-size: 36px !important; /* Bigger countdown text for mobile */
        }
        
        .mobile-trade-page .trade-content .active-trades-tab .trade-amount {
          font-size: 85px !important; /* 20% smaller than 106px */
        }
        
        .mobile-trade-page .trade-content .active-trades-tab .trade-arrow {
          font-size: 85px !important; /* 20% smaller than 106px */
        }
        
        .mobile-trade-page .trade-content .active-trades-tab .payout-amount {
          font-size: 77px !important; /* 20% smaller than 96px */
        }
        
        .mobile-trade-page .trade-content .active-trades-tab .no-trades-icon {
          font-size: 26px !important; /* 20% smaller than 32px */
        }
        
        .mobile-trade-page .trade-content .active-trades-tab .no-trades-text {
          font-size: 26px !important; /* 20% smaller than 32px */
        }
        
        /* Trade history content */
        .mobile-trade-page .trade-content .trade-history-tab * {
          font-size: 22px !important; /* 30% smaller than 32px */
        }
        
        .mobile-trade-page .trade-content .trade-history-tab .trade-symbol {
          font-size: 67px !important; /* 30% smaller than 96px */
        }
        
        .mobile-trade-page .trade-content .trade-history-tab .trade-result {
          font-size: 67px !important; /* 30% smaller than 96px */
        }
        
        .mobile-trade-page .trade-content .trade-history-tab .trade-amount {
          font-size: 74px !important; /* 30% smaller than 106px */
        }
        
        .mobile-trade-page .trade-content .trade-history-tab .trade-arrow {
          font-size: 74px !important; /* 30% smaller than 106px */
        }
        
        .mobile-trade-page .trade-content .trade-history-tab .payout-amount {
          font-size: 67px !important; /* 30% smaller than 96px */
        }
        
        .mobile-trade-page .trade-content .trade-history-tab .trade-details {
          font-size: 52px !important; /* 30% smaller than 74px */
        }
        
        .mobile-trade-page .trade-history-tab .no-history-icon {
          font-size: 298px !important; /* 30% smaller than 426px */
        }
        
        .mobile-trade-page .trade-content .trade-history-tab .no-history-text {
          font-size: 67px !important; /* 30% smaller than 96px */
        }
        
        /* View Full History button */
        .mobile-trade-page .trade-content .view-full-history-btn {
          font-size: 86px !important; /* Was 43px */
        }
        
        /* Close button */
        .mobile-trade-page .close-btn {
          font-size: 32px !important; /* Was 16px */
        }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const candleSeriesRef = useRef(null);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  
  // NEW: Historical data management refs
  const isLoadingHistoricalRef = useRef(false);
  const lastRequestTimeRef = useRef(0);
  const earliestLoadedTimeRef = useRef(null);
  const allCandlesRef = useRef([]);
  const scrollThrottleRef = useRef(null);
  
  // Removed custom price scale formatter - using default Lightweight Charts behavior
  
  // Authentication
  const { user, logout } = useAuth();
  
  // Per-symbol trade storage
  const [tradesBySymbol, setTradesBySymbol] = useState(() => 
    user ? loadUserState(user.id, USER_STORAGE_KEYS.TRADE_HISTORY, {}) : {}
  );
  const [amount, setAmount] = useState(() => 
    user ? loadUserState(user.id, USER_STORAGE_KEYS.SELECTED_INVESTMENT, 200) : 200
  );
  const [duration, setDuration] = useState(() => 
    user ? loadUserState(user.id, USER_STORAGE_KEYS.SELECTED_TIME, 60) : 60
  );
  const [now, setNow] = useState(Math.floor(Date.now() / 1000));
  const [symbol, setSymbol] = useState(() => 
    user ? loadUserState(user.id, USER_STORAGE_KEYS.SELECTED_PAIR, "BTCUSDT") : "BTCUSDT"
  );
  const [interval, setIntervalTf] = useState(() => 
    user ? loadUserState(user.id, USER_STORAGE_KEYS.SELECTED_TIMEFRAME, "1m") : "1m"
  );
  const [isPlacingTrade, setIsPlacingTrade] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [showTradeHistory, setShowTradeHistory] = useState(false);
  const [showTimePopup, setShowTimePopup] = useState(false);
  
  // NEW: Historical data loading states
  const [isLoadingHistorical, setIsLoadingHistorical] = useState(false);
  const [hasMoreHistoricalData, setHasMoreHistoricalData] = useState(true);
  const [showAccountPopup, setShowAccountPopup] = useState(false);
  const [showAccountSwitcher, setShowAccountSwitcher] = useState(false);
  const [showTradeDetailsModal, setShowTradeDetailsModal] = useState(false);
  const [selectedHistoryTrade, setSelectedHistoryTrade] = useState(null);
  const [showFullHistory, setShowFullHistory] = useState(false);
  
  // NEW: Additional state for new features
  const [showFullHistoryModal, setShowFullHistoryModal] = useState(false);
  const [showTimePickerPopup, setShowTimePickerPopup] = useState(false);
  
  // NEW: Mobile trade page state
  const [showMobileTradePage, setShowMobileTradePage] = useState(false);
  const [isClosingTradePage, setIsClosingTradePage] = useState(false);
  
  // NEW: Deposit/Withdrawal modal states - REMOVED for placeholder implementation
  // const [showDepositModal, setShowDepositModal] = useState(false);
  // const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  // const [depositAmount, setDepositAmount] = useState(1000);
  // const [withdrawalAmount, setWithdrawalAmount] = useState(1000);
  
  // NEW: Simplified active trades state with countdown and line info
  const [activeTrades, setActiveTrades] = useState(() => 
    user ? loadUserState(user.id, USER_STORAGE_KEYS.ACTIVE_TRADES, []) : []
  );
  // PROPER: Trade-to-line mapping - keys are trade IDs, values are { series, line } objects
  const tradeLinesRef = useRef({}); // { tradeId: { series: candlestickSeries, line: priceLine } }
  
  const [accountType, setAccountType] = useState(() => 
    user ? loadUserState(user.id, USER_STORAGE_KEYS.ACCOUNT_TYPE, "demo") : "demo"
  );
  const [demoBalance, setDemoBalance] = useState(10000);
  const [realBalance, setRealBalance] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const [streamType, setStreamType] = useState(() => loadState('streamType', "kline")); // "kline" or "trade"
  
  // Timezone state
  const [timezoneOffset, setTimezoneOffset] = useState(() => {
    const stored = localStorage.getItem(TIMEZONE_STORAGE_KEY);
    return stored ? parseInt(stored, 10) : DEFAULT_TIMEZONE_OFFSET;
  });
  
  // Socket.IO setup for real-time balance updates
  const socketRef = useRef(null);
  
  // Persistence effects - User-specific storage
  useEffect(() => {
    if (user) {
      saveUserState(user.id, USER_STORAGE_KEYS.TRADE_HISTORY, tradesBySymbol);
    }
  }, [tradesBySymbol, user]);

  useEffect(() => {
    if (user) {
      saveUserState(user.id, USER_STORAGE_KEYS.SELECTED_INVESTMENT, amount);
    }
  }, [amount, user]);

  useEffect(() => {
    if (user) {
      saveUserState(user.id, USER_STORAGE_KEYS.SELECTED_TIME, duration);
    }
  }, [duration, user]);

  useEffect(() => {
    if (user) {
      saveUserState(user.id, USER_STORAGE_KEYS.SELECTED_PAIR, symbol);
    }
  }, [symbol, user]);

  useEffect(() => {
    if (user) {
      saveUserState(user.id, USER_STORAGE_KEYS.SELECTED_TIMEFRAME, interval);
    }
  }, [interval, user]);

  useEffect(() => {
    if (user) {
      saveUserState(user.id, USER_STORAGE_KEYS.ACTIVE_TRADES, activeTrades);
    }
  }, [activeTrades, user]);

  useEffect(() => {
    if (user) {
      saveUserState(user.id, USER_STORAGE_KEYS.ACCOUNT_TYPE, accountType);
    }
  }, [accountType, user]);

  // Removed localStorage persistence for balances - database is now authoritative source

  // NEW: Update balances in database
  const updateBalancesInDatabase = async (newDemoBalance, newRealBalance) => {
    if (!user) return;
    
    try {
      const response = await fetch(`http://localhost:4000/api/user/balance`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          demoBalance: newDemoBalance,
          realBalance: newRealBalance
        })
      });
      
      if (response.ok) {
        console.log('💰 Updated balances in database:', { demoBalance: newDemoBalance, realBalance: newRealBalance });
      } else {
        console.error('❌ Failed to update balances in database');
      }
    } catch (error) {
      console.error('❌ Error updating balances in database:', error);
    }
  };

  useEffect(() => {
    saveState('streamType', streamType);
  }, [streamType]);
  
  // NEW: User authentication change effect - handles login/logout
  useEffect(() => {
    if (user) {
      console.log(`🔐 User logged in: ${user.username} (ID: ${user.id})`);
      
      // Clear all existing chart lines to prevent ghost lines
      cleanupAllTradeLines();
      
      // Fetch fresh balance data from database
      fetchUserBalancesFromDatabase();
      
      // Fetch fresh trade data from database
      fetchUserTradesFromDatabase();
    } else {
      console.log('🔐 User logged out - clearing UI state');
      
      // Clear UI state but preserve user data in localStorage
      setActiveTrades([]);
      setTradesBySymbol({});
      setDemoBalance(10000);
      setRealBalance(0);
      
      // Clear all chart lines
      cleanupAllTradeLines();
    }
  }, [user]); // Run when user changes (login/logout)

  // Socket.IO connection and balance update listener
  useEffect(() => {
    if (user) {
      // Connect to Socket.IO server
      socketRef.current = io('http://localhost:4000');
      
      // Authenticate with JWT token
      socketRef.current.emit('authenticate', { token: localStorage.getItem('token') });
      
      // Join user-specific room
      socketRef.current.emit('join', { userId: user.id });
      
      // Listen for balance updates from admin adjustments
      socketRef.current.on('balance:update', (data) => {
        console.log('💰 Received balance update via Socket.IO:', data);
        
        if (data.accountType === 'demo') {
          setDemoBalance(parseFloat(data.newBalance));
        } else if (data.accountType === 'real') {
          setRealBalance(parseFloat(data.newBalance));
        }
      });
      
      // Cleanup function
      return () => {
        if (socketRef.current) {
          socketRef.current.disconnect();
          socketRef.current = null;
        }
      };
    } else {
      // Disconnect when user logs out
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    }
  }, [user]);

  // NEW: Fetch user balances from database
  const fetchUserBalancesFromDatabase = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`http://localhost:4000/api/user/balance`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const balanceData = await response.json();
        console.log('💰 Fetched balances from database:', balanceData);
        
        // Update balances with fresh data from database
        setDemoBalance(balanceData.demoBalance || 10000);
        setRealBalance(balanceData.realBalance || 0);
      } else {
        console.error('❌ Failed to fetch balances from database');
      }
    } catch (error) {
      console.error('❌ Error fetching balances from database:', error);
    }
  };

  // NEW: Fetch user trades from database
  const fetchUserTradesFromDatabase = async () => {
    if (!user) return;
    
    try {
      console.log(`📊 Fetching trades for user ${user.id} from database...`);
      
      const response = await fetch(`/api/user/trades?userId=${user.id}`);
      const data = await response.json();
      
      if (data.trades) {
        const currentTime = Math.floor(Date.now() / 1000);
        const activeTrades = [];
        const tradeHistory = {};
        
        data.trades.forEach(trade => {
          // Check if trade is still active (not expired and no result)
          if (trade.expiry_time > currentTime && !trade.result) {
            // Active trade - add to activeTrades for line creation
            activeTrades.push({
              id: trade.id,
              symbol: trade.symbol,
              side: trade.side,
              amount: trade.amount,
              entryPrice: trade.entry_price,
              expiryTime: trade.expiry_time,
              duration: trade.duration || (trade.expiry_time - trade.entry_time),
              durationSec: trade.durationSec || trade.duration || (trade.expiry_time - trade.entry_time),
              accountType: trade.accountType
            });
          } else {
            // Closed trade - add to history
            if (!tradeHistory[trade.symbol]) {
              tradeHistory[trade.symbol] = [];
            }
            tradeHistory[trade.symbol].push({
              id: trade.id,
              symbol: trade.symbol,
              side: trade.side,
              amount: trade.amount,
              entryPrice: trade.entry_price,
              expiryTime: trade.expiry_time,
              duration: trade.duration || (trade.expiry_time - trade.entry_time),
              durationSec: trade.durationSec || trade.duration || (trade.expiry_time - trade.entry_time),
              result: trade.result,
              expiry_price: trade.expiry_price,
              payout_amount: trade.payout_amount,
              accountType: trade.accountType
            });
          }
        });
        
        console.log(`📊 Found ${activeTrades.length} active trades and ${Object.values(tradeHistory).flat().length} closed trades`);
        
        // Update state with fresh data
        setActiveTrades(activeTrades);
        setTradesBySymbol(tradeHistory);
        
        // Restore chart lines for active trades only
        restoreTradeLines();
      }
    } catch (error) {
      console.error('❌ Error fetching user trades:', error);
    }
  };

  // NEW: Simplified startup processing for active trades (legacy - only runs on mount)
  useEffect(() => {
    const currentTime = Math.floor(Date.now() / 1000);
    
    // Clean up any existing lines first
    cleanupAllTradeLines();
    
    // Process activeTrades: move expired to history, keep active ones
    setActiveTrades(prevActiveTrades => {
      const stillActive = [];
      const expiredTrades = [];
      
      prevActiveTrades.forEach(trade => {
        if (trade.expiryTime > currentTime) {
          // Still active - keep it (line will be recreated in restoreTradeLines)
          stillActive.push(trade);
        } else {
          // Expired - move to history (no line recreation needed)
          expiredTrades.push({
            ...trade,
            result: calculateTradeResult(trade),
            expiry_price: currentPrice || trade.entryPrice,
            payout_amount: calculatePayoutAmount(trade)
          });
        }
      });
      
      // Add expired trades to history
      if (expiredTrades.length > 0) {
        setTradesBySymbol(prev => {
          const updated = { ...prev };
          expiredTrades.forEach(trade => {
            if (!updated[trade.symbol]) {
              updated[trade.symbol] = [];
            }
            updated[trade.symbol].push(trade);
          });
          return updated;
        });
      }
      
      return stillActive;
    });
  }, []); // Run only on mount
  
  // PROPER: Line management helper functions
  const createTradeLine = (trade) => {
    if (!candleSeriesRef.current) return null;
    
    try {
      const priceLine = candleSeriesRef.current.createPriceLine({
        price: trade.entryPrice,
        color: trade.side === "CALL" ? "#00ff88" : "#ff4444",
        lineWidth: 2,
        lineStyle: 0,
        axisLabelVisible: true,
        title: `${trade.side} $${trade.amount}`,
      });
      
      // Store both series and line references in our mapping
      tradeLinesRef.current[trade.id] = {
        series: candleSeriesRef.current,
        line: priceLine
      };
      console.log(`✅ Created and stored price line for trade ${trade.id}`);
      return priceLine;
    } catch (error) {
      console.log("❌ Error creating price line:", error);
      return null;
    }
  };
  
  const removeTradeLine = (tradeId) => {
    const lineInfo = tradeLinesRef.current[tradeId];
    if (lineInfo && lineInfo.series && lineInfo.line) {
      try {
        // Use the correct API: series.removePriceLine(lineRef)
        lineInfo.series.removePriceLine(lineInfo.line);
        console.log(`🗑️ Explicitly removed price line for trade ${tradeId} using series API`);
      } catch (e) {
        console.log("Error removing price line:", e);
      }
    }
    // Always delete from our mapping, even if removal failed
    delete tradeLinesRef.current[tradeId];
  };
  
  const cleanupAllTradeLines = () => {
    Object.keys(tradeLinesRef.current).forEach(tradeId => {
      removeTradeLine(tradeId);
    });
  };
  
  // Helper functions for trade calculations
  const calculateTradeResult = (trade) => {
    const expiryPrice = currentPrice || trade.entryPrice;
    if (trade.side === "CALL") {
      if (expiryPrice > trade.entryPrice) return "WIN";
      if (expiryPrice === trade.entryPrice) return "REFUND";
      return "LOSE";
    } else {
      if (expiryPrice < trade.entryPrice) return "WIN";
      if (expiryPrice === trade.entryPrice) return "REFUND";
      return "LOSE";
    }
  };
  
  const calculatePayoutAmount = (trade) => {
    const result = calculateTradeResult(trade);
    const payout = profitRates[trade.symbol] || 91;
    
    if (result === "WIN") {
      return trade.amount + (trade.amount * payout / 100);
    } else if (result === "REFUND") {
      return trade.amount;
    } else {
      return 0;
    }
  };
  
  // Removed custom price scale formatter functions - using default Lightweight Charts behavior
  
  // WebSocket cleanup function
  const closeWebSocket = (reason = "Switching connection") => {
    if (wsRef.current) {
      // Clear any pending reconnect timeout first
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
      if (wsRef.current.readyState === WebSocket.OPEN) {
        console.log(`🔌 Intentionally closing WebSocket: ${reason}`);
        wsRef.current.close(1000, reason);
      }
      wsRef.current = null;
    }
  };

  // Binance WebSocket connection
  const connectToBinance = () => {
    // Close existing connection first
    closeWebSocket("Switching to new stream");

    const symbolLower = symbol.toLowerCase();
    const streamUrl = streamType === "kline" 
      ? `wss://stream.binance.com:9443/ws/${symbolLower}@kline_${interval}`
      : `wss://stream.binance.com:9443/ws/${symbolLower}@trade`;

    console.log(`🔗 Connecting to Binance WebSocket: ${streamUrl}`);
    setConnectionStatus("connecting");
    setError(null);

    const ws = new WebSocket(streamUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("✅ Connected to Binance WebSocket");
      setConnectionStatus("connected");
      setIsLoading(false);
      
      // Clear any existing reconnect timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.k) {
          // Kline/Candlestick data (from kline stream)
          const kline = data.k;
          const candle = {
            time: Math.floor(kline.t / 1000), // Convert to seconds
            open: parseFloat(kline.o),
            high: parseFloat(kline.h),
            low: parseFloat(kline.l),
            close: parseFloat(kline.c),
          };
          
          // NEW: Merge real-time candle with historical data
          const existingCandles = allCandlesRef.current;
          const existingIndex = existingCandles.findIndex(c => c.time === candle.time);
          
          if (existingIndex !== -1) {
            // Update existing candle
            existingCandles[existingIndex] = candle;
          } else {
            // Add new candle to the end
            existingCandles.push(candle);
            // Sort to maintain chronological order
            existingCandles.sort((a, b) => a.time - b.time);
          }
          
          // Update chart with merged data
          if (candleSeriesRef.current) {
            candleSeriesRef.current.setData(existingCandles);
          }
          
          setCurrentPrice(candle.close);
        } else if (data.p) {
          // Trade data (from trade stream)
          const price = parseFloat(data.p);
          setCurrentPrice(price);
          
          // For trade stream, we don't update candlestick chart
          // The chart will keep showing historical candles from REST API
          console.log(`💰 Trade price update: ${price}`);
        }
      } catch (error) {
        console.error("Error parsing WebSocket data:", error);
      }
    };

    ws.onerror = (error) => {
      console.error("❌ Binance WebSocket error:", error);
      setError("WebSocket connection error");
      setConnectionStatus("error");
    };

    ws.onclose = (event) => {
      console.log("🔌 Binance WebSocket closed:", event.code, event.reason);
      
      // Only update status if this is still the current WebSocket
      if (wsRef.current === ws) {
        setConnectionStatus("disconnected");
        
        // Auto-reconnect after 3 seconds if not intentionally closed (code 1000)
        if (event.code !== 1000 && !event.reason?.includes("Switching")) {
          console.log("🔄 Attempting to reconnect in 3 seconds...");
          reconnectTimeoutRef.current = setTimeout(() => {
            // Only reconnect if we don't have a newer connection
            if (wsRef.current === ws || wsRef.current === null) {
              connectToBinance();
            }
          }, 3000);
        }
      }
    };
  };

  // NEW: Simplified restore trade lines for active trades
  const restoreTradeLines = () => {
    if (!candleSeriesRef.current) return;
    
    const currentTime = Math.floor(Date.now() / 1000);
    
    // Filter for truly active trades only
    const trulyActiveTrades = activeTrades.filter(trade => 
      trade.expiryTime > currentTime && !trade.result
    );
    
    console.log(`🔄 Restoring lines for ${trulyActiveTrades.length} truly active trades (filtered from ${activeTrades.length} total)`);
    
    trulyActiveTrades.forEach(trade => {
      // Use the new helper function to create and store the line
      createTradeLine(trade);
    });
  };

  // Load historical candles from Binance REST API with pagination
  const loadHistoricalCandles = useCallback(async (endTime = null, limit = 500) => {
    // Prevent concurrent requests
    if (isLoadingHistoricalRef.current) {
      console.log("⏳ Historical data request already in progress, skipping...");
      return;
    }

    // Rate limiting: respect Binance API limits (1200 requests/minute = 1 request per 50ms)
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTimeRef.current;
    if (timeSinceLastRequest < 50) {
      console.log("⏳ Rate limiting: waiting before next request...");
      return;
    }

    try {
      isLoadingHistoricalRef.current = true;
      setIsLoadingHistorical(true);
      lastRequestTimeRef.current = now;

      const symbolUpper = symbol.toUpperCase();
      const binanceInterval = interval;
      
      // Build URL with pagination parameters
      let url = `https://api.binance.com/api/v3/klines?symbol=${symbolUpper}&interval=${binanceInterval}&limit=${limit}`;
      if (endTime) {
        url += `&endTime=${endTime}`;
      }
      
      console.log(`📊 Loading historical candles from: ${url}`);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (Array.isArray(data) && data.length > 0) {
        const newCandles = data.map(item => ({
          time: Math.floor(item[0] / 1000), // Convert to seconds
          open: parseFloat(item[1]),
          high: parseFloat(item[2]),
          low: parseFloat(item[3]),
          close: parseFloat(item[4]),
        }));

        // Sort candles by time to ensure proper order
        newCandles.sort((a, b) => a.time - b.time);

        // Merge with existing candles, avoiding duplicates
        const existingCandles = allCandlesRef.current;
        const mergedCandles = [...existingCandles];
        
        newCandles.forEach(newCandle => {
          const existingIndex = mergedCandles.findIndex(c => c.time === newCandle.time);
          if (existingIndex === -1) {
            mergedCandles.push(newCandle);
          }
        });

        // Sort merged candles by time
        mergedCandles.sort((a, b) => a.time - b.time);
        
        // Update refs and state
        allCandlesRef.current = mergedCandles;
        const earliestCandle = mergedCandles[0];
        if (earliestCandle) {
          earliestLoadedTimeRef.current = earliestCandle.time;
        }

        // Update chart with all candles
        if (candleSeriesRef.current && mergedCandles.length > 0) {
          candleSeriesRef.current.setData(mergedCandles);
          const latestCandle = mergedCandles[mergedCandles.length - 1];
          setCurrentPrice(latestCandle.close);
          console.log(`✅ Loaded ${newCandles.length} historical candles, total: ${mergedCandles.length}`);
        }

        // Check if we've reached the limit (less than requested candles returned)
        if (data.length < limit) {
          setHasMoreHistoricalData(false);
          console.log("🏁 Reached end of available historical data");
        }
      } else {
        // No more data available
        setHasMoreHistoricalData(false);
        console.log("🏁 No more historical data available");
      }
    } catch (error) {
      console.error("❌ Error loading historical candles:", error);
      setError("Failed to load historical chart data");
    } finally {
      isLoadingHistoricalRef.current = false;
      setIsLoadingHistorical(false);
    }
  }, [symbol, interval]);

  // Load initial candlestick data from Binance REST API
  const loadInitialCandles = async () => {
    try {
      // Reset historical data state
      allCandlesRef.current = [];
      earliestLoadedTimeRef.current = null;
      setHasMoreHistoricalData(true);
      setIsLoadingHistorical(false);
      
      // Clear any pending scroll throttle
      if (scrollThrottleRef.current) {
        clearTimeout(scrollThrottleRef.current);
        scrollThrottleRef.current = null;
      }
      
      // Load initial 500 candles
      await loadHistoricalCandles(null, 500);
    } catch (error) {
      console.error("❌ Error loading initial candles:", error);
      setError("Failed to load initial chart data");
    }
  };
  
  // Click outside handler for popups
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showTimePopup && !event.target.closest('.time-popup') && !event.target.closest('.time-input')) {
        setShowTimePopup(false);
      }
      if (showAccountPopup && !event.target.closest('.account-popup') && !event.target.closest('.account-selector')) {
        setShowAccountPopup(false);
      }
      // NEW: Handle time picker popup
      if (showTimePickerPopup && !event.target.closest('.time-picker-popup')) {
        setShowTimePickerPopup(false);
      }
      // NEW: Handle account switcher
      if (showAccountSwitcher && !event.target.closest('.account-switcher') && !event.target.closest('.account-selector')) {
        setShowAccountSwitcher(false);
      }
      // NEW: Handle modals (click outside to close)
      if (showFullHistoryModal || showTradeDetailsModal) {
        if (!event.target.closest('.modal-content')) {
          closeModal();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showTimePopup, showAccountPopup, showTimePickerPopup, showAccountSwitcher, showFullHistoryModal, showTradeDetailsModal]);
  
  const [profitRates, setProfitRates] = useState({
    "BTCUSDT": 91,
    "ETHUSDT": 85,
    "XRPUSDT": 80,
    "LTCUSDT": 80,
    "SOLUSDT": 80,
    "ADAUSDT": 80,
    "DOGEUSDT": 80,
    "DOTUSDT": 80,
    "AVAXUSDT": 80,
    "LINKUSDT": 80
  });

  // NEW: Admin settings integration
  const [adminPairsConfig, setAdminPairsConfig] = useState(null);
  const [visiblePairs, setVisiblePairs] = useState([]);

  // Load admin settings on mount
  useEffect(() => {
    const loadAdminSettings = () => {
      try {
        const savedConfig = localStorage.getItem("adminPairsConfig");
        if (savedConfig) {
          const config = JSON.parse(savedConfig);
          setAdminPairsConfig(config);
          
          // Filter visible pairs
          const visible = Object.entries(config)
            .filter(([symbol, pairConfig]) => pairConfig.visible)
            .map(([symbol]) => symbol);
          setVisiblePairs(visible);
          
          // Update profit rates from admin settings
          const updatedRates = {};
          Object.entries(config).forEach(([symbol, pairConfig]) => {
            updatedRates[symbol] = pairConfig.payout;
          });
          setProfitRates(updatedRates);
          
          // If current symbol is not visible, switch to first visible pair
          if (visible.length > 0 && !visible.includes(symbol)) {
            setSymbol(visible[0]);
          }
        } else {
          // Fallback: use all default pairs if no admin settings
          setVisiblePairs(Object.keys(profitRates));
        }
      } catch (error) {
        console.error("Error loading admin settings:", error);
        // Fallback: use all default pairs if error
        setVisiblePairs(Object.keys(profitRates));
      }
    };

    loadAdminSettings();

    // Listen for changes in admin settings
    const handleStorageChange = (e) => {
      if (e.key === "adminPairsConfig") {
        loadAdminSettings();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
  
  const payout = profitRates[symbol] || 91;

  // Get trades for current symbol
  const trades = tradesBySymbol[symbol] || [];
  // NEW: Show only active trades for the current account type
  const activeTradesForDisplay = activeTrades
    .filter(trade => trade.accountType === accountType)
    .sort((a, b) => b.id - a.id);

  // NEW: Simplified active trade lines (from new activeTrades state) - only for current symbol and account
  const activeTradeLines = activeTrades
    .filter(trade => trade.symbol === symbol && trade.accountType === accountType)
    .map(trade => ({
      id: trade.id,
      entryPrice: trade.entryPrice,
      side: trade.side,
      amount: trade.amount,
      expiryTime: trade.expiryTime
    }));

  // NEW: Simplified unified timer for active trades
  useEffect(() => {
    console.log("🚀 Starting simplified timer for active trades...");
    
    const timer = setInterval(() => {
      const currentTime = Math.floor(Date.now() / 1000);
      setNow(currentTime);
      
      // Check for expired trades and remove them
      setActiveTrades(prevActiveTrades => {
        const stillActive = [];
        const expiredTrades = [];
        
        prevActiveTrades.forEach(trade => {
          if (trade.expiryTime > currentTime) {
            // Still active
            stillActive.push(trade);
          } else {
            // Expired - remove line and move to history
            expiredTrades.push(trade);
            
            // IMMEDIATE LINE REMOVAL - synchronous execution
            removeTradeLine(trade.id);
          }
        });
        
        // Move expired trades to history
        if (expiredTrades.length > 0) {
          expiredTrades.forEach(trade => {
            const result = calculateTradeResult(trade);
            const payoutAmount = calculatePayoutAmount(trade);
            
            // Update balance
            if (trade.accountType === "demo") {
              setDemoBalance(prev => {
                const newBalance = prev + payoutAmount;
                // Update database asynchronously
                updateBalancesInDatabase(newBalance, realBalance);
                return newBalance;
              });
            } else {
              setRealBalance(prev => {
                const newBalance = prev + payoutAmount;
                // Update database asynchronously
                updateBalancesInDatabase(demoBalance, newBalance);
                return newBalance;
              });
            }
            
            // Add to history
            setTradesBySymbol(prev => {
              const updated = { ...prev };
              if (!updated[trade.symbol]) {
                updated[trade.symbol] = [];
              }
              updated[trade.symbol].push({
                ...trade,
                result,
                expiry_price: currentPrice || trade.entryPrice,
                payout_amount: payoutAmount,
                durationSec: trade.durationSec || trade.duration || (trade.expiryTime - trade.entryTime)
              });
              return updated;
            });
          });
        }
        
        return stillActive;
      });
      
    }, 1000);
    
    return () => {
      console.log("🛑 Cleaning up simplified timer");
      clearInterval(timer);
    };
  }, []); // Empty dependency array - timer should run only once

  // Clear loading state after timeout
  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsLoading(false);
    }, 10000);
    return () => clearTimeout(timeout);
  }, []);

  // Chart setup effect (separate from WebSocket)
  useEffect(() => {
    if (!chartRef.current) return;

    // Removed complex mobile initialization timing - using default behavior

    try {
      // Clean up previous chart
      if (chartInstanceRef.current) {
        try {
          chartInstanceRef.current.remove();
        } catch (e) {
          console.log("Chart already disposed");
        }
        chartInstanceRef.current = null;
        candleSeriesRef.current = null;
      }

      // Create new chart
      const chart = createChart(chartRef.current, {
        width: chartRef.current.clientWidth,
        height: chartRef.current.clientHeight,
        layout: {
          background: { color: '#1a1a1a' },
          textColor: '#ffffff',
        },
        grid: {
          vertLines: { color: '#2a2a2a' },
          horzLines: { color: '#2a2a2a' },
        },
        timeScale: {
          timeVisible: true,
          secondsVisible: false,
          borderColor: '#2a2a2a',
          rightOffset: 5,
          barSpacing: 3,
          tickMarkFormatter: (time) => {
            const date = new Date(time * 1000);
            return formatInOffset(date.getTime(), timezoneOffset);
          },
        },
        rightPriceScale: {
          borderColor: '#2a2a2a',
          scaleMargins: {
            top: 0.1,
            bottom: 0.1,
          },
          visible: true,
        },
        crosshair: {
          mode: 1,
        },
        localization: {
          timeFormatter: (time) => {
            const date = new Date(time * 1000);
            return formatInOffset(date.getTime(), timezoneOffset);
          },
        },
        handleScroll: {
          mouseWheel: true,
          pressedMouseMove: true,
          horzTouchDrag: true,
          vertTouchDrag: true,
        },
        handleScale: {
          axisPressedMouseMove: true,
          mouseWheel: true,
          pinch: true,
        },
        watermark: {
          visible: false,
        },
        branding: {
          visible: false,
        },
        logo: {
          visible: false,
        },
        attribution: {
          visible: false,
        },
        copyright: {
          visible: false,
        },
      });

      chartInstanceRef.current = chart;
      
      // Force chart to expand and fill container after creation
      setTimeout(() => {
        if (chartInstanceRef.current && chartRef.current) {
          const container = chartRef.current;
          const width = container.offsetWidth;
          const height = container.offsetHeight;
          
          console.log('Forcing chart resize to:', { width, height });
          
          // Force chart to use full container dimensions
          chartInstanceRef.current.resize(width, height);
          
          // Apply options to ensure chart expands
          chartInstanceRef.current.applyOptions({
            width: width,
            height: height,
            layout: {
              background: { color: '#1a1a1a' },
              textColor: '#ffffff',
            }
          });
        }
      }, 200);
      
      // Try to remove any branding elements after chart creation
      setTimeout(() => {
        if (chartRef.current) {
          const chartContainer = chartRef.current;
          const brandingElements = chartContainer.querySelectorAll('[class*="logo"], [class*="branding"], [class*="watermark"], [id*="logo"], [id*="branding"], [id*="watermark"]');
          brandingElements.forEach(el => {
            el.style.display = 'none';
          });
          
          // Also try to hide any SVG elements that might be branding
          const svgElements = chartContainer.querySelectorAll('svg');
          svgElements.forEach(svg => {
            if (svg.getAttribute('data-role') === 'logo' || 
                svg.getAttribute('data-role') === 'branding' || 
                svg.getAttribute('data-role') === 'watermark') {
              svg.style.display = 'none';
            }
          });
        }
      }, 100);

      // Removed complex mobile chart axis styling - using default Lightweight Charts behavior
      
      // Create candlestick series
      const candleSeries = chart.addCandlestickSeries({
        upColor: '#00ff88',
        downColor: '#ff4444',
        borderVisible: false,
        wickUpColor: '#00ff88',
        wickDownColor: '#ff4444',
        priceLineVisible: true, // Enable price lines
      });
      
      candleSeriesRef.current = candleSeries;

      // Removed complex mobile chart options - using default Lightweight Charts behavior

      // NEW: Add scroll event handler for historical data loading
      // This function detects when the user scrolls left (goes back in time) and automatically
      // loads more historical candles from Binance API using pagination
      const handleTimeScaleVisibleRangeChange = () => {
        if (!hasMoreHistoricalData || isLoadingHistorical) {
          return;
        }

        const timeScale = chart.timeScale();
        const visibleRange = timeScale.getVisibleRange();
        
        if (visibleRange && visibleRange.from) {
          // Check if we're approaching the left edge (earliest loaded data)
          const earliestLoaded = earliestLoadedTimeRef.current;
          if (earliestLoaded && visibleRange.from <= earliestLoaded + 60) { // 60 seconds buffer
            // Throttle scroll events to avoid spamming API
            if (scrollThrottleRef.current) {
              clearTimeout(scrollThrottleRef.current);
            }
            
            scrollThrottleRef.current = setTimeout(() => {
              console.log("📜 Scroll detected: loading more historical data...");
              // Load more historical data before the earliest loaded candle
              // Convert to milliseconds for Binance API (endTime parameter)
              loadHistoricalCandles(earliestLoaded * 1000, 500);
            }, 300); // 300ms throttle to prevent excessive API calls
          }
        }
      };

      // Subscribe to time scale changes
      chart.timeScale().subscribeVisibleTimeRangeChange(handleTimeScaleVisibleRangeChange);
      
      // Removed custom price scale label management - using default Lightweight Charts behavior

      // Function to apply mobile chart styling
      // Removed complex mobile chart styling - using default Lightweight Charts behavior

      // CLEANUP: Remove any orphaned lines when chart is recreated
      cleanupAllTradeLines();

      // Load initial data
      loadInitialCandles();

      // Restore trade lines for current symbol
      restoreTradeLines();

      // Handle resize
      const handleResize = () => {
        if (chartRef.current && chartInstanceRef.current) {
          try {
            chartInstanceRef.current.applyOptions({
              width: chartRef.current.clientWidth,
              height: chartRef.current.clientHeight,
            });
          } catch (e) {
            console.log("Chart resize error:", e);
          }
        }
      };

      // Simplified resize handling - removed complex mobile logic
      window.addEventListener('resize', handleResize);
      
      return () => {
        window.removeEventListener('resize', handleResize);
        
        // NEW: Cleanup scroll throttle
        if (scrollThrottleRef.current) {
          clearTimeout(scrollThrottleRef.current);
          scrollThrottleRef.current = null;
        }
        
        // Removed custom price scale label management cleanup
        
        if (chartInstanceRef.current) {
          try {
            chartInstanceRef.current.remove();
          } catch (e) {
            console.log("Chart cleanup error:", e);
          }
        }
      };
    } catch (err) {
      console.error("Chart setup error:", err);
      setError(err.message);
    }
  }, [symbol, interval, user, timezoneOffset]); // Added timezoneOffset dependency to update chart on timezone change

  // WebSocket connection management effect
  useEffect(() => {
    if (!symbol || !interval) return;
    
    // Connect to Binance WebSocket
    connectToBinance();
    
    return () => {
      // This cleanup only runs when dependencies change or component unmounts
      closeWebSocket("Effect cleanup");
    };
  }, [symbol, interval, streamType]);

  // Cleanup effect for component unmount
  useEffect(() => {
    return () => {
      closeWebSocket("Component unmounting");
      cleanupAllTradeLines(); // Ensure all lines are removed on unmount
    };
  }, []);

  // NEW: Simplified place function
  function place(side) {
    if (isPlacingTrade || !currentPrice) return;
    
    const currentBalance = accountType === "demo" ? demoBalance : realBalance;
    if (currentBalance < amount) {
      setError("Insufficient balance");
      return;
    }
    
    if (connectionStatus !== "connected") {
      setError("Not connected to market data");
      return;
    }
    
    const entryPrice = currentPrice;
    const tradeId = Date.now();
    const currentTime = Math.floor(Date.now() / 1000);
    const expiryTime = currentTime + Number(duration);
    
    // Create new active trade
    const newTrade = {
      id: tradeId,
      symbol,
      side,
      amount: Number(amount),
      entryPrice: entryPrice,
      expiryTime: expiryTime,
      duration: Number(duration),
      durationSec: Number(duration),
      accountType: accountType
    };
    
    setIsPlacingTrade(true);
    setError(null);
    
    // Deduct balance
    if (accountType === "demo") {
      setDemoBalance(prev => {
        const newBalance = prev - amount;
        // Update database asynchronously
        updateBalancesInDatabase(newBalance, realBalance);
        return newBalance;
      });
    } else {
      setRealBalance(prev => {
        const newBalance = prev - amount;
        // Update database asynchronously
        updateBalancesInDatabase(demoBalance, newBalance);
        return newBalance;
      });
    }
    
    // Add to active trades (this will trigger localStorage save)
    setActiveTrades(prev => [...prev, newTrade]);
    
    // Create price line immediately
    createTradeLine(newTrade);
    
    setTimeout(() => setIsPlacingTrade(false), 1000);
  }

  // Resolve trade function (local)
  function resolveTrade(tradeId) {
    setTradesBySymbol(prevTradesBySymbol => {
      const updatedTradesBySymbol = { ...prevTradesBySymbol };
      
      // Find the trade across all symbols
      let tradeSymbol = null;
      let trade = null;
      
      Object.keys(updatedTradesBySymbol).forEach(sym => {
        const symbolTrades = updatedTradesBySymbol[sym] || [];
        const foundTrade = symbolTrades.find(t => t.id === tradeId && !t.result);
        if (foundTrade) {
          tradeSymbol = sym;
          trade = foundTrade;
        }
      });
      
      if (!trade || !tradeSymbol) {
        console.log(`Trade ${tradeId} not found for resolution`);
        return prevTradesBySymbol;
      }
      
      const expiryPrice = currentPrice; // This should ideally be the price for that symbol
      let result = "LOSE";
      let payoutAmount = 0;
      const payout = profitRates[trade.symbol] || 91;
      
      if (trade.side === "CALL") {
        if (expiryPrice > trade.entry_price) {
          result = "WIN";
          payoutAmount = trade.amount + (trade.amount * payout / 100);
        } else if (expiryPrice === trade.entry_price) {
          result = "REFUND";
          payoutAmount = trade.amount;
        }
      } else if (trade.side === "PUT") {
        if (expiryPrice < trade.entry_price) {
          result = "WIN";
          payoutAmount = trade.amount + (trade.amount * payout / 100);
        } else if (expiryPrice === trade.entry_price) {
          result = "REFUND";
          payoutAmount = trade.amount;
        }
      }
      
      // Update balance
      if (trade.account_type === "demo") {
        setDemoBalance(prev => {
          const newBalance = prev + payoutAmount;
          // Update database asynchronously
          updateBalancesInDatabase(newBalance, realBalance);
          return newBalance;
        });
      } else {
        setRealBalance(prev => {
          const newBalance = prev + payoutAmount;
          // Update database asynchronously
          updateBalancesInDatabase(demoBalance, newBalance);
          return newBalance;
        });
      }
      
      console.log(`Trade #${tradeId} resolved for ${tradeSymbol}: ${result} - Payout: $${payoutAmount}`);
      
      // Update the trade in the symbol's trade list
      updatedTradesBySymbol[tradeSymbol] = updatedTradesBySymbol[tradeSymbol].map(t => 
        t.id === tradeId ? {
          ...t,
          result,
          expiry_price: expiryPrice,
          payout_amount: payoutAmount
        } : t
      );
      
      return updatedTradesBySymbol;
    });
  }

  function refillDemoBalance() {
    setDemoBalance(1000);
    // Update database asynchronously
    updateBalancesInDatabase(1000, realBalance);
  }

  function withdrawRealBalance() {
    alert("Withdrawal feature will be implemented soon!");
  }

  // Removed old addTradeLineSimple function - using new simplified approach

  function getTradePayoutAmount(trade) {
    const result = calculateTradeResult(trade);
    if (result === "WIN") {
      return trade.amount + (trade.amount * payout / 100);
    } else if (result === "REFUND") {
      return trade.amount;
    } else {
      return 0;
    }
  }

  function getTradeResultColor(trade) {
    const result = calculateTradeResult(trade);
    if (result === "WIN") return "#00ff88";
    if (result === "LOSE") return "#ff4444";
    if (result === "REFUND") return "#ffaa00";
    return "#666";
  }

  function formatTimeLeft(expiryTime) {
    const remaining = Math.max(0, expiryTime - now);
    const m = Math.floor(remaining / 60);
    const s = remaining % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  function formatDuration(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }

  function formatDurationSec(secRaw) {
    const sec = Math.max(0, Math.round(Number(secRaw) || 0));
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  }

  // NEW: Helper functions for new features
  const handleCloseTradePage = () => {
    setIsClosingTradePage(true);
    setTimeout(() => {
      setShowMobileTradePage(false);
      setIsClosingTradePage(false);
      setActiveTab('chart'); // Always return to chart view
    }, 400); // Match animation duration
  };

  const quickTimeOptions = [
    { label: "00:10", value: 10 },
    { label: "00:15", value: 15 },
    { label: "00:30", value: 30 },
    { label: "01:00", value: 60 },
    { label: "02:00", value: 120 },
    { label: "05:00", value: 300 },
    { label: "10:00", value: 600 },
    { label: "15:00", value: 900 }
  ];

  function formatDateTime(timestamp) {
    const date = new Date(timestamp * 1000);
    return formatInOffset(date.getTime(), timezoneOffset);
  }

  function formatTime(timestamp) {
    const date = new Date(timestamp * 1000);
    return formatInOffset(date.getTime(), timezoneOffset);
  }

  function refillBalance() {
    if (accountType === "demo") {
      setDemoBalance(10000);
      // Update database asynchronously
      updateBalancesInDatabase(10000, realBalance);
    } else {
      // For real account, this becomes a deposit function
      setRealBalance(prev => {
        const newBalance = prev + 1000;
        // Update database asynchronously
        updateBalancesInDatabase(demoBalance, newBalance);
        return newBalance;
      });
    }
  }

  // NEW: Account switcher functions
  function handleAccountSwitch(newAccountType) {
    setAccountType(newAccountType);
    setShowAccountSwitcher(false);
  }

  function handleDeposit() {
    // TODO: Implement deposit functionality
    console.log('Deposit button clicked - placeholder for future integration');
  }

  function handleWithdrawal() {
    // TODO: Implement withdrawal functionality
    console.log('Withdrawal button clicked - placeholder for future integration');
  }

  function handleActiveTradeClick(trade) {
    setSymbol(trade.symbol);
  }

  function handleHistoryTradeClick(trade) {
    setSelectedHistoryTrade(trade);
    setShowTradeDetailsModal(true);
  }

  function closeModal() {
    setShowFullHistoryModal(false);
    setShowTimePickerPopup(false);
    setShowTradeDetailsModal(false);
    // setShowDepositModal(false); // REMOVED
    // setShowWithdrawalModal(false); // REMOVED
    setSelectedHistoryTrade(null);
  }

  // Get all trades from all symbols for history - NEW: Filter by account type
  const allTrades = Object.values(tradesBySymbol).flat();
  const accountTrades = allTrades.filter(trade => trade.accountType === accountType);
  const historyAllNewestFirst = accountTrades.slice().sort((a, b) => b.id - a.id);
  const historyTrades = historyAllNewestFirst.slice(0, 5); // NEW: Limit to 5 trades

  const payoutAmount = (amount * payout) / 100;
  const currentBalance = accountType === "demo" ? demoBalance : realBalance;

  // NEW: Real-time payout calculation for active trades
  function calculateRealTimePayout(trade) {
    if (!currentPrice) return { amount: 0, status: 'unknown' };
    
    const entryPrice = trade.entryPrice;
    const currentPriceNum = parseFloat(currentPrice);
    
    if (trade.side === "CALL") {
      if (currentPriceNum > entryPrice) {
        // Winning
        const payoutAmount = trade.amount + (trade.amount * (profitRates[trade.symbol] || 80) / 100);
        return { amount: payoutAmount, status: 'winning' };
      } else if (currentPriceNum < entryPrice) {
        // Losing
        return { amount: 0, status: 'losing' };
      } else {
        // At entry price - refund
        return { amount: trade.amount, status: 'refunding' };
      }
    } else { // PUT
      if (currentPriceNum < entryPrice) {
        // Winning
        const payoutAmount = trade.amount + (trade.amount * (profitRates[trade.symbol] || 80) / 100);
        return { amount: payoutAmount, status: 'winning' };
      } else if (currentPriceNum > entryPrice) {
        // Losing
        return { amount: 0, status: 'losing' };
      } else {
        // At entry price - refund
        return { amount: trade.amount, status: 'refunding' };
      }
    }
  }

  // NEW: Deposit and withdrawal handlers - REMOVED for placeholder implementation
  // function confirmDeposit() {
  //   setRealBalance(prev => prev + depositAmount);
  //   setShowDepositModal(false);
  //   setDepositAmount(1000); // Reset to default
  // }

  // function confirmWithdrawal() {
  //   setRealBalance(prev => Math.max(0, prev - withdrawalAmount));
  //   setShowWithdrawalModal(false);
  //   setWithdrawalAmount(1000); // Reset to default
  // }



  return (
    <div style={{ 
      background: "#0f0f0f", 
      color: "white", 
      minHeight: "100vh", 
      height: "100vh",
      fontFamily: "Arial, sans-serif",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden"
    }}>


      {/* Top Header */}
      <div style={{
        minHeight: "60px",
        background: "#1a1a1a",
        borderBottom: "1px solid #2a2a2a",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 20px",
        flexWrap: "wrap",
        gap: "10px"
      }}>
        {isMobile ? (
          /* Mobile Layout - Centered Account Switcher with Large Trading Controls */
          <div style={{ 
            display: "flex", 
            flexDirection: "column", 
            alignItems: "center", 
            gap: "20px",
            width: "100%"
          }}>
            {/* Centered Account Switcher */}
            <div className="account-selector" style={{ position: "relative" }}>
              <div 
                style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "15px",
                  background: "transparent",
                  padding: "15px 25px",
                  borderRadius: "15px",
                  cursor: "pointer",
                  transition: "background-color 0.2s"
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAccountSwitcher(prev => !prev);
                }}
                onMouseEnter={(e) => e.target.style.background = "rgba(42, 42, 42, 0.3)"}
                onMouseLeave={(e) => e.target.style.background = "transparent"}
              >
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <span style={{ 
                    fontSize: "22px", 
                    color: "white", 
                    fontWeight: "bold" 
                  }}>
                    ${Number(currentBalance || 0).toFixed(2)}
                  </span>
                  <span style={{ 
                    fontSize: "16px", 
                    color: "#888", 
                    fontWeight: "500" 
                  }}>
                    {accountType === "demo" ? "Demo Account" : "Real Account"}
                  </span>
                </div>
                <span style={{ fontSize: "18px", color: "#666" }}>▼</span>
              </div>

              {/* Account Switcher Dropdown for Mobile */}
              {showAccountSwitcher && (
                <div className="account-switcher" style={{
                  position: "absolute",
                  top: "100%",
                  left: "0",
                  right: "0",
                  background: "#1a1a1a",
                  border: "1px solid #444",
                  borderRadius: "8px",
                  marginTop: "5px",
                  zIndex: 1000,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.5)"
                }}>
                  {/* Demo Account Option - Only show if NOT currently active */}
                  {accountType !== "demo" && (
                    <div 
                      style={{
                        padding: "12px",
                        cursor: "pointer",
                        borderBottom: "1px solid #333",
                        background: "transparent"
                      }}
                      onClick={() => handleAccountSwitch("demo")}
                      onMouseEnter={(e) => e.target.style.background = "#2a2a2a"}
                      onMouseLeave={(e) => e.target.style.background = "transparent"}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontSize: "16px" }}>🎓</span>
                        <div>
                          <div style={{ fontSize: "12px", color: "#ff8800", fontWeight: "bold" }}>Demo Account</div>
                          <div style={{ fontSize: "12px", color: "#ccc" }}>${demoBalance.toFixed(2)}</div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Refill Balance Button - Only for demo accounts when active */}
                  {accountType === "demo" && (
                    <div style={{
                      padding: "12px",
                      borderBottom: "1px solid #333",
                      background: "transparent"
                    }}>
                      <button
                        onClick={refillBalance}
                        aria-label="Refill Balance"
                        style={{
                          width: "100%",
                          padding: "10px 16px",
                          background: "#00ff88",
                          border: "1px solid #00ff88",
                          borderRadius: "8px",
                          color: "#000",
                          fontWeight: "bold",
                          fontSize: "12px",
                          cursor: "pointer",
                          boxShadow: "0 2px 8px rgba(0,255,136,0.3)",
                          transition: "all 0.2s ease",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px"
                        }}
                        onMouseOver={(e) => {
                          e.target.style.background = "#00ffaa";
                          e.target.style.transform = "translateY(-1px)";
                          e.target.style.boxShadow = "0 4px 12px rgba(0,255,136,0.4)";
                        }}
                        onMouseOut={(e) => {
                          e.target.style.background = "#00ff88";
                          e.target.style.transform = "translateY(0)";
                          e.target.style.boxShadow = "0 2px 8px rgba(0,255,136,0.3)";
                        }}
                      >
                        Refill
                      </button>
                    </div>
                  )}
                  
                  {/* Real Account Option - Only show if NOT currently active */}
                  {accountType !== "real" && (
                    <div 
                      style={{
                        padding: "12px",
                        cursor: "pointer",
                        borderBottom: "1px solid #333",
                        background: "transparent"
                      }}
                      onClick={() => handleAccountSwitch("real")}
                      onMouseEnter={(e) => e.target.style.background = "#2a2a2a"}
                      onMouseLeave={(e) => e.target.style.background = "transparent"}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontSize: "16px" }}>💰</span>
                        <div>
                          <div style={{ fontSize: "12px", color: "#00ff88", fontWeight: "bold" }}>Real Account</div>
                          <div style={{ fontSize: "12px", color: "#ccc" }}>${realBalance.toFixed(2)}</div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* User Info Section - Only show if user is logged in */}
                  {user && (
                    <>
                      {/* Username */}
                      <div style={{
                        padding: "12px",
                        borderBottom: "1px solid #333",
                        background: "transparent"
                      }}>
                        <div style={{ 
                          fontSize: "14px", 
                          color: "#fff", 
                          fontWeight: "600",
                          textShadow: "0 1px 2px rgba(0,0,0,0.5)"
                        }}>
                          {user.username || "Username: -"}
                        </div>
                      </div>
                      
                      {/* User ID */}
                      <div style={{
                        padding: "12px",
                        borderBottom: "1px solid #333",
                        background: "transparent"
                      }}>
                        <div style={{ 
                          fontSize: "12px", 
                          color: "#888",
                          fontWeight: "500"
                        }}>
                          ID: {user.id || "-"}
                        </div>
                      </div>
                      
                      {/* Admin Badge - if user is admin */}
                      {Boolean(user?.isAdmin) && (
                        <div style={{
                          padding: "8px 12px",
                          borderBottom: "1px solid #333",
                          background: "transparent",
                          display: "flex",
                          justifyContent: "center"
                        }}>
                          <button
                            onClick={() => window.location.href = '/admin'}
                            style={{
                              background: "linear-gradient(135deg, #ff8800 0%, #ff6600 100%)",
                              color: "#000",
                              padding: "4px 8px",
                              borderRadius: "6px",
                              fontSize: "10px",
                              fontWeight: "bold",
                              textTransform: "uppercase",
                              boxShadow: "0 2px 4px rgba(255,136,0,0.3)",
                              border: "1px solid #ffaa00",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                              cursor: "pointer",
                              transition: "all 0.2s ease"
                            }}
                            onMouseOver={(e) => {
                              e.target.style.background = "linear-gradient(135deg, #ffaa00 0%, #ff8800 100%)";
                              e.target.style.transform = "translateY(-1px)";
                              e.target.style.boxShadow = "0 4px 8px rgba(255,136,0,0.4)";
                            }}
                            onMouseOut={(e) => {
                              e.target.style.background = "linear-gradient(135deg, #ff8800 0%, #ff6600 100%)";
                              e.target.style.transform = "translateY(0)";
                              e.target.style.boxShadow = "0 2px 4px rgba(255,136,0,0.3)";
                            }}
                            aria-label="Admin"
                          >
                            🛡 Admin
                          </button>
                        </div>
                      )}
                      
                      {/* Deposit Button - Only for real accounts */}
                      {accountType === "real" && (
                        <div style={{
                          padding: "12px",
                          borderBottom: "1px solid #333",
                          background: "transparent"
                        }}>
                          <button
                            onClick={() => window.location.href = '/deposit'}
                            aria-label="Deposit"
                            style={{
                              width: "100%",
                              padding: "10px 16px",
                              background: "linear-gradient(135deg, #00ff88 0%, #00cc66 100%)",
                              border: "1px solid #00ff88",
                              borderRadius: "8px",
                              color: "#000",
                              fontWeight: "bold",
                              fontSize: "12px",
                              cursor: "pointer",
                              boxShadow: "0 2px 8px rgba(0,255,136,0.3)",
                              transition: "all 0.2s ease",
                              textTransform: "uppercase",
                              letterSpacing: "0.5px"
                            }}
                            onMouseOver={(e) => {
                              e.target.style.background = "linear-gradient(135deg, #00ffaa 0%, #00ff88 100%)";
                              e.target.style.transform = "translateY(-1px)";
                              e.target.style.boxShadow = "0 4px 12px rgba(0,255,136,0.4)";
                            }}
                            onMouseOut={(e) => {
                              e.target.style.background = "linear-gradient(135deg, #00ff88 0%, #00cc66 100%)";
                              e.target.style.transform = "translateY(0)";
                              e.target.style.boxShadow = "0 2px 8px rgba(0,255,136,0.3)";
                            }}
                          >
                            💰 Deposit
                          </button>
                        </div>
                      )}

                      {/* Withdrawal Button - Only for real accounts */}
                      {accountType === "real" && (
                        <div style={{
                          padding: "12px",
                          borderBottom: "1px solid #333",
                          background: "transparent"
                        }}>
                          <button
                            onClick={() => window.location.href = '/withdrawal'}
                            aria-label="Withdrawal"
                            style={{
                              width: "100%",
                              padding: "10px 16px",
                              background: "transparent",
                              border: "1px solid rgba(255, 255, 255, 0.2)",
                              borderRadius: "18px",
                              color: "white",
                              fontWeight: "600",
                              fontSize: "12px",
                              cursor: "pointer",
                              transition: "all 0.3s ease",
                              textTransform: "uppercase",
                              letterSpacing: "0.5px"
                            }}
                            onMouseOver={(e) => {
                              e.target.style.background = "rgba(255, 255, 255, 0.1)";
                              e.target.style.borderColor = "rgba(255, 255, 255, 0.3)";
                            }}
                            onMouseOut={(e) => {
                              e.target.style.background = "transparent";
                              e.target.style.borderColor = "rgba(255, 255, 255, 0.2)";
                            }}
                          >
                            💸 Withdrawal
                          </button>
                        </div>
                      )}
                      
                      {/* Logout Button */}
                      <div style={{
                        padding: "12px",
                        background: "transparent"
                      }}>
                        <button
                          onClick={logout}
                          aria-label="Logout"
                          style={{
                            width: "100%",
                            padding: "10px 16px",
                            background: "linear-gradient(135deg, #ff4444 0%, #cc3333 100%)",
                            border: "1px solid #ff6666",
                            borderRadius: "8px",
                            color: "white",
                            fontWeight: "bold",
                            fontSize: "12px",
                            cursor: "pointer",
                            boxShadow: "0 2px 8px rgba(255,68,68,0.3)",
                            transition: "all 0.2s ease",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px"
                          }}
                          onMouseOver={(e) => {
                            e.target.style.background = "linear-gradient(135deg, #ff6666 0%, #ff4444 100%)";
                            e.target.style.transform = "translateY(-1px)";
                            e.target.style.boxShadow = "0 4px 12px rgba(255,68,68,0.4)";
                          }}
                          onMouseOut={(e) => {
                            e.target.style.background = "linear-gradient(135deg, #ff4444 0%, #cc3333 100%)";
                            e.target.style.transform = "translateY(0)";
                            e.target.style.boxShadow = "0 2px 8px rgba(255,68,68,0.3)";
                          }}
                        >
                          Logout
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Large Trading Controls Row */}
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "20px",
              width: "100%",
              justifyContent: "center"
            }}>
              {/* Large Symbol Selector - 85% of page width */}
              <div className="mobile-symbol-selector" style={{ 
                background: "transparent",
                padding: "20px 25px",
                borderRadius: "15px",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                minWidth: "180px",
                flex: "0 0 85%",
                maxWidth: "85%"
              }}>
                <select 
                  value={symbol} 
                  onChange={(e) => {
                    const newSymbol = e.target.value;
                    setSymbol(newSymbol);
                  }} 
                  className="mobile-symbol-select"
                  style={{ 
                    background: "transparent",
                    border: "none",
                    color: "white",
                    fontSize: "20px",
                    fontWeight: "600",
                    width: "100%",
                    textAlign: "left"
                  }}
                >
                  {visiblePairs.length > 0 ? (
                    visiblePairs.map(pairSymbol => (
                      <option key={pairSymbol} value={pairSymbol}>
                        {pairSymbol.replace('USDT', '/USDT')} • {profitRates[pairSymbol] || 80}%
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="BTCUSDT">BTC/USDT • {profitRates["BTCUSDT"] || 91}%</option>
                      <option value="ETHUSDT">ETH/USDT • {profitRates["ETHUSDT"] || 85}%</option>
                      <option value="XRPUSDT">XRP/USDT • {profitRates["XRPUSDT"] || 80}%</option>
                      <option value="LTCUSDT">LTC/USDT • {profitRates["LTCUSDT"] || 80}%</option>
                      <option value="SOLUSDT">SOL/USDT • {profitRates["SOLUSDT"] || 80}%</option>
                      <option value="ADAUSDT">ADA/USDT • {profitRates["ADAUSDT"] || 80}%</option>
                      <option value="DOGEUSDT">DOGE/USDT • {profitRates["DOGEUSDT"] || 80}%</option>
                      <option value="DOTUSDT">DOT/USDT • {profitRates["DOTUSDT"] || 80}%</option>
                      <option value="AVAXUSDT">AVAX/USDT • {profitRates["AVAXUSDT"] || 80}%</option>
                      <option value="LINKUSDT">LINK/USDT • {profitRates["LINKUSDT"] || 80}%</option>
                    </>
                  )}
                </select>
              </div>
              
              {/* Large Timeframe Selector - 15% of page width */}
              <div className="mobile-timeframe-selector" style={{ 
                background: "transparent",
                padding: "20px 25px",
                borderRadius: "15px",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                minWidth: "120px",
                flex: "0 0 15%",
                maxWidth: "15%"
              }}>
                <select 
                  value={interval} 
                  onChange={(e) => {
                    const newInterval = e.target.value;
                    setIntervalTf(newInterval);
                  }} 
                  className="mobile-timeframe-select"
                  style={{ 
                    background: "transparent",
                    border: "none",
                    color: "white",
                    fontSize: "20px",
                    fontWeight: "600",
                    width: "100%",
                    textAlign: "center",
                    fontSize: "40px"
                  }}
                >
                  <option value="1m">1m</option>
                  <option value="3m">3m</option>
                  <option value="5m">5m</option>
                  <option value="15m">15m</option>
                  <option value="30m">30m</option>
                  <option value="1h">1h</option>
                  <option value="2h">2h</option>
                  <option value="4h">4h</option>
                  <option value="1d">1d</option>
                </select>
              </div>
            </div>
          </div>
        ) : (
          /* Desktop Layout - Reorganized layout */
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "nowrap", width: "100%" }}>
            {/* ORLIX Logo */}
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              flexShrink: 0
            }}>
              <span style={{
                fontSize: "32px",
                fontWeight: "700",
                color: "white",
                textDecoration: "none",
                transition: "color 0.3s ease"
              }}>
                ORLIX
              </span>
            </div>
            
            {/* Symbol Selector */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {!isMobile && (
                <span style={{ fontSize: "12px", color: "#666", whiteSpace: "nowrap" }}>Symbol:</span>
              )}
              <select 
                value={symbol} 
                onChange={(e) => {
                  const newSymbol = e.target.value;
                  setSymbol(newSymbol);
                }} 
                style={{ 
                  padding: "4px 8px", 
                  background: "#2a2a2a", 
                  border: "1px solid #444", 
                  borderRadius: "4px", 
                  color: "white",
                  fontSize: "12px",
                  minWidth: "80px"
                }}
              >
                {visiblePairs.length > 0 ? (
                  visiblePairs.map(pairSymbol => (
                    <option key={pairSymbol} value={pairSymbol}>
                      {pairSymbol.replace('USDT', '/USDT')} ({profitRates[pairSymbol] || 80}%)
                    </option>
                  ))
                ) : (
                  // Fallback options if no admin settings loaded
                  <>
                    <option value="BTCUSDT">BTC/USDT ({profitRates["BTCUSDT"] || 91}%)</option>
                    <option value="ETHUSDT">ETH/USDT ({profitRates["ETHUSDT"] || 85}%)</option>
                    <option value="XRPUSDT">XRP/USDT ({profitRates["XRPUSDT"] || 80}%)</option>
                    <option value="LTCUSDT">LTC/USDT ({profitRates["LTCUSDT"] || 80}%)</option>
                    <option value="SOLUSDT">SOL/USDT ({profitRates["SOLUSDT"] || 80}%)</option>
                    <option value="ADAUSDT">ADA/USDT ({profitRates["ADAUSDT"] || 80}%)</option>
                    <option value="DOGEUSDT">DOGE/USDT ({profitRates["DOGEUSDT"] || 80}%)</option>
                    <option value="DOTUSDT">DOT/USDT ({profitRates["DOTUSDT"] || 80}%)</option>
                    <option value="AVAXUSDT">AVAX/USDT ({profitRates["AVAXUSDT"] || 80}%)</option>
                    <option value="LINKUSDT">LINK/USDT ({profitRates["LINKUSDT"] || 80}%)</option>
                  </>
                )}
              </select>
            </div>
            
            {/* Timeframe Selector */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {!isMobile && (
                <span style={{ fontSize: "12px", color: "#666", whiteSpace: "nowrap" }}>Timeframe:</span>
              )}
              <select 
                value={interval} 
                onChange={(e) => {
                  const newInterval = e.target.value;
                  setIntervalTf(newInterval);
                }} 
                style={{ 
                  padding: "4px 8px", 
                  background: "#2a2a2a", 
                  border: "1px solid #444", 
                  borderRadius: "4px", 
                  color: "white",
                  fontSize: "12px",
                  minWidth: "60px"
                }}
              >
                <option value="1m">1m</option>
                <option value="3m">3m</option>
                <option value="5m">5m</option>
                <option value="15m">15m</option>
                <option value="30m">30m</option>
                <option value="1h">1h</option>
                <option value="2h">2h</option>
                <option value="4h">4h</option>
                <option value="1d">1d</option>
              </select>
            </div>
            
            {/* Stream - Only show for admin users */}
            {!isMobile && user && user.isAdmin === true ? (
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "12px", color: "#666", whiteSpace: "nowrap" }}>Stream:</span>
                <select 
                  value={streamType} 
                  onChange={(e) => {
                    setStreamType(e.target.value);
                  }} 
                  style={{ 
                    padding: "4px 8px", 
                    background: "transparent", 
                    border: "1px solid rgba(255, 255, 255, 0.2)", 
                    borderRadius: "18px", 
                    color: "white",
                    fontSize: "12px",
                    minWidth: "70px",
                    transition: "all 0.3s ease"
                  }}
                  onMouseOver={(e) => {
                    e.target.style.background = "rgba(255, 255, 255, 0.1)";
                    e.target.style.borderColor = "rgba(255, 255, 255, 0.3)";
                  }}
                  onMouseOut={(e) => {
                    e.target.style.background = "transparent";
                    e.target.style.borderColor = "rgba(255, 255, 255, 0.2)";
                  }}
                >
                  <option value="kline">Kline</option>
                  <option value="trade">Trade</option>
                </select>
              </div>
            ) : null}
            
            {/* Status - Only show for admin users */}
            {!isMobile && user && user.isAdmin === true ? (
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "12px", color: "#666", whiteSpace: "nowrap" }}>Status:</span>
                <div style={{
                  padding: "4px 8px",
                  background: connectionStatus === "connected" ? "#00ff88" : 
                             connectionStatus === "connecting" ? "#ffaa00" : "#ff4444",
                  borderRadius: "4px",
                  fontSize: "12px",
                  color: connectionStatus === "connected" ? "#000" : "#fff",
                  fontWeight: "bold",
                  minWidth: "80px",
                  textAlign: "center"
                }}>
                  {connectionStatus.toUpperCase()}
                </div>
              </div>
            ) : null}
            
            {/* Timezone */}
            {!isMobile && (
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "12px", color: "#666", whiteSpace: "nowrap" }}>Timezone:</span>
                <div style={{ minWidth: "100px" }}>
                  <TimezoneSelector onTimezoneChange={setTimezoneOffset} />
                </div>
              </div>
            )}

            {/* Desktop Account Switcher - Moved to right end */}
            <div className="account-selector" style={{ position: "relative", marginLeft: "auto" }}>
              <div 
                style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "10px",
                  background: "#2a2a2a",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  transition: "background-color 0.2s"
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAccountSwitcher(prev => !prev);
                }}
                onMouseEnter={(e) => e.target.style.background = "#333"}
                onMouseLeave={(e) => e.target.style.background = "#2a2a2a"}
              >
                <span style={{ fontSize: "16px" }}>
                  {accountType === "demo" ? "🎓" : "💰"}
                </span>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ 
                    fontSize: "12px", 
                    color: accountType === "demo" ? "#ff8800" : "#00ff88", 
                    fontWeight: "bold" 
                  }}>
                    {accountType === "demo" ? "DEMO ACCOUNT" : "REAL ACCOUNT"}
                  </span>
                  <span style={{ fontSize: "14px", color: "white", fontWeight: "bold" }}>
                    ${Number(currentBalance || 0).toFixed(2)}
                  </span>
                </div>
                <span style={{ fontSize: "12px", color: "#666" }}>▼</span>
              </div>

              {/* Account Switcher Dropdown for Desktop */}
              {showAccountSwitcher && (
                <div className="account-switcher" style={{
                  position: "absolute",
                  top: "100%",
                  left: "0",
                  right: "0",
                  background: "#1a1a1a",
                  border: "1px solid #444",
                  borderRadius: "8px",
                  marginTop: "5px",
                  zIndex: 1000,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.5)"
                }}>
                  {/* Demo Account Option - Only show if NOT currently active */}
                  {accountType !== "demo" && (
                    <div 
                      style={{
                        padding: "12px",
                        cursor: "pointer",
                        borderBottom: "1px solid #333",
                        background: "transparent"
                      }}
                      onClick={() => handleAccountSwitch("demo")}
                      onMouseEnter={(e) => e.target.style.background = "#2a2a2a"}
                      onMouseLeave={(e) => e.target.style.background = "transparent"}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontSize: "16px" }}>🎓</span>
                        <div>
                          <div style={{ fontSize: "12px", color: "#ff8800", fontWeight: "bold" }}>Demo Account</div>
                          <div style={{ fontSize: "12px", color: "#ccc" }}>${demoBalance.toFixed(2)}</div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Refill Balance Button - Only for demo accounts when active */}
                  {accountType === "demo" && (
                    <div style={{
                      padding: "12px",
                      borderBottom: "1px solid #333",
                      background: "transparent"
                    }}>
                      <button
                        onClick={refillBalance}
                        aria-label="Refill Balance"
                        style={{
                          width: "100%",
                          padding: "10px 16px",
                          background: "#00ff88",
                          border: "1px solid #00ff88",
                          borderRadius: "8px",
                          color: "#000",
                          fontWeight: "bold",
                          fontSize: "12px",
                          cursor: "pointer",
                          boxShadow: "0 2px 8px rgba(0,255,136,0.3)",
                          transition: "all 0.2s ease",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px"
                        }}
                        onMouseOver={(e) => {
                          e.target.style.background = "#00ffaa";
                          e.target.style.transform = "translateY(-1px)";
                          e.target.style.boxShadow = "0 4px 12px rgba(0,255,136,0.4)";
                        }}
                        onMouseOut={(e) => {
                          e.target.style.background = "#00ff88";
                          e.target.style.transform = "translateY(0)";
                          e.target.style.boxShadow = "0 2px 8px rgba(0,255,136,0.3)";
                        }}
                      >
                        Refill
                      </button>
                    </div>
                  )}
                  
                  {/* Real Account Option - Only show if NOT currently active */}
                  {accountType !== "real" && (
                    <div 
                      style={{
                        padding: "12px",
                        cursor: "pointer",
                        borderBottom: "1px solid #333",
                        background: "transparent"
                      }}
                      onClick={() => handleAccountSwitch("real")}
                      onMouseEnter={(e) => e.target.style.background = "#2a2a2a"}
                      onMouseLeave={(e) => e.target.style.background = "transparent"}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontSize: "16px" }}>💰</span>
                        <div>
                          <div style={{ fontSize: "12px", color: "#00ff88", fontWeight: "bold" }}>Real Account</div>
                          <div style={{ fontSize: "12px", color: "#ccc" }}>${realBalance.toFixed(2)}</div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* User Info Section - Only show if user is logged in */}
                  {user && (
                    <>
                      {/* Username */}
                      <div style={{
                        padding: "12px",
                        borderBottom: "1px solid #333",
                        background: "transparent"
                      }}>
                        <div style={{ 
                          fontSize: "14px", 
                          color: "#fff", 
                          fontWeight: "600",
                          textShadow: "0 1px 2px rgba(0,0,0,0.5)"
                        }}>
                          {user.username || "Username: -"}
                        </div>
                      </div>
                      
                      {/* User ID */}
                      <div style={{
                        padding: "12px",
                        borderBottom: "1px solid #333",
                        background: "transparent"
                      }}>
                        <div style={{ 
                          fontSize: "12px", 
                          color: "#888",
                          fontWeight: "500"
                        }}>
                          ID: {user.id || "-"}
                        </div>
                      </div>
                      
                      {/* Admin Badge - if user is admin */}
                      {Boolean(user?.isAdmin) && (
                        <div style={{
                          padding: "8px 12px",
                          borderBottom: "1px solid #333",
                          background: "transparent",
                          display: "flex",
                          justifyContent: "center"
                        }}>
                          <button
                            onClick={() => window.location.href = '/admin'}
                            style={{
                              background: "linear-gradient(135deg, #ff8800 0%, #ff6600 100%)",
                              color: "#000",
                              padding: "4px 8px",
                              borderRadius: "6px",
                              fontSize: "10px",
                              fontWeight: "bold",
                              textTransform: "uppercase",
                              boxShadow: "0 2px 4px rgba(255,136,0,0.3)",
                              border: "1px solid #ffaa00",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                              cursor: "pointer",
                              transition: "all 0.2s ease"
                            }}
                            onMouseOver={(e) => {
                              e.target.style.background = "linear-gradient(135deg, #ffaa00 0%, #ff8800 100%)";
                              e.target.style.transform = "translateY(-1px)";
                              e.target.style.boxShadow = "0 4px 8px rgba(255,136,0,0.4)";
                            }}
                            onMouseOut={(e) => {
                              e.target.style.background = "linear-gradient(135deg, #ff8800 0%, #ff6600 100%)";
                              e.target.style.transform = "translateY(0)";
                              e.target.style.boxShadow = "0 2px 4px rgba(255,136,0,0.3)";
                            }}
                            aria-label="Admin"
                          >
                            🛡 Admin
                          </button>
                        </div>
                      )}
                      
                      {/* Deposit Button - Only for real accounts */}
                      {accountType === "real" && (
                        <div style={{
                          padding: "12px",
                          borderBottom: "1px solid #333",
                          background: "transparent"
                        }}>
                          <button
                            onClick={() => window.location.href = '/deposit'}
                            aria-label="Deposit"
                            style={{
                              width: "100%",
                              padding: "10px 16px",
                              background: "linear-gradient(135deg, #00ff88 0%, #00cc66 100%)",
                              border: "1px solid #00ff88",
                              borderRadius: "8px",
                              color: "#000",
                              fontWeight: "bold",
                              fontSize: "12px",
                              cursor: "pointer",
                              boxShadow: "0 2px 8px rgba(0,255,136,0.3)",
                              transition: "all 0.2s ease",
                              textTransform: "uppercase",
                              letterSpacing: "0.5px"
                            }}
                            onMouseOver={(e) => {
                              e.target.style.background = "linear-gradient(135deg, #00ffaa 0%, #00ff88 100%)";
                              e.target.style.transform = "translateY(-1px)";
                              e.target.style.boxShadow = "0 4px 12px rgba(0,255,136,0.4)";
                            }}
                            onMouseOut={(e) => {
                              e.target.style.background = "linear-gradient(135deg, #00ff88 0%, #00cc66 100%)";
                              e.target.style.transform = "translateY(0)";
                              e.target.style.boxShadow = "0 2px 8px rgba(0,255,136,0.3)";
                            }}
                          >
                            💰 Deposit
                          </button>
                        </div>
                      )}

                      {/* Withdrawal Button - Only for real accounts */}
                      {accountType === "real" && (
                        <div style={{
                          padding: "12px",
                          borderBottom: "1px solid #333",
                          background: "transparent"
                        }}>
                          <button
                            onClick={() => window.location.href = '/withdrawal'}
                            aria-label="Withdrawal"
                            style={{
                              width: "100%",
                              padding: "10px 16px",
                              background: "transparent",
                              border: "1px solid rgba(255, 255, 255, 0.2)",
                              borderRadius: "18px",
                              color: "white",
                              fontWeight: "600",
                              fontSize: "12px",
                              cursor: "pointer",
                              transition: "all 0.3s ease",
                              textTransform: "uppercase",
                              letterSpacing: "0.5px"
                            }}
                            onMouseOver={(e) => {
                              e.target.style.background = "rgba(255, 255, 255, 0.1)";
                              e.target.style.borderColor = "rgba(255, 255, 255, 0.3)";
                            }}
                            onMouseOut={(e) => {
                              e.target.style.background = "transparent";
                              e.target.style.borderColor = "rgba(255, 255, 255, 0.2)";
                            }}
                          >
                            💸 Withdrawal
                          </button>
                        </div>
                      )}
                      
                      {/* Logout Button */}
                      <div style={{
                        padding: "12px",
                        background: "transparent"
                      }}>
                        <button
                          onClick={logout}
                          aria-label="Logout"
                          style={{
                            width: "100%",
                            padding: "10px 16px",
                            background: "linear-gradient(135deg, #ff4444 0%, #cc3333 100%)",
                            border: "1px solid #ff6666",
                            borderRadius: "8px",
                            color: "white",
                            fontWeight: "bold",
                            fontSize: "12px",
                            cursor: "pointer",
                            boxShadow: "0 2px 8px rgba(255,68,68,0.3)",
                            transition: "all 0.2s ease",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px"
                          }}
                          onMouseOver={(e) => {
                            e.target.style.background = "linear-gradient(135deg, #ff6666 0%, #ff4444 100%)";
                            e.target.style.transform = "translateY(-1px)";
                            e.target.style.boxShadow = "0 4px 12px rgba(255,68,68,0.4)";
                          }}
                          onMouseOut={(e) => {
                            e.target.style.background = "linear-gradient(135deg, #ff4444 0%, #cc3333 100%)";
                            e.target.style.boxShadow = "0 2px 8px rgba(255,68,68,0.3)";
                          }}
                        >
                          Logout
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>


          </div>
        )}

        
              </div>

        {/* Mobile Trade Page - Full Page Overlay */}
        {(showMobileTradePage || isClosingTradePage) && (
          <div className="mobile-trade-page" style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "#1a1a1a",
            zIndex: 2000,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            transform: isClosingTradePage ? "translateY(100%)" : "translateY(0)",
            transition: "transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
            opacity: isClosingTradePage ? 0 : 1,
            animation: isClosingTradePage ? "none" : "slideInFromBottom 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
          }}>
            {/* Header */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "20px",
              borderBottom: "1px solid #2a2a2a",
              background: "#1a1a1a"
            }}>
              <h1 style={{ 
                margin: 0, 
                color: "white", 
                fontSize: "16px", 
                fontWeight: "bold" 
              }}>
                Trades
              </h1>
              <button
                className="close-btn"
                onClick={handleCloseTradePage}
                style={{
                  background: "none",
                  border: "none",
                  color: "white",
                  fontSize: "16px",
                  cursor: "pointer",
                  padding: "8px",
                  borderRadius: "4px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "107px",
                  height: "107px"
                }}
              >
                ×
              </button>
            </div>

            {/* Navigation Tabs */}
            <div style={{
              display: "flex",
              borderBottom: "1px solid #2a2a2a",
              background: "#1a1a1a"
            }}>
                              <button
                onClick={() => setActiveTab('trades')}
                style={{
                  flex: 1,
                  padding: "43px",
                  background: "none",
                  border: "none",
                  color: activeTab === 'trades' ? "white" : "#666",
                  fontSize: "16px",
                  fontWeight: "500",
                  cursor: "pointer",
                  borderBottom: activeTab === 'trades' ? "5px solid white" : "none",
                  transition: "all 0.2s ease"
                }}
              >
                Active trades
              </button>
              <button
                onClick={() => setActiveTab('history')}
                style={{
                  flex: 1,
                  padding: "43px",
                  background: "none",
                  border: "none",
                  color: activeTab === 'history' ? "white" : "#666",
                  fontSize: "16px",
                  fontWeight: "500",
                  cursor: "pointer",
                  borderBottom: activeTab === 'history' ? "5px solid white" : "none",
                  transition: "all 0.2s ease"
                }}
              >
                Trade History
              </button>
            </div>

            {/* Content Area */}
            <div className="trade-content" style={{
              flex: 1,
              padding: "53px",
              overflow: "auto"
            }}>
              {activeTab === 'trades' ? (
                // Active Trades Tab
                <div className="active-trades-tab">
                  {activeTradesForDisplay.length === 0 ? (
                    <div style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      height: "100%",
                      color: "#666",
                      textAlign: "center"
                    }}>

                      <div className="no-trades-text" style={{
                        fontSize: "16px",
                        color: "#666"
                      }}>
                        No active trades
                      </div>
                    </div>
                  ) : (
                    <div style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "40px"
                    }}>
                      {activeTradesForDisplay.map((trade) => {
                        const timeLeft = Math.max(0, trade.expiryTime - now);
                        const minutes = Math.floor(timeLeft / 60);
                        const seconds = timeLeft % 60;
                        const countdownText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                        
                        // Calculate real-time payout
                        const realTimePayout = calculateRealTimePayout(trade);
                        
                        return (
                          <div
                            key={trade.id}
                            style={{
                              background: "#2a2a2a",
                              padding: "53px",
                              borderRadius: "32px",
                              border: `3px solid ${trade.side === "CALL" ? "#00ff88" : "#ff4444"}`,
                              cursor: "pointer",
                              transition: "all 0.2s ease"
                            }}
                            onClick={() => handleActiveTradeClick(trade)}
                            onMouseEnter={(e) => e.target.style.transform = "translateY(-2px)"}
                            onMouseLeave={(e) => e.target.style.transform = "translateY(0)"}
                          >
                            <div style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              marginBottom: "40px"
                            }}>
                              <div className="trade-symbol" style={{
                                fontSize: "16px",
                                fontWeight: "bold",
                                color: "white"
                              }}>
                                {trade.symbol.replace('USDT', '/USDT')}
                              </div>
                              <div className="countdown" style={{
                                fontSize: "16px",
                                fontWeight: "bold",
                                color: "#ffaa00"
                              }}>
                                {countdownText}
                              </div>
                            </div>
                            
                            <div style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              marginBottom: "40px"
                            }}>
                              <div style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "32px"
                              }}>
                                <div className="trade-arrow" style={{
                                  width: "107px",
                                  height: "107px",
                                  borderRadius: "50%",
                                  background: trade.side === "CALL" ? "#00ff88" : "#ff4444",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: "53px",
                                  color: "#000",
                                  fontWeight: "bold"
                                }}>
                                  {trade.side === "CALL" ? "↑" : "↓"}
                                </div>
                                <span className="trade-amount" style={{
                                  fontSize: "53px",
                                  fontWeight: "bold",
                                  color: trade.side === "CALL" ? "#00ff88" : "#ff4444"
                                }}>
                                  ${trade.amount}
                                </span>
                              </div>
                              <div className="payout-amount" style={{
                                fontSize: "48px",
                                fontWeight: "bold",
                                color: realTimePayout.status === 'winning' ? "#00ff88" : 
                                       realTimePayout.status === 'losing' ? "#ff4444" : 
                                       realTimePayout.status === 'refunding' ? "#ffaa00" : "#666"
                              }}>
                                ${realTimePayout.amount.toFixed(2)}
                              </div>
                            </div>
                            
                            {/* Progress Bar */}
                            <div style={{
                              height: "16px",
                              background: "#444",
                              borderRadius: "8px",
                              overflow: "hidden"
                            }}>
                              <div style={{
                                width: `${((trade.duration - timeLeft) / trade.duration) * 100}%`,
                                height: "100%",
                                background: trade.side === "CALL" ? "#00ff88" : "#ff4444",
                                borderRadius: "8px",
                                transition: "width 1s linear"
                              }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                // Trade History Tab
                <div className="trade-history-tab">
                  {historyAllNewestFirst.length === 0 ? (
                    <div style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      height: "100%",
                      color: "#666",
                      textAlign: "center"
                    }}>
                      <div className="no-history-icon" style={{
                        fontSize: "213px",
                        marginBottom: "53px",
                        opacity: "0.5"
                      }}>
                        ↕️
                      </div>
                      <div className="no-history-text" style={{
                        fontSize: "48px",
                        color: "#666"
                      }}>
                        No trade history
                      </div>
                    </div>
                  ) : (
                    <div style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "40px"
                    }}>
                      {historyAllNewestFirst.slice(0, 20).map((trade) => (
                        <div
                          key={trade.id}
                          style={{
                            background: "#2a2a2a",
                            padding: "53px",
                            borderRadius: "32px",
                            border: `3px solid ${trade.result === "WIN" ? "#00ff88" : 
                                                   trade.result === "LOSE" ? "#ff4444" : "#ffaa00"}`,
                            cursor: "pointer",
                            transition: "all 0.2s ease"
                          }}
                          onClick={() => handleHistoryTradeClick(trade)}
                          onMouseEnter={(e) => e.target.style.transform = "translateY(-2px)"}
                          onMouseLeave={(e) => e.target.style.transform = "translateY(0)"}
                        >
                          <div style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "40px"
                          }}>
                            <div className="trade-symbol" style={{
                              fontSize: "48px",
                              fontWeight: "bold",
                              color: "white"
                            }}>
                              {trade.symbol.replace('USDT', '/USDT')}
                            </div>
                            <div className="trade-result" style={{
                              fontSize: "48px",
                              fontWeight: "bold",
                              color: trade.result === "WIN" ? "#00ff88" : 
                                     trade.result === "LOSE" ? "#ff4444" : "#ffaa00"
                            }}>
                              {trade.result}
                            </div>
                          </div>
                          
                          <div style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "40px"
                          }}>
                            <div style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "32px"
                            }}>
                              <div className="trade-arrow" style={{
                                width: "107px",
                                height: "107px",
                                borderRadius: "50%",
                                background: trade.side === "CALL" ? "#00ff88" : "#ff4444",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "53px",
                                color: "#000",
                                fontWeight: "bold"
                              }}>
                                {trade.side === "CALL" ? "↑" : "↓"}
                              </div>
                              <span className="trade-amount" style={{
                                fontSize: "53px",
                                fontWeight: "bold",
                                color: trade.side === "CALL" ? "#00ff88" : "#ff4444"
                              }}>
                                ${trade.amount}
                              </span>
                            </div>
                            <div className="payout-amount" style={{
                              fontSize: "48px",
                              fontWeight: "bold",
                              color: trade.result === "WIN" ? "#00ff88" : 
                                     trade.result === "REFUND" ? "#ffaa00" : "#ff4444"
                            }}>
                              {trade.result === "WIN" ? "+" : ""}${trade.payout_amount ? trade.payout_amount.toFixed(2) : "0.00"}
                            </div>
                          </div>
                          
                          <div className="trade-details" style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            fontSize: "37px",
                            color: "#666"
                          }}>
                            <span>{formatDateTime(trade.id / 1000)}</span>
                            <span>{formatDurationSec(trade.durationSec || trade.duration || (trade.expiryTime - trade.entryTime) || 60)}</span>
                          </div>
                        </div>
                      ))}
                      
                      {/* View Full History Button */}
                      {historyAllNewestFirst.length > 20 && (
                        <button
                          className="view-full-history-btn"
                          onClick={() => {
                            handleCloseTradePage();
                            setTimeout(() => {
                              setShowFullHistoryModal(true);
                            }, 400); // Wait for closing animation
                          }}
                          style={{
                            width: "100%",
                            padding: "43px",
                            background: "#00ff88",
                            border: "none",
                            borderRadius: "32px",
                            color: "#000",
                            fontWeight: "bold",
                            fontSize: "43px",
                            cursor: "pointer",
                            marginTop: "27px",
                            transition: "all 0.2s ease"
                          }}
                          onMouseEnter={(e) => e.target.style.background = "#00ffaa"}
                          onMouseLeave={(e) => e.target.style.background = "#00ff88"}
                        >
                          View Full History
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Chart and Trading Area */}
        <div style={{ 
          flex: 1, 
          display: isMobile ? "flex" : "grid", 
          flexDirection: isMobile ? "column" : "row",
          gridTemplateColumns: isMobile ? "none" : "1fr 300px",
          background: "#0f0f0f",
          minHeight: 0,
          width: "100%",
          paddingBottom: isMobile ? "320px" : "0"
        }}>

          {/* Chart Area */}
          <div 
            className={isMobile ? "chart-area-mobile" : ""}
            style={{ 
              position: "relative", 
              background: "#1a1a1a",
              minHeight: 0,
              overflow: "hidden",
              width: "100%",
              height: isMobile ? "calc(100vh - 280px)" : "100%",
              display: isMobile && activeTab !== 'chart' ? "none" : "flex",
              flexDirection: "column"
            }}
          >
          {/* Chart Container */}
          <div 
            className={isMobile ? "chart-container-mobile" : ""}
            style={{ 
              position: "relative", 
              background: "#1a1a1a",
              minHeight: 0,
              overflow: "hidden",
              width: "100%",
              flex: 1
            }}
          >
          {error && (
            <div style={{ 
              position: "absolute", 
              top: "10px", 
              left: "10px", 
              background: "#ff4444", 
              color: "white", 
              padding: "8px 12px", 
              borderRadius: "4px", 
              zIndex: 1000 
            }}>
              Error: {error}
            </div>
          )}

          {isLoading && (
            <div 
              className="loading-indicator"
              style={{ 
                position: "absolute", 
                top: "10px", 
                left: "10px", 
                background: "#4444ff", 
                color: "white", 
                padding: "8px 12px", 
                borderRadius: "4px", 
                zIndex: 1000 
              }}
            >
              Loading...
            </div>
          )}

          {/* NEW: Historical data loading indicator */}
          {isLoadingHistorical && (
            <div 
              className="historical-loading-indicator"
              style={{ 
                position: "absolute", 
                top: "50px", 
                left: "10px", 
                background: "#ff8800", 
                color: "white", 
                padding: "8px 12px", 
                borderRadius: "4px", 
                zIndex: 1000,
                fontSize: "12px"
              }}
            >
              📊 Loading historical data...
            </div>
          )}

          <div ref={chartRef} style={{ 
            width: "100%", 
            height: "100%", 
            background: "#1a1a1a"
          }} />

          {/* Trade Countdown Labels - Centered for Mobile, Corner for Desktop */}
          {activeTradeLines.length > 0 && (
            <div 
              className="trade-countdown-labels"
              style={{
                position: "absolute",
                top: isMobile ? "50%" : "20px",
                left: isMobile ? "50%" : "auto",
                right: isMobile ? "auto" : "20px",
                transform: isMobile ? "translate(-50%, -50%)" : "none",
                display: "flex",
                flexDirection: "column",
                gap: isMobile ? "16px" : "8px",
                zIndex: 1000,
                pointerEvents: "none" /* Allow chart interaction */
              }}
            >
              {activeTradeLines.slice(0, isMobile ? 2 : 10).map((lineInfo, index) => {
                const timeLeft = lineInfo.timeLeft || (lineInfo.expiryTime - now);
                if (timeLeft <= 0) return null;
                
                const minutes = Math.floor(timeLeft / 60);
                const seconds = timeLeft % 60;
                const countdownText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                
                return (
                  <div
                    key={lineInfo.id}
                    style={{
                      background: "rgba(26, 26, 26, 0.95)",
                      border: `2px solid ${lineInfo.side === "CALL" ? "#00ff88" : "#ff4444"}`,
                      borderRadius: "6px",
                      padding: isMobile ? "48px 64px" : "6px 10px",
                      display: "flex",
                      alignItems: "center",
                      gap: isMobile ? "48px" : "8px",
                      fontSize: isMobile ? "16px" : "12px",
                      fontWeight: "bold",
                      color: "white",
                      backdropFilter: "blur(4px)",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                      minWidth: isMobile ? "720px" : "120px",
                      pointerEvents: "none" /* Allow chart interaction through countdowns */
                    }}
                  >
                    <div style={{
                      width: isMobile ? "120px" : "16px",
                      height: isMobile ? "120px" : "16px",
                      borderRadius: "50%",
                      background: lineInfo.side === "CALL" ? "#00ff88" : "#ff4444",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: isMobile ? "24px" : "10px",
                      color: "#000",
                      fontWeight: "bold"
                    }}>
                      {lineInfo.side === "CALL" ? "↑" : "↓"}
                    </div>
                                            <span style={{ fontSize: isMobile ? "36px" : "12px" }}>${lineInfo.amount}</span>
                        <span style={{color: "#666", fontSize: isMobile ? "36px" : "12px"}}>|</span>
                        <span style={{ color: lineInfo.side === "CALL" ? "#00ff88" : "#ff4444", fontSize: isMobile ? "36px" : "12px" }}>
                      {countdownText}
                    </span>
                  </div>
                );
              })}
            </div>
          )}


        </div>
        </div>

        {/* Right Trading Panel */}
        <div style={{
          width: isMobile ? "100%" : "300px",
          minWidth: isMobile ? "100%" : "300px",
          maxWidth: isMobile ? "100%" : "300px",
          background: "#1a1a1a",
          borderLeft: isMobile ? "none" : "1px solid #2a2a2a",
          borderTop: isMobile ? "1px solid #2a2a2a" : "none",
          padding: "20px",
          display: isMobile && activeTab !== 'panel' ? "none" : "flex",
          flexDirection: "column",
          gap: "20px",
          overflow: "hidden"
        }}>
          {/* Asset Info */}
          <div style={{
            background: "#2a2a2a",
            padding: isMobile ? "25px" : "15px",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}>
            <div>
                                <div style={{ fontSize: isMobile ? "16px" : "16px", fontWeight: "bold" }}>{symbol}</div>
            </div>
            <div style={{ textAlign: "right" }}>
                              <div style={{ fontSize: isMobile ? "16px" : "14px", color: "#00ff88" }}>{payout}%</div>
            </div>
          </div>

          {/* Time Selection - Hidden on Mobile (will be moved to bottom) */}
          {!isMobile && (
            <div style={{ position: "relative" }}>
              <div style={{
                position: "relative",
                display: "flex",
                alignItems: "center"
              }}>
                <input
                  type="text"
                  value={formatDuration(duration)}
                  onClick={() => setShowTimePickerPopup(true)}
                  readOnly
                  placeholder="Time"
                  style={{
                    width: "100%",
                    background: "transparent",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    borderRadius: "18px",
                    padding: "8px 40px",
                    color: "white",
                    textAlign: "center",
                    fontSize: "16px",
                    fontWeight: "bold",
                    cursor: "pointer",
                    transition: "all 0.3s ease"
                  }}
                  onMouseOver={(e) => {
                    e.target.style.background = "rgba(255, 255, 255, 0.1)";
                    e.target.style.borderColor = "rgba(255, 255, 255, 0.3)";
                  }}
                  onMouseOut={(e) => {
                    e.target.style.background = "transparent";
                    e.target.style.borderColor = "rgba(255, 255, 255, 0.2)";
                  }}
                />
                <button
                  onClick={() => {
                    const newDuration = duration <= 60 ? Math.max(10, duration - 10) : duration - 60;
                    setDuration(newDuration);
                  }}
                  style={{
                    position: "absolute",
                    left: "8px",
                    background: "transparent",
                    border: "none",
                    color: "white",
                    fontSize: "18px",
                    fontWeight: "bold",
                    cursor: "pointer",
                    width: "24px",
                    height: "24px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.3s ease"
                  }}
                  onMouseOver={(e) => {
                    e.target.style.color = "rgba(255, 255, 255, 0.8)";
                  }}
                  onMouseOut={(e) => {
                    e.target.style.color = "white";
                  }}
                >
                  -
                </button>
                <button
                  onClick={() => {
                    const newDuration = duration < 60 ? duration + 10 : duration + 60;
                    setDuration(newDuration);
                  }}
                  style={{
                    position: "absolute",
                    right: "8px",
                    background: "transparent",
                    border: "none",
                    color: "white",
                    fontSize: "18px",
                    fontWeight: "bold",
                    cursor: "pointer",
                    width: "24px",
                    height: "24px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.3s ease"
                  }}
                  onMouseOver={(e) => {
                    e.target.style.color = "rgba(255, 255, 255, 0.8)";
                  }}
                  onMouseOut={(e) => {
                    e.target.style.color = "white";
                  }}
                >
                  +
                </button>
              </div>
              
              {/* NEW: Time Picker Popup */}
              {showTimePickerPopup && (
                <div className="time-picker-popup" style={{
                  position: "absolute",
                  top: "100%",
                  left: "0",
                  right: "0",
                  background: "#2a2a2a",
                  border: "1px solid #444",
                  borderRadius: "8px",
                  padding: "10px",
                  zIndex: 1000,
                  marginTop: "5px"
                }}>
                  <div style={{ 
                    fontSize: "12px", 
                    color: "#666", 
                    marginBottom: "8px",
                    textAlign: "center"
                  }}>
                    Quick Options
                  </div>
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "5px"
                  }}>
                    {quickTimeOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setDuration(option.value);
                          setShowTimePickerPopup(false);
                        }}
                        style={{
                          padding: "6px 8px",
                          background: "#1a1a1a",
                          border: "1px solid #444",
                          borderRadius: "4px",
                          color: "white",
                          fontSize: "12px",
                          cursor: "pointer",
                          textAlign: "center"
                        }}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                  <div style={{ 
                    marginTop: "8px", 
                    paddingTop: "8px", 
                    borderTop: "1px solid #444",
                    textAlign: "center"
                  }}>
                    <input
                      type="text"
                      placeholder="Custom (MM:SS)"
                      onChange={(e) => {
                        const value = e.target.value;
                        const parts = value.split(':');
                        if (parts.length === 2) {
                          const minutes = parseInt(parts[0]) || 0;
                          const seconds = parseInt(parts[1]) || 0;
                          setDuration(minutes * 60 + seconds);
                        }
                      }}
                      style={{
                        width: "100%",
                        background: "transparent",
                        border: "1px solid rgba(255, 255, 255, 0.2)",
                        borderRadius: "18px",
                        padding: "6px",
                        color: "white",
                        fontSize: "12px",
                        textAlign: "center",
                        transition: "all 0.3s ease"
                      }}
                      onMouseOver={(e) => {
                        e.target.style.background = "rgba(255, 255, 255, 0.1)";
                        e.target.style.borderColor = "rgba(255, 255, 255, 0.3)";
                      }}
                      onMouseOut={(e) => {
                        e.target.style.background = "transparent";
                        e.target.style.borderColor = "rgba(255, 255, 255, 0.2)";
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Investment Selection - Hidden on Mobile (will be moved to bottom) */}
          {!isMobile && (
            <div style={{
              position: "relative",
              display: "flex",
              alignItems: "center"
            }}>
                              <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  placeholder="Investment"
                  style={{
                    width: "100%",
                    background: "transparent",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    borderRadius: "18px",
                    padding: "8px 40px",
                    color: "white",
                    textAlign: "center",
                    fontSize: "16px",
                    fontWeight: "bold",
                    transition: "all 0.3s ease",
                    textAlignLast: "center",
                    WebkitTextAlignLast: "center"
                  }}
                onMouseOver={(e) => {
                  e.target.style.background = "rgba(255, 255, 255, 0.1)";
                  e.target.style.borderColor = "rgba(255, 255, 255, 0.3)";
                }}
                onMouseOut={(e) => {
                  e.target.style.background = "transparent";
                  e.target.style.borderColor = "rgba(255, 255, 255, 0.2)";
                }}
              />
              <button
                onClick={() => setAmount(Math.max(1, amount - 1))}
                style={{
                  position: "absolute",
                  left: "8px",
                  background: "transparent",
                  border: "none",
                  color: "white",
                  fontSize: "18px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  width: "24px",
                  height: "24px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.3s ease"
                }}
                onMouseOver={(e) => {
                  e.target.style.color = "rgba(255, 255, 255, 0.8)";
                }}
                onMouseOut={(e) => {
                  e.target.style.color = "white";
                }}
              >
                -
              </button>
              <button
                onClick={() => setAmount(amount + 1)}
                style={{
                  position: "absolute",
                  right: "8px",
                  background: "transparent",
                  border: "none",
                  color: "white",
                  fontSize: "18px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  width: "24px",
                  height: "24px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.3s ease"
                }}
                onMouseOver={(e) => {
                  e.target.style.color = "rgba(255, 255, 255, 0.8)";
                }}
                onMouseOut={(e) => {
                  e.target.style.color = "white";
                }}
              >
                +
              </button>
            </div>
          )}

          {/* Trade Buttons - Hidden on Mobile (will be moved to bottom) */}
          {!isMobile && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                         <button
               onClick={() => place("CALL")}
               disabled={isPlacingTrade}
               style={{
                 width: "100%",
                 height: "60px",
                 background: isPlacingTrade ? "#666" : "#00ff88",
                 border: "none",
                 borderRadius: "8px",
                 color: "#000",
                 fontWeight: "bold",
                 fontSize: "16px",
                 cursor: isPlacingTrade ? "not-allowed" : "pointer",
                 display: "flex",
                 alignItems: "center",
                 justifyContent: "center",
                 gap: "10px",
                 transition: "all 0.3s ease",
                 transform: "translateY(0)",
                 boxShadow: "0 4px 8px rgba(0, 255, 136, 0.3)"
               }}
               onMouseOver={(e) => {
                 if (!isPlacingTrade) {
                   e.target.style.transform = "translateY(-3px)";
                   e.target.style.boxShadow = "0 8px 16px rgba(0, 255, 136, 0.5)";
                   e.target.style.background = "#00ffaa";
                 }
               }}
               onMouseOut={(e) => {
                 if (!isPlacingTrade) {
                   e.target.style.transform = "translateY(0)";
                   e.target.style.boxShadow = "0 4px 8px rgba(0, 255, 136, 0.3)";
                   e.target.style.background = "#00ff88";
                 }
               }}
             >
               <span>↑</span>
               <span>{isPlacingTrade ? "Placing..." : "Up"}</span>
             </button>
            
            <div style={{ 
              textAlign: "center", 
              fontSize: "18px", 
              color: "#00ff88",
              marginBottom: "10px",
              fontWeight: "bold"
            }}>
              Your payout: ${payoutAmount.toFixed(2)}
            </div>
            
                         <button
               onClick={() => place("PUT")}
               disabled={isPlacingTrade}
               style={{
                 width: "100%",
                 height: "60px",
                 background: isPlacingTrade ? "#666" : "#ff4444",
                 border: "none",
                 borderRadius: "8px",
                 color: "white",
                 fontWeight: "bold",
                 fontSize: "16px",
                 cursor: isPlacingTrade ? "not-allowed" : "pointer",
                 display: "flex",
                 alignItems: "center",
                 justifyContent: "center",
                 gap: "10px",
                 transition: "all 0.3s ease",
                 transform: "translateY(0)",
                 boxShadow: "0 4px 8px rgba(255, 68, 68, 0.3)"
               }}
               onMouseOver={(e) => {
                 if (!isPlacingTrade) {
                   e.target.style.transform = "translateY(-3px)";
                   e.target.style.boxShadow = "0 8px 16px rgba(255, 68, 68, 0.5)";
                   e.target.style.background = "#ff6666";
                 }
               }}
               onMouseOut={(e) => {
                 if (!isPlacingTrade) {
                   e.target.style.transform = "translateY(0)";
                   e.target.style.boxShadow = "0 4px 8px rgba(255, 68, 68, 0.3)";
                   e.target.style.background = "#ff4444";
                 }
               }}
             >
               <span>↓</span>
               <span>{isPlacingTrade ? "Placing..." : "Down"}</span>
             </button>
          </div>
          )}

          {/* Refill Balance button moved to account switcher dropdown */}

          {/* Trades Section */}
          <div className="trades-section" style={{
            background: "#2a2a2a",
            padding: "15px",
            borderRadius: "8px"
          }}>
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "space-between",
              marginBottom: "15px"
            }}>
              <span style={{ fontSize: "12px", color: "#666" }}>
                {showTradeHistory ? "Trade History" : `Current Trades (${activeTradesForDisplay.length})`}
              </span>
              <button 
                onClick={() => setShowTradeHistory(!showTradeHistory)} 
                style={{ 
                  fontSize: "10px", 
                  padding: "4px 8px",
                  background: "#1a1a1a",
                  border: "none",
                  borderRadius: "4px",
                  color: "white",
                  cursor: "pointer"
                }}
              >
                {showTradeHistory ? "Show Current" : "Show History"}
              </button>
            </div>
            
            {showTradeHistory ? (
              historyTrades.length === 0 ? (
                <div style={{ 
                  textAlign: "center", 
                  color: "#666", 
                  fontSize: "12px",
                  padding: "20px"
                }}>
                  No trade history
                </div>
              ) : (
                <>
                  <div className="history-trades" style={{ maxHeight: "200px", overflowY: "auto" }}>
                    {historyTrades.map((t) => (
                      <div 
                        key={t.id} 
                        onClick={() => handleHistoryTradeClick(t)}
                        style={{
                          background: "#1a1a1a",
                          padding: "10px",
                          borderRadius: "4px",
                          marginBottom: "8px",
                          cursor: "pointer",
                          transition: "background-color 0.2s"
                        }}
                        onMouseEnter={(e) => e.target.style.background = "#333"}
                        onMouseLeave={(e) => e.target.style.background = "#1a1a1a"}
                      >
                        <div style={{ 
                          display: "flex", 
                          justifyContent: "space-between", 
                          alignItems: "center",
                          marginBottom: "8px"
                        }}>
                          <div style={{ 
                            fontSize: "12px", 
                            fontWeight: "bold", 
                            color: "white" 
                          }}>
                            {t.symbol.replace('USDT', '/USDT')}
                          </div>
                          <div style={{ 
                            fontSize: "12px", 
                            fontWeight: "bold", 
                            color: "#00ff88",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px"
                          }}>
                            <span>⏱</span>
                            <span>{formatDurationSec(t.durationSec || t.duration || (t.expiryTime - t.entryTime) || 60)}</span>
                          </div>
                        </div>
                        
                        <div style={{ 
                          display: "flex", 
                          justifyContent: "space-between", 
                          alignItems: "center"
                        }}>
                          <div style={{ 
                            display: "flex", 
                            alignItems: "center", 
                            gap: "8px" 
                          }}>
                            <div style={{
                              width: "20px",
                              height: "20px",
                              borderRadius: "50%",
                              background: t.side === "CALL" ? "#00ff88" : "#ff4444",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center"
                            }}>
                              <span style={{ 
                                fontSize: "12px", 
                                color: "#000", 
                                fontWeight: "bold" 
                              }}>
                                {t.side === "CALL" ? "↑" : "↓"}
                              </span>
                            </div>
                            <span style={{ 
                              fontSize: "12px", 
                              fontWeight: "bold", 
                              color: t.side === "CALL" ? "#00ff88" : "#ff4444" 
                            }}>
                              ${t.amount}
                            </span>
                          </div>
                          <div style={{ 
                            fontSize: "12px", 
                            fontWeight: "bold", 
                            color: t.result === "WIN" ? "#00ff88" : 
                                   t.result === "LOSE" ? "#ff4444" : 
                                   t.result === "REFUND" ? "#ffaa00" : "#666"
                          }}>
                            {t.result === "WIN" ? "+" : ""}${t.payout_amount ? t.payout_amount.toFixed(2) : "0.00"}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* NEW: View Full History Button */}
                  <button
                    onClick={() => setShowFullHistoryModal(true)}
                    style={{
                      width: "100%",
                      padding: "8px",
                      background: "#00ff88",
                      border: "none",
                      borderRadius: "4px",
                      color: "#000",
                      fontWeight: "bold",
                      fontSize: "12px",
                      cursor: "pointer",
                      marginTop: "10px"
                    }}
                  >
                    View Full History
                  </button>
                </>
              )
            ) : (
              activeTradesForDisplay.length === 0 ? (
                <div style={{ 
                  textAlign: "center", 
                  color: "#666", 
                  fontSize: "12px",
                  padding: "20px"
                }}>
                  No active trades
                </div>
              ) : (
                <div className="active-trades" style={{ maxHeight: "200px", overflowY: "auto" }}>
                  {activeTradesForDisplay.map((t) => {
                    const total = Number(duration); // Use current duration setting
                    const remaining = Math.max(0, t.expiryTime - now);
                    const pct = ((total - remaining) / total) * 100;
                    
                    // NEW: Calculate real-time payout
                    const realTimePayout = calculateRealTimePayout(t);
                    
                    return (
                      <div 
                        key={t.id} 
                        onClick={() => handleActiveTradeClick(t)}
                        style={{
                          background: "#1a1a1a",
                          padding: "10px",
                          borderRadius: "4px",
                          marginBottom: "8px",
                          cursor: "pointer",
                          transition: "background-color 0.2s"
                        }}
                        onMouseEnter={(e) => e.target.style.background = "#333"}
                        onMouseLeave={(e) => e.target.style.background = "#1a1a1a"}
                      >
                        <div style={{ 
                          display: "flex", 
                          justifyContent: "space-between", 
                          alignItems: "center",
                          marginBottom: "8px"
                        }}>
                          <div style={{ 
                            fontSize: "12px", 
                            fontWeight: "bold", 
                            color: "white" 
                          }}>
                            {t.symbol.replace('USDT', '/USDT')}
                          </div>
                          <div style={{ 
                            fontSize: "12px", 
                            fontWeight: "bold", 
                            color: "white" 
                          }}>
                            {formatTimeLeft(t.expiryTime)}
                          </div>
                        </div>
                        
                        <div style={{ 
                          display: "flex", 
                          justifyContent: "space-between", 
                          alignItems: "center",
                          marginBottom: "8px"
                        }}>
                          <div style={{ 
                            display: "flex", 
                            alignItems: "center", 
                            gap: "8px" 
                          }}>
                            <div style={{
                              width: "20px",
                              height: "20px",
                              borderRadius: "50%",
                              background: t.side === "CALL" ? "#00ff88" : "#ff4444",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center"
                            }}>
                              <span style={{ 
                                fontSize: "12px", 
                                color: "#000", 
                                fontWeight: "bold" 
                              }}>
                                {t.side === "CALL" ? "↑" : "↓"}
                              </span>
                            </div>
                            <span style={{ 
                              fontSize: "12px", 
                              fontWeight: "bold", 
                              color: t.side === "CALL" ? "#00ff88" : "#ff4444" 
                            }}>
                              ${t.amount}
                            </span>
                          </div>
                          <div style={{ 
                            fontSize: "12px", 
                            fontWeight: "bold", 
                            color: realTimePayout.status === 'winning' ? "#00ff88" : 
                                   realTimePayout.status === 'losing' ? "#ff4444" : 
                                   realTimePayout.status === 'refunding' ? "#ffaa00" : "#666"
                          }}>
                            ${realTimePayout.amount.toFixed(2)}
                          </div>
                        </div>
                        
                        <div style={{ height: "4px", background: "#444", borderRadius: "2px" }}>
                          <div style={{ 
                            width: `${pct}%`, 
                            height: "100%", 
                            background: t.side === "CALL" ? "#00ff88" : "#ff4444", 
                            borderRadius: "2px" 
                          }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            )}
          </div>
        </div>

        {/* Mobile Sidebar Section */}
        {isMobile && activeTab === 'sidebar' && (
          <div style={{
            width: "100%",
            background: "#1a1a1a",
            borderTop: "1px solid #2a2a2a",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            minHeight: "400px"
          }}>
            {/* Account Balances */}
            <div style={{
              background: "#2a2a2a",
              padding: "15px",
              borderRadius: "8px"
            }}>
              <div style={{ 
                fontSize: "14px", 
                color: "#666", 
                marginBottom: "10px",
                fontWeight: "bold"
              }}>
                Account Balances
              </div>
              <div style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px"
              }}>
                <div style={{
                  background: "#1a1a1a",
                  padding: "10px",
                  borderRadius: "6px",
                  border: "1px solid #444"
                }}>
                  <div style={{ fontSize: "12px", color: "#666" }}>Demo Account</div>
                  <div style={{ fontSize: "18px", fontWeight: "bold", color: "#00ff88" }}>
                    ${demoBalance.toFixed(2)}
                  </div>
                </div>
                <div style={{
                  background: "#1a1a1a",
                  padding: "10px",
                  borderRadius: "6px",
                  border: "1px solid #444"
                }}>
                  <div style={{ fontSize: "12px", color: "#666" }}>Real Account</div>
                  <div style={{ fontSize: "18px", fontWeight: "bold", color: "#00ff88" }}>
                    ${realBalance.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>

            {/* Active Trades */}
            <div style={{
              background: "#2a2a2a",
              padding: "15px",
              borderRadius: "8px"
            }}>
              <div style={{ 
                fontSize: "14px", 
                color: "#666", 
                marginBottom: "10px",
                fontWeight: "bold"
              }}>
                Active Trades ({activeTradeLines.length})
              </div>
              {activeTradeLines.length === 0 ? (
                <div style={{ textAlign: "center", color: "#666", padding: "20px" }}>
                  No active trades
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {activeTradeLines.map((lineInfo) => {
                    const timeLeft = lineInfo.timeLeft || (lineInfo.expiryTime - now);
                    if (timeLeft <= 0) return null;
                    
                    const minutes = Math.floor(timeLeft / 60);
                    const seconds = timeLeft % 60;
                    const countdownText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                    
                    return (
                      <div key={lineInfo.id} style={{
                        background: "#1a1a1a",
                        padding: "10px",
                        borderRadius: "6px",
                        border: `1px solid ${lineInfo.side === "CALL" ? "#00ff88" : "#ff4444"}`,
                        borderLeft: `4px solid ${lineInfo.side === "CALL" ? "#00ff88" : "#ff4444"}`
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
                          <span style={{ fontWeight: "bold" }}>{lineInfo.symbol}</span>
                          <span style={{ 
                            color: lineInfo.side === "CALL" ? "#00ff88" : "#ff4444",
                            fontSize: "18px"
                          }}>
                            {lineInfo.side === "CALL" ? "↑" : "↓"}
                          </span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span>${lineInfo.amount}</span>
                          <span style={{ color: "#ffaa00", fontWeight: "bold" }}>{countdownText}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Trade History */}
            <div style={{
              background: "#2a2a2a",
              padding: "15px",
              borderRadius: "8px"
            }}>
              <div style={{ 
                fontSize: "14px", 
                color: "#666", 
                marginBottom: "10px",
                fontWeight: "bold"
              }}>
                Recent History
              </div>
              {historyNewestFirst.length === 0 ? (
                <div style={{ textAlign: "center", color: "#666", padding: "20px" }}>
                  No trades yet
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {historyNewestFirst.slice(0, 5).map((t) => (
                    <div key={t.id} style={{
                      background: "#1a1a1a",
                      padding: "10px",
                      borderRadius: "6px",
                      border: `1px solid ${t.result === "WIN" ? "#00ff88" : t.result === "LOSE" ? "#ff4444" : "#ffaa00"}`,
                      borderLeft: `4px solid ${t.result === "WIN" ? "#00ff88" : t.result === "LOSE" ? "#ff4444" : "#ffaa00"}`
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
                        <span style={{ fontWeight: "bold" }}>{t.symbol}</span>
                        <span style={{ 
                          color: t.result === "WIN" ? "#00ff88" : t.result === "LOSE" ? "#ff4444" : "#ffaa00",
                          fontSize: "12px",
                          fontWeight: "bold"
                        }}>
                          {t.result}
                        </span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span>${t.amount}</span>
                        <span style={{ 
                          color: t.result === "WIN" ? "#00ff88" : "#ff4444",
                          fontWeight: "bold"
                        }}>
                          {t.result === "WIN" ? "+" : ""}${t.payout_amount ? t.payout_amount.toFixed(2) : "0.00"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={() => setShowFullHistoryModal(true)}
                style={{
                  width: "100%",
                  padding: "10px",
                  background: "#00ff88",
                  border: "none",
                  borderRadius: "4px",
                  color: "#000",
                  fontWeight: "bold",
                  fontSize: "14px",
                  cursor: "pointer",
                  marginTop: "10px"
                }}
              >
                View Full History
              </button>
            </div>
          </div>
        )}

        {/* Mobile Trading Controls - Bottom Section */}
        {isMobile && (
          <div 
            className="mobile-trading-controls"
            style={{
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              background: "#1a1a1a",
              borderTop: "2px solid #2a2a2a",
              padding: "20px",
              zIndex: 1000,
              display: "flex",
              flexDirection: "column",
              gap: "15px",
              minHeight: "280px"
            }}
          >
            {/* Time, Payout, and Investment Row */}
            <div className="time-payout-investment-row" style={{
              display: "flex",
              gap: "10px",
              alignItems: "center"
            }}>
              {/* Time Selection - 35% */}
              <div style={{
                flex: "0 0 35%",
                position: "relative"
              }}>
                <div style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center"
                }}>
                  <input
                    type="text"
                    value={formatDuration(duration)}
                    onClick={() => setShowTimePickerPopup(true)}
                    readOnly
                    placeholder="Time"
                    style={{
                      width: "100%",
                      background: "transparent",
                      border: "1px solid rgba(255, 255, 255, 0.2)",
                      borderRadius: "18px",
                      padding: "12px 40px",
                      color: "white",
                      textAlign: "center",
                      fontSize: "18px",
                      fontWeight: "bold",
                      cursor: "pointer",
                      transition: "all 0.3s ease"
                    }}
                    onMouseOver={(e) => {
                      e.target.style.background = "rgba(255, 255, 255, 0.1)";
                      e.target.style.borderColor = "rgba(255, 255, 255, 0.3)";
                    }}
                    onMouseOut={(e) => {
                      e.target.style.background = "transparent";
                      e.target.style.borderColor = "rgba(255, 255, 255, 0.2)";
                    }}
                  />
                  <button
                    onClick={() => {
                      const newDuration = duration <= 60 ? Math.max(10, duration - 10) : duration - 60;
                      setDuration(newDuration);
                    }}
                    style={{
                      position: "absolute",
                      left: "8px",
                      background: "transparent",
                      border: "none",
                      color: "white",
                      fontSize: "20px",
                      fontWeight: "bold",
                      cursor: "pointer",
                      width: "28px",
                      height: "28px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.3s ease"
                    }}
                    onMouseOver={(e) => {
                      e.target.style.color = "rgba(255, 255, 255, 0.8)";
                    }}
                    onMouseOut={(e) => {
                      e.target.style.color = "white";
                    }}
                  >
                    -
                  </button>
                  <button
                    onClick={() => {
                      const newDuration = duration < 60 ? duration + 10 : duration + 60;
                      setDuration(newDuration);
                    }}
                    style={{
                      position: "absolute",
                      right: "8px",
                      color: "white",
                      fontSize: "20px",
                      fontWeight: "bold",
                      cursor: "pointer",
                      width: "28px",
                      height: "28px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.3s ease"
                    }}
                    onMouseOver={(e) => {
                      e.target.style.color = "rgba(255, 255, 255, 0.8)";
                    }}
                    onMouseOut={(e) => {
                      e.target.style.color = "white";
                    }}
                  >
                    +
                  </button>
                </div>
                
                {/* Time Picker Popup for Mobile */}
                {showTimePickerPopup && (
                  <div className="time-picker-popup" style={{
                    position: "absolute",
                    bottom: "100%",
                    left: "0",
                    right: "0",
                    background: "#2a2a2a",
                    border: "1px solid #444",
                    borderRadius: "8px",
                    padding: "15px",
                    zIndex: 1000,
                    marginBottom: "10px"
                  }}>
                    <div style={{ 
                      fontSize: "14px", 
                      color: "#666", 
                      marginBottom: "10px",
                      textAlign: "center"
                    }}>
                      Quick Options
                    </div>
                    <div style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "8px"
                    }}>
                      {quickTimeOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => {
                            setDuration(option.value);
                            setShowTimePickerPopup(false);
                          }}
                          style={{
                            padding: "10px 8px",
                            background: "#1a1a1a",
                            border: "1px solid #444",
                            borderRadius: "4px",
                            color: "white",
                            fontSize: "14px",
                            cursor: "pointer",
                            textAlign: "center"
                          }}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                    <div style={{ 
                      marginTop: "10px", 
                      paddingTop: "10px", 
                      borderTop: "1px solid #444",
                      textAlign: "center"
                    }}>
                      <input
                        type="text"
                        placeholder="Custom (MM:SS)"
                        onChange={(e) => {
                          const value = e.target.value;
                          const parts = value.split(':');
                          if (parts.length === 2) {
                            const minutes = parseInt(parts[0]) || 0;
                            const seconds = parseInt(parts[1]) || 0;
                            setDuration(minutes * 60 + seconds);
                          }
                        }}
                        style={{
                          width: "100%",
                          background: "transparent",
                          border: "1px solid rgba(255, 255, 255, 0.2)",
                          borderRadius: "18px",
                          padding: "10px",
                          color: "white",
                          fontSize: "14px",
                          textAlign: "center",
                          transition: "all 0.3s ease"
                        }}
                        onMouseOver={(e) => {
                          e.target.style.background = "rgba(255, 255, 255, 0.1)";
                          e.target.style.borderColor = "rgba(255, 255, 255, 0.3)";
                        }}
                        onMouseOut={(e) => {
                          e.target.style.background = "transparent";
                          e.target.style.borderColor = "rgba(255, 255, 255, 0.2)";
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Payout Display - 30% */}
              <div style={{
                flex: "0 0 30%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <div style={{
                  background: "transparent",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  borderRadius: "18px",
                  padding: "12px 16px",
                  textAlign: "center",
                  minHeight: "52px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <div style={{
                    fontSize: "14px",
                    color: "#00ff88",
                    fontWeight: "bold"
                  }}>
                    Payout: ${payoutAmount.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Investment Selection - 35% */}
              <div style={{
                flex: "0 0 35%"
              }}>
                <div style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center"
                }}>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    placeholder="Investment"
                    style={{
                      width: "100%",
                      background: "transparent",
                      border: "1px solid rgba(255, 255, 255, 0.2)",
                      borderRadius: "18px",
                      padding: "12px 40px",
                      color: "white",
                      textAlign: "center",
                      fontSize: "18px",
                      fontWeight: "bold",
                      transition: "all 0.3s ease",
                      textAlignLast: "center",
                      WebkitTextAlignLast: "center"
                    }}
                    onMouseOver={(e) => {
                      e.target.style.background = "rgba(255, 255, 255, 0.1)";
                      e.target.style.borderColor = "rgba(255, 255, 255, 0.3)";
                    }}
                    onMouseOut={(e) => {
                      e.target.style.background = "transparent";
                      e.target.style.borderColor = "rgba(255, 255, 255, 0.2)";
                    }}
                  />
                  <button
                    onClick={() => setAmount(Math.max(1, amount - 1))}
                    style={{
                      position: "absolute",
                      left: "8px",
                      background: "transparent",
                      border: "none",
                      color: "white",
                      fontSize: "20px",
                      fontWeight: "bold",
                      cursor: "pointer",
                      width: "28px",
                      height: "28px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.3s ease"
                    }}
                    onMouseOver={(e) => {
                      e.target.style.color = "rgba(255, 255, 255, 0.8)";
                    }}
                    onMouseOut={(e) => {
                      e.target.style.color = "white";
                    }}
                  >
                    -
                  </button>
                  <button
                    onClick={() => setAmount(amount + 1)}
                    style={{
                      position: "absolute",
                      right: "8px",
                      background: "transparent",
                      border: "none",
                      color: "white",
                      fontSize: "20px",
                      fontWeight: "bold",
                      cursor: "pointer",
                      width: "28px",
                      height: "28px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.3s ease"
                    }}
                    onMouseOver={(e) => {
                      e.target.style.color = "rgba(255, 255, 255, 0.8)";
                    }}
                    onMouseOut={(e) => {
                      e.target.style.color = "white";
                    }}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Trade Buttons Row */}
            <div className="trade-buttons" style={{
              display: "flex",
              gap: "15px",
              alignItems: "center"
            }}>
              {/* Down Button */}
              <button
                onClick={() => place("PUT")}
                disabled={isPlacingTrade}
                style={{
                  flex: 1,
                  height: "70px",
                  background: isPlacingTrade ? "#666" : "#ff4444",
                  border: "none",
                  borderRadius: "8px",
                  color: "white",
                  fontWeight: "bold",
                  fontSize: "20px",
                  cursor: isPlacingTrade ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  transition: "all 0.3s ease",
                  transform: "translateY(0)",
                  boxShadow: "0 4px 8px rgba(255, 68, 68, 0.3)"
                }}
                onMouseOver={(e) => {
                  if (!isPlacingTrade) {
                    e.target.style.transform = "translateY(-3px)";
                    e.target.style.boxShadow = "0 8px 16px rgba(255, 68, 68, 0.5)";
                    e.target.style.background = "#ff6666";
                  }
                }}
                onMouseOut={(e) => {
                  if (!isPlacingTrade) {
                    e.target.style.transform = "translateY(0)";
                    e.target.style.boxShadow = "0 4px 8px rgba(255, 68, 68, 0.3)";
                    e.target.style.background = "#ff4444";
                  }
                }}
              >
                <span style={{ fontSize: "24px" }}>↓</span>
                <span>{isPlacingTrade ? "Placing..." : "Down"}</span>
              </button>

              {/* Up Button */}
              <button
                onClick={() => place("CALL")}
                disabled={isPlacingTrade}
                style={{
                  flex: 1,
                  height: "70px",
                  background: isPlacingTrade ? "#666" : "#00ff88",
                  border: "none",
                  borderRadius: "8px",
                  color: "#000",
                  fontWeight: "bold",
                  fontSize: "20px",
                  cursor: isPlacingTrade ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  transition: "all 0.3s ease",
                  transform: "translateY(0)",
                  boxShadow: "0 4px 8px rgba(0, 255, 136, 0.3)"
                }}
                onMouseOver={(e) => {
                  if (!isPlacingTrade) {
                    e.target.style.transform = "translateY(-3px)";
                    e.target.style.boxShadow = "0 8px 16px rgba(0, 255, 136, 0.5)";
                    e.target.style.background = "#00ffaa";
                  }
                }}
                onMouseOut={(e) => {
                  if (!isPlacingTrade) {
                    e.target.style.transform = "translateY(0)";
                    e.target.style.boxShadow = "0 4px 8px rgba(0, 255, 136, 0.3)";
                    e.target.style.background = "#00ff88";
                  }
                }}
              >
                <span style={{ fontSize: "24px" }}>↑</span>
                <span>{isPlacingTrade ? "Placing..." : "Up"}</span>
              </button>
            </div>



            {/* Navigation Buttons - Integrated into Trading Controls */}
            <div style={{
              display: "flex",
              gap: "10px",
              marginTop: "10px"
            }}>
              {/* Chart Button - 33% */}
              <button 
                onClick={() => setActiveTab('chart')}
                style={{
                  flex: "0 0 33%",
                  background: activeTab === 'chart' ? "#2a2a2a" : "#1a1a1a",
                  border: "1px solid #2a2a2a",
                  color: activeTab === 'chart' ? "#00ff88" : "#666",
                  padding: "12px",
                  borderRadius: "6px",
                  fontWeight: "500",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <img 
                  src="/assets/landing/line-chart-line-graph-svgrepo-com.svg" 
                  alt="Chart" 
                  style={{ 
                    width: "40px", 
                    height: "40px",
                    filter: activeTab === 'chart' ? "brightness(0) saturate(100%) invert(84%) sepia(100%) saturate(1000%) hue-rotate(60deg) brightness(1) contrast(1)" : "brightness(0) saturate(100%) invert(100%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(1) contrast(1)"
                  }} 
                />
              </button>
              
              {/* Trades Button - 33% */}
              <button
                onClick={() => {
                  setShowMobileTradePage(true);
                  setActiveTab('trades'); // Set default tab to active trades
                }}
                style={{
                  flex: "0 0 33%",
                  background: "#1a1a1a",
                  border: "1px solid #2a2a2a",
                  color: "#666",
                  padding: "12px",
                  borderRadius: "6px",
                  fontWeight: "500",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <img 
                  src="/assets/landing/history-3-svgrepo-com.svg" 
                  alt="Trades" 
                  style={{ 
                    width: "40px", 
                    height: "40px",
                    filter: "brightness(0) saturate(100%) invert(100%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(1) contrast(1)"
                  }} 
                />
              </button>
              
              {/* Bank Button - 33% */}
              <button
                onClick={() => window.location.href = 'http://localhost:5173/deposit'}
                style={{
                  flex: "0 0 33%",
                  background: "#1a1a1a",
                  border: "1px solid #2a2a2a",
                  color: "#666",
                  padding: "12px",
                  borderRadius: "6px",
                  fontWeight: "500",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <img 
                  src="/assets/landing/bank-svgrepo-com.svg" 
                  alt="Bank" 
                  style={{ 
                    width: "40px", 
                    height: "40px",
                    filter: "brightness(0) saturate(100%) invert(100%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(1) contrast(1)"
                  }} 
                />
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* NEW: Full History Modal */}
      {showFullHistoryModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.8)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 2000
        }}>
          <div className="modal-content" style={{
            background: "#1a1a1a",
            border: "1px solid #2a2a2a",
            borderRadius: "12px",
            padding: "20px",
            maxWidth: "90vw",
            maxHeight: "80vh",
            overflow: "auto",
            minWidth: "800px"
          }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px"
            }}>
              <h2 style={{ margin: 0, color: "white" }}>Complete Trade History</h2>
              <button
                onClick={closeModal}
                style={{
                  background: "none",
                  border: "none",
                  color: "#666",
                  fontSize: "24px",
                  cursor: "pointer",
                  padding: "0",
                  width: "30px",
                  height: "30px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr",
              gap: "10px",
              fontSize: "12px",
              fontWeight: "bold",
              color: "#666",
              marginBottom: "10px",
              padding: "0 10px"
            }}>
              <div>Pair</div>
              <div>Investment</div>
              <div>Result</div>
              <div>Direction</div>
              <div>Open Time</div>
              <div>Close Time</div>
              <div>Open Price</div>
              <div>Close Price</div>
            </div>
            
            <div style={{ maxHeight: "60vh", overflowY: "auto" }}>
              {historyAllNewestFirst.map((t) => (
                <div
                  key={t.id}
                  onClick={() => handleHistoryTradeClick(t)}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr",
                    gap: "10px",
                    padding: "10px",
                    background: "#2a2a2a",
                    borderRadius: "6px",
                    marginBottom: "8px",
                    cursor: "pointer",
                    transition: "background-color 0.2s",
                    fontSize: "12px"
                  }}
                  onMouseEnter={(e) => e.target.style.background = "#333"}
                  onMouseLeave={(e) => e.target.style.background = "#2a2a2a"}
                >
                  <div>{t.symbol.replace('USDT', '/USDT')}</div>
                  <div>${t.amount}</div>
                  <div style={{ 
                    color: t.result === "WIN" ? "#00ff88" : 
                           t.result === "LOSE" ? "#ff4444" : 
                           t.result === "REFUND" ? "#ffaa00" : "#666"
                  }}>
                    {t.result}
                  </div>
                  <div style={{ 
                    color: t.side === "CALL" ? "#00ff88" : "#ff4444"
                  }}>
                    {t.side === "CALL" ? "↑" : "↓"}
                  </div>
                  <div>{formatDateTime(t.id / 1000)}</div>
                  <div>{formatDateTime(t.expiry_time || t.expiryTime)}</div>
                  <div>${t.entry_price || t.entryPrice}</div>
                  <div>${t.expiry_price}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* NEW: Trade Details Modal */}
      {showTradeDetailsModal && selectedHistoryTrade && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.8)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 2000
        }}>
          <div className="modal-content" style={{
            background: "#1a1a1a",
            border: "1px solid #2a2a2a",
            borderRadius: "12px",
            padding: "20px",
            maxWidth: "500px",
            width: "90vw"
          }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px"
            }}>
              <h2 style={{ margin: 0, color: "white" }}>Trade Details</h2>
              <button
                onClick={closeModal}
                style={{
                  background: "none",
                  border: "none",
                  color: "#666",
                  fontSize: "24px",
                  cursor: "pointer",
                  padding: "0",
                  width: "30px",
                  height: "30px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{ display: "grid", gap: "15px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#666" }}>Pair:</span>
                <span style={{ color: "white", fontWeight: "bold" }}>
                  {selectedHistoryTrade.symbol.replace('USDT', '/USDT')}
                </span>
              </div>
              
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#666" }}>Investment:</span>
                <span style={{ color: "white", fontWeight: "bold" }}>
                  ${selectedHistoryTrade.amount}
                </span>
              </div>
              
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#666" }}>Result:</span>
                <span style={{ 
                  color: selectedHistoryTrade.result === "WIN" ? "#00ff88" : 
                         selectedHistoryTrade.result === "LOSE" ? "#ff4444" : 
                         selectedHistoryTrade.result === "REFUND" ? "#ffaa00" : "#666",
                  fontWeight: "bold"
                }}>
                  {selectedHistoryTrade.result}
                </span>
              </div>
              
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#666" }}>Direction:</span>
                <span style={{ 
                  color: selectedHistoryTrade.side === "CALL" ? "#00ff88" : "#ff4444",
                  fontWeight: "bold"
                }}>
                  {selectedHistoryTrade.side === "CALL" ? "↑ UP" : "↓ DOWN"}
                </span>
              </div>
              
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#666" }}>Open Time:</span>
                <span style={{ color: "white", fontWeight: "bold" }}>
                  {formatDateTime(selectedHistoryTrade.id / 1000)}
                </span>
              </div>
              
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#666" }}>Close Time:</span>
                <span style={{ color: "white", fontWeight: "bold" }}>
                  {formatDateTime(selectedHistoryTrade.expiry_time || selectedHistoryTrade.expiryTime)}
                </span>
              </div>
              
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#666" }}>Open Price:</span>
                <span style={{ color: "white", fontWeight: "bold" }}>
                  ${selectedHistoryTrade.entry_price || selectedHistoryTrade.entryPrice}
                </span>
              </div>
              
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#666" }}>Close Price:</span>
                <span style={{ color: "white", fontWeight: "bold" }}>
                  ${selectedHistoryTrade.expiry_price}
                </span>
              </div>
              
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#666" }}>Payout:</span>
                <span style={{ 
                  color: selectedHistoryTrade.result === "WIN" ? "#00ff88" : 
                         selectedHistoryTrade.result === "REFUND" ? "#ffaa00" : "#ff4444",
                  fontWeight: "bold"
                }}>
                  ${selectedHistoryTrade.payout_amount ? selectedHistoryTrade.payout_amount.toFixed(2) : "0.00"}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* REMOVED: Deposit and Withdrawal Modals - Replaced with placeholder buttons */}
    </div>
  );
}