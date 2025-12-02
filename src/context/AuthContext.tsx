import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { Auth } from "../components/Auth";
import type { User } from "../types/Model";
import { fetchUserFromToken } from "@/services";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  authenticate: (token: string, user: User) => void;
  setUser: (user: User | null) => void;
  logOut: () => void;
  renderAuth: () => React.ReactElement | null;
  showAuthModal: (mode: "signIn" | "signUp") => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<"signIn" | "signUp" | null>(null);

  const fetchUser = useCallback(async () => {
    const token = localStorage.getItem("accountToken");

    if (!user && token) {
      try {
        const user = await fetchUserFromToken(token);
        setUser(user);
      } catch (error: any) {
        if (error?.response?.status === 401) {
          localStorage.removeItem("accountToken");
        }
        console.error("Error fetching user:", error);
      }
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const authenticate = (token: string, user: User) => {
    localStorage.setItem("accountToken", token);
    setUser(user);
  };


  const logOut = useCallback(() => {
    localStorage.removeItem("accountToken");
    setUser(null);
  }, []);

  const showAuthModal = (mode: "signIn" | "signUp") => {
    setAuthMode(mode);
    setShowAuth(true);
  };

  const renderAuth = () =>
    showAuth ? <Auth mode={authMode} onClose={() => setShowAuth(false)} /> : null;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        authenticate,
        setUser,
        logOut,
        renderAuth,
        showAuthModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return {
    ...context,
    loggedIn: !!context.user,
    currentUser: context.user, // Alias for ChatBox compatibility
  };
};

export { useAuth };
