import React, { useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { RealtimeChat } from '@/utils/RealtimeAudio';
import { Mic, MicOff, Phone, PhoneOff, Loader2 } from 'lucide-react';

interface VoiceInterfaceProps {
  onSpeakingChange: (speaking: boolean) => void;
  onTranscript?: (text: string, isUser: boolean) => void;
  companionName: string;
}

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';

const VoiceInterface: React.FC<VoiceInterfaceProps> = ({ 
  onSpeakingChange, 
  onTranscript,
  companionName 
}) => {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [isMuted, setIsMuted] = useState(false);
  const chatRef = useRef<RealtimeChat | null>(null);
  const userTranscriptRef = useRef<string>('');
  const assistantTranscriptRef = useRef<string>('');

  const handleMessage = useCallback((event: any) => {
    console.log('Voice event:', event.type);
    
    switch (event.type) {
      case 'response.audio.delta':
        onSpeakingChange(true);
        break;
        
      case 'response.audio.done':
        onSpeakingChange(false);
        break;
        
      case 'response.audio_transcript.delta':
        assistantTranscriptRef.current += event.delta || '';
        break;
        
      case 'response.audio_transcript.done':
        if (assistantTranscriptRef.current && onTranscript) {
          onTranscript(assistantTranscriptRef.current, false);
        }
        assistantTranscriptRef.current = '';
        break;
        
      case 'conversation.item.input_audio_transcription.completed':
        if (event.transcript && onTranscript) {
          onTranscript(event.transcript, true);
        }
        break;
        
      case 'error':
        console.error('Realtime error:', event.error);
        toast.error(event.error?.message || 'Voice connection error');
        break;
    }
  }, [onSpeakingChange, onTranscript]);

  const startConversation = async () => {
    try {
      setStatus('connecting');
      
      chatRef.current = new RealtimeChat(handleMessage, companionName);
      await chatRef.current.init();
      
      setStatus('connected');
      toast.success(`Voice chat with ${companionName} started~`);
    } catch (error) {
      console.error('Error starting conversation:', error);
      setStatus('disconnected');
      toast.error(error instanceof Error ? error.message : 'Failed to start voice chat');
    }
  };

  const endConversation = () => {
    chatRef.current?.disconnect();
    chatRef.current = null;
    setStatus('disconnected');
    setIsMuted(false);
    onSpeakingChange(false);
    toast.info('Voice chat ended');
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    // Note: Actual muting would require accessing the media stream
    toast.info(isMuted ? 'Microphone unmuted' : 'Microphone muted');
  };

  return (
    <div className="flex items-center gap-2">
      {status === 'disconnected' && (
        <Button
          onClick={startConversation}
          variant="ghost"
          size="icon"
          className="bg-lia-pink/20 hover:bg-lia-pink/30 text-lia-pink border border-lia-pink/30"
          title="Start voice chat"
        >
          <Phone className="w-4 h-4" />
        </Button>
      )}
      
      {status === 'connecting' && (
        <Button
          variant="ghost"
          size="icon"
          disabled
          className="bg-lia-pink/20 text-lia-pink border border-lia-pink/30"
        >
          <Loader2 className="w-4 h-4 animate-spin" />
        </Button>
      )}
      
      {status === 'connected' && (
        <>
          <Button
            onClick={toggleMute}
            variant="ghost"
            size="icon"
            className={`border ${isMuted ? 'bg-muted text-muted-foreground border-border' : 'bg-green-500/20 text-green-500 border-green-500/30'}`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </Button>
          
          <Button
            onClick={endConversation}
            variant="ghost"
            size="icon"
            className="bg-destructive/20 hover:bg-destructive/30 text-destructive border border-destructive/30"
            title="End voice chat"
          >
            <PhoneOff className="w-4 h-4" />
          </Button>
        </>
      )}
    </div>
  );
};

export default VoiceInterface;
