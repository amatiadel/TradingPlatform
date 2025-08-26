// User-specific storage utility
// This handles storing and retrieving user-specific data based on user ID

export const saveUserState = (userId, key, value) => {
  try {
    const userKey = `user_${userId}_${key}`;
    localStorage.setItem(userKey, JSON.stringify(value));
  } catch (error) {
    console.error('Error saving user state:', error);
  }
};

export const loadUserState = (userId, key, defaultValue) => {
  try {
    const userKey = `user_${userId}_${key}`;
    const saved = localStorage.getItem(userKey);
    return saved ? JSON.parse(saved) : defaultValue;
  } catch (error) {
    console.error('Error loading user state:', error);
    return defaultValue;
  }
};

export const clearUserState = (userId) => {
  try {
    const keys = Object.keys(localStorage);
    const userKeys = keys.filter(key => key.startsWith(`user_${userId}_`));
    userKeys.forEach(key => localStorage.removeItem(key));
  } catch (error) {
    console.error('Error clearing user state:', error);
  }
};

// User-specific storage keys
export const USER_STORAGE_KEYS = {
  ACTIVE_TRADES: 'active_trades',
  TRADE_HISTORY: 'trade_history',
  DEMO_BALANCE: 'demo_balance',
  REAL_BALANCE: 'real_balance',
  SELECTED_TIME: 'selected_time',
  SELECTED_INVESTMENT: 'selected_investment',
  SELECTED_PAIR: 'selected_pair',
  SELECTED_TIMEFRAME: 'selected_timeframe',
  ACCOUNT_TYPE: 'account_type'
};
