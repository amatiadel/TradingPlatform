import React, { useState, useEffect } from 'react';
import { useAuth } from '../../AuthContext';

// Global state to track deposit requests across components
export let globalDepositRequests = new Map(); // userId -> array of requests

// Load from localStorage on initialization
const loadFromStorage = () => {
  try {
    const stored = localStorage.getItem('depositRequests');
    if (stored) {
      const parsed = JSON.parse(stored);
      globalDepositRequests = new Map(Object.entries(parsed));
    }
  } catch (error) {
    console.error('Failed to load deposit requests from storage:', error);
  }
};

// Save to localStorage
const saveToStorage = () => {
  try {
    const obj = Object.fromEntries(globalDepositRequests);
    localStorage.setItem('depositRequests', JSON.stringify(obj));
  } catch (error) {
    console.error('Failed to save deposit requests to storage:', error);
  }
};

// Initialize from storage
loadFromStorage();

// Mock API hook for UI-only improvements
const useMockDepositApi = () => {
  const validatePromoCode = async (code) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock promo codes
    const validPromos = {
      'DEPOSIT20': { percent: 20, message: 'Your promocode is valid, and you get 20% bonus' },
      'DEPOSIT50': { percent: 50, message: 'Your promocode is valid, and you get 50% bonus' },
      'DEPOSIT70': { percent: 70, message: 'Your promocode is valid, and you get 70% bonus' },
      'DEPOSIT100': { percent: 100, message: 'Your promocode is valid, and you get 100% bonus' }
    };
    
    if (validPromos[code]) {
      return { success: true, ...validPromos[code] };
    } else {
      return { success: false, message: 'Invalid promo code' };
    }
  };

  const createDepositRequest = async (depositDetails) => {
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API delay
    // In a real app, this would send to backend and return a real reqId and address
    return {
      id: `req_${Date.now()}`,
      userId: depositDetails.userId || 1,
      amount: depositDetails.amount,
      finalTotal: depositDetails.finalTotal,
      bonusAmount: depositDetails.bonusAmount,
      paymentMethod: 'USDT-TRC20',
      address: 'TRC20WalletAddress1234567890abcdef',
      status: 'created',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString() // 4 hours from now
    };
  };

  const getDepositRequests = async (userId) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Get user-specific requests from global state
    const userRequests = globalDepositRequests.get(userId) || [];
    return userRequests;
  };

  const getDepositRequest = async (id) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // This function is used by DepositConfirm to get a specific request
    // We'll return a mock response since the actual data comes from global state
    return {
      id,
      status: 'created'
    };
  };

  const markAsPaid = async (id) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock response
    return { success: true, status: 'waiting_confirmation' };
  };

  const addDepositRequest = (userId, request) => {
    const userRequests = globalDepositRequests.get(userId) || [];
    const updatedRequests = [request, ...userRequests]; // Add new request at the top
    globalDepositRequests.set(userId, updatedRequests);
    
    // Save to localStorage
    saveToStorage();
    
    // Notify admin (in a real app, this would be a socket event or API call)
    notifyAdmin(request);
    
    return updatedRequests;
  };

  const updateDepositRequest = (userId, requestId, updates) => {
    const userRequests = globalDepositRequests.get(userId) || [];
    const updatedRequests = userRequests.map(req => 
      req.id === requestId ? { ...req, ...updates } : req
    );
    globalDepositRequests.set(userId, updatedRequests);
    
    // Save to localStorage
    saveToStorage();
    
    // If status changed to waiting_confirmation, notify admin
    if (updates.status === 'waiting_confirmation') {
      const updatedRequest = updatedRequests.find(req => req.id === requestId);
      if (updatedRequest) {
        notifyAdmin(updatedRequest, 'payment_received');
      }
    }
    
    return updatedRequests;
  };

  // Admin notification function
  const notifyAdmin = (request, event = 'new_deposit') => {
    // In a real app, this would emit a socket event or make an API call
    console.log(`🔔 Admin Notification - ${event}:`, {
      requestId: request.id,
      userId: request.userId,
      amount: request.amount,
      status: request.status,
      timestamp: new Date().toISOString()
    });
    
    // For demo purposes, we'll store admin notifications in localStorage
    const adminNotifications = JSON.parse(localStorage.getItem('adminNotifications') || '[]');
    adminNotifications.push({
      id: `notif_${Date.now()}`,
      event,
      requestId: request.id,
      userId: request.userId,
      amount: request.amount,
      status: request.status,
      timestamp: new Date().toISOString(),
      read: false
    });
    localStorage.setItem('adminNotifications', JSON.stringify(adminNotifications));
  };

  // Admin functions
  const getAdminNotifications = () => {
    try {
      return JSON.parse(localStorage.getItem('adminNotifications') || '[]');
    } catch (error) {
      return [];
    }
  };

  const markNotificationAsRead = (notificationId) => {
    const notifications = getAdminNotifications();
    const updated = notifications.map(notif => 
      notif.id === notificationId ? { ...notif, read: true } : notif
    );
    localStorage.setItem('adminNotifications', JSON.stringify(updated));
  };

  const getAllDepositRequests = () => {
    // Get all deposit requests for admin view
    const allRequests = [];
    globalDepositRequests.forEach((requests, userId) => {
      requests.forEach(request => {
        allRequests.push({ ...request, userId });
      });
    });
    return allRequests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  };

  const approveDepositRequest = (requestId, adminId) => {
    // Find the request and update its status
    let found = false;
    globalDepositRequests.forEach((requests, userId) => {
      const requestIndex = requests.findIndex(req => req.id === requestId);
      if (requestIndex !== -1) {
        requests[requestIndex] = {
          ...requests[requestIndex],
          status: 'approved',
          approvedAt: new Date().toISOString(),
          adminId
        };
        found = true;
      }
    });
    
    if (found) {
      saveToStorage();
      return { success: true };
    }
    return { success: false, error: 'Request not found' };
  };

  const rejectDepositRequest = (requestId, adminId, reason) => {
    // Find the request and update its status
    let found = false;
    globalDepositRequests.forEach((requests, userId) => {
      const requestIndex = requests.findIndex(req => req.id === requestId);
      if (requestIndex !== -1) {
        requests[requestIndex] = {
          ...requests[requestIndex],
          status: 'rejected',
          rejectedAt: new Date().toISOString(),
          adminId,
          rejectionReason: reason
        };
        found = true;
      }
    });
    
    if (found) {
      saveToStorage();
      return { success: true };
    }
    return { success: false, error: 'Request not found' };
  };

  return { 
    validatePromoCode, 
    createDepositRequest, 
    getDepositRequests,
    getDepositRequest, 
    markAsPaid, 
    addDepositRequest, 
    updateDepositRequest,
    getAdminNotifications,
    markNotificationAsRead,
    getAllDepositRequests,
    approveDepositRequest,
    rejectDepositRequest
  };
};

const LatestRequests = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Real API function to get user's deposit requests
  const getDepositRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/user/deposit-requests', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (err) {
      console.error('Failed to fetch deposit requests:', err);
      throw err;
    }
  };

  // Load deposit requests
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const loadRequests = async () => {
      try {
        const data = await getDepositRequests();
        setRequests(data);
      } catch (error) {
        console.error('Failed to load deposit requests:', error);
        setError('Failed to load deposit requests');
      } finally {
        setIsLoading(false);
      }
    };

    loadRequests();
  }, [user]);

  // Refresh data every 10 seconds
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(async () => {
      try {
        const data = await getDepositRequests();
        setRequests(data);
      } catch (error) {
        console.error('Failed to refresh deposit requests:', error);
      }
    }, 10000);
    
    return () => clearInterval(interval);
  }, [user]);

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  // Get status info
  const getStatusInfo = (status) => {
    switch (status) {
      case 'created':
        return { 
          icon: '📝',
          text: 'Created'
        };
      case 'waiting_confirmation':
        return { 
          icon: '⏳',
          text: 'Waiting confirmation'
        };
      case 'approved':
        return { 
          icon: '✓',
          text: 'Approved'
        };
      case 'rejected':
        return { 
          icon: '❌',
          text: 'Rejected'
        };
      case 'cancelled':
        return { 
          icon: '🚫',
          text: 'Cancelled'
        };
      case 'expired':
        return { 
          icon: '⏰',
          text: 'Expired'
        };
      default:
        return { 
          icon: '❓',
          text: status
        };
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {[...Array(3)].map((_, i) => (
          <div key={i} style={{
            height: '64px',
            background: '#333333',
            borderRadius: '6px',
            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
          }}></div>
        ))}
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        fontSize: '12px',
        padding: '12px',
        background: 'rgba(255, 68, 68, 0.1)',
        border: '1px solid #ff4444',
        borderRadius: '6px',
        color: '#ff4444'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{
        fontSize: '12px',
        textAlign: 'center',
        padding: '24px',
        background: 'rgba(102, 102, 102, 0.1)',
        borderRadius: '6px',
        border: '1px solid #444444',
        color: '#666666'
      }}>
        <div style={{ fontSize: '24px', marginBottom: '8px' }}>🔐</div>
        <div>Please log in to view your requests</div>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div style={{
        fontSize: '12px',
        textAlign: 'center',
        padding: '24px',
        background: 'rgba(102, 102, 102, 0.1)',
        borderRadius: '6px',
        border: '1px solid #444444',
        color: '#666666'
      }}>
        <div style={{ fontSize: '24px', marginBottom: '8px' }}>📭</div>
        <div>No requests yet</div>
        <div style={{
          fontSize: '10px',
          marginTop: '4px',
          opacity: 0.7
        }}>
          Your deposit history will appear here
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
      {requests.slice(0, 5).map((request, index) => {
        const statusInfo = getStatusInfo(request.status);
        return (
          <div 
            key={request.id} 
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 0',
              borderBottom: '1px solid #444444',
              borderBottomStyle: index === requests.slice(0, 5).length - 1 ? 'none' : 'solid'
            }}
          >
            {/* Left - Date */}
            <div style={{
              fontSize: '12px',
              color: '#ffffff'
            }}>
              {formatDate(request.createdAt)}
            </div>
            
            {/* Center - Status */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '12px'
            }}>
              <div style={{
                width: '24px',
                height: '24px',
                background: '#666666',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <span style={{
                  fontSize: '10px',
                  fontWeight: 'bold',
                  color: '#1a1a1a'
                }}>
                  {statusInfo.icon}
                </span>
              </div>
              <span style={{ color: '#ffffff' }}>{statusInfo.text}</span>
            </div>
            
            {/* Right - Method + Amount */}
            <div style={{ textAlign: 'right' }}>
              <div style={{
                fontSize: '12px',
                color: '#666666'
              }}>
                {request.paymentMethod}
              </div>
              <div style={{
                fontSize: '12px',
                fontWeight: 'bold',
                color: '#00ff88'
              }}>
                +{parseFloat(request.finalTotal || 0).toFixed(2)} $
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Export the API functions so other components can use them
export { useMockDepositApi };
export default LatestRequests;
