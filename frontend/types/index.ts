export type UserRole = 'doctor' | 'nurse' | 'lab_technician' | 'receptionist' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  specialization?: string;
  department?: string;
  licenseNumber?: string;
  phone?: string;
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  isActive?: boolean;
}

export interface Patient {
  id: string; // Required
  _id?: string;
  name: string; // Required - Combined firstName + lastName
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  phone: string;
  email?: string;
  address: string;
  emergencyContact: {
    name: string;
    phone: string;
    relationship: 'spouse' | 'parent' | 'child' | 'sibling' | 'friend' | 'other';
  };
  medicalRecordNumber: string; // Required
  admissionDate: string;
  bedNumber?: string;
  roomNumber?: string;
  status: 'active' | 'discharged' | 'transferred' | 'deceased';
  assignedDoctor: string;
  assignedNurse?: string;
  currentMedications: {
    id?: string;
    name: string;
    dosage: string;
    frequency: string;
    startDate: string; // Required
    endDate?: string;
    prescribedBy: string;
    status?: 'active' | 'discontinued' | 'completed';
    notes?: string;
  }[];
  allergies?: {
    allergen: string;
    severity: 'mild' | 'moderate' | 'severe';
    reaction: string;
    notes?: string;
  }[];
  vitals: Vital[];
  reports: Report[];
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate?: string;
  prescribedBy: string;
  status: 'active' | 'discontinued' | 'completed';
  notes?: string;
}

export interface Vital {
  id: string;
  type: 'blood_pressure' | 'heart_rate' | 'temperature' | 'oxygen_saturation' | 'weight' | 'height' | 'respiratory_rate';
  value: string;
  unit: string;
  recordedAt: string;
  recordedBy: string;
  notes?: string;
}

export interface Report {
  id: string;
  type: 'lab' | 'radiology' | 'consultation' | 'discharge' | 'progress';
  title: string;
  content: string;
  uploadedBy: string;
  uploadedAt: string;
  fileUrl?: string;
  isCritical?: boolean;
}

export interface Message {
  id: string;
  patientId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  content: string;
  timestamp: string;
  type: 'text' | 'system';
}

export interface TimelineEvent {
  id: string;
  patientId: string;
  type: 'vital_added' | 'medication_changed' | 'report_uploaded' | 'patient_admitted' | 'patient_discharged' | 'note_added';
  description: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  metadata?: Record<string, any>;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'task_assigned' | 'report_ready' | 'medication_reminder' | 'patient_update';
  title: string;
  message: string;
  patientId?: string;
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
}

export interface Task {
  id: string;
  patientId: string;
  type: 'prescribe_test' | 'upload_report' | 'update_vitals' | 'administer_medication';
  title: string;
  description: string;
  assignedTo: string;
  assignedBy: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  createdAt: string;
  completedAt?: string;
}