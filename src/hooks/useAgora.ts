"use client";

import { useEffect, useRef, useState } from 'react';
import type { 
  IAgoraRTCClient, 
  IMicrophoneAudioTrack, 
  IRemoteAudioTrack,
  ILocalAudioTrack,
  ILocalVideoTrack
} from 'agora-rtc-sdk-ng';

const APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID || '';

export const useAgora = (channel: string, role: 'host' | 'audience') => {
  const [localAudioTrack, setLocalAudioTrack] = useState<IMicrophoneAudioTrack | null>(null);
  const [localScreenAudioTrack, setLocalScreenAudioTrack] = useState<ILocalAudioTrack | null>(null);
  const [remoteTracks, setRemoteTracks] = useState<IRemoteAudioTrack[]>([]);
  const [joinState, setJoinState] = useState(false);
  const [isTalking, setIsTalking] = useState(false);
  
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const talkMicRef = useRef<IMicrophoneAudioTrack | null>(null);

  useEffect(() => {
    // Pastikan ini hanya berjalan di browser
    if (typeof window === "undefined") return;
    
    if (!APP_ID || !channel) {
      console.warn('Agora APP_ID atau channel tidak ditemukan. Fitur suara (Audio) dinonaktifkan.');
      return;
    }

    // Impor AgoraRTC secara dinamis
    const initAgora = async () => {
      const { default: AgoraRTC } = await import('agora-rtc-sdk-ng');
      
      const client = AgoraRTC.createClient({ mode: 'live', codec: 'vp8' });
      clientRef.current = client;

      const handleUserPublished = async (user: any, mediaType: 'audio' | 'video') => {
        await client.subscribe(user, mediaType);
        if (mediaType === 'audio') {
          setRemoteTracks(prev => {
            if (prev.find(t => t.getUserId() === user.uid)) return prev;
            return [...prev, user.audioTrack];
          });
          user.audioTrack.play();
        }
      };

      const handleUserUnpublished = (user: any, mediaType: 'audio' | 'video') => {
        if (mediaType === 'audio' && user.audioTrack) {
          user.audioTrack.stop();
          setRemoteTracks(prev => prev.filter(track => track.getTrackId() !== user.audioTrack.getTrackId()));
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
        if (localScreenAudioTrack) {
          localScreenAudioTrack.close();
        }
        if (talkMicRef.current) {
          talkMicRef.current.close();
          talkMicRef.current = null;
        }
        if (clientRef.current) {
          await clientRef.current.leave();
          clientRef.current = null;
        }
      };
      cleanup();
    };
  }, [channel, role]);

  const startScreenAudioShare = async () => {
    if (!clientRef.current) return;
    
    try {
      const { default: AgoraRTC } = await import('agora-rtc-sdk-ng');
      
      // Request screen share with audio ONLY
      const screenTracks = await AgoraRTC.createScreenVideoTrack({
        encoderConfig: "1080p_1",
      }, 'enable');
      
      let screenAudioTrack: ILocalAudioTrack | undefined;
      let screenVideoTrack: ILocalVideoTrack;

      if (Array.isArray(screenTracks)) {
        screenVideoTrack = screenTracks[0];
        screenAudioTrack = screenTracks[1];
      } else {
        screenVideoTrack = screenTracks;
        // Jika return bukan array, berarti user tidak mencentang "share audio"
        alert("Anda harus mencentang 'Share Audio' / 'Bagikan Audio' saat memilih tab/layar!");
        screenVideoTrack.close();
        return;
      }

      if (screenAudioTrack) {
        // Kita hanya butuh audio nya, jadi video kita tutup/close
        screenVideoTrack.close();
        
        setLocalScreenAudioTrack(screenAudioTrack);
        await clientRef.current.publish([screenAudioTrack]);
        
        // Listen if user stops sharing via browser UI
        screenAudioTrack.on('track-ended', async () => {
          stopScreenAudioShare();
        });
      }
    } catch (error) {
      console.error("Gagal share screen audio:", error);
    }
  };

  const stopScreenAudioShare = async () => {
    if (localScreenAudioTrack && clientRef.current) {
      await clientRef.current.unpublish([localScreenAudioTrack]);
      localScreenAudioTrack.close();
      setLocalScreenAudioTrack(null);
    }
  };

  // === Fitur Talk: Audience -> upgrade ke Host sementara ===
  const startTalking = async () => {
    if (!clientRef.current) return;

    try {
      const { default: AgoraRTC } = await import('agora-rtc-sdk-ng');
      
      // Switch role dari audience ke host agar bisa publish audio
      await clientRef.current.setClientRole('host');
      
      // Buat microphone track
      const micTrack = await AgoraRTC.createMicrophoneAudioTrack();
      talkMicRef.current = micTrack;
      
      // Publish microphone track
      await clientRef.current.publish([micTrack]);
      setIsTalking(true);
      
      console.log('Listener mulai berbicara (mic ON)');
    } catch (error) {
      console.error('Gagal memulai bicara:', error);
    }
  };

  const stopTalking = async () => {
    if (!clientRef.current) return;

    try {
      if (talkMicRef.current) {
        await clientRef.current.unpublish([talkMicRef.current]);
        talkMicRef.current.close();
        talkMicRef.current = null;
      }
      
      // Kembali ke audience
      await clientRef.current.setClientRole('audience');
      setIsTalking(false);
      
      console.log('Listener berhenti berbicara (mic OFF)');
    } catch (error) {
      console.error('Gagal berhenti bicara:', error);
    }
  };

  return {
    localAudioTrack,
    localScreenAudioTrack,
    remoteTracks,
    joinState,
    isTalking,
    client: clientRef.current,
    startScreenAudioShare,
    stopScreenAudioShare,
    startTalking,
    stopTalking
  };
};
