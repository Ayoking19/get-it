import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE, USE_MOCK_DATA, ALL_CLASSIFICATIONS } from '../services/api';
import CustomAlert from '../components/CustomAlert';

export default function CreateListing() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ title: '', classification: '', price: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ isOpen: false, title: '', message: '', type: 'error', onConfirm: null });

  const showAlert = (title, message, type = 'error', onConfirm = null) => {
    setAlertConfig({ isOpen: true, title, message, type, onConfirm });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    if (USE_MOCK_DATA) {
      setTimeout(() => {
        setIsSaving(false);
        showAlert('Listing Published', 'Your service has been successfully posted to the marketplace.', 'success', () => {
          navigate('/home');
        });
      }, 800);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/listings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });
      if (!res.ok) throw new Error('Failed to create listing');
      navigate('/home');
    } catch (error) {
      setIsSaving(false);
      showAlert('Connection Error', 'Could not create your listing. Please verify your connection and try again.', 'error');
    }
  };

  return (
    <div className="layout-wrapper">
      <div className="auth-card">
        <button onClick={() => navigate('/home')} className="page-back-link" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>← Back to dashboard</button>
        <div className="card-header">
          <h1 className="brand-title">New <span>Listing</span></h1>
          <p className="brand-subtitle">Tell buyers what you're offering.</p>
        </div>
        <form onSubmit={handleSubmit} className="onboarding-form">
          <div className="input-group">
            <label>Title</label>
            <input type="text" name="title" required className="custom-input" placeholder="e.g., Professional Plumbing Repair" value={formData.title} onChange={handleChange} />
          </div>
          <div className="input-group">
            <label>Classification</label>
            <input type="text" name="classification" list="classification-options" required className="custom-input" placeholder="Search classification..." value={formData.classification} onChange={handleChange} />
            <datalist id="classification-options">
              {ALL_CLASSIFICATIONS.map((c) => <option value={c} key={c} />)}
            </datalist>
          </div>
          <div className="input-group">
            <label>Price</label>
            <input type="text" name="price" required className="custom-input" placeholder="e.g., ₦8,500" value={formData.price} onChange={handleChange} />
          </div>
          <button type="submit" className="google-sso-btn continue-btn" disabled={isSaving}>
            <span className="primary-text" style={{ color: 'white', textAlign: 'center', width: '100%' }}>
              {isSaving ? 'Saving...' : 'Publish Listing'}
            </span>
          </button>
        </form>
      </div>
      <CustomAlert {...alertConfig} onClose={() => setAlertConfig({ ...alertConfig, isOpen: false })} />
    </div>
  );
}