import React, { useState } from 'react';
import { useApp } from '../store/AppContext';
import { getFiles } from '../store/db';
import { getPricesByFileId, getStockCount } from '../store/helpers';

const gameColors = ['from-purple-600 to-blue-600','from-green-500 to-teal-600','from-orange-500 to-red-600','from-pink-500 to-purple-600','from-cyan-500 to-blue-600','from-yellow-500 to-orange-600'];
const gameEmojis = ['🎯','🔥','⚔️','🏆','💎','🌟','🎪','🚀'];

const GamesPage: React.FC = () => {
  const { navigate } = useApp();
  const [search, setSearch] = useState('');
  const files = getFiles();
  const filtered = files.filter(f => f.fileName.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="px-3 sm:px-4 py-4 sm:py-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">🎮 Games</h2>
          <p className="text-text-muted text-xs sm:text-sm">{files.length} products</p>
        </div>
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="🔍 Search..."
          className="w-full sm:w-56 bg-surface-lighter border border-border rounded-xl px-4 py-2 text-sm text-white placeholder-text-muted focus:outline-none focus:border-primary" />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16"><div className="text-5xl mb-3">📭</div><p className="text-text-secondary text-sm">No games found</p></div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4">
          {filtered.map((file, idx) => {
            const prices = getPricesByFileId(file.id);
            const minPrice = prices.length > 0 ? Math.min(...prices.map(p => p.price)) : 0;
            const totalStock = prices.reduce((s, p) => s + getStockCount(file.id, p.durationDays), 0);
            return (
              <div key={file.id} onClick={() => navigate('game-detail-' + file.id)}
                className="game-card rounded-xl sm:rounded-2xl overflow-hidden cursor-pointer">
                <div className={`h-24 sm:h-36 bg-gradient-to-br ${gameColors[idx % gameColors.length]} flex items-center justify-center relative`}>
                  <span className="text-3xl sm:text-5xl relative z-10">{gameEmojis[idx % gameEmojis.length]}</span>
                  <span className={`absolute top-2 right-2 text-[9px] sm:text-xs px-1.5 py-0.5 rounded-full font-medium backdrop-blur-sm ${totalStock > 0 ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'}`}>
                    {totalStock > 0 ? '✓ Stock' : '✕'}
                  </span>
                </div>
                <div className="p-2.5 sm:p-4">
                  <h3 className="font-semibold text-xs sm:text-base mb-0.5 sm:mb-1 truncate">{file.fileName}</h3>
                  <p className="text-text-muted text-[9px] sm:text-xs mb-1.5 sm:mb-2">{file.fileSize}</p>
                  {prices.length > 0 ? (
                    <p className="text-accent font-bold text-sm sm:text-lg">₹{minPrice}<span className="text-text-muted text-[9px] sm:text-xs font-normal">/mo</span></p>
                  ) : (
                    <p className="text-text-muted text-[10px] sm:text-sm">No plans</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default GamesPage;
