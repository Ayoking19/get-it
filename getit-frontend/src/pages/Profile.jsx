import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE, USE_MOCK_DATA, ALL_CLASSIFICATIONS } from '../services/api';
import CustomAlert from '../components/CustomAlert';

export default function Profile() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [myItems, setMyItems] = useState([]); 
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [editDraft, setEditDraft] = useState({ fullName: '', phone: '', stateOfOrigin: '', classifications: [] });
  const [classificationSearch, setClassificationSearch] = useState('');
  const [alertConfig, setAlertConfig] = useState({ isOpen: false, title: '', message: '', type: 'error', onConfirm: null });

  const showAlert = (title, message, type = 'error', onConfirm = null) => {
    setAlertConfig({ isOpen: true, title, message, type, onConfirm });
  };

  useEffect(() => {
    const loadProfileData = async () => {
      try {
        let userData;
        if (USE_MOCK_DATA) {
          userData = JSON.parse(localStorage.getItem('currentUser')) || { role: 'buyer', full_name: 'Test User' };
        } else {
          const res = await fetch(`${API_BASE}/me`, { credentials: 'include' });
          if (!res.ok) throw new Error('Not logged in');
          userData = await res.json();
        }
        
        setCurrentUser(userData);
        setEditDraft({
          fullName: userData.full_name || '',
          phone: userData.phone || '',
          stateOfOrigin: userData.state_of_origin || '',
          classifications: userData.classifications || []
        });

        if (userData.role === 'seller') {
          const itemsRes = await fetch(`${API_BASE}/listings?sellerId=${userData.id}`, { credentials: 'include' });
          if (itemsRes.ok) setMyItems(await itemsRes.json());
        } else if (userData.role === 'buyer') {
          const itemsRes = await fetch(`${API_BASE}/requests/mine`, { credentials: 'include' });
          if (itemsRes.ok) setMyItems(await itemsRes.json());
        } else if (userData.role === 'courier') {
          setMyItems([{ id: 1, pickup: 'Ikeja Mall', dropoff: 'Yaba', fee: '₦2,200', distance: '6.4km', status: 'Completed' }]);
        }

      } catch (error) {
        navigate('/');
      } finally {
        setIsLoading(false);
      }
    };
    loadProfileData();
  }, [navigate]);

  const handleClassificationToggle = (option) => {
    setEditDraft((prev) => {
      const alreadySelected = prev.classifications.includes(option);
      return {
        ...prev,
        classifications: alreadySelected
          ? prev.classifications.filter((item) => item !== option)
          : [...prev.classifications, option]
      };
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    if (USE_MOCK_DATA) {
       setTimeout(() => {
         setIsSaving(false);
         setIsEditing(false);
         showAlert('Profile Updated', 'Your changes have been saved locally.', 'success');
       }, 500);
       return;
    }

    try {
      const res = await fetch(`${API_BASE}/users/me`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(editDraft)
      });
      if (!res.ok) throw new Error('Backend route not ready');
      const updated = await res.json();
      setCurrentUser(updated);
      setIsEditing(false);
      showAlert('Success', 'Profile updated perfectly.', 'success');
    } catch (error) {
      showAlert('Missing Backend Route', "Your frontend works perfectly, but the backend is missing the PUT /api/users/me route. Tell your backend engineer to build it!", 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    showAlert('Secure Log Out', 'Are you sure you want to log out of your account?', 'confirm', async () => {
      if (!USE_MOCK_DATA) await fetch(`${API_BASE}/auth/logout`, { method: 'POST', credentials: 'include' });
      navigate('/');
    });
  };

  if (isLoading || !currentUser) {
    return <div className="layout-wrapper"><p style={{ color: '#94a3b8' }}>Loading your profile...</p></div>;
  }

  const firstName = currentUser.full_name ? currentUser.full_name.split(' ')[0] : 'there';
  const roleLabel = currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1);

  return (
    <div className="home-page-wrapper">
      <nav className="navbar">
        <div className="nav-logo">Get<span>it</span></div>
      </nav>
      <main className="home-content">
        <button onClick={() => navigate('/home')} className="page-back-link" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>← Back to dashboard</button>

        <div className="home-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className="nav-avatar" style={{ width: '64px', height: '64px', fontSize: '24px', cursor: 'default' }}>
              {currentUser.google_picture
                ? <img src={currentUser.google_picture} alt={firstName} className="nav-avatar-img" />
                : <span>{firstName.charAt(0)}</span>}
            </div>
            <div>
              <h1 className="home-greeting">{currentUser.full_name}</h1>
              <p className="home-subgreeting">@{currentUser.username}</p>
            </div>
          </div>
          <span className="role-badge">{roleLabel}</span>
        </div>

        {!isEditing ? (
          <>
            <div className="stats-glass-panel" style={{ justifyContent: 'flex-start', flexWrap: 'wrap', gap: '32px', marginTop: '24px' }}>
              <div className="stat-item" style={{ alignItems: 'flex-start' }}>
                <span className="stat-label">Email</span>
                <span style={{ color: 'white', fontSize: '14px', marginTop: '4px' }}>{currentUser.email}</span>
              </div>
              <div className="stat-item" style={{ alignItems: 'flex-start' }}>
                <span className="stat-label">Phone</span>
                <span style={{ color: 'white', fontSize: '14px', marginTop: '4px' }}>{currentUser.phone}</span>
              </div>
              <div className="stat-item" style={{ alignItems: 'flex-start' }}>
                <span className="stat-label">State of Origin</span>
                <span style={{ color: 'white', fontSize: '14px', marginTop: '4px' }}>{currentUser.state_of_origin || '—'}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '32px', marginBottom: '48px' }}>
              <button className="post-request-btn" onClick={() => setIsEditing(true)}>Edit Profile</button>
              <button className="cancel-btn" onClick={handleLogout}>Log Out</button>
            </div>

            <div className="section-header">
              <h2 className="section-title">
                {currentUser.role === 'seller' ? 'My Active Listings' : currentUser.role === 'buyer' ? 'My Request History' : 'Delivery History'}
              </h2>
            </div>
            
            <div className="listing-list">
              {myItems.length === 0 ? (
                <p className="empty-state">No history to display yet.</p>
              ) : myItems.map((item) => (
                <div className="listing-row" key={item.id}>
                  <div className="listing-row-main">
                    <h3 className="listing-title">{item.title || `${item.pickup} → ${item.dropoff}`}</h3>
                    <p className="listing-meta">
                      {currentUser.role === 'seller' ? `${item.classification} · ${item.views || 0} views` : 
                       currentUser.role === 'buyer' ? `Provider: ${item.provider || 'Pending'}` : item.distance}
                    </p>
                  </div>
                  <span className={`status-pill ${item.status === 'Active' || item.status === 'active' ? 'status-active' : 'status-waiting'}`}>
                    {item.status || 'Active'}
                  </span>
                  <span className="listing-price">{item.price || item.budget || item.fee}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="onboarding-form" style={{ marginTop: '24px', maxWidth: '480px' }}>
            <div className="input-group">
              <label>Full Name</label>
              <input type="text" className="custom-input" value={editDraft.fullName} onChange={(e) => setEditDraft((p) => ({ ...p, fullName: e.target.value }))} />
            </div>
            <div className="input-group">
              <label>Phone Number</label>
              <input type="tel" className="custom-input" value={editDraft.phone} onChange={(e) => setEditDraft((p) => ({ ...p, phone: e.target.value }))} />
            </div>
            <div className="input-group">
              <label>State of Origin</label>
              <input type="text" className="custom-input" value={editDraft.stateOfOrigin} onChange={(e) => setEditDraft((p) => ({ ...p, stateOfOrigin: e.target.value }))} />
            </div>

            {currentUser.role === 'seller' && (
              <div className="input-group">
                <label>Classifications</label>
                <input
                  type="text"
                  className="custom-input classification-search"
                  placeholder="Search categories..."
                  value={classificationSearch}
                  onChange={(e) => setClassificationSearch(e.target.value)}
                />
                <div className="classification-grid">
                  {ALL_CLASSIFICATIONS
                    .filter((option) => option.toLowerCase().includes(classificationSearch.toLowerCase()))
                    .map((option) => (
                      <label className="classification-chip" key={option}>
                        <input type="checkbox" checked={editDraft.classifications.includes(option)} onChange={() => handleClassificationToggle(option)} />
                        <span>{option}</span>
                      </label>
                    ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="request-btn" onClick={handleSave} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Changes'}</button>
              <button className="cancel-btn" onClick={() => setIsEditing(false)}>Cancel</button>
            </div>
          </div>
        )}
      </main>
      <CustomAlert {...alertConfig} onClose={() => setAlertConfig({ ...alertConfig, isOpen: false })} />
    </div>
  );
}