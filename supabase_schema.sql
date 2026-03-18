-- Tabel untuk permintaan lagu
CREATE TABLE requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    song_title TEXT NOT NULL,
    artist TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'played')),
    listener_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabel untuk status siaran
CREATE TABLE broadcast_status (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    is_on_air BOOLEAN DEFAULT false,
    current_track_id TEXT,
    host_mic_active BOOLEAN DEFAULT true,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabel untuk notifikasi "Mau Ngobrol"
CREATE TABLE talk_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    listener_name TEXT NOT NULL,
    status TEXT DEFAULT 'requested' CHECK (status IN ('requested', 'accepted', 'rejected', 'finished')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabel untuk salam/pesan dari pendengar
CREATE TABLE salams (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_name TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Realtime for these tables
ALTER PUBLICATION supabase_realtime ADD TABLE requests;
ALTER PUBLICATION supabase_realtime ADD TABLE broadcast_status;
ALTER PUBLICATION supabase_realtime ADD TABLE talk_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE salams;
