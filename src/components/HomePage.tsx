import React from 'react';
import { useApp } from '../store/AppContext';
import { getFiles, getPrices, getSetting } from '../store/db';

const HomePage: React.FC = () => {
  const { currentUser, isAdmin, navigate } = useApp();
  const files = getFiles();
  const prices = getPrices();
  const upi = getSetting('UPI_ID');

  const features = [
    { icon: '🎮', title: 'Premium Games', desc: 'BGMI, Free Fire, PUBG & more' },
    { icon: '🔑', title: 'Instant Keys', desc: 'Get activation keys instantly' },
    { icon: '🔒', title: 'Secure Payment', desc: 'UPI verified transactions' },
    { icon: '🎁', title: 'Free Trials', desc: 'Try before you buy' },
  ];

  return (
    <div className="px-3 sm:px-4 py-4 sm:py-6 animate-fade-in">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-xl sm:rounded-2xl mb-6 sm:mb-8">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-bg to-accent/20" />
        <div className="absolute top-4 left-4 w-16 h-16 bg-primary/10 rounded-full blur-xl" />
        <div className="absolute bottom-4 right-4 w-24 h-24 bg-accent/10 rounded-full blur-xl" />
        <div className="relative p-6 sm:p-12 text-center">
          <div className="text-4xl sm:text-7xl mb-3 animate-float">🎮</div>
          <h1 className="text-2xl sm:text-5xl font-extrabold bg-gradient-to-r from-primary-light via-white to-accent bg-clip-text text-transparent mb-3">
            KITY DIGITAL STORE
          </h1>
          <p className="text-text-secondary text-sm sm:text-xl mb-1">Premium Game Keys & Digital Products</p>
          <p className="text-text-muted text-xs sm:text-sm mb-4 sm:mb-6">Made with ❤️ by @KITYGAMER</p>
          
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center">
            {currentUser ? (
              <>
                <button onClick={() => navigate('games')} className="btn-accent px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl font-semibold text-sm sm:text-lg">🎮 Browse Games</button>
                {isAdmin && <button onClick={() => navigate('admin')} className="btn-primary px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl font-semibold text-sm sm:text-lg">⚙️ Admin Panel</button>}
              </>
            ) : (
              <button onClick={() => navigate('login')} className="btn-accent px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl font-semibold text-sm sm:text-lg">🚀 Get Started</button>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 sm:gap-3 mb-6 sm:mb-8">
        {[
          { v: files.length + '+', l: 'Products' },
          { v: prices.length + '+', l: 'Plans' },
          { v: '24/7', l: 'Support' },
          { v: '₹29', l: 'Start' },
        ].map(s => (
          <div key={s.l} className="glass-card rounded-lg sm:rounded-xl p-2 sm:p-4 text-center">
            <p className="text-base sm:text-2xl font-bold bg-gradient-to-r from-primary-light to-accent bg-clip-text text-transparent">{s.v}</p>
            <p className="text-text-muted text-[9px] sm:text-xs">{s.l}</p>
          </div>
        ))}
      </div>

      {/* Features */}
      <h2 className="text-base sm:text-xl font-bold mb-3 sm:mb-4">✨ Why Choose Us</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-6 sm:mb-8">
        {features.map(f => (
          <div key={f.title} className="glass-card rounded-lg sm:rounded-xl p-3 sm:p-5 hover:border-primary/30 transition-all">
            <div className="text-2xl sm:text-3xl mb-1.5 sm:mb-3">{f.icon}</div>
            <h3 className="font-semibold text-xs sm:text-base mb-0.5 sm:mb-1">{f.title}</h3>
            <p className="text-text-muted text-[10px] sm:text-sm">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      {currentUser && (
        <div className="glass-card rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8">
          <h2 className="text-base sm:text-xl font-bold mb-3 sm:mb-4">⚡ Quick Actions</h2>
          <div className="grid grid-cols-4 gap-2 sm:gap-3">
            {[
              { icon: '🎮', label: 'Games', page: 'games' },
              { icon: '🎁', label: 'Trial', page: 'profile' },
              { icon: '👤', label: 'Profile', page: 'profile' },
              { icon: '💬', label: 'Feedback', page: 'profile' },
            ].map(a => (
              <button key={a.label} onClick={() => navigate(a.page)} className="bg-surface-lighter hover:bg-primary/20 p-2.5 sm:p-4 rounded-lg sm:rounded-xl text-center transition-all">
                <div className="text-xl sm:text-2xl mb-0.5">{a.icon}</div>
                <p className="text-[10px] sm:text-sm">{a.label}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-center py-4 sm:py-6 border-t border-border">
        <p className="text-text-muted text-xs sm:text-sm">🎮 KITY DIGITAL STORE • @KITYGAMER</p>
        {upi && <p className="text-text-muted text-[10px] sm:text-xs mt-0.5">UPI: {upi}</p>}
      </div>
    </div>
  );
};

export default HomePage;
