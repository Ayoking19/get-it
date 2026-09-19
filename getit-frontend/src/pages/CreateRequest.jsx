import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ALL_CLASSIFICATIONS } from '../services/api';
import CustomAlert from '../components/CustomAlert';

export default function CreateRequest() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ title: '', classification: '', budget: '' });
  const [alertConfig, setAlertConfig] = useState({ isOpen: false, title: '', message: '', type: 'error', onConfirm: null });

  const showAlert = (title, message, type = 'error', onConfirm = null) => {
    setAlertConfig({ isOpen: true, title, message, type, onConfirm });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const existing = JSON.parse(localStorage.getItem('pendingBuyerRequests') || '[]');
    existing.push({ ...formData, id: Date.now(), createdAt: new Date().toISOString() });
    localStorage.setItem('pendingBuyerRequests', JSON.stringify(existing));
    
    showAlert('Request Broadcasted', 'Your request is live. Sellers in your area will be notified shortly.', 'success', () => {
      navigate('/home');
    });
  };

  return (
    <div className="layout-wrapper">
      <div className="auth-card">
        <button onClick={() => navigate('/home')} className="page-back-link" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>← Back to dashboard</button>
        <div className="card-header">
          <h1 className="brand-title">New <span>Request</span></h1>
          <p className="brand-subtitle">Tell Sellers what you need.</p>
        </div>
        <form onSubmit={handleSubmit} className="onboarding-form">
          <div className="input-group">
            <label>What do you need?</label>
            <input type="text" name="title" required className="custom-input" placeholder="e.g., Need a plumber to fix a leak" value={formData.title} onChange={handleChange} />
          </div>
          <div className="input-group">
            <label>Classification</label>
            <input type="text" name="classification" list="classification-options" required className="custom-input" placeholder="Search classification..." value={formData.classification} onChange={handleChange} />
            <datalist id="classification-options">
              {ALL_CLASSIFICATIONS.map((c) => <option value={c} key={c} />)}
            </datalist>
          </div>
          <div className="input-group">
            <label>Budget</label>
            <input type="text" name="budget" required className="custom-input" placeholder="e.g., ₦7,000" value={formData.budget} onChange={handleChange} />
          </div>
          <button type="submit" className="google-sso-btn continue-btn">
            <span className="primary-text" style={{ color: 'white', textAlign: 'center', width: '100%' }}>Post Request</span>
          </button>
        </form>
      </div>
      <CustomAlert {...alertConfig} onClose={() => setAlertConfig({ ...alertConfig, isOpen: false })} />
    </div>
  );
}