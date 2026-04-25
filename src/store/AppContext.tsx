import React, { createContext, useContext, useState, useEffect, useCallback, useReducer } from 'react';
import {
  seedDemoData, getAdminId, getCurrentUserId, setCurrentUserId,
  getUserById, getUserByMobile, getUserByEmail, addUser, User, getUnreadNotifCount
} from '../store/db';

interface AppState {
  currentUserId: string;
  isAdmin: boolean;
  currentUser: User | null;
  currentPage: string;
  login: (username: string, mobile: string, email?: string) => void;
  loginAsAdmin: () => void;
  loginByMobile: (mobile: string) => User | null;
  loginByEmail: (email: string) => User | null;
  logout: () => void;
  navigate: (page: string) => void;
  refreshData: () => void;
  notifCount: number;
  refreshNotifs: () => void;
}

const AppContext = createContext<AppState | null>(null);
export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be within AppProvider');
  return ctx;
}

const emptyFn = () => ({});
function useForceUpdate() {
  const [, s] = useReducer(emptyFn, {});
  return s;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentUserId, setCurrentUser] = useState('');
  const [currentPage, setCurrentPage] = useState('home');
  const [notifCount, setNotifCount] = useState(0);
  const force = useForceUpdate();

  useEffect(() => {
    seedDemoData();
    const saved = getCurrentUserId();
    if (saved) {
      setCurrentUser(saved);
      setNotifCount(getUnreadNotifCount(saved === getAdminId() ? '' : saved));
    }
  }, []);

  const isAdmin = currentUserId === getAdminId();
  const currentUser = currentUserId ? getUserById(currentUserId) || null : null;

  const login = useCallback((username: string, mobile: string, email: string = '') => {
    const user = addUser(username, mobile, email);
    setCurrentUser(user.id); setCurrentUserId(user.id); setCurrentPage('home');
    setNotifCount(getUnreadNotifCount(user.id)); force();
  }, [force]);

  const loginByMobile = useCallback((mobile: string): User | null => {
    const user = getUserByMobile(mobile);
    if (user) { setCurrentUser(user.id); setCurrentUserId(user.id); setCurrentPage('home'); setNotifCount(getUnreadNotifCount(user.id)); force(); return user; }
    return null;
  }, [force]);

  const loginByEmail = useCallback((email: string): User | null => {
    const user = getUserByEmail(email);
    if (user) { setCurrentUser(user.id); setCurrentUserId(user.id); setCurrentPage('home'); setNotifCount(getUnreadNotifCount(user.id)); force(); return user; }
    return null;
  }, [force]);

  const loginAsAdmin = useCallback(() => {
    const adminId = getAdminId();
    if (adminId) { setCurrentUser(adminId); setCurrentUserId(adminId); setCurrentPage('admin'); setNotifCount(getUnreadNotifCount('')); }
    force();
  }, [force]);

  const logout = useCallback(() => {
    setCurrentUser(''); setCurrentUserId(''); setCurrentPage('home'); setNotifCount(0); force();
  }, [force]);

  const navigate = useCallback((page: string) => { setCurrentPage(page); force(); }, [force]);
  const refreshData = useCallback(() => { force(); }, [force]);
  const refreshNotifs = useCallback(() => {
    const uid = currentUserId === getAdminId() ? '' : currentUserId;
    setNotifCount(getUnreadNotifCount(uid));
  }, [currentUserId]);

  useEffect(() => {
    const iv = setInterval(() => {
      const uid = currentUserId === getAdminId() ? '' : currentUserId;
      setNotifCount(getUnreadNotifCount(uid));
    }, 5000);
    return () => clearInterval(iv);
  }, [currentUserId]);

  return (
    <AppContext.Provider value={{
      currentUserId, isAdmin, currentUser, currentPage,
      login, loginAsAdmin, loginByMobile, loginByEmail, logout, navigate, refreshData,
      notifCount, refreshNotifs
    }}>
      {children}
    </AppContext.Provider>
  );
}
