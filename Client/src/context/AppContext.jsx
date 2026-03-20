import React, { createContext, useMemo, useState } from 'react';
import { translations, SUPPORTED_LANGUAGES } from '../constants/translations';

export const AppContext = createContext();

const DEFAULT_LANGUAGE = 'en';

const getInitialLanguage = () => {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE;
  const stored = localStorage.getItem('language');
  if (!stored) return DEFAULT_LANGUAGE;
  return translations[stored] ? stored : DEFAULT_LANGUAGE;
};

export const AppProvider = ({ children }) => {
  const [language, setLanguageState] = useState(getInitialLanguage);
  const [user, setUser] = useState(null);
  const [page, setPage] = useState('home');
  const [openLawyerId, setOpenLawyerId] = useState(null);
  const [openForFollowUp, setOpenForFollowUp] = useState(null); // { lawyerId, subject } for one-click follow-up
  const [openArticleId, setOpenArticleId] = useState(null); // article id when opened in new window (?articleId=)

  // Persisted State
  const [registerForm, setRegisterForm] = useState({ name: '', age: '', state: '', phone: '' });
  const [chatMessages, setChatMessages] = useState([]); 
  const [chatInput, setChatInput] = useState('');
  
  // Dashboard Data
  const [dashboardData, setDashboardData] = useState(null);

  const setLanguage = (nextLanguageOrUpdater) => {
    setLanguageState((prevLanguage) => {
      const nextLanguage =
        typeof nextLanguageOrUpdater === 'function'
          ? nextLanguageOrUpdater(prevLanguage)
          : nextLanguageOrUpdater;
      const safeLanguage = translations[nextLanguage] ? nextLanguage : DEFAULT_LANGUAGE;
      if (typeof window !== 'undefined') {
        localStorage.setItem('language', safeLanguage);
      }
      return safeLanguage;
    });
  };

  const t = useMemo(
    () => ({
      ...translations.en,
      ...(translations[language] || {}),
    }),
    [language],
  );

  const localizeByLanguage = (item, fallback = '') => {
    if (!item || typeof item !== 'object') return fallback;
    return item[language] || item.en || item.hi || fallback;
  };

  const value = {
    language,
    setLanguage,
    supportedLanguages: SUPPORTED_LANGUAGES,
    user,
    setUser,
    page,
    setPage,
    openLawyerId,
    setOpenLawyerId,
    openForFollowUp,
    setOpenForFollowUp,
    openArticleId,
    setOpenArticleId,
    registerForm, 
    setRegisterForm,
    chatMessages,
    setChatMessages,
    chatInput,
    setChatInput,
    dashboardData,
    setDashboardData,
    t,
    localizeByLanguage,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
