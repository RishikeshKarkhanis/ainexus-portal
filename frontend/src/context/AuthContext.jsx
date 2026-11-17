import { createContext, useContext, useEffect, useState } from "react";

import { loginUser, registerUser, logoutUser, getCurrentUser } from "../services/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore user session when application starts
  useEffect(() => {
    const token = localStorage.getItem("authToken");

    if (token) {
      const currentUser = getCurrentUser();

      if (currentUser) {
        setUser({
          userId: currentUser.userId,
          name: currentUser.name,
          email: currentUser.email,
          isAdmin: currentUser.isAdmin === true,
        });
      }
    }

    setLoading(false);
  }, []);

  // Login
  const login = async (credentials) => {
    const data = await loginUser(credentials);

    const userData = {
      userId: data.userId,
      name: data.name,
      email: data.email,
      isAdmin: data.isAdmin === true,
    };

    localStorage.setItem("authUser", JSON.stringify(userData));

    setUser(userData);

    return data;
  };

  // Register
  const register = async (userData) => {
    return registerUser(userData);
  };

  // Logout
  const logout = () => {
    logoutUser();
    setUser(null);
  };

  const value = {
    user,
    loading,
    isAuthenticated: Boolean(user),
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
