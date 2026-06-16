import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { AuthResponse, User } from "../types/index";
import { api } from "../utils/api";

interface AuthContextState {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string,
    role: User["role"],
    location: {
      type: "Point";
      coordinates: [number, number];
    },
  ) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextState | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

const AUTH_TOKEN_KEY = "secondServeToken";
const AUTH_USER_KEY = "secondServeUser";

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem(AUTH_USER_KEY);
    return stored ? (JSON.parse(stored) as User) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(AUTH_TOKEN_KEY));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      api.defaults.headers.common.Authorization = `Bearer ${token}`;
      localStorage.setItem(AUTH_TOKEN_KEY, token);
    } else {
      delete api.defaults.headers.common.Authorization;
      localStorage.removeItem(AUTH_TOKEN_KEY);
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_USER_KEY);
    }
  }, [user]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await api.post<AuthResponse>("/api/auth/login", { email, password });
      setToken(response.data.token);
      setUser(response.data.user);
    } finally {
      setLoading(false);
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    role: User["role"],
    location: { type: "Point"; coordinates: [number, number] },
  ) => {
    setLoading(true);
    try {
      const response = await api.post<AuthResponse>("/api/auth/register", {
        name,
        email,
        password,
        role,
        location,
      });
      setToken(response.data.token);
      setUser(response.data.user);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
  };

  const value = useMemo(
    () => ({ user, token, loading, login, register, logout, setUser }),
    [user, token, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
