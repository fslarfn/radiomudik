"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Music, MessageCircle, Send, X, Play, Radio, Heart, PhoneOff } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAgora } from '@/hooks/useAgora';
import { useRealtimeData } from '@/hooks/useRealtimeData';

export default function ListenerPage() {
  const [isJukeboxOpen, setIsJukeboxOpen] = useState(false);
  const [isSalamOpen, setIsSalamOpen] = useState(false);
  const [songInput, setSongInput] = useState({ title: '', artist: '' });
  const [salamText, setSalamText] = useState('');
  const [hasInteracted, setHasInteracted] = useState(false);
  const [micGranted, setMicGranted] = useState(false);
  
  const { joinState, remoteTracks, isTalking, startTalking, stopTalking } = useAgora('mudik-live', 'audience');
  const { addSongRequest, requestTalk, talkRequests, broadcastStatus, updateTalkStatus, sendSalam } = useRealtimeData();

  // Retry playing tracks when user interacts
  useEffect(() => {
    if (hasInteracted) {
      remoteTracks.forEach(track => {
        if (!track.isPlaying) {
          track.play();
        }
      });
    }
  }, [hasInteracted, remoteTracks]);

  // Watch for talk request being accepted by host
  const myTalkRequest = talkRequests.find(r => r.listener_name === 'Ditta');
  const isAccepted = myTalkRequest?.status === 'accepted';
  const isCalling = myTalkRequest?.status === 'requested';

  useEffect(() => {
    if (isAccepted && !isTalking) {
      startTalking();
    }
  }, [isAccepted]);

  // Pre-request mic permission saat masuk 
  const handleStartListening = async () => {
    try {
      // Minta izin mikrofon di awal agar nanti saat Host klik "Angkat",
      // browser HP sudah mengizinkan dan tidak perlu minta lagi
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Langsung stop agar tidak menggunakan mic terus-menerus
      stream.getTracks().forEach(t => t.stop());
      setMicGranted(true);
    } catch {
      // Jika user menolak, tetap lanjutkan (fitur ngobrol saja yang tidak bisa)
      console.warn('Mic permission denied, talk feature will not work');
    }
    setHasInteracted(true);
  };

  const handleRequestTalk = async () => {
    if (!micGranted) {
      // Jika belum granted, coba minta lagi
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(t => t.stop());
        setMicGranted(true);
      } catch {
        alert('Izinkan akses mikrofon agar bisa ngobrol dengan Host!');
        return;
      }
    }
    await requestTalk('Ditta');
  };

  const handleHangUp = async () => {
    await stopTalking();
    if (myTalkRequest) {
      await updateTalkStatus(myTalkRequest.id, 'finished');
    }
  };

  const handleSendRequest = async () => {
    if (songInput.title && songInput.artist) {
      await addSongRequest({
        song_title: songInput.title,
        artist: songInput.artist,
        listener_name: 'Ditta'
      });
      setSongInput({ title: '', artist: '' });
      setIsJukeboxOpen(false);
    }
  };

  // ════════════════════════════════════════════════════
  // SPLASH SCREEN — "Mulai Dengarkan" + request mic
  // ════════════════════════════════════════════════════
  if (!hasInteracted) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-[#0a0a1a] via-[#111827] to-[#0f172a] text-white flex flex-col items-center justify-center p-6 text-center overflow-hidden relative">
        {/* Decorative Blobs */}
        <div className="absolute top-[-20%] left-[-15%] w-[60%] h-[60%] bg-orange-500/10 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-20%] right-[-15%] w-[60%] h-[60%] bg-rose-500/10 blur-[150px] rounded-full" />
        <div className="absolute top-[30%] right-[-10%] w-[40%] h-[40%] bg-amber-500/5 blur-[120px] rounded-full" />

        {/* Logo */}
        <motion.div 
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", duration: 1.2 }}
          className="relative mb-8"
        >
          <div className="w-28 h-28 bg-gradient-to-br from-orange-500 via-rose-500 to-pink-600 rounded-full flex items-center justify-center shadow-[0_0_60px_-10px_rgba(251,146,60,0.6)]">
            <Radio size={48} className="text-white" />
          </div>
          <motion.div 
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute inset-0 w-28 h-28 rounded-full border-2 border-orange-500/30"
          />
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h1 className="text-4xl font-black mb-1 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-orange-400 via-rose-400 to-pink-400">
            Radio Tidak Egois
          </h1>
          <p className="text-2xl font-black text-white/90 mb-6">ISAL</p>
        </motion.div>

        {/* Tagline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="max-w-xs mb-10"
        >
          <p className="text-sm text-white/50 font-bold leading-relaxed">
            Sekarang bisa <span className="text-orange-400">ngobrol</span>, bisa <span className="text-rose-400">request lagu</span>. 
          </p>
          <p className="text-sm text-white/30 font-bold mt-1">
            Tahun lalu mah enggak 😌
          </p>
        </motion.div>

        {/* CTA Button */}
        <motion.button 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleStartListening}
          className="bg-gradient-to-r from-orange-500 via-rose-500 to-pink-500 text-white px-10 py-5 rounded-full font-black text-lg shadow-[0_8px_30px_-5px_rgba(251,146,60,0.4)] hover:shadow-[0_8px_40px_-5px_rgba(251,146,60,0.6)] transition-all flex items-center gap-3"
        >
          <Play fill="currentColor" size={20} /> MULAI DENGARKAN
        </motion.button>

        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-6 text-[10px] text-white/20 font-bold"
        >
          Izinkan mikrofon agar bisa ngobrol nanti
        </motion.p>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-6 flex items-center gap-1 text-[9px] text-white/15 font-bold"
        >
          Made with <Heart size={8} fill="currentColor" className="text-rose-500/50" /> for Mudik 2026
        </motion.div>
      </main>
    );
  }

  // ════════════════════════════════════════════════════
  // MAIN LISTENER UI
  // ════════════════════════════════════════════════════
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0a0a1a] via-[#111827] to-[#0f172a] text-white p-5 flex flex-col items-center justify-between overflow-hidden relative">
      {/* Background Glow */}
      <div className="fixed inset-0 overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-orange-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] bg-rose-500/10 blur-[120px] rounded-full" />
      </div>

      {/* Status Bar */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full flex justify-between items-center p-3 px-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl"
      >
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className={`h-2.5 w-2.5 rounded-full ${joinState ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`} />
            {joinState && <div className="absolute inset-0 h-2.5 w-2.5 rounded-full bg-green-500 animate-ping" />}
          </div>
          <span className="text-[10px] font-black tracking-widest text-white/60 uppercase">
            {broadcastStatus?.is_on_air ? 'ON AIR' : 'STANDBY'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {remoteTracks.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          )}
          <span className="text-[10px] font-bold text-white/30">HD AUDIO</span>
        </div>
      </motion.div>

      {/* Main Player Area */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm gap-6">
        {/* Vinyl Disc */}
        <div className="relative">
          <motion.div 
            animate={{ 
              rotate: broadcastStatus?.is_on_air ? 360 : 0,
            }}
            transition={{ 
              rotate: { repeat: Infinity, duration: 8, ease: "linear" },
            }}
            className="w-48 h-48 rounded-full bg-gradient-to-tr from-orange-500 via-rose-500 to-pink-500 p-[3px] shadow-[0_0_60px_-15px_rgba(251,146,60,0.5)]"
          >
            <div className="w-full h-full rounded-full bg-[#0a0a1a] flex items-center justify-center overflow-hidden">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500/20 to-rose-500/20 flex items-center justify-center border border-white/5">
                <Music size={28} className="text-orange-400/60" />
              </div>
              {/* Vinyl rings */}
              <div className="absolute inset-[20%] rounded-full border border-white/[0.03]" />
              <div className="absolute inset-[30%] rounded-full border border-white/[0.03]" />
              <div className="absolute inset-[35%] rounded-full border border-white/[0.03]" />
            </div>
          </motion.div>
          
          {broadcastStatus?.is_on_air && (
            <motion.div 
              initial={{ scale: 0 }} 
              animate={{ scale: 1 }} 
              className="absolute -bottom-1 -right-1 bg-gradient-to-r from-red-600 to-rose-600 px-3 py-1 rounded-lg text-[9px] font-black tracking-widest shadow-lg shadow-red-600/30"
            >
              LIVE
            </motion.div>
          )}

          {isTalking && (
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -left-1 bg-gradient-to-r from-green-500 to-emerald-500 px-3 py-1 rounded-lg text-[9px] font-black tracking-widest shadow-lg shadow-green-500/30 animate-pulse"
            >
              🎙 NGOBROL
            </motion.div>
          )}
        </div>

        {/* Title */}
        <div className="text-center">
          <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-orange-400 via-rose-400 to-pink-400 leading-tight">
            Radio Tidak Egois
          </h1>
          <p className="text-lg font-black text-white/80 mt-0.5">ISAL</p>
          <p className="text-[10px] font-bold text-white/25 mt-2 tracking-widest uppercase">Personal Radio • Mudik 2026</p>
        </div>
      </div>

      {/* Interaction Buttons */}
      <div className="w-full max-w-sm flex flex-col gap-3 mb-3">
        {/* Talk Button */}
        {isTalking ? (
          <motion.button
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleHangUp}
            className="h-20 rounded-[24px] flex items-center justify-center gap-3 text-lg font-black shadow-2xl transition-all bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-green-500/20"
          >
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
              <Mic size={20} />
            </div>
            <div className="text-left">
              <div className="text-sm font-black">SEDANG NGOBROL</div>
              <div className="text-[10px] font-bold text-green-200/80">Tap untuk tutup</div>
            </div>
            <PhoneOff size={20} className="ml-auto mr-2 text-green-200" />
          </motion.button>
        ) : (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleRequestTalk}
            disabled={isCalling}
            className={`h-20 rounded-[24px] flex items-center justify-center gap-3 text-lg font-black shadow-2xl transition-all ${
              isCalling 
                ? 'bg-white/5 border border-white/10 text-white/40 cursor-not-allowed' 
                : 'bg-gradient-to-r from-orange-500 to-rose-600 text-white shadow-orange-500/20'
            }`}
          >
            <Mic size={24} />
            {isCalling ? 'MENUNGGU HOST...' : 'MAU NGOBROL'}
          </motion.button>
        )}

        {/* Jukebox & Salam */}
        <div className="grid grid-cols-2 gap-3">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsJukeboxOpen(true)}
            className="h-20 bg-white/5 backdrop-blur-lg rounded-[20px] flex flex-col items-center justify-center gap-2 border border-white/10 active:bg-white/10 transition-all"
          >
            <Music size={20} className="text-orange-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Request Lagu</span>
          </motion.button>
          
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsSalamOpen(true)}
            className="h-20 bg-white/5 backdrop-blur-lg rounded-[20px] flex flex-col items-center justify-center gap-2 border border-white/10 active:bg-white/10 transition-all"
          >
            <MessageCircle size={20} className="text-rose-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Kirim Salam</span>
          </motion.button>
        </div>
      </div>

      {/* Footer */}
      <p className="text-[8px] font-bold text-white/10 tracking-[0.4em] uppercase flex items-center gap-1">
        Made with <Heart size={7} fill="currentColor" className="text-rose-500/40" /> for Ditta
      </p>

      {/* ─── Jukebox Modal ─── */}
      <AnimatePresence>
        {isJukeboxOpen && (
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: "spring", damping: 25 }}
            className="fixed inset-0 z-50 bg-gradient-to-b from-[#0a0a1a] to-[#111827] p-6 flex flex-col gap-5"
          >
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-black text-white">Request Lagu</h2>
                <p className="text-[10px] font-bold text-white/30">Mau dengerin apa nih?</p>
              </div>
              <button onClick={() => setIsJukeboxOpen(false)} className="p-2.5 bg-white/10 rounded-full"><X size={18} /></button>
            </div>
            <div className="flex flex-col gap-3 flex-1">
              <input 
                type="text" 
                placeholder="Judul Lagu..." 
                className="bg-white/5 p-5 rounded-2xl border border-white/10 focus:border-orange-500/50 outline-none font-bold text-white placeholder:text-white/20"
                value={songInput.title}
                onChange={(e) => setSongInput({...songInput, title: e.target.value})}
              />
              <input 
                type="text" 
                placeholder="Nama Artis..." 
                className="bg-white/5 p-5 rounded-2xl border border-white/10 focus:border-orange-500/50 outline-none font-bold text-white placeholder:text-white/20"
                value={songInput.artist}
                onChange={(e) => setSongInput({...songInput, artist: e.target.value})}
              />
              <button 
                onClick={handleSendRequest}
                className="mt-auto bg-gradient-to-r from-orange-500 to-rose-500 py-5 rounded-2xl font-black text-lg shadow-lg shadow-orange-500/20 flex items-center justify-center gap-3 text-white"
              >
                <Send size={18} /> KIRIM REQUEST
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Salam Modal ─── */}
      <AnimatePresence>
        {isSalamOpen && (
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: "spring", damping: 25 }}
            className="fixed inset-0 z-50 bg-gradient-to-b from-[#0a0a1a] to-[#111827] p-6 flex flex-col gap-5"
          >
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-black text-white">Kirim Salam</h2>
                <p className="text-[10px] font-bold text-white/30">Titip pesan buat Isal</p>
              </div>
              <button onClick={() => setIsSalamOpen(false)} className="p-2.5 bg-white/10 rounded-full"><X size={18} /></button>
            </div>
            <textarea 
              placeholder="Tulis pesanmu di sini..." 
              className="bg-white/5 p-5 rounded-2xl border border-white/10 focus:border-rose-500/50 outline-none font-bold flex-1 resize-none text-lg text-white placeholder:text-white/20"
              value={salamText}
              onChange={(e) => setSalamText(e.target.value)}
            />
            <button 
              onClick={async () => { 
                if (salamText.trim()) {
                  await sendSalam('Ditta', salamText.trim());
                }
                setIsSalamOpen(false); 
                setSalamText(''); 
              }}
              className="bg-gradient-to-r from-rose-500 to-pink-500 py-5 rounded-2xl font-black text-lg shadow-lg shadow-rose-500/20 flex items-center justify-center gap-3 text-white"
            >
              <Send size={18} /> KIRIM SALAM
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
