// Test file to verify role-based surgery simulation button access

interface TestUser {
  id: string;
  name: string;
  role: 'doctor' | 'nurse' | 'lab_technician' | 'receptionist' | 'admin';
}

// Test cases for different user roles
const testUsers: TestUser[] = [
  { id: '1', name: 'Dr. John Smith', role: 'doctor' },
  { id: '2', name: 'Nurse Jane Doe', role: 'nurse' },
  { id: '3', name: 'Mike Wilson', role: 'lab_technician' },
  { id: '4', name: 'Sarah Johnson', role: 'receptionist' },
  { id: '5', name: 'Admin User', role: 'admin' }
];

// Function to check if surgery simulation button should be visible
function shouldShowSurgeryButton(user: TestUser): boolean {
  return user.role === 'doctor';
}

// Test all user roles
testUsers.forEach(user => {
  const shouldShow = shouldShowSurgeryButton(user);
  console.log(`${user.name} (${user.role}): Surgery Simulation Button ${shouldShow ? 'VISIBLE' : 'HIDDEN'}`);
});

// Expected output:
// Dr. John Smith (doctor): Surgery Simulation Button VISIBLE
// Nurse Jane Doe (nurse): Surgery Simulation Button HIDDEN
// Mike Wilson (lab_technician): Surgery Simulation Button HIDDEN
// Sarah Johnson (receptionist): Surgery Simulation Button HIDDEN
// Admin User (admin): Surgery Simulation Button HIDDEN

export { shouldShowSurgeryButton };