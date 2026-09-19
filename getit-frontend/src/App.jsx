import { Routes, Route } from 'react-router-dom';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import ContactUs from './pages/ContactUs';
import CreateListing from './pages/CreateListing';
import CreateRequest from './pages/CreateRequest';
import Messages from './pages/Messages';
import Notifications from './pages/Notifications';
import Search from './pages/Search';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/home" element={<Dashboard />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/contact-us" element={<ContactUs />} />
      <Route path="/create-listing" element={<CreateListing />} />
      <Route path="/create-request" element={<CreateRequest />} />
      <Route path="/messages" element={<Messages />} />
      <Route path="/notifications" element={<Notifications />} />
      <Route path="/search" element={<Search />} />
    </Routes>
  );
}

export default App;