import React from 'react';
import { VoiceNote } from '../types';
import { CATEGORY_COLORS } from '../constants';
import { Trash2, CheckCircle, UploadCloud, Copy } from 'lucide-react';

interface NoteCardProps {
  note: VoiceNote;
  onDelete: (id: string) => void;
  onRetrySync: (note: VoiceNote) => void;
}

const NoteCard: React.FC<NoteCardProps> = ({ note, onDelete, onRetrySync }) => {
  const date = new Date(note.createdAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const copyToClipboard = () => {
    navigator.clipboard.writeText(note.transcription);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col gap-3">
      <div className="flex justify-between items-start">
        <span className={`text-xs font-semibold px-2 py-1 rounded-full border ${CATEGORY_COLORS[note.category]}`}>
          {note.category}
        </span>
        <span className="text-xs text-slate-400">{date}</span>
      </div>

      <div className="space-y-1">
        <h3 className="font-semibold text-slate-800 leading-tight">
          {note.summary}
        </h3>
        <p className="text-sm text-slate-600 line-clamp-3">
          "{note.transcription}"
        </p>
      </div>

      <div className="flex flex-wrap gap-1 mt-1">
        {note.tags.map(tag => (
          <span key={tag} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
            #{tag}
          </span>
        ))}
      </div>

      <div className="border-t border-slate-100 pt-3 mt-auto flex justify-between items-center">
        <div className="flex items-center gap-2">
            {note.syncedToNotion ? (
                <div className="flex items-center gap-1 text-green-600 text-xs font-medium" title="Synced to Notion (Mock)">
                    <CheckCircle size={14} />
                    <span>Saved</span>
                </div>
            ) : (
                <button 
                    onClick={() => onRetrySync(note)}
                    className="flex items-center gap-1 text-amber-600 hover:text-amber-700 text-xs font-medium transition-colors"
                    title="Retry Sync"
                >
                    <UploadCloud size={14} />
                    <span>Sync</span>
                </button>
            )}
        </div>

        <div className="flex items-center gap-3 text-slate-400">
          <button onClick={copyToClipboard} className="hover:text-slate-600 transition-colors" title="Copy Text">
            <Copy size={16} />
          </button>
          <button onClick={() => onDelete(note.id)} className="hover:text-red-500 transition-colors" title="Delete">
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default NoteCard;
