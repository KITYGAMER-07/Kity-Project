import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../store/AppContext';
import { getNotificationsFor, markNotifRead, markAllNotifsRead, Notification } from '../store/db';
import { Icon, IconName } from './Icon';
import { BrandMark } from './ProductVisual';

function notifIcon(type: Notification['type']): { name: IconName; cls: string } {
  switch (type) {
    case 'PAYMENT_PROOF':    return { name: 'camera',        cls: 'icon-box-warning' };
    case 'PAYMENT_APPROVED': return { name: 'check-circle',  cls: 'icon-box-success' };
    case 'PAYMENT_REJECTED': return { name: 'x-circle',      cls: 'icon-box-danger'  };
    case 'NEW_USER':         return { name: 'user',          cls: 'icon-box-info'    };
    case 'FEEDBACK':         return { name: 'message',       cls: 'icon-box'         };
    default:                 return { name: 'bell',          cls: 'icon-box'         };
  }
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return Math.floor(diff / 60_000) + 'm ago';
  if (diff < 86_400_000) return Math.floor(diff / 3_600_000) + 'h ago';
  if (diff < 7 * 86_400_000) return Math.floor(diff / 86_400_000) + 'd ago';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

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

  const notifications = getNotificationsFor(notifUserId);

  const navBtn = (active: boolean) =>
    `inline-flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl transition-all border ${
      active
        ? 'bg-primary text-white border-primary/40 shadow-[0_4px_18px_-6px_rgba(108,99,255,0.7)]'
        : 'bg-surface-lighter text-text-secondary border-border hover:text-white hover:border-primary/40'
    }`;

  return (
    <nav className="sticky top-0 z-50 glass-card border-b border-border">
      <div className="max-w-7xl mx-auto px-3 sm:px-5 py-2.5 sm:py-3 flex items-center justify-between gap-2">
        <button
          onClick={() => navigate('home')}
          className="flex items-center gap-2 sm:gap-2.5 min-w-0"
          aria-label="Go to home"
        >
          <BrandMark className="w-7 h-7 sm:w-9 sm:h-9 flex-shrink-0" />
          <div className="min-w-0 text-left">
            <h1 className="text-sm sm:text-lg font-extrabold tracking-tight bg-gradient-to-r from-primary-light to-accent bg-clip-text text-transparent leading-none whitespace-nowrap">
              KITY STORE
            </h1>
            <p className="text-[9px] sm:text-[10px] text-text-muted leading-none mt-0.5 hidden sm:block">
              Premium digital keys
            </p>
          </div>
        </button>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {currentUser ? (
            <>
              {isAdmin && (
                <button
                  onClick={() => navigate('admin')}
                  className={navBtn(currentPage === 'admin' || currentPage.startsWith('admin-'))}
                  title="Admin panel"
                  aria-label="Admin panel"
                >
                  <Icon name="gear" className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                </button>
              )}

              {/* Notification bell */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setShowNotifs(s => !s)}
                  className={navBtn(false)}
                  aria-label={`Notifications${notifCount > 0 ? `, ${notifCount} unread` : ''}`}
                  aria-haspopup="true"
                  aria-expanded={showNotifs}
                >
                  <Icon name="bell" className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                  {notifCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-danger text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center border-2 border-bg">
                      {notifCount > 9 ? '9+' : notifCount}
                    </span>
                  )}
                </button>

                {showNotifs && (
                  <div
                    className="absolute right-0 top-full mt-2 w-[calc(100vw-1.5rem)] sm:w-[22rem] glass-card rounded-xl border border-border shadow-2xl overflow-hidden z-50 animate-fade-in"
                    role="dialog"
                    aria-label="Inbox"
                  >
                    <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="icon-box icon-box-sm">
                          <Icon name="bell" className="w-3.5 h-3.5" />
                        </span>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm leading-none">Inbox</p>
                          <p className="text-[10px] text-text-muted mt-0.5">
                            {notifCount > 0 ? `${notifCount} unread` : 'All caught up'}
                          </p>
                        </div>
                      </div>
                      {notifCount > 0 && (
                        <button
                          onClick={() => { markAllNotifsRead(notifUserId); refreshNotifs(); }}
                          className="text-primary-light hover:text-white text-[11px] font-medium inline-flex items-center gap-1"
                        >
                          <Icon name="check-double" className="w-3.5 h-3.5" />
                          Mark all read
                        </button>
                      )}
                    </div>

                    <div className="max-h-[60vh] overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="empty-state">
                          <span className="empty-icon">
                            <Icon name="inbox" className="w-5 h-5" />
                          </span>
                          <p className="text-sm">No notifications yet</p>
                          <p className="text-text-muted text-xs mt-1">You'll see updates here</p>
                        </div>
                      ) : (
                        notifications.slice(0, 15).map(n => {
                          const ic = notifIcon(n.type);
                          return (
                            <button
                              key={n.id}
                              onClick={() => {
                                markNotifRead(n.id); refreshNotifs();
                                if (isAdmin && n.type === 'PAYMENT_PROOF') navigate('admin');
                                else if (!isAdmin && (n.type === 'PAYMENT_APPROVED' || n.type === 'PAYMENT_REJECTED')) navigate('profile');
                                setShowNotifs(false);
                              }}
                              className={`w-full text-left p-3 border-b border-border/60 hover:bg-white/[0.03] transition-colors ${!n.read ? 'bg-primary/[0.06]' : ''}`}
                            >
                              <div className="flex items-start gap-2.5">
                                <span className={`icon-box icon-box-sm flex-shrink-0 ${ic.cls}`}>
                                  <Icon name={ic.name} className="w-3.5 h-3.5" />
                                </span>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <p className="text-xs font-semibold truncate flex-1">{n.title}</p>
                                    {!n.read && <span className="w-1.5 h-1.5 bg-primary rounded-full flex-shrink-0" />}
                                  </div>
                                  <p className="text-text-secondary text-[11px] mt-0.5 leading-snug">{n.message}</p>
                                  {n.deliveredKey && (
                                    <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-success">
                                      <Icon name="key" className="w-3 h-3" />
                                      <code className="bg-success/15 px-1.5 py-0.5 rounded font-mono break-all">{n.deliveredKey}</code>
                                    </div>
                                  )}
                                  {n.deliveredFileName && (
                                    <p className="mt-1 inline-flex items-center gap-1 text-accent text-[10px]">
                                      <Icon name="file" className="w-3 h-3" /> {n.deliveredFileName}
                                    </p>
                                  )}
                                  <p className="text-text-muted text-[10px] mt-1">{relativeTime(n.createdAt)}</p>
                                </div>
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => navigate('games')}
                className={navBtn(currentPage === 'games' || currentPage.startsWith('game-detail'))}
                title="Browse games"
                aria-label="Browse games"
              >
                <Icon name="gamepad" className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
              </button>
              <button
                onClick={() => navigate('profile')}
                className={navBtn(currentPage === 'profile')}
                title="Profile"
                aria-label="Profile"
              >
                <Icon name="user" className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
              </button>

              <div className="flex items-center gap-1.5 sm:gap-2 ml-1 pl-1.5 sm:pl-2 border-l border-border">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-[11px] sm:text-xs font-bold text-bg">
                  {currentUser.username.charAt(0).toUpperCase()}
                </div>
                <button
                  onClick={logout}
                  className="text-text-muted hover:text-danger p-1 rounded-md transition-colors"
                  title="Logout"
                  aria-label="Logout"
                >
                  <Icon name="logout" className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={() => navigate('login')}
              className="btn-primary px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm"
            >
              <Icon name="lock" className="w-3.5 h-3.5" />
              Login
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
