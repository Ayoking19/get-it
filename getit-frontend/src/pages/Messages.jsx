import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const getQueryParam = (name) => new URLSearchParams(window.location.search).get(name);

export default function Messages() {
  const navigate = useNavigate();
  const initialTo = getQueryParam('to') || '';
  const initialAbout = getQueryParam('about') || '';

  const [threads, setThreads] = useState(() => JSON.parse(localStorage.getItem('messageThreads') || '{}'));
  const [activeThread, setActiveThread] = useState(initialTo);
  const [draft, setDraft] = useState(initialAbout ? `Hi, I saw your request about "${initialAbout}" — I can help!` : '');

  useEffect(() => {
    if (initialTo && !threads[initialTo]) {
      setThreads((prev) => ({ ...prev, [initialTo]: [] }));
    }
  }, [initialTo, threads]);

  const handleSend = () => {
    if (!draft.trim() || !activeThread) return;
    const updated = {
      ...threads,
      [activeThread]: [...(threads[activeThread] || []), { text: draft, sender: 'me' }]
    };
    setThreads(updated);
    localStorage.setItem('messageThreads', JSON.stringify(updated));
    setDraft('');
  };

  const threadNames = Object.keys(threads);

  return (
    <div className="home-page-wrapper">
      <nav className="navbar">
        <div className="nav-logo">Get<span>it</span></div>
      </nav>
      <main className="home-content">
        <button onClick={() => navigate('/home')} className="page-back-link" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>← Back to dashboard</button>
        <h1 className="home-greeting">Messages</h1>

        {threadNames.length === 0 ? (
          <p className="empty-state">No conversations yet.</p>
        ) : (
          <div className="thread-list" style={{ marginTop: '20px' }}>
            {threadNames.map((name) => (
              <div
                key={name}
                className={`thread-row ${activeThread === name ? 'active-thread' : ''}`}
                onClick={() => setActiveThread(name)}
              >
                {name}
              </div>
            ))}
          </div>
        )}

        {activeThread && (
          <>
            <h2 className="section-title" style={{ marginBottom: '12px' }}>{activeThread}</h2>
            <div>
              {(threads[activeThread] || []).map((msg, i) => (
                <div key={i} className={`message-bubble ${msg.sender === 'me' ? 'sent' : 'received'}`}>
                  {msg.text}
                </div>
              ))}
            </div>
            <div className="message-compose">
              <input
                type="text"
                className="custom-input"
                placeholder="Type a message..."
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              />
              <button className="request-btn" onClick={handleSend}>Send</button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}