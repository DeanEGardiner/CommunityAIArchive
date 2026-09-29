import React, { useState, useEffect } from 'react';
import { X, Key, Check, Sparkles } from 'lucide-react';
import { api } from '../api';

export default function SettingsModal({ isOpen, onClose, onSaved }) {
  const [geminiKey, setGeminiKey] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    try {
      const s = await api.getSettings();
      if (s.gemini_api_key) setGeminiKey(s.gemini_api_key);
    } catch (e) {
      console.error('Failed to load settings:', e);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.updateSettings({
        gemini_api_key: geminiKey
      });
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onSaved?.();
        onClose();
      }, 700);
    } catch (err) {
      alert('Failed to save settings: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
        <div className="modal-header">
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Key size={18} color="var(--accent-primary)" />
            Community AI Settings
          </h3>
          <button 
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px' }}>
          <div style={{
            background: 'rgba(139, 92, 246, 0.1)',
            border: '1px solid var(--border-active)',
            borderRadius: '8px',
            padding: '12px 14px',
            fontSize: '12.5px',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <Sparkles size={18} color="var(--accent-primary)" />
            <span>The Community AI Archive exclusively utilizes <strong>Google Gemini</strong> for forum intelligence, AI board analysis, Google Search grounding, and spam moderation.</span>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontSize: '13px', fontWeight: 600, color: '#fff', marginBottom: '6px', display: 'block' }}>
              Google Gemini API Key
            </label>
            <input 
              type="password"
              className="form-input"
              placeholder="AIzaSy..."
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '13.5px'
              }}
            />
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
              Used for community thread analysis, Google Search grounding, and automated AI spam detection.
            </span>
          </div>
        </div>

        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '16px 20px', borderTop: '1px solid var(--border-subtle)' }}>
          <button 
            type="button" 
            onClick={onClose}
            style={{
              padding: '8px 14px',
              borderRadius: '6px',
              background: 'transparent',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            Cancel
          </button>
          <button 
            type="button" 
            onClick={handleSave}
            disabled={isSaving}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              background: 'var(--accent-gradient)',
              color: '#fff',
              border: 'none',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px'
            }}
          >
            {savedSuccess ? (
              <>
                <Check size={16} /> Saved!
              </>
            ) : isSaving ? (
              'Saving...'
            ) : (
              'Save Settings'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
