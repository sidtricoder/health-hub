'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { RoleSelection } from '@/components/auth/RoleSelection';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function RoleSelectionPage() {
  const { user, needsRoleSelection, completeSignup, loading } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Redirect if user already has a role or doesn't need role selection
    if (!loading && user && !needsRoleSelection) {
      router.push('/dashboard');
    }
    
    // Redirect to login if not authenticated
    if (!loading && !user && !needsRoleSelection) {
      router.push('/login');
    }
  }, [user, needsRoleSelection, loading, router]);

  const handleRoleSelection = async (roleData: {
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
      setIsSubmitting(true);
      await completeSignup(roleData);
      // Navigation will be handled by the context
    } catch (error) {
      console.error('Role selection error:', error);
      // Error is already handled by the context
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!needsRoleSelection) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-4xl shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
        <CardHeader className="text-center space-y-2 pb-8">
          <CardTitle className="text-3xl font-bold text-gray-800">Welcome to Health Hub</CardTitle>
          <CardDescription className="text-lg text-gray-600">
            Please select your role to complete your account setup
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RoleSelection
            onRoleSelect={handleRoleSelection}
            isLoading={isSubmitting}
          />
        </CardContent>
      </Card>
    </div>
  );
}