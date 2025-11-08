# Surgery Simulation Sharing System

## Overview
Each surgery simulation now has a unique ID and can be shared via unique links or codes, allowing doctors to easily invite other doctors to collaborative surgery sessions.

## Features

### 1. Unique Session Identifiers
- **Session ID**: Unique identifier for each simulation (e.g., `session_1699441234567_abc123`)
- **Unique Link**: 32-character hex string for URL sharing (e.g., `a1b2c3d4e5f6...`)
- **Shareable Code**: 8-character alphanumeric code for easy sharing (e.g., `ABCD1234`)

### 2. Session Metadata Storage
Each simulation session stores the following metadata in MongoDB:

```javascript
{
  sessionId: String,           // Unique session identifier
  uniqueLink: String,          // 32-char hex for URL
  shareableCode: String,       // 8-char code
  title: String,               // Session name
  description: String,         // Optional description
  scenario: String,            // Surgery type
  creatorId: ObjectId,         // Host/creator
  maxParticipants: Number,     // Max number of participants
  inviteOnly: Boolean,         // Private session flag
  status: String,              // idle, active, paused, completed
  collaborativeData: {
    participants: Array,       // All participants
    totalMessages: Number,
    voiceTime: Number
  },
  // ... other simulation data
}
```

## API Endpoints

### Create New Simulation Session
```http
POST /api/simulations/sessions
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Cardiac Surgery Training",
  "description": "Advanced cardiac procedure simulation",
  "scenario": "cardiac-surgery",
  "maxParticipants": 6,
  "inviteOnly": false
}

Response:
{
  "success": true,
  "data": {
    "_id": "...",
    "sessionId": "session_...",
    "uniqueLink": "a1b2c3d4...",
    "shareableCode": "ABCD1234",
    "shareableLink": "http://localhost:3000/surgery-simulation?link=a1b2c3d4...",
    "shareableCodeLink": "http://localhost:3000/surgery-simulation?code=ABCD1234",
    // ... other fields
  }
}
```

### Join Session via Link or Code
```http
POST /api/simulations/sessions/join/:identifier
Authorization: Bearer <token>

:identifier can be either the uniqueLink or shareableCode

Response:
{
  "success": true,
  "message": "Successfully joined simulation session",
  "data": {
    // Full simulation session data
  }
}
```

### Get Session Info by Link/Code
```http
GET /api/simulations/sessions/link/:identifier

Response:
{
  "success": true,
  "data": {
    // Session information
  }
}
```

### Get Active Sessions
```http
GET /api/simulations/sessions/active?page=1&limit=10&scenario=cardiac-surgery&status=idle,active

Response:
{
  "success": true,
  "data": {
    "simulations": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3
    }
  }
}
```

## Usage Flow

### Creating and Sharing a Session

1. **Doctor creates a session**:
   ```javascript
   // Frontend
   const response = await fetch('/api/simulations/sessions', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       title: 'Morning Practice',
       scenario: 'appendectomy',
       maxParticipants: 4
     })
   });
   
   const { data } = await response.json();
   // data.shareableLink and data.shareableCode are now available
   ```

2. **Share via link or code**:
   - Copy `shareableLink`: `http://localhost:3000/surgery-simulation?link=abc123...`
   - Or share `shareableCode`: `ABCD1234`

3. **Other doctors join**:
   - Click the shared link (auto-joins)
   - Or enter the code manually on the surgery simulation page

### Joining a Session

#### Via Direct Link
```
http://localhost:3000/surgery-simulation?link=a1b2c3d4e5f6...
```
The page automatically detects the `link` parameter and joins the session.

#### Via Code
1. Go to the surgery simulation page
2. Enter the 8-character code in the "Join by Code" section
3. Click "Join Session"

#### Via Active Sessions List
- View all public (non-invite-only) active sessions
- Click "Join Session" on any available session

## Real-time Collaboration

### Socket Events
```javascript
// Join session
socket.emit('surgery:join-session', {
  sessionId,
  userId,
  userName,
  role: 'surgeon' | 'assistant' | 'observer'
});

// Participants update
socket.on('surgery:participants-update', (participants) => {
  // Update UI with current participants
});

// Tool interactions
socket.emit('surgery:tool-interact', {
  sessionId,
  userId,
  toolId,
  position: [x, y, z],
  rotation: [x, y, z]
});

// Tissue interactions
socket.emit('surgery:tissue-interact', {
  sessionId,
  userId,
  userName,
  point: [x, y, z],
  toolType: 'scalpel',
  force: 5.5
});

// Cursor updates
socket.emit('surgery:cursor-update', {
  sessionId,
  userId,
  userName,
  selectedTool: 'scalpel',
  position: [x, y, z],
  isActive: true
});
```

## Security Features

### 1. Access Control
- Only authenticated users can create or join sessions
- Invite-only sessions are hidden from public lists
- Participants are tracked and validated

### 2. Session Limits
- Maximum participants enforced
- Completed sessions cannot be joined
- Expired/inactive sessions can be cleaned up

### 3. Data Privacy
- Invite-only sessions don't expose full details to non-participants
- Personal information is sanitized in public listings

## Frontend Components

### Session Creation UI
- Form fields for title, description, scenario
- Max participants selector
- Invite-only checkbox
- Displays shareable link and code after creation

### Join Methods
1. **Direct Link**: URL parameter detection
2. **Code Input**: Manual entry with validation
3. **Session Browser**: List of public active sessions

### Share Dialog
- Shows both link and code
- One-click copy buttons
- Session information display
- Leave session option

## Database Indexes

The following indexes are created for optimal performance:
```javascript
- sessionId (indexed)
- uniqueLink (unique, indexed)
- shareableCode (unique, sparse, indexed)
- userId (indexed)
- creatorId (indexed)
- status (indexed)
- { userId: 1, createdAt: -1 }
- { status: 1, createdAt: -1 }
```

## Environment Variables

Add to your `.env` file:
```bash
FRONTEND_URL=http://localhost:3000  # For generating shareable links
BACKEND_URL=http://localhost:5000   # Backend API URL
```

## Testing

### Create a Session
```bash
curl -X POST http://localhost:5000/api/simulations/sessions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "title": "Test Session",
    "scenario": "basic-procedure",
    "maxParticipants": 4
  }'
```

### Join via Code
```bash
curl -X POST http://localhost:5000/api/simulations/sessions/join/ABCD1234 \
  -H "Authorization: Bearer <token>"
```

### Get Active Sessions
```bash
curl http://localhost:5000/api/simulations/sessions/active
```

## Future Enhancements

1. **Session Expiry**: Auto-expire sessions after inactivity
2. **Session History**: Track all sessions a user participated in
3. **Recordings**: Save and replay surgery sessions
4. **Analytics**: Generate performance reports per session
5. **Invitations**: Email/SMS invitations with links
6. **Permissions**: Fine-grained role-based permissions
7. **Session Scheduling**: Schedule sessions in advance
8. **Waiting Room**: Queue system for full sessions

## Troubleshooting

### Link Not Working
- Verify the link is complete and not truncated
- Check if session is still active (not completed)
- Ensure user is authenticated

### Code Invalid
- Codes are case-sensitive (uppercase)
- Must be exactly 8 characters
- Check if session still exists

### Cannot Join Full Session
- Maximum participants limit reached
- Wait for a participant to leave or create a new session

### Session Not Appearing in List
- Check if it's marked as invite-only
- Verify the session status is 'idle' or 'active'
- Refresh the session list
