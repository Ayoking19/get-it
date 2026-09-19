import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../services/api';

const SUPPORT_EMAIL = 'support@getit.socialappwebsite.me';

export default function ContactUs() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });

  useEffect(() => {
    fetch(`${API_BASE}/me`, { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setFormData((prev) => ({ ...prev, name: data.full_name || '', email: data.email || '' }));
        }
      })
      .catch(() => {});
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const subjectLine = formData.subject || 'Message from Get It app';
    const bodyText = `From: ${formData.name} (${formData.email})\n\n${formData.message}`;
    const mailtoLink = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subjectLine)}&body=${encodeURIComponent(bodyText)}`;
    window.location.href = mailtoLink;
  };

  return (
    <div className="layout-wrapper">
      <div className="auth-card">
        <button onClick={() => navigate('/home')} className="page-back-link" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>← Back to dashboard</button>
        <div className="card-header">
          <h1 className="brand-title">Contact <span>Us</span></h1>
          <p className="brand-subtitle">We'll get back to you as soon as we can.</p>
        </div>

        <form onSubmit={handleSubmit} className="onboarding-form">
          <div className="input-group">
            <label>Your Name</label>
            <input type="text" name="name" required className="custom-input" value={formData.name} onChange={handleChange} />
          </div>
          <div className="input-group">
            <label>Your Email</label>
            <input type="email" name="email" required className="custom-input" value={formData.email} onChange={handleChange} />
          </div>
          <div className="input-group">
            <label>Subject</label>
            <input type="text" name="subject" required className="custom-input" placeholder="e.g., Issue with a request" value={formData.subject} onChange={handleChange} />
          </div>
          <div className="input-group">
            <label>Message</label>
            <textarea
              name="message"
              required
              rows="5"
              className="custom-input"
              style={{ resize: 'vertical', fontFamily: 'inherit' }}
              value={formData.message}
              onChange={handleChange}
            ></textarea>
          </div>
          <button type="submit" className="google-sso-btn continue-btn">
            <span className="primary-text" style={{ color: 'white', textAlign: 'center', width: '100%' }}>Send Message</span>
          </button>
        </form>

        <div className="card-footer">
          <p>Prefer email directly? Reach us at <strong>{SUPPORT_EMAIL}</strong></p>
        </div>
      </div>
    </div>
  );
}