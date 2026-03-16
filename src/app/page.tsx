"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Music, MessageCircle, Signal, Send, X } from 'lucide-react';
import { useState } from 'react';
import { useAgora } from '@/hooks/useAgora';
import { useRealtimeData } from '@/hooks/useRealtimeData';

export default function ListenerPage() {
  const [isJukeboxOpen, setIsJukeboxOpen] = useState(false);
  const [isSalamOpen, setIsSalamOpen] = useState(false);
  const [songInput, setSongInput] = useState({ title: '', artist: '' });
  const [salamText, setSalamText] = useState('');
  
  const { joinState } = useAgora('mudik-live', 'audience');
  const { addSongRequest, requestTalk, talkRequests, broadcastStatus } = useRealtimeData();

  const handleRequestTalk = async () => {
    await requestTalk('Ditta');
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

  const isCalling = talkRequests.some(r => r.listener_name === 'Ditta' && r.status === 'requested');

  return (
    <main className="min-h-screen bg-[#0f172a] text-white p-6 flex flex-col items-center justify-between overflow-hidden">
      {/* Background Glow */}
      <div className="fixed inset-0 overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full" />
      </div>

      {/* Status Bar */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full flex justify-between items-center p-4 rounded-2xl bg-slate-800/40 border border-slate-700/50 backdrop-blur-xl"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className={`h-3 w-3 rounded-full ${joinState ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`} />
            {joinState && <div className="absolute inset-0 h-3 w-3 rounded-full bg-green-500 animate-ping" />}
          </div>
          <span className="text-xs font-black tracking-widest text-slate-300 uppercase">
            {broadcastStatus?.is_on_air ? 'LIVE ON AIR' : 'RADIO STANDBY'}
          </span>
        </div>
        <div className="bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full text-[10px] font-bold border border-blue-500/20">
          HD AUDIO
        </div>
      </motion.div>

      {/* Main Player Area */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm gap-8">
        <div className="relative">
          <motion.div 
            animate={{ 
              rotate: broadcastStatus?.is_on_air ? 360 : 0,
              scale: isCalling ? [1, 1.1, 1] : 1
            }}
            transition={{ 
              rotate: { repeat: Infinity, duration: 10, ease: "linear" },
              scale: { repeat: Infinity, duration: 1 }
            }}
            className="w-56 h-56 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 p-1 shadow-[0_0_50px_-15px_rgba(59,130,246,0.5)]"
          >
            <div className="w-full h-full rounded-full bg-[#0f172a] flex items-center justify-center overflow-hidden border-4 border-[#0f172a]">
               <Music size={64} className="text-blue-500/50" />
            </div>
          </motion.div>
          {broadcastStatus?.is_on_air && (
            <div className="absolute -bottom-2 -right-2 bg-red-600 px-4 py-1 rounded-lg text-[10px] font-black tracking-tighter shadow-lg">
              ON AIR
            </div>
          )}
        </div>

        <div className="text-center">
          <h1 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400">
            MUDIK LIVE
          </h1>
          <p className="text-blue-400 text-xs font-black tracking-[0.3em] uppercase mt-1">Personal Radio</p>
        </div>
      </div>

      {/* Safe-Driving Interaction Buttons */}
      <div className="w-full max-w-sm flex flex-col gap-4 mb-2">
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={handleRequestTalk}
          disabled={isCalling}
          className={`h-24 rounded-[32px] flex items-center justify-center gap-4 text-2xl font-black shadow-2xl transition-all border-b-8 active:border-b-0 active:translate-y-1 ${
            isCalling 
              ? 'bg-slate-700 border-slate-900 text-slate-500 cursor-not-allowed' 
              : 'bg-gradient-to-r from-orange-500 to-red-600 border-red-800 text-white shadow-orange-500/20'
          }`}
        >
          <Mic size={32} />
          {isCalling ? 'DITUNGGU HOST...' : 'MAU NGOBROL'}
        </motion.button>

        <div className="grid grid-cols-2 gap-4">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsJukeboxOpen(true)}
            className="h-24 bg-slate-800/80 backdrop-blur-lg rounded-[28px] flex flex-col items-center justify-center gap-2 border-t border-slate-700 shadow-xl"
          >
            <Music size={24} className="text-blue-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Jukebox</span>
          </motion.button>
          
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsSalamOpen(true)}
            className="h-24 bg-slate-800/80 backdrop-blur-lg rounded-[28px] flex flex-col items-center justify-center gap-2 border-t border-slate-700 shadow-xl"
          >
            <MessageCircle size={24} className="text-emerald-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Salam</span>
          </motion.button>
        </div>
      </div>

      <p className="text-[9px] font-black text-slate-600 tracking-[0.5em] uppercase pointer-events-none">
        Special for Ditta
      </p>

      {/* Jukebox Modal */}
      <AnimatePresence>
        {isJukeboxOpen && (
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="fixed inset-0 z-50 bg-[#0f172a] p-8 flex flex-col gap-6"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-black">REQUEST LAGU</h2>
              <button onClick={() => setIsJukeboxOpen(false)} className="p-2 bg-slate-800 rounded-full"><X /></button>
            </div>
            <div className="flex flex-col gap-4">
              <input 
                type="text" 
                placeholder="Judul Lagu..." 
                className="bg-slate-800 p-6 rounded-2xl border-2 border-slate-700 focus:border-blue-500 outline-none font-bold"
                value={songInput.title}
                onChange={(e) => setSongInput({...songInput, title: e.target.value})}
              />
              <input 
                type="text" 
                placeholder="Nama Artis..." 
                className="bg-slate-800 p-6 rounded-2xl border-2 border-slate-700 focus:border-blue-500 outline-none font-bold"
                value={songInput.artist}
                onChange={(e) => setSongInput({...songInput, artist: e.target.value})}
              />
              <button 
                onClick={handleSendRequest}
                className="bg-blue-600 py-6 rounded-2xl font-black text-xl shadow-lg shadow-blue-600/20 flex items-center justify-center gap-3"
              >
                <Send size={20} /> KIRIM REQUEST
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Salam Modal - Simple for Drive Safety */}
      <AnimatePresence>
        {isSalamOpen && (
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="fixed inset-0 z-50 bg-[#0f172a] p-8 flex flex-col gap-6"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-black">KIRIM SALAM</h2>
              <button onClick={() => setIsSalamOpen(false)} className="p-2 bg-slate-800 rounded-full"><X /></button>
            </div>
            <textarea 
              placeholder="Tulis pesanmu di sini..." 
              className="bg-slate-800 p-6 rounded-2xl border-2 border-slate-700 focus:border-emerald-500 outline-none font-bold flex-1 resize-none text-xl"
              value={salamText}
              onChange={(e) => setSalamText(e.target.value)}
            />
            <button 
              onClick={() => { setIsSalamOpen(false); setSalamText(''); }}
              className="bg-emerald-600 py-6 rounded-2xl font-black text-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-3"
            >
              <Send size={20} /> KIRIM SALAM
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
