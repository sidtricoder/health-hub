'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowLeft, 
  Save, 
  User, 
  Calendar, 
  Phone, 
  Mail, 
  MapPin, 
  Heart,
  AlertCircle,
  Check
} from 'lucide-react';
import { apiService } from '@/lib/api';

interface PatientFormData {
  name: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  email: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  medicalHistory: string[];
  allergies: string[];
  currentMedications: string[];
  assignedDoctor: string;
  assignedNurse: string;
}

export default function NewPatientPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [doctors, setDoctors] = useState<any[]>([]);
  const [nurses, setNurses] = useState<any[]>([]);
  const [medicalHistoryInput, setMedicalHistoryInput] = useState('');
  const [allergiesInput, setAllergiesInput] = useState('');
  const [medicationsInput, setMedicationsInput] = useState('');

  const [formData, setFormData] = useState<PatientFormData>({
    name: '',
    dateOfBirth: '',
    gender: '',
    phone: '',
    email: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'United States'
    },
    emergencyContact: {
      name: '',
      relationship: '',
      phone: ''
    },
    medicalHistory: [],
    allergies: [],
    currentMedications: [],
    assignedDoctor: '',
    assignedNurse: ''
  });

  useEffect(() => {
    // Check if user can create patients
    if (!user) {
      router.push('/login');
      return;
    }

    if (user.role !== 'admin' && user.role !== 'receptionist') {
      router.push('/patients');
      return;
    }

    // Load doctors and nurses from the database
    loadStaffMembers();
  }, [user, router]);

  const loadStaffMembers = async () => {
    try {
      // Load doctors
      const doctorsResponse = await apiService.getDoctors();
      if (doctorsResponse.success) {
        setDoctors(doctorsResponse.data);
      }

      // Load nurses  
      const nursesResponse = await apiService.getNurses();
      if (nursesResponse.success) {
        setNurses(nursesResponse.data);
      }
    } catch (error) {
      console.error('Error loading staff members:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof PatientFormData] as any),
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Patient name is required';
    }

    // Check if name has at least first name
    const [firstName, ...lastNameParts] = formData.name.split(' ');
    if (!firstName.trim()) {
      newErrors.name = 'Patient name is required';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[\+]?[\d\s\-\(\)]+$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    } else {
      const birthDate = new Date(formData.dateOfBirth);
      const today = new Date();
      if (birthDate >= today) {
        newErrors.dateOfBirth = 'Date of birth must be in the past';
      }
    }

    if (!formData.gender) {
      newErrors.gender = 'Gender is required';
    }

    if (!formData.assignedDoctor) {
      newErrors.assignedDoctor = 'Assigned doctor is required';
    }

    if (!formData.emergencyContact.name.trim()) {
      newErrors['emergencyContact.name'] = 'Emergency contact name is required';
    }

    if (!formData.emergencyContact.phone.trim()) {
      newErrors['emergencyContact.phone'] = 'Emergency contact phone is required';
    } else if (!/^[\+]?[\d\s\-\(\)]+$/.test(formData.emergencyContact.phone)) {
      newErrors['emergencyContact.phone'] = 'Please enter a valid emergency contact phone number';
    }

    if (!formData.emergencyContact.relationship.trim()) {
      newErrors['emergencyContact.relationship'] = 'Emergency contact relationship is required';
    }

    // Address validation - require at least city or street
    if (!formData.address.street.trim() && !formData.address.city.trim()) {
      newErrors['address'] = 'Please provide at least street or city';
    }

    if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Form submitted - starting validation...');
    console.log('Form data:', formData);
    
    if (!validateForm()) {
      console.log('Form validation failed');
      console.log('Current errors:', errors);
      return;
    }

    console.log('Form validation passed - proceeding with submission');
    setLoading(true);
    
    try {
      // Format address as string
      const fullAddress = `${formData.address.street}, ${formData.address.city}, ${formData.address.state} ${formData.address.zipCode}, ${formData.address.country}`;

      // Split name into first and last name
      const [firstName, ...lastNameParts] = formData.name.split(' ');
      const lastName = lastNameParts.join(' ') || firstName; // Use firstName as lastName if no last name provided

      // Format medications to match backend structure
      const formattedMedications = medicationsInput
        .split('\n')
        .map((item: string) => item.trim())
        .filter((item: string) => item.length > 0)
        .map((medication: string) => ({
          name: medication,
          dosage: 'TBD', // Default values since not specified in form
          frequency: 'TBD',
          prescribedBy: formData.assignedDoctor,
          status: 'active' as const,
          notes: ''
        }));

      // Format allergies to match backend structure  
      const formattedAllergies = allergiesInput
        .split('\n')
        .map((item: string) => item.trim())
        .filter((item: string) => item.length > 0)
        .map((allergen: string) => ({
          allergen: allergen,
          severity: 'mild' as const,
          reaction: 'Unknown',
          notes: ''
        }));

      const processedData = {
        firstName: firstName,
        lastName: lastName || 'Unknown', // Provide default if empty
        email: formData.email || undefined, // Only include if provided
        phone: formData.phone || '000-000-0000', // Provide default if empty
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender as 'male' | 'female' | 'other',
        address: fullAddress,
        emergencyContact: {
          name: formData.emergencyContact.name || 'Unknown',
          relationship: (formData.emergencyContact.relationship || 'other') as 'spouse' | 'parent' | 'child' | 'sibling' | 'friend' | 'other',
          phone: formData.emergencyContact.phone || '000-000-0000'
        },
        assignedDoctor: formData.assignedDoctor,
        assignedNurse: formData.assignedNurse || undefined,
        currentMedications: formattedMedications,
        allergies: formattedAllergies
      };

      console.log('Submitting patient data:', processedData);
      const response = await apiService.createPatient(processedData as any);
      
      if (response.success) {
        console.log('Patient created successfully:', response);
        // Success - redirect to the new patient's page
        router.push(`/patients/${response.data.id}?created=true`);
      } else {
        throw new Error('Failed to create patient');
      }
    } catch (error) {
      console.error('Error creating patient:', error);
      setErrors({
        submit: error instanceof Error ? error.message : 'Failed to create patient. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

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
                onClick={() => router.push('/patients')}
                className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Patients
              </Button>
              <div className="flex items-center space-x-2">
                <User className="h-6 w-6 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">Add New Patient</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2 text-blue-600" />
                Basic Information
              </CardTitle>
              <CardDescription>
                Enter the patient's personal information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter patient's full name"
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-600 mt-1 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.name}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                    className={errors.dateOfBirth ? 'border-red-500' : ''}
                  />
                  {errors.dateOfBirth && (
                    <p className="text-sm text-red-600 mt-1 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.dateOfBirth}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="gender">Gender *</Label>
                  <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                    <SelectTrigger className={errors.gender ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.gender && (
                    <p className="text-sm text-red-600 mt-1 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.gender}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="Enter phone number"
                    className={errors.phone ? 'border-red-500' : ''}
                    required
                  />
                  {errors.phone && (
                    <p className="text-sm text-red-600 mt-1 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.phone}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="Enter email address"
                    className={errors.email ? 'border-red-500' : ''}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-600 mt-1 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.email}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Address Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-blue-600" />
                Address Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="address.street">Street Address</Label>
                  <Input
                    id="address.street"
                    value={formData.address.street}
                    onChange={(e) => handleInputChange('address.street', e.target.value)}
                    placeholder="Enter street address"
                  />
                </div>

                <div>
                  <Label htmlFor="address.city">City</Label>
                  <Input
                    id="address.city"
                    value={formData.address.city}
                    onChange={(e) => handleInputChange('address.city', e.target.value)}
                    placeholder="Enter city"
                  />
                </div>

                <div>
                  <Label htmlFor="address.state">State</Label>
                  <Input
                    id="address.state"
                    value={formData.address.state}
                    onChange={(e) => handleInputChange('address.state', e.target.value)}
                    placeholder="Enter state"
                  />
                </div>

                <div>
                  <Label htmlFor="address.zipCode">ZIP Code</Label>
                  <Input
                    id="address.zipCode"
                    value={formData.address.zipCode}
                    onChange={(e) => handleInputChange('address.zipCode', e.target.value)}
                    placeholder="Enter ZIP code"
                  />
                </div>

                <div>
                  <Label htmlFor="address.country">Country</Label>
                  <Input
                    id="address.country"
                    value={formData.address.country}
                    onChange={(e) => handleInputChange('address.country', e.target.value)}
                    placeholder="Enter country"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Emergency Contact */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Phone className="h-5 w-5 mr-2 text-blue-600" />
                Emergency Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="emergencyContact.name">Contact Name *</Label>
                  <Input
                    id="emergencyContact.name"
                    value={formData.emergencyContact.name}
                    onChange={(e) => handleInputChange('emergencyContact.name', e.target.value)}
                    placeholder="Enter contact name"
                    className={errors['emergencyContact.name'] ? 'border-red-500' : ''}
                    required
                  />
                  {errors['emergencyContact.name'] && (
                    <p className="text-sm text-red-600 mt-1 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors['emergencyContact.name']}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="emergencyContact.relationship">Relationship *</Label>
                  <select
                    id="emergencyContact.relationship"
                    value={formData.emergencyContact.relationship}
                    onChange={(e) => handleInputChange('emergencyContact.relationship', e.target.value)}
                    className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background ${errors['emergencyContact.relationship'] ? 'border-red-500' : ''}`}
                    required
                  >
                    <option value="">Select relationship</option>
                    <option value="spouse">Spouse</option>
                    <option value="parent">Parent</option>
                    <option value="child">Child</option>
                    <option value="sibling">Sibling</option>
                    <option value="friend">Friend</option>
                    <option value="other">Other</option>
                  </select>
                  {errors['emergencyContact.relationship'] && (
                    <p className="text-sm text-red-600 mt-1 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors['emergencyContact.relationship']}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="emergencyContact.phone">Contact Phone *</Label>
                  <Input
                    id="emergencyContact.phone"
                    value={formData.emergencyContact.phone}
                    onChange={(e) => handleInputChange('emergencyContact.phone', e.target.value)}
                    placeholder="Enter contact phone"
                    className={errors['emergencyContact.phone'] ? 'border-red-500' : ''}
                    required
                  />
                  {errors['emergencyContact.phone'] && (
                    <p className="text-sm text-red-600 mt-1 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors['emergencyContact.phone']}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Medical Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Heart className="h-5 w-5 mr-2 text-blue-600" />
                Medical Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="assignedDoctor">Assigned Doctor *</Label>
                  <Select 
                    value={formData.assignedDoctor} 
                    onValueChange={(value) => handleInputChange('assignedDoctor', value)}
                  >
                    <SelectTrigger className={errors.assignedDoctor ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select assigned doctor" />
                    </SelectTrigger>
                    <SelectContent>
                      {doctors.map((doctor) => (
                        <SelectItem key={doctor.id} value={doctor.id}>
                          {doctor.name} - {doctor.specialization}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.assignedDoctor && (
                    <p className="text-sm text-red-600 mt-1 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.assignedDoctor}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="assignedNurse">Assigned Nurse</Label>
                  <Select 
                    value={formData.assignedNurse} 
                    onValueChange={(value) => handleInputChange('assignedNurse', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select assigned nurse (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {nurses.map((nurse) => (
                        <SelectItem key={nurse.id} value={nurse.id}>
                          {nurse.name} - {nurse.department}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="medicalHistory">Medical History</Label>
                  <Textarea
                    id="medicalHistory"
                    value={medicalHistoryInput}
                    onChange={(e) => setMedicalHistoryInput(e.target.value)}
                    placeholder="Enter medical history items (one per line)"
                    rows={4}
                  />
                  <p className="text-xs text-gray-500 mt-1">Enter each item on a new line</p>
                </div>

                <div>
                  <Label htmlFor="allergies">Allergies</Label>
                  <Textarea
                    id="allergies"
                    value={allergiesInput}
                    onChange={(e) => setAllergiesInput(e.target.value)}
                    placeholder="Enter allergies (one per line)"
                    rows={4}
                  />
                  <p className="text-xs text-gray-500 mt-1">Enter each allergy on a new line</p>
                </div>

                <div>
                  <Label htmlFor="currentMedications">Current Medications</Label>
                  <Textarea
                    id="currentMedications"
                    value={medicationsInput}
                    onChange={(e) => setMedicationsInput(e.target.value)}
                    placeholder="Enter current medications (one per line)"
                    rows={4}
                  />
                  <p className="text-xs text-gray-500 mt-1">Enter each medication on a new line</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Error Display */}
          {errors.submit && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-center text-red-600">
                  <AlertCircle className="h-5 w-5 mr-2" />
                  <span>{errors.submit}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/patients')}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Creating Patient...
                </div>
              ) : (
                <div className="flex items-center">
                  <Save className="h-4 w-4 mr-2" />
                  Create Patient
                </div>
              )}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}