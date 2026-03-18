export interface SongRequest {
  id: string;
  song_title: string;
  artist: string;
  status: 'pending' | 'played';
  listener_name?: string;
  created_at: string;
}

export interface BroadcastStatus {
  id: string;
  is_on_air: boolean;
  current_track_id?: string;
  host_mic_active: boolean;
  last_updated: string;
}

export interface TalkRequest {
  id: string;
  listener_name: string;
  status: 'requested' | 'accepted' | 'rejected' | 'finished';
  created_at: string;
}

export interface Salam {
  id: string;
  sender_name: string;
  message: string;
  is_read: boolean;
  created_at: string;
}
