// ========================================
// App Context — Global State Management
// ========================================
import { createContext, useContext, useReducer, useCallback, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { getAllDocuments } from '../services/storage';

const AppContext = createContext(null);

// Default settings
const DEFAULT_SETTINGS = {
  groqApiKey: '',
  theme: 'light',
  language: 'en',
  onboardingCompleted: false,
  editorFontSize: 16,
  autoSaveInterval: 2000,
  isPro: false,
  apiCalls: 0,
  lastCallDate: null,
  activePersona: 'general', // for Phase 7 Personas
};

// Actions
const actions = {
  SET_USER: 'SET_USER',
  SET_LOADING: 'SET_LOADING',
  SET_SETTINGS: 'SET_SETTINGS',
  UPDATE_SETTINGS: 'UPDATE_SETTINGS',
  SET_DOCUMENTS: 'SET_DOCUMENTS',
  ADD_DOCUMENT: 'ADD_DOCUMENT',
  UPDATE_DOCUMENT: 'UPDATE_DOCUMENT',
  REMOVE_DOCUMENT: 'REMOVE_DOCUMENT',
  SET_CURRENT_DOC: 'SET_CURRENT_DOC',
  SET_SIDEBAR_OPEN: 'SET_SIDEBAR_OPEN',
  ADD_TOAST: 'ADD_TOAST',
  REMOVE_TOAST: 'REMOVE_TOAST',
  SET_PAYWALL_OPEN: 'SET_PAYWALL_OPEN',
};

// Reducer
function appReducer(state, action) {
  switch (action.type) {
    case actions.SET_USER:
      return { ...state, user: action.payload };
    case actions.SET_LOADING:
      return { ...state, loading: action.payload };
    case actions.SET_SETTINGS:
      return { ...state, settings: { ...DEFAULT_SETTINGS, ...action.payload } };
    case actions.UPDATE_SETTINGS:
      return { ...state, settings: { ...state.settings, ...action.payload } };
    case actions.SET_DOCUMENTS:
      return { ...state, documents: action.payload };
    case actions.ADD_DOCUMENT:
      return { ...state, documents: [action.payload, ...state.documents] };
    case actions.UPDATE_DOCUMENT:
      return {
        ...state,
        documents: state.documents.map(d =>
          d.id === action.payload.id ? { ...d, ...action.payload } : d
        ),
      };
    case actions.REMOVE_DOCUMENT:
      return {
        ...state,
        documents: state.documents.filter(d => d.id !== action.payload),
        currentDoc: state.currentDoc?.id === action.payload ? null : state.currentDoc,
      };
    case actions.SET_CURRENT_DOC:
      return { ...state, currentDoc: action.payload };
    case actions.SET_SIDEBAR_OPEN:
      return { ...state, sidebarOpen: action.payload };
    case actions.ADD_TOAST:
      return { ...state, toasts: [...state.toasts, action.payload] };
    case actions.REMOVE_TOAST:
      return { ...state, toasts: state.toasts.filter(t => t.id !== action.payload) };
    case actions.SET_PAYWALL_OPEN:
      return { ...state, showPaywall: action.payload };
    default:
      return state;
  }
}

const initialState = {
  user: null,
  loading: true,
  settings: DEFAULT_SETTINGS,
  documents: [],
  currentDoc: null,
  sidebarOpen: true,
  toasts: [],
  showPaywall: false,
};

// Provider
export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Listen to auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        dispatch({ type: actions.SET_USER, payload: user });

        // Load user settings from Firestore
        try {
          const settingsRef = doc(db, 'users', user.uid);
          const settingsSnap = await getDoc(settingsRef);
          if (settingsSnap.exists()) {
            dispatch({ type: actions.SET_SETTINGS, payload: settingsSnap.data() });
          } else {
            // First time user — save default settings
            await setDoc(settingsRef, {
              ...DEFAULT_SETTINGS,
              email: user.email,
              displayName: user.displayName || '',
              createdAt: new Date().toISOString(),
            });
          }
        } catch (err) {
          console.error('Error loading settings:', err);
        }

        // Load documents from IndexedDB
        try {
          const docs = await getAllDocuments();
          dispatch({ type: actions.SET_DOCUMENTS, payload: docs });
        } catch (err) {
          console.error('Error loading documents:', err);
        }
      } else {
        dispatch({ type: actions.SET_USER, payload: null });
        dispatch({ type: actions.SET_SETTINGS, payload: DEFAULT_SETTINGS });
        dispatch({ type: actions.SET_DOCUMENTS, payload: [] });
      }
      dispatch({ type: actions.SET_LOADING, payload: false });
    });

    return () => unsubscribe();
  }, []);

  // Apply theme
  useEffect(() => {
    const theme = state.settings.theme;
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, [state.settings.theme]);

  // Actions
  const setUser = useCallback((user) => {
    dispatch({ type: actions.SET_USER, payload: user });
  }, []);

  const updateSettings = useCallback(async (newSettings) => {
    dispatch({ type: actions.UPDATE_SETTINGS, payload: newSettings });

    // Persist to Firestore
    if (state.user) {
      try {
        const settingsRef = doc(db, 'users', state.user.uid);
        await setDoc(settingsRef, newSettings, { merge: true });
      } catch (err) {
        console.error('Error saving settings:', err);
      }
    }
  }, [state.user]);

  const setDocuments = useCallback((docs) => {
    dispatch({ type: actions.SET_DOCUMENTS, payload: docs });
  }, []);

  const addDocument = useCallback((docData) => {
    dispatch({ type: actions.ADD_DOCUMENT, payload: docData });
  }, []);

  const updateDocument = useCallback((docData) => {
    dispatch({ type: actions.UPDATE_DOCUMENT, payload: docData });
  }, []);

  const removeDocument = useCallback((docId) => {
    dispatch({ type: actions.REMOVE_DOCUMENT, payload: docId });
  }, []);

  const setCurrentDoc = useCallback((docData) => {
    dispatch({ type: actions.SET_CURRENT_DOC, payload: docData });
  }, []);

  const setSidebarOpen = useCallback((open) => {
    dispatch({ type: actions.SET_SIDEBAR_OPEN, payload: open });
  }, []);

  const addToast = useCallback((toast) => {
    const id = Date.now() + Math.random();
    dispatch({ type: actions.ADD_TOAST, payload: { ...toast, id } });
    // Auto-remove after duration
    setTimeout(() => {
      dispatch({ type: actions.REMOVE_TOAST, payload: id });
    }, toast.duration || 3000);
    return id;
  }, []);

  // Monetization Quota Check
  const checkApiQuota = useCallback(async () => {
    if (state.settings.isPro) return true;

    const today = new Date().toISOString().split('T')[0];
    const { apiCalls, lastCallDate } = state.settings;

    let currentCalls = lastCallDate === today ? (apiCalls || 0) : 0;
    
    // Free tier limit: 10 calls/day
    if (currentCalls >= 10) {
      return false; // Exceeded
    }

    // Increment silently
    await updateSettings({ apiCalls: currentCalls + 1, lastCallDate: today });
    return true;
  }, [state.settings, updateSettings]);

  const upgradeToPro = useCallback(async () => {
    await updateSettings({ isPro: true });
    dispatch({ type: actions.SET_PAYWALL_OPEN, payload: false });
    addToast({ type: 'success', message: 'Payment simulated successfully. Welcome to WriteAI Pro!' });
  }, [updateSettings, addToast]);

  const openPaywall = useCallback(() => {
    dispatch({ type: actions.SET_PAYWALL_OPEN, payload: true });
  }, []);

  const closePaywall = useCallback(() => {
    dispatch({ type: actions.SET_PAYWALL_OPEN, payload: false });
  }, []);

  const value = {
    ...state,
    setUser,
    updateSettings,
    setDocuments,
    addDocument,
    updateDocument,
    removeDocument,
    setCurrentDoc,
    setSidebarOpen,
    addToast,
    checkApiQuota,
    upgradeToPro,
    openPaywall,
    closePaywall,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}

export { DEFAULT_SETTINGS };
