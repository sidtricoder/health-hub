# Real-Time Surgery Collaboration System

## Overview
This system enables multiple doctors to see each other's surgical tools in real-time during collaborative surgery simulations.

## How It Works

### Architecture
```
Doctor A's Browser ←→ Socket.IO Server ←→ Doctor B's Browser
     (Tool Position)      (Relay)         (Tool Visualization)
```

### Data Flow
1. **Doctor A moves their tool** (scalpel, forceps, etc.)
2. **Position is captured** at 30fps (every ~33ms)
3. **WebSocket emits** `surgery:tool-position` event to server
4. **Server broadcasts** to all other doctors in the same session
5. **Doctor B receives** the position data
6. **Tool is rendered** at Doctor A's position in Doctor B's 3D view

### Key Features

#### 1. High-Frequency Broadcasting (30fps)
- Tool positions are streamed 30 times per second
- Ensures smooth, real-time visual feedback
- Throttled to balance performance and network usage

#### 2. No Backend Processing
- Server acts as a pure relay (no database writes)
- Minimal latency (~20-50ms depending on network)
- Direct peer-to-peer feel through WebSocket rooms

#### 3. Visual Differentiation
- Each doctor's tool has a unique color based on their role:
  - Surgeons: Red (#e74c3c)
  - Assistants: Blue (#3498db)
  - Observers: Gray (#95a5a6)
- Name labels float above each tool
- Active tools show glowing effects

#### 4. Smooth Interpolation
- Received positions are lerp-interpolated for smooth movement
- Prevents jittery motion from network fluctuations
- 30% lerp factor provides good balance

## Components

### RealtimeToolSync.tsx
Main component that:
- Listens for `surgery:tool-position` events
- Manages remote tool state
- Renders 3D tool visualizations for each participant
- Cleans up stale tools (no update for 2 seconds)

### useToolPositionBroadcast Hook
Custom hook that:
- Broadcasts current tool position
- Runs at 30fps when tool is active
- Sends: position, rotation, quaternion, tool type

## Socket Events

### Emitted Events
```typescript
socket.emit('surgery:tool-position', {
  sessionId: string,
  userId: string,
  userName: string,
  toolType: string,
  position: [x, y, z],
  rotation: [x, y, z],
  quaternion: [x, y, z, w]
});
```

### Received Events
```typescript
socket.on('surgery:tool-position', (data) => {
  // data contains: userId, userName, toolType, position, rotation, quaternion
});
```

## Performance Considerations

### Network Bandwidth
- Each position update: ~100-150 bytes
- At 30fps: ~3-5 KB/s per user
- With 5 doctors: ~15-25 KB/s total

### CPU Usage
- Minimal: Only position updates and interpolation
- No complex physics or collision detection
- Optimized for 60fps rendering

### Memory
- Stores only active participants
- Auto-cleanup of disconnected users
- Map-based storage for O(1) lookups

## Tool Types Supported

1. **Scalpel** - Surgical knife with blade
2. **Forceps** - Grasping tool with jaws
3. **Suture** - Needle holder
4. **Cautery** - Electrocautery pen with spark effect
5. **Syringe** - Injection tool
6. **Clamp** - Hemostatic clamp

Each tool has unique 3D geometry and visual effects.

## Usage Example

```typescript
import { RealtimeToolSync, useToolPositionBroadcast } from './components/RealtimeToolSync';

function SurgerySimulation({ sessionId, userId, userName }) {
  const { socket } = useSocket();
  const [toolPosition] = useState(new Vector3());
  const [toolRotation] = useState(new Euler());
  const [toolQuaternion] = useState(new Quaternion());
  
  // Broadcast your tool position
  useToolPositionBroadcast(
    socket,
    sessionId,
    userId,
    userName,
    'scalpel',
    toolPosition,
    toolRotation,
    toolQuaternion,
    true // isActive
  );
  
  return (
    <Canvas>
      {/* Render other doctors' tools */}
      <RealtimeToolSync
        socket={socket}
        sessionId={sessionId}
        currentUserId={userId}
        participants={participants}
      />
    </Canvas>
  );
}
```

## Future Enhancements

1. **Tool Interaction Feedback**
   - Vibration/haptic feedback when tools interact
   - Visual collision effects

2. **Tool Locking**
   - Prevent multiple doctors from using same instrument
   - Request/grant tool access system

3. **Gesture Recognition**
   - Detect common surgical movements
   - Show gesture hints to other participants

4. **Recording & Playback**
   - Record all tool movements
   - Play back surgery for training/review

## Troubleshooting

### Tools Not Appearing
- Check WebSocket connection status
- Verify sessionId matches between participants
- Check browser console for errors

### Laggy Tool Movement
- Check network latency
- Reduce broadcast frequency if needed
- Ensure 60fps canvas rendering

### Tools Disappearing
- Auto-cleanup removes tools after 2s of no updates
- Check if participant is still connected
- Verify socket events are being sent

## Security

- All WebSocket communications are authenticated
- Session IDs are validated before joining
- Only authenticated doctors can see tool positions
- No sensitive patient data in tool position broadcasts
