import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../services/api';

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/notifications`, { credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error('Not logged in');
        return res.json();
      })
      .then((data) => setNotifications(data))
      .catch(() => { navigate('/'); })
      .finally(() => setIsLoading(false));
  }, [navigate]);

  return (
    <div className="home-page-wrapper">
      <nav className="navbar">
        <div className="nav-logo">Get<span>it</span></div>
      </nav>
      <main className="home-content">
        <button onClick={() => navigate('/home')} className="page-back-link" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>← Back to dashboard</button>
        <h1 className="home-greeting">Notifications</h1>
        {isLoading ? (
          <p className="empty-state">Loading...</p>
        ) : notifications.length === 0 ? (
          <p className="empty-state">You have no notifications yet.</p>
        ) : (
          <div className="notification-list" style={{ marginTop: '20px' }}>
            {notifications.map((note) => (
              <div className="notification-row" key={note.id}>
                <p className="notification-text">{note.text}</p>
                <span className="notification-time">{note.time}</span>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}