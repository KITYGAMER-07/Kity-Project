import React from 'react';
import { useApp } from '../store/AppContext';

const Navbar: React.FC = () => {
  const { currentUser, isAdmin, currentPage, navigate, logout } = useApp();

  return (
    <nav className="sticky top-0 z-50 glass-card border-b border-border">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('home')}>
          <span className="text-2xl">🎮</span>
          <h1 className="text-xl font-bold bg-gradient-to-r from-primary-light to-accent bg-clip-text text-transparent">
            KITY STORE
          </h1>
        </div>
        
        <div className="flex items-center gap-2">
          {currentUser ? (
            <>
              {isAdmin && (
                <button
                  onClick={() => navigate('admin')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    currentPage === 'admin' || currentPage.startsWith('admin-')
                      ? 'bg-primary text-white'
                      : 'bg-surface-lighter text-text-secondary hover:text-white'
                  }`}
                >
                  ⚙️ Admin
                </button>
              )}
              <button
                onClick={() => navigate('games')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  currentPage === 'games' || currentPage === 'game-detail'
                    ? 'bg-primary text-white'
                    : 'bg-surface-lighter text-text-secondary hover:text-white'
                }`}
              >
                🎮 Games
              </button>
              <button
                onClick={() => navigate('profile')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  currentPage === 'profile'
                    ? 'bg-primary text-white'
                    : 'bg-surface-lighter text-text-secondary hover:text-white'
                }`}
              >
                👤 Profile
              </button>
              <div className="flex items-center gap-2 ml-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-sm font-bold">
                  {currentUser.username.charAt(0).toUpperCase()}
                </div>
                <button
                  onClick={logout}
                  className="text-text-muted hover:text-danger text-sm transition-colors"
                  title="Logout"
                >
                  ⏻
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={() => navigate('login')}
              className="btn-primary px-4 py-1.5 rounded-lg text-sm font-medium"
            >
              Login
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
