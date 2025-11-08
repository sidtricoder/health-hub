'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, 
  Search, 
  Filter, 
  Users, 
  Heart, 
  FileText, 
  Activity,
  ArrowLeft,
  UserPlus,
  Stethoscope,
  Calendar,
  Phone,
  Mail
} from 'lucide-react';
import { Patient } from '@/types';
import { apiService } from '@/lib/api';

export default function PatientsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPatients, setTotalPatients] = useState(0);
  const patientsPerPage = 12;

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    loadPatients();
  }, [user, router, searchTerm, statusFilter, currentPage]);

  const loadPatients = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: currentPage,
        limit: patientsPerPage,
      };

      if (searchTerm) {
        params.search = searchTerm;
      }

      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      const response = await apiService.getPatients(params);
      if (response.success) {
        setPatients(response.data);
        setTotalPatients(response.pagination?.total || response.data.length);
      }
    } catch (error) {
      console.error('Error loading patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(totalPatients / patientsPerPage);

  // Check if user can create patients (admin or receptionist)
  const canCreatePatients = user?.role === 'admin' || user?.role === 'receptionist';

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.medicalRecordNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || patient.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (!user) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/dashboard')}
                className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <div className="flex items-center space-x-2">
                <Users className="h-6 w-6 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">Patient Management</h1>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {/* Surgery Simulation Button - Only for Doctors */}
              {user?.role === 'doctor' && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => router.push('/surgery-simulation')}
                  className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
                >
                  <Stethoscope className="h-4 w-4 mr-2" />
                  Surgery Simulation
                </Button>
              )}
              {canCreatePatients && (
                <Button 
                  onClick={() => router.push('/patients/new')}
                  className="bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add New Patient
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Patients</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{totalPatients}</div>
              <p className="text-xs text-gray-500 mt-1">Across all departments</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Active Patients</CardTitle>
              <Activity className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {patients.filter(p => p.status === 'active').length}
              </div>
              <p className="text-xs text-gray-500 mt-1">Currently admitted</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Today's Admissions</CardTitle>
              <Calendar className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {patients.filter(p => 
                  new Date(p.admissionDate).toDateString() === new Date().toDateString()
                ).length}
              </div>
              <p className="text-xs text-gray-500 mt-1">New admissions</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Search className="h-5 w-5 mr-2 text-blue-600" />
              Search & Filter Patients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name or MRN..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Patients</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="discharged">Discharged</SelectItem>
                  <SelectItem value="transferred">Transferred</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setCurrentPage(1);
                }}
              >
                <Filter className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Patients List */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Patients ({filteredPatients.length})</CardTitle>
                <CardDescription>
                  Manage patient records and medical information
                </CardDescription>
              </div>
              {canCreatePatients && (
                <Button 
                  onClick={() => router.push('/patients/new')}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Patient
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
                <span className="ml-3 text-gray-600">Loading patients...</span>
              </div>
            ) : filteredPatients.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm || statusFilter !== 'all' ? 'No patients found' : 'No patients yet'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Try adjusting your search or filters.' 
                    : 'Get started by adding your first patient to the system.'
                  }
                </p>
                {canCreatePatients && (searchTerm === '' && statusFilter === 'all') && (
                  <Button 
                    onClick={() => router.push('/patients/new')}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add First Patient
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPatients.map((patient) => (
                  <Card 
                    key={patient.id}
                    className="cursor-pointer hover:shadow-lg transition-all duration-200 group border-gray-200 hover:border-blue-200"
                    onClick={() => router.push(`/patients/${patient.id}`)}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-center space-x-4 mb-4">
                        <div className="relative">
                          <Avatar className="h-12 w-12 ring-2 ring-gray-100 group-hover:ring-blue-200 transition-all">
                            <AvatarFallback className="bg-linear-to-br from-gray-100 to-gray-200 text-gray-700 group-hover:from-blue-100 group-hover:to-purple-100 group-hover:text-blue-700 transition-all">
                              {patient.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          {patient.status === 'active' && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-900 transition-colors truncate">
                            {patient.name}
                          </h3>
                          <p className="text-sm text-gray-500 font-mono">{patient.medicalRecordNumber}</p>
                        </div>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Status:</span>
                          <Badge 
                            variant={patient.status === 'active' ? 'default' : 'secondary'}
                            className={patient.status === 'active' ? 'bg-green-100 text-green-700 hover:bg-green-200' : ''}
                          >
                            {patient.status}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Admitted:</span>
                          <span className="text-sm text-gray-900">
                            {new Date(patient.admissionDate).toLocaleDateString()}
                          </span>
                        </div>

                        {patient.bedNumber && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Bed:</span>
                            <span className="text-sm font-medium text-gray-900">{patient.bedNumber}</span>
                          </div>
                        )}

                        {patient.phone && (
                          <div className="flex items-center justify-between">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-900">{patient.phone}</span>
                          </div>
                        )}

                        {patient.email && (
                          <div className="flex items-center justify-between">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-900 truncate">{patient.email}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
                        <span className="flex items-center">
                          <Heart className="h-3 w-3 mr-1 text-red-500" />
                          {patient.vitals?.length || 0} vitals
                        </span>
                        <span className="flex items-center">
                          <FileText className="h-3 w-3 mr-1 text-blue-500" />
                          {patient.reports?.length || 0} reports
                        </span>
                        <span className="flex items-center">
                          <Activity className="h-3 w-3 mr-1 text-green-500" />
                          {patient.currentMedications?.length || 0} meds
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + Math.max(1, Math.min(currentPage - 2, totalPages - 4));
                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className={currentPage === page ? 'bg-blue-600 hover:bg-blue-700' : ''}
                      >
                        {page}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}