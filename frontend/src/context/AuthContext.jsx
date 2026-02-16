import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch(
          "http://localhost:8000/api/auth/me",
          { method:"GET", credentials: "include" }
        );

        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          setUser(null); // changed: clear stale user when /auth/me is unauthorized
        }
      } catch{
        setUser(null); // changed: fail safely if backend is temporarily unreachable
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line 
export const useAuth = () => useContext(AuthContext);
