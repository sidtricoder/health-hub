'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { apiService } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Save, X } from 'lucide-react'

interface Patient {
  _id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  dateOfBirth: string
  gender: 'male' | 'female' | 'other'
  address: {
    street: string
    city: string
    state: string
    zipCode: string
  }
  emergencyContact: {
    name: string
    phone: string
    relationship: string
  }
  medicalHistory: string[]
  allergies: string[]
  currentMedications: string[]
  insurance: {
    provider: string
    policyNumber: string
    groupNumber: string
  }
  primaryDoctor: string
  assignedNurse: string
}

interface User {
  _id: string
  firstName: string
  lastName: string
  email: string
  role: string
}

export default function EditPatientPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [patient, setPatient] = useState<Patient | null>(null)
  const [doctors, setDoctors] = useState<User[]>([])
  const [nurses, setNurses] = useState<User[]>([])
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: 'male' as 'male' | 'female' | 'other',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: ''
    },
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    },
    medicalHistory: [''],
    allergies: [''],
    currentMedications: [''],
    insurance: {
      provider: '',
      policyNumber: '',
      groupNumber: ''
    },
    primaryDoctor: '',
    assignedNurse: ''
  })

  // Check permissions
  const canEditPatient = () => {
    if (!user) return false
    return user.role === 'doctor' || user.role === 'receptionist' || user.role === 'admin'
  }

  useEffect(() => {
    if (!canEditPatient()) {
      router.push('/patients')
      console.error('You do not have permission to edit patients')
      return
    }
  }, [user, router])

  // Fetch patient data
  useEffect(() => {
    const fetchPatient = async () => {
      try {
        const response = await apiService.getPatient(params.id as string)
        setPatient(response.data as any)
        
        const data = response.data as any
        
        // Populate form data
        setFormData({
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          email: data.email || '',
          phone: data.phone || '',
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth).toISOString().split('T')[0] : '',
          gender: data.gender || 'male',
          address: {
            street: data.address?.street || '',
            city: data.address?.city || '',
            state: data.address?.state || '',
            zipCode: data.address?.zipCode || ''
          },
          emergencyContact: {
            name: data.emergencyContact?.name || '',
            phone: data.emergencyContact?.phone || '',
            relationship: data.emergencyContact?.relationship || ''
          },
          medicalHistory: data.medicalHistory?.length > 0 ? data.medicalHistory : [''],
          allergies: data.allergies?.length > 0 ? data.allergies : [''],
          currentMedications: data.currentMedications?.length > 0 ? data.currentMedications : [''],
          insurance: {
            provider: data.insurance?.provider || '',
            policyNumber: data.insurance?.policyNumber || '',
            groupNumber: data.insurance?.groupNumber || ''
          },
          primaryDoctor: data.primaryDoctor || '',
          assignedNurse: data.assignedNurse || ''
        })
      } catch (error) {
        console.error('Error fetching patient:', error)
        alert('Failed to load patient data')
        router.push('/patients')
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchPatient()
    }
  }, [params.id, router])

  // Fetch doctors and nurses
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const [doctorsResponse, nursesResponse] = await Promise.all([
          apiService.getDoctors(),
          apiService.getNurses()
        ])
        
        setDoctors(doctorsResponse.data as any || [])
        setNurses(nursesResponse.data as any || [])
      } catch (error) {
        console.error('Error fetching users:', error)
      }
    }

    fetchUsers()
  }, [])

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.')
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as any),
          [child]: value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }))
    }
  }

  const handleArrayChange = (field: 'medicalHistory' | 'allergies' | 'currentMedications', index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item: string, i: number) => 
        i === index ? value : item
      )
    }))
  }

  const addArrayItem = (field: 'medicalHistory' | 'allergies' | 'currentMedications') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }))
  }

  const removeArrayItem = (field: 'medicalHistory' | 'allergies' | 'currentMedications', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_: any, i: number) => i !== index)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      // Transform the data to match the backend model
      const addressString = [
        formData.address.street,
        formData.address.city,
        formData.address.state,
        formData.address.zipCode
      ].filter(part => part && part.trim() !== '').join(', ')

      // Validate required fields on frontend
      if (!addressString.trim()) {
        alert('Street address is required')
        return
      }

      if (!formData.primaryDoctor) {
        alert('Primary doctor selection is required')
        return
      }

      const transformedData: any = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        // Convert address object to string
        address: addressString,
        emergencyContact: formData.emergencyContact,
        // Convert simple string arrays to object arrays for model
        allergies: formData.allergies
          .filter(item => item.trim() !== '')
          .map(item => ({
            allergen: item,
            severity: 'mild',
            reaction: '',
            notes: ''
          })),
        currentMedications: formData.currentMedications
          .filter(item => item.trim() !== '')
          .map(item => ({
            name: item,
            dosage: '',
            frequency: '',
            prescribedBy: formData.primaryDoctor,
            status: 'active',
            notes: ''
          })),
        // Use assignedDoctor instead of primaryDoctor to match model
        assignedDoctor: formData.primaryDoctor
      }

      // Only include assignedNurse if it's not empty to avoid ObjectId casting errors
      if (formData.assignedNurse && formData.assignedNurse.trim() !== '') {
        transformedData.assignedNurse = formData.assignedNurse
      }

      console.log('Sending patient update data:', JSON.stringify(transformedData, null, 2))
      const response = await apiService.updatePatient(params.id as string, transformedData as any)

      alert('Patient updated successfully!')
      router.push(`/patients/${params.id}`)
    } catch (error) {
      console.error('Error updating patient:', error)
      alert(error instanceof Error ? error.message : 'Failed to update patient')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Patient Not Found</h1>
          <Button onClick={() => router.push('/patients')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Patients
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            onClick={() => router.push(`/patients/${params.id}`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">
            Edit Patient: {patient.firstName} {patient.lastName}
          </h1>
        </div>
        <Button 
          onClick={() => router.push(`/patients/${params.id}`)}
          variant="ghost"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="gender">Gender *</Label>
                <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)} required>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Address */}
        <Card>
          <CardHeader>
            <CardTitle>Address</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="street">Street Address *</Label>
              <Input
                id="street"
                value={formData.address.street}
                onChange={(e) => handleInputChange('address.street', e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.address.city}
                  onChange={(e) => handleInputChange('address.city', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={formData.address.state}
                  onChange={(e) => handleInputChange('address.state', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="zipCode">ZIP Code</Label>
                <Input
                  id="zipCode"
                  value={formData.address.zipCode}
                  onChange={(e) => handleInputChange('address.zipCode', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Emergency Contact */}
        <Card>
          <CardHeader>
            <CardTitle>Emergency Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="emergencyName">Contact Name *</Label>
                <Input
                  id="emergencyName"
                  value={formData.emergencyContact.name}
                  onChange={(e) => handleInputChange('emergencyContact.name', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="emergencyPhone">Contact Phone *</Label>
                <Input
                  id="emergencyPhone"
                  value={formData.emergencyContact.phone}
                  onChange={(e) => handleInputChange('emergencyContact.phone', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="emergencyRelationship">Relationship *</Label>
                <Input
                  id="emergencyRelationship"
                  value={formData.emergencyContact.relationship}
                  onChange={(e) => handleInputChange('emergencyContact.relationship', e.target.value)}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Medical Information */}
        <Card>
          <CardHeader>
            <CardTitle>Medical Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Medical History */}
            <div>
              <Label className="text-base font-medium">Medical History</Label>
              <div className="space-y-2 mt-2">
                {formData.medicalHistory.map((history, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={history}
                      onChange={(e) => handleArrayChange('medicalHistory', index, e.target.value)}
                      placeholder="Enter medical history item"
                    />
                    {formData.medicalHistory.length > 1 && (
                      <Button 
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeArrayItem('medicalHistory', index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button 
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addArrayItem('medicalHistory')}
                >
                  Add History Item
                </Button>
              </div>
            </div>

            {/* Allergies */}
            <div>
              <Label className="text-base font-medium">Allergies</Label>
              <div className="space-y-2 mt-2">
                {formData.allergies.map((allergy, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={allergy}
                      onChange={(e) => handleArrayChange('allergies', index, e.target.value)}
                      placeholder="Enter allergy"
                    />
                    {formData.allergies.length > 1 && (
                      <Button 
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeArrayItem('allergies', index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button 
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addArrayItem('allergies')}
                >
                  Add Allergy
                </Button>
              </div>
            </div>

            {/* Current Medications */}
            <div>
              <Label className="text-base font-medium">Current Medications</Label>
              <div className="space-y-2 mt-2">
                {formData.currentMedications.map((medication, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={medication}
                      onChange={(e) => handleArrayChange('currentMedications', index, e.target.value)}
                      placeholder="Enter medication"
                    />
                    {formData.currentMedications.length > 1 && (
                      <Button 
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeArrayItem('currentMedications', index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button 
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addArrayItem('currentMedications')}
                >
                  Add Medication
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Care Team */}
        <Card>
          <CardHeader>
            <CardTitle>Care Team</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="primaryDoctor">Primary Doctor *</Label>
                <Select value={formData.primaryDoctor} onValueChange={(value) => handleInputChange('primaryDoctor', value)} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select primary doctor" />
                  </SelectTrigger>
                  <SelectContent>
                    {doctors.map((doctor: any) => (
                      <SelectItem key={doctor._id} value={doctor._id}>
                        Dr. {doctor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="assignedNurse">Assigned Nurse</Label>
                <Select value={formData.assignedNurse} onValueChange={(value) => handleInputChange('assignedNurse', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select assigned nurse" />
                  </SelectTrigger>
                  <SelectContent>
                    {nurses.map((nurse: any) => (
                      <SelectItem key={nurse._id} value={nurse._id}>
                        {nurse.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Insurance */}
        <Card>
          <CardHeader>
            <CardTitle>Insurance Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="provider">Insurance Provider</Label>
                <Input
                  id="provider"
                  value={formData.insurance.provider}
                  onChange={(e) => handleInputChange('insurance.provider', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="policyNumber">Policy Number</Label>
                <Input
                  id="policyNumber"
                  value={formData.insurance.policyNumber}
                  onChange={(e) => handleInputChange('insurance.policyNumber', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="groupNumber">Group Number</Label>
                <Input
                  id="groupNumber"
                  value={formData.insurance.groupNumber}
                  onChange={(e) => handleInputChange('insurance.groupNumber', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-4 pt-6">
          <Button 
            type="button"
            variant="outline"
            onClick={() => router.push(`/patients/${params.id}`)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}