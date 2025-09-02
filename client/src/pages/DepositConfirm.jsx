import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import LatestRequests from '../components/deposit/LatestRequests';
import { useAuth } from '../AuthContext';
import io from 'socket.io-client';

const DepositConfirm = () => {
  const [searchParams] = useSearchParams();
  const reqId = searchParams.get('reqId');
  const { user } = useAuth();
  const navigate = useNavigate();

  // State
  const [depositData, setDepositData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMarkingPaid, setIsMarkingPaid] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [timeLeft, setTimeLeft] = useState(null);
  const [showCopiedToast, setShowCopiedToast] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [isRejected, setIsRejected] = useState(false);
  const [socket, setSocket] = useState(null);

  // Real API functions
  const getDepositRequest = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/user/deposit-request/${id}`, {
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
      console.error('Failed to fetch deposit request:', err);
      throw err;
    }
  };

  const markAsPaid = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/user/deposit-request/${id}/mark-paid`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to mark as paid');
      }

      return await response.json();
    } catch (err) {
      console.error('Failed to mark deposit as paid:', err);
      throw err;
    }
  };

  // Socket.IO setup
  useEffect(() => {
    if (!user) return;

    console.log('🔌 Setting up Socket.IO connection for user:', user.id);
    const newSocket = io('http://localhost:4000');
    setSocket(newSocket);

    // Connection events
    newSocket.on('connect', () => {
      console.log('✅ Socket.IO connected');
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Socket.IO disconnected');
    });

    newSocket.on('error', (error) => {
      console.error('❌ Socket.IO error:', error);
    });

    newSocket.on('authenticated', (data) => {
      console.log('✅ Socket.IO authenticated:', data);
    });

    newSocket.on('authentication_error', (error) => {
      console.error('❌ Socket.IO authentication failed:', error);
    });

    // Authenticate with the server
    newSocket.emit('authenticate', localStorage.getItem('token'));
    newSocket.emit('join_user_room', { userId: user.id });

    // Listen for deposit approval
    newSocket.on('user:deposit:approved', (data) => {
      console.log('✅ Deposit approved via Socket.IO:', data);
      setIsApproved(true);
      setSuccess('✅ Deposit successful! You can now start trading.');
      
      // Redirect to trading page immediately
      setTimeout(() => {
        navigate('/');
      }, 2000);
    });

    // Listen for deposit rejection
    newSocket.on('user:deposit:rejected', (data) => {
      console.log('❌ Deposit rejected via Socket.IO:', data);
      setIsRejected(true);
      setError(`❌ Deposit rejected: ${data.adminNote || 'No reason provided'}`);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [user, navigate]);

  // Load deposit data
  useEffect(() => {
    if (!reqId || !user) {
      setError('No deposit request ID provided or user not logged in');
      setIsLoading(false);
      return;
    }

    const loadDepositData = async () => {
      try {
        const data = await getDepositRequest(reqId);
        setDepositData(data);
        
        // Calculate initial time left
        const expiresAt = new Date(data.expiresAt);
        const now = new Date();
        const diff = expiresAt - now;
        setTimeLeft(Math.max(0, diff));
      } catch (err) {
        setError('Failed to load deposit request: ' + err.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadDepositData();
  }, [reqId, user]);

  // Countdown timer
  useEffect(() => {
    if (!depositData || !depositData.expiresAt) return;

    const timer = setInterval(() => {
      const expiresAt = new Date(depositData.expiresAt);
      const now = new Date();
      const diff = expiresAt - now;

      if (diff <= 0) {
        setTimeLeft(0);
        // Update status to expired
        if (depositData.status !== 'expired') {
          setDepositData(prev => ({ ...prev, status: 'expired' }));
        }
        clearInterval(timer);
      } else {
        setTimeLeft(diff);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [depositData]);

  // Format countdown
  const formatTimeLeft = (ms) => {
    if (ms <= 0) return '00:00:00';

    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Copy address to clipboard
  const copyAddress = async () => {
    if (!depositData?.address) return;

    try {
      await navigator.clipboard.writeText(depositData.address);
      setShowCopiedToast(true);
      setTimeout(() => setShowCopiedToast(false), 2000);
    } catch (err) {
      console.error('Failed to copy address:', err);
    }
  };

  // Handle mark as paid
  const handleMarkAsPaid = async () => {
    if (!reqId || isMarkingPaid) return;

    setIsMarkingPaid(true);
    setError('');
    setSuccess('');

    try {
      const result = await markAsPaid(reqId);
      // Don't show success message here - only show "waiting for confirmation"
      setDepositData(prev => ({ ...prev, status: result.status }));
    } catch (err) {
      setError(err.message || 'Failed to mark as paid. Please try again.');
    } finally {
      setIsMarkingPaid(false);
    }
  };

  // Handle cancel deposit
  const handleCancelDeposit = () => {
    if (confirm('Are you sure you want to cancel this deposit?')) {
      // Update global state to mark as cancelled
      if (user && reqId) {
        // This part of the logic needs to be updated to use the real API
        // For now, we'll just navigate away
        navigate('/deposit');
      }
    }
  };

  // Status checks
  const isExpired = timeLeft <= 0 || depositData?.status === 'expired';
  const isWaitingConfirmation = depositData?.status === 'waiting_confirmation';
  const isCancelled = depositData?.status === 'cancelled';
  const hasMarkedAsPaid = isWaitingConfirmation || isMarkingPaid;

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0f0f0f',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid #2a2a2a',
            borderTop: '4px solid #00ff88',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p style={{ color: '#666666' }}>Loading deposit request...</p>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  if (error && !depositData) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0f0f0f',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: '24px',
            marginBottom: '16px',
            color: '#ff4444'
          }}>
            ⚠️
          </div>
          <h2 style={{
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#ffffff',
            margin: '0 0 8px 0'
          }}>
            Error
          </h2>
          <p style={{
            color: '#666666',
            margin: '0 0 16px 0'
          }}>
            {error}
          </p>
          <Link
            to="/deposit"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '8px 16px',
              background: '#00ff88',
              color: '#000000',
              textDecoration: 'none',
              borderRadius: '4px',
              fontWeight: 'bold',
              fontSize: '14px'
            }}
          >
            ← Back to Deposit
          </Link>
        </div>
      </div>
    );
  }

  if (!depositData) {
    return null;
  }

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
            to="/deposit"
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
            Back to Deposit
          </Link>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#ffffff',
            margin: '0'
          }}>
                               Deposit ${depositData.amount} via {depositData.paymentMethod}
          </h1>
        </div>

                 {/* Main Content - Single Column Layout */}
         <div style={{ marginBottom: '20px' }}>
           <div style={{
             background: '#2a2a2a',
             padding: '20px',
             borderRadius: '8px',
             border: '1px solid #444444'
           }}>
             
             {/* Show success message and hide everything else when approved */}
             {isApproved && (
               <div style={{
                 background: 'rgba(0, 255, 136, 0.1)',
                 border: '1px solid #00ff88',
                 borderRadius: '6px',
                 padding: '40px',
                 textAlign: 'center'
               }}>
                 <div style={{
                   display: 'flex',
                   flexDirection: 'column',
                   alignItems: 'center',
                   gap: '20px',
                   color: '#00ff88'
                 }}>
                   <div style={{
                     fontSize: '48px'
                   }}>
                     ✅
                   </div>
                   <div>
                     <strong style={{ fontSize: '24px' }}>Deposit Successful!</strong>
                     <p style={{
                       fontSize: '16px',
                       margin: '8px 0 0 0',
                       opacity: 0.8
                     }}>
                       You can now start trading. Redirecting to trading page...
                     </p>
                   </div>
                 </div>
               </div>
             )}

                          {/* Show deposit details only when not approved */}
             {!isApproved && (
               <>
                 {/* Payment Instructions */}
                 <div style={{ marginBottom: '24px' }}>
                   <p style={{
                     fontSize: '16px',
                     color: '#ffffff',
                     margin: '0'
                   }}>
                                           To complete the payment transfer <strong style={{ color: '#ffffff' }}>${depositData.amount} USD</strong> to address
                   </p>
                 </div>

                 {/* Amount Summary */}
                 <div style={{
                   background: '#333333',
                   padding: '15px',
                   borderRadius: '6px',
                   marginBottom: '24px',
                   border: '1px solid #444444'
                 }}>
                   <div style={{
                     display: 'flex',
                     justifyContent: 'space-between',
                     alignItems: 'center'
                   }}>
                     <div>
                       <div style={{
                         fontSize: '14px',
                         color: '#666666',
                         marginBottom: '4px'
                       }}>
                         Deposit Amount
                       </div>
                       <div style={{
                         fontSize: '18px',
                         fontWeight: 'bold',
                         color: '#ffffff'
                       }}>
                         ${depositData.amount} USD
                       </div>
                     </div>
                     <div style={{
                       fontSize: '24px',
                       color: '#666666'
                     }}>
                       +
                     </div>
                     <div>
                       <div style={{
                         fontSize: '14px',
                         color: '#666666',
                         marginBottom: '4px'
                       }}>
                         Bonus Amount
                       </div>
                       <div style={{
                         fontSize: '18px',
                         fontWeight: 'bold',
                         color: '#00ff88'
                       }}>
                         ${depositData.bonusAmount} USD
                       </div>
                     </div>
                     <div style={{
                       fontSize: '24px',
                       color: '#666666'
                     }}>
                       =
                     </div>
                     <div>
                       <div style={{
                         fontSize: '14px',
                         color: '#666666',
                         marginBottom: '4px'
                       }}>
                         Total You'll Receive
                       </div>
                       <div style={{
                         fontSize: '20px',
                         fontWeight: 'bold',
                         color: '#00ff88'
                       }}>
                         ${depositData.finalTotal} USD
                       </div>
                     </div>
                   </div>
                 </div>

                 {/* Wallet Address */}
                 <div style={{ marginBottom: '24px' }}>
                   <div style={{
                     background: '#333333',
                     padding: '20px',
                     borderRadius: '6px',
                     border: '1px solid #444444'
                   }}>
                     <div style={{
                       fontSize: '12px',
                       color: '#666666',
                       marginBottom: '8px',
                       fontWeight: 'bold'
                     }}>
                       Wallet Address
                     </div>
                     <div style={{
                       fontFamily: 'monospace',
                       fontSize: '16px',
                       wordBreak: 'break-all',
                       color: '#ffffff',
                       background: '#1a1a1a',
                       padding: '12px',
                       borderRadius: '6px',
                       border: '1px solid #444444'
                     }}>
                       {depositData.address || 'TZJWtDfDxcBbfh6n4P7QLnJRHxK76w4GTW'}
                     </div>
                   </div>
                 </div>

                 {/* Copy Toast */}
                 {showCopiedToast && (
                   <div style={{
                     position: 'fixed',
                     top: '16px',
                     right: '16px',
                     padding: '8px 16px',
                     background: '#00ff88',
                     color: '#000000',
                     borderRadius: '6px',
                     fontSize: '14px',
                     fontWeight: 'bold',
                     zIndex: 1000,
                     boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                   }}>
                     <div style={{
                       display: 'flex',
                       alignItems: 'center',
                       gap: '8px'
                     }}>
                       <span>✓</span>
                       <span>Address copied to clipboard</span>
                     </div>
                   </div>
                 )}

                 {/* Info Box */}
                 <div style={{
                   background: 'rgba(59, 130, 246, 0.1)',
                   border: '1px solid #3b82f6',
                   borderRadius: '6px',
                   padding: '16px',
                   marginBottom: '24px'
                 }}>
                   <div style={{
                     display: 'flex',
                     alignItems: 'flex-start',
                     gap: '12px'
                   }}>
                     <div style={{
                       color: '#3b82f6',
                       fontSize: '18px',
                       marginTop: '2px'
                     }}>
                       ℹ️
                     </div>
                     <div style={{
                       fontSize: '12px',
                       color: '#93c5fd'
                     }}>
                                                <strong>Important:</strong> Make sure to send exactly <strong>${depositData.amount} USD</strong>.
                       Any difference in amount may delay your deposit processing.
                     </div>
                   </div>
                 </div>

                 {/* Countdown Timer */}
                 <div style={{ marginBottom: '24px' }}>
                   <div style={{ textAlign: 'center' }}>
                     <div style={{
                       fontSize: '48px',
                       fontFamily: 'monospace',
                       fontWeight: 'bold',
                       color: isExpired ? '#ff4444' : '#00ff88',
                       marginBottom: '12px'
                     }}>
                       {formatTimeLeft(timeLeft)}
                     </div>
                     <div style={{
                       fontSize: '16px',
                       color: '#666666'
                     }}>
                       {isExpired ? 'Deposit request has expired' : 'Complete payment before time expires'}
                     </div>
                   </div>
                 </div>

                 {/* Action Buttons */}
                 <div style={{
                   display: 'flex',
                   gap: '16px',
                   marginBottom: '16px'
                 }}>
                   <button
                     onClick={copyAddress}
                     style={{
                       flex: '1',
                       padding: '16px',
                       background: '#333333',
                       border: '1px solid #444444',
                       borderRadius: '6px',
                       color: '#ffffff',
                       fontSize: '16px',
                       fontWeight: 'bold',
                       cursor: 'pointer',
                       outline: 'none'
                     }}
                   >
                     Copy Address
                   </button>
                   
                   {/* Show "I've Paid" button only if not waiting for confirmation */}
                   {!hasMarkedAsPaid && !isExpired && !isCancelled && !isApproved && !isRejected && (
                     <button
                       onClick={handleMarkAsPaid}
                       disabled={isMarkingPaid}
                       style={{
                         flex: '1',
                         padding: '16px',
                         background: '#00ff88',
                         border: 'none',
                         borderRadius: '6px',
                         color: '#000000',
                         fontSize: '16px',
                         fontWeight: 'bold',
                         cursor: 'pointer',
                         outline: 'none',
                         opacity: isMarkingPaid ? 0.5 : 1
                       }}
                     >
                       {isMarkingPaid ? (
                         <div style={{
                           display: 'flex',
                           alignItems: 'center',
                           justifyContent: 'center',
                           gap: '8px'
                         }}>
                           <div style={{
                             width: '20px',
                             height: '20px',
                             border: '2px solid #000000',
                             borderTop: '2px solid transparent',
                             borderRadius: '50%',
                             animation: 'spin 1s linear infinite'
                           }}></div>
                           <span>Processing...</span>
                         </div>
                       ) : (
                         "I've Paid"
                       )}
                     </button>
                   )}
                 </div>

                 {/* Cancel Button */}
                 {!isExpired && !isCancelled && !isApproved && !isRejected && (
                   <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                     <button
                       onClick={handleCancelDeposit}
                       style={{
                         padding: '12px 24px',
                         background: 'transparent',
                         border: '1px solid #ff4444',
                         borderRadius: '6px',
                         color: '#ff4444',
                         fontSize: '14px',
                         fontWeight: 'bold',
                         cursor: 'pointer',
                         outline: 'none',
                         transition: 'background-color 0.2s, color 0.2s',
                       }}
                       onMouseEnter={(e) => { e.target.style.backgroundColor = '#ff4444'; e.target.style.color = '#ffffff'; }}
                       onMouseLeave={(e) => { e.target.style.backgroundColor = 'transparent'; e.target.style.color = '#ff4444'; }}
                     >
                       Cancel Deposit
                     </button>
                   </div>
                 )}

                 {/* Status Messages */}
                 {isWaitingConfirmation && (
                   <div style={{
                     background: 'rgba(255, 170, 0, 0.1)',
                     border: '1px solid #ffaa00',
                     borderRadius: '6px',
                     padding: '24px'
                   }}>
                     <div style={{
                       display: 'flex',
                       alignItems: 'center',
                       gap: '16px'
                     }}>
                       <div style={{
                         width: '32px',
                         height: '32px',
                         border: '2px solid #ffaa00',
                         borderTop: '2px solid transparent',
                         borderRadius: '50%',
                         animation: 'spin 1s linear infinite'
                       }}></div>
                       <div style={{ color: '#ffaa00' }}>
                         <strong style={{ fontSize: '18px' }}>Waiting for Confirmation...</strong>
                         <p style={{
                           fontSize: '12px',
                           margin: '4px 0 0 0',
                           opacity: 0.8
                         }}>
                           Your payment has been received and is being verified by our team.
                         </p>
                       </div>
                     </div>
                   </div>
                 )}

                 {isCancelled && (
                   <div style={{
                     background: 'rgba(255, 68, 68, 0.1)',
                     border: '1px solid #ff4444',
                     borderRadius: '6px',
                     padding: '24px'
                   }}>
                     <div style={{
                       display: 'flex',
                       alignItems: 'center',
                       gap: '16px'
                     }}>
                       <div style={{
                         fontSize: '24px',
                         color: '#ff4444'
                       }}>
                         🚫
                       </div>
                       <div style={{ color: '#ff4444' }}>
                         <strong style={{ fontSize: '18px' }}>Deposit Cancelled</strong>
                         <p style={{
                           fontSize: '12px',
                           margin: '4px 0 0 0',
                           opacity: 0.8
                         }}>
                           This deposit has been cancelled. You can create a new deposit.
                         </p>
                       </div>
                     </div>
                   </div>
                 )}

                 {error && (
                   <div style={{
                     background: 'rgba(255, 68, 68, 0.1)',
                     border: '1px solid #ff4444',
                     borderRadius: '6px',
                     padding: '24px',
                     textAlign: 'center'
                   }}>
                     <div style={{
                       display: 'flex',
                       alignItems: 'center',
                       justifyContent: 'center',
                       gap: '16px',
                       color: '#ff4444'
                     }}>
                       <div style={{
                         fontSize: '24px'
                       }}>
                         ❌
                       </div>
                       <div>
                         <strong style={{ fontSize: '18px' }}>Deposit Rejected</strong>
                         <p style={{
                           fontSize: '14px',
                           margin: '4px 0 0 0',
                           opacity: 0.8
                         }}>
                           {error.replace('❌ Deposit rejected: ', '')}
                         </p>
                       </div>
                     </div>
                   </div>
                 )}
               </>
             )}
           </div>
         </div>

                 {/* Latest Requests - Now under main content */}
         {!isApproved && (
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
               Latest Requests
             </h3>
             <LatestRequests />
           </div>
         )}
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default DepositConfirm;
