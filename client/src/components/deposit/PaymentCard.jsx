import React from 'react';

const PaymentCard = ({
  amount,
  setAmount,
  promoCode,
  setPromoCode,
  isValidatingPromo,
  handleValidatePromoCode,
  error,
  success,
  amountError,
  quickAmounts,
  isLoading,
  handleDeposit,
  isValidForm,
  finalTotal,
  totalBonusPercent
}) => {
  return (
    <div className="bg-[var(--card-bg)] rounded-2xl p-6 shadow-inner">
      <h3 className="text-lg font-semibold mb-4 text-white">Payment Method</h3>
      
      {/* Payment Method Row */}
      <div className="flex items-center space-x-3">
        <div className="w-9 h-9 bg-[var(--primary)] rounded-full flex items-center justify-center">
          <span className="text-white font-bold text-sm">$</span>
        </div>
        <div>
          <div className="font-medium text-white">USDT (TRC-20)</div>
          <div className="text-sm text-[var(--text-muted)]">Min $10, Max $50,000</div>
        </div>
      </div>
      
      {/* Divider */}
      <div className="border-t border-[rgba(255,255,255,0.05)] mt-4"></div>
      
      {/* Amount Input Group */}
      <div className="mt-4">
        <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
          Amount (USD)
        </label>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center w-12 h-12 bg-[rgba(255,255,255,0.03)] rounded-md text-sm">$</span>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            min="10"
            max="50000"
            step="0.01"
            className="flex-1 h-12 px-4 rounded-md bg-[var(--card-bg)] border border-[rgba(255,255,255,0.04)] text-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-white placeholder-[var(--text-muted)]"
          />
        </div>
        {amountError && (
          <div className="mt-2 text-[var(--text-error)] text-sm flex items-center space-x-1">
            <span>⚠️</span>
            <span>{amountError}</span>
          </div>
        )}
      </div>
      
      {/* Quick Select Buttons */}
      <div className="mt-4">
        <label className="block text-sm font-medium text-[var(--text-muted)] mb-3">
          Quick Select
        </label>
        <div className="grid grid-cols-2 gap-3">
          {quickAmounts.map((quickAmount) => (
            <button
              key={quickAmount}
              onClick={() => setAmount(quickAmount.toString())}
              className="w-24 h-10 text-sm rounded-md border border-[rgba(255,255,255,0.06)] hover:shadow-md bg-[var(--card-bg)] text-white hover:bg-[rgba(255,255,255,0.05)] transition-all duration-200"
            >
              ${quickAmount}
            </button>
          ))}
        </div>
      </div>
      
      {/* Promo Code */}
      <div className="mt-6">
        <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
          Promo Code (Optional)
        </label>
        <div className="flex gap-2 items-center">
          <input
            type="text"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value)}
            placeholder="Enter promo code"
            className="flex-1 h-10 px-4 rounded-md bg-[var(--card-bg)] border border-[rgba(255,255,255,0.04)] text-white placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          />
          <button
            onClick={handleValidatePromoCode}
            disabled={isValidatingPromo || !promoCode.trim()}
            className="px-3 py-2 rounded-full bg-[var(--primary)] text-white text-sm font-medium hover:bg-[var(--primary-hover)] disabled:bg-[var(--primary-disabled)] disabled:cursor-not-allowed transition-colors"
          >
            {isValidatingPromo ? 'Applying...' : 'Apply'}
          </button>
        </div>
        
        {error && (
          <div className="mt-2 text-[var(--text-error)] text-sm flex items-center space-x-2">
            <span>❌</span>
            <span>{error}</span>
          </div>
        )}
        
        {success && (
          <div className="w-full mt-4 rounded-lg p-4 bg-[rgba(16,185,129,0.08)] border-l-4 border-[var(--accent-green)] text-[var(--accent-green)] flex items-center gap-3">
            <div className="text-xl">✓</div>
            <div className="font-medium">{success}</div>
          </div>
        )}
      </div>
      
      {/* Deposit CTA Area */}
      <div className="border-t border-[rgba(255,255,255,0.04)] mt-6 pt-4">
        <div className="flex items-center justify-between">
          <button
            onClick={handleDeposit}
            disabled={!isValidForm || isLoading}
            className="px-6 py-3 rounded-2xl bg-[var(--primary)] shadow-lg text-white text-lg font-bold hover:bg-[var(--primary-hover)] disabled:bg-[var(--primary-disabled)] disabled:cursor-not-allowed transition-all duration-200"
          >
            {isLoading ? 'Creating Deposit...' : 'Deposit'}
          </button>
          <div className="text-sm">
            <div className="text-[var(--text-muted)]">You'll get a {totalBonusPercent}% bonus:</div>
            <div className="font-bold text-[var(--accent-green)] text-lg">${finalTotal.toFixed(2)}</div>
          </div>
        </div>
        
        {/* Warning */}
        <div className="text-xs text-[var(--text-muted)] mt-2 flex items-center gap-2">
          <span>⚠️</span>
          <span>Funds will be credited after admin verification</span>
        </div>
      </div>
    </div>
  );
};

export default PaymentCard;
