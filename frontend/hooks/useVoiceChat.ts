'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface VoiceChatConfig {
  socket: any;
  sessionId: string;
  userId: string;
  userName: string;
  enabled?: boolean;
}

interface PeerConnection {
  userId: string;
  userName: string;
  connection: RTCPeerConnection;
  stream?: MediaStream;
}

export function useVoiceChat({ socket, sessionId, userId, userName, enabled = false }: VoiceChatConfig) {
  const [isMicEnabled, setIsMicEnabled] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [peers, setPeers] = useState<Map<string, PeerConnection>>(new Map());
  const [audioLevels, setAudioLevels] = useState<Map<string, number>>(new Map());
  
  const localStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<Map<string, AnalyserNode>>(new Map());

  // ICE servers configuration
  const iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  // Start local media stream
  const startMicrophone = useCallback(async () => {
    if (localStreamRef.current) return localStreamRef.current;

    try {
      setIsConnecting(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false
      });

      localStreamRef.current = stream;
      
      // Mute by default
      stream.getAudioTracks().forEach(track => {
        track.enabled = false;
      });

      setIsMicEnabled(true);
      setIsConnecting(false);
      
      // Notify others that user is ready for voice chat
      if (socket) {
        socket.emit('voice:ready', { sessionId, userId, userName });
      }

      return stream;
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setIsConnecting(false);
      alert('Could not access microphone. Please check permissions.');
      return null;
    }
  }, [socket, sessionId, userId, userName]);

  // Stop local media stream
  const stopMicrophone = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    setIsMicEnabled(false);
    setIsMuted(true);

    // Notify others
    if (socket) {
      socket.emit('voice:leave', { sessionId, userId });
    }

    // Close all peer connections
    peers.forEach(peer => {
      peer.connection.close();
    });
    setPeers(new Map());
  }, [socket, sessionId, userId, peers]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (!localStreamRef.current) return;

    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsMuted(!audioTrack.enabled);

      // Notify others of mute status
      if (socket) {
        socket.emit('voice:mute-status', { 
          sessionId, 
          userId, 
          isMuted: !audioTrack.enabled 
        });
      }
    }
  }, [socket, sessionId, userId]);

  // Create peer connection
  const createPeerConnection = useCallback((remoteUserId: string, remoteUserName: string) => {
    const pc = new RTCPeerConnection(iceServers);

    // Add local stream tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    // Handle incoming tracks
    pc.ontrack = (event) => {
      console.log('Received remote track from:', remoteUserName);
      const remoteStream = event.streams[0];
      
      setPeers(prev => {
        const newPeers = new Map(prev);
        const peer = newPeers.get(remoteUserId);
        if (peer) {
          peer.stream = remoteStream;
        }
        return newPeers;
      });

      // Create audio element and play
      const audio = new Audio();
      audio.srcObject = remoteStream;
      audio.autoplay = true;
      audio.play().catch(e => console.error('Error playing audio:', e));

      // Set up audio level monitoring
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }
      
      const analyser = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(remoteStream);
      source.connect(analyser);
      analyser.fftSize = 256;
      
      analyserRef.current.set(remoteUserId, analyser);

      // Monitor audio levels
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const monitorLevel = () => {
        if (!analyserRef.current.has(remoteUserId)) return;
        
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        const normalized = Math.min(average / 128, 1);
        
        setAudioLevels(prev => {
          const newLevels = new Map(prev);
          newLevels.set(remoteUserId, normalized);
          return newLevels;
        });

        requestAnimationFrame(monitorLevel);
      };
      monitorLevel();
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('voice:ice-candidate', {
          sessionId,
          targetUserId: remoteUserId,
          candidate: event.candidate
        });
      }
    };

    // Handle connection state
    pc.onconnectionstatechange = () => {
      console.log(`Connection state with ${remoteUserName}:`, pc.connectionState);
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        setPeers(prev => {
          const newPeers = new Map(prev);
          newPeers.delete(remoteUserId);
          return newPeers;
        });
      }
    };

    return pc;
  }, [socket, sessionId]);

  // Handle WebRTC signaling
  useEffect(() => {
    if (!socket || !enabled) return;

    // User ready for voice chat
    const handleVoiceReady = async (data: { userId: string; userName: string }) => {
      if (data.userId === userId || !localStreamRef.current) return;

      console.log('User ready for voice:', data.userName);

      // Create offer
      const pc = createPeerConnection(data.userId, data.userName);
      setPeers(prev => new Map(prev).set(data.userId, {
        userId: data.userId,
        userName: data.userName,
        connection: pc
      }));

      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socket.emit('voice:offer', {
          sessionId,
          targetUserId: data.userId,
          offer: offer
        });
      } catch (error) {
        console.error('Error creating offer:', error);
      }
    };

    // Receive offer
    const handleVoiceOffer = async (data: { userId: string; userName: string; offer: RTCSessionDescriptionInit }) => {
      if (!localStreamRef.current) return;

      console.log('Received offer from:', data.userName);

      const pc = createPeerConnection(data.userId, data.userName);
      setPeers(prev => new Map(prev).set(data.userId, {
        userId: data.userId,
        userName: data.userName,
        connection: pc
      }));

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit('voice:answer', {
          sessionId,
          targetUserId: data.userId,
          answer: answer
        });
      } catch (error) {
        console.error('Error handling offer:', error);
      }
    };

    // Receive answer
    const handleVoiceAnswer = async (data: { userId: string; answer: RTCSessionDescriptionInit }) => {
      const peer = peers.get(data.userId);
      if (!peer) return;

      try {
        await peer.connection.setRemoteDescription(new RTCSessionDescription(data.answer));
      } catch (error) {
        console.error('Error handling answer:', error);
      }
    };

    // Receive ICE candidate
    const handleIceCandidate = async (data: { userId: string; candidate: RTCIceCandidateInit }) => {
      const peer = peers.get(data.userId);
      if (!peer) return;

      try {
        await peer.connection.addIceCandidate(new RTCIceCandidate(data.candidate));
      } catch (error) {
        console.error('Error adding ICE candidate:', error);
      }
    };

    // User left voice chat
    const handleVoiceLeave = (data: { userId: string }) => {
      const peer = peers.get(data.userId);
      if (peer) {
        peer.connection.close();
        setPeers(prev => {
          const newPeers = new Map(prev);
          newPeers.delete(data.userId);
          return newPeers;
        });
        analyserRef.current.delete(data.userId);
      }
    };

    socket.on('voice:ready', handleVoiceReady);
    socket.on('voice:offer', handleVoiceOffer);
    socket.on('voice:answer', handleVoiceAnswer);
    socket.on('voice:ice-candidate', handleIceCandidate);
    socket.on('voice:leave', handleVoiceLeave);

    return () => {
      socket.off('voice:ready', handleVoiceReady);
      socket.off('voice:offer', handleVoiceOffer);
      socket.off('voice:answer', handleVoiceAnswer);
      socket.off('voice:ice-candidate', handleIceCandidate);
      socket.off('voice:leave', handleVoiceLeave);
    };
  }, [socket, sessionId, userId, enabled, createPeerConnection, peers]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMicrophone();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [stopMicrophone]);

  return {
    isMicEnabled,
    isMuted,
    isConnecting,
    peers: Array.from(peers.values()),
    audioLevels,
    startMicrophone,
    stopMicrophone,
    toggleMute
  };
}
