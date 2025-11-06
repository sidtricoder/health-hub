# Health Hub Backend API

A scalable Express.js backend for the Health Hub Electronic Medical Records (EMR) system with real-time collaboration features.

## Features

- **Authentication & Authorization**: JWT-based auth with role-based access control
- **Real-time Communication**: Socket.io integration for live updates
- **Patient Management**: Complete CRUD operations for patient records
- **Messaging System**: Real-time chat between healthcare providers
- **Notification System**: Task notifications and alerts
- **Audit Trail**: Timeline tracking of all patient-related activities
- **Security**: Rate limiting, CORS, helmet security headers
- **Validation**: Input validation with Joi schemas
- **Logging**: Winston-based structured logging

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Real-time**: Socket.io
- **Authentication**: JWT with bcrypt
- **Validation**: Joi
- **Security**: Helmet, CORS, Rate limiting
- **Logging**: Winston

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.js          # MongoDB connection
│   ├── controllers/             # Route handlers
│   │   ├── authController.js
│   │   ├── patientController.js
│   │   ├── messageController.js
│   │   ├── notificationController.js
│   │   └── timelineController.js
│   ├── middleware/
│   │   ├── auth.js             # Authentication middleware
│   │   ├── errorHandler.js     # Error handling
│   │   └── validation.js       # Input validation
│   ├── models/                 # Mongoose schemas
│   │   ├── User.js
│   │   ├── Patient.js
│   │   ├── Message.js
│   │   ├── Notification.js
│   │   └── TimelineEvent.js
│   ├── routes/                 # API routes
│   │   ├── auth.js
│   │   ├── patients.js
│   │   ├── messages.js
│   │   ├── notifications.js
│   │   └── timeline.js
│   ├── sockets/
│   │   └── socketHandler.js    # Socket.io handlers
│   ├── utils/
│   │   └── logger.js           # Winston logger
│   ├── validators/             # Joi validation schemas
│   │   └── index.js
│   └── app.js                  # Express app configuration
├── tests/
│   └── api.test.js
├── .env.example
├── package.json
├── server.js                   # Server entry point
└── README.md
```

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd health-hub/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```

   Update the `.env` file with your configuration:
   ```env
   PORT=3001
   MONGODB_URI=mongodb://localhost:27017/health-hub
   JWT_SECRET=your-super-secret-jwt-key-here
   FRONTEND_URL=http://localhost:3000
   ```

4. **Start MongoDB**
   Make sure MongoDB is running locally or update `MONGODB_URI` for Atlas.

5. **Run the server**
   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm start
   ```

The API will be available at `http://localhost:3001`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/updatedetails` - Update user details
- `PUT /api/auth/updatepassword` - Update password
- `GET /api/auth/logout` - Logout

### Patients
- `GET /api/patients` - Get all patients (paginated)
- `GET /api/patients/:id` - Get single patient
- `POST /api/patients` - Create patient
- `PUT /api/patients/:id` - Update patient
- `DELETE /api/patients/:id` - Delete patient
- `POST /api/patients/:id/vitals` - Add vital signs
- `POST /api/patients/:id/medications` - Add medication
- `POST /api/patients/:id/reports` - Add medical report
- `GET /api/patients/:id/stats` - Get patient statistics

### Messages
- `GET /api/messages/:patientId` - Get messages for patient
- `POST /api/messages` - Send message
- `PUT /api/messages/:patientId/read` - Mark messages as read
- `GET /api/messages/unread` - Get unread message count

### Notifications
- `GET /api/notifications` - Get notifications (paginated)
- `POST /api/notifications` - Create notification
- `PUT /api/notifications/:id/read` - Mark as read
- `PUT /api/notifications/read-all` - Mark all as read
- `DELETE /api/notifications/:id` - Delete notification
- `GET /api/notifications/unread-count` - Get unread count

### Timeline
- `GET /api/timeline/:patientId` - Get timeline events
- `POST /api/timeline` - Create timeline event
- `GET /api/timeline/:patientId/type/:type` - Get events by type
- `GET /api/timeline/:patientId/summary` - Get timeline summary

## User Roles

- **admin**: Full system access
- **doctor**: Patient management, messaging, timeline updates
- **nurse**: Patient care, vital signs, medication management
- **receptionist**: Patient registration, basic updates
- **lab_technician**: Lab results and reports

## Real-time Features

The API includes Socket.io integration for real-time features:

- **Live Messaging**: Instant chat between healthcare providers
- **Patient Updates**: Real-time notifications of patient changes
- **Notifications**: Live notification delivery
- **User Presence**: Online/offline status indicators
- **Typing Indicators**: Show when users are typing

### Socket Events

```javascript
// Join user room
socket.emit('join', userId);

// Send message
socket.emit('send_message', {
  patientId,
  content,
  senderId,
  senderName,
  senderRole
});

// Patient update
socket.emit('patient_update', {
  patientId,
  updateType,
  updateData,
  userId,
  userName,
  userRole
});

// Send notification
socket.emit('send_notification', {
  recipientId,
  type,
  title,
  message,
  patientId,
  metadata
});
```

## Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for password security
- **Rate Limiting**: Prevents abuse with request limits
- **CORS**: Configured for frontend integration
- **Helmet**: Security headers
- **Input Validation**: Joi schemas prevent malicious input
- **Role-based Access**: Granular permissions per user role

## Error Handling

The API includes comprehensive error handling:

- **Validation Errors**: Detailed field-level validation messages
- **Authentication Errors**: Clear unauthorized access responses
- **Database Errors**: Proper error logging and user-friendly messages
- **Rate Limiting**: Informative rate limit exceeded responses

## Logging

Winston logger provides structured logging:

- **Console Logging**: Development-friendly console output
- **File Logging**: Persistent logs in `logs/` directory
- **Error Tracking**: Separate error log files
- **Request Logging**: All API requests are logged

## Contributing

1. Follow the existing code structure
2. Add tests for new features
3. Update documentation
4. Use meaningful commit messages

## License

MIT License - see LICENSE file for details