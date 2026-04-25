import React from 'react';
import { useApp } from '../store/AppContext';
import { getFiles, getPrices, getSetting } from '../store/db';
import { Icon, IconName } from './Icon';
import { BrandMark, KityGamerBadge } from './ProductVisual';

interface Feature {
  icon: IconName;
  title: string;
  desc: string;
  cls: string;
}

interface QuickAction {
  icon: IconName;
  label: string;
  page: string;
  cls: string;
}

const HomePage: React.FC = () => {
  const { currentUser, isAdmin, navigate } = useApp();
  const files = getFiles();
  const prices = getPrices();
  const upi = getSetting('UPI_ID');

  const features: Feature[] = [
    { icon: 'gamepad', title: 'Premium Games', desc: 'BGMI, Free Fire, PUBG & more',  cls: 'icon-box' },
    { icon: 'key',     title: 'Instant Keys',  desc: 'Activation keys delivered fast', cls: 'icon-box-accent' },
    { icon: 'shield',  title: 'Secure Payment',desc: 'UPI verified transactions',      cls: 'icon-box-success' },
    { icon: 'gift',    title: 'Free Trials',   desc: 'Try before you buy',             cls: 'icon-box-warning' },
  ];

  const minPrice = prices.length ? Math.min(...prices.map(p => p.price)) : 0;

  const stats = [
    { v: `${files.length}+`,   l: 'Products' },
    { v: `${prices.length}+`,  l: 'Plans' },
    { v: '24/7',               l: 'Support' },
    { v: minPrice ? `₹${minPrice}` : '₹0', l: 'Starts' },
  ];

  const quickActions: QuickAction[] = [
    { icon: 'gamepad', label: 'Games',    page: 'games',   cls: 'icon-box' },
    { icon: 'gift',    label: 'Trial',    page: 'profile', cls: 'icon-box-warning' },
    { icon: 'user',    label: 'Profile',  page: 'profile', cls: 'icon-box-accent' },
    { icon: 'message', label: 'Feedback', page: 'profile', cls: 'icon-box-info' },
  ];

  return (
    <div className="px-3 sm:px-4 py-4 sm:py-6 animate-fade-in max-w-7xl mx-auto">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl mb-6 sm:mb-8 panel-card border-0">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/25 via-bg/0 to-accent/15" />
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-12 -right-12 w-56 h-56 bg-accent/15 rounded-full blur-3xl" />
        <div className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(to_right,rgba(255,255,255,0.7)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.7)_1px,transparent_1px)] [background-size:32px_32px]" />

        <div className="relative px-5 sm:px-12 py-8 sm:py-14 text-center">
          <div className="flex justify-center mb-4">
            <BrandMark className="w-14 h-14 sm:w-20 sm:h-20" />
          </div>
          <div className="flex justify-center mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-text-secondary text-[10px] sm:text-xs">
              <Icon name="sparkles" className="w-3 h-3 text-accent" />
              Premium digital store
            </span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-3 leading-tight">
            <span className="bg-gradient-to-r from-primary-light via-white to-accent bg-clip-text text-transparent">
              KITY DIGITAL STORE
            </span>
          </h1>
          <p className="text-text-secondary text-sm sm:text-lg max-w-xl mx-auto">
            Premium game keys & digital products, delivered instantly after admin approval.
          </p>
          <p className="text-text-muted text-[11px] sm:text-xs mt-2 mb-6 inline-flex items-center gap-1.5 flex-wrap justify-center">
            <span>Crafted by</span>
            <KityGamerBadge />
          </p>

          <div className="flex flex-col sm:flex-row gap-2.5 justify-center items-stretch sm:items-center">
            {currentUser ? (
              <>
                <button
                  onClick={() => navigate('games')}
                  className="btn-accent px-6 sm:px-8 py-3 rounded-xl text-sm sm:text-base"
                >
                  <Icon name="gamepad" className="w-4 h-4" />
                  Browse store
                  <Icon name="arrow-right" className="w-4 h-4" />
                </button>
                {isAdmin && (
                  <button
                    onClick={() => navigate('admin')}
                    className="btn-primary px-6 sm:px-8 py-3 rounded-xl text-sm sm:text-base"
                  >
                    <Icon name="gear" className="w-4 h-4" />
                    Admin panel
                  </button>
                )}
              </>
            ) : (
              <button
                onClick={() => navigate('login')}
                className="btn-accent px-6 sm:px-8 py-3 rounded-xl text-sm sm:text-base"
              >
                <Icon name="rocket" className="w-4 h-4" />
                Get started
                <Icon name="arrow-right" className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 mb-6 sm:mb-8">
        {stats.map(s => (
          <div key={s.l} className="metric-card p-3 sm:p-5 text-center">
            <p className="text-xl sm:text-3xl font-extrabold bg-gradient-to-r from-primary-light to-accent bg-clip-text text-transparent">
              {s.v}
            </p>
            <p className="text-text-muted text-[10px] sm:text-xs mt-1 uppercase tracking-wider">{s.l}</p>
          </div>
        ))}
      </div>

      {/* Features */}
      <h2 className="section-title mb-3 sm:mb-4">
        <Icon name="sparkles" className="w-4 h-4 text-accent" />
        Why choose us
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 mb-6 sm:mb-8">
        {features.map(f => (
          <div key={f.title} className="panel-card p-3.5 sm:p-5 hover:border-primary/40 transition-colors">
            <span className={`icon-box ${f.cls} mb-3`}>
              <Icon name={f.icon} className="w-5 h-5" />
            </span>
            <h3 className="font-semibold text-sm sm:text-base mb-1">{f.title}</h3>
            <p className="text-text-muted text-[11px] sm:text-sm leading-snug">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      {currentUser && (
        <div className="panel-card p-4 sm:p-6 mb-6 sm:mb-8">
          <h2 className="section-title mb-3 sm:mb-4">
            <Icon name="zap" className="w-4 h-4 text-accent" />
            Quick actions
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
            {quickActions.map(a => (
              <button
                key={a.label}
                onClick={() => navigate(a.page)}
                className="group flex items-center gap-3 sm:gap-3 p-3 sm:p-4 rounded-xl bg-surface-lighter/60 border border-border hover:border-primary/40 hover:bg-primary/5 transition-all text-left"
              >
                <span className={`icon-box ${a.cls} flex-shrink-0`}>
                  <Icon name={a.icon} className="w-4 h-4 sm:w-5 sm:h-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-semibold truncate">{a.label}</p>
                  <p className="text-[10px] text-text-muted">Open</p>
                </div>
                <Icon name="chevron-right" className="w-4 h-4 text-text-muted group-hover:text-white transition-colors" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-border pt-4 sm:pt-5 text-center">
        <div className="inline-flex items-center gap-2 text-text-muted text-xs sm:text-sm flex-wrap justify-center">
          <BrandMark className="w-4 h-4" />
          <span>KITY DIGITAL STORE</span>
          <span className="text-border">•</span>
          <KityGamerBadge />
        </div>
        {upi && (
          <p className="text-text-muted text-[10px] sm:text-xs mt-2 inline-flex items-center gap-1.5">
            <Icon name="wallet" className="w-3 h-3" /> UPI: <span className="font-mono">{upi}</span>
          </p>
        )}
      </footer>
    </div>
  );
};

export default HomePage;
