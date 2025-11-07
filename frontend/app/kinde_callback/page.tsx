'use client';

import { useEffect } from 'react';
import { useKindeAuth } from '@kinde-oss/kinde-auth-react';
import { useRouter } from 'next/navigation';

export default function KindeCallbackPage() {
  const { isAuthenticated, isLoading, error } = useKindeAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (error) {
        console.error('Kinde authentication error:', error);
        router.push('/login?error=auth_failed');
      } else if (isAuthenticated) {
        // AuthContext will handle the user sync
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    }
  }, [isAuthenticated, isLoading, error, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-gray-600">Completing authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}