import React, { useState, useEffect } from 'react';
import { useAuth } from '../../AuthContext';

const AdminDepositPanel = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Load data from real API
  const loadData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found');
        setIsLoading(false);
        return;
      }

      // Fetch deposit requests from real API
      const url = statusFilter ? `/api/admin/deposit-requests?status=${statusFilter}` : '/api/admin/deposit-requests';
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setRequests(data);
      setError('');
    } catch (err) {
      console.error('Failed to load deposit requests:', err);
      setError('Failed to load deposit requests');
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on mount and refresh every 5 seconds
  useEffect(() => {
    loadData();
    
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [statusFilter]);

  const handleApprove = async (requestId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/deposit-requests/${requestId}/approve`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ adminNote: 'Approved by admin' })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        alert('Deposit request approved successfully!');
        loadData(); // Refresh the data
      } else {
        alert('Failed to approve request: ' + (result.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Failed to approve deposit request:', err);
      alert('Failed to approve request: ' + err.message);
    }
  };

  const handleReject = async (requestId) => {
    const reason = prompt('Please enter rejection reason:');
    if (!reason) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/deposit-requests/${requestId}/reject`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          adminNote: reason,
          reason: reason 
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        alert('Deposit request rejected successfully!');
        loadData(); // Refresh the data
      } else {
        alert('Failed to reject request: ' + (result.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Failed to reject deposit request:', err);
      alert('Failed to reject request: ' + err.message);
    }
  };

  const handleMarkNotificationRead = (notificationId) => {
    // For now, we'll just remove the notification from the list
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'created': return '#6c757d';
      case 'waiting_confirmation': return '#ffc107';
      case 'approved': return '#28a745';
      case 'rejected': return '#dc3545';
      case 'cancelled': return '#dc3545';
      case 'expired': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'created': return 'New Request';
      case 'waiting_confirmation': return 'Pending Review';
      case 'approved': return 'Approved';
      case 'rejected': return 'Rejected';
      case 'cancelled': return 'Cancelled';
      case 'expired': return 'Expired';
      default: return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'created': return '🆕';
      case 'waiting_confirmation': return '⏳';
      case 'approved': return '✅';
      case 'rejected': return '❌';
      case 'cancelled': return '❌';
      case 'expired': return '⏰';
      default: return '📋';
    }
  };

  if (isLoading) {
    return (
      <div style={{
        padding: '40px',
        background: '#2a2a2a',
        borderRadius: '12px',
        border: '1px solid #444444',
        textAlign: 'center'
      }}>
        <div style={{ 
          color: '#ffffff',
          fontSize: '18px',
          fontWeight: '500'
        }}>
          Loading deposit requests...
        </div>
        <div style={{ 
          color: '#666666',
          fontSize: '14px',
          marginTop: '8px'
        }}>
          Please wait while we fetch the latest data
        </div>
      </div>
    );
  }

  return (
    <div style={{
      padding: '24px',
      background: '#2a2a2a',
      borderRadius: '12px',
      border: '1px solid #444444',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        paddingBottom: '16px',
        borderBottom: '2px solid #444444'
      }}>
        <div>
          <h2 style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#ffffff',
            margin: '0 0 4px 0'
          }}>
            💰 Deposit Management
          </h2>
          <p style={{
            fontSize: '14px',
            color: '#cccccc',
            margin: '0'
          }}>
            Review and manage user deposit requests
          </p>
        </div>
        
        {/* Notifications */}
        {notifications.length > 0 && (
          <div style={{
            background: 'linear-gradient(135deg, #ff4444 0%, #cc0000 100%)',
            color: '#ffffff',
            padding: '10px 16px',
            borderRadius: '25px',
            fontSize: '14px',
            fontWeight: 'bold',
            boxShadow: '0 4px 12px rgba(255, 68, 68, 0.3)'
          }}>
            🔔 {notifications.length} new notification{notifications.length > 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Notifications */}
      {notifications.length > 0 && (
        <div style={{
          background: '#333333',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '24px',
          border: '1px solid #444444'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: 'bold',
            color: '#ffffff',
            margin: '0 0 16px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            🔔 Recent Notifications
          </h3>
          {notifications.slice(0, 3).map(notification => (
            <div key={notification.id} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 0',
              borderBottom: '1px solid #444444'
            }}>
              <div>
                <div style={{
                  fontSize: '15px',
                  color: '#ffffff',
                  fontWeight: '600'
                }}>
                  {notification.event === 'new_deposit' ? '🆕 New Deposit Request' : '💰 Payment Received'}
                </div>
                <div style={{
                  fontSize: '13px',
                  color: '#cccccc',
                  marginTop: '4px'
                }}>
                  User ID: {notification.userId} • Amount: ${notification.amount} • {formatDate(notification.timestamp)}
                </div>
              </div>
              <button
                onClick={() => handleMarkNotificationRead(notification.id)}
                style={{
                  padding: '8px 16px',
                  background: 'linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#000000',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 4px 12px rgba(0, 255, 136, 0.3)';
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                Mark as Read
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Deposit Requests */}
      <div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <div>
            <h3 style={{
              fontSize: '22px',
              fontWeight: 'bold',
              color: '#ffffff',
              margin: '0 0 4px 0'
            }}>
              📋 Deposit Requests
            </h3>
            <p style={{
              fontSize: '14px',
              color: '#cccccc',
              margin: '0'
            }}>
              Total requests: {requests.length} • Filter by status below
            </p>
          </div>
          
          {/* Status Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <label style={{
              fontSize: '14px',
              color: '#ffffff',
              fontWeight: '500'
            }}>
              Filter by status:
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: '10px 16px',
                background: '#333333',
                border: '2px solid #444444',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                outline: 'none',
                transition: 'border-color 0.2s ease'
              }}
              onFocus={(e) => e.target.style.borderColor = '#00ff88'}
              onBlur={(e) => e.target.style.borderColor = '#444444'}
            >
              <option value="">All Statuses</option>
              <option value="created">🆕 New Requests</option>
              <option value="waiting_confirmation">⏳ Pending Review</option>
              <option value="approved">✅ Approved</option>
              <option value="rejected">❌ Rejected</option>
              <option value="expired">⏰ Expired</option>
            </select>
          </div>
        </div>
        
        {requests.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#666666',
            background: '#333333',
            borderRadius: '8px',
            border: '1px solid #444444'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ffffff', marginBottom: '8px' }}>
              No Deposit Requests Found
            </div>
            <div style={{ fontSize: '14px', color: '#cccccc' }}>
              {statusFilter ? `No requests with status "${getStatusText(statusFilter)}"` : 'There are currently no deposit requests to review'}
            </div>
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            {requests.map(request => (
              <div key={request.id} style={{
                background: '#333333',
                padding: '20px',
                borderRadius: '10px',
                border: '1px solid #444444',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.target.style.borderColor = '#00ff88';
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.3)';
              }}
              onMouseOut={(e) => {
                e.target.style.borderColor = '#444444';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }}
              >
                {/* Request Header */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '16px'
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      marginBottom: '8px'
                    }}>
                      <div style={{
                        fontSize: '18px',
                        fontWeight: 'bold',
                        color: '#ffffff'
                      }}>
                        Request #{request.id}
                      </div>
                      <div style={{
                        padding: '6px 12px',
                        background: getStatusColor(request.status),
                        color: '#ffffff',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        {getStatusIcon(request.status)} {getStatusText(request.status)}
                      </div>
                    </div>
                    
                    <div style={{
                      fontSize: '15px',
                      color: '#ffffff',
                      fontWeight: '600',
                      marginBottom: '4px'
                    }}>
                      👤 User: {request.username}
                    </div>
                    
                    <div style={{
                      fontSize: '16px',
                      color: '#00ff88',
                      fontWeight: 'bold',
                      marginBottom: '4px'
                    }}>
                      💰 Base Amount: ${parseFloat(request.amount || 0).toFixed(2)}
                    </div>
                    
                    <div style={{
                      fontSize: '15px',
                      color: '#ffc107',
                      fontWeight: 'bold',
                      marginBottom: '8px'
                    }}>
                      🎁 Bonus: +${parseFloat(request.bonusAmount || 0).toFixed(2)} ({request.totalBonusPercent || 0}%)
                    </div>
                    
                    <div style={{
                      fontSize: '16px',
                      color: '#ffffff',
                      fontWeight: 'bold',
                      marginBottom: '8px',
                      background: '#2a2a2a',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      display: 'inline-block'
                    }}>
                      💵 Total: ${parseFloat(request.finalTotal || 0).toFixed(2)}
                    </div>
                    
                    <div style={{
                      fontSize: '14px',
                      color: '#cccccc',
                      marginBottom: '4px'
                    }}>
                      💳 Payment Method: {request.paymentMethod}
                    </div>
                    
                    <div style={{
                      fontSize: '13px',
                      color: '#888888',
                      wordBreak: 'break-all',
                      background: '#2a2a2a',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      marginTop: '8px'
                    }}>
                      🔗 Wallet Address: {request.address}
                    </div>
                  </div>
                </div>
                
                {/* Request Details */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '16px',
                  borderTop: '1px solid #444444'
                }}>
                  <div style={{
                    fontSize: '13px',
                    color: '#666666'
                  }}>
                    <div>📅 Created: {formatDate(request.createdAt)}</div>
                    {request.expiresAt && (
                      <div>⏰ Expires: {formatDate(request.expiresAt)}</div>
                    )}
                    {request.promoCode && (
                      <div>🎫 Promo Code: {request.promoCode}</div>
                    )}
                  </div>
                  
                  {/* Action Buttons */}
                  {(request.status === 'waiting_confirmation' || request.status === 'created') && (
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button
                        onClick={() => handleApprove(request.id)}
                        style={{
                          padding: '10px 20px',
                          background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                          border: 'none',
                          borderRadius: '8px',
                          color: '#ffffff',
                          fontSize: '14px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                        onMouseOver={(e) => {
                          e.target.style.transform = 'translateY(-2px)';
                          e.target.style.boxShadow = '0 6px 20px rgba(40, 167, 69, 0.4)';
                        }}
                        onMouseOut={(e) => {
                          e.target.style.transform = 'translateY(0)';
                          e.target.style.boxShadow = 'none';
                        }}
                      >
                        ✅ Approve Request
                      </button>
                      <button
                        onClick={() => handleReject(request.id)}
                        style={{
                          padding: '10px 20px',
                          background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
                          border: 'none',
                          borderRadius: '8px',
                          color: '#ffffff',
                          fontSize: '14px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                        onMouseOver={(e) => {
                          e.target.style.transform = 'translateY(-2px)';
                          e.target.style.boxShadow = '0 6px 20px rgba(220, 53, 69, 0.4)';
                        }}
                        onMouseOut={(e) => {
                          e.target.style.transform = 'translateY(0)';
                          e.target.style.boxShadow = 'none';
                        }}
                      >
                        ❌ Reject Request
                      </button>
                    </div>
                  )}
                  
                  {/* Status Info for non-actionable requests */}
                  {request.status !== 'created' && request.status !== 'waiting_confirmation' && (
                    <div style={{
                      padding: '10px 16px',
                      background: getStatusColor(request.status),
                      color: '#ffffff',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      {getStatusIcon(request.status)} {getStatusText(request.status)}
                    </div>
                  )}
                </div>

                {/* Admin Note */}
                {request.adminNote && (
                  <div style={{
                    marginTop: '16px',
                    padding: '12px',
                    background: '#2a2a2a',
                    borderRadius: '8px',
                    border: '1px solid #444444'
                  }}>
                    <div style={{
                      fontSize: '13px',
                      color: '#ffffff',
                      fontWeight: 'bold',
                      marginBottom: '4px'
                    }}>
                      📝 Admin Note:
                    </div>
                    <div style={{
                      fontSize: '13px',
                      color: '#cccccc',
                      lineHeight: '1.4'
                    }}>
                      {request.adminNote}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDepositPanel;
