import { useState, useEffect, useRef } from 'react';
import { useSocket } from './useSocket';

const useCall = () => {
  const { socket } = useSocket();
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [callState, setCallState] = useState({ 
    status: 'idle', 
    type: null, 
    callerId: null, 
    callerName: null, 
    callId: null, 
    offer: null 
  });
  const peerRef = useRef(null);

  const getMedia = async (type) => {
    try {
      const constraints = {
        audio: true,
        video: type === 'video',
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);
      return stream;
    } catch (error) {
      console.error('Failed to get media:', error);
      alert('Could not access camera/microphone');
      return null;
    }
  };

  const startCall = async (targetUserId, type) => {
    const { default: SimplePeer } = await import('simple-peer');
    const stream = await getMedia(type);
    if (!stream) return;

    setCallState({ 
      status: 'calling', 
      type, 
      callerId: null, 
      callerName: null, 
      callId: null, 
      offer: null 
    });

    const peer = new SimplePeer({
      initiator: true,
      trickle: false,
      stream,
    });

    peer.on('signal', (data) => {
      socket.emit('call-user', {
        targetUserId,
        offer: data,
        callType: type,
      });
    });

    peer.on('stream', (stream) => {
      setRemoteStream(stream);
      setCallState(prev => ({ ...prev, status: 'connected' }));
    });

    peer.on('close', () => {
      endCall();
    });

    peerRef.current = peer;
  };

  const answerCall = async () => {
    const { default: SimplePeer } = await import('simple-peer');
    if (!callState.offer || !callState.type) return;
    const stream = await getMedia(callState.type);
    if (!stream) return;

    setCallState(prev => ({ ...prev, status: 'connected' }));

    const peer = new SimplePeer({
      initiator: false,
      trickle: false,
      stream,
    });

    peer.on('signal', (data) => {
      socket.emit('answer-call', {
        callId: callState.callId,
        answer: data,
        targetUserId: callState.callerId,
      });
    });

    peer.on('stream', (stream) => {
      setRemoteStream(stream);
    });

    peer.signal(callState.offer);
    peerRef.current = peer;
  };

  const rejectCall = () => {
    if (callState.callId) {
      socket.emit('reject-call', { 
        callId: callState.callId, 
        targetUserId: callState.callerId 
      });
    }
    resetCall();
  };

  const endCall = () => {
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    setRemoteStream(null);
    if (callState.callId) {
      socket.emit('end-call', { 
        callId: callState.callId, 
        targetUserId: callState.callerId 
      });
    }
    resetCall();
  };

  const resetCall = () => {
    setCallState({ 
      status: 'idle', 
      type: null, 
      callerId: null, 
      callerName: null, 
      callId: null, 
      offer: null 
    });
  };

  useEffect(() => {
    if (!socket) return;

    const handleIncomingCall = ({ callId, callerId, callerName, callType, offer }) => {
      setCallState({ 
        status: 'ringing', 
        type: callType, 
        callerId, 
        callerName, // now stored
        callId, 
        offer 
      });
    };

    const handleCallCreated = ({ callId }) => {
      setCallState((prev) => ({ ...prev, callId }));
    };

    const handleCallAnswered = ({ answer }) => { // removed unused callId
      if (callState.status === 'calling' && peerRef.current) {
        peerRef.current.signal(answer);
      }
    };

    const handleIceCandidate = ({ candidate, from }) => {
      if (from === callState.callerId && peerRef.current) {
        peerRef.current.signal(candidate);
      }
    };

    const handleCallRejected = ({ callId }) => {
      if (callState.callId === callId) {
        alert('Call was rejected');
        resetCall();
      }
    };

    const handleCallEnded = ({ callId }) => {
      if (callState.callId === callId) {
        endCall();
      }
    };

    socket.on('incoming-call', handleIncomingCall);
    socket.on('call-created', handleCallCreated);
    socket.on('call-answered', handleCallAnswered);
    socket.on('ice-candidate', handleIceCandidate);
    socket.on('call-rejected', handleCallRejected);
    socket.on('call-ended', handleCallEnded);

    return () => {
      socket.off('incoming-call', handleIncomingCall);
      socket.off('call-created', handleCallCreated);
      socket.off('call-answered', handleCallAnswered);
      socket.off('ice-candidate', handleIceCandidate);
      socket.off('call-rejected', handleCallRejected);
      socket.off('call-ended', handleCallEnded);
    };
  }, [socket, callState]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => {
      if (peerRef.current) {
        peerRef.current.destroy();
      }
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [localStream]);

  return {
    localStream,
    remoteStream,
    callState,
    startCall,
    answerCall,
    rejectCall,
    endCall,
  };
};

export default useCall;