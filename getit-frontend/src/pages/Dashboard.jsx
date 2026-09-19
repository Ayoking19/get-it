import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const USE_MOCK_DATA = false;
const API_BASE = 'https://ayomikun.alwaysdata.net/api';

const mockDelay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

const ALL_CLASSIFICATIONS = [
  'Furniture', 'Mechanical Engineering', 'Electrical Engineering', 'Cook', 'Plumbing',
  'Entertainment', 'Electronic Devices', 'Health Expert', 'Gym', 'Graphic Design',
  'Web Development', 'Photography', 'Tutoring', 'Event Planning', 'Beauty & Salon',
  'Auto Repair', 'Tailoring', 'Cleaning Services', 'Painting', 'Food', 'Clothing',
  'Electronics', 'Cars', 'Houses', 'Watches', 'Cooking Utensils', 'Transport',
  'Books', 'Jewelry', 'Sports Equipment', 'Beauty Products', 'Toys', 'Appliances'
].sort();

const Api = {
  getCurrentUser: async () => {
    if (USE_MOCK_DATA) {
      await mockDelay();
      const stored = localStorage.getItem('currentUser');
      if (!stored) {
        const fallbackUser = { username: 'oreoluwa', full_name: 'Oreoluwa', role: 'buyer', email: 'oreoluwa@gmail.com' };
        localStorage.setItem('currentUser', JSON.stringify(fallbackUser));
        return fallbackUser;
      }
      return JSON.parse(stored);
    }
    const res = await fetch(`${API_BASE}/me`, { credentials: 'include' });
    if (!res.ok) throw new Error('Not logged in');
    return res.json();
  },
  logout: async () => {
    if (USE_MOCK_DATA) {
      localStorage.removeItem('currentUser');
      return;
    }
    await fetch(`${API_BASE}/auth/logout`, { method: 'POST', credentials: 'include' });
  },
  getNearbyServices: async (coords = {}) => {
    if (USE_MOCK_DATA) {
      await mockDelay();
      return [
        { id: 1, providerName: 'Adaeze Okafor', title: 'Plumbing Repair', classification: 'Plumbing', rating: 4.9, price: '₦8,500', distance: '1.2km away' },
        { id: 2, providerName: 'Chidi Emeka', title: 'AC Installation', classification: 'Electrical Engineering', rating: 4.7, price: '₦25,000', distance: '2.4km away' },
        { id: 3, providerName: 'Fatima Sule', title: 'House Cleaning', classification: 'Cleaning Services', rating: 5.0, price: '₦6,000', distance: '0.8km away' }
      ];
    }
    const { lat, lng } = coords;
    let url = `${API_BASE}/services`;
    if (lat && lng) url += `?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`;
    const res = await fetch(url, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch services');
    return res.json();
  },
  getDeliveries: async () => {
    if (USE_MOCK_DATA) await mockDelay();
    return [
      { id: 1, pickup: 'Ikeja Mall', dropoff: 'Yaba', fee: '₦2,200', distance: '6.4km', status: 'Available' },
      { id: 2, pickup: 'Lekki Phase 1', dropoff: 'Victoria Island', fee: '₦3,500', distance: '3.1km', status: 'Available' }
    ];
  },
  getListings: async () => {
    if (USE_MOCK_DATA) {
      await mockDelay();
      return [{ id: 1, title: 'Plumbing Service', classification: 'Plumbing', price: '₦8,500', views: 42, status: 'Active' }];
    }
    const res = await fetch(`${API_BASE}/listings`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch listings');
    return res.json();
  },
  updateListing: async (id, changes) => {
    if (USE_MOCK_DATA) {
      await mockDelay();
      return { id, ...changes, status: 'Active', views: 42 };
    }
    const res = await fetch(`${API_BASE}/listings/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(changes)
    });
    if (!res.ok) throw new Error('Update failed');
    return res.json();
  },
  deleteListing: async (id) => {
    if (USE_MOCK_DATA) {
      await mockDelay();
      return;
    }
    const res = await fetch(`${API_BASE}/listings/${id}`, { method: 'DELETE', credentials: 'include' });
    if (!res.ok) throw new Error('Delete failed');
  },
  getMatchingRequests: async (classifications) => {
    if (USE_MOCK_DATA) {
      await mockDelay();
      return [];
    }
    const query = classifications.map((c) => `classifications[]=${encodeURIComponent(c)}`).join('&');
    const res = await fetch(`${API_BASE}/requests/matching?${query}`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch matching requests');
    return res.json();
  },
  getMyRequests: async () => {
    if (USE_MOCK_DATA) {
      await mockDelay();
      return [];
    }
    const res = await fetch(`${API_BASE}/requests/mine`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch requests');
    return res.json();
  },
  sendRequest: async (service) => {
    if (USE_MOCK_DATA) {
      await mockDelay();
      return { id: Date.now(), title: service.title, provider: service.providerName, status: 'active', listing_id: service.id };
    }
    const res = await fetch(`${API_BASE}/requests`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ listingId: service.id })
    });
    if (!res.ok) throw new Error('Request failed');
    return res.json();
  },
  endRequest: async (id, status = 'cancelled') => {
    if (USE_MOCK_DATA) {
      await mockDelay();
      return;
    }
    const res = await fetch(`${API_BASE}/requests/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ status })
    });
    if (!res.ok) throw new Error('Update failed');
    return res.json();
  },
  getNotifications: async () => {
    if (USE_MOCK_DATA) {
      await mockDelay();
      return [{ id: 1, text: 'Welcome to Get It!', time: 'Just now' }];
    }
    const res = await fetch(`${API_BASE}/notifications`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch notifications');
    return res.json();
  }
};

const CustomAlert = ({ isOpen, title, message, type, onClose, onConfirm }) => {
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
};

export default function Dashboard() {
  const navigate = useNavigate(); // THE FIX: Powers the instant, seamless navigation
  
  const [alertConfig, setAlertConfig] = useState({ isOpen: false, title: '', message: '', type: 'error', onConfirm: null });
  const showAlert = (title, message, type = 'error', onConfirm = null) => { setAlertConfig({ isOpen: true, title, message, type, onConfirm }); };

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoadingPage, setIsLoadingPage] = useState(true);

  const [listings, setListings] = useState([]);
  const [nearbyServices, setNearbyServices] = useState([]);
  const [matchingRequests, setMatchingRequests] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [myRequests, setMyRequests] = useState([]);

  const [editingListingId, setEditingListingId] = useState(null);
  const [editDraft, setEditDraft] = useState({ title: '', classification: '' });

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const user = await Api.getCurrentUser();
        setCurrentUser(user);

        if (user.role === 'buyer') {
          let userCoords = { lat: 6.5244, lng: 3.3792 };
          if (navigator.geolocation) {
            await new Promise((resolve) => {
              navigator.geolocation.getCurrentPosition(
                (pos) => { userCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude }; resolve(); },
                () => resolve(), { timeout: 5000 }
              );
            });
          }
          const [services, myReqs, notifs] = await Promise.all([
            Api.getNearbyServices(userCoords), Api.getMyRequests(), Api.getNotifications()
          ]);
          setNearbyServices(services || []); setMyRequests(myReqs || []); setNotifications(notifs || []);
        } else if (user.role === 'seller') {
          const [ownListings, matching, notifs] = await Promise.all([
            Api.getListings(), Api.getMatchingRequests(user.classifications || []), Api.getNotifications()
          ]);
          setListings(ownListings || []); setMatchingRequests(matching || []); setNotifications(notifs || []);
        } else if (user.role === 'courier') {
          const [jobs, notifs] = await Promise.all([Api.getDeliveries(), Api.getNotifications()]);
          setDeliveries(jobs || []); setNotifications(notifs || []);
        }
      } catch (error) {
        navigate('/'); // Redirects to Login
        return;
      } finally {
        setIsLoadingPage(false);
      }
    };
    loadDashboard();
  }, [navigate]);

  const handleLogout = () => {
    showAlert('Secure Log Out', 'Are you sure you want to log out of your account?', 'confirm', async () => {
      await Api.logout();
      navigate('/'); // Instantly routes back to login
    });
  };

  const handleStartEdit = (listing) => {
    setEditingListingId(listing.id);
    setEditDraft({ title: listing.title, classification: listing.classification });
  };

  const handleSaveEdit = async (id) => {
    try {
      const updated = await Api.updateListing(id, editDraft);
      setListings((prev) => prev.map((item) => (item.id === id ? updated : item)));
      setEditingListingId(null);
    } catch (error) {
      showAlert('Update Failed', 'Could not save changes. Please try again.', 'error');
    }
  };

  const handleCancelEdit = () => setEditingListingId(null);

  const handleDeleteListing = async (id) => {
    try {
      await Api.deleteListing(id);
      setListings((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      showAlert('Deletion Failed', 'Could not delete this listing. Please try again.', 'error');
    }
  };

  const handleSendRequest = async (service) => {
    if (myRequests.some((req) => req.listing_id === service.id)) return;
    try {
      const newRequest = await Api.sendRequest(service);
      setMyRequests((prev) => [...prev, newRequest]);
    } catch (error) {
      showAlert('Request Failed', 'Could not send your request. Please try again.', 'error');
    }
  };

  const handleEndRequest = async (id) => {
    try {
      await Api.endRequest(id);
      setMyRequests((prev) => prev.filter((req) => req.id !== id));
    } catch (error) {
      showAlert('Update Failed', 'Could not update this request. Please try again.', 'error');
    }
  };

  if (isLoadingPage || !currentUser) {
    return (
      <div className="layout-wrapper">
        <p style={{ color: '#94a3b8' }}>Loading your workspace...</p>
      </div>
    );
  }

  const firstName = currentUser.full_name ? currentUser.full_name.split(' ')[0] : 'there';
  const roleLabel = currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1);

  return (
    <div className="home-page-wrapper">
      <nav className="navbar">
        <div className="nav-logo">Get<span>it</span></div>
        <div className="nav-links">
          <button className="nav-icon-btn" title="Search" onClick={() => navigate('/search')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#94a3b8"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
          </button>
          <button className="nav-icon-btn" title="Messages" onClick={() => navigate('/messages')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#94a3b8"><path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/></svg>
          </button>
          <button className="nav-icon-btn" title="Notifications" onClick={() => navigate('/notifications')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#94a3b8"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg>
          </button>
          
          <div style={{ position: 'relative' }}>
            <div className="nav-avatar" style={{ cursor: 'pointer' }} onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
              {currentUser.google_picture
                ? <img src={currentUser.google_picture} alt={firstName} className="nav-avatar-img" />
                : <span>{firstName.charAt(0)}</span>}
            </div>
              
            {isDropdownOpen && (
              <div className="avatar-dropdown" style={{
                position: 'absolute', top: '50px', right: '0', 
                background: 'var(--card-deep-blue)', border: '1px solid var(--border-subtle)', 
                borderRadius: '12px', padding: '8px', minWidth: '160px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', zIndex: 1000
              }}>
                <div onClick={() => navigate('/profile')} style={{ padding: '10px 12px', color: 'var(--pure-white)', fontSize: '13px', borderRadius: '8px', marginBottom: '4px', cursor: 'pointer' }} className="dropdown-item">My Profile</div>
                <div onClick={() => navigate('/contact-us')} style={{ padding: '10px 12px', color: 'var(--pure-white)', fontSize: '13px', borderRadius: '8px', marginBottom: '4px', cursor: 'pointer' }} className="dropdown-item">Contact Us</div>
                <div onClick={handleLogout} style={{ padding: '10px 12px', color: '#f87171', fontSize: '13px', borderRadius: '8px', cursor: 'pointer' }} className="dropdown-item">Log Out</div>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="home-content">
        <div className="home-header">
          <div>
            <h1 className="home-greeting">Welcome back, {firstName}</h1>
            <p className="home-subgreeting">Here's what's happening near you today.</p>
          </div>
          <span className="role-badge">{roleLabel}</span>
        </div>

        <div className="stats-glass-panel">
          {currentUser.role === 'buyer' && (
            <>
              <div className="stat-item"><span className="stat-number">{myRequests.filter(r => r.status === 'active').length}</span><span className="stat-label">Active Requests</span></div>
              <div className="stat-item"><span className="stat-number">12</span><span className="stat-label">Completed Jobs</span></div>
              <div className="stat-item"><span className="stat-number">4.8</span><span className="stat-label">Avg. Rating Given</span></div>
            </>
          )}
          {currentUser.role === 'seller' && (
            <>
              <div className="stat-item"><span className="stat-number">{listings.filter(l => l.status === 'Active').length}</span><span className="stat-label">Active Listings</span></div>
              <div className="stat-item"><span className="stat-number">{listings.reduce((acc, curr) => acc + (parseInt(curr.views) || 0), 0)}</span><span className="stat-label">Total Views</span></div>
            </>
          )}
          {currentUser.role === 'courier' && (
            <>
              <div className="stat-item"><span className="stat-number">{deliveries.length}</span><span className="stat-label">Available Jobs</span></div>
              <div className="stat-item"><span className="stat-number">27</span><span className="stat-label">Deliveries Done</span></div>
              <div className="stat-item"><span className="stat-number">4.9</span><span className="stat-label">Courier Rating</span></div>
            </>
          )}
        </div>

        {currentUser.role === 'buyer' && (
          <>
            <div className="section-header">
              <h2 className="section-title">Nearby Services</h2>
              <button className="post-request-btn" onClick={() => navigate('/create-request')}>+ Post a Request</button>
            </div>
            <div className="service-grid">
              {nearbyServices.map((service) => (
                <div className="service-card" key={service.id}>
                  <h3 className="service-card-title">{service.title || service.classification}</h3>
                  <p className="service-card-provider">{service.providerName}</p>
                  <div className="service-card-meta">
                    <span className="service-rating">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="#eab308" style={{marginRight: '4px', verticalAlign: 'text-bottom'}}><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
                      {service.rating}
                    </span>
                    <span className="service-distance">{service.distance}</span>
                  </div>
                  <div className="service-card-footer">
                    <span className="service-price">{service.price}</span>
                    <button className="request-btn" disabled={myRequests.some((req) => req.listing_id === service.id)} onClick={() => handleSendRequest(service)}>
                      {myRequests.some((req) => req.listing_id === service.id) ? 'Requested' : 'Request'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {myRequests.length > 0 && (
              <>
                <div className="section-header">
                  <h2 className="section-title">My Requests</h2>
                </div>
                <div className="listing-list">
                  {myRequests.map((req) => (
                    <div className="listing-row" key={req.id}>
                      <div className="listing-row-main">
                        <h3 className="listing-title">{req.title}</h3>
                        <p className="listing-meta">{req.provider || 'Provider Pending'}</p>
                      </div>
                      <span className={`status-pill ${req.status === 'active' ? 'status-active' : 'status-waiting'}`}>{req.status === 'active' ? 'Active' : 'Waiting'}</span>
                      <button className="cancel-btn" onClick={() => handleEndRequest(req.id)}>Cancel</button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {currentUser.role === 'seller' && (
          <>
            <div className="section-header">
              <h2 className="section-title">Your Listings</h2>
              <button className="post-request-btn" onClick={() => navigate('/create-listing')}>+ Add Listing</button>
            </div>
            <div className="listing-list">
              {listings.map((listing) => (
                <div className="listing-row" key={listing.id}>
                  {editingListingId === listing.id ? (
                    <>
                      <div className="listing-row-main">
                        <input type="text" className="custom-input edit-input" value={editDraft.title} onChange={(e) => setEditDraft((prev) => ({ ...prev, title: e.target.value }))} />
                        <input type="text" list="classification-options" className="custom-input edit-input" placeholder="Search classification..." value={editDraft.classification} onChange={(e) => setEditDraft((prev) => ({ ...prev, classification: e.target.value }))} />
                        <datalist id="classification-options">{ALL_CLASSIFICATIONS.map((option) => (<option value={option} key={option} />))}</datalist>
                      </div>
                      <button className="request-btn" onClick={() => handleSaveEdit(listing.id)}>Save</button>
                      <button className="cancel-btn" onClick={handleCancelEdit}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <div className="listing-row-main">
                        <h3 className="listing-title">{listing.title}</h3>
                        <p className="listing-meta">{listing.classification} · {listing.views || 0} views</p>
                      </div>
                      <span className={`status-pill ${listing.status === 'Active' ? 'status-active' : 'status-paused'}`}>{listing.status}</span>
                      <span className="listing-price">{listing.price}</span>
                      <button className="edit-btn" onClick={() => handleStartEdit(listing)} title="Edit"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path></svg></button>
                      <button className="delete-btn" onClick={() => handleDeleteListing(listing.id)} title="Delete"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
                    </>
                  )}
                </div>
              ))}
            </div>
            <div className="section-header">
              <h2 className="section-title">Requests Matching Your Categories</h2>
            </div>
            <div className="listing-list">
              {matchingRequests.map((req) => (
                <div className="listing-row" key={req.id}>
                  <div className="listing-row-main">
                    <h3 className="listing-title">{req.title}</h3>
                    <p className="listing-meta">{req.classification} · Posted by {req.postedBy}</p>
                  </div>
                  <span className="listing-price">{req.budget}</span>
                  <button className="request-btn" onClick={() => navigate(`/messages?to=${encodeURIComponent(req.postedBy)}&about=${encodeURIComponent(req.title)}`)}>Offer to Help</button>
                </div>
              ))}
            </div>
          </>
        )}

        {currentUser.role === 'courier' && (
          <>
            <div className="section-header">
              <h2 className="section-title">Available Deliveries</h2>
            </div>
            <div className="listing-list">
              {deliveries.map((job) => (
                <div className="listing-row" key={job.id}>
                  <div className="listing-row-main">
                    <h3 className="listing-title">{job.pickup} → {job.dropoff}</h3>
                    <p className="listing-meta">{job.distance}</p>
                  </div>
                  <span className="status-pill status-active">{job.status}</span>
                  <span className="listing-price">{job.fee}</span>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="section-header">
          <h2 className="section-title">Recent Notifications</h2>
        </div>
        <div className="notification-list">
          {notifications.map((note) => (
            <div className="notification-row" key={note.id}>
              <p className="notification-text">{note.text}</p>
              <span className="notification-time">{note.time}</span>
            </div>
          ))}
        </div>

        <button onClick={handleLogout} className="logout-btn">Secure Log Out</button>
      </main>
      <CustomAlert {...alertConfig} onClose={() => setAlertConfig({ ...alertConfig, isOpen: false })} />
    </div>
  );
}