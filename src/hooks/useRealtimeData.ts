"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { SongRequest, TalkRequest, BroadcastStatus, Salam } from '@/types';

export const useRealtimeData = () => {
  const [requests, setRequests] = useState<SongRequest[]>([]);
  const [talkRequests, setTalkRequests] = useState<TalkRequest[]>([]);
  const [salams, setSalams] = useState<Salam[]>([]);
  const [broadcastStatus, setBroadcastStatus] = useState<BroadcastStatus | null>(null);

  useEffect(() => {
    if (!supabase) {
      console.warn('Supabase is not initialized. Check your environment variables.');
      return;
    }

    // 1. Fetch Initial Data
    const fetchData = async () => {
      try {
        const { data: reqs } = await supabase
          .from('requests')
          .select('*')
          .order('created_at', { ascending: false });
        if (reqs) setRequests(reqs);

        const { data: talk } = await supabase
          .from('talk_requests')
          .select('*')
          .in('status', ['requested', 'accepted'])
          .order('created_at', { ascending: false });
        if (talk) setTalkRequests(talk);

        const { data: salamData } = await supabase
          .from('salams')
          .select('*')
          .eq('is_read', false)
          .order('created_at', { ascending: false });
        if (salamData) setSalams(salamData);

        const { data: status } = await supabase
          .from('broadcast_status')
          .select('*')
          .limit(1)
          .single();
        if (status) setBroadcastStatus(status);
      } catch (e) {
        console.error('Initial fetch failed:', e);
      }
    };

    fetchData();

    // 2. Setup Realtime Subscriptions
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'requests' },
        (payload: any) => {
          if (payload.eventType === 'INSERT') {
            setRequests(prev => [payload.new as SongRequest, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setRequests(prev => prev.map(r => r.id === payload.new.id ? payload.new as SongRequest : r));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'talk_requests' },
        (payload: any) => {
          if (payload.eventType === 'INSERT') {
            setTalkRequests(prev => [payload.new as TalkRequest, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as TalkRequest;
            if (updated.status === 'finished' || updated.status === 'rejected') {
              // Hapus dari daftar jika sudah selesai/ditolak
              setTalkRequests(prev => prev.filter(r => r.id !== updated.id));
            } else {
              // Update in-place (termasuk saat status menjadi 'accepted')
              setTalkRequests(prev => prev.map(r => r.id === updated.id ? updated : r));
            }
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'salams' },
        (payload: any) => {
          if (payload.eventType === 'INSERT') {
            setSalams(prev => [payload.new as Salam, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setSalams(prev => prev.map(s => s.id === payload.new.id ? payload.new as Salam : s));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'broadcast_status' },
        (payload: any) => {
          setBroadcastStatus(payload.new as BroadcastStatus);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const addSongRequest = async (song: Omit<SongRequest, 'id' | 'created_at' | 'status'>) => {
    return await supabase.from('requests').insert([song]);
  };

  const requestTalk = async (listenerName: string) => {
    return await supabase.from('talk_requests').insert([{ listener_name: listenerName, status: 'requested' }]);
  };

  const updateTalkStatus = async (id: string, status: TalkRequest['status']) => {
    return await supabase.from('talk_requests').update({ status }).eq('id', id);
  };

  const markSongAsPlayed = async (id: string) => {
    return await supabase.from('requests').update({ status: 'played' }).eq('id', id);
  };

  const toggleBroadcastStatus = async () => {
    if (!broadcastStatus) return { error: 'No status found' };
    const newStatus = !broadcastStatus.is_on_air;
    
    return await supabase.from('broadcast_status').update({ is_on_air: newStatus }).eq('id', broadcastStatus.id);
  };

  const sendSalam = async (senderName: string, message: string) => {
    return await supabase.from('salams').insert([{ sender_name: senderName, message, is_read: false }]);
  };

  const markSalamRead = async (id: string) => {
    return await supabase.from('salams').update({ is_read: true }).eq('id', id);
  };

  return {
    requests,
    talkRequests,
    salams,
    broadcastStatus,
    addSongRequest,
    requestTalk,
    updateTalkStatus,
    markSongAsPlayed,
    toggleBroadcastStatus,
    sendSalam,
    markSalamRead
  };
};
