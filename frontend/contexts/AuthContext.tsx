'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useKindeAuth } from '@kinde-oss/kinde-auth-react';
import { User } from '@/types';
import { apiService } from '@/lib/api';
import { socketService } from '@/lib/socket';

interface AuthContextType {
  user: User | null;
  kindeLogin: () => void;
  kindeRegister: () => void;
  traditionalLogin: (email: string, password: string) => Promise<void>;
  traditionalRegister: (userData: { name: string; email: string; password: string; role: string }) => Promise<void>;
  completeSignup: (roleData: {
    role: string;
    specialization?: string;
    department?: string;
    licenseNumber?: string;
    phone?: string;
    emergencyContact?: {
      name: string;
      relationship: string;
      phone: string;
    };
  }) => Promise<void>;
  logout: () => void;
  loading: boolean;
  error: string | null;
  needsRoleSelection: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsRoleSelection, setNeedsRoleSelection] = useState(false);
  const router = useRouter();

  // Kinde hooks
  const { 
    login: kindeLoginFn, 
    register: kindeRegisterFn, 
    logout: kindeLogoutFn,
    getToken, 
    user: kindeUser,
    isAuthenticated,
    isLoading: kindeLoading,
  } = useKindeAuth();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true);

        // Check if user is authenticated with Kinde
        if (isAuthenticated) {
          const accessToken = await getToken();

          console.log('Debug - isAuthenticated:', isAuthenticated);
          console.log('Debug - kindeUser:', JSON.stringify(kindeUser, null, 2));
          console.log('Debug - accessToken:', accessToken ? 'Present' : 'Missing');

          if (kindeUser && accessToken) {
            try {
              console.log('Attempting to sync user:', {
                id: kindeUser.id,
                email: kindeUser.email,
                givenName: kindeUser.givenName,
                familyName: kindeUser.familyName
              });
              // Sync user with our backend
              const response = await apiService.syncUser({
                kindeUser: {
                  id: kindeUser.id,
                  email: kindeUser.email,
                  given_name: kindeUser.givenName,
                  family_name: kindeUser.familyName
                },
                accessToken,
              });

              console.log('Sync user response:', response);

              if (response.success && response.data) {
                console.log('Response data:', response.data);
                if ('isNewUser' in response.data && response.data.isNewUser) {
                  // New user needs to select role
                  console.log('New user detected - redirecting to role selection');
                  setNeedsRoleSelection(true);
                  const newUserData = response.data as { isNewUser: true; userInfo: any; tempToken: string };
                  // Store temporary token separately so regular API calls don't use it
                  localStorage.setItem('tempToken', newUserData.tempToken);
                  router.push('/role-selection');
                } else if ('user' in response.data) {
                  // Existing user with role
                  console.log('Existing user detected - logging in');
                  setUser(response.data.user);
                  setNeedsRoleSelection(false);
                  localStorage.setItem('token', response.data.token);
                  localStorage.setItem('user', JSON.stringify(response.data.user));
                  socketService.connect();
                  router.push('/dashboard');
                }
              }
            } catch (syncError) {
              console.error('Failed to sync user with backend:', syncError);
              setError('Failed to sync user authentication');
            }
          }
        } else {
          // Check if user has traditional login session
          const token = localStorage.getItem('token');
          const storedUser = localStorage.getItem('user');
          const tempToken = localStorage.getItem('tempToken');

          // Helper to detect if a JWT is a temp token by decoding payload
          const isTempJwt = (t: string) : boolean => {
            try {
              const payload = JSON.parse(atob(t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
              return !!payload && !!payload.temp;
            } catch (err) {
              return false;
            }
          };

          // If a tempToken exists, ensure we don't accidentally use it as the main token
          if (tempToken) {
            // If token equals tempToken, clear it to avoid using temp token for protected API calls
            if (token === tempToken) {
              localStorage.removeItem('token');
            }
            // In case user is mid-signup, redirect to role selection
            if (!storedUser) {
              setNeedsRoleSelection(true);
              router.push('/role-selection');
              return;
            }
          }

          // Defensive: if token looks like a temp JWT (older clients may have stored it under 'token'),
          // move it to tempToken and avoid using it as the main token.
          if (token && !storedUser && isTempJwt(token)) {
            localStorage.setItem('tempToken', token);
            localStorage.removeItem('token');
            setNeedsRoleSelection(true);
            router.push('/role-selection');
            return;
          }

          if (token && storedUser) {
            try {
              const parsedUser = JSON.parse(storedUser);
              setUser(parsedUser);
              // Connect to socket
              socketService.connect();
            } catch (error) {
              console.error('Invalid stored user data');
              localStorage.removeItem('token');
              localStorage.removeItem('user');
            }
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setError(error instanceof Error ? error.message : 'Authentication error');
      } finally {
        setLoading(false);
      }
    };

    if (!kindeLoading) {
      initializeAuth();
    }
  }, [isAuthenticated, kindeLoading, kindeUser, getToken]);

  const kindeLogin = () => {
    kindeLoginFn();
  };

  const kindeRegister = () => {
    kindeRegisterFn();
  };

  const traditionalLogin = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiService.login(email, password);

      if (response.success && response.data) {
        setUser(response.data.user);
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        // Connect to socket
        socketService.connect();
        router.push('/dashboard');
      } else {
        throw new Error('Login failed');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      setError(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const traditionalRegister = async (userData: { name: string; email: string; password: string; role: string }) => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiService.register(userData);

      if (response.success && response.data) {
        setUser(response.data.user);
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        // Connect to socket
        socketService.connect();
        router.push('/dashboard');
      } else {
        throw new Error('Registration failed');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      setError(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const completeSignup = async (roleData: {
    role: string;
    specialization?: string;
    department?: string;
    licenseNumber?: string;
    phone?: string;
    emergencyContact?: {
      name: string;
      relationship: string;
      phone: string;
    };
  }) => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiService.completeSignup(roleData);

      if (response.success && response.data) {
        setUser(response.data.user);
        setNeedsRoleSelection(false);
        // store the permanent token under `token`
        localStorage.setItem('token', response.data.token);
        // clear temporary token
        localStorage.removeItem('tempToken');
        localStorage.setItem('user', JSON.stringify(response.data.user));
        // Connect to socket
        socketService.connect();
        router.push('/dashboard');
      } else {
        throw new Error('Role selection failed');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Role selection failed';
      setError(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('tempToken');
    localStorage.removeItem('user');
    socketService.disconnect();
    
    // If user is authenticated with Kinde, logout from Kinde too
    if (isAuthenticated) {
      kindeLogoutFn();
    } else {
      router.push('/login');
    }
  };

  const value = {
    user,
    kindeLogin,
    kindeRegister,
    traditionalLogin,
    traditionalRegister,
    completeSignup,
    logout,
    loading: loading || kindeLoading,
    error,
    needsRoleSelection,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}