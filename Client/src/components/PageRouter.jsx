import { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import Hero from './Hero/Hero';
import Register from './Register/Register';
import Login from './Login/Login';
import Dashboard from './Dashboard/Dashboard';
import Assistant from './Assistant/Assistant';
import LawyerListing from './Lawyer/LawyerListing';
import LawyerProfile from './Lawyer/LawyerProfile';
import UserProfile from './Profile/UserProfile';
import UserConsultations from './Consultation/UserConsultations';
import AdminPanel from './Admin/AdminPanel';
import Resources from './Resources/Resources';
import LegalGuide from './LegalGuide/LegalGuide';
import ArticleView from './LegalGuide/ArticleView';
import Chat from './Chat/Chat';

const PageRouter = () => {
  const { page } = useContext(AppContext);
  
  switch(page) {
    case 'resources':
      return <Resources />;
    case 'legal-guide':
      return <LegalGuide />;
    case 'article':
      return <ArticleView />;
    case 'chat':
      return <Chat />;
    case 'register':
    case 'lawyer-register':
      return <Register />;
    case 'login':
    case 'lawyer-login':
      return <Login />;
    case 'dashboard': 
      return <Dashboard />;
    case 'profile':
      return <UserProfile />;
    case 'my-consultations':
      return <UserConsultations />;
    case 'assistant': 
      return <Assistant />;
    case 'lawyers':
      return <LawyerListing />;
    case 'lawyer-dashboard':
      return <LawyerProfile />;
    case 'admin':
      return <AdminPanel />;
    default: 
      return <Hero />;
  }
};

export default PageRouter;
