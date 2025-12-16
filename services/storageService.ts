import { VoiceNote, NotionConfig } from "../types";

const NOTES_KEY = 'voice2notion_notes';
const CONFIG_KEY = 'voice2notion_config';

export const getStoredNotes = (): VoiceNote[] => {
  try {
    const stored = localStorage.getItem(NOTES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error("Failed to parse notes", e);
    return [];
  }
};

export const saveNoteToStorage = (note: VoiceNote) => {
  const notes = getStoredNotes();
  const updated = [note, ...notes];
  localStorage.setItem(NOTES_KEY, JSON.stringify(updated));
  return updated;
};

export const deleteNoteFromStorage = (id: string) => {
  const notes = getStoredNotes();
  const updated = notes.filter(n => n.id !== id);
  localStorage.setItem(NOTES_KEY, JSON.stringify(updated));
  return updated;
};

export const getNotionConfig = (): NotionConfig | null => {
  try {
    const stored = localStorage.getItem(CONFIG_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

export const saveNotionConfig = (config: NotionConfig) => {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
};

export const clearNotionConfig = () => {
    localStorage.removeItem(CONFIG_KEY);
};
