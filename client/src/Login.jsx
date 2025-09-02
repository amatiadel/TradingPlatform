import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, error } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    const result = await login(username, password);
    setIsLoading(false);
    
    if (!result.success) {
      // Error is handled by the auth context
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#000000',
      position: 'relative',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Background SVG */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 1
      }}>
        <img 
          src="/assets/landing/bacground.svg" 
          alt="Background" 
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: 0.3
          }}
        />
      </div>

      {/* Logo in top left */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        zIndex: 10,
        cursor: 'pointer'
      }}>
        <h1 
          onClick={() => navigate('/')}
          style={{ 
            color: 'white', 
            margin: 0,
            fontSize: '42px',
            fontWeight: '700',
            cursor: 'pointer'
          }}
        >
          ORLIX
        </h1>
      </div>

      {/* Centered form content */}
      <div style={{
        position: 'relative',
        zIndex: 5,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '20px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h2 style={{ 
            color: 'white', 
            margin: '0 0 10px 0',
            fontSize: '28px',
            fontWeight: 'bold'
          }}>
            Log In
          </h2>
        </div>

        {error && (
          <div style={{
            background: '#ff4444',
            color: 'white',
            padding: '12px',
            borderRadius: '6px',
            marginBottom: '20px',
            fontSize: '14px',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: '400px' }}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              color: 'white',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: 'bold'
            }}>
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '6px',
                color: 'white',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
              placeholder="Enter your username"
              required
            />
          </div>

          <div style={{ marginBottom: '30px' }}>
            <label style={{
              display: 'block',
              color: 'white',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: 'bold'
            }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '6px',
                color: 'white',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
              placeholder="Enter your password"
              required
            />
          </div>

                     <button
             type="submit"
             disabled={isLoading}
             style={{
               width: '100%',
               padding: '14px',
               background: isLoading ? '#666' : 'linear-gradient(135deg, #0066ff 0%, #00ff88 100%)',
               border: 'none',
               borderRadius: '6px',
               color: isLoading ? '#999' : '#000',
               fontSize: '16px',
               fontWeight: 'bold',
               cursor: isLoading ? 'not-allowed' : 'pointer',
               marginBottom: '20px'
             }}
           >
             {isLoading ? 'Signing In...' : 'Sign In'}
           </button>
        </form>

        <div style={{ textAlign: 'center', width: '100%', maxWidth: '400px' }}>
          <p style={{ color: 'white', margin: '0 0 10px 0', fontSize: '14px' }}>
            Don't have an account?
          </p>
          <button
            onClick={() => navigate('/signup')}
            style={{
              background: 'none',
              border: 'none',
              color: '#00ff88',
              fontSize: '14px',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Create an account
          </button>
          
        </div>


      </div>
    </div>
  );
};

export default Login;

