export const saveState = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving state for key ${key}:`, error);
  }
};

export const loadState = (key, defaultValue) => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultValue;
  } catch (error) {
    console.error(`Error loading state for key ${key}:`, error);
    return defaultValue;
  }
};

export const clearState = (key) => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Error clearing localStorage:', error);
  }
};

// Storage keys for the trading platform
export const STORAGE_KEYS = {
  ACTIVE_TRADES: 'trading_platform_active_trades', // Unified active trades with line metadata
  TRADE_HISTORY: 'trading_platform_trade_history', // Completed trades
  DEMO_BALANCE: 'trading_platform_demo_balance',
  REAL_BALANCE: 'trading_platform_real_balance',
  SELECTED_TIME: 'trading_platform_selected_time',
  SELECTED_INVESTMENT: 'trading_platform_selected_investment',
  SELECTED_PAIR: 'trading_platform_selected_pair',
  SELECTED_TIMEFRAME: 'trading_platform_selected_timeframe',
  ACCOUNT_TYPE: 'trading_platform_account_type'
};
