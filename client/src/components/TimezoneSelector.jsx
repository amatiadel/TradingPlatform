import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { 
  generateTimezoneOptions, 
  formatTimezoneOffset, 
  DEFAULT_TIMEZONE_OFFSET,
  TIMEZONE_STORAGE_KEY 
} from '../utils/timezone';

const TimezoneSelector = ({ onTimezoneChange }) => {
  const { user } = useAuth();
  const [selectedTimezone, setSelectedTimezone] = useState(DEFAULT_TIMEZONE_OFFSET);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const timezoneOptions = generateTimezoneOptions();

  // Load timezone preference on component mount
  useEffect(() => {
    loadTimezonePreference();
  }, [user]);

  const loadTimezonePreference = async () => {
    try {
      if (user) {
        // For authenticated users, try to load from API first
        const response = await fetch('http://localhost:4000/api/user/settings', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          const userTimezone = data.timezoneOffsetMinutes || DEFAULT_TIMEZONE_OFFSET;
          setSelectedTimezone(userTimezone);
          onTimezoneChange?.(userTimezone);
          return;
        }
      }
      
      // Fallback to localStorage for guests or if API fails
      const storedTimezone = localStorage.getItem(TIMEZONE_STORAGE_KEY);
      if (storedTimezone) {
        const timezone = parseInt(storedTimezone, 10);
        setSelectedTimezone(timezone);
        onTimezoneChange?.(timezone);
      } else {
        // Use default
        setSelectedTimezone(DEFAULT_TIMEZONE_OFFSET);
        onTimezoneChange?.(DEFAULT_TIMEZONE_OFFSET);
      }
    } catch (error) {
      console.error('Error loading timezone preference:', error);
      // Use default on error
      setSelectedTimezone(DEFAULT_TIMEZONE_OFFSET);
      onTimezoneChange?.(DEFAULT_TIMEZONE_OFFSET);
    }
  };

  const handleTimezoneChange = async (newTimezone) => {
    setSelectedTimezone(newTimezone);
    setIsOpen(false);
    onTimezoneChange?.(newTimezone);
    
    // Save preference
    try {
      setLoading(true);
      
      if (user) {
        // Save to API for authenticated users
        const response = await fetch('http://localhost:4000/api/user/settings/timezone', {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ timezoneOffsetMinutes: newTimezone })
        });
        
        if (!response.ok) {
          console.error('Failed to save timezone to API');
        }
      }
      
      // Always save to localStorage as backup
      localStorage.setItem(TIMEZONE_STORAGE_KEY, newTimezone.toString());
      
    } catch (error) {
      console.error('Error saving timezone preference:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedOption = timezoneOptions.find(option => option.value === selectedTimezone);

  return (
    <div className="timezone-selector" style={{ position: 'relative' }}>
      <div 
        className="timezone-dropdown"
        style={{
          position: 'relative',
          display: 'inline-block',
          width: '100%'
        }}
      >
        <button
          type="button"
          aria-label="Timezone selector"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          onClick={() => setIsOpen(!isOpen)}
          disabled={loading}
          style={{
            width: '100%',
            padding: '4px 8px',
            background: 'transparent',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '18px',
            color: '#ffffff',
            fontSize: '12px',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            transition: 'all 0.3s ease'
          }}
          onMouseOver={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.1)';
            e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
          }}
          onMouseOut={(e) => {
            e.target.style.background = 'transparent';
            e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
          }}
          onBlur={() => {
            // Delay closing to allow clicking on options
            setTimeout(() => setIsOpen(false), 150);
          }}
        >
          <span>{selectedOption?.label || formatTimezoneOffset(selectedTimezone)}</span>
          <span style={{ 
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease'
          }}>
            ▼
          </span>
        </button>

        {isOpen && (
          <div
            role="listbox"
            aria-label="Timezone options"
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              background: 'rgba(26, 26, 26, 0.95)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '18px',
              maxHeight: '200px',
              overflowY: 'auto',
              zIndex: 1000,
              marginTop: '2px',
              backdropFilter: 'blur(10px)'
            }}
          >
            {timezoneOptions.map((option) => (
              <div
                key={option.value}
                role="option"
                aria-selected={option.value === selectedTimezone}
                onClick={() => handleTimezoneChange(option.value)}
                style={{
                  padding: '4px 8px',
                  cursor: 'pointer',
                  color: '#ffffff',
                  fontSize: '12px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                  backgroundColor: option.value === selectedTimezone ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                  transition: 'all 0.3s ease',
                  borderRadius: option.value === selectedTimezone ? '12px' : '0'
                }}
                onMouseEnter={(e) => {
                  if (option.value !== selectedTimezone) {
                    e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (option.value !== selectedTimezone) {
                    e.target.style.backgroundColor = 'transparent';
                  }
                }}
              >
                {option.label}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {loading && (
        <div style={{
          position: 'absolute',
          top: '50%',
          right: '12px',
          transform: 'translateY(-50%)',
          fontSize: '12px',
          color: '#888'
        }}>
          Saving...
        </div>
      )}
    </div>
  );
};

export default TimezoneSelector;
