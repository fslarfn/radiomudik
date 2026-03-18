"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Music, Volume2, Users, Radio, Check, X, PhoneCall, MessageCircle, Heart } from 'lucide-react';
import { useState, useCallback } from 'react';
import { useAgora } from '@/hooks/useAgora';
import { useRealtimeData } from '@/hooks/useRealtimeData';
import { useSession, signIn } from 'next-auth/react';

// ─── Web Audio Soundboard ───
const playSound = (type: string) => {
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  gain.gain.value = 0.3;

  switch (type) {
    case 'TAWA':
      osc.type = 'square';
      osc.frequency.value = 600;
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(900, ctx.currentTime + 0.1);
      osc.frequency.linearRampToValueAtTime(600, ctx.currentTime + 0.2);
      osc.frequency.linearRampToValueAtTime(900, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
      osc.start(); osc.stop(ctx.currentTime + 0.5);
      break;
    case 'APPLAUSE':
      // White noise burst for applause
      const bufferSize = ctx.sampleRate * 0.8;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.3;
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const noiseGain = ctx.createGain();
      noise.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noiseGain.gain.setValueAtTime(0.4, ctx.currentTime);
      noiseGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.8);
      noise.start(); noise.stop(ctx.currentTime + 0.8);
      osc.disconnect(); // Don't use osc for this one
      return;
    case 'TELOLET':
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.setValueAtTime(550, ctx.currentTime + 0.15);
      osc.frequency.setValueAtTime(440, ctx.currentTime + 0.3);
      osc.frequency.setValueAtTime(550, ctx.currentTime + 0.45);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.7);
      osc.start(); osc.stop(ctx.currentTime + 0.7);
      break;
    case 'DRUMROLL':
      osc.type = 'triangle';
      osc.frequency.value = 150;
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.8);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1);
      osc.start(); osc.stop(ctx.currentTime + 1);
      break;
    case 'AIRHORN':
      osc.type = 'sawtooth';
      osc.frequency.value = 480;
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6);
      osc.start(); osc.stop(ctx.currentTime + 0.6);
      break;
    case 'BOING':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
      osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
      osc.start(); osc.stop(ctx.currentTime + 0.4);
      break;
    default:
      osc.start(); osc.stop(ctx.currentTime + 0.2);
  }
};

export default function HostDashboard() {
  const [isMicActive, setIsMicActive] = useState(true);
  const { data: session } = useSession();
  const { localAudioTrack, localScreenAudioTrack, startScreenAudioShare, stopScreenAudioShare } = useAgora('mudik-live', 'host');
  const { requests, talkRequests, salams, broadcastStatus, updateTalkStatus, markSongAsPlayed, toggleBroadcastStatus, markSalamRead } = useRealtimeData();

  const toggleBroadcast = async () => {
    await toggleBroadcastStatus();
  };

  const toggleMic = () => {
    if (localAudioTrack) {
      localAudioTrack.setEnabled(!isMicActive);
      setIsMicActive(!isMicActive);
    }
  };

  const handleMarkPlayed = async (id: string) => {
    await markSongAsPlayed(id);
  };

  const sfxButtons = [
    { label: 'TAWA', icon: '😂', color: 'from-yellow-500 to-amber-600' },
    { label: 'APPLAUSE', icon: '👏', color: 'from-blue-500 to-blue-600' },
    { label: 'TELOLET', icon: '🚌', color: 'from-green-500 to-emerald-600' },
    { label: 'DRUMROLL', icon: '🥁', color: 'from-indigo-500 to-violet-600' },
    { label: 'AIRHORN', icon: '📣', color: 'from-red-500 to-rose-600' },
    { label: 'BOING', icon: '🎾', color: 'from-orange-500 to-amber-600' },
  ];

  const unreadSalams = salams.filter(s => !s.is_read);

  // ════ LOGIN SCREEN ════
  if (!session) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-[#0a0a1a] via-[#111827] to-[#0f172a] text-slate-200 p-8 flex flex-col items-center justify-center gap-8">
         <div className="bg-white/5 p-12 rounded-[40px] border border-white/10 flex flex-col items-center max-w-md w-full text-center shadow-2xl backdrop-blur-xl">
            <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-green-500/20">
               <Music size={48} className="text-white" />
            </div>
            <h1 className="text-3xl font-black text-white mb-1">HOST LOGIN</h1>
            <p className="text-sm font-black bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-rose-400 mb-2">Radio Tidak Egois Isal</p>
            <p className="text-white/40 text-sm mb-8 font-bold leading-relaxed">
              Login dengan akun Spotify Premium untuk memutar lagu yang diminta pendengar.
            </p>
            <button 
              onClick={() => signIn('spotify')}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-2xl font-black text-lg transition-all shadow-xl shadow-green-500/20 hover:shadow-green-500/40"
            >
              LOGIN SPOTIFY
            </button>
         </div>
      </main>
    )
  }

  // ════ MAIN HOST DASHBOARD ════
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0a0a1a] via-[#111827] to-[#0f172a] text-slate-200 p-6 flex flex-col gap-6">
      {/* Header Bar */}
      <div className="flex justify-between items-center bg-white/5 p-5 rounded-[24px] border border-white/10 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-rose-500 rounded-xl flex items-center justify-center shadow-lg">
            <Radio size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-base font-black text-white tracking-tight">Radio Tidak Egois</h1>
            <p className="text-[10px] text-white/30 font-bold tracking-widest uppercase">Host Console</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleBroadcast}
            className={`px-6 py-2.5 rounded-xl font-black text-sm transition-all ${
              broadcastStatus?.is_on_air 
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' 
                : 'bg-white/10 text-white/50 hover:bg-white/20'
            }`}
          >
            {broadcastStatus?.is_on_air ? '⏹ STOP' : '▶ GO LIVE'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-5 flex-1">
        {/* ═══ LEFT: Controls ═══ */}
        <div className="col-span-12 lg:col-span-3 flex flex-col gap-4">
          {/* Mic & Audio Buttons */}
          <div className="flex gap-3">
            <button 
              onClick={toggleMic}
              className={`flex-1 rounded-[20px] flex flex-col items-center justify-center p-5 gap-3 transition-all shadow-xl ${
                isMicActive 
                  ? 'bg-gradient-to-b from-blue-500 to-blue-700 text-white' 
                  : 'bg-white/5 border border-white/10 text-white/40'
              }`}
            >
              <div className={`p-3 rounded-full ${isMicActive ? 'bg-white/15' : 'bg-white/5'}`}>
                {isMicActive ? <Mic size={24} strokeWidth={3} /> : <MicOff size={24} strokeWidth={3} />}
              </div>
              <span className="text-[10px] font-black tracking-widest">{isMicActive ? 'MIC ON' : 'MIC OFF'}</span>
            </button>

            <button 
              onClick={localScreenAudioTrack ? stopScreenAudioShare : startScreenAudioShare}
              className={`flex-1 rounded-[20px] flex flex-col items-center justify-center p-5 gap-3 transition-all shadow-xl ${
                localScreenAudioTrack 
                  ? 'bg-gradient-to-b from-green-500 to-green-700 text-white' 
                  : 'bg-white/5 border border-white/10 text-white/40'
              }`}
            >
              <div className={`p-3 rounded-full ${localScreenAudioTrack ? 'bg-white/15' : 'bg-white/5'}`}>
                {localScreenAudioTrack ? <Volume2 size={24} strokeWidth={3} /> : <Music size={24} strokeWidth={3} />}
              </div>
              <span className="text-[10px] font-black tracking-tight text-center leading-tight">
                {localScreenAudioTrack ? 'AUDIO ON' : 'SHARE AUDIO'}
              </span>
            </button>
          </div>

          {/* Soundboard */}
          <div className="bg-white/5 rounded-[20px] p-4 border border-white/10">
             <h3 className="text-[10px] font-black text-white/30 tracking-[0.2em] uppercase mb-4 flex items-center gap-2">
                <Volume2 size={12} /> Soundboard
             </h3>
             <div className="grid grid-cols-3 gap-2">
                {sfxButtons.map((btn) => (
                  <motion.button
                    key={btn.label}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => playSound(btn.label)}
                    className={`bg-gradient-to-b ${btn.color} h-16 rounded-xl flex flex-col items-center justify-center hover:brightness-110 active:brightness-90 transition-all shadow-lg`}
                  >
                    <span className="text-lg">{btn.icon}</span>
                    <span className="text-[7px] font-black text-white/70">{btn.label}</span>
                  </motion.button>
                ))}
             </div>
          </div>

          {/* Salam Reader */}
          <div className="bg-white/5 rounded-[20px] p-4 border border-white/10 flex-1 overflow-hidden flex flex-col">
            <h3 className="text-[10px] font-black text-white/30 tracking-[0.2em] uppercase mb-3 flex items-center gap-2">
              <MessageCircle size={12} /> Salam Masuk
              {unreadSalams.length > 0 && (
                <span className="bg-rose-500 text-white text-[9px] px-2 py-0.5 rounded-full font-black ml-auto">
                  {unreadSalams.length}
                </span>
              )}
            </h3>
            <div className="flex-1 overflow-y-auto flex flex-col gap-2 custom-scrollbar">
              <AnimatePresence>
                {unreadSalams.map((salam) => (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    key={salam.id}
                    className="bg-white/5 p-3 rounded-xl border border-white/5 flex items-start gap-3 group"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-rose-500 to-pink-500 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                      <Heart size={14} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-black text-rose-400 uppercase tracking-wider">{salam.sender_name}</p>
                      <p className="text-sm text-white/80 font-bold leading-snug break-words">{salam.message}</p>
                    </div>
                    <button 
                      onClick={() => markSalamRead(salam.id)}
                      className="p-1.5 bg-white/5 rounded-lg text-white/20 hover:bg-green-600 hover:text-white transition-all opacity-0 group-hover:opacity-100 shrink-0"
                    >
                      <Check size={14} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
              {unreadSalams.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center opacity-20 py-4">
                  <MessageCircle size={28} className="mb-2" />
                  <p className="text-[10px] font-black">BELUM ADA SALAM</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ═══ CENTER: Queue & Calls ═══ */}
        <div className="col-span-12 lg:col-span-6 bg-white/5 rounded-[24px] border border-white/10 shadow-2xl overflow-hidden flex flex-col">
          <div className="p-6 border-b border-white/5 flex justify-between items-center">
             <h2 className="text-lg font-black text-white flex items-center gap-3">
                <Music className="text-orange-400" size={20} /> REQUEST QUEUE
             </h2>
             <span className="bg-orange-500/10 text-orange-400 px-3 py-1 rounded-full text-[10px] font-black border border-orange-500/20">
                {requests.filter(r => r.status === 'pending').length} PENDING
             </span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2 custom-scrollbar">
            <AnimatePresence>
              {requests.filter(r => r.status === 'pending').map((req) => (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  key={req.id} 
                  className="bg-white/5 p-4 rounded-2xl border border-white/5 flex items-center gap-3 hover:border-orange-500/20 group transition-all"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500/20 to-rose-500/20 rounded-xl flex items-center justify-center group-hover:from-orange-500/30 group-hover:to-rose-500/30 transition-all">
                    <Music size={20} className="text-orange-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-black text-sm leading-tight uppercase tracking-tight truncate">{req.song_title}</div>
                    <div className="text-white/30 text-xs font-bold uppercase tracking-widest truncate">{req.artist}</div>
                    {req.listener_name && <div className="text-orange-400/50 text-[9px] font-bold mt-0.5">dari {req.listener_name}</div>}
                  </div>
                  <button 
                    onClick={() => handleMarkPlayed(req.id)}
                    className="p-3 bg-white/5 rounded-xl text-white/20 hover:bg-green-600 hover:text-white transition-all shadow-lg"
                  >
                    <Check size={20} strokeWidth={3} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
            {requests.filter(r => r.status === 'pending').length === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center opacity-15 py-12">
                <Music size={60} className="mb-3" />
                <p className="font-black text-sm">ANTREAN KOSONG</p>
              </div>
            )}
          </div>

          {/* Incoming Call Overlay */}
          <AnimatePresence>
            {talkRequests.filter(t => t.status === 'requested').length > 0 && (
              <motion.div 
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                exit={{ y: 100 }}
                className="p-5 bg-gradient-to-r from-red-600 to-rose-600 m-3 rounded-2xl flex items-center justify-between shadow-2xl shadow-red-600/30"
              >
                <div className="flex items-center gap-3">
                   <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center animate-bounce">
                     <PhoneCall size={24} className="text-white" />
                   </div>
                   <div>
                     <div className="text-white font-black text-lg tracking-tight">{talkRequests.filter(t => t.status === 'requested')[0]?.listener_name} MAU NGOBROL!</div>
                     <div className="text-red-200 text-[10px] font-bold uppercase tracking-widest">Incoming Talk Request</div>
                   </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => updateTalkStatus(talkRequests.filter(t => t.status === 'requested')[0].id, 'accepted')}
                    className="bg-white text-red-600 px-6 py-2.5 rounded-xl font-black shadow-lg hover:bg-slate-100 transition-all uppercase text-sm"
                  >
                    Angkat
                  </button>
                  <button 
                    onClick={() => updateTalkStatus(talkRequests.filter(t => t.status === 'requested')[0].id, 'rejected')}
                    className="bg-red-900/50 text-white p-2.5 rounded-xl hover:bg-red-900 transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ═══ RIGHT: Info ═══ */}
        <div className="col-span-12 lg:col-span-3 flex flex-col gap-4 text-center">
            <div className="flex-1 bg-white/5 rounded-[20px] border border-white/10 p-6 flex flex-col justify-center gap-1">
               <div className="text-[10px] font-black text-white/20 tracking-[0.3em] uppercase">Connection</div>
               <div className="text-white font-black text-lg">{broadcastStatus?.is_on_air ? 'ON AIR' : 'STANDBY'}</div>
               <div className="text-green-500 text-[9px] font-black tracking-widest uppercase mt-2">Agora WebRTC Active</div>
            </div>
            <div className="h-28 bg-gradient-to-br from-orange-500/20 to-rose-500/20 rounded-[20px] p-5 flex items-center justify-between border border-white/5">
               <div className="text-left">
                  <div className="text-white font-black text-sm">Radio Tidak Egois</div>
                  <div className="text-white/30 text-[9px] font-bold uppercase flex items-center gap-1">
                    Made with <Heart size={8} fill="currentColor" className="text-rose-500" /> 
                  </div>
               </div>
               <div className="text-3xl text-white/10 font-black">2026</div>
            </div>
        </div>
      </div>
    </main>
  );
}
