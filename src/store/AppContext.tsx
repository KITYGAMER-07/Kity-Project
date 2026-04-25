import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  seedDemoData, getAdminId, getCurrentUserId, setCurrentUserId,
  getUserById, addUser, type User
} from './db';

interface AppState {
  currentUserId: string;
  isAdmin: boolean;
  currentUser: User | null;
  currentPage: string;
  login: (username: string) => void;
  loginAsAdmin: () => void;
  logout: () => void;
  navigate: (page: string) => void;
  refreshData: () => void;
  dataVersion: number;
}

const AppContext = createContext<AppState | null>(null);

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentUserId, setCurrentUser] = useState('');
  const [currentPage, setCurrentPage] = useState('home');
  const [dataVersion, setDataVersion] = useState(0);

  useEffect(() => {
    seedDemoData();
    const saved = getCurrentUserId();
    if (saved) {
      setCurrentUser(saved);
    }
  }, []);

  const isAdmin = currentUserId === getAdminId();
  const currentUser = currentUserId ? getUserById(currentUserId) || null : null;

  const login = useCallback((username: string) => {
    const user = addUser(username);
    setCurrentUser(user.id);
    setCurrentUserId(user.id);
    setCurrentPage('home');
    setDataVersion(v => v + 1);
  }, []);

  const loginAsAdmin = useCallback(() => {
    const adminId = getAdminId();
    if (adminId) {
      setCurrentUser(adminId);
      setCurrentUserId(adminId);
      setCurrentPage('admin');
    }
    setDataVersion(v => v + 1);
  }, []);

  const logout = useCallback(() => {
    setCurrentUser('');
    setCurrentUserId('');
    setCurrentPage('home');
    setDataVersion(v => v + 1);
  }, []);

  const navigate = useCallback((page: string) => {
    setCurrentPage(page);
    setDataVersion(v => v + 1);
  }, []);

  const refreshData = useCallback(() => {
    setDataVersion(v => v + 1);
  }, []);

  return (
    <AppContext.Provider value={{
      currentUserId, isAdmin, currentUser, currentPage,
      login, loginAsAdmin, logout, navigate, refreshData, dataVersion
    }}>
      {children}
    </AppContext.Provider>
  );
}
