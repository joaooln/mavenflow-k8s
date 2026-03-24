import React, { useState, useRef } from 'react';
import { X, Check, Camera, User, Mail, FileText, Palette } from 'lucide-react';
import './UserProfileModal.css';

const AVATAR_COLORS = [
  '#0A66C2', '#7C3AED', '#047857', '#DC2626',
  '#B45309', '#0891B2', '#DB2777', '#4F46E5',
  '#1e293b', '#0f766e', '#9333EA', '#EA580C',
];

const UserProfileModal = ({ user, onSave, onClose }) => {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email || '');
  const [bio, setBio] = useState(user.bio || '');
  const [color, setColor] = useState(user.color);
  const [initials, setInitials] = useState(user.initials);
  const [nameError, setNameError] = useState('');
  const overlayRef = useRef(null);

  // Auto-update initials when name changes (unless user manually edited them)
  const [initialsManual, setInitialsManual] = useState(false);

  const handleNameChange = (val) => {
    setName(val);
    if (!initialsManual) {
      const words = val.trim().split(/\s+/).filter(Boolean);
      if (words.length >= 2) {
        setInitials((words[0][0] + words[1][0]).toUpperCase());
      } else if (words.length === 1 && words[0].length >= 2) {
        setInitials(words[0].slice(0, 2).toUpperCase());
      }
    }
  };

  const handleSave = () => {
    if (!name.trim()) { setNameError('O nome é obrigatório.'); return; }
    onSave({ name: name.trim(), email: email.trim(), bio: bio.trim(), color, initials: initials.trim().slice(0, 2).toUpperCase() || 'EU' });
    onClose();
  };

  return (
    <div
      className="modal-overlay"
      ref={overlayRef}
      onClick={e => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="profile-modal">
        <div className="profile-modal-header">
          <h2>Meu Perfil</h2>
          <button className="profile-close" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Avatar section */}
        <div className="profile-avatar-section">
          <div className="profile-avatar-large" style={{ background: color }}>
            {initials || 'EU'}
          </div>
          <div className="profile-avatar-info">
            <p className="avatar-hint">Escolha uma cor para o seu avatar</p>
            <div className="avatar-color-picker">
              {AVATAR_COLORS.map(c => (
                <button
                  key={c}
                  className={`avatar-color-swatch ${color === c ? 'selected' : ''}`}
                  style={{ background: c }}
                  onClick={() => setColor(c)}
                  title={c}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Fields */}
        <div className="profile-fields">
          <div className="profile-field">
            <label className="field-label">
              <User size={14} /> Nome *
            </label>
            <input
              className={`profile-input ${nameError ? 'input-error' : ''}`}
              placeholder="Seu nome completo"
              value={name}
              onChange={e => { handleNameChange(e.target.value); setNameError(''); }}
            />
            {nameError && <span className="field-error">{nameError}</span>}
          </div>

          <div className="profile-field">
            <label className="field-label">
              <Palette size={14} /> Iniciais do avatar
            </label>
            <input
              className="profile-input profile-input-sm"
              placeholder="Ex: JS"
              maxLength={2}
              value={initials}
              onChange={e => { setInitials(e.target.value.toUpperCase()); setInitialsManual(true); }}
            />
            <span className="field-hint">Máximo 2 caracteres</span>
          </div>

          <div className="profile-field">
            <label className="field-label">
              <Mail size={14} /> E-mail
            </label>
            <input
              className="profile-input"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          <div className="profile-field">
            <label className="field-label">
              <FileText size={14} /> Bio
            </label>
            <textarea
              className="profile-input profile-textarea"
              placeholder="Conte um pouco sobre você..."
              value={bio}
              onChange={e => setBio(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <div className="profile-actions">
          <button className="profile-btn-save" onClick={handleSave}>
            <Check size={15} /> Salvar alterações
          </button>
          <button className="profile-btn-cancel" onClick={onClose}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;
