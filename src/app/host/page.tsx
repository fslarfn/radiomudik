"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Music, Play, Volume2, Users, Radio, Signal, Check, X, PhoneCall } from 'lucide-react';
import { useState } from 'react';
import { useAgora } from '@/hooks/useAgora';
import { useRealtimeData } from '@/hooks/useRealtimeData';
import { useSession, signIn } from 'next-auth/react';
// Kita tidak perlu import supabase di sini lagi karena sudah di-handle di hook

export default function HostDashboard() {
  const [isMicActive, setIsMicActive] = useState(true);
  const { data: session } = useSession();
  const { localAudioTrack, localScreenAudioTrack, startScreenAudioShare, stopScreenAudioShare } = useAgora('mudik-live', 'host');
  const { requests, talkRequests, broadcastStatus, updateTalkStatus, markSongAsPlayed, toggleBroadcastStatus } = useRealtimeData();

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
    { label: 'TAWA', icon: '😂', color: 'bg-yellow-500' },
    { label: 'APPLAUSE', icon: '👏', color: 'bg-blue-500' },
    { label: 'TELOLET', icon: '🚌', color: 'bg-green-500' },
    { label: 'DRUMROLL', icon: '🥁', color: 'bg-indigo-500' },
    { label: 'AIRHORN', icon: '📣', color: 'bg-red-500' },
    { label: 'BOING', icon: '🎾', color: 'bg-orange-500' },
  ];

  if (!session) {
    return (
      <main className="min-h-screen bg-[#020617] text-slate-200 p-8 flex flex-col items-center justify-center gap-8">
         <div className="bg-slate-900/80 p-12 rounded-[40px] border border-slate-800 flex flex-col items-center max-w-md w-full text-center shadow-2xl">
            <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-green-500/20">
               <Music size={48} className="text-slate-900" />
            </div>
            <h1 className="text-3xl font-black text-white mb-2">HOST LOGIN</h1>
            <p className="text-slate-400 text-sm mb-8 font-bold leading-relaxed">
              Anda perlu login dengan akun Spotify Premium untuk bisa memutar lagu yang diminta pendengar.
            </p>
            <button 
              onClick={() => signIn('spotify')}
              className="w-full bg-green-500 hover:bg-green-400 text-slate-900 py-4 rounded-2xl font-black text-lg transition-all shadow-xl shadow-green-500/20"
            >
              LOGIN SPOTIFY
            </button>
         </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#020617] text-slate-200 p-8 flex flex-col gap-8">
      {/* Header Bar */}
      <div className="flex justify-between items-center bg-slate-900/50 p-6 rounded-[32px] border border-slate-800 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20">
            <Radio size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight">MUDIK LIVE HOST</h1>
            <p className="text-xs text-slate-500 font-bold tracking-widest uppercase">Console v1.0</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
             <div className="flex items-center gap-2">
                <Users size={14} className="text-slate-500" />
                <span className="text-sm font-black text-white">01</span>
             </div>
             <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Listener Active</span>
          </div>
          <button 
            onClick={toggleBroadcast}
            className={`px-8 py-3 rounded-2xl font-black text-sm transition-all border-b-4 active:border-b-0 active:translate-y-1 ${
              broadcastStatus?.is_on_air 
                ? 'bg-red-600 border-red-900 text-white shadow-lg shadow-red-600/20' 
                : 'bg-slate-800 border-slate-950 text-slate-500'
            }`}
          >
            {broadcastStatus?.is_on_air ? 'STOP BROADCAST' : 'GO LIVE'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8 flex-1">
        {/* MIC & TOOLS */}
        <div className="col-span-12 lg:col-span-3 flex flex-col gap-6">
          <div className="flex gap-4">
            <button 
              onClick={toggleMic}
              className={`flex-1 rounded-[32px] flex flex-col items-center justify-center p-6 gap-4 border-b-8 active:border-b-0 active:translate-y-2 transition-all shadow-2xl ${
                isMicActive 
                  ? 'bg-gradient-to-b from-blue-500 to-blue-700 border-blue-900 text-white' 
                  : 'bg-slate-800 border-slate-950 text-slate-600'
              }`}
            >
              <div className={`p-4 rounded-full ${isMicActive ? 'bg-white/10' : 'bg-slate-900/50'}`}>
                {isMicActive ? <Mic size={32} strokeWidth={3} /> : <MicOff size={32} strokeWidth={3} />}
              </div>
              <span className="text-sm font-black tracking-widest">{isMicActive ? 'MIC ON' : 'MIC OFF'}</span>
            </button>

            <button 
              onClick={localScreenAudioTrack ? stopScreenAudioShare : startScreenAudioShare}
              className={`flex-1 rounded-[32px] flex flex-col items-center justify-center p-6 gap-4 border-b-8 active:border-b-0 active:translate-y-2 transition-all shadow-2xl ${
                localScreenAudioTrack 
                  ? 'bg-gradient-to-b from-green-500 to-green-700 border-green-900 text-white' 
                  : 'bg-slate-800 border-slate-950 text-slate-600'
              }`}
            >
              <div className={`p-4 rounded-full ${localScreenAudioTrack ? 'bg-white/10' : 'bg-slate-900/50'}`}>
                {localScreenAudioTrack ? <Volume2 size={32} strokeWidth={3} /> : <Music size={32} strokeWidth={3} />}
              </div>
              <span className="text-sm font-black tracking-tight text-center leading-tight">
                {localScreenAudioTrack ? 'AUDIO SHARED' : 'SHARE PC AUDIO'}
              </span>
            </button>
          </div>

          <div className="bg-slate-900 rounded-[32px] p-6 border border-slate-800">
             <h3 className="text-[10px] font-black text-slate-500 tracking-[0.2em] uppercase mb-6 flex items-center gap-2">
                <Volume2 size={14} /> Soundboard
             </h3>
             <div className="grid grid-cols-2 gap-3">
                {sfxButtons.map((btn) => (
                  <motion.button
                    key={btn.label}
                    whileTap={{ scale: 0.95 }}
                    className={`${btn.color} h-20 rounded-2xl flex flex-col items-center justify-center border-b-4 border-black/20 hover:brightness-110 active:border-b-0 active:translate-y-1 transition-all`}
                  >
                    <span className="text-2xl">{btn.icon}</span>
                    <span className="text-[9px] font-black text-white/70">{btn.label}</span>
                  </motion.button>
                ))}
             </div>
          </div>
        </div>

        {/* QUEUE & CALLS */}
        <div className="col-span-12 lg:col-span-6 bg-slate-900 rounded-[40px] border border-slate-800 shadow-2xl overflow-hidden flex flex-col">
          <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
             <h2 className="text-xl font-black text-white flex items-center gap-3">
                <Music className="text-blue-500" size={24} /> REQUEST QUEUE
             </h2>
             <span className="bg-blue-500/10 text-blue-500 px-4 py-1 rounded-full text-xs font-black border border-blue-500/20">
                {requests.filter(r => r.status === 'pending').length} PENDING
             </span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 custom-scrollbar">
            <AnimatePresence>
              {requests.filter(r => r.status === 'pending').map((req) => (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  key={req.id} 
                  className="bg-[#0f172a] p-5 rounded-3xl border border-slate-800 flex items-center gap-4 hover:border-blue-500/30 group transition-all"
                >
                  <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center text-xl font-black text-slate-600 group-hover:text-blue-500 transition-colors">
                    <Music size={24} />
                  </div>
                  <div className="flex-1">
                    <div className="text-white font-black text-lg leading-tight uppercase tracking-tight">{req.song_title}</div>
                    <div className="text-slate-500 text-sm font-bold uppercase tracking-widest">{req.artist}</div>
                  </div>
                  <button 
                    onClick={() => handleMarkPlayed(req.id)}
                    className="p-4 bg-slate-800 rounded-2xl text-slate-400 hover:bg-green-600 hover:text-white transition-all shadow-lg"
                  >
                    <Check size={24} strokeWidth={3} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
            {requests.filter(r => r.status === 'pending').length === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center opacity-20">
                <Music size={80} className="mb-4" />
                <p className="font-black">ANTREAN KOSONG</p>
              </div>
            )}
          </div>

          {/* Incoming Call Overlay-style Banner */}
          <AnimatePresence>
            {talkRequests.length > 0 && (
              <motion.div 
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                exit={{ y: 100 }}
                className="p-6 bg-red-600 m-4 rounded-3xl flex items-center justify-between shadow-2xl shadow-red-600/40 border-b-4 border-red-900"
              >
                <div className="flex items-center gap-4">
                   <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center animate-bounce">
                     <PhoneCall size={32} className="text-white" />
                   </div>
                   <div>
                     <div className="text-white font-black text-2xl tracking-tighter">DITTA MAU NGOBROL!</div>
                     <div className="text-red-200 text-xs font-bold uppercase tracking-widest">Incoming Talk Request</div>
                   </div>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => updateTalkStatus(talkRequests[0].id, 'accepted')}
                    className="bg-white text-red-600 px-8 py-3 rounded-2xl font-black shadow-lg hover:bg-slate-100 transition-all uppercase text-sm"
                  >
                    Angkat
                  </button>
                  <button 
                    onClick={() => updateTalkStatus(talkRequests[0].id, 'rejected')}
                    className="bg-red-900/50 text-white p-3 rounded-2xl hover:bg-red-900 transition-all"
                  >
                    <X size={24} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* MISC INFO */}
        <div className="col-span-12 lg:col-span-3 flex flex-col gap-6 text-center">
            <div className="flex-1 bg-slate-900 rounded-[40px] border border-slate-800 p-8 flex flex-col justify-center gap-2">
               <Signal size={48} className="mx-auto text-slate-800 mb-4" />
               <div className="text-xs font-black text-slate-500 tracking-[0.3em] uppercase">Connection info</div>
               <div className="text-white font-black text-xl">LOW LATENCY</div>
               <div className="text-blue-500 text-[10px] font-black tracking-widest uppercase mt-4">Agora WebRTC Active</div>
            </div>
            <div className="h-32 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[32px] p-6 flex items-center justify-between border-b-4 border-indigo-900 shadow-xl">
               <div className="text-left">
                  <div className="text-white font-black text-lg italic">Premium Radio</div>
                  <div className="text-white/50 text-[10px] font-bold uppercase">Crafted with Love</div>
               </div>
               <div className="text-4xl text-white/20 font-black">2026</div>
            </div>
        </div>
      </div>
    </main>
  );
}
