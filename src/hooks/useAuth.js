
import { useState, useEffect, createContext, useContext } from "react";
import { authAPI, setToken, clearToken, getToken } from "../utils/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,               setUser]               = useState(null);
  const [loading,            setLoading]            = useState(true);
  const [mustChangePassword, setMustChangePassword] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (token) {
      authAPI.getMe()
        .then((data) => {
          setUser(data.user);
          setMustChangePassword(data.user?.mustChangePassword || false);
        })
        .catch(() => clearToken())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username, password, role) => {
    const data = await authAPI.login({ username, password, role });
    setToken(data.token);
    setUser(data.user);
    setMustChangePassword(data.mustChangePassword || false);
    return data.user;
  };

  const logout = () => {
    clearToken();
    setUser(null);
    setMustChangePassword(false);
  };


  const isSenior = user?.role === "supervisor" && user?.supervisorLevel === "senior";
  const isJunior = user?.role === "supervisor" && user?.supervisorLevel === "junior";

  return (
    <AuthContext.Provider value={{
      user, loading, login, logout, setUser,
      mustChangePassword, setMustChangePassword,
      isSenior, isJunior,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);