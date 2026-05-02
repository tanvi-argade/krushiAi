import React, { useState, useEffect } from 'react';
import axios from 'axios';

const App = () => {
  const [healthStatus, setHealthStatus] = useState('Checking backend...');
  const [activeTab, setActiveTab] = useState('Home');

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await axios.get('http://localhost:8000/');
        setHealthStatus(response.data.status);
      } catch (error) {
        setHealthStatus('Backend not reachable');
      }
    };
    checkHealth();
  }, []);

  const styles = {
    container: {
      fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
      margin: 0,
      padding: 0,
      backgroundColor: '#f4f7f6',
      minHeight: '100vh',
    },
    navbar: {
      backgroundColor: '#2e7d32',
      color: 'white',
      padding: '1rem 2rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    },
    navLinks: {
      display: 'flex',
      gap: '20px',
    },
    link: {
      color: 'white',
      textDecoration: 'none',
      cursor: 'pointer',
      fontWeight: '500',
    },
    content: {
      padding: '2rem',
      maxWidth: '1200px',
      margin: '0 auto',
    },
    card: {
      backgroundColor: 'white',
      padding: '2rem',
      borderRadius: '8px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
      textAlign: 'center',
    },
    status: {
      marginTop: '1rem',
      padding: '0.5rem 1rem',
      borderRadius: '20px',
      display: 'inline-block',
      backgroundColor: healthStatus === 'KrushiAI backend running' ? '#e8f5e9' : '#ffebee',
      color: healthStatus === 'KrushiAI backend running' ? '#2e7d32' : '#c62828',
      fontWeight: 'bold',
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'Crop Advisor':
        return <h2>Crop Advisory Module (Coming Soon)</h2>;
      case 'Pest Detection':
        return <h2>Pest Detection Module (Coming Soon)</h2>;
      case 'Market Predictor':
        return <h2>Market Price Predictor (Coming Soon)</h2>;
      case 'Irrigation':
        return <h2>Irrigation Scheduler (Coming Soon)</h2>;
      default:
        return (
          <div style={styles.card}>
            <h1>Welcome to KrushiAI</h1>
            <p>Your AI-powered farm advisory platform.</p>
            <div style={styles.status}>
              System Status: {healthStatus}
            </div>
          </div>
        );
    }
  };

  return (
    <div style={styles.container}>
      <nav style={styles.navbar}>
        <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }} onClick={() => setActiveTab('Home')}>
          KrushiAI
        </div>
        <div style={styles.navLinks}>
          <span style={styles.link} onClick={() => setActiveTab('Crop Advisor')}>Crop Advisor</span>
          <span style={styles.link} onClick={() => setActiveTab('Pest Detection')}>Pest Detection</span>
          <span style={styles.link} onClick={() => setActiveTab('Market Predictor')}>Market Predictor</span>
          <span style={styles.link} onClick={() => setActiveTab('Irrigation')}>Irrigation</span>
        </div>
      </nav>
      <main style={styles.content}>
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
