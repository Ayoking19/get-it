// src/services/api.js

export const USE_MOCK_DATA = false;
export const API_BASE = 'https://ayomikun.alwaysdata.net/api';
export const GOOGLE_CLIENT_ID = '230604988868-b2tsvfvqbp79u06aj8oe01o45d4ftood.apps.googleusercontent.com';

export const mockDelay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

export const ALL_CLASSIFICATIONS = [
  'Furniture', 'Mechanical Engineering', 'Electrical Engineering', 'Cook', 'Plumbing',
  'Entertainment', 'Electronic Devices', 'Health Expert', 'Gym', 'Graphic Design',
  'Web Development', 'Photography', 'Tutoring', 'Event Planning', 'Beauty & Salon',
  'Auto Repair', 'Tailoring', 'Cleaning Services', 'Painting', 'Food', 'Clothing',
  'Electronics', 'Cars', 'Houses', 'Watches', 'Cooking Utensils', 'Transport',
  'Books', 'Jewelry', 'Sports Equipment', 'Beauty Products', 'Toys', 'Appliances'
].sort();

export const PROVIDER_CLASSIFICATIONS = [
  'Furniture', 'Mechanical Engineering', 'Electrical Engineering', 'Cook', 'Plumbing',
  'Entertainment', 'Electronic Devices', 'Health Expert', 'Gym', 'Graphic Design',
  'Web Development', 'Photography', 'Tutoring', 'Event Planning', 'Beauty & Salon',
  'Auto Repair', 'Tailoring', 'Cleaning Services', 'Painting'
].sort();

export const TRADER_CLASSIFICATIONS = [
  'Food', 'Clothing', 'Electronics', 'Cars', 'Houses', 'Watches', 'Cooking Utensils',
  'Furniture', 'Transport', 'Books', 'Jewelry', 'Appliances', 'Sports Equipment',
  'Beauty Products', 'Toys'
].sort();

export const Api = {
  verifyGoogleAuth: async (credential, role) => {
    if (USE_MOCK_DATA) {
      try {
        const base64Url = credential.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => 
          '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
        ).join(''));
        const payload = JSON.parse(jsonPayload);
        return { isNewUser: true, googlePayload: { googleId: payload.sub, email: payload.email, name: payload.name, picture: payload.picture } };
      } catch (e) {
        return { isNewUser: true, googlePayload: { googleId: '123', email: 'test@gmail.com', name: 'User Test', picture: '' } };
      }
    }
    const res = await fetch(`${API_BASE}/auth/google`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ credential, role })
    });
    if (!res.ok) throw new Error('Authentication failed server-side');
    return res.json();
  },
  registerUser: async (userRecord) => {
    if (USE_MOCK_DATA) {
      localStorage.setItem('currentUser', JSON.stringify(userRecord));
      return userRecord;
    }
    const res = await fetch(`${API_BASE}/users`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(userRecord)
    });
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.message || 'Registration failed');
    }
    return res.json();
  },
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