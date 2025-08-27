import React from 'react';

const BonusCard = ({
  option,
  selectedBonusPercent,
  setSelectedBonusPercent,
  amount
}) => {
  const isSelected = selectedBonusPercent === option.percent;
  const bonusAmount = (parseFloat(amount) || 0) * (option.percent / 100);
  
  return (
    <div
      className={`flex items-center p-4 rounded-xl border border-[rgba(255,255,255,0.03)] hover:shadow-md transition-all duration-200 cursor-pointer ${
        isSelected 
          ? 'ring-2 ring-[var(--accent-green)] bg-[rgba(16,185,129,0.06)]' 
          : 'hover:bg-[rgba(255,255,255,0.02)]'
      }`}
      onClick={() => setSelectedBonusPercent(option.percent)}
    >
      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
        isSelected 
          ? 'border-[var(--accent-green)] bg-[var(--accent-green)]' 
          : 'border-[rgba(255,255,255,0.2)]'
      }`}>
        {isSelected && (
          <div className="w-2 h-2 bg-white rounded-full"></div>
        )}
      </div>
      
      <div className="ml-4 flex-1">
        <div className="font-semibold text-lg text-white">
          {option.percent === 0 ? 'No bonus' : `${option.percent}% bonus`}
        </div>
        <div className="text-sm text-[var(--text-muted)]">
          {option.condition}
        </div>
      </div>
      
      <div className="text-right">
        <div className="font-bold text-[var(--accent-green)]">
          ${bonusAmount.toFixed(2)}
        </div>
      </div>
    </div>
  );
};

export default BonusCard;
