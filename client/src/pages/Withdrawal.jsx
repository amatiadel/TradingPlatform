import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const Withdrawal = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Form state
  const [amount, setAmount] = useState('10');
  const [paymentMethod, setPaymentMethod] = useState('USDT');
  const [address, setAddress] = useState('');
  const [network, setNetwork] = useState('TRC-20');

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userBalance, setUserBalance] = useState({ demo: 0, real: 0 });
  const [withdrawalRequests, setWithdrawalRequests] = useState([]);

  // Payment methods - only USDT
  const paymentMethods = [
    { id: 'USDT', name: 'USDT', icon: '◆', networks: ['TRC-20', 'ERC-20', 'BEP-20'] }
  ];

  // Quick amount buttons
  const quickAmounts = [50, 100, 200, 500];

  // Validation
  const amountNum = parseFloat(amount);
  const isValidAmount = amountNum >= 10 && amountNum <= 50000;
  const amountError = amountNum < 10 ? 'Minimum withdrawal is $10' : amountNum > 50000 ? 'Maximum withdrawal is $50,000' : '';
  const isValidAddress = address.trim().length > 0;
  const isValidForm = isValidAmount && isValidAddress && !isLoading;

  // Load user balance and withdrawal requests
  useEffect(() => {
    if (user) {
      loadUserBalance();
      loadWithdrawalRequests();
    }
  }, [user]);

  const loadUserBalance = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/user/balance', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUserBalance({
          real: data.realBalance || 0,
          demo: data.demoBalance || 0
        });
      }
    } catch (err) {
      console.error('Failed to load user balance:', err);
    }
  };

  const loadWithdrawalRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Loading withdrawal requests...');
      const response = await fetch('/api/user/withdrawal-requests', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Withdrawal requests data:', data);
        setWithdrawalRequests(Array.isArray(data) ? data : []);
      } else {
        const errorData = await response.json();
        console.error('Failed to load withdrawal requests:', errorData);
      }
    } catch (err) {
      console.error('Failed to load withdrawal requests:', err);
    }
  };

  const createWithdrawalRequest = async (withdrawalData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/user/withdrawal-request', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(withdrawalData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create withdrawal request');
      }

      return await response.json();
    } catch (err) {
      console.error('Failed to create withdrawal request:', err);
      throw err;
    }
  };

  const handleWithdrawal = async () => {
    if (!isValidForm || isLoading || !user) return;

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const withdrawalData = {
        amount: parseFloat(amount),
        paymentMethod: paymentMethod,
        purse: address.trim(),
        network: network
      };
      
      const response = await createWithdrawalRequest(withdrawalData);
      
      setSuccess('✅ Withdrawal successful! Funds are on the way');
      
      // Reload withdrawal requests to show the new one
      await loadWithdrawalRequests();
      
      // Redirect to platform page after 2 seconds
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to create withdrawal request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }) + ' ' + date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'created':
      case 'waiting_confirmation':
        return '⏳';
      case 'approved':
      case 'processing':
        return '✅';
      case 'completed':
        return '✅';
      case 'rejected':
      case 'failed':
        return '❌';
      default:
        return '⏳';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'created':
        return 'Waiting confirmation';
      case 'waiting_confirmation':
        return 'Waiting confirmation';
      case 'approved':
        return 'Approved';
      case 'processing':
        return 'Processing';
      case 'completed':
        return 'Succeeded';
      case 'rejected':
        return 'Rejected';
      case 'failed':
        return 'Failed';
      default:
        return 'Waiting confirmation';
    }
  };

  const faqData = [
    {
      question: "How to withdraw money from the account?",
      answer: "Enter the amount you want to withdraw, select your payment method, provide your wallet address, and click Confirm. Your withdrawal request will be processed by our team."
    },
    {
      question: "How long does it take to withdraw funds?",
      answer: "Withdrawal requests are typically processed within 1-24 hours during business days. Processing times may vary depending on the payment method and network conditions."
    },
    {
      question: "What is the minimum withdrawal amount?",
      answer: "The minimum withdrawal amount is $10.00. This applies to all payment methods and helps cover transaction fees."
    },
    {
      question: "Is there any fee for depositing or withdrawing funds from the account?",
      answer: "There are no fees for deposits. Withdrawal fees depend on the payment method and network used. Fees are automatically calculated and deducted from your withdrawal amount."
    },
    {
      question: "Do I need to provide any documents to make a withdrawal?",
      answer: "For security purposes, we may require identity verification for large withdrawals or if requested by our compliance team. You will be notified if additional documentation is needed."
    }
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0f0f0f',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '20px'
      }}>
        {/* Header */}
        <div style={{ marginBottom: '30px' }}>
          {/* ORLIX Logo */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            marginBottom: '20px'
          }}>
            <img 
              src="/assets/landing/logo.svg" 
              alt="ORLIX" 
              style={{
                height: '40px',
                width: 'auto',
                marginRight: '20px'
              }}
            />
          </div>
          
          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              color: '#666666',
              textDecoration: 'none',
              marginBottom: '15px',
              fontSize: '14px'
            }}
          >
            <span style={{ marginRight: '8px' }}>←</span>
            Back to Dashboard
          </Link>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#ffffff',
            margin: '0 0 8px 0'
          }}>
            Withdrawal
          </h1>
        </div>

        {/* Main Content - Two Column Layout */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 300px',
          gap: '20px',
          marginBottom: '20px'
        }}>
          {/* Left Column - Withdrawal Form and Latest Requests */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Withdrawal Form */}
            <div style={{
              background: '#2a2a2a',
              padding: '20px',
              borderRadius: '8px',
              border: '1px solid #444444'
            }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: 'bold',
                color: '#ffffff',
                margin: '0 0 15px 0'
              }}>
                Withdrawal:
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Amount Input */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '12px',
                    color: '#cccccc',
                    marginBottom: '8px'
                  }}>
                    Amount
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0"
                      min="10"
                      max="50000"
                      step="0.01"
                      style={{
                        width: '100%',
                        padding: '12px 50px 12px 15px',
                        background: '#333333',
                        border: '1px solid #444444',
                        borderRadius: '6px',
                        color: '#ffffff',
                        fontSize: '16px',
                        outline: 'none'
                      }}
                    />
                    <div style={{
                      position: 'absolute',
                      right: '15px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#666666',
                      fontSize: '14px'
                    }}>
                      USD
                    </div>
                  </div>
                  {amountError && (
                    <div style={{
                      marginTop: '8px',
                      fontSize: '12px',
                      color: '#ff4444'
                    }}>
                      {amountError}
                    </div>
                  )}
                </div>

                {/* Quick Select Buttons */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '12px',
                    color: '#cccccc',
                    marginBottom: '12px'
                  }}>
                    Quick Select
                  </label>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '10px'
                  }}>
                    {quickAmounts.map((quickAmount) => (
                      <button
                        key={quickAmount}
                        onClick={() => setAmount(quickAmount.toString())}
                        style={{
                          padding: '10px',
                          background: '#333333',
                          border: '1px solid #444444',
                          borderRadius: '6px',
                          color: '#ffffff',
                          fontSize: '14px',
                          cursor: 'pointer',
                          outline: 'none'
                        }}
                      >
                        {quickAmount} $
                      </button>
                    ))}
                  </div>
                </div>

                {/* Payment Method - Only USDT */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '12px',
                    color: '#cccccc',
                    marginBottom: '8px'
                  }}>
                    Payment method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => {
                      setPaymentMethod(e.target.value);
                      setNetwork(paymentMethods.find(pm => pm.id === e.target.value)?.networks[0] || '');
                    }}
                    style={{
                      width: '100%',
                      padding: '12px 15px',
                      background: '#333333',
                      border: '1px solid #444444',
                      borderRadius: '6px',
                      color: '#ffffff',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  >
                    {paymentMethods.map((method) => (
                      <option key={method.id} value={method.id}>
                        {method.icon} {method.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Address Input */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '12px',
                    color: '#cccccc',
                    marginBottom: '8px'
                  }}>
                    Address
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter your wallet address"
                    style={{
                      width: '100%',
                      padding: '12px 15px',
                      background: '#333333',
                      border: '1px solid #444444',
                      borderRadius: '6px',
                      color: '#ffffff',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>

                {/* Network */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '12px',
                    color: '#cccccc',
                    marginBottom: '8px'
                  }}>
                    Network
                  </label>
                  <select
                    value={network}
                    onChange={(e) => setNetwork(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 15px',
                      background: '#333333',
                      border: '1px solid #444444',
                      borderRadius: '6px',
                      color: '#ffffff',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  >
                    {paymentMethods.find(pm => pm.id === paymentMethod)?.networks.map((net) => (
                      <option key={net} value={net}>
                        {net}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Confirm Button */}
                <div style={{
                  borderTop: '1px solid #444444',
                  paddingTop: '20px'
                }}>
                  <button
                    onClick={handleWithdrawal}
                    disabled={!isValidForm || isLoading}
                    style={{
                      width: '100%',
                      padding: '15px 30px',
                      background: '#00ff88',
                      border: 'none',
                      borderRadius: '6px',
                      color: '#000000',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      outline: 'none',
                      opacity: (!isValidForm || isLoading) ? 0.5 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    Confirm →
                  </button>
                </div>

                {/* Success/Error Messages */}
                {success && (
                  <div style={{
                    padding: '15px',
                    background: 'rgba(0, 255, 136, 0.1)',
                    border: '1px solid #00ff88',
                    borderRadius: '6px',
                    fontSize: '14px',
                    color: '#00ff88',
                    fontWeight: 'bold'
                  }}>
                    {success}
                  </div>
                )}

                {error && (
                  <div style={{
                    padding: '15px',
                    background: 'rgba(255, 68, 68, 0.1)',
                    border: '1px solid #ff4444',
                    borderRadius: '6px',
                    fontSize: '14px',
                    color: '#ff4444'
                  }}>
                    {error}
                  </div>
                )}
              </div>
            </div>

            {/* Latest Requests */}
            <div style={{
              background: '#2a2a2a',
              padding: '20px',
              borderRadius: '8px',
              border: '1px solid #444444'
            }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: 'bold',
                color: '#ffffff',
                margin: '0 0 15px 0'
              }}>
                Latest requests:
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Debug info */}
                <div style={{ fontSize: '10px', color: '#666666', marginBottom: '10px' }}>
                  Debug: {withdrawalRequests.length} requests loaded
                </div>
                
                {withdrawalRequests.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '20px',
                    color: '#666666',
                    fontSize: '12px'
                  }}>
                    <div style={{ fontSize: '16px', marginBottom: '8px' }}>⚠️</div>
                    <div>No withdrawal requests found.</div>
                    <div>You don't have any pending or completed withdrawals yet</div>
                  </div>
                ) : (
                  withdrawalRequests.slice(0, 3).map((request, index) => (
                    <div
                      key={request.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 0',
                        borderBottom: index < withdrawalRequests.slice(0, 3).length - 1 ? '1px solid #444444' : 'none'
                      }}
                    >
                      <div style={{ fontSize: '12px', color: '#ffffff' }}>
                        {request.createdAt ? formatDateTime(request.createdAt) : 'N/A'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666666' }}>
                        {getStatusIcon(request.status)} {getStatusText(request.status)}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666666' }}>
                        {request.paymentMethod} ({request.network})
                      </div>
                      <div style={{ 
                        fontSize: '12px', 
                        fontWeight: 'bold', 
                        color: request.status === 'completed' ? '#ff4444' : '#00ff88' 
                      }}>
                        -{parseFloat(request.amount).toFixed(2)} $
                      </div>
                    </div>
                  ))
                )}
                {withdrawalRequests.length > 3 && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    marginTop: '8px'
                  }}>
                    <span style={{ fontSize: '12px', color: '#666666' }}>→</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Account Information and FAQ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Account Information */}
            <div style={{
              background: '#2a2a2a',
              padding: '20px',
              borderRadius: '8px',
              border: '1px solid #444444'
            }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: 'bold',
                color: '#ffffff',
                margin: '0 0 15px 0'
              }}>
                Account:
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ fontSize: '14px', color: '#cccccc' }}>In the account:</span>
                  <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#ffffff' }}>
                    {userBalance.real.toFixed(2)} $
                  </span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ fontSize: '14px', color: '#cccccc' }}>Available for withdrawal:</span>
                  <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#ffffff' }}>
                    {userBalance.real.toFixed(2)} $
                  </span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ fontSize: '14px', color: '#cccccc' }}>Commission:</span>
                  <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#ffffff' }}>
                    0.00 $
                  </span>
                </div>
              </div>
            </div>

            {/* FAQ */}
            <div style={{
              background: '#2a2a2a',
              padding: '20px',
              borderRadius: '8px',
              border: '1px solid #444444'
            }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: 'bold',
                color: '#ffffff',
                margin: '0 0 15px 0'
              }}>
                FAQ:
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {faqData.map((item, index) => (
                  <details key={index} style={{ color: '#ffffff' }}>
                    <summary style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      padding: '10px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      outline: 'none'
                    }}>
                      <span>{item.question}</span>
                      <span style={{ color: '#666666' }}>▼</span>
                    </summary>
                    <div style={{
                      padding: '0 10px 10px 10px'
                    }}>
                      <p style={{
                        fontSize: '11px',
                        color: '#cccccc',
                        lineHeight: '1.4'
                      }}>
                        {item.answer}
                      </p>
                    </div>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Withdrawal;
