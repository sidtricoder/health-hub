# Surgery Simulation Sharing - Quick Reference

## What Changed?

Each surgery simulation now has:
- ✅ **Unique ID** (`sessionId`) for tracking
- ✅ **Shareable Link** (32-char hex string)
- ✅ **Shareable Code** (8-char alphanumeric, e.g., "ABCD1234")
- ✅ **Metadata stored in MongoDB**
- ✅ **Real-time participant tracking**

## How to Use

### As a Host (Creating a Session)

1. Go to `/surgery-simulation`
2. Fill in session details:
   - Name
   - Description (optional)
   - Scenario type
   - Max participants
   - Invite-only (checkbox)
3. Click "Create Session"
4. Share the link or code with other doctors

**Two ways to share:**
- **Link**: `http://localhost:3000/surgery-simulation?link=abc123...`
- **Code**: `ABCD1234` (8 characters)

### As a Participant (Joining a Session)

**Method 1: Direct Link**
- Click the shared link → Auto-joins

**Method 2: Enter Code**
1. Go to `/surgery-simulation`
2. Enter the 8-character code
3. Click "Join Session"

**Method 3: Browse Sessions**
1. View available public sessions
2. Click "Join" on any session

## New API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/simulations/sessions` | POST | Create new session |
| `/api/simulations/sessions/active` | GET | List active sessions |
| `/api/simulations/sessions/join/:identifier` | POST | Join via link/code |
| `/api/simulations/sessions/link/:identifier` | GET | Get session info |

## Database Schema Additions

```javascript
// New fields in Simulation model
{
  uniqueLink: String,        // 32-char hex (unique)
  shareableCode: String,     // 8-char code (unique)
  creatorId: ObjectId,       // Session creator
  scenario: String,          // Surgery type
  maxParticipants: Number,   // Max users (default: 6)
  inviteOnly: Boolean,       // Private session flag
}
```

## Socket Events

```javascript
// Join session
socket.emit('surgery:join-session', { sessionId, userId, userName, role });

// Leave session  
socket.emit('surgery:leave-session', { sessionId, userId });

// Listen for participants
socket.on('surgery:participants-update', (participants) => {});
socket.on('surgery:participant-joined', (user) => {});
socket.on('surgery:participant-left', (user) => {});

// Tool & tissue interactions
socket.emit('surgery:tool-interact', { sessionId, userId, toolId, position, rotation });
socket.emit('surgery:tissue-interact', { sessionId, userId, point, toolType, force });
socket.emit('surgery:cursor-update', { sessionId, userId, position, isActive });
```

## Files Modified

### Backend
- ✅ `backend/src/models/Simulation.js` - Added uniqueLink, shareableCode, creatorId, scenario, maxParticipants, inviteOnly
- ✅ `backend/src/controllers/simulationController.js` - Added createSimulationSession, joinSimulationSession, getSimulationByLink, getActiveSessions
- ✅ `backend/src/routes/simulations.js` - Added new routes for session management
- ✅ `backend/src/sockets/socketHandler.js` - Enhanced surgery session tracking and real-time updates

### Frontend
- ✅ `frontend/app/surgery-simulation/page.tsx` - Complete UI overhaul with share dialog, code input, session browser
- ✅ `frontend/app/api/simulations/sessions/route.ts` - API proxy for session creation/listing
- ✅ `frontend/app/api/simulations/sessions/active/route.ts` - API proxy for active sessions
- ✅ `frontend/app/api/simulations/sessions/join/[identifier]/route.ts` - API proxy for joining
- ✅ `frontend/app/api/simulations/sessions/link/[identifier]/route.ts` - API proxy for session info

## Testing

### 1. Start Backend & Frontend
```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

### 2. Create a Session
1. Navigate to `http://localhost:3000/surgery-simulation`
2. Login if needed
3. Create a session with any name
4. Copy the link or code shown

### 3. Join from Another Browser/Tab
- Open incognito/another browser
- Either paste the link or enter the code
- Verify you see both participants in the session

### 4. Test Real-time Features
- Select different tools
- Move cursor around
- Interact with tissue
- Check if other participants see your actions

## Environment Setup

Add to your `.env` files:

**Backend (`backend/.env`):**
```bash
FRONTEND_URL=http://localhost:3000
```

**Frontend (`frontend/.env.local`):**
```bash
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
```

## Quick Demo Flow

1. **Doctor A** creates session → Gets code "ABCD1234"
2. **Doctor A** shares code via WhatsApp/Email
3. **Doctor B** enters code on surgery page → Joins
4. **Both doctors** see each other's cursors and tool interactions in real-time
5. **Session data** automatically saved to MongoDB with all metadata

## Next Steps

- Test the complete flow
- Add authentication middleware to protect routes
- Configure environment variables
- Deploy to production
- (Optional) Add email/SMS invitation system
- (Optional) Add session recordings
