'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, Edit, MessageSquare, Activity, FileText, Pill, Clock } from 'lucide-react';
import { Chat } from '@/components/chat/Chat';
import { Timeline } from '@/components/timeline/Timeline';
import { Patient, UserRole } from '@/types';

// Mock patient data
const mockPatient: Patient = {
  id: '1',
  name: 'John Doe',
  dateOfBirth: '1985-03-15',
  gender: 'male',
  phone: '555-0123',
  email: 'john.doe@email.com',
  address: '123 Main St, Anytown, USA',
  medicalRecordNumber: 'MRN001',
  admissionDate: '2024-01-15',
  bedNumber: 'B-205',
  status: 'active',
  assignedDoctor: 'Dr. Smith',
  currentMedications: [
    {
      id: '1',
      name: 'Lisinopril',
      dosage: '10mg',
      frequency: 'Once daily',
      startDate: '2024-01-15',
      prescribedBy: 'Dr. Smith',
      status: 'active'
    },
    {
      id: '2',
      name: 'Metformin',
      dosage: '500mg',
      frequency: 'Twice daily',
      startDate: '2024-01-15',
      prescribedBy: 'Dr. Smith',
      status: 'active'
    }
  ],
  vitals: [
    {
      id: '1',
      type: 'blood_pressure',
      value: '120/80',
      unit: 'mmHg',
      recordedAt: '2024-01-20T10:00:00Z',
      recordedBy: 'Nurse Johnson'
    },
    {
      id: '2',
      type: 'heart_rate',
      value: '72',
      unit: 'bpm',
      recordedAt: '2024-01-20T10:00:00Z',
      recordedBy: 'Nurse Johnson'
    }
  ],
  reports: [
    {
      id: '1',
      type: 'lab',
      title: 'Complete Blood Count',
      content: 'All values within normal range',
      uploadedBy: 'Lab Tech Wilson',
      uploadedAt: '2024-01-18T14:30:00Z'
    }
  ],
  emergencyContact: {
    name: 'Jane Doe',
    phone: '555-0124',
    relationship: 'wife'
  }
};

export default function PatientPage() {
  const params = useParams();
  const router = useRouter();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; role: UserRole } | null>(null);

  useEffect(() => {
    // In real app, fetch patient data
    setPatient(mockPatient);

    // Get current user
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setCurrentUser({
        id: user.id,
        name: user.name,
        role: user.role
      });
    }
  }, [params.id]);

  if (!patient) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <div className="flex items-center space-x-4">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="text-lg">
                    {patient.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{patient.name}</h1>
                  <p className="text-sm text-gray-500">MRN: {patient.medicalRecordNumber}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant={patient.status === 'active' ? 'default' : 'secondary'}>
                {patient.status}
              </Badge>
              {currentUser?.role === 'doctor' && (
                <Button variant="outline" size="sm">
                  Prescribe Medication
                </Button>
              )}
              {currentUser?.role === 'nurse' && (
                <Button variant="outline" size="sm">
                  Record Vitals
                </Button>
              )}
              {currentUser?.role === 'lab_technician' && (
                <Button variant="outline" size="sm">
                  Upload Report
                </Button>
              )}
              {currentUser?.role === 'receptionist' && (
                <Button variant="outline" size="sm">
                  Update Bed Assignment
                </Button>
              )}
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit Patient
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="vitals">
                <Activity className="h-4 w-4 mr-2" />
                Vitals
              </TabsTrigger>
              <TabsTrigger value="medications">
                <Pill className="h-4 w-4 mr-2" />
                Medications
              </TabsTrigger>
              <TabsTrigger value="reports">
                <FileText className="h-4 w-4 mr-2" />
                Reports
              </TabsTrigger>
              <TabsTrigger value="notes">
                <MessageSquare className="h-4 w-4 mr-2" />
                Notes
              </TabsTrigger>
              <TabsTrigger value="timeline">
                <Clock className="h-4 w-4 mr-2" />
                Timeline
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Patient Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Date of Birth</label>
                        <p className="text-sm">{new Date(patient.dateOfBirth).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Gender</label>
                        <p className="text-sm capitalize">{patient.gender}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Phone</label>
                        <p className="text-sm">{patient.phone}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Email</label>
                        <p className="text-sm">{patient.email}</p>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Address</label>
                      <p className="text-sm">{patient.address}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Hospital Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Admission Date</label>
                        <p className="text-sm">{new Date(patient.admissionDate).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Bed Number</label>
                        <p className="text-sm">{patient.bedNumber}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Assigned Doctor</label>
                        <p className="text-sm">{patient.assignedDoctor}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Status</label>
                        <Badge variant={patient.status === 'active' ? 'default' : 'secondary'}>
                          {patient.status}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Emergency Contact</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Name</label>
                      <p className="text-sm">{patient.emergencyContact.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Phone</label>
                      <p className="text-sm">{patient.emergencyContact.phone}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Relationship</label>
                      <p className="text-sm capitalize">{patient.emergencyContact.relationship}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="vitals" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Vital Signs</CardTitle>
                  <CardDescription>Recent vital measurements</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {patient.vitals.map((vital) => (
                      <div key={vital.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium capitalize">{vital.type.replace('_', ' ')}</p>
                          <p className="text-sm text-gray-500">
                            Recorded by {vital.recordedBy} on {new Date(vital.recordedAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold">{vital.value}</p>
                          <p className="text-sm text-gray-500">{vital.unit}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="medications" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Current Medications</CardTitle>
                  <CardDescription>Active prescriptions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {patient.currentMedications.map((medication) => (
                      <div key={medication.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">{medication.name}</p>
                          <p className="text-sm text-gray-500">
                            {medication.dosage} • {medication.frequency}
                          </p>
                          <p className="text-sm text-gray-500">
                            Prescribed by {medication.prescribedBy} on {new Date(medication.startDate).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant={medication.status === 'active' ? 'default' : 'secondary'}>
                          {medication.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reports" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Medical Reports</CardTitle>
                  <CardDescription>Lab results and medical reports</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {patient.reports.map((report) => (
                      <div key={report.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{report.title}</h4>
                          <Badge variant="outline">{report.type}</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{report.content}</p>
                        <p className="text-sm text-gray-500">
                          Uploaded by {report.uploadedBy} on {new Date(report.uploadedAt).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notes" className="space-y-6">
              {currentUser && (
                <Chat patientId={patient.id} currentUser={currentUser} />
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