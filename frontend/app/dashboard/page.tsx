'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSocket } from '@/contexts/SocketContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bell, 
  Users, 
  Activity, 
  FileText, 
  Plus, 
  LogOut, 
  Heart, 
  Stethoscope, 
  Calendar,
  TrendingUp,
  Clock,
  AlertCircle
} from 'lucide-react';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { Patient, User, Notification } from '@/types';
import { apiService } from '@/lib/api';

interface DashboardStats {
  totalPatients: number;
  activePatients: number;
  todaysVitals: number;
  pendingReports: number;
  unreadNotifications: number;
  criticalPatients: number;
  todaysAdmissions: number;
  averageStayDuration: number;
}

export default function DashboardPage() {
  const { user, logout, needsRoleSelection } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalPatients: 0,
    activePatients: 0,
    todaysVitals: 0,
    pendingReports: 0,
    unreadNotifications: 0,
    criticalPatients: 0,
    todaysAdmissions: 0,
    averageStayDuration: 0
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
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
    if (needsRoleSelection) {
      router.push('/role-selection');
      return;
    }

    if (!user) {
      router.push('/login');
      return;
    }

    loadDashboardData();
  }, [user, router, needsRoleSelection]);

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

      // Calculate comprehensive stats
      const allPatientsResponse = await apiService.getPatients({ limit: 1000 });
      const allPatients = allPatientsResponse.success ? allPatientsResponse.data : [];
      
      const unreadCount = await apiService.getUnreadNotificationCount();
      
      const today = new Date().toDateString();
      const activePatients = allPatients.filter(p => p.status === 'active');
      const todaysAdmissions = allPatients.filter(p => 
        new Date(p.admissionDate).toDateString() === today
      );
      
      const criticalPatients = allPatients.filter(p => 
        p.reports?.some(r => r.isCritical) || 
        p.status === 'active' && p.vitals?.some(v => 
          v.type === 'oxygen_saturation' && parseFloat(v.value) < 90
        )
      );

      // Calculate average stay duration
      const admittedPatients = allPatients.filter(p => p.admissionDate);
      const avgStayDuration = admittedPatients.length > 0 
        ? admittedPatients.reduce((acc, p) => {
            const days = Math.floor((Date.now() - new Date(p.admissionDate).getTime()) / (1000 * 60 * 60 * 24));
            return acc + days;
          }, 0) / admittedPatients.length
        : 0;

      setStats({
        totalPatients: allPatients.length,
        activePatients: activePatients.length,
        todaysVitals: allPatients.reduce((count, p) => {
          const todaysVitals = p.vitals?.filter(v => 
            new Date(v.recordedAt).toDateString() === today
          ).length || 0;
          return count + todaysVitals;
        }, 0),
        pendingReports: allPatients.reduce((count, p) => {
          return count + (p.reports?.filter(r => !r.isCritical).length || 0);
        }, 0),
        unreadNotifications: unreadCount.success ? unreadCount.data.unreadCount : 0,
        criticalPatients: criticalPatients.length,
        todaysAdmissions: todaysAdmissions.length,
        averageStayDuration: Math.round(avgStayDuration)
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
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-red-50">
      {/* Enhanced Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Stethoscope className="h-8 w-8 text-red-600" />
                <h1 className="text-2xl font-bold bg-gradient-to-r from-sky-600 to-red-600 bg-clip-text text-transparent">
                  Health Hub EMR
                </h1>
              </div>
              <Badge variant="outline" className="text-xs">
                v2.0.0
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {isConnected ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse" />
                    <span className="text-sm text-teal-600 font-medium">Live</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full" />
                    <span className="text-sm text-red-600">Offline</span>
                  </div>
                )}
              </div>
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
              <div className="flex items-center space-x-3">
                <Avatar className="ring-2 ring-sky-100">
                  <AvatarFallback className="bg-gradient-to-br from-sky-500 to-red-500 text-white">
                    {user?.name?.split(' ').map(n => n[0]).join('') || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="text-sm">
                  <div className="font-medium text-gray-900">{user?.name || 'User'}</div>
                  <div className="text-gray-500 capitalize">{user?.role || 'Staff'}</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                {/* Surgery Simulation Button - Only for Doctors */}
                {user?.role === 'doctor' && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => router.push('/surgery-simulation')}
                    className="hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                  >
                    <Stethoscope className="h-4 w-4 mr-2" />
                    Surgery Simulation
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={logout} className="hover:bg-red-50 hover:text-red-600 hover:border-red-200">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Enhanced Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          
          {/* Welcome Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Welcome back, {user?.name?.split(' ')[0]}</h2>
                <p className="mt-1 text-lg text-gray-600">Here's what's happening in your hospital today.</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">{new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</p>
                <p className="text-lg font-semibold text-gray-900">{new Date().toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}</p>
              </div>
            </div>
          </div>

          {/* Enhanced Stats Cards Grid */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card className="bg-gradient-to-br from-sky-500 to-sky-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-sky-100">Total Patients</CardTitle>
                <Users className="h-5 w-5 text-sky-200" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.totalPatients}</div>
                <p className="text-xs text-sky-100 mt-1">
                  {stats.activePatients} active • {stats.totalPatients - stats.activePatients} discharged
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-teal-500 to-teal-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-teal-100">Today's Vitals</CardTitle>
                <Heart className="h-5 w-5 text-teal-200" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.todaysVitals}</div>
                <p className="text-xs text-teal-100 mt-1">
                  Recorded today
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-amber-100">Critical Alerts</CardTitle>
                <AlertCircle className="h-5 w-5 text-amber-200" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.criticalPatients}</div>
                <p className="text-xs text-amber-100 mt-1">
                  Require attention
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-red-100">Today's Tasks</CardTitle>
                <Bell className="h-5 w-5 text-red-200" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{unreadNotifications}</div>
                <p className="text-xs text-red-100 mt-1">
                  Pending actions
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Secondary Stats Grid */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 mb-8">
            <Card className="hover:shadow-lg transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Admissions Today</CardTitle>
                <Calendar className="h-4 w-4 text-sky-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{stats.todaysAdmissions}</div>
                <p className="text-xs text-gray-500 mt-1">New patients</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Avg Stay Duration</CardTitle>
                <Clock className="h-4 w-4 text-teal-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{stats.averageStayDuration} days</div>
                <p className="text-xs text-gray-500 mt-1">Current patients</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Reports Pending</CardTitle>
                <FileText className="h-4 w-4 text-amber-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{stats.pendingReports}</div>
                <p className="text-xs text-gray-500 mt-1">Awaiting review</p>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Patient Management Section */}
          <div className="bg-white shadow-xl rounded-xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                    <Users className="h-5 w-5 mr-2 text-sky-600" />
                    Recent Patients
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {patients.length} of {stats.totalPatients} total patients
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => router.push('/patients')}
                    className="hover:bg-sky-50 hover:text-sky-600 hover:border-sky-200"
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    View All
                  </Button>
                  <Button 
                    onClick={() => router.push('/patients/new')}
                    className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white border-0 shadow-lg"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Patient
                  </Button>
                </div>
              </div>
            </div>

            <div className="divide-y divide-gray-100">
              {patients.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No patients found</h3>
                  <p className="text-gray-600 mb-4">Get started by adding your first patient to the system.</p>
                  <Button 
                    onClick={() => router.push('/patients/new')}
                    className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Patient
                  </Button>
                </div>
              ) : (
                patients.map((patient) => (
                  <div 
                    key={patient.id}
                    className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-all duration-200 group"
                    onClick={() => router.push(`/patients/${patient.id}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <Avatar className="h-12 w-12 ring-2 ring-gray-100 group-hover:ring-sky-200 transition-all">
                            <AvatarFallback className="bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700 group-hover:from-sky-100 group-hover:to-red-100 group-hover:text-sky-700 transition-all">
                              {patient.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          {patient.status === 'active' && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-teal-500 rounded-full border-2 border-white"></div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="text-lg font-semibold text-gray-900 group-hover:text-sky-900 transition-colors">
                              {patient.name}
                            </h4>
                            <Badge 
                              variant={patient.status === 'active' ? 'default' : 'secondary'}
                              className={`${patient.status === 'active' ? 'bg-teal-100 text-teal-700 hover:bg-teal-200' : ''}`}
                            >
                              {patient.status}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600 mt-1 space-y-1">
                            <div className="flex items-center space-x-4">
                              <span>MRN: <span className="font-mono text-gray-900">{patient.medicalRecordNumber}</span></span>
                              <span>•</span>
                              <span>Admitted: {new Date(patient.admissionDate).toLocaleDateString()}</span>
                              {patient.bedNumber && (
                                <>
                                  <span>•</span>
                                  <span>Bed: <span className="font-medium">{patient.bedNumber}</span></span>
                                </>
                              )}
                            </div>
                            <div className="flex items-center space-x-4 text-xs">
                              <span className="flex items-center">
                                <Heart className="h-3 w-3 mr-1 text-red-600" />
                                {patient.vitals?.length || 0} vitals
                              </span>
                              <span className="flex items-center">
                                <FileText className="h-3 w-3 mr-1 text-sky-600" />
                                {patient.reports?.length || 0} reports
                              </span>
                              <span className="flex items-center">
                                <Activity className="h-3 w-3 mr-1 text-teal-600" />
                                {patient.currentMedications?.length || 0} medications
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-sky-50 hover:text-sky-600 hover:border-sky-200"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/patients/${patient.id}`);
                          }}
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}