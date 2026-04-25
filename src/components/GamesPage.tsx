import React, { useState } from 'react';
import { useApp } from '../store/AppContext';
import { getFiles } from '../store/db';
import { getPricesByFileId, getStockCount } from '../store/helpers';
import { Icon } from './Icon';
import { ProductVisual } from './ProductVisual';

const GamesPage: React.FC = () => {
  const { navigate } = useApp();
  const [search, setSearch] = useState('');
  const files = getFiles();
  const filtered = files.filter(f => f.fileName.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="px-3 sm:px-4 py-4 sm:py-6 animate-fade-in max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight inline-flex items-center gap-2">
            <span className="icon-box icon-box-accent">
              <Icon name="gamepad" className="w-4 h-4" />
            </span>
            Browse store
          </h2>
          <p className="text-text-muted text-xs sm:text-sm mt-1">{files.length} products available</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Icon name="search" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="input-field pl-9"
            aria-label="Search products"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state panel-card">
          <span className="empty-icon">
            <Icon name="inbox" className="w-5 h-5" />
          </span>
          <p className="text-sm font-medium">No products found</p>
          <p className="text-text-muted text-xs mt-1">Try a different search term</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {filtered.map(file => {
            const prices = getPricesByFileId(file.id);
            const minPrice = prices.length > 0 ? Math.min(...prices.map(p => p.price)) : 0;
            const totalStock = prices.reduce((s, p) => s + getStockCount(file.id, p.durationDays), 0);
            const inStock = totalStock > 0;
            return (
              <button
                key={file.id}
                onClick={() => navigate('game-detail-' + file.id)}
                className="game-card rounded-2xl overflow-hidden text-left group"
                aria-label={`Open ${file.fileName}`}
              >
                <div className="relative">
                  <ProductVisual
                    name={file.fileName}
                    seed={file.id}
                    className="h-28 sm:h-36"
                  />
                  <span
                    className={`absolute top-2 right-2 status-badge ${inStock ? 'status-success' : 'status-danger'} backdrop-blur-sm`}
                  >
                    <span className="dot" />
                    {inStock ? `${totalStock} in stock` : 'Sold out'}
                  </span>
                </div>
                <div className="p-3 sm:p-4">
                  <h3 className="font-semibold text-sm sm:text-base mb-1 truncate group-hover:text-white">
                    {file.fileName}
                  </h3>
                  <div className="flex items-center gap-1.5 text-text-muted text-[10px] sm:text-xs mb-2">
                    <Icon name="file" className="w-3 h-3" />
                    <span className="truncate">{file.fileSize}</span>
                  </div>
                  <div className="flex items-end justify-between gap-2">
                    {prices.length > 0 ? (
                      <div>
                        <p className="text-text-muted text-[9px] sm:text-[10px] uppercase tracking-wider">Starts at</p>
                        <p className="text-accent font-extrabold text-base sm:text-xl leading-none">
                          ₹{minPrice}
                          <span className="text-text-muted text-[9px] sm:text-[10px] font-normal ml-1">/plan</span>
                        </p>
                      </div>
                    ) : (
                      <p className="text-text-muted text-[10px] sm:text-xs">No plans yet</p>
                    )}
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-surface-lighter border border-border text-text-secondary group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all">
                      <Icon name="chevron-right" className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default GamesPage;
