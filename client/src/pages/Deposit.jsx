import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import LatestRequests from '../components/deposit/LatestRequests';
import { useAuth } from '../AuthContext';

const Deposit = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Form state
  const [amount, setAmount] = useState('100');
  const [promoCode, setPromoCode] = useState('');
  const [promoBonusPercent, setPromoBonusPercent] = useState(0);
  const [promoMessage, setPromoMessage] = useState('');

  // UI state
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Quick amount buttons
  const quickAmounts = [150, 200, 300, 500];

  // Calculate totals
  const bonusAmount = (parseFloat(amount) || 0) * (promoBonusPercent / 100);
  const finalTotal = (parseFloat(amount) || 0) + bonusAmount;

  // Validation
  const amountNum = parseFloat(amount);
  const isValidAmount = amountNum >= 10 && amountNum <= 50000;
  const amountError = amountNum < 10 ? 'Minimum deposit is $10' : amountNum > 50000 ? 'Maximum deposit is $50,000' : '';
  const isValidForm = isValidAmount && !isLoading;

  // Real API functions
  const validatePromoCode = async (code) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/promo-codes/${code.trim()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { success: false, message: errorData.error || 'Invalid promo code' };
      }

      const data = await response.json();
      return { 
        success: true, 
        message: `Promo code applied! +${data.bonusPercent}% bonus`, 
        percent: data.bonusPercent 
      };
    } catch (err) {
      console.error('Failed to validate promo code:', err);
      return { success: false, message: 'Failed to validate promo code' };
    }
  };

  const createDepositRequest = async (depositData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/user/deposit-request', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(depositData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create deposit request');
      }

      return await response.json();
    } catch (err) {
      console.error('Failed to create deposit request:', err);
      throw err;
    }
  };

  const handleValidatePromoCode = useCallback(async () => {
    if (!promoCode.trim()) {
      setError('Please enter a promo code');
      setSuccess('');
      setPromoBonusPercent(0);
      return;
    }

    setIsValidatingPromo(true);
    setError('');
    setSuccess('');
    setPromoBonusPercent(0);

    try {
      const result = await validatePromoCode(promoCode);
      if (result.success) {
        setSuccess(result.message);
        setPromoBonusPercent(result.percent);
        setPromoMessage(result.message);
      } else {
        setError(result.message);
        setPromoBonusPercent(0);
        setPromoMessage('');
      }
    } catch (err) {
      setError('Failed to validate promo code. Please try again.');
      setPromoBonusPercent(0);
      setPromoMessage('');
    } finally {
      setIsValidatingPromo(false);
    }
  }, [promoCode]);

  const handleDeposit = async () => {
    if (!isValidForm || isLoading || !user) return;

    setIsLoading(true);
    setError('');

    try {
      const depositData = {
        amount: parseFloat(amount),
        selectedBonusPercent: 0, // Default bonus
        promoCode: promoCode || null,
        paymentMethod: 'USDT-TRC20'
      };
      
      const response = await createDepositRequest(depositData);
      
      navigate(`/deposit/confirm?reqId=${response.id}`);
    } catch (err) {
      setError(err.message || 'Failed to create deposit request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const faqData = [
    {
      question: "What is USDT (TRC-20)?",
      answer: "USDT (TRC-20) is a stablecoin that runs on the TRON blockchain. It maintains a 1:1 ratio with the US Dollar and is widely used for trading."
    },
    {
      question: "How long does a deposit take?",
      answer: "Deposits are typically processed within 1-2 hours during business hours. Network confirmations may take additional time."
    },
    {
      question: "What if I send the wrong amount?",
      answer: "If you send a different amount than specified, your deposit may be delayed for manual review. Always send the exact amount."
    },
    {
      question: "Can I cancel a deposit?",
      answer: "Once a deposit request is created, it cannot be cancelled. However, you can let it expire if you haven't sent the payment yet."
    },
    {
      question: "Are there any fees?",
      answer: "No, there are no fees for deposits. You will receive the full amount you send, plus any applicable bonuses."
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
            Deposit Funds
          </h1>
        </div>

        {/* Main Content - Two Column Layout */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 300px',
          gap: '20px',
          marginBottom: '20px' // Added margin for Latest Requests below
        }}>
          {/* Left Column - Payment Data */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Chosen Payment Method */}
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
                Chosen payment method:
              </h3>
              <div style={{
                background: '#333333',
                padding: '15px',
                borderRadius: '6px',
                border: '2px solid #00ff88'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      background: '#00ff88',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      color: '#000000'
                    }}>
                      T
                    </div>
                    <div>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: 'bold',
                        color: '#ffffff'
                      }}>
                        USDT (TRC-20)
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: '#666666'
                      }}>
                        Min amount: $10.00
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: '#666666'
                      }}>
                        Max amount: $50,000.00
                      </div>
                    </div>
                  </div>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: '#00ff88'
                  }}>
                    ✓ Selected
                  </div>
                </div>
              </div>
            </div>

            {/* Amount Input */}
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
                The amount
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
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
              </div>
            </div>

            {/* Promo Code */}
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
                margin: '0 0 15px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>🎁</span>
                I have a promo code
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="Promo code"
                    style={{
                      flex: '1',
                      padding: '12px 15px',
                      background: '#333333',
                      border: '1px solid #444444',
                      borderRadius: '6px',
                      color: '#ffffff',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                  <button
                    onClick={handleValidatePromoCode}
                    disabled={isValidatingPromo || !promoCode.trim()}
                    style={{
                      padding: '12px 20px',
                      background: '#00ff88',
                      border: 'none',
                      borderRadius: '6px',
                      color: '#000000',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      outline: 'none',
                      opacity: (isValidatingPromo || !promoCode.trim()) ? 0.5 : 1
                    }}
                  >
                    Apply promo code ›
                  </button>
                </div>

                {error && (
                  <div style={{
                    padding: '12px',
                    background: 'rgba(255, 68, 68, 0.1)',
                    border: '1px solid #ff4444',
                    borderRadius: '6px',
                    fontSize: '12px',
                    color: '#ff4444'
                  }}>
                    {error}
                  </div>
                )}

                {success && (
                  <div style={{
                    padding: '15px',
                    background: 'rgba(0, 255, 136, 0.1)',
                    border: '1px solid #00ff88',
                    borderRadius: '6px'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}>
                      <div style={{
                        fontSize: '20px',
                        color: '#00ff88'
                      }}>
                        ✓
                      </div>
                      <div style={{
                        fontSize: '14px',
                        color: '#00ff88',
                        fontWeight: 'bold'
                      }}>
                        {success}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Deposit CTA */}
            <div style={{
              background: '#2a2a2a',
              padding: '20px',
              borderRadius: '8px',
              border: '1px solid #444444'
            }}>
              <div style={{
                borderTop: '1px solid #444444',
                paddingTop: '20px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '15px'
                }}>
                  <button
                    onClick={handleDeposit}
                    disabled={!isValidForm || isLoading}
                    style={{
                      padding: '15px 30px',
                      background: '#00ff88',
                      border: 'none',
                      borderRadius: '6px',
                      color: '#000000',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      outline: 'none',
                      opacity: (!isValidForm || isLoading) ? 0.5 : 1
                    }}
                  >
                    Deposit ›
                  </button>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      fontSize: '12px',
                      color: '#666666'
                    }}>
                      You'll get a {promoBonusPercent}% bonus:
                    </div>
                    <div style={{
                      fontSize: '24px',
                      fontWeight: 'bold',
                      color: '#00ff88'
                    }}>
                      {finalTotal.toFixed(0)} $
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Bonus & FAQ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Bonus Selection */}
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
                Available Bonuses:
              </h3>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                <div style={{
                  padding: '15px',
                  background: '#333333',
                  border: '1px solid #444444',
                  borderRadius: '6px',
                  color: '#cccccc',
                  cursor: 'pointer'
                }}
                onClick={() => {
                  setPromoCode('DEPOSIT20');
                  handleValidatePromoCode();
                }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '8px'
                  }}>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: 'bold'
                    }}>
                      20% bonus
                    </div>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: 'bold'
                    }}>
                      DEPOSIT20
                    </div>
                  </div>
                  <div style={{
                    fontSize: '11px',
                    opacity: 0.7
                  }}>
                    Use promo code DEPOSIT20 for 20% bonus
                  </div>
                </div>
                <div style={{
                  padding: '15px',
                  background: '#333333',
                  border: '1px solid #444444',
                  borderRadius: '6px',
                  color: '#cccccc',
                  cursor: 'pointer'
                }}
                onClick={() => {
                  setPromoCode('DEPOSIT50');
                  handleValidatePromoCode();
                }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '8px'
                  }}>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: 'bold'
                    }}>
                      50% bonus
                    </div>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: 'bold'
                    }}>
                      DEPOSIT50
                    </div>
                  </div>
                  <div style={{
                    fontSize: '11px',
                    opacity: 0.7
                  }}>
                    Use promo code DEPOSIT50 for 50% bonus
                  </div>
                </div>
                <div style={{
                  padding: '15px',
                  background: '#333333',
                  border: '1px solid #444444',
                  borderRadius: '6px',
                  color: '#cccccc',
                  cursor: 'pointer'
                }}
                onClick={() => {
                  setPromoCode('DEPOSIT70');
                  handleValidatePromoCode();
                }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '8px'
                  }}>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: 'bold'
                    }}>
                      70% bonus
                    </div>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: 'bold'
                    }}>
                      DEPOSIT70
                    </div>
                  </div>
                  <div style={{
                    fontSize: '11px',
                    opacity: 0.7
                  }}>
                    Use promo code DEPOSIT70 for 70% bonus
                  </div>
                </div>
                <div style={{
                  padding: '15px',
                  background: '#333333',
                  border: '1px solid #444444',
                  borderRadius: '6px',
                  color: '#cccccc',
                  cursor: 'pointer'
                }}
                onClick={() => {
                  setPromoCode('DEPOSIT100');
                  handleValidatePromoCode();
                }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '8px'
                  }}>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: 'bold'
                    }}>
                      100% bonus
                    </div>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: 'bold'
                    }}>
                      DEPOSIT100
                    </div>
                  </div>
                  <div style={{
                    fontSize: '11px',
                    opacity: 0.7
                  }}>
                    Use promo code DEPOSIT100 for 100% bonus
                  </div>
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

        {/* Latest Requests - Now under main content */}
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
      </div>
    </div>
  );
};

export default Deposit;
