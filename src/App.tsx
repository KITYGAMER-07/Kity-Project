import React from 'react';
import { AppProvider, useApp } from './store/AppContext';
import Navbar from './components/Navbar';
import LoginPage from './components/LoginPage';
import HomePage from './components/HomePage';
import GamesPage from './components/GamesPage';
import GameDetailPage from './components/GameDetailPage';
import ProfilePage from './components/ProfilePage';
import AdminPanel from './components/AdminPanel';

const AppContent: React.FC = () => {
  const { currentPage, currentUser } = useApp();

  // Parse page routing
  let page: React.ReactNode;

  if (!currentPage || currentPage === 'home') {
    page = <HomePage />;
  } else if (currentPage === 'login') {
    page = <LoginPage />;
  } else if (currentPage === 'games') {
    page = currentUser ? <GamesPage /> : <LoginPage />;
  } else if (currentPage.startsWith('game-detail-')) {
    const fileId = parseInt(currentPage.replace('game-detail-', ''));
    page = currentUser ? <GameDetailPage fileId={fileId} /> : <LoginPage />;
  } else if (currentPage === 'profile') {
    page = currentUser ? <ProfilePage /> : <LoginPage />;
  } else if (currentPage === 'admin' || currentPage.startsWith('admin-')) {
    page = currentUser ? <AdminPanel /> : <LoginPage />;
  } else {
    page = <HomePage />;
  }

  return (
    <div className="min-h-screen bg-bg">
      <Navbar />
      <main className="pb-8">
        {page}
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;
