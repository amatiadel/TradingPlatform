# Deposit UI Style Guide

## Overview
This document outlines the visual design system and component specifications for the improved Deposit and Deposit Confirmation pages.

## Theme Tokens

### Colors
```css
/* Primary Colors */
--primary-green: #00ff88;
--primary-green-hover: #00cc6a;
--primary-green-disabled: #666666;

/* Background Colors */
--bg-primary: #0f0f0f;
--bg-secondary: #1a1a1a;
--bg-card: #2a2a2a;
--bg-input: #333333;

/* Text Colors */
--text-primary: #ffffff;
--text-secondary: #cccccc;
--text-muted: #666666;
--text-success: #00ff88;
--text-warning: #ffaa00;
--text-error: #ff4444;

/* Border Colors */
--border-primary: #444444;
--border-secondary: #333333;
--border-success: #00ff88;
--border-warning: #ffaa00;
--border-error: #ff4444;
```

### Spacing
```css
--spacing-xs: 0.25rem;   /* 4px */
--spacing-sm: 0.5rem;    /* 8px */
--spacing-md: 1rem;      /* 16px */
--spacing-lg: 1.5rem;    /* 24px */
--spacing-xl: 2rem;      /* 32px */
--spacing-2xl: 3rem;     /* 48px */
```

### Border Radius
```css
--radius-sm: 0.375rem;   /* 6px */
--radius-md: 0.5rem;     /* 8px */
--radius-lg: 0.75rem;    /* 12px */
--radius-xl: 1rem;       /* 16px */
--radius-2xl: 1.5rem;    /* 24px */
```

## Component Specifications

### Card Components
```css
.deposit-card {
  background: var(--bg-card);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-2xl);
  padding: var(--spacing-lg);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.deposit-card:hover {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.2s ease-in-out;
}
```

### Input Components
```css
.deposit-input {
  background: var(--bg-input);
  border: 1px solid var(--border-secondary);
  border-radius: var(--radius-xl);
  padding: var(--spacing-md) var(--spacing-lg);
  color: var(--text-primary);
  transition: all 0.2s ease-in-out;
}

.deposit-input:focus {
  outline: none;
  border-color: var(--primary-green);
  box-shadow: 0 0 0 3px rgba(0, 255, 136, 0.1);
}

.deposit-input.error {
  border-color: var(--border-error);
}
```

### Button Components
```css
.deposit-button-primary {
  background: var(--primary-green);
  color: var(--bg-primary);
  border: none;
  border-radius: var(--radius-xl);
  padding: var(--spacing-md) var(--spacing-xl);
  font-weight: bold;
  transition: all 0.2s ease-in-out;
}

.deposit-button-primary:hover {
  background: var(--primary-green-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 255, 136, 0.3);
}

.deposit-button-primary:active {
  transform: translateY(0) scale(0.98);
}

.deposit-button-primary:disabled {
  background: var(--primary-green-disabled);
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}
```

### Status Badges
```css
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-lg);
  font-size: 0.75rem;
  font-weight: 500;
  border: 1px solid;
}

.status-badge.created {
  background: rgba(59, 130, 246, 0.1);
  border-color: #3b82f6;
  color: #60a5fa;
}

.status-badge.waiting {
  background: rgba(245, 158, 11, 0.1);
  border-color: #f59e0b;
  color: #fbbf24;
}

.status-badge.approved {
  background: rgba(34, 197, 94, 0.1);
  border-color: #22c55e;
  color: #4ade80;
}

.status-badge.rejected {
  background: rgba(239, 68, 68, 0.1);
  border-color: #ef4444;
  color: #f87171;
}
```

## Layout Specifications

### Two-Column Layout
```css
.deposit-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-xl);
  max-width: 1280px;
  margin: 0 auto;
  padding: var(--spacing-xl);
}

@media (max-width: 1024px) {
  .deposit-layout {
    grid-template-columns: 1fr;
    gap: var(--spacing-lg);
  }
}
```

### Responsive Breakpoints
```css
/* Mobile */
@media (max-width: 640px) {
  .deposit-card {
    padding: var(--spacing-md);
    border-radius: var(--radius-lg);
  }
  
  .deposit-button-primary {
    width: 100%;
    padding: var(--spacing-lg);
  }
}

/* Tablet */
@media (min-width: 641px) and (max-width: 1024px) {
  .deposit-layout {
    padding: var(--spacing-lg);
  }
}
```

## Animation Specifications

### Micro-interactions
```css
/* Button hover effects */
.button-hover {
  transition: all 0.2s ease-in-out;
}

.button-hover:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Card hover effects */
.card-hover {
  transition: all 0.2s ease-in-out;
}

.card-hover:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

/* Status transitions */
.status-transition {
  transition: all 0.3s ease-in-out;
}

/* Loading animations */
.loading-spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Pulse animation for urgent states */
.pulse-urgent {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

## Accessibility Guidelines

### Focus States
```css
.focus-visible {
  outline: 2px solid var(--primary-green);
  outline-offset: 2px;
  border-radius: var(--radius-md);
}

/* Custom focus ring for buttons */
.button-focus:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(0, 255, 136, 0.3);
}
```

### ARIA Labels
```html
<!-- Amount input with validation -->
<input 
  type="number" 
  aria-describedby="amount-error"
  aria-invalid="true"
  aria-label="Deposit amount in USD"
/>

<!-- Status announcements -->
<div role="status" aria-live="polite">
  Payment marked as received
</div>

<!-- Loading states -->
<div role="status" aria-live="assertive">
  Processing your deposit...
</div>
```

### Color Contrast
- Primary text: 4.5:1 minimum contrast ratio
- Secondary text: 3:1 minimum contrast ratio
- Interactive elements: 3:1 minimum contrast ratio
- Status indicators: 4.5:1 minimum contrast ratio

## Component States

### Input Validation States
```css
.input-valid {
  border-color: var(--border-success);
  box-shadow: 0 0 0 1px var(--border-success);
}

.input-invalid {
  border-color: var(--border-error);
  box-shadow: 0 0 0 1px var(--border-error);
}

.input-warning {
  border-color: var(--border-warning);
  box-shadow: 0 0 0 1px var(--border-warning);
}
```

### Button States
```css
.button-loading {
  opacity: 0.7;
  cursor: not-allowed;
  pointer-events: none;
}

.button-success {
  background: var(--text-success);
  color: var(--bg-primary);
}

.button-error {
  background: var(--text-error);
  color: var(--text-primary);
}
```

## Typography Scale

```css
.text-xs { font-size: 0.75rem; line-height: 1rem; }
.text-sm { font-size: 0.875rem; line-height: 1.25rem; }
.text-base { font-size: 1rem; line-height: 1.5rem; }
.text-lg { font-size: 1.125rem; line-height: 1.75rem; }
.text-xl { font-size: 1.25rem; line-height: 1.75rem; }
.text-2xl { font-size: 1.5rem; line-height: 2rem; }
.text-3xl { font-size: 1.875rem; line-height: 2.25rem; }
```

## Icon Specifications

### Icon Sizes
```css
.icon-xs { width: 0.75rem; height: 0.75rem; }
.icon-sm { width: 1rem; height: 1rem; }
.icon-md { width: 1.25rem; height: 1.25rem; }
.icon-lg { width: 1.5rem; height: 1.5rem; }
.icon-xl { width: 2rem; height: 2rem; }
```

### Icon Colors
```css
.icon-primary { color: var(--primary-green); }
.icon-secondary { color: var(--text-secondary); }
.icon-muted { color: var(--text-muted); }
.icon-success { color: var(--text-success); }
.icon-warning { color: var(--text-warning); }
.icon-error { color: var(--text-error); }
```

## Implementation Notes

### Mock API Integration
To replace mock APIs with real implementations:

1. Replace `useMockDepositApi()` with real API calls
2. Update error handling to use actual API responses
3. Implement real-time socket connections for live updates
4. Add proper loading states and error boundaries

### Performance Considerations
- Use `React.memo()` for components that don't need frequent re-renders
- Implement proper loading skeletons for better perceived performance
- Use `useCallback()` for event handlers passed to child components
- Consider lazy loading for non-critical components

### Testing Guidelines
- Test all interactive states (hover, focus, active, disabled)
- Verify accessibility with screen readers
- Test responsive behavior across different screen sizes
- Validate color contrast ratios
- Test keyboard navigation flow
