import React, { useState, useEffect, createContext, useContext } from 'react';
import axios from 'axios';
import { ThemeProvider } from './theme/ThemeContext';
import Layout from './components/layout/Layout';

// Modules
import Dashboard from './modules/Dashboard';
import Crop from './modules/Crop';
import Pest from './modules/Pest';
import Irrigation from './modules/Irrigation';
import Market from './modules/Market';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const FarmerContext = createContext();

export const useFarmer = () => useContext(FarmerContext);

const AppContent = () => {
  const [activeTab, setActiveTab] = useState('Home');
  const { profile, setProfile } = useFarmer();
  
  const [cropData, setCropData] = useState({ loading: false, data: null, error: null });
  const [irrigationData, setIrrigationData] = useState({ loading: false, data: null, error: null });
  const [marketData, setMarketData] = useState({ loading: false, data: null, error: null });

  const fetchSummaries = async (prof) => {
    if (!prof) return;

    // Crop Recommendation
    setCropData(prev => ({ ...prev, loading: true, error: null }));
    axios.post(`${API_BASE}/crop/recommend`, {
      soil_type: prof.soilType || 'Loamy', 
      location: prof.location, 
      land_size: Number(prof.landSize) || 1.0, 
      water_availability: 'Medium', 
      season: 'Kharif'
    }).then(res => setCropData({ loading: false, data: res.data, error: null }))
      .catch(err => setCropData({ loading: false, data: null, error: err.response?.data?.detail || err.message }));

    // Irrigation Schedule
    setIrrigationData(prev => ({ ...prev, loading: true, error: null }));
    axios.post(`${API_BASE}/irrigation/schedule`, {
      crop: prof.crop || 'Rice', 
      location: prof.location, 
      sowing_date: prof.sowingDate || new Date().toISOString().split('T')[0], 
      soil_type: prof.soilType || 'Loamy', 
      land_size_acres: Number(prof.landSize) || 1.0
    }).then(res => {
      if (res.data.success) {
        setIrrigationData({ loading: false, data: res.data.data, error: null });
      } else {
        setIrrigationData({ loading: false, data: null, error: res.data.error?.message });
      }
    }).catch(err => setIrrigationData({ loading: false, data: null, error: err.response?.data?.error?.message || err.message }));

    // Market Prediction
    setMarketData(prev => ({ ...prev, loading: true, error: null }));
    const harvestDate = new Date(prof.sowingDate || new Date());
    harvestDate.setDate(harvestDate.getDate() + 90);
    const harvestStr = harvestDate.toISOString().split('T')[0];
    axios.post(`${API_BASE}/market/predict`, {
      crop: prof.crop || 'Wheat', 
      state: prof.location, 
      harvest_date: harvestStr
    }).then(res => setMarketData({ loading: false, data: res.data, error: null }))
      .catch(err => setMarketData({ loading: false, data: null, error: err.response?.data?.detail || err.message }));
  };

  useEffect(() => {
    if (profile) {
      fetchSummaries(profile);
    }
  }, [profile]);

  const renderContent = () => {
    switch (activeTab) {
      case 'Home':
        return (
          <Dashboard 
            profile={profile} 
            setProfile={setProfile} 
            navigateTo={setActiveTab}
            fetchSummaries={fetchSummaries}
            cropData={cropData}
            irrigationData={irrigationData}
            marketData={marketData}
          />
        );
      case 'Crop':
        return <Crop profile={profile} />;
      case 'Pest':
        return <Pest />;
      case 'Water':
        return <Irrigation profile={profile} />;
      case 'Market':
        return <Market profile={profile} />;
      default:
        return <Dashboard profile={profile} setProfile={setProfile} navigateTo={setActiveTab} />;
    }
  };

  return (
    <Layout activeTab={activeTab} onNavigate={setActiveTab}>
      {renderContent()}
    </Layout>
  );
};

const App = () => {
  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem('krushi-profile');
    return saved ? JSON.parse(saved) : null;
  });

  const handleSetProfile = (newProfile) => {
    setProfile(newProfile);
    localStorage.setItem('krushi-profile', JSON.stringify(newProfile));
  };

  return (
    <ThemeProvider>
      <FarmerContext.Provider value={{ profile, setProfile: handleSetProfile }}>
        <AppContent />
      </FarmerContext.Provider>
    </ThemeProvider>
  );
};

export default App;
