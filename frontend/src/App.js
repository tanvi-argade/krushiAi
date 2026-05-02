import React, { useState, useEffect } from 'react';
import axios from 'axios';

const App = () => {
  const [activeTab, setActiveTab] = useState('Home');
  const [healthStatus, setHealthStatus] = useState('Checking...');

  useEffect(() => {
    axios.get('http://localhost:8000/')
      .then(res => setHealthStatus(res.data.status))
      .catch(err => setHealthStatus('Backend Offline'));
  }, []);

  const styles = {
    container: { fontFamily: 'Segoe UI, sans-serif', minHeight: '100vh', backgroundColor: '#f8f9fa' },
    nav: { backgroundColor: '#2d5a27', padding: '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' },
    navLinks: { display: 'flex', gap: '20px' },
    navLink: (active) => ({ cursor: 'pointer', fontWeight: active ? 'bold' : 'normal', borderBottom: active ? '2px solid white' : 'none' }),
    content: { padding: '30px', maxWidth: '1000px', margin: '0 auto' },
    card: { backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' },
    button: { backgroundColor: '#2d5a27', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer', fontSize: '16px' },
    badge: (severity) => {
      const colors = { High: '#dc3545', Medium: '#ffc107', Low: '#28a745', None: '#6c757d', Unknown: '#6c757d' };
      return { padding: '5px 12px', borderRadius: '20px', backgroundColor: colors[severity] || '#6c757d', color: 'white', fontSize: '14px', fontWeight: 'bold' };
    }
  };

  return (
    <div style={styles.container}>
      <nav style={styles.nav}>
        <div style={{ fontSize: '24px', fontWeight: 'bold' }}>KrushiAI</div>
        <div style={styles.navLinks}>
          <span style={styles.navLink(activeTab === 'Home')} onClick={() => setActiveTab('Home')}>Home</span>
          <span style={styles.navLink(activeTab === 'Pest')} onClick={() => setActiveTab('Pest')}>Pest Detection</span>
          <span style={styles.navLink(activeTab === 'Crop')} onClick={() => setActiveTab('Crop')}>Crop Advisor</span>
        </div>
      </nav>

      <div style={styles.content}>
        {activeTab === 'Home' && (
          <div style={styles.card}>
            <h1>Welcome to KrushiAI</h1>
            <p>Advanced AI tools for smart farming.</p>
            <p>System Status: <span style={{ color: healthStatus.includes('running') ? 'green' : 'red' }}>{healthStatus}</span></p>
          </div>
        )}

        {activeTab === 'Pest' && <PestDetection styles={styles} />}
        {activeTab === 'Crop' && <div style={styles.card}><h2>Crop Advisory (Coming Soon)</h2></div>}
      </div>
    </div>
  );
};

const PestDetection = ({ styles }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [isHovered, setIsHovered] = useState(false);
  const fileInputRef = React.useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
      setResult(null);
      setError(null);
    }
  };

  const detectDisease = async () => {
    if (!selectedFile) return;
    setLoading(true);
    setError(null);
    
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await axios.post('http://localhost:8000/pest/detect', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error connecting to backend.');
    } finally {
      setLoading(false);
    }
  };

  const uploadAreaStyle = {
    width: '100%',
    height: '220px',
    border: '2px dashed #4caf50',
    borderRadius: '12px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: isHovered ? '#dcedc8' : '#f1f8e9',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
    margin: '20px 0',
    overflow: 'hidden'
  };

  return (
    <div style={styles.card}>
      <h2>Pest & Disease Detection</h2>
      <p>Upload a clear photo of the affected plant part (leaf, fruit, stem).</p>
      
      <div 
        style={uploadAreaStyle}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => fileInputRef.current.click()}
      >
        <input 
          type="file" 
          accept="image/*" 
          onChange={handleFileChange} 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
        />
        
        {!preview ? (
          <div style={{ textAlign: 'center', color: '#2d5a27' }}>
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>📁</div>
            <div style={{ fontWeight: 'bold' }}>Click anywhere here to choose a leaf image</div>
          </div>
        ) : (
          <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <img src={preview} alt="Preview" style={{ maxWidth: '100%', maxHeight: '180px', objectFit: 'contain' }} />
            <div style={{ fontSize: '12px', color: '#2d5a27', marginTop: '5px' }}>Click to change image</div>
          </div>
        )}
      </div>

      <button 
        style={{ ...styles.button, width: '100%', opacity: (!selectedFile || loading) ? 0.6 : 1, marginTop: '10px' }} 
        disabled={!selectedFile || loading}
        onClick={detectDisease}
      >
        {loading ? 'Analyzing...' : 'Detect Disease'}
      </button>

      {error && <div style={{ color: 'red', marginTop: '20px', padding: '10px', backgroundColor: '#fee', borderRadius: '5px' }}>{error}</div>}

      {result && (
        <div style={{ marginTop: '30px', padding: '20px', border: '1px solid #eee', borderRadius: '8px', backgroundColor: '#fdfdfd' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0 }}>Result: {result.disease}</h3>
            <span style={styles.badge(result.severity)}>{result.severity} Severity</span>
          </div>
          <p><strong>Confidence:</strong> {(result.confidence * 100).toFixed(2)}%</p>
          <hr />
          <p><strong>Treatment:</strong> {result.treatment}</p>
          <p><strong>Prevention:</strong> {result.prevention}</p>
          <p style={{ fontSize: '12px', color: '#888' }}>Model Label: {result.raw_label}</p>
        </div>
      )}
    </div>
  );
};

export default App;
