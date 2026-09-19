// src/components/CustomAlert.jsx
import React from 'react';

export default function CustomAlert({ isOpen, title, message, type, onClose, onConfirm }) {
  if (!isOpen) return null;
  return (
    <div className="alert-overlay">
      <div className="alert-card">
        <div className={`alert-icon ${type}`}>
          {type === 'success' ? (
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
          ) : type === 'confirm' ? (
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
          ) : (
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          )}
        </div>
        <h3 className="alert-title">{title}</h3>
        <p className="alert-message">{message}</p>
        
        {type === 'confirm' ? (
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="alert-btn error" style={{ flex: 1 }} onClick={onClose}>No</button>
            <button className="alert-btn success" style={{ flex: 1 }} onClick={() => { onClose(); if (onConfirm) onConfirm(); }}>Yes</button>
          </div>
        ) : (
          <button className={`alert-btn ${type}`} onClick={() => { onClose(); if (onConfirm) onConfirm(); }}>
            {type === 'success' ? 'Continue' : 'Dismiss'}
          </button>
        )}
      </div>
    </div>
  );
}