
"use client"

import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { Dispatch, SetStateAction } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string
  name: string
  email: string
  avatar?: string
  reputation?: number
  role: "guest" | "user" | "admin"
}

interface AccessTokenType {
  access: string;
  refresh: string;
}

interface UserInfoType {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  reputation?: number;
}

interface LoginResponseType {
  success: boolean;
  message: string;
}

interface GFContextType {
  authToken: AccessTokenType | null;
  setAuthToken: Dispatch<SetStateAction<AccessTokenType | null>>;
  logout: () => void;
  baseURL: string;
  userInfo: UserInfoType | null;
  setUserInfo: Dispatch<SetStateAction<UserInfoType | null>>;
  login: (email: string, password: string) => Promise<LoginResponseType>;
  register: (name: string, email: string, password: string) => Promise<LoginResponseType>;
  isLoading: boolean;
  isHydrated: boolean;
}

export type { GFContextType, User, UserInfoType, LoginResponseType, AccessTokenType };

const GFContext = createContext<GFContextType>({
  authToken: null,
  setAuthToken: () => {},
  logout: () => {},
  baseURL: "",
  userInfo: null,
  setUserInfo: () => {},
  login: async () => ({ success: false, message: "" }),
  register: async () => ({ success: false, message: "" }),
  isLoading: false,
  isHydrated: false,
});

const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Use localhost:3000 for Node.js backend
  const baseURL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:3000';

  const router = useRouter();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [authToken, setAuthToken] = useState<AccessTokenType | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfoType | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // Handle hydration
  useEffect(() => {
    setIsHydrated(true);
    // Load saved auth data after hydration
    const savedToken = localStorage.getItem("accessToken");
    const savedUserInfo = localStorage.getItem("userInfo");
    
    if (savedToken) {
      try {
        setAuthToken(JSON.parse(savedToken));
      } catch (error) {
        console.error("Error parsing saved token:", error);
        localStorage.removeItem("accessToken");
      }
    }
    
    if (savedUserInfo) {
      try {
        setUserInfo(JSON.parse(savedUserInfo));
      } catch (error) {
        console.error("Error parsing saved user info:", error);
        localStorage.removeItem("userInfo");
      }
    }
  }, []);

  const userLogin = async (
    email: string,
    password: string
  ): Promise<LoginResponseType> => {
    setIsLoading(true);
    try {
      // Mock authentication - simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock validation
      if (email === "test@example.com" && password === "password123") {
        // Mock token data
        const tokenData = {
          access: "mock-jwt-token-12345",
          refresh: "mock-refresh-token-67890"
        };
        
        // Mock user data
        const userData = {
          id: "1",
          name: "John Doe",
          email: email,
          role: "user",
          avatar: "",
          reputation: 1250
        };

        setAuthToken(tokenData);
        setUserInfo(userData);
        localStorage.setItem("accessToken", JSON.stringify(tokenData));
        localStorage.setItem("userInfo", JSON.stringify(userData));
        
        // Store access token in cookie for middleware
        document.cookie = `accessToken=${tokenData.access}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
        document.cookie = `user_role=${encodeURIComponent(userData.role)}; path=/`;

        // Check if there's a return URL, otherwise go to home
        const urlParams = new URLSearchParams(window.location.search);
        const returnUrl = urlParams.get('from') || '/';
        router.push(returnUrl);
        return { success: true, message: "Login successful" };
      } else {
        return { success: false, message: "Invalid email or password" };
      }
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        message: "Network error. Please check your connection.",
      };
    } finally {
      setIsLoading(false);
    }
  };

  const userRegister = async (
    name: string,
    email: string,
    password: string
  ): Promise<LoginResponseType> => {
    setIsLoading(true);
    try {
      // Mock registration - simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simple validation - check if email already exists (mock)
      if (email === "test@example.com") {
        return {
          success: false,
          message: "Email already exists",
        };
      }
      
      // Mock successful registration
      return { success: true, message: "Registration successful! Please login with your credentials." };
    } catch (error) {
      console.error("Registration error:", error);
      return {
        success: false,
        message: "Network error. Please check your connection.",
      };
    } finally {
      setIsLoading(false);
    }
  };

  const userLogout = () => {
    setAuthToken(null);
    setUserInfo(null);
    typeof window !== "undefined" && localStorage.removeItem("accessToken");
    typeof window !== "undefined" && localStorage.removeItem("userInfo");
    
    // Clear cookies
    document.cookie = "accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    
    router.push("/");
  };

  const contextData: GFContextType = {
    authToken,
    setAuthToken,
    logout: userLogout,
    baseURL,
    userInfo,
    setUserInfo,
    login: userLogin,
    register: userRegister,
    isLoading,
    isHydrated,
  };

  return (
    <GFContext.Provider value={contextData}>{children}</GFContext.Provider>
  );
};

// Custom hook to use the auth context
const useAuth = () => {
  const context = useContext(GFContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export { GFContext, AuthProvider, useAuth };