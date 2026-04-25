import React, { useState } from 'react';
import { useApp } from '../store/AppContext';
import { getPricesByFileId, getStockCount } from '../store/helpers';
import { getFiles } from '../store/db';

const gameColors = [
  'from-purple-600 to-blue-600',
  'from-green-500 to-teal-600',
  'from-orange-500 to-red-600',
  'from-pink-500 to-purple-600',
  'from-cyan-500 to-blue-600',
  'from-yellow-500 to-orange-600',
];

const gameEmojis = ['🎯', '🔥', '⚔️', '🏆', '💎', '🌟', '🎪', '🚀'];

const GamesPage: React.FC = () => {
  const { navigate, dataVersion } = useApp();
  const [search, setSearch] = useState('');
  const files = getFiles();

  const filtered = files.filter(f =>
    f.fileName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold">🎮 Games Store</h2>
          <p className="text-text-secondary text-sm">{files.length} products available</p>
        </div>
        <div className="w-full sm:w-auto">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 Search games..."
            className="w-full sm:w-64 bg-surface-lighter border border-border rounded-xl px-4 py-2 text-sm text-white placeholder-text-muted focus:outline-none focus:border-primary transition-all"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">📭</div>
          <p className="text-text-secondary">No games found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((file, idx) => {
            const prices = getPricesByFileId(file.id);
            const minPrice = prices.length > 0 ? Math.min(...prices.map(p => p.price)) : 0;
            const totalStock = prices.reduce((sum, p) => sum + getStockCount(file.id, p.durationDays), 0);
            const colorIdx = idx % gameColors.length;
            const emojiIdx = idx % gameEmojis.length;

            return (
              <div
                key={file.id + '-' + dataVersion}
                onClick={() => navigate('game-detail-' + file.id)}
                className="game-card rounded-2xl overflow-hidden cursor-pointer"
              >
                <div className={`h-36 bg-gradient-to-br ${gameColors[colorIdx]} flex items-center justify-center relative overflow-hidden`}>
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-2 left-4 text-6xl">{gameEmojis[emojiIdx]}</div>
                    <div className="absolute bottom-2 right-4 text-4xl rotate-12">{gameEmojis[(emojiIdx + 1) % gameEmojis.length]}</div>
                  </div>
                  <span className="text-5xl relative z-10 drop-shadow-lg">{gameEmojis[emojiIdx]}</span>
                  {totalStock > 0 ? (
                    <span className="absolute top-3 right-3 bg-success/20 text-success text-xs px-2 py-1 rounded-full font-medium backdrop-blur-sm">
                      In Stock
                    </span>
                  ) : (
                    <span className="absolute top-3 right-3 bg-danger/20 text-danger text-xs px-2 py-1 rounded-full font-medium backdrop-blur-sm">
                      Out of Stock
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-1">{file.fileName}</h3>
                  <p className="text-text-muted text-xs mb-3">{file.fileSize}</p>
                  <div className="flex items-center justify-between">
                    {prices.length > 0 ? (
                      <span className="text-accent font-bold text-lg">₹{minPrice}<span className="text-text-muted text-xs font-normal">/mo</span></span>
                    ) : (
                      <span className="text-text-muted text-sm">No plans</span>
                    )}
                    <span className="text-xs text-text-muted">{prices.length} plans</span>
                  </div>
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
