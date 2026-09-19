import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Api, GOOGLE_CLIENT_ID, PROVIDER_CLASSIFICATIONS, TRADER_CLASSIFICATIONS } from '../services/api';
import CustomAlert from '../components/CustomAlert';

export default function Login() {
  const navigate = useNavigate();
  
  const [alertConfig, setAlertConfig] = useState({ isOpen: false, title: '', message: '', type: 'error', onConfirm: null });
  const showAlert = (title, message, type = 'error', onConfirm = null) => { setAlertConfig({ isOpen: true, title, message, type, onConfirm }); };

  const [selectedRole, setSelectedRole] = useState('buyer');
  const [authStage, setAuthStage] = useState('login'); 
  const [googlePayload, setGooglePayload] = useState(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [providerType, setProviderType] = useState('');
  const [classificationSearch, setClassificationSearch] = useState('');

  const [formData, setFormData] = useState({ username: '', fullName: '', phone: '', dob: '', nationality: '', stateOfOrigin: '', classifications: [], idType: '' });

  const processGoogleAuth = async (idToken) => {
    setIsAuthenticating(true);
    try {
      const data = await Api.verifyGoogleAuth(idToken, selectedRole);
      if (!data.isNewUser) {
        navigate('/home'); 
      } else {
        setGooglePayload(data.googlePayload);
        setFormData((prev) => ({ ...prev, fullName: data.googlePayload.name || '' }));
        setAuthStage('onboarding');
      }
    } catch (error) {
      showAlert('Authentication Error', 'Server failed to verify Google login. Please try again.', 'error');
    } finally {
      setIsAuthenticating(false);
    }
  };

  useEffect(() => {
    if (authStage !== 'login') return;
    const initGoogleButton = () => {
      if (window.google && window.google.accounts && window.google.accounts.id) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          use_fedcm: false,
          callback: (response) => {
            if (response.credential) processGoogleAuth(response.credential);
          }
        });
        const container = document.getElementById('google-btn-container');
        if (container) {
          container.innerHTML = '';
          window.google.accounts.id.renderButton(container, { theme: 'outline', size: 'large', width: 280, text: 'continue_with', shape: 'pill' });
        }
      }
    };
    initGoogleButton();
    const interval = setInterval(() => {
      if (window.google && window.google.accounts && window.google.accounts.id) {
        initGoogleButton();
        clearInterval(interval);
      }
    }, 300);
    return () => clearInterval(interval);
  }, [selectedRole, authStage]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleClassificationToggle = (option) => {
    setFormData((prevData) => {
      const alreadySelected = prevData.classifications.includes(option);
      return {
        ...prevData,
        classifications: alreadySelected ? prevData.classifications.filter((item) => item !== option) : [...prevData.classifications, option]
      };
    });
  };

  const handleOnboardingSubmit = async (e) => {
    e.preventDefault();
    setIsAuthenticating(true);
    const userRecord = {
      ...formData,
      role: selectedRole,
      providerType: selectedRole === 'seller' ? providerType : '',
      email: googlePayload ? googlePayload.email : '',
      googleId: googlePayload ? googlePayload.googleId : '',
      googlePicture: googlePayload ? googlePayload.picture : ''
    };
    try {
      await Api.registerUser(userRecord);
      navigate('/home');
    } catch (error) {
      showAlert('Profile Error', error.message || "We couldn't save your profile. Please check your inputs.", 'error');
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="layout-wrapper">
      <div className="auth-card">
        {authStage === 'login' ? (
          <>
            <div className="card-header">
              <div className="hexagon-logo">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                  <line x1="12" y1="22.08" x2="12" y2="12"></line>
                </svg>
              </div>
              <h1 className="brand-title">Get<span>it</span></h1>
              <p className="brand-subtitle">Urban Logistics & Services.</p>
            </div>
            <div className="role-container">
              <span className="role-prompt">Select your account type</span>
              <div className="role-toggle-group">
                <button className={`toggle-btn ${selectedRole === 'buyer' ? 'active-orange' : ''}`} onClick={() => setSelectedRole('buyer')}>Buyer</button>
                <button className={`toggle-btn ${selectedRole === 'seller' ? 'active-orange' : ''}`} onClick={() => setSelectedRole('seller')}>Seller</button>
                <button className={`toggle-btn ${selectedRole === 'courier' ? 'active-orange' : ''}`} onClick={() => setSelectedRole('courier')}>Courier</button>
              </div>
            </div>
            <div className="auth-form" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '20px 0' }}>
              <div id="google-btn-container"></div>
              {isAuthenticating && <p style={{ color: '#94a3b8', marginTop: '8px', fontSize: '13px' }}>Verifying account...</p>}
            </div>
            <div className="card-footer">
               <p>By continuing, you agree to our <br/> <strong>Terms of Service</strong> & <strong>Privacy Policy</strong>.</p>
            </div>
          </>
        ) : (
          <>
            <div className="card-header">
              <h1 className="brand-title">Complete <span>Profile</span></h1>
              <p className="brand-subtitle">
                {googlePayload ? `Welcome, ${googlePayload.name.split(' ')[0]}! Let's set up your ${selectedRole} account.` : `Let's set up your ${selectedRole} account.`}
              </p>
            </div>
            <form onSubmit={handleOnboardingSubmit} className="onboarding-form">
              <div className="input-group">
                <label>Username</label>
                <input type="text" name="username" required placeholder="Choose a unique username" className="custom-input" value={formData.username} onChange={handleInputChange} />
              </div>
              <div className="input-group">
                <label>Full Name</label>
                <input type="text" name="fullName" required placeholder="e.g., Jane Doe" className="custom-input" value={formData.fullName} onChange={handleInputChange} />
              </div>
              <div className="input-group">
                <label>Phone Number</label>
                <input type="tel" name="phone" required placeholder="+234..." className="custom-input" value={formData.phone} onChange={handleInputChange} />
              </div>
              <div className="input-group">
                <label>Date of Birth</label>
                <input type="date" name="dob" required className="custom-input" value={formData.dob} onChange={handleInputChange} />
              </div>
              <div className="input-group">
                <label>Nationality</label>
                <select name="nationality" required className="custom-input" value={formData.nationality} onChange={handleInputChange}>
                  <option value="">Select Nationality...</option>
                  <option value="nigerian">Nigerian</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="input-group">
                <label>State of Origin (Optional)</label>
                <input type="text" name="stateOfOrigin" placeholder="e.g., Lagos, Ogun" className="custom-input" value={formData.stateOfOrigin} onChange={handleInputChange} />
              </div>

              {selectedRole === 'seller' && (
                <>
                  <div className="input-group">
                    <label>What best describes you?</label>
                    <div className="role-toggle-group" style={{ marginTop: '4px' }}>
                      <button type="button" className={`toggle-btn ${providerType === 'provider' ? 'active-orange' : ''}`} onClick={() => setProviderType('provider')}>Service Provider</button>
                      <button type="button" className={`toggle-btn ${providerType === 'trader' ? 'active-orange' : ''}`} onClick={() => setProviderType('trader')}>Trader</button>
                    </div>
                  </div>
                  {providerType && (
                    <div className="input-group">
                      <label>Select all {providerType === 'provider' ? 'skills' : 'goods categories'} that apply</label>
                      <input type="text" className="custom-input classification-search" placeholder="Search categories..." value={classificationSearch} onChange={(e) => setClassificationSearch(e.target.value)} />
                      <div className="classification-grid">
                        {(providerType === 'provider' ? PROVIDER_CLASSIFICATIONS : TRADER_CLASSIFICATIONS)
                          .filter((option) => option.toLowerCase().includes(classificationSearch.toLowerCase()))
                          .map((option) => (
                            <label className="classification-chip" key={option}>
                              <input type="checkbox" checked={formData.classifications.includes(option)} onChange={() => handleClassificationToggle(option)} />
                              <span>{option}</span>
                            </label>
                          ))}
                      </div>
                    </div>
                  )}
                </>
              )}
              {selectedRole === 'courier' && (
                <div className="input-group">
                  <label>Primary Means of Identification</label>
                  <select name="idType" required className="custom-input" value={formData.idType} onChange={handleInputChange}>
                    <option value="">Select ID Type...</option>
                    <option value="nin">NIN</option>
                    <option value="drivers_license">Driver's License</option>
                    <option value="voters_card">Voter's Card</option>
                  </select>
                </div>
              )}
              <button type="submit" className="google-sso-btn continue-btn" disabled={isAuthenticating}>
                <span className="primary-text" style={{ color: 'white', textAlign: 'center', width: '100%' }}>
                  {isAuthenticating ? 'Saving...' : 'Complete Profile'}
                </span>
              </button>
            </form>
          </>
        )}
      </div>
      <CustomAlert {...alertConfig} onClose={() => setAlertConfig({ ...alertConfig, isOpen: false })} />
    </div>
  );
}