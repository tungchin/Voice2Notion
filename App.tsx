import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, Settings, Sparkles, Loader2, LayoutGrid, List as ListIcon } from 'lucide-react';
import { VoiceNote, ProcessingResult } from './types';
import { getStoredNotes, saveNoteToStorage, deleteNoteFromStorage, getNotionConfig } from './services/storageService';
import { processAudioNote } from './services/geminiService';
import { saveToNotion, NotionResponse } from './services/notionService';
import AudioVisualizer from './components/AudioVisualizer';
import NoteCard from './components/NoteCard';
import SettingsModal from './components/SettingsModal';

const App: React.FC = () => {
  // State
  const [notes, setNotes] = useState<VoiceNote[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number>();

  // Initialize Data
  useEffect(() => {
    setNotes(getStoredNotes());
  }, []);

  // Timer Logic
  useEffect(() => {
    if (isRecording) {
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
      setRecordingTime(0);
    }
    return () => clearInterval(timerRef.current);
  }, [isRecording]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMediaStream(stream);
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        
        // Stop stream tracks to release mic
        stream.getTracks().forEach(track => track.stop());
        setMediaStream(null);
        
        handleAudioProcessing(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Microphone access denied. Please check your permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleAudioProcessing = async (blob: Blob) => {
    setIsProcessing(true);
    try {
      // 1. Send to Gemini for STT and Categorization
      const result: ProcessingResult = await processAudioNote(blob);

      // 2. Mock Notion Sync (or real if backend existed)
      const notionConfig = getNotionConfig();
      let syncResult: NotionResponse = { success: false };

      // 3. Create Note Object (optimistic UI)
      const newNote: VoiceNote = {
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        ...result,
        syncedToNotion: false
      };

      if (notionConfig) {
        // Attempt real sync
        syncResult = await saveToNotion(newNote, notionConfig);
      }

      newNote.syncedToNotion = syncResult.success;

      // 4. Save Locally
      const updatedNotes = saveNoteToStorage(newNote);
      setNotes(updatedNotes);
      
      if (notionConfig && !syncResult.success) {
          alert(`Note saved locally, but Notion sync failed.\n\nReason: ${syncResult.message}`);
      }

    } catch (error) {
      console.error("Processing failed:", error);
      alert("Failed to process audio. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = (id: string) => {
    const updated = deleteNoteFromStorage(id);
    setNotes(updated);
  };

  const handleRetrySync = async (note: VoiceNote) => {
     const notionConfig = getNotionConfig();
     if(!notionConfig) {
         setIsSettingsOpen(true);
         return;
     }

     const syncResult = await saveToNotion(note, notionConfig);
     
     if (syncResult.success) {
         const updatedNotes = notes.map(n => n.id === note.id ? { ...n, syncedToNotion: true } : n);
         setNotes(updatedNotes);
         localStorage.setItem('voice2notion_notes', JSON.stringify(updatedNotes));
         alert("Successfully synced to Notion!");
     } else {
         alert(`Sync failed.\n\nReason: ${syncResult.message}`);
     }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen flex flex-col max-w-5xl mx-auto bg-slate-50">
      {/* Header */}
      <header className="p-6 flex justify-between items-center bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
                <Sparkles className="text-white" size={20} />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Voice2Notion AI</h1>
        </div>
        <button 
          onClick={() => setIsSettingsOpen(true)}
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
        >
          <Settings size={20} />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 flex flex-col gap-8 relative">
        
        {/* Recorder Section */}
        <div className="flex flex-col items-center justify-center py-8 gap-6">
            <div className="relative">
                {/* Ping Animation when recording */}
                {isRecording && (
                    <div className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-20 scale-150"></div>
                )}
                
                <button
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={isProcessing}
                    className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all transform hover:scale-105 ${
                    isRecording 
                        ? 'bg-red-500 text-white shadow-red-200' 
                        : isProcessing 
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'bg-indigo-600 text-white shadow-indigo-200 hover:shadow-indigo-300'
                    }`}
                >
                    {isProcessing ? (
                        <Loader2 className="animate-spin" size={32} />
                    ) : isRecording ? (
                        <div className="w-8 h-8 bg-white rounded-md" /> // Stop square
                    ) : (
                        <Mic size={32} />
                    )}
                </button>
            </div>

            <div className="h-12 flex flex-col items-center justify-center w-full max-w-md">
                {isRecording ? (
                     <div className="w-full space-y-2">
                        <div className="text-center font-mono text-red-500 font-medium">{formatTime(recordingTime)}</div>
                        <AudioVisualizer stream={mediaStream} isRecording={isRecording} />
                     </div>
                ) : isProcessing ? (
                    <div className="flex flex-col items-center gap-2 text-indigo-600 animate-pulse">
                        <span className="font-medium text-sm">Processing with Gemini...</span>
                        <span className="text-xs text-slate-400">Transcribing & Categorizing</span>
                    </div>
                ) : (
                    <p className="text-slate-400 text-sm">Tap microphone to start recording</p>
                )}
            </div>
        </div>

        {/* Notes Grid */}
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                    <ListIcon size={18} />
                    Recent Notes
                </h2>
                <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
                    {notes.length} notes
                </span>
            </div>

            {notes.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                    <p className="text-slate-400 text-sm">No notes yet. Start recording to add one.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-20">
                    {notes.map(note => (
                        <NoteCard 
                            key={note.id} 
                            note={note} 
                            onDelete={handleDelete}
                            onRetrySync={handleRetrySync}
                        />
                    ))}
                </div>
            )}
        </div>
      </main>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
    </div>
  );
};

export default App;
