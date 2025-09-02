import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import AdminDepositPanel from "../components/admin/AdminDepositPanel";
import AdminWithdrawalPanel from "../components/admin/AdminWithdrawalPanel";

// Default trading pairs configuration
const DEFAULT_PAIRS_CONFIG = {
  "BTCUSDT": { visible: true, payout: 91 },
  "ETHUSDT": { visible: true, payout: 85 },
  "XRPUSDT": { visible: true, payout: 80 },
  "LTCUSDT": { visible: true, payout: 80 },
  "SOLUSDT": { visible: true, payout: 80 },
  "ADAUSDT": { visible: true, payout: 80 },
  "DOGEUSDT": { visible: true, payout: 80 },
  "DOTUSDT": { visible: true, payout: 80 },
  "AVAXUSDT": { visible: true, payout: 80 },
  "LINKUSDT": { visible: true, payout: 80 }
};

export default function Admin() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [pairsConfig, setPairsConfig] = useState(DEFAULT_PAIRS_CONFIG);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [activeTab, setActiveTab] = useState("pairs"); // "pairs", "users", "deposits", or "withdrawals"
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState("");
  
  // Balance adjustment modal state
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [adjustForm, setAdjustForm] = useState({
    accountType: 'demo',
    operation: 'add',
    amount: '',
    reason: ''
  });
  const [adjustLoading, setAdjustLoading] = useState(false);
  const [adjustError, setAdjustError] = useState("");

  // Check authentication on mount
  useEffect(() => {
    // Set body styles for proper scrolling
    document.body.style.overflow = "auto";
    document.body.style.height = "auto";
    document.body.style.minHeight = "100vh";
    
    loadPairsConfig();
    
    // Cleanup function
    return () => {
      document.body.style.overflow = "";
      document.body.style.height = "";
      document.body.style.minHeight = "";
    };
  }, []);

  // Fetch users when users tab is active
  useEffect(() => {
    if (activeTab === "users") {
      fetchUsers();
    }
  }, [activeTab]);

  const fetchUsers = async () => {
    setUsersLoading(true);
    setUsersError("");
    
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:4000/api/admin/users", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error("Admin access required");
        }
        throw new Error("Failed to fetch users");
      }
      
      const responseData = await response.json();
      setUsers(responseData.users || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      setUsersError(error.message);
    } finally {
      setUsersLoading(false);
    }
  };

  // Balance adjustment functions
  const openAdjustModal = (user) => {
    setSelectedUser(user);
    setAdjustForm({
      accountType: 'demo',
      operation: 'add',
      amount: '',
      reason: ''
    });
    setAdjustError("");
    setShowAdjustModal(true);
  };

  const closeAdjustModal = () => {
    setShowAdjustModal(false);
    setSelectedUser(null);
    setAdjustForm({
      accountType: 'demo',
      operation: 'add',
      amount: '',
      reason: ''
    });
    setAdjustError("");
  };

  const handleAdjustFormChange = (field, value) => {
    setAdjustForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleBalanceAdjustment = async () => {
    if (!selectedUser || !adjustForm.amount || parseFloat(adjustForm.amount) <= 0) {
      setAdjustError("Please enter a valid amount");
      return;
    }

    setAdjustLoading(true);
    setAdjustError("");

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:4000/api/admin/users/${selectedUser.id}/balance`, {
        method: 'PATCH',
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(adjustForm)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to adjust balance");
      }

      const result = await response.json();
      
      // Update the users list with the new balance
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === selectedUser.id 
            ? {
                ...user,
                demoBalance: adjustForm.accountType === 'demo' ? result.newBalance : user.demoBalance,
                realBalance: adjustForm.accountType === 'real' ? result.newBalance : user.realBalance
              }
            : user
        )
      );

      setMessage(`Successfully adjusted ${selectedUser.username}'s ${adjustForm.accountType} balance: ${result.oldBalance} → ${result.newBalance}`);
      setMessageType("success");
      closeAdjustModal();
      
      setTimeout(() => setMessage(""), 5000);
    } catch (error) {
      console.error("Error adjusting balance:", error);
      setAdjustError(error.message);
    } finally {
      setAdjustLoading(false);
    }
  };

  const loadPairsConfig = () => {
    const savedConfig = localStorage.getItem("adminPairsConfig");
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        setPairsConfig(config);
      } catch (error) {
        console.error("Error loading pairs config:", error);
        setPairsConfig(DEFAULT_PAIRS_CONFIG);
      }
    }
  };

  const savePairsConfig = () => {
    try {
      localStorage.setItem("adminPairsConfig", JSON.stringify(pairsConfig));
      setMessage("Settings saved successfully!");
      setMessageType("success");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setMessage("Error saving settings!");
      setMessageType("error");
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const handlePairToggle = (symbol) => {
    setPairsConfig(prev => ({
      ...prev,
      [symbol]: {
        ...prev[symbol],
        visible: !prev[symbol].visible
      }
    }));
  };

  const handlePayoutChange = (symbol, newPayout) => {
    const payout = Math.max(0, Math.min(100, parseFloat(newPayout) || 0));
    setPairsConfig(prev => ({
      ...prev,
      [symbol]: {
        ...prev[symbol],
        payout: payout
      }
    }));
  };

  const handleResetToDefault = () => {
    setPairsConfig(DEFAULT_PAIRS_CONFIG);
    localStorage.removeItem("adminPairsConfig");
    setMessage("Reset to default settings!");
    setMessageType("success");
    setTimeout(() => setMessage(""), 3000);
  };

  // Admin Panel
  return (
    <div style={{
      minHeight: "100vh",
      background: "#0f0f0f",
      color: "white",
      fontFamily: "Arial, sans-serif",
      padding: "20px",
      overflowY: "auto"
    }}>
      <div style={{
        maxWidth: "1200px",
        margin: "0 auto",
        minHeight: "100vh"
      }}>
        {/* Header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "30px",
          paddingBottom: "20px",
          borderBottom: "1px solid #2a2a2a"
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "15px"
          }}>
            {/* ORLIX Logo */}
            <img 
              src="/assets/landing/logo.svg" 
              alt="ORLIX" 
              style={{
                height: "40px",
                width: "auto",
                marginRight: "15px"
              }}
            />
            <span style={{ fontSize: "32px" }}>⚙️</span>
            <div>
              <h1 style={{ margin: 0, fontSize: "28px", fontWeight: "bold" }}>
                Admin Panel
              </h1>
              <p style={{ margin: "5px 0 0 0", color: "#999", fontSize: "14px" }}>
                Manage trading pairs and platform settings
              </p>
            </div>
          </div>
          
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "15px"
          }}>
            <span style={{ color: "#00ff88", fontSize: "14px" }}>
              Welcome, {user?.username}
            </span>
            <button
              onClick={logout}
              style={{
                padding: "8px 16px",
                background: "#ff4444",
                border: "none",
                borderRadius: "6px",
                color: "white",
                fontSize: "14px",
                cursor: "pointer"
              }}
            >
              Logout
            </button>
            <a 
              href="/"
              style={{
                padding: "8px 16px",
                background: "#2a2a2a",
                border: "1px solid #444",
                borderRadius: "6px",
                color: "white",
                textDecoration: "none",
                fontSize: "14px"
              }}
            >
              View Platform
            </a>
          </div>
        </div>

        {/* Message Display */}
        {message && (
          <div style={{
            padding: "12px 16px",
            borderRadius: "8px",
            marginBottom: "20px",
            background: messageType === "success" ? "#00ff88" : "#ff4444",
            color: messageType === "success" ? "#000" : "#fff",
            fontWeight: "bold"
          }}>
            {message}
          </div>
        )}

        {/* Tab Navigation */}
        <div style={{
          display: "flex",
          gap: "10px",
          marginBottom: "30px",
          borderBottom: "1px solid #2a2a2a",
          paddingBottom: "10px"
        }}>
          <button
            onClick={() => setActiveTab("pairs")}
            style={{
              padding: "12px 24px",
              background: activeTab === "pairs" ? "#00ff88" : "#2a2a2a",
              border: "none",
              borderRadius: "8px",
              color: activeTab === "pairs" ? "#000" : "#fff",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            <span style={{ fontSize: "16px" }}>📊</span>
            Trading Pairs
          </button>
          <button
            onClick={() => setActiveTab("users")}
            style={{
              padding: "12px 24px",
              background: activeTab === "users" ? "#00ff88" : "#2a2a2a",
              border: "none",
              borderRadius: "8px",
              color: activeTab === "users" ? "#000" : "#fff",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            <span style={{ fontSize: "16px" }}>👥</span>
            Users
          </button>
          <button
            onClick={() => setActiveTab("deposits")}
            style={{
              padding: "12px 24px",
              background: activeTab === "deposits" ? "#00ff88" : "#2a2a2a",
              border: "none",
              borderRadius: "8px",
              color: activeTab === "deposits" ? "#000" : "#fff",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            <span style={{ fontSize: "16px" }}>💰</span>
            Deposit Requests
          </button>
          <button
            onClick={() => setActiveTab("withdrawals")}
            style={{
              padding: "12px 24px",
              background: activeTab === "withdrawals" ? "#00ff88" : "#2a2a2a",
              border: "none",
              borderRadius: "8px",
              color: activeTab === "withdrawals" ? "#000" : "#fff",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            <span style={{ fontSize: "16px" }}>💸</span>
            Withdrawal Requests
          </button>
        </div>

        {/* Trading Pairs Management */}
        {activeTab === "pairs" && (
        <div style={{
          background: "#1a1a1a",
          borderRadius: "12px",
          padding: "30px",
          marginBottom: "30px"
        }}>
          <h2 style={{ 
            fontSize: "24px", 
            marginBottom: "15px", 
            color: "#00ff88",
            display: "flex",
            alignItems: "center",
            gap: "10px"
          }}>
            <span style={{ fontSize: "20px" }}>📊</span>
            Trading Pairs Management
          </h2>
          <p style={{ color: "#999", fontSize: "14px", marginBottom: "30px" }}>
            Control which trading pairs are visible to users and set their payout percentages.
          </p>

          {/* Pairs Table */}
          <div style={{
            background: "#2a2a2a",
            borderRadius: "8px",
            overflow: "hidden",
            marginBottom: "30px",
            maxHeight: "400px", // NEW: Limit height for scrolling
            display: "flex",
            flexDirection: "column"
          }}>
            <div style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr 1fr 1fr",
              background: "#1a1a1a",
              padding: "15px 20px",
              fontWeight: "bold",
              fontSize: "14px",
              borderBottom: "1px solid #444",
              flexShrink: 0 // NEW: Keep header fixed
            }}>
              <div>Trading Pair</div>
              <div>Status</div>
              <div>Payout (%)</div>
              <div>Actions</div>
            </div>

            <div style={{
              overflowY: "auto", // NEW: Make content scrollable
              flex: 1
            }}>
              {Object.entries(pairsConfig).map(([symbol, config]) => (
                <div key={symbol} style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr 1fr 1fr",
                  padding: "15px 20px",
                  borderBottom: "1px solid #444",
                  alignItems: "center"
                }}>
                  <div style={{ fontWeight: "bold", fontSize: "16px" }}>
                    {symbol.replace('USDT', '/USDT')}
                  </div>
                  <div>
                    <span style={{
                      padding: "4px 8px",
                      borderRadius: "4px",
                      fontSize: "12px",
                      fontWeight: "bold",
                      background: config.visible ? "#00ff88" : "#ff4444",
                      color: config.visible ? "#000" : "#fff"
                    }}>
                      {config.visible ? "VISIBLE" : "HIDDEN"}
                    </span>
                  </div>
                  <div>
                    <input
                      type="number"
                      value={config.payout}
                      onChange={(e) => handlePayoutChange(symbol, e.target.value)}
                      style={{
                        width: "80px",
                        padding: "8px 12px",
                        background: "#1a1a1a",
                        border: "1px solid #444",
                        borderRadius: "4px",
                        color: "white",
                        fontSize: "14px",
                        textAlign: "center"
                      }}
                      min="0"
                      max="100"
                      step="0.1"
                    />
                    <span style={{ marginLeft: "8px", fontSize: "12px", color: "#666" }}>%</span>
                  </div>
                  <div>
                    <button
                      onClick={() => handlePairToggle(symbol)}
                      style={{
                        padding: "6px 12px",
                        background: config.visible ? "#ff4444" : "#00ff88",
                        border: "none",
                        borderRadius: "4px",
                        color: config.visible ? "#fff" : "#000",
                        fontSize: "12px",
                        cursor: "pointer",
                        fontWeight: "bold"
                      }}
                    >
                      {config.visible ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{
            display: "flex",
            gap: "15px",
            justifyContent: "center"
          }}>
            <button
              onClick={savePairsConfig}
              style={{
                padding: "12px 30px",
                background: "#00ff88",
                border: "none",
                borderRadius: "8px",
                color: "#000",
                fontSize: "16px",
                fontWeight: "bold",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}
            >
              <span style={{ fontSize: "16px" }}>💾</span>
              <span>Save Changes</span>
            </button>

            <button
              onClick={handleResetToDefault}
              style={{
                padding: "12px 30px",
                background: "#ff8800",
                border: "none",
                borderRadius: "8px",
                color: "#000",
                fontSize: "16px",
                fontWeight: "bold",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}
            >
              <span style={{ fontSize: "16px" }}>🔄</span>
              <span>Reset to Default</span>
            </button>
          </div>
        </div>
        )}

        {/* Users Panel */}
        {activeTab === "users" && (
        <div style={{
          background: "#1a1a1a",
          borderRadius: "12px",
          padding: "30px",
          marginBottom: "30px"
        }}>
          <h2 style={{ 
            fontSize: "24px", 
            marginBottom: "15px", 
            color: "#00ff88",
            display: "flex",
            alignItems: "center",
            gap: "10px"
          }}>
            <span style={{ fontSize: "20px" }}>👥</span>
            Users Management
          </h2>
          <p style={{ color: "#999", fontSize: "14px", marginBottom: "30px" }}>
            View all registered users and their account information.
          </p>

          {/* Loading State */}
          {usersLoading && (
            <div style={{
              textAlign: "center",
              padding: "40px",
              color: "#00ff88",
              fontSize: "16px"
            }}>
              Loading users...
            </div>
          )}

          {/* Error State */}
          {usersError && (
            <div style={{
              padding: "12px 16px",
              borderRadius: "8px",
              marginBottom: "20px",
              background: "#ff4444",
              color: "#fff",
              fontWeight: "bold"
            }}>
              Error: {usersError}
            </div>
          )}

          {/* Users Table */}
          {!usersLoading && !usersError && (
            <div style={{
              background: "#2a2a2a",
              borderRadius: "8px",
              overflow: "hidden",
              marginBottom: "30px"
            }}>
              <div style={{
                display: "grid",
                gridTemplateColumns: "80px 2fr 1fr 1fr 1fr 120px",
                background: "#1a1a1a",
                padding: "15px 20px",
                fontWeight: "bold",
                fontSize: "14px",
                borderBottom: "1px solid #444"
              }}>
                <div>ID</div>
                <div>Username</div>
                <div style={{ textAlign: "right" }}>Demo Balance</div>
                <div style={{ textAlign: "right" }}>Real Balance</div>
                <div style={{ textAlign: "center" }}>Active Trades</div>
                <div style={{ textAlign: "center" }}>Actions</div>
              </div>

              {users.length === 0 ? (
                <div style={{
                  padding: "40px 20px",
                  textAlign: "center",
                  color: "#999",
                  fontSize: "16px"
                }}>
                  No users found
                </div>
              ) : (
                (users || []).map(user => (
                  <div key={user.id} style={{
                    display: "grid",
                    gridTemplateColumns: "80px 2fr 1fr 1fr 1fr 120px",
                    padding: "15px 20px",
                    borderBottom: "1px solid #444",
                    alignItems: "center"
                  }}>
                    <div style={{ fontWeight: "bold", color: "#00ff88" }}>
                      {user.id}
                    </div>
                    <div style={{ fontWeight: "bold", fontSize: "16px" }}>
                      {user.username}
                    </div>
                    <div style={{ textAlign: "right", fontWeight: "bold", color: "#00ff88" }}>
                      ${parseFloat(user.demoBalance).toLocaleString()}
                    </div>
                    <div style={{ textAlign: "right", fontWeight: "bold", color: "#ffaa00" }}>
                      ${parseFloat(user.realBalance).toLocaleString()}
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <span style={{
                        padding: "4px 8px",
                        borderRadius: "4px",
                        fontSize: "12px",
                        fontWeight: "bold",
                        background: user.activeTradesCount > 0 ? "#00ff88" : "#666",
                        color: user.activeTradesCount > 0 ? "#000" : "#fff"
                      }}>
                        {user.activeTradesCount}
                      </span>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <button
                        onClick={() => openAdjustModal(user)}
                        style={{
                          padding: "6px 12px",
                          background: "#00ff88",
                          border: "none",
                          borderRadius: "4px",
                          color: "#000",
                          fontSize: "12px",
                          fontWeight: "bold",
                          cursor: "pointer",
                          transition: "background 0.2s"
                        }}
                        onMouseOver={(e) => e.target.style.background = "#00cc6a"}
                        onMouseOut={(e) => e.target.style.background = "#00ff88"}
                      >
                        Adjust
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Users Stats */}
          {!usersLoading && !usersError && (users || []).length > 0 && (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "20px"
            }}>
              <div style={{
                background: "#2a2a2a",
                padding: "20px",
                borderRadius: "8px",
                textAlign: "center"
              }}>
                <div style={{ fontSize: "24px", fontWeight: "bold", color: "#00ff88" }}>
                  {(users || []).length}
                </div>
                <div style={{ fontSize: "14px", color: "#999" }}>Total Users</div>
              </div>
              <div style={{
                background: "#2a2a2a",
                padding: "20px",
                borderRadius: "8px",
                textAlign: "center"
              }}>
                <div style={{ fontSize: "24px", fontWeight: "bold", color: "#ffaa00" }}>
                  {(users || []).reduce((sum, user) => sum + parseFloat(user.demoBalance), 0).toLocaleString()}
                </div>
                <div style={{ fontSize: "14px", color: "#999" }}>Total Demo Balance</div>
              </div>
              <div style={{
                background: "#2a2a2a",
                padding: "20px",
                borderRadius: "8px",
                textAlign: "center"
              }}>
                <div style={{ fontSize: "24px", fontWeight: "bold", color: "#ff4444" }}>
                  {(users || []).reduce((sum, user) => sum + parseFloat(user.realBalance), 0).toLocaleString()}
                </div>
                <div style={{ fontSize: "14px", color: "#999" }}>Total Real Balance</div>
              </div>
              <div style={{
                background: "#2a2a2a",
                padding: "20px",
                borderRadius: "8px",
                textAlign: "center"
              }}>
                <div style={{ fontSize: "24px", fontWeight: "bold", color: "#00ff88" }}>
                  {(users || []).reduce((sum, user) => sum + user.activeTradesCount, 0)}
                </div>
                <div style={{ fontSize: "14px", color: "#999" }}>Total Active Trades</div>
              </div>
            </div>
          )}
        </div>
        )}

        {/* Deposit Requests Panel */}
        {activeTab === "deposits" && (
          <AdminDepositPanel />
        )}

        {/* Withdrawal Requests Panel */}
        {activeTab === "withdrawals" && (
          <AdminWithdrawalPanel />
        )}

        {/* Info Section - Only show for pairs tab */}
        {activeTab === "pairs" && (
        <div style={{
          background: "#1a1a1a",
          borderRadius: "12px",
          padding: "30px",
          borderLeft: "4px solid #00ff88"
        }}>
          <h3 style={{ margin: "0 0 15px 0", fontSize: "18px", color: "#00ff88" }}>
            ℹ️ Important Information
          </h3>
          <ul style={{ margin: 0, paddingLeft: "20px", color: "#ccc", fontSize: "14px", lineHeight: "1.6" }}>
            <li><strong>Hide/Show:</strong> Hidden pairs won't appear in the user's trading interface</li>
            <li><strong>Payout %:</strong> Sets the profit percentage for winning trades (0-100%)</li>
            <li>Changes apply immediately to new trades</li>
            <li>Existing trades will use the rates that were active when they were placed</li>
            <li>All settings are saved locally and persist after page refresh</li>
            <li>Session expires after 24 hours for security</li>
          </ul>
        </div>
        )}

        {/* Quick Stats - Only show for pairs tab */}
        {activeTab === "pairs" && (
        <div style={{
          background: "#1a1a1a",
          borderRadius: "12px",
          padding: "30px",
          marginTop: "20px"
        }}>
          <h3 style={{ margin: "0 0 15px 0", fontSize: "18px", color: "#00ff88" }}>
            📈 Quick Stats
          </h3>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "20px"
          }}>
            <div style={{
              background: "#2a2a2a",
              padding: "20px",
              borderRadius: "8px",
              textAlign: "center"
            }}>
              <div style={{ fontSize: "24px", fontWeight: "bold", color: "#00ff88" }}>
                {Object.values(pairsConfig).filter(p => p.visible).length}
              </div>
              <div style={{ fontSize: "14px", color: "#999" }}>Visible Pairs</div>
            </div>
            <div style={{
              background: "#2a2a2a",
              padding: "20px",
              borderRadius: "8px",
              textAlign: "center"
            }}>
              <div style={{ fontSize: "24px", fontWeight: "bold", color: "#ff4444" }}>
                {Object.values(pairsConfig).filter(p => !p.visible).length}
              </div>
              <div style={{ fontSize: "14px", color: "#999" }}>Hidden Pairs</div>
            </div>
            <div style={{
              background: "#2a2a2a",
              padding: "20px",
              borderRadius: "8px",
              textAlign: "center"
            }}>
              <div style={{ fontSize: "24px", fontWeight: "bold", color: "#ffaa00" }}>
                {Object.values(pairsConfig).reduce((sum, p) => sum + p.payout, 0) / Object.keys(pairsConfig).length}
              </div>
              <div style={{ fontSize: "14px", color: "#999" }}>Avg Payout %</div>
            </div>
          </div>
        </div>
        )}

        {/* Balance Adjustment Modal */}
        {showAdjustModal && selectedUser && (
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
            zIndex: 1000
          }}>
            <div style={{
              background: "#1a1a1a",
              borderRadius: "12px",
              padding: "30px",
              maxWidth: "500px",
              width: "90%",
              border: "1px solid #444"
            }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "20px"
              }}>
                <h3 style={{ margin: 0, fontSize: "20px", color: "#00ff88" }}>
                  💰 Adjust Balance - {selectedUser.username}
                </h3>
                <button
                  onClick={closeAdjustModal}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#999",
                    fontSize: "24px",
                    cursor: "pointer",
                    padding: "0"
                  }}
                >
                  ×
                </button>
              </div>

              {/* Current Balance Display */}
              <div style={{
                background: "#2a2a2a",
                padding: "15px",
                borderRadius: "8px",
                marginBottom: "20px"
              }}>
                <div style={{ fontSize: "14px", color: "#999", marginBottom: "5px" }}>
                  Current Balances:
                </div>
                <div style={{ display: "flex", gap: "20px" }}>
                  <div>
                    <span style={{ color: "#00ff88" }}>Demo:</span> ${parseFloat(selectedUser.demoBalance).toLocaleString()}
                  </div>
                  <div>
                    <span style={{ color: "#ffaa00" }}>Real:</span> ${parseFloat(selectedUser.realBalance).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Form Fields */}
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", marginBottom: "8px", color: "#ccc" }}>
                  Account Type:
                </label>
                <select
                  value={adjustForm.accountType}
                  onChange={(e) => handleAdjustFormChange('accountType', e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px",
                    background: "#2a2a2a",
                    border: "1px solid #444",
                    borderRadius: "6px",
                    color: "#fff",
                    fontSize: "14px"
                  }}
                >
                  <option value="demo">Demo Account</option>
                  <option value="real">Real Account</option>
                </select>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", marginBottom: "8px", color: "#ccc" }}>
                  Operation:
                </label>
                <select
                  value={adjustForm.operation}
                  onChange={(e) => handleAdjustFormChange('operation', e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px",
                    background: "#2a2a2a",
                    border: "1px solid #444",
                    borderRadius: "6px",
                    color: "#fff",
                    fontSize: "14px"
                  }}
                >
                  <option value="add">Add Amount</option>
                  <option value="subtract">Subtract Amount</option>
                  <option value="set">Set to Amount</option>
                </select>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", marginBottom: "8px", color: "#ccc" }}>
                  Amount ($):
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={adjustForm.amount}
                  onChange={(e) => handleAdjustFormChange('amount', e.target.value)}
                  placeholder="Enter amount"
                  style={{
                    width: "100%",
                    padding: "10px",
                    background: "#2a2a2a",
                    border: "1px solid #444",
                    borderRadius: "6px",
                    color: "#fff",
                    fontSize: "14px"
                  }}
                />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", marginBottom: "8px", color: "#ccc" }}>
                  Reason (Optional):
                </label>
                <input
                  type="text"
                  value={adjustForm.reason}
                  onChange={(e) => handleAdjustFormChange('reason', e.target.value)}
                  placeholder="e.g., Support adjustment, bonus, etc."
                  style={{
                    width: "100%",
                    padding: "10px",
                    background: "#2a2a2a",
                    border: "1px solid #444",
                    borderRadius: "6px",
                    color: "#fff",
                    fontSize: "14px"
                  }}
                />
              </div>

              {/* Warning Message */}
              <div style={{
                background: "#ff4444",
                color: "#fff",
                padding: "12px",
                borderRadius: "6px",
                marginBottom: "20px",
                fontSize: "14px",
                fontWeight: "bold"
              }}>
                ⚠️ Warning: This action will change the user's balance and is recorded in the audit log.
              </div>

              {/* Error Display */}
              {adjustError && (
                <div style={{
                  background: "#ff4444",
                  color: "#fff",
                  padding: "12px",
                  borderRadius: "6px",
                  marginBottom: "20px",
                  fontSize: "14px"
                }}>
                  ❌ {adjustError}
                </div>
              )}

              {/* Action Buttons */}
              <div style={{
                display: "flex",
                gap: "15px",
                justifyContent: "flex-end"
              }}>
                <button
                  onClick={closeAdjustModal}
                  disabled={adjustLoading}
                  style={{
                    padding: "12px 24px",
                    background: "#666",
                    border: "none",
                    borderRadius: "6px",
                    color: "#fff",
                    fontSize: "14px",
                    cursor: adjustLoading ? "not-allowed" : "pointer",
                    opacity: adjustLoading ? 0.6 : 1
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleBalanceAdjustment}
                  disabled={adjustLoading || !adjustForm.amount || parseFloat(adjustForm.amount) <= 0}
                  style={{
                    padding: "12px 24px",
                    background: adjustLoading || !adjustForm.amount || parseFloat(adjustForm.amount) <= 0 ? "#666" : "#00ff88",
                    border: "none",
                    borderRadius: "6px",
                    color: adjustLoading || !adjustForm.amount || parseFloat(adjustForm.amount) <= 0 ? "#999" : "#000",
                    fontSize: "14px",
                    fontWeight: "bold",
                    cursor: adjustLoading || !adjustForm.amount || parseFloat(adjustForm.amount) <= 0 ? "not-allowed" : "pointer",
                    opacity: adjustLoading ? 0.6 : 1
                  }}
                >
                  {adjustLoading ? "Processing..." : "Confirm Adjustment"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
