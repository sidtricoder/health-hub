'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Activity, FileText, Pill, User, Clock } from 'lucide-react';
import { TimelineEvent, UserRole } from '@/types';

interface TimelineProps {
  patientId: string;
}

// Mock timeline events
const mockTimelineEvents: TimelineEvent[] = [
  {
    id: '1',
    patientId: '1',
    type: 'patient_admitted',
    description: 'Patient admitted to hospital',
    timestamp: '2024-01-15T08:00:00Z',
    userId: 'recep1',
    userName: 'Receptionist Davis',
    userRole: 'receptionist'
  },
  {
    id: '2',
    patientId: '1',
    type: 'vital_added',
    description: 'Vital signs recorded: BP 120/80, HR 72, Temp 98.6°F',
    timestamp: '2024-01-15T09:00:00Z',
    userId: 'nurse1',
    userName: 'Nurse Johnson',
    userRole: 'nurse'
  },
  {
    id: '3',
    patientId: '1',
    type: 'medication_changed',
    description: 'Prescribed Lisinopril 10mg daily and Metformin 500mg twice daily',
    timestamp: '2024-01-15T09:30:00Z',
    userId: 'doc1',
    userName: 'Dr. Smith',
    userRole: 'doctor'
  },
  {
    id: '4',
    patientId: '1',
    type: 'report_uploaded',
    description: 'Lab report uploaded: Complete Blood Count',
    timestamp: '2024-01-15T10:15:00Z',
    userId: 'lab1',
    userName: 'Lab Tech Wilson',
    userRole: 'lab_technician'
  },
  {
    id: '5',
    patientId: '1',
    type: 'note_added',
    description: 'Added note: Patient reports chest pain, prescribed aspirin',
    timestamp: '2024-01-15T10:30:00Z',
    userId: 'doc1',
    userName: 'Dr. Smith',
    userRole: 'doctor'
  }
];

const eventIcons = {
  patient_admitted: User,
  patient_discharged: User,
  vital_added: Activity,
  medication_changed: Pill,
  report_uploaded: FileText,
  note_added: Clock
};

const roleColors = {
  doctor: 'bg-blue-100 text-blue-800',
  nurse: 'bg-green-100 text-green-800',
  lab_technician: 'bg-purple-100 text-purple-800',
  receptionist: 'bg-orange-100 text-orange-800',
  admin: 'bg-gray-100 text-gray-800'
};

export function Timeline({ patientId }: TimelineProps) {
  const events = mockTimelineEvents.filter(event => event.patientId === patientId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Patient Timeline</CardTitle>
        <CardDescription>Audit log of all patient-related activities</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {events.map((event, index) => {
            const Icon = eventIcons[event.type];
            const isLast = index === events.length - 1;

            return (
              <div key={event.id} className="flex items-start space-x-4">
                {/* Timeline line */}
                <div className="flex flex-col items-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Icon className="h-5 w-5" />
                  </div>
                  {!isLast && <div className="h-6 w-px bg-border" />}
                </div>

                {/* Event content */}
                <div className="flex-1 pb-6">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="text-sm font-medium text-gray-900">
                      {event.description}
                    </h4>
                  </div>

                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {event.userName.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <span>{event.userName}</span>
                    </div>

                    <Badge
                      variant="secondary"
                      className={`text-xs ${roleColors[event.userRole]}`}
                    >
                      {event.userRole.replace('_', ' ')}
                    </Badge>

                    <span>
                      {new Date(event.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}