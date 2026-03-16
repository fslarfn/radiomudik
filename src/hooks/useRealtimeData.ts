"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { SongRequest, TalkRequest, BroadcastStatus } from '@/types';

export const useRealtimeData = () => {
  const [requests, setRequests] = useState<SongRequest[]>([]);
  const [talkRequests, setTalkRequests] = useState<TalkRequest[]>([]);
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
          .eq('status', 'requested')
          .order('created_at', { ascending: false });
        if (talk) setTalkRequests(talk);

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
            setTalkRequests(prev => prev.filter(r => r.id !== payload.new.id || payload.new.status === 'requested'));
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

  return {
    requests,
    talkRequests,
    broadcastStatus,
    addSongRequest,
    requestTalk,
    updateTalkStatus,
    markSongAsPlayed,
    toggleBroadcastStatus
  };
};
