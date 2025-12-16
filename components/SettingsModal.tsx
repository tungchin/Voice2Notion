import React, { useState, useEffect } from 'react';
import { NotionConfig } from '../types';
import { getNotionConfig, saveNotionConfig, clearNotionConfig } from '../services/storageService';
import { X, Save, Key, Database, Globe, Info, AlertTriangle, ExternalLink } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [apiKey, setApiKey] = useState('');
  const [databaseId, setDatabaseId] = useState('');
  const [corsProxy, setCorsProxy] = useState('');
  const [saved, setSaved] = useState(false);
  const [proxyError, setProxyError] = useState('');
  const [autoFilled, setAutoFilled] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const config = getNotionConfig();
      if (config) {
        setApiKey(config.apiKey);
        setDatabaseId(config.databaseId);
        setCorsProxy(config.corsProxy || '');
      }
      setSaved(false);
      setProxyError('');
      setAutoFilled(false);
    }
  }, [isOpen]);

  const handleDatabaseIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value.trim();
      
      // If user pastes a full Notion URL
      if (val.includes('notion.so')) {
          // 1. Try to find a 32-char hex string (common in URLs)
          const hexMatch = val.match(/([a-f0-9]{32})/i);
          if (hexMatch) {
              setDatabaseId(hexMatch[1]);
              return;
          }
      } 
      
      // Allow manual entry
      setDatabaseId(val);
  };

  const handleSave = () => {
    let finalProxy = corsProxy.trim();
    
    // Auto-fill proxy if empty to save user time
    if (!finalProxy) {
        finalProxy = 'https://cors-anywhere.herokuapp.com/';
        setCorsProxy(finalProxy);
        setAutoFilled(true);
    }

    // Basic validation
    if (finalProxy && !finalProxy.startsWith('http')) {
        setProxyError('Proxy URL must start with http:// or https://');
        return;
    }
    setProxyError('');

    if (apiKey && databaseId) {
      saveNotionConfig({ 
          apiKey: apiKey.trim(), 
          databaseId: databaseId.trim(), 
          corsProxy: finalProxy 
      });
      setSaved(true);
      setTimeout(() => {
          setSaved(false);
          setAutoFilled(false);
          onClose();
      }, 1500);
    }
  };

  const handleClear = () => {
      clearNotionConfig();
      setApiKey('');
      setDatabaseId('');
      setCorsProxy('');
  };

  const useDemoProxy = () => {
      setCorsProxy('https://cors-anywhere.herokuapp.com/');
      setProxyError('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800">Notion Integration</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800 space-y-2">
            <div className="flex items-start gap-2">
                <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                <p className="font-semibold">Important Connection Step:</p>
            </div>
            <p className="text-xs">
              You must <strong>Connect</strong> your specific Database to your Integration.
              In Notion, open your Database page, click the <strong>...</strong> (top right) &rarr; <strong>Connections</strong> &rarr; Select your integration.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800 space-y-2">
            <div className="flex items-start gap-2">
                <Info size={18} className="shrink-0 mt-0.5" />
                <p>
                  <strong>Required Columns:</strong>
                </p>
            </div>
            <ul className="list-disc list-inside pl-6 space-y-1 text-xs">
                <li><strong>Name</strong> (Title): For the summary</li>
                <li><strong>Category</strong> (Select): Work, Personal, Ideas, etc.</li>
                <li><strong>Tags</strong> (Multi-select): For keywords</li>
            </ul>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Integration Token</label>
            <div className="relative">
              <Key className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value.trim())}
                placeholder="secret_..."
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Database ID</label>
            <div className="relative">
              <Database className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <input
                type="text"
                value={databaseId}
                onChange={handleDatabaseIdChange}
                placeholder="Paste ID or full Notion URL"
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
              />
            </div>
            <p className="text-xs text-slate-400 mt-1">Found in your Notion database URL (32 characters).</p>
          </div>

          <div>
            <div className="flex justify-between items-baseline mb-1">
                <label className="block text-sm font-medium text-slate-700">
                    CORS Proxy URL
                </label>
                <button 
                    onClick={useDemoProxy}
                    className="text-[10px] text-indigo-600 hover:text-indigo-800 font-medium"
                >
                    Fill Default
                </button>
            </div>
            
            <div className="relative">
              <Globe className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <input
                type="text"
                value={corsProxy}
                onChange={(e) => {
                    setCorsProxy(e.target.value.trim());
                    setProxyError('');
                }}
                placeholder="Leave empty to use default"
                className={`w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 outline-none text-sm ${
                    proxyError ? 'border-red-500 focus:ring-red-200' : 'border-slate-300 focus:ring-indigo-500 focus:border-indigo-500'
                }`}
              />
            </div>
            {proxyError && <p className="text-xs text-red-500 mt-1">{proxyError}</p>}
            
            <p className="text-[10px] text-slate-400 mt-1">
                Required for browser-based API calls. Settings are saved automatically.
                {corsProxy.includes("herokuapp") && (
                    <span className="block mt-1 text-amber-600">
                        Using Demo Proxy? <a href="https://cors-anywhere.herokuapp.com/corsdemo" target="_blank" rel="noopener noreferrer" className="underline font-bold inline-flex items-center gap-0.5">Enable Access Here <ExternalLink size={10}/></a> if it fails.
                    </span>
                )}
            </p>
          </div>
        </div>

        <div className="p-4 bg-slate-50 flex justify-between items-center">
            <button 
                onClick={handleClear}
                className="text-sm text-red-500 hover:text-red-700 px-3 py-2"
            >
                Disconnect
            </button>
          <button
            onClick={handleSave}
            disabled={!apiKey || !databaseId}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              saved 
                ? 'bg-green-500 text-white' 
                : 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed'
            }`}
          >
            {saved ? (
                <span className="flex items-center gap-1">
                    Saved {autoFilled && "(Default Proxy Applied)"} <Save size={14}/>
                </span>
            ) : 'Save Configuration'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;