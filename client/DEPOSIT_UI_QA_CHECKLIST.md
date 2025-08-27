# Deposit UI Visual QA Checklist

## Global Visual Parity & Theme Usage ✅

- [x] All elements use existing theme tokens (colors, spacing, radii, shadows, typography)
- [x] No new global colors added
- [x] Card radii (2xl) and card paddings (24px) match platform
- [x] Button sizes consistent with platform
- [x] Dark theme contrast ratios meet WCAG AA standards
- [x] CSS variables properly defined in `styles.css`

## Deposit Page - Left Panel (Payment Card) ✅

### Card Structure
- [x] Uses `bg-[var(--card-bg)] rounded-2xl p-6 shadow-inner`
- [x] Header back link styling matches specification
- [x] Payment method row with token icon (36px circle) and divider

### Amount Input Group
- [x] Larger, vertically centered input with $ prefix icon
- [x] Precise focus state (outline + subtle glow)
- [x] Inline validation with animated error message and icon
- [x] Min/max text styling (`Min $10, Max $50,000`)

### Quick Select Buttons
- [x] Consistent height with amount input
- [x] Equal width buttons
- [x] Subtle hover/active elevation
- [x] Grid layout with proper spacing

### Promo Code Flow
- [x] Input and "Apply" button layout
- [x] Full-width success panel with rounded corners and check icon
- [x] Subtle enter animation (slide + fade)
- [x] Inline error hints for invalid promos

### CTA Area
- [x] Visually pinned to bottom of card with subtle divider
- [x] Large primary button with platform shadow + active press animation
- [x] Final total displayed in bold green using accent token
- [x] Helper text: "Funds will be credited after admin verification"
- [x] Warning icon and subdued color

### Keyboard & Focus
- [x] Natural focus order: input → promo → quick-select → deposit
- [x] Visible focus rings on all interactive elements

## Deposit Page - Right Panel (Bonuses, FAQ, Latest Requests) ✅

### Bonus Cards
- [x] Uniform height cards
- [x] Large tap targets (>= 44x44px)
- [x] Left accent bar when active (green token)
- [x] Small animated check appears when selecting
- [x] Condition text muted below preview amount
- [x] Hover: subtle lift + border highlight
- [x] Active state: `ring-2 ring-[var(--accent-green)] bg-[rgba(16,185,129,0.06)]`

### FAQ Accordion
- [x] Uses existing Accordion component styling
- [x] Chevron rotates and transitions smoothly
- [x] Increased hit area for mobile
- [x] `aria-expanded` attributes
- [x] Proper spacing and typography

### Latest Requests List
- [x] Single-line rows with three columns: date, status, method+amount
- [x] Platform status chips (clock for waiting, green for approved)
- [x] Smooth real-time update animations
- [x] Proper status icons and colors
- [x] Responsive layout

## Payment Instruction / Confirmation Page ✅

### Header
- [x] H1: "Deposit $<amount> via USDT (TRC-20)" matches global H1 styles
- [x] Back link styling consistent

### Wallet Address Block
- [x] Monospace font
- [x] Full-width bordered token
- [x] Copy icon on the right
- [x] Copy button uses existing Button style
- [x] Toast notification: "Address copied to clipboard"
- [x] Subtle copy animation

### Countdown Timer
- [x] Displays "Expires: HH:MM:SS" format
- [x] Same small-medium text weight as tooltips
- [x] Animate seconds tick smoothly
- [x] Color change at 10 minutes left (amber)
- [x] Flashing red at <1 minute
- [x] Proper color logic implementation

### Action Buttons
- [x] Copy address (secondary) and I've paid (primary)
- [x] Equal heights and platform shadow
- [x] I've paid UX: inline state change to spinner + "Waiting for Confirmation..."
- [x] Button disabled after click
- [x] `role="status"` for screen readers
- [x] Prevent double-clicks

### Status Area
- [x] Before I've paid: "Waiting for Payment..." with subtle pulse animation
- [x] After I've paid: "Waiting for Confirmation..." with clock icon
- [x] Subdued color for status text
- [x] Entry appears in Latest Requests

## Micro-interactions & Animations ✅

### Buttons
- [x] Hover elevation
- [x] Active press animation (scale down 0.98)
- [x] Disabled fade
- [x] Focus states

### Cards
- [x] Hover lift effect
- [x] Active selection animation for bonus cards
- [x] Smooth transitions

### Promo Success
- [x] Slide + fade animation
- [x] Check icon animation

### Copy Action
- [x] Small toast notification
- [x] Transient icon swap

### Countdown
- [x] Per-second update
- [x] Color transitions for urgency

## Responsiveness & Mobile ✅

### Desktop
- [x] Two-column layout with 24px gutter
- [x] `lg:grid-cols-12` with `lg:col-span-7` and `lg:col-span-5`

### Tablet/Mobile
- [x] Stack panels vertically
- [x] Move bonus cards under payment card
- [x] Buttons full-width
- [x] Tappable areas >= 44x44 px
- [x] FAQ accordion and latest requests remain accessible
- [x] Proper scrolling behavior

## Accessibility & ARIA ✅

- [x] `aria-live="polite"` or `role="status"` for status changes
- [x] `aria-label` to copy button and I've paid button
- [x] Semantic elements (button, form, label)
- [x] Proper keyboard focus order
- [x] Color contrast meets WCAG AA
- [x] Screen reader announcements for state changes

## Mock API Integration ✅

- [x] All API calls replaced with `useMockDepositApi` hooks
- [x] Realistic loading states and delays
- [x] Error handling for failed requests
- [x] Success states properly handled
- [x] No real balance updates or admin logic

## Component Structure ✅

- [x] `PaymentCard.jsx` - Left panel component
- [x] `BonusCard.jsx` - Individual bonus option component
- [x] `LatestRequests.jsx` - Updated with new styling
- [x] `Deposit.jsx` - Updated to use new components
- [x] `DepositConfirm.jsx` - Updated with new styling

## CSS Variables ✅

- [x] All theme tokens defined in `styles.css`
- [x] `--primary`, `--primary-hover`, `--primary-disabled`
- [x] `--bg`, `--card-bg`, `--text-primary`, `--text-muted`
- [x] `--accent-green`, `--text-error`, `--border-error`
- [x] Spacing and radius variables
- [x] Proper fallbacks and usage throughout components

## Visual States ✅

### Deposit Page States
- [x] Empty form state
- [x] Filled amount state
- [x] Promo applied state
- [x] Invalid promo state
- [x] Loading states
- [x] Error states

### Confirm Page States
- [x] Before I've paid state
- [x] After I've paid (waiting confirmation) state
- [x] Expired state
- [x] Loading states
- [x] Error states

### Latest Requests States
- [x] Empty state
- [x] Loading state
- [x] Error state
- [x] Populated state with different statuses
- [x] Real-time update animations

## Performance & UX ✅

- [x] Smooth animations (60fps)
- [x] No layout shifts during state changes
- [x] Proper loading states prevent confusion
- [x] Error states provide clear feedback
- [x] Success states confirm actions
- [x] Responsive design works on all screen sizes

## Browser Compatibility ✅

- [x] Modern browsers (Chrome, Firefox, Safari, Edge)
- [x] CSS Grid support
- [x] CSS Custom Properties support
- [x] Flexbox support
- [x] Animation support

## Documentation ✅

- [x] Style guide created (`DEPOSIT_UI_STYLE_GUIDE.md`)
- [x] Integration guide created (`DEPOSIT_UI_INTEGRATION.md`)
- [x] Changelog updated
- [x] Component documentation
- [x] Mock API documentation

---

## Final Verification

All specifications from the user's detailed requirements have been implemented:

1. ✅ **Global Layout**: Two-column grid with proper spacing and theme usage
2. ✅ **Payment Card**: All styling specifications implemented
3. ✅ **Bonus Cards**: Active states, animations, and layout
4. ✅ **FAQ Accordion**: Proper styling and interactions
5. ✅ **Latest Requests**: Updated styling and real-time updates
6. ✅ **Confirm Page**: Header, address block, countdown, buttons, status
7. ✅ **Micro-interactions**: All animations and transitions
8. ✅ **Accessibility**: ARIA labels, focus management, contrast
9. ✅ **Responsiveness**: Mobile and tablet layouts
10. ✅ **Mock Integration**: No real API calls, UI-only improvements

The deposit UI improvements are complete and ready for visual QA testing.
