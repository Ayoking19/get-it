import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE, ALL_CLASSIFICATIONS } from '../services/api';

export default function Search() {
  const navigate = useNavigate();
  const [allServices, setAllServices] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [classification, setClassification] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/services`, { credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error('Not logged in');
        return res.json();
      })
      .then((data) => setAllServices(data))
      .catch(() => { navigate('/'); })
      .finally(() => setIsLoading(false));
  }, [navigate]);

  const filteredServices = allServices.filter((service) => {
    const matchesKeyword = (service.title || '').toLowerCase().includes(keyword.toLowerCase());
    const matchesClassification = !classification || service.classification === classification;
    return matchesKeyword && matchesClassification;
  });

  return (
    <div className="home-page-wrapper">
      <nav className="navbar">
        <div className="nav-logo">Get<span>it</span></div>
      </nav>
      <main className="home-content">
        <button onClick={() => navigate('/home')} className="page-back-link" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>← Back to dashboard</button>
        <h1 className="home-greeting">Search</h1>
        <div style={{ display: 'flex', gap: '12px', margin: '20px 0', flexWrap: 'wrap' }}>
          <input
            type="text"
            className="custom-input"
            style={{ flex: 2, minWidth: '200px' }}
            placeholder="Search by title..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <select
            className="custom-input"
            style={{ flex: 1, minWidth: '160px' }}
            value={classification}
            onChange={(e) => setClassification(e.target.value)}
          >
            <option value="">All categories</option>
            {ALL_CLASSIFICATIONS.map((c) => <option value={c} key={c}>{c}</option>)}
          </select>
        </div>

        {isLoading ? (
          <p className="empty-state">Loading...</p>
        ) : filteredServices.length === 0 ? (
          <p className="empty-state">No matching services found.</p>
        ) : (
          <div className="service-grid">
            {filteredServices.map((service) => (
              <div className="service-card" key={service.id}>
                <h3 className="service-card-title">{service.title || service.classification}</h3>
                <p className="service-card-provider">{service.providerName}</p>
                <div className="service-card-footer">
                  <span className="service-price">{service.price}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}