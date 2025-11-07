'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Stethoscope, 
  Heart, 
  FlaskConical, 
  Clipboard, 
  Settings,
  CheckCircle,
  ArrowRight,
  User
} from 'lucide-react';
import { UserRole } from '@/types';

interface RoleSelectionProps {
  onRoleSelect: (roleData: {
    role: UserRole;
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
  isLoading?: boolean;
}

const roles = [
  {
    id: 'doctor' as UserRole,
    title: 'Doctor',
    description: 'Diagnose patients, prescribe medications, and manage treatment plans',
    icon: Stethoscope,
    color: 'blue',
    permissions: [
      'Full patient access',
      'Prescribe medications',
      'Order tests and procedures',
      'Update treatment plans',
      'Access all medical records'
    ]
  },
  {
    id: 'nurse' as UserRole,
    title: 'Nurse',
    description: 'Provide patient care, record vitals, and administer treatments',
    icon: Heart,
    color: 'green',
    permissions: [
      'Record vital signs',
      'Administer medications',
      'Patient care documentation',
      'View patient records',
      'Communicate with team'
    ]
  },
  {
    id: 'lab_technician' as UserRole,
    title: 'Lab Technician',
    description: 'Process lab samples and upload test results',
    icon: FlaskConical,
    color: 'purple',
    permissions: [
      'Upload lab results',
      'Process test samples',
      'View test orders',
      'Generate reports',
      'Quality control'
    ]
  },
  {
    id: 'receptionist' as UserRole,
    title: 'Receptionist',
    description: 'Manage patient registration, scheduling, and administrative tasks',
    icon: Clipboard,
    color: 'orange',
    permissions: [
      'Patient registration',
      'Appointment scheduling',
      'Bed assignments',
      'Basic patient info',
      'Administrative tasks'
    ]
  },
  {
    id: 'admin' as UserRole,
    title: 'Administrator',
    description: 'System administration and user management',
    icon: Settings,
    color: 'gray',
    permissions: [
      'Full system access',
      'User management',
      'System configuration',
      'Reports and analytics',
      'Security management'
    ]
  }
];

const colorClasses = {
  blue: {
    card: 'border-blue-200 hover:border-blue-300 hover:shadow-blue-100',
    selected: 'border-blue-500 bg-blue-50 shadow-blue-200',
    icon: 'text-blue-600',
    button: 'bg-blue-600 hover:bg-blue-700'
  },
  green: {
    card: 'border-green-200 hover:border-green-300 hover:shadow-green-100',
    selected: 'border-green-500 bg-green-50 shadow-green-200',
    icon: 'text-green-600',
    button: 'bg-green-600 hover:bg-green-700'
  },
  purple: {
    card: 'border-purple-200 hover:border-purple-300 hover:shadow-purple-100',
    selected: 'border-purple-500 bg-purple-50 shadow-purple-200',
    icon: 'text-purple-600',
    button: 'bg-purple-600 hover:bg-purple-700'
  },
  orange: {
    card: 'border-orange-200 hover:border-orange-300 hover:shadow-orange-100',
    selected: 'border-orange-500 bg-orange-50 shadow-orange-200',
    icon: 'text-orange-600',
    button: 'bg-orange-600 hover:bg-orange-700'
  },
  gray: {
    card: 'border-gray-200 hover:border-gray-300 hover:shadow-gray-100',
    selected: 'border-gray-500 bg-gray-50 shadow-gray-200',
    icon: 'text-gray-600',
    button: 'bg-gray-600 hover:bg-gray-700'
  }
};

export function RoleSelection({ onRoleSelect, isLoading = false }: RoleSelectionProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  const handleRoleSelect = async () => {
    if (selectedRole) {
      await onRoleSelect({ role: selectedRole });
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 bg-linear-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
              <User className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Health Hub EMR</h1>
          <p className="text-lg text-gray-600 mb-4">
            Please select your role to get started.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {roles.map((role) => {
            const Icon = role.icon;
            const colors = colorClasses[role.color as keyof typeof colorClasses];
            const isSelected = selectedRole === role.id;

            return (
              <Card
                key={role.id}
                className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
                  isSelected 
                    ? `${colors.selected} ring-2 ring-offset-2 ring-${role.color}-500` 
                    : `${colors.card} hover:shadow-lg`
                }`}
                onClick={() => setSelectedRole(role.id)}
              >
                <CardHeader className="text-center pb-3">
                  <div className="flex justify-center mb-3">
                    <div className={`h-12 w-12 rounded-full bg-${role.color}-100 flex items-center justify-center`}>
                      <Icon className={`h-6 w-6 ${colors.icon}`} />
                    </div>
                  </div>
                  <CardTitle className="text-lg font-semibold">{role.title}</CardTitle>
                  <CardDescription className="text-sm text-gray-600">
                    {role.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700 mb-2">Key Responsibilities:</p>
                    <ul className="space-y-1">
                      {role.permissions.slice(0, 3).map((permission, index) => (
                        <li key={index} className="flex items-center text-xs text-gray-600">
                          <CheckCircle className={`h-3 w-3 mr-2 ${colors.icon}`} />
                          {permission}
                        </li>
                      ))}
                    </ul>
                    {role.permissions.length > 3 && (
                      <p className="text-xs text-gray-500 mt-2">
                        +{role.permissions.length - 3} more permissions
                      </p>
                    )}
                  </div>
                  {isSelected && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <Badge variant="default" className={colors.button}>
                        Selected Role
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="flex items-center justify-center space-x-4">
          <Button
            onClick={handleRoleSelect}
            disabled={!selectedRole || isLoading}
            className={`px-8 py-2 ${
              selectedRole 
                ? colorClasses[roles.find(r => r.id === selectedRole)?.color as keyof typeof colorClasses]?.button 
                : 'bg-gray-400 cursor-not-allowed'
            } text-white font-medium`}
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                Setting up account...
              </div>
            ) : (
              <div className="flex items-center">
                Continue with {selectedRole ? roles.find(r => r.id === selectedRole)?.title : 'Selected Role'}
                <ArrowRight className="h-4 w-4 ml-2" />
              </div>
            )}
          </Button>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Your role determines your access level and available features in the system.
            <br />
            You can contact an administrator later if you need to change your role.
          </p>
        </div>
      </div>
    </div>
  );
}