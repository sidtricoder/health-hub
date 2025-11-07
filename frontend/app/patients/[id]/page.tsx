'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowLeft, 
  Edit, 
  MessageSquare, 
  Activity, 
  FileText, 
  Pill, 
  Clock, 
  Plus,
  Heart,
  User,
  Calendar,
  Phone,
  Mail,
  MapPin,
  AlertCircle,
  Save,
  X,
  Loader2,
  TrendingUp,
  Download
} from 'lucide-react';
import { Chat } from '@/components/chat/Chat';
import { Timeline } from '@/components/timeline/Timeline';
import { Patient, UserRole, Vital, Medication, Report } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';
import { apiService } from '@/lib/api';

export default function PatientPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { 
    joinPatient, 
    leavePatient, 
    updatePatient, 
    isConnected, 
    timelineEvents: socketTimelineEvents 
  } = useSocket();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Form states
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [saving, setSaving] = useState(false);

  // New entries
  const [newVital, setNewVital] = useState({
    type: '',
    value: '',
    unit: '',
    notes: ''
  });
  const [newMedication, setNewMedication] = useState({
    name: '',
    dosage: '',
    frequency: '',
    instructions: ''
  });
  const [newReport, setNewReport] = useState({
    type: 'lab',
    title: '',
    content: ''
  });

  useEffect(() => {
    if (params.id) {
      loadPatient(params.id as string);
    }
  }, [params.id]);

  // Join patient room for real-time updates
  useEffect(() => {
    if (patient?.id && isConnected) {
      joinPatient(patient.id);
      return () => {
        leavePatient(patient.id);
      };
    }
  }, [patient?.id, isConnected, joinPatient, leavePatient]);

  // Listen for real-time patient updates
  useEffect(() => {
    const handlePatientUpdate = (data: {
      patientId: string;
      updateType: string;
      updateData: any;
      timelineEvent: any;
    }) => {
      if (data.patientId === patient?.id) {
        // Refresh patient data when updates occur
        setPatient(prevPatient => {
          if (!prevPatient) return prevPatient;
          
          // Update specific sections based on update type
          switch (data.updateType) {
            case 'vital_added':
              return {
                ...prevPatient,
                vitals: [...(prevPatient.vitals || []), data.updateData]
              };
            case 'medication_added':
              return {
                ...prevPatient,
                currentMedications: [...(prevPatient.currentMedications || []), data.updateData]
              };
            case 'report_added':
              return {
                ...prevPatient,
                reports: [...(prevPatient.reports || []), data.updateData]
              };
            case 'patient_updated':
              // Full patient update
              return { ...prevPatient, ...data.updateData };
            default:
              // Reload full patient data for other updates
              if (prevPatient?.id) {
                loadPatient(prevPatient.id);
              }
              return prevPatient;
          }
        });
      }
    };

    // Subscribe to patient updates via custom events
    const handleCustomPatientUpdate = (event: CustomEvent) => {
      handlePatientUpdate(event.detail);
    };

    window.addEventListener('patientUpdated', handleCustomPatientUpdate as EventListener);
    
    return () => {
      window.removeEventListener('patientUpdated', handleCustomPatientUpdate as EventListener);
    };
  }, [patient?.id]);

  const loadPatient = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getPatient(id);
      
      if (response.success) {
        setPatient(response.data);
      } else {
        setError('Patient not found');
      }
    } catch (error) {
      console.error('Error loading patient:', error);
      setError('Failed to load patient data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddVital = async () => {
    if (!patient?.id || !newVital.type || !newVital.value || !newVital.unit) return;
    
    try {
      setSaving(true);
      const response = await apiService.addVital(patient.id, newVital);
      
      if (response.success) {
        // Update local state
        setPatient(prev => prev ? {
          ...prev,
          vitals: [response.data, ...(prev.vitals || [])]
        } : null);

        // Send real-time update
        updatePatient({
          patientId: patient.id,
          updateType: 'vital_added',
          updateData: response.data,
          description: `${newVital.type.replace('_', ' ')} recorded: ${newVital.value} ${newVital.unit}`
        });

        // Reset form
        setNewVital({ type: '', value: '', unit: '', notes: '' });
      }
    } catch (error) {
      console.error('Error adding vital:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleAddMedication = async () => {
    if (!patient?.id || !newMedication.name || !newMedication.dosage || !newMedication.frequency) return;
    
    try {
      setSaving(true);
      const response = await apiService.addMedication(patient.id, {
        ...newMedication,
        startDate: new Date().toISOString()
      });
      
      if (response.success) {
        // Update local state
        setPatient(prev => prev ? {
          ...prev,
          currentMedications: [response.data, ...prev.currentMedications]
        } : null);

        // Send real-time update
        updatePatient({
          patientId: patient.id,
          updateType: 'medication_changed',
          updateData: response.data,
          description: `Medication ${newMedication.name} prescribed`
        });

        // Reset form
        setNewMedication({ name: '', dosage: '', frequency: '', instructions: '' });
      }
    } catch (error) {
      console.error('Error adding medication:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleAddReport = async () => {
    if (!patient?.id || !newReport.title || !newReport.content) return;
    
    try {
      setSaving(true);
      const response = await apiService.addReport(patient.id, newReport);
      
      if (response.success) {
        // Update local state
        setPatient(prev => prev ? {
          ...prev,
          reports: [response.data, ...prev.reports]
        } : null);

        // Send real-time update
        updatePatient({
          patientId: patient.id,
          updateType: 'report_uploaded',
          updateData: response.data,
          description: `${newReport.type} report uploaded: ${newReport.title}`
        });

        // Reset form
        setNewReport({ type: 'lab', title: '', content: '' });
      }
    } catch (error) {
      console.error('Error adding report:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Patient Data</h2>
          <p className="text-gray-600">Please wait while we fetch the patient information...</p>
        </div>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-red-50 to-pink-50">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Patient Not Found</h2>
          <p className="text-gray-600 mb-4">{error || 'The requested patient could not be found.'}</p>
          <Button onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const canPerformAction = (action: string) => {
    if (!user) return false;
    
    switch (action) {
      case 'add_vital':
        return user.role === 'nurse' || user.role === 'doctor';
      case 'prescribe_medication':
        return user.role === 'doctor';
      case 'upload_report':
        return user.role === 'lab_technician' || user.role === 'doctor';
      case 'edit_patient':
        return user.role === 'doctor' || user.role === 'receptionist' || user.role === 'admin';
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-purple-50">
      {/* Enhanced Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-lg border-b border-gray-200/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => router.push('/dashboard')}
                className="hover:bg-blue-50"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16 ring-4 ring-blue-100">
                  <AvatarFallback className="bg-linear-to-br from-blue-500 to-purple-500 text-white text-xl font-bold">
                    {patient.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{patient.name}</h1>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span className="flex items-center">
                      <User className="h-3 w-3 mr-1" />
                      MRN: <span className="font-mono ml-1">{patient.medicalRecordNumber}</span>
                    </span>
                    <span className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      Age: {calculateAge(patient.dateOfBirth)}
                    </span>
                    <span className="flex items-center">
                      <Heart className="h-3 w-3 mr-1" />
                      {patient.gender}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Badge 
                variant={patient.status === 'active' ? 'default' : 'secondary'}
                className={`${
                  patient.status === 'active' 
                    ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                    : ''
                } text-sm px-3 py-1`}
              >
                {patient.status}
              </Badge>
              
              {canPerformAction('add_vital') && (
                <Button variant="outline" size="sm" onClick={() => setActiveTab('vitals')}>
                  <Activity className="h-4 w-4 mr-2" />
                  Record Vitals
                </Button>
              )}
              
              {canPerformAction('prescribe_medication') && (
                <Button variant="outline" size="sm" onClick={() => setActiveTab('medications')}>
                  <Pill className="h-4 w-4 mr-2" />
                  Prescribe
                </Button>
              )}
              
              {canPerformAction('upload_report') && (
                <Button variant="outline" size="sm" onClick={() => setActiveTab('reports')}>
                  <FileText className="h-4 w-4 mr-2" />
                  Add Report
                </Button>
              )}
              
              {canPerformAction('edit_patient') && (
                <Button 
                  variant="outline" 
                  size="sm"
                  className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
                  onClick={() => router.push(`/patients/${patient.id}/edit`)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Patient
                </Button>
              )}
              
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            </div>
          </div>
        </div>
      </header>

      {/* Enhanced Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-6 bg-white/80 backdrop-blur-sm">
              <TabsTrigger value="overview" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                Overview
              </TabsTrigger>
              <TabsTrigger value="vitals" className="data-[state=active]:bg-green-500 data-[state=active]:text-white">
                <Activity className="h-4 w-4 mr-2" />
                Vitals ({patient.vitals?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="medications" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">
                <Pill className="h-4 w-4 mr-2" />
                Meds ({patient.currentMedications?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="reports" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
                <FileText className="h-4 w-4 mr-2" />
                Reports ({patient.reports?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="notes" className="data-[state=active]:bg-indigo-500 data-[state=active]:text-white">
                <MessageSquare className="h-4 w-4 mr-2" />
                Communication
              </TabsTrigger>
              <TabsTrigger value="timeline" className="data-[state=active]:bg-gray-600 data-[state=active]:text-white">
                <Clock className="h-4 w-4 mr-2" />
                Timeline
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Patient Information */}
                <Card className="lg:col-span-2 shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader className="bg-linear-to-r from-blue-50 to-blue-100">
                    <CardTitle className="flex items-center">
                      <User className="h-5 w-5 mr-2 text-blue-600" />
                      Patient Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6 p-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <Label className="text-sm font-medium text-gray-500 flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          Date of Birth
                        </Label>
                        <p className="text-sm font-medium">{new Date(patient.dateOfBirth).toLocaleDateString()}</p>
                        <p className="text-xs text-gray-500">Age: {calculateAge(patient.dateOfBirth)} years</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-sm font-medium text-gray-500">Gender</Label>
                        <p className="text-sm font-medium capitalize">{patient.gender}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-sm font-medium text-gray-500 flex items-center">
                          <Phone className="h-3 w-3 mr-1" />
                          Phone
                        </Label>
                        <p className="text-sm font-medium">{patient.phone}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-sm font-medium text-gray-500 flex items-center">
                          <Mail className="h-3 w-3 mr-1" />
                          Email
                        </Label>
                        <p className="text-sm font-medium">{patient.email}</p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm font-medium text-gray-500 flex items-center">
                        <MapPin className="h-3 w-3 mr-1" />
                        Address
                      </Label>
                      <p className="text-sm font-medium">{patient.address}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Hospital Information */}
                <Card className="shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader className="bg-linear-to-r from-green-50 to-green-100">
                    <CardTitle className="flex items-center">
                      <Activity className="h-5 w-5 mr-2 text-green-600" />
                      Hospital Stay
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 p-6">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium text-gray-500">Admission Date</Label>
                      <p className="text-sm font-medium">{new Date(patient.admissionDate).toLocaleDateString()}</p>
                      <p className="text-xs text-gray-500">
                        {Math.floor((Date.now() - new Date(patient.admissionDate).getTime()) / (1000 * 60 * 60 * 24))} days ago
                      </p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm font-medium text-gray-500">Bed Number</Label>
                      <p className="text-sm font-medium">{patient.bedNumber}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm font-medium text-gray-500">Status</Label>
                      <Badge variant={patient.status === 'active' ? 'default' : 'secondary'}>
                        {patient.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Emergency Contact */}
              <Card className="shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="bg-linear-to-r from-red-50 to-red-100">
                  <CardTitle className="flex items-center">
                    <AlertCircle className="h-5 w-5 mr-2 text-red-600" />
                    Emergency Contact
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-3 gap-6">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium text-gray-500">Name</Label>
                      <p className="text-sm font-medium">{patient.emergencyContact.name}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm font-medium text-gray-500">Phone</Label>
                      <p className="text-sm font-medium">{patient.emergencyContact.phone}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm font-medium text-gray-500">Relationship</Label>
                      <p className="text-sm font-medium capitalize">{patient.emergencyContact.relationship}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-4">
                <Card className="text-center shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-4">
                    <Heart className="h-8 w-8 text-red-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">{patient.vitals?.length || 0}</p>
                    <p className="text-sm text-gray-600">Vital Records</p>
                  </CardContent>
                </Card>
                <Card className="text-center shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-4">
                    <Pill className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">{patient.currentMedications?.length || 0}</p>
                    <p className="text-sm text-gray-600">Active Medications</p>
                  </CardContent>
                </Card>
                <Card className="text-center shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-4">
                    <FileText className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">{patient.reports?.length || 0}</p>
                    <p className="text-sm text-gray-600">Medical Reports</p>
                  </CardContent>
                </Card>
                <Card className="text-center shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-4">
                    <Calendar className="h-8 w-8 text-green-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">
                      {Math.floor((Date.now() - new Date(patient.admissionDate).getTime()) / (1000 * 60 * 60 * 24))}
                    </p>
                    <p className="text-sm text-gray-600">Days in Hospital</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="vitals" className="space-y-6">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Vitals List */}
                <Card className="shadow-lg">
                  <CardHeader className="bg-linear-to-r from-green-50 to-green-100">
                    <CardTitle className="flex items-center">
                      <Activity className="h-5 w-5 mr-2 text-green-600" />
                      Vital Signs History
                    </CardTitle>
                    <CardDescription>Recent vital measurements and trends</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="max-h-96 overflow-y-auto">
                      {patient.vitals && patient.vitals.length > 0 ? (
                        <div className="divide-y divide-gray-100">
                          {patient.vitals.map((vital, index) => (
                            <div key={vital.id || index} className="p-4 hover:bg-gray-50 transition-colors">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <div className={`w-3 h-3 rounded-full ${
                                    vital.type === 'blood_pressure' ? 'bg-red-500' :
                                    vital.type === 'heart_rate' ? 'bg-pink-500' :
                                    vital.type === 'temperature' ? 'bg-orange-500' :
                                    vital.type === 'oxygen_saturation' ? 'bg-blue-500' :
                                    vital.type === 'weight' ? 'bg-purple-500' :
                                    vital.type === 'height' ? 'bg-indigo-500' :
                                    'bg-gray-500'
                                  }`} />
                                  <div>
                                    <p className="font-medium capitalize text-gray-900">
                                      {vital.type.replace('_', ' ')}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                      {new Date(vital.recordedAt).toLocaleString()}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-lg font-bold text-gray-900">{vital.value}</p>
                                  <p className="text-sm text-gray-500">{vital.unit}</p>
                                </div>
                              </div>
                              {vital.notes && (
                                <p className="mt-2 text-sm text-gray-600 italic">{vital.notes}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-8 text-center">
                          <Activity className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-600">No vitals recorded yet</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Add New Vital */}
                {canPerformAction('add_vital') && (
                  <Card className="shadow-lg">
                    <CardHeader className="bg-linear-to-r from-blue-50 to-blue-100">
                      <CardTitle className="flex items-center">
                        <Plus className="h-5 w-5 mr-2 text-blue-600" />
                        Record New Vital
                      </CardTitle>
                      <CardDescription>Add a new vital sign measurement</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 p-6">
                      <div className="space-y-2">
                        <Label htmlFor="vital-type">Vital Type</Label>
                        <Select 
                          value={newVital.type} 
                          onValueChange={(value) => setNewVital(prev => ({ ...prev, type: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select vital type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="blood_pressure">Blood Pressure</SelectItem>
                            <SelectItem value="heart_rate">Heart Rate</SelectItem>
                            <SelectItem value="temperature">Temperature</SelectItem>
                            <SelectItem value="oxygen_saturation">Oxygen Saturation</SelectItem>
                            <SelectItem value="respiratory_rate">Respiratory Rate</SelectItem>
                            <SelectItem value="weight">Weight</SelectItem>
                            <SelectItem value="height">Height</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="vital-value">Value</Label>
                          <Input 
                            id="vital-value"
                            value={newVital.value}
                            onChange={(e) => setNewVital(prev => ({ ...prev, value: e.target.value }))}
                            placeholder="Enter value"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="vital-unit">Unit</Label>
                          <Input 
                            id="vital-unit"
                            value={newVital.unit}
                            onChange={(e) => setNewVital(prev => ({ ...prev, unit: e.target.value }))}
                            placeholder="e.g., mmHg, bpm, °F"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="vital-notes">Notes (Optional)</Label>
                        <Textarea 
                          id="vital-notes"
                          value={newVital.notes}
                          onChange={(e) => setNewVital(prev => ({ ...prev, notes: e.target.value }))}
                          placeholder="Any additional notes..."
                          rows={3}
                        />
                      </div>

                      <Button 
                        onClick={handleAddVital}
                        disabled={!newVital.type || !newVital.value || !newVital.unit || saving}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        {saving ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Recording Vital...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Record Vital
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="medications" className="space-y-6">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Medications List */}
                <Card className="shadow-lg">
                  <CardHeader className="bg-linear-to-r from-purple-50 to-purple-100">
                    <CardTitle className="flex items-center">
                      <Pill className="h-5 w-5 mr-2 text-purple-600" />
                      Current Medications
                    </CardTitle>
                    <CardDescription>Active prescriptions and medication history</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="max-h-96 overflow-y-auto">
                      {patient.currentMedications && patient.currentMedications.length > 0 ? (
                        <div className="divide-y divide-gray-100">
                          {patient.currentMedications.map((medication, index) => (
                            <div key={medication.id || index} className="p-4 hover:bg-gray-50 transition-colors">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-semibold text-gray-900">{medication.name}</p>
                                  <p className="text-sm text-gray-600">{medication.dosage} • {medication.frequency}</p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    Started: {new Date(medication.startDate).toLocaleDateString()}
                                    {medication.endDate && ` • Ends: ${new Date(medication.endDate).toLocaleDateString()}`}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <Badge 
                                    variant={medication.status === 'active' ? 'default' : 'secondary'}
                                    className={medication.status === 'active' ? 'bg-green-100 text-green-700' : ''}
                                  >
                                    {medication.status}
                                  </Badge>
                                </div>
                              </div>
                              {medication.notes && (
                                <p className="mt-2 text-sm text-gray-600 italic">{medication.notes}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-8 text-center">
                          <Pill className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-600">No medications prescribed</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Add New Medication */}
                {canPerformAction('prescribe_medication') && (
                  <Card className="shadow-lg">
                    <CardHeader className="bg-linear-to-r from-indigo-50 to-indigo-100">
                      <CardTitle className="flex items-center">
                        <Plus className="h-5 w-5 mr-2 text-indigo-600" />
                        Prescribe Medication
                      </CardTitle>
                      <CardDescription>Add a new medication prescription</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 p-6">
                      <div className="space-y-2">
                        <Label htmlFor="med-name">Medication Name</Label>
                        <Input 
                          id="med-name"
                          value={newMedication.name}
                          onChange={(e) => setNewMedication(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Enter medication name"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="med-dosage">Dosage</Label>
                          <Input 
                            id="med-dosage"
                            value={newMedication.dosage}
                            onChange={(e) => setNewMedication(prev => ({ ...prev, dosage: e.target.value }))}
                            placeholder="e.g., 10mg"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="med-frequency">Frequency</Label>
                          <Input 
                            id="med-frequency"
                            value={newMedication.frequency}
                            onChange={(e) => setNewMedication(prev => ({ ...prev, frequency: e.target.value }))}
                            placeholder="e.g., Twice daily"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="med-instructions">Instructions</Label>
                        <Textarea 
                          id="med-instructions"
                          value={newMedication.instructions}
                          onChange={(e) => setNewMedication(prev => ({ ...prev, instructions: e.target.value }))}
                          placeholder="Additional instructions for the patient..."
                          rows={3}
                        />
                      </div>

                      <Button 
                        onClick={handleAddMedication}
                        disabled={!newMedication.name || !newMedication.dosage || !newMedication.frequency || saving}
                        className="w-full bg-purple-600 hover:bg-purple-700"
                      >
                        {saving ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Prescribing...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Prescribe Medication
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="reports" className="space-y-6">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Reports List */}
                <Card className="shadow-lg">
                  <CardHeader className="bg-linear-to-r from-orange-50 to-orange-100">
                    <CardTitle className="flex items-center">
                      <FileText className="h-5 w-5 mr-2 text-orange-600" />
                      Medical Reports
                    </CardTitle>
                    <CardDescription>Lab results, imaging, and medical documentation</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="max-h-96 overflow-y-auto">
                      {patient.reports && patient.reports.length > 0 ? (
                        <div className="divide-y divide-gray-100">
                          {patient.reports.map((report, index) => (
                            <div key={report.id || index} className="p-4 hover:bg-gray-50 transition-colors">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <p className="font-semibold text-gray-900">{report.title}</p>
                                    <Badge variant="outline" className={
                                      report.type === 'lab' ? 'border-blue-200 text-blue-700' :
                                      report.type === 'radiology' ? 'border-purple-200 text-purple-700' :
                                      report.type === 'consultation' ? 'border-green-200 text-green-700' :
                                      'border-gray-200 text-gray-700'
                                    }>
                                      {report.type}
                                    </Badge>
                                    {report.isCritical && (
                                      <Badge variant="destructive" className="animate-pulse">
                                        Critical
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">{report.content}</p>
                                  <p className="text-xs text-gray-500">
                                    Uploaded: {new Date(report.uploadedAt).toLocaleString()}
                                  </p>
                                </div>
                                <div className="ml-4">
                                  {report.fileUrl && (
                                    <Button variant="outline" size="sm">
                                      <Download className="h-3 w-3 mr-1" />
                                      Download
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-8 text-center">
                          <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-600">No reports uploaded</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Add New Report */}
                {canPerformAction('upload_report') && (
                  <Card className="shadow-lg">
                    <CardHeader className="bg-linear-to-r from-cyan-50 to-cyan-100">
                      <CardTitle className="flex items-center">
                        <Plus className="h-5 w-5 mr-2 text-cyan-600" />
                        Upload Report
                      </CardTitle>
                      <CardDescription>Add a new medical report or test result</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 p-6">
                      <div className="space-y-2">
                        <Label htmlFor="report-type">Report Type</Label>
                        <Select 
                          value={newReport.type} 
                          onValueChange={(value) => setNewReport(prev => ({ ...prev, type: value as any }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select report type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="lab">Laboratory</SelectItem>
                            <SelectItem value="radiology">Radiology</SelectItem>
                            <SelectItem value="consultation">Consultation</SelectItem>
                            <SelectItem value="discharge">Discharge</SelectItem>
                            <SelectItem value="progress">Progress Note</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="report-title">Title</Label>
                        <Input 
                          id="report-title"
                          value={newReport.title}
                          onChange={(e) => setNewReport(prev => ({ ...prev, title: e.target.value }))}
                          placeholder="Enter report title"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="report-content">Content</Label>
                        <Textarea 
                          id="report-content"
                          value={newReport.content}
                          onChange={(e) => setNewReport(prev => ({ ...prev, content: e.target.value }))}
                          placeholder="Enter report content, findings, or results..."
                          rows={6}
                        />
                      </div>

                      <Button 
                        onClick={handleAddReport}
                        disabled={!newReport.title || !newReport.content || saving}
                        className="w-full bg-orange-600 hover:bg-orange-700"
                      >
                        {saving ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Uploading Report...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Upload Report
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="notes" className="space-y-6">
              {user && (
                <Chat 
                  patientId={patient.id} 
                  currentUser={{
                    id: user.id,
                    name: user.name,
                    role: user.role
                  }}
                  patientName={patient.name}
                />
              )}
            </TabsContent>

            <TabsContent value="timeline" className="space-y-6">
              <Timeline patientId={patient.id} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}