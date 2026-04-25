import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../store/AppContext';
import { getNotificationsFor, markNotifRead, markAllNotifsRead } from '../store/db';

const Navbar: React.FC = () => {
  const { currentUser, isAdmin, currentPage, navigate, logout, notifCount, refreshNotifs, currentUserId } = useApp();
  const [showNotifs, setShowNotifs] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const notifUserId = isAdmin ? '' : currentUserId;

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifs(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Notif count auto-refreshes from AppContext every 5s

  const notifications = getNotificationsFor(notifUserId);

  return (
    <nav className="sticky top-0 z-50 glass-card border-b border-border">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => navigate('home')}>
          <span className="text-lg sm:text-2xl">🎮</span>
          <h1 className="text-base sm:text-xl font-bold bg-gradient-to-r from-primary-light to-accent bg-clip-text text-transparent whitespace-nowrap">KITY STORE</h1>
        </div>
        
        <div className="flex items-center gap-1 sm:gap-2">
          {currentUser ? (
            <>
              {isAdmin && (
                <button onClick={() => navigate('admin')} className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-sm font-medium transition-all ${
                  currentPage === 'admin' || currentPage.startsWith('admin-') ? 'bg-primary text-white' : 'bg-surface-lighter text-text-secondary hover:text-white'
                }`}>⚙️</button>
              )}

              {/* Notification Bell */}
              <div className="relative" ref={notifRef}>
                <button onClick={() => setShowNotifs(!showNotifs)} className="relative px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-surface-lighter text-text-secondary hover:text-white transition-all">
                  🔔
                  {notifCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-danger text-white text-[8px] sm:text-[10px] font-bold rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center animate-pulse">
                      {notifCount > 9 ? '9+' : notifCount}
                    </span>
                  )}
                </button>

                {showNotifs && (
                  <div className="absolute right-0 top-full mt-2 w-[calc(100vw-2rem)] sm:w-80 glass-card rounded-xl border border-border shadow-xl max-h-[70vh] overflow-y-auto z-50 animate-fade-in">
                    <div className="p-3 border-b border-border flex items-center justify-between">
                      <span className="font-semibold text-sm">🔔 Notifications</span>
                      {notifCount > 0 && (
                        <button onClick={() => { markAllNotifsRead(notifUserId); refreshNotifs(); }} className="text-primary text-[10px]">Mark all read</button>
                      )}
                    </div>
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-text-muted text-sm">No notifications</div>
                    ) : (
                      notifications.slice(0, 15).map(n => (
                        <div key={n.id} onClick={() => {
                          markNotifRead(n.id); refreshNotifs();
                          if (isAdmin && n.type === 'PAYMENT_PROOF') navigate('admin');
                          else if (!isAdmin && (n.type === 'PAYMENT_APPROVED' || n.type === 'PAYMENT_REJECTED')) navigate('profile');
                          setShowNotifs(false);
                        }} className={`p-3 border-b border-border/50 cursor-pointer hover:bg-surface-lighter transition-all ${!n.read ? 'bg-primary/5 border-l-2 border-l-primary' : ''}`}>
                          <div className="flex items-start gap-2">
                            <span className="text-lg">
                              {n.type === 'PAYMENT_PROOF' ? '📸' : n.type === 'PAYMENT_APPROVED' ? '✅' : n.type === 'PAYMENT_REJECTED' ? '❌' : n.type === 'NEW_USER' ? '👤' : '💬'}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium">{n.title}</p>
                              <p className="text-text-muted text-[10px]">{n.message}</p>
                              {n.deliveredKey && (
                                <p className="text-success text-[10px] mt-1">🔑 Key: <code className="bg-success/20 px-1 rounded">{n.deliveredKey}</code></p>
                              )}
                              {n.deliveredFileName && (
                                <p className="text-accent text-[10px]">📁 {n.deliveredFileName}</p>
                              )}
                              <p className="text-text-muted text-[9px] mt-0.5">{new Date(n.createdAt).toLocaleString('en-IN')}</p>
                            </div>
                            {!n.read && <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1"></span>}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              <button onClick={() => navigate('games')} className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-sm font-medium transition-all ${
                currentPage === 'games' || currentPage.startsWith('game-detail') ? 'bg-primary text-white' : 'bg-surface-lighter text-text-secondary hover:text-white'
              }`}>🎮</button>
              <button onClick={() => navigate('profile')} className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-sm font-medium transition-all ${
                currentPage === 'profile' ? 'bg-primary text-white' : 'bg-surface-lighter text-text-secondary hover:text-white'
              }`}>👤</button>
              <div className="flex items-center gap-1 sm:gap-2 ml-1">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xs sm:text-sm font-bold">
                  {currentUser.username.charAt(0).toUpperCase()}
                </div>
                <button onClick={logout} className="text-text-muted hover:text-danger text-xs sm:text-sm" title="Logout">⏻</button>
              </div>
            </>
          ) : (
            <button onClick={() => navigate('login')} className="btn-primary px-3 sm:px-4 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium">Login</button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
