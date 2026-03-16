"use client";

import { useEffect, useRef, useState } from 'react';
import type { 
  IAgoraRTCClient, 
  IMicrophoneAudioTrack, 
  IRemoteAudioTrack 
} from 'agora-rtc-sdk-ng';

const APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID || '';

export const useAgora = (channel: string, role: 'host' | 'audience') => {
  const [localAudioTrack, setLocalAudioTrack] = useState<IMicrophoneAudioTrack | null>(null);
  const [remoteTracks, setRemoteTracks] = useState<IRemoteAudioTrack[]>([]);
  const [joinState, setJoinState] = useState(false);
  
  const clientRef = useRef<IAgoraRTCClient | null>(null);

  useEffect(() => {
    // Pastikan ini hanya berjalan di browser
    if (typeof window === "undefined") return;
    
    if (!APP_ID || !channel) {
      console.warn('Agora APP_ID atau channel tidak ditemukan. Fit her suara (Audio) dinonaktifkan.');
      return;
    }

    // Impor AgoraRTC secara dinamis untuk menghindari ReferenceError: window
    const initAgora = async () => {
      const { default: AgoraRTC } = await import('agora-rtc-sdk-ng');
      
      const client = AgoraRTC.createClient({ mode: 'live', codec: 'vp8' });
      clientRef.current = client;

      const handleUserPublished = async (user: any, mediaType: 'audio' | 'video') => {
        await client.subscribe(user, mediaType);
        if (mediaType === 'audio') {
          setRemoteTracks(prev => [...prev, user.audioTrack]);
          user.audioTrack.play();
        }
      };

      const handleUserUnpublished = (user: any) => {
        if (user.audioTrack) {
          setRemoteTracks(prev => prev.filter(track => track !== user.audioTrack));
        }
      };

      client.on('user-published', handleUserPublished);
      client.on('user-unpublished', handleUserUnpublished);

      try {
        await client.join(APP_ID, channel, null, null);
        
        if (role === 'host') {
          await client.setClientRole('host');
          const track = await AgoraRTC.createMicrophoneAudioTrack();
          setLocalAudioTrack(track);
          await client.publish(track);
        } else {
          await client.setClientRole('audience');
        }
        
        setJoinState(true);
      } catch (error) {
        console.error('Agora join failed:', error);
      }
    };

    initAgora();

    return () => {
      const cleanup = async () => {
        if (localAudioTrack) {
          localAudioTrack.close();
        }
        if (clientRef.current) {
          await clientRef.current.leave();
          clientRef.current = null;
        }
      };
      cleanup();
    };
  }, [channel, role]);

  return {
    localAudioTrack,
    remoteTracks,
    joinState,
    client: clientRef.current
  };
};
