'use client';

import { KindeProvider } from '@kinde-oss/kinde-auth-react';
import { AuthProvider } from '@/contexts/AuthContext';
import { SocketProvider } from '@/contexts/SocketContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <KindeProvider
      clientId={process.env.NEXT_PUBLIC_KINDE_CLIENT_ID!}
      domain={process.env.NEXT_PUBLIC_KINDE_ISSUER_URL!}
      redirectUri={process.env.NEXT_PUBLIC_KINDE_REDIRECT_URI!}
      logoutUri={process.env.NEXT_PUBLIC_KINDE_POST_LOGOUT_REDIRECT_URL!}
    >
      <AuthProvider>
        <SocketProvider>
          {children}
        </SocketProvider>
      </AuthProvider>
    </KindeProvider>
  );
}