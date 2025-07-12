
"use client"

import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { Dispatch, SetStateAction } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

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
  api: any; 
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
  api: null,
});

const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  
  const baseURL = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:8080/api";

  
  const api = axios.create({
    baseURL,
    withCredentials: true,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const router = useRouter();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [authToken, setAuthToken] = useState<AccessTokenType | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfoType | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  
  useEffect(() => {
    
    const requestInterceptor = api.interceptors.request.use(
      (config) => {
        if (authToken?.access) {
          config.headers.Authorization = `Bearer ${authToken.access}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    
    const responseInterceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401 && authToken) {
          
          try {
            const refreshResponse = await api.post('/users/refresh-token');
            if (refreshResponse.data.success) {
              const newToken = {
                access: refreshResponse.data.data.accessToken,
                refresh: authToken.refresh,
              };
              setAuthToken(newToken);
              localStorage.setItem("accessToken", JSON.stringify(newToken));
              
              
              error.config.headers.Authorization = `Bearer ${newToken.access}`;
              return api.request(error.config);
            }
          } catch (refreshError) {
            
            userLogout();
          }
        }
        return Promise.reject(error);
      }
    );

    
    return () => {
      api.interceptors.request.eject(requestInterceptor);
      api.interceptors.response.eject(responseInterceptor);
    };
  }, [authToken]);

  
  const verifyToken = async () => {
    try {
      const response = await api.get('/users/profile');
      if (response.data.success) {
        const { user } = response.data.data;
        const userData = {
          id: user.id,
          name: user.fullName || user.username,
          email: user.email,
          role: user.role,
          avatar: user.avatar || "",
          reputation: user.reputation || 0
        };
        setUserInfo(userData);
        localStorage.setItem("userInfo", JSON.stringify(userData));
      }
    } catch (error) {
      console.error("Token verification failed:", error);
      
      setAuthToken(null);
      setUserInfo(null);
      localStorage.removeItem("accessToken");
      localStorage.removeItem("userInfo");
    }
  };

  
  useEffect(() => {
    setIsHydrated(true);
    
    const savedToken = localStorage.getItem("accessToken");
    const savedUserInfo = localStorage.getItem("userInfo");
    
    if (savedToken) {
      try {
        const tokenData = JSON.parse(savedToken);
        setAuthToken(tokenData);
        
        
        if (tokenData.access) {
          verifyToken();
        }
      } catch (error) {
        console.error("Error parsing saved token:", error);
        localStorage.removeItem("accessToken");
      }
    }
    
    if (savedUserInfo && !savedToken) {
      
      localStorage.removeItem("userInfo");
    }
  }, []);

  const userLogin = async (
    email: string,
    password: string
  ): Promise<LoginResponseType> => {
    setIsLoading(true);
    try {
      const response = await api.post('/users/login', {
        email, 
        password,
      });

      if (response.data.success) {
        const { user, accessToken } = response.data; 
        
        const tokenData = {
          access: accessToken,
          refresh: "", 
        };
        
        const userData = {
          id: user.id,
          name: user.name, 
          email: user.email,
          role: user.role,
          avatar: "", 
          reputation: 0 
        };

        setAuthToken(tokenData);
        setUserInfo(userData);
        localStorage.setItem("accessToken", JSON.stringify(tokenData));
        localStorage.setItem("userInfo", JSON.stringify(userData));

        
        const urlParams = new URLSearchParams(window.location.search);
        const returnUrl = urlParams.get('from') || '/dashboard';
        router.push(returnUrl);
        
        return { 
          success: true, 
          message: response.data.message || "Login successful" 
        };
      } else {
        return { 
          success: false, 
          message: response.data.message || "Login failed" 
        };
      }
    } catch (error: any) {
      console.error("Login error:", error);
      
      let errorMessage = "Network error. Please check your connection.";
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return {
        success: false,
        message: errorMessage,
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
      const response = await api.post('/users/register', {
        name: name, 
        email,
        password,
        bio: "New user", // Backend requires non-empty bio
        role: "customer", 
      });

      
      if (response.data.accessToken) { 
        const { _id, name, email, role, bio, accessToken } = response.data;
        
        const tokenData = {
          access: accessToken,
          refresh: "", 
        };
        
        const userData = {
          id: _id,
          name: name,
          email: email,
          role: role,
          avatar: "",
          reputation: 0
        };

        setAuthToken(tokenData);
        setUserInfo(userData);
        localStorage.setItem("accessToken", JSON.stringify(tokenData));
        localStorage.setItem("userInfo", JSON.stringify(userData));

        
        router.push('/dashboard');
        
        return { 
          success: true, 
          message: "Registration successful!" 
        };
      } else {
        return { 
          success: false, 
          message: response.data.message || "Registration failed" 
        };
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      
      let errorMessage = "Network error. Please check your connection.";
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return {
        success: false,
        message: errorMessage,
      };
    } finally {
      setIsLoading(false);
    }
  };

  const userLogout = async () => {
    try {
      
      await api.post('/users/logout');
    } catch (error) {
      console.error("Logout error:", error);
      
    }
    
    
    setAuthToken(null);
    setUserInfo(null);
    
    if (typeof window !== "undefined") {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("userInfo");
    }
    
    
    document.cookie = "accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    
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
    api,
  };

  return (
    <GFContext.Provider value={contextData}>{children}</GFContext.Provider>
  );
};


export const createApiInstance = () => {
  const baseURL = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:8080/api";
  return axios.create({
    baseURL,
    withCredentials: true,
    headers: {
      'Content-Type': 'application/json',
    },
  });
};


const useAuth = () => {
  const context = useContext(GFContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export { GFContext, AuthProvider, useAuth };