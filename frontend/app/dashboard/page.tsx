'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSocket } from '@/contexts/SocketContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bell, Users, Activity, FileText, Plus, LogOut } from 'lucide-react';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { Patient, User, Notification } from '@/types';
import { apiService } from '@/lib/api';

// Mock data for now - will be replaced with real data
const mockStats = {
  totalPatients: 0,
  todaysVitals: 0,
  pendingReports: 0,
  unreadNotifications: 0
};

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState(mockStats);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Conditionally use socket
  let socketData: { notifications: Notification[]; isConnected: boolean } = { notifications: [], isConnected: false };
  try {
    const socket = useSocket();
    socketData = { notifications: socket.notifications, isConnected: socket.isConnected };
  } catch (error) {
    // Socket not available
  }

  const { notifications: socketNotifications, isConnected } = socketData;

  // Combine local and socket notifications
  const allNotifications = [...notifications, ...socketNotifications];

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    loadDashboardData();
  }, [user, router]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load patients
      const patientsResponse = await apiService.getPatients({ limit: 10 });
      if (patientsResponse.success) {
        setPatients(patientsResponse.data);
      }

      // Load notifications
      const notificationsResponse = await apiService.getNotifications({ limit: 20 });
      if (notificationsResponse.success) {
        setNotifications(notificationsResponse.data);
      }

      // Calculate stats
      const unreadCount = await apiService.getUnreadNotificationCount();
      setStats({
        totalPatients: patientsResponse.data?.length || 0,
        todaysVitals: 0, // TODO: Implement
        pendingReports: 0, // TODO: Implement
        unreadNotifications: unreadCount.success ? unreadCount.data.unreadCount : 0
      });

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Loading dashboard...</h1>
        </div>
      </div>
    );
  }

  const unreadNotifications = allNotifications.filter((n: Notification) => !n.isRead).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Health Hub EMR</h1>
            </div>
            <div className="flex items-center space-x-4">
              <NotificationCenter
                notifications={allNotifications}
                onMarkAsRead={async (id) => {
                  try {
                    await apiService.markNotificationAsRead(id);
                    setNotifications(prev =>
                      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
                    );
                  } catch (error) {
                    console.error('Error marking notification as read:', error);
                  }
                }}
                onMarkAllAsRead={async () => {
                  try {
                    await apiService.markAllNotificationsAsRead();
                    setNotifications(prev =>
                      prev.map(n => ({ ...n, isRead: true }))
                    );
                  } catch (error) {
                    console.error('Error marking all notifications as read:', error);
                  }
                }}
                onDismiss={async (id) => {
                  try {
                    await apiService.deleteNotification(id);
                    setNotifications(prev => prev.filter(n => n.id !== id));
                  } catch (error) {
                    console.error('Error deleting notification:', error);
                  }
                }}
              />
              <Avatar>
                <AvatarFallback>{user?.name?.split(' ').map(n => n[0]).join('') || 'U'}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">{user?.name || 'User'}</span>
              {isConnected && (
                <div className="w-2 h-2 bg-green-500 rounded-full" title="Connected" />
              )}
              <Button variant="outline" size="sm" onClick={logout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalPatients}</div>
                <p className="text-xs text-muted-foreground">Active patients</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today's Vitals</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.todaysVitals}</div>
                <p className="text-xs text-muted-foreground">Recorded today</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Reports</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pendingReports}</div>
                <p className="text-xs text-muted-foreground">Awaiting review</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tasks</CardTitle>
                <Bell className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{unreadNotifications}</div>
                <p className="text-xs text-muted-foreground">Pending tasks</p>
              </CardContent>
            </Card>
          </div>

          {/* Patient List */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Patients</h3>
              <Button onClick={() => router.push('/patients/new')}>
                <Plus className="h-4 w-4 mr-2" />
                Add Patient
              </Button>
            </div>
            <ul className="divide-y divide-gray-200">
              {patients.length === 0 ? (
                <li className="px-4 py-8 text-center text-gray-500">
                  No patients found. Add your first patient to get started.
                </li>
              ) : (
                patients.map((patient) => (
                  <li key={patient.id}>
                    <div className="px-4 py-4 sm:px-6 hover:bg-gray-50 cursor-pointer"
                         onClick={() => router.push(`/patients/${patient.id}`)}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="shrink-0">
                            <Avatar>
                              <AvatarFallback>{patient.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                            </Avatar>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{patient.name}</div>
                            <div className="text-sm text-gray-500">
                              MRN: {patient.medicalRecordNumber} • Admitted: {new Date(patient.admissionDate).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={patient.status === 'active' ? 'default' : 'secondary'}>
                            {patient.status}
                          </Badge>
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}