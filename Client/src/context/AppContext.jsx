import React, { createContext, useState } from 'react';
import { translations } from '../constants/translations';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [language, setLanguage] = useState('en');
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

  const value = {
    language,
    setLanguage,
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
    t: translations[language],
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
