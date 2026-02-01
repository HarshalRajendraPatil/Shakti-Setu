import { useEffect, useContext } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppProvider, AppContext } from "./context/AppContext";
import { getCurrentUser } from "./store/slices/authSlice";
import { getCurrentLawyer } from "./store/slices/lawyerSlice";
import Header from "./components/Header/Header";
import PageRouter from "./components/PageRouter";
import "./styles/App.css";

function AppContent() {
  const dispatch = useDispatch();
  const { setUser, setPage, setOpenArticleId } = useContext(AppContext);
  const { user } = useSelector((state) => state.auth);
  const { lawyer } = useSelector((state) => state.lawyer);

  // When opened in new window with ?articleId=xxx, show article view
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const articleId = params.get('articleId');
    if (articleId) {
      setOpenArticleId(articleId);
      setPage('article');
    }
  }, [setPage, setOpenArticleId]);

  // Restore user session from token on load/refresh
  useEffect(() => {
    const userToken = localStorage.getItem("token");
    if (userToken && !user) {
      dispatch(getCurrentUser());
    }
  }, [dispatch, user]);

  // Restore lawyer session from token on load/refresh
  useEffect(() => {
    const lawyerToken = localStorage.getItem("lawyerToken");
    if (lawyerToken && !lawyer) {
      dispatch(getCurrentLawyer());
    }
  }, [dispatch, lawyer]);

  // Keep AppContext user in sync with Redux (for components that still use context)
  useEffect(() => {
    setUser(user || null);
  }, [user, setUser]);

  return (
    <div className="app-root">
      <div className="background-overlay"></div>
      <Header />
      <main className="main-content">
        <PageRouter />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
