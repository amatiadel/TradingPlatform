import React from 'react';

const MiniHistory = () => {
  const recentTrades = [
    { pair: 'EUR/USD', type: 'CALL', amount: '$50', result: 'WIN', profit: '+$45', time: '2 min ago' },
    { pair: 'GBP/JPY', type: 'PUT', amount: '$30', result: 'LOSS', profit: '-$30', time: '5 min ago' },
    { pair: 'USD/JPY', type: 'CALL', amount: '$75', result: 'WIN', profit: '+$67', time: '8 min ago' },
    { pair: 'AUD/USD', type: 'PUT', amount: '$40', result: 'WIN', profit: '+$36', time: '12 min ago' },
    { pair: 'EUR/GBP', type: 'CALL', amount: '$60', result: 'LOSS', profit: '-$60', time: '15 min ago' }
  ];

  return (
    <section className="mini-history">
      <div className="mini-history-container">
        <div className="mini-history-header">
          <h3>Recent Trades</h3>
          <button className="btn-secondary">View Full History</button>
        </div>
        <div className="trade-list">
          {recentTrades.map((trade, index) => (
            <div key={index} className="trade-item">
              <div className="trade-pair">{trade.pair}</div>
              <div className={`trade-type ${trade.type.toLowerCase()}`}>{trade.type}</div>
              <div className="trade-amount">{trade.amount}</div>
              <div className={`trade-result ${trade.result.toLowerCase()}`}>
                {trade.result} {trade.profit}
              </div>
              <div className="trade-time">{trade.time}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MiniHistory;
