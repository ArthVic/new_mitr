import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { 
  Phone, 
  PhoneOff, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  UserPlus, 
  Clock,
  User,
  Bot
} from 'lucide-react';
import { socketManager } from '@/lib/socket';

interface VoiceCallInterfaceProps {
  callId: string;
  onCallEnd: () => void;
}

export const VoiceCallInterface: React.FC<VoiceCallInterfaceProps> = ({ 
  callId, 
  onCallEnd 
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [callStatus, setCallStatus] = useState<'connecting' | 'active' | 'ended'>('connecting');
  const [currentTranscription, setCurrentTranscription] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  useEffect(() => {
    // Initialize voice socket connection
    socketManager.connectVoice();

    // Join call room
    socketManager.joinCall(callId, 'current_user_id');

    // Listen for call events
    socketManager.on('call_answered', handleCallAnswered);
    socketManager.on('call_ended', handleCallEnded);
    socketManager.on('audio_response', handleAudioResponse);
    socketManager.on('call_transferred', handleCallTransferred);
    socketManager.on('transcription_update', handleTranscriptionUpdate);
    socketManager.on('ai_response_update', handleAiResponseUpdate);

    // Start call duration timer
    const timer = setInterval(() => {
      if (callStatus === 'active') {
        setCallDuration(prev => prev + 1);
      }
    }, 1000);

    return () => {
      socketManager.off('call_answered', handleCallAnswered);
      socketManager.off('call_ended', handleCallEnded);
      socketManager.off('audio_response', handleAudioResponse);
      socketManager.off('call_transferred', handleCallTransferred);
      socketManager.off('transcription_update', handleTranscriptionUpdate);
      socketManager.off('ai_response_update', handleAiResponseUpdate);
      clearInterval(timer);
      stopAudioRecording();
    };
  }, [callId, callStatus]);

  const handleCallAnswered = () => {
    setCallStatus('active');
    setIsConnected(true);
    startAudioRecording();
  };

  const handleCallEnded = () => {
    setCallStatus('ended');
    setIsConnected(false);
    stopAudioRecording();
    onCallEnd();
  };

  const handleAudioResponse = (data: { audioData: ArrayBuffer }) => {
    playAudioResponse(data.audioData);
  };

  const handleCallTransferred = (data: { agentId: string }) => {
    setAiResponse(`Call transferred to agent ${data.agentId}`);
  };

  const handleTranscriptionUpdate = (data: { transcription: string }) => {
    setCurrentTranscription(data.transcription);
  };

  const handleAiResponseUpdate = (data: { response: string }) => {
    setAiResponse(data.response);
  };

  const startAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      // Create audio context
      audioContextRef.current = new AudioContext({ sampleRate: 16000 });
      const source = audioContextRef.current.createMediaStreamSource(stream);
      
      // Create gain node for volume control
      gainNodeRef.current = audioContextRef.current.createGain();
      source.connect(gainNodeRef.current);
      
      // Create analyser for audio level visualization
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      gainNodeRef.current.connect(analyserRef.current);
      
      // Start audio level monitoring
      monitorAudioLevel();

      // Create media recorder
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          // Convert to ArrayBuffer and send via socket
          event.data.arrayBuffer().then(buffer => {
            socketManager.sendAudioChunk(callId, buffer);
          });
        }
      };

      // Send audio chunks every 100ms for real-time processing
      mediaRecorderRef.current.start(100);

    } catch (error) {
      console.error('Failed to start audio recording:', error);
      setCallStatus('ended');
    }
  };

  const stopAudioRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }
  };

  const monitorAudioLevel = () => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    
    const updateLevel = () => {
      if (!analyserRef.current || callStatus !== 'active') return;
      
      analyserRef.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      setAudioLevel(Math.round((average / 255) * 100));
      
      requestAnimationFrame(updateLevel);
    };
    
    updateLevel();
  };

  const playAudioResponse = async (audioData: ArrayBuffer) => {
    try {
      if (!audioContextRef.current || !isSpeakerOn) return;

      const audioBuffer = await audioContextRef.current.decodeAudioData(audioData.slice(0));
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      
      if (gainNodeRef.current) {
        source.connect(gainNodeRef.current);
        gainNodeRef.current.connect(audioContextRef.current.destination);
      } else {
        source.connect(audioContextRef.current.destination);
      }
      
      source.start();
    } catch (error) {
      console.error('Failed to play audio response:', error);
    }
  };

  const handleEndCall = () => {
    socketManager.endCall(callId);
  };

  const handleTransferCall = () => {
    socketManager.transferCall(callId, 'human_agent_id');
  };

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = newMuted ? 0 : 1;
    }
    
    socketManager.muteCall(callId, newMuted);
  };

  const toggleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn);
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = () => {
    switch (callStatus) {
      case 'connecting': return 'bg-yellow-500';
      case 'active': return 'bg-green-500';
      case 'ended': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-4">
      {/* Call Status Card */}
      <Card>
        <CardHeader className="text-center pb-2">
          <div className="flex items-center justify-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${getStatusColor()}`}></div>
            <CardTitle className="text-lg">
              {callStatus === 'connecting' && 'Connecting...'}
              {callStatus === 'active' && 'Active Call'}
              {callStatus === 'ended' && 'Call Ended'}
            </CardTitle>
          </div>
          {callStatus === 'active' && (
            <div className="text-2xl font-mono text-primary">
              {formatDuration(callDuration)}
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Audio Level Indicator */}
          {callStatus === 'active' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Audio Level</span>
                <span>{audioLevel}%</span>
              </div>
              <Progress value={audioLevel} className="h-2" />
            </div>
          )}

          {/* Call Controls */}
          <div className="flex justify-center space-x-4">
            <Button
              variant={isMuted ? "destructive" : "outline"}
              size="icon"
              onClick={toggleMute}
              disabled={callStatus !== 'active'}
              className="h-12 w-12"
            >
              {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </Button>

            <Button
              variant={isSpeakerOn ? "default" : "outline"}
              size="icon"
              onClick={toggleSpeaker}
              disabled={callStatus !== 'active'}
              className="h-12 w-12"
            >
              {isSpeakerOn ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={handleTransferCall}
              disabled={callStatus !== 'active'}
              className="h-12 w-12"
            >
              <UserPlus className="h-5 w-5" />
            </Button>

            <Button
              variant="destructive"
              size="icon"
              onClick={handleEndCall}
              disabled={callStatus === 'ended'}
              className="h-12 w-12"
            >
              <PhoneOff className="h-5 w-5" />
            </Button>
          </div>

          {/* Connection Status */}
          <div className="text-center">
            <Badge variant={isConnected ? "default" : "secondary"}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Real-time Transcription & AI Response */}
      {callStatus === 'active' && (
        <div className="grid gap-4 md:grid-cols-2">
          {/* Current Transcription */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <User className="h-4 w-4" />
                Customer Speaking
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="min-h-[60px] p-3 bg-muted rounded-lg">
                <p className="text-sm">
                  {currentTranscription || "Listening..."}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* AI Response */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Bot className="h-4 w-4" />
                AI Response
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="min-h-[60px] p-3 bg-primary/10 rounded-lg">
                <p className="text-sm">
                  {aiResponse || "Processing..."}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Call Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Call ID:</span>
              <p className="font-mono">{callId.substring(0, 8)}...</p>
            </div>
            <div>
              <span className="text-muted-foreground">Quality:</span>
              <p className="text-green-600">Excellent</p>
            </div>
            <div>
              <span className="text-muted-foreground">Latency:</span>
              <p>~50ms</p>
            </div>
            <div>
              <span className="text-muted-foreground">Codec:</span>
              <p>Opus 16kHz</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
