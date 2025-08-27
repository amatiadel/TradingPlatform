# Deposit UI Integration Guide

## Overview
This guide explains how to integrate the improved Deposit UI components with real backend APIs, replacing the mock implementations.

## Current Implementation
The deposit pages currently use mock API hooks (`useMockDepositApi`) for UI-only improvements. These mocks simulate:
- Promo code validation
- Deposit request creation
- Deposit data fetching
- Payment marking
- Real-time updates

## Integration Steps

### 1. Replace Mock API Hooks

#### In `src/pages/Deposit.jsx`:
```javascript
// Replace this:
const { validatePromoCode, createDepositRequest } = useMockDepositApi();

// With real API calls:
const validatePromoCode = async (code) => {
  const response = await axios.get(`/api/promo-codes/${code.trim()}`);
  return response.data;
};

const createDepositRequest = async (data) => {
  const response = await axios.post('/api/user/deposit-request', data);
  return response.data;
};
```

#### In `src/pages/DepositConfirm.jsx`:
```javascript
// Replace this:
const { getDepositRequest, markAsPaid } = useMockDepositApi();

// With real API calls:
const getDepositRequest = async (id) => {
  const response = await axios.get(`/api/user/deposit-request/${id}`);
  return response.data;
};

const markAsPaid = async (id) => {
  const response = await axios.patch(`/api/user/deposit-request/${id}/mark-paid`);
  return response.data;
};
```

#### In `src/components/deposit/LatestRequests.jsx`:
```javascript
// Replace this:
const { getDepositRequests } = useMockDepositApi();

// With real API calls:
const getDepositRequests = async () => {
  const response = await axios.get('/api/user/deposit-requests');
  return response.data;
};
```

### 2. Implement Real-time Socket Connections

#### Replace mock socket simulation with real Socket.IO:
```javascript
// In LatestRequests.jsx
useEffect(() => {
  if (!user) return;

  const socket = io('http://localhost:4000');
  
  // Authenticate with JWT token
  const token = localStorage.getItem('token');
  if (token) {
    socket.emit('authenticate', { token });
  }

  // Join user room for deposit notifications
  socket.emit('join_user_room');

  // Listen for deposit updates
  socket.on('user:deposit:approved', (data) => {
    setRequests(prev => 
      prev.map(req => 
        req.id === data.id 
          ? { ...req, status: 'approved' }
          : req
      )
    );
  });

  socket.on('user:deposit:rejected', (data) => {
    setRequests(prev => 
      prev.map(req => 
        req.id === data.id 
          ? { ...req, status: 'rejected' }
          : req
      )
    );
  });

  return () => {
    socket.disconnect();
  };
}, [user]);
```

### 3. Update Error Handling

#### Replace mock error handling with real API error responses:
```javascript
// Before (mock):
catch (error) {
  setError(error.message || 'Invalid promo code');
}

// After (real API):
catch (error) {
  setError(error.response?.data?.error || 'Invalid promo code');
}
```

### 4. Add Loading States

#### Implement proper loading states for API calls:
```javascript
const [isValidatingPromo, setIsValidatingPromo] = useState(false);

const handleValidatePromoCode = async () => {
  setIsValidatingPromo(true);
  try {
    const result = await validatePromoCode(promoCode.trim());
    setPromoBonusPercent(result.bonusPercent);
    setSuccess(`Promo code applied! +${result.bonusPercent}% bonus`);
  } catch (error) {
    setError(error.response?.data?.error || 'Invalid promo code');
  } finally {
    setIsValidatingPromo(false);
  }
};
```

### 5. Add Error Boundaries

#### Create error boundary for deposit components:
```javascript
// src/components/ErrorBoundary.jsx
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Deposit component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="text-center p-8">
          <h2 className="text-xl font-bold text-red-400 mb-4">
            Something went wrong
          </h2>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-green-600 text-white rounded-lg"
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

### 6. Add Authentication Checks

#### Ensure user authentication before API calls:
```javascript
const { user } = useAuth();

useEffect(() => {
  if (!user) {
    navigate('/login');
    return;
  }
  
  // Load deposit data
  loadDepositData();
}, [user, navigate]);
```

### 7. Add Request Interceptors

#### Add axios interceptors for consistent error handling:
```javascript
// src/utils/api.js
import axios from 'axios';

// Request interceptor
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

## Environment Configuration

### Add environment variables:
```javascript
// .env
REACT_APP_API_URL=http://localhost:4000
REACT_APP_SOCKET_URL=http://localhost:4000
```

### Update API base URL:
```javascript
// src/utils/api.js
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:4000';

export { API_BASE_URL, SOCKET_URL };
```

## Testing the Integration

### 1. Test API Endpoints
```bash
# Test promo code validation
curl -X GET http://localhost:4000/api/promo-codes/DEPOSIT20

# Test deposit request creation
curl -X POST http://localhost:4000/api/user/deposit-request \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"amount": 100, "selectedBonusPercent": 20, "paymentMethod": "USDT-TRC20"}'
```

### 2. Test Socket Connections
```javascript
// Test socket connection in browser console
const socket = io('http://localhost:4000');
socket.emit('authenticate', { token: 'YOUR_TOKEN' });
socket.emit('join_user_room');
socket.on('user:deposit:approved', console.log);
```

### 3. Test Error Scenarios
- Invalid promo codes
- Network errors
- Authentication failures
- Server errors

## Performance Optimizations

### 1. Implement Caching
```javascript
// Cache promo code validation results
const promoCodeCache = new Map();

const validatePromoCode = async (code) => {
  if (promoCodeCache.has(code)) {
    return promoCodeCache.get(code);
  }
  
  const result = await axios.get(`/api/promo-codes/${code}`);
  promoCodeCache.set(code, result.data);
  return result.data;
};
```

### 2. Add Request Debouncing
```javascript
// Debounce promo code validation
const debouncedValidatePromo = useCallback(
  debounce(async (code) => {
    if (!code.trim()) return;
    await handleValidatePromoCode();
  }, 500),
  []
);
```

### 3. Implement Optimistic Updates
```javascript
// Optimistically update UI before API response
const handleMarkPaid = async () => {
  // Optimistic update
  setDepositData(prev => ({
    ...prev,
    status: 'waiting_confirmation'
  }));
  
  try {
    await markAsPaid(reqId);
  } catch (error) {
    // Revert on error
    setDepositData(prev => ({
      ...prev,
      status: 'created'
    }));
    setError(error.message);
  }
};
```

## Security Considerations

### 1. Input Validation
```javascript
// Validate amount on client side
const validateAmount = (amount) => {
  const num = parseFloat(amount);
  return num >= 10 && num <= 50000 && !isNaN(num);
};
```

### 2. CSRF Protection
```javascript
// Add CSRF token to requests
const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;

axios.defaults.headers.common['X-CSRF-Token'] = csrfToken;
```

### 3. Rate Limiting
```javascript
// Implement client-side rate limiting
const rateLimiter = {
  lastRequest: 0,
  minInterval: 1000, // 1 second
  
  canMakeRequest() {
    const now = Date.now();
    if (now - this.lastRequest >= this.minInterval) {
      this.lastRequest = now;
      return true;
    }
    return false;
  }
};
```

## Monitoring and Analytics

### 1. Add Error Tracking
```javascript
// Track errors for monitoring
const trackError = (error, context) => {
  console.error('Deposit error:', error, context);
  // Send to error tracking service (e.g., Sentry)
};
```

### 2. Add Performance Monitoring
```javascript
// Track API response times
const trackApiCall = async (apiCall, name) => {
  const start = performance.now();
  try {
    const result = await apiCall();
    const duration = performance.now() - start;
    console.log(`${name} took ${duration}ms`);
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    console.error(`${name} failed after ${duration}ms:`, error);
    throw error;
  }
};
```

## Conclusion

After completing these integration steps, the deposit UI will be fully functional with real backend APIs while maintaining the improved visual design and user experience. The mock implementations can be safely removed once all real API endpoints are working correctly.

Remember to:
- Test thoroughly in development environment
- Monitor for errors and performance issues
- Update documentation for the team
- Consider implementing feature flags for gradual rollout
