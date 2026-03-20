import { useState, useContext } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Globe,
  Shield,
  Menu,
  X,
  LogOut,
  LogIn,
  Home,
  User,
  MessageSquare,
  Scale,
  LayoutDashboard,
  Bot,
  Settings,
  ChevronDown,
  BookOpen,
  MessageCircle,
  FileText,
  BarChart3,
  UsersRound,
} from "lucide-react";
import { AppContext } from "../../context/AppContext";
import { logout } from "../../store/slices/authSlice";
import { logoutLawyer } from "../../store/slices/lawyerSlice";

const ICON_MAP = {
  home: Home,
  resources: BookOpen,
  "legal-guide": FileText,
  profile: User,
  "my-consultations": MessageSquare,
  lawyers: Scale,
  dashboard: LayoutDashboard,
  assistant: Bot,
  admin: Settings,
  "lawyer-dashboard": User,
  chat: MessageCircle,
  feedback: BarChart3,
  community: UsersRound,
};

const Header = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const { isAuthenticated: isLawyerAuthenticated, lawyer } = useSelector(
    (state) => state.lawyer,
  );
  const { t, language, setLanguage, setPage, page, supportedLanguages } = useContext(AppContext);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const isAdmin = user?.role === "admin";
  const isUser = isAuthenticated && !isLawyerAuthenticated;
  const isLawyer = isLawyerAuthenticated;
  const languageCodes = supportedLanguages.map((lang) => lang.code);
  const currentLangIndex = languageCodes.indexOf(language);
  const nextLangCode = languageCodes[(currentLangIndex + 1) % languageCodes.length] || "en";
  const currentLanguageMeta = supportedLanguages.find((lang) => lang.code === language) || supportedLanguages[0];
  const nextLanguageMeta = supportedLanguages.find((lang) => lang.code === nextLangCode) || supportedLanguages[0];

  const handleLogout = () => {
    if (isUser) dispatch(logout());
    if (isLawyer) dispatch(logoutLawyer());
    setPage("home");
    setUserMenuOpen(false);
  };

  const getNavItems = () => {
    const baseItems = [
      { id: "home", label: t.navHome },
      { id: "resources", label: t.navResources },
      { id: "legal-guide", label: t.navLegalGuide },
      { id: "community", label: t.navCommunity || "Community" },
    ];
    if (isUser) {
      return [
        ...baseItems,
        { id: "profile", label: t.navProfile },
        { id: "my-consultations", label: t.navMyConsultations },
        { id: "chat", label: t.navChat },
        { id: "lawyers", label: t.navFindLawyers },
        { id: "dashboard", label: t.navDashboard },
        { id: "feedback", label: t.navFeedback || "Feedback" },
        { id: "assistant", label: t.navAssistant },
        ...(isAdmin ? [{ id: "admin", label: t.navAdmin }] : []),
      ];
    }
    if (isLawyer) {
      return [
        ...baseItems,
        { id: "lawyer-dashboard", label: t.navLawyerProfile },
        { id: "feedback", label: t.navFeedback || "Feedback" },
        { id: "chat", label: t.navChat },
        { id: "lawyers", label: t.navBrowseLawyers },
      ];
    }
    return [
      ...baseItems,
      { id: "lawyers", label: t.navFindLawyers },
      { id: "assistant", label: t.navAssistant },
    ];
  };

  const navItems = getNavItems();

  return (
    <header className="app-header">
      <div className="header-container">
        <div className="header-content">
          <div className="logo-section" onClick={() => setPage("home")}>
            <div className="logo-icon">
              <Shield size={22} color="white" />
            </div>
            <span className="logo-text">{t.title}</span>
          </div>

          <nav className="desktop-nav nav-compact">
            {navItems.map((item) => {
              const Icon = ICON_MAP[item.id] || Home;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setPage(item.id);
                    setUserMenuOpen(false);
                  }}
                  className={`nav-icon-btn ${page === item.id ? "active" : ""}`}
                  title={item.label}
                  aria-label={item.label}
                >
                  <Icon size={20} />
                </button>
              );
            })}
            <span className="nav-divider" aria-hidden="true" />
            {isUser || isLawyer ? (
              <div className="nav-user-wrap">
                <button
                  className="nav-icon-btn nav-user-btn"
                  onClick={() => setUserMenuOpen((o) => !o)}
                  title={isUser ? user?.name : lawyer?.name}
                  aria-label={t.accountMenu}
                  aria-expanded={userMenuOpen}
                >
                  <User size={20} />
                  <span className="nav-user-name">
                    {(isUser ? user?.name : lawyer?.name)?.split(" ")[0] || t.account}
                  </span>
                  <ChevronDown size={14} style={{ opacity: 0.8 }} />
                </button>
                {userMenuOpen && (
                  <>
                    <div
                      className="nav-dropdown-backdrop"
                      onClick={() => setUserMenuOpen(false)}
                      aria-hidden="true"
                    />
                    <div className="nav-dropdown">
                      <div className="nav-dropdown-header">
                        {isUser ? user?.name : lawyer?.name}
                        {isLawyer && (
                          <span className="nav-badge-lawyer">Lawyer</span>
                        )}
                      </div>
                      <button
                        onClick={handleLogout}
                        className="nav-dropdown-item nav-dropdown-logout"
                      >
                        <LogOut size={18} />
                        {t.logout}
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
                <button
                  onClick={() => setPage("register")}
                  className="nav-icon-btn"
                  title={t.register}
                  aria-label={t.register}
                >
                  <User size={20} color="#c084fc" />
                </button>
                <button
                  onClick={() => setPage("login")}
                  className="nav-icon-btn"
                  title={t.login}
                  aria-label={t.login}
                >
                  <LogIn size={20} color="#a855f7" />
                </button>
              </>
            )}
            <button
              onClick={() => setLanguage(nextLangCode)}
              className="nav-icon-btn"
              title={`${t.languageSwitch}: ${currentLanguageMeta.nativeName} -> ${nextLanguageMeta.nativeName}`}
              aria-label={`${t.languageSwitch} ${currentLanguageMeta.nativeName}`}
            >
              <Globe size={20} color="#c084fc" />
              <span className="nav-user-name" style={{ marginLeft: 6 }}>
                {currentLanguageMeta.nativeName}
              </span>
            </button>
          </nav>

          <div className="mobile-toggle">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? t.closeMenu : t.openMenu}
            >
              {mobileMenuOpen ? <X size={24} color="white" /> : <Menu size={24} color="white" />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="mobile-menu">
          <div className="mobile-menu-nav">
            {navItems.map((item) => {
              const Icon = ICON_MAP[item.id] || Home;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setPage(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`mobile-nav-link ${page === item.id ? "active" : ""}`}
                >
                  <Icon size={20} />
                  {item.label}
                </button>
              );
            })}
          </div>
          <div className="mobile-menu-footer">
            {isUser || isLawyer ? (
              <div className="mobile-menu-user">
                {isUser ? user?.name : lawyer?.name}
                {isLawyer && <span className="nav-badge-lawyer">Lawyer</span>}
              </div>
            ) : null}
            <div className="mobile-menu-actions">
              {isUser || isLawyer ? (
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="mobile-lang-toggle mobile-logout"
                >
                  <LogOut size={20} />
                  {t.logout}
                </button>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setPage("register");
                      setMobileMenuOpen(false);
                    }}
                    className="mobile-lang-toggle"
                  >
                    <User size={20} />
                    {t.register}
                  </button>
                  <button
                    onClick={() => {
                      setPage("login");
                      setMobileMenuOpen(false);
                    }}
                    className="mobile-lang-toggle"
                  >
                    <LogIn size={20} />
                    {t.login}
                  </button>
                </>
              )}
              <button
                onClick={() => {
                  setLanguage(nextLangCode);
                  setMobileMenuOpen(false);
                }}
                className="mobile-lang-toggle"
              >
                <Globe size={20} />
                {`${currentLanguageMeta.nativeName} -> ${nextLanguageMeta.nativeName}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
