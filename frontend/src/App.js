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
        {activeTab === 'Crop' && <CropAdvisor styles={styles} />}
      </div>
    </div>
  );
};

const CropAdvisor = ({ styles }) => {
  const [formData, setFormData] = useState({
    soil_type: '',
    location: '',
    land_size: 2.5,
    water_availability: 'Medium',
    season: 'Kharif',
    N: '', P: '', K: '', temperature: '', humidity: '', ph: '', rainfall: ''
  });
  const [showSoilTest, setShowSoilTest] = useState(false);
  const [soils, setSoils] = useState([]);
  const [states, setStates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [soilRes, stateRes] = await Promise.all([
          axios.get('http://localhost:8000/crop/soils'),
          axios.get('http://localhost:8000/crop/states')
        ]);
        setSoils(soilRes.data);
        setStates(stateRes.data);
        if (soilRes.data.length > 0) setFormData(prev => ({ ...prev, soil_type: soilRes.data[0] }));
        if (stateRes.data.length > 0) setFormData(prev => ({ ...prev, location: stateRes.data[0] }));
      } catch (err) {
        console.error("Error fetching metadata", err);
      }
    };
    fetchMetadata();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    // Prepare payload
    const payload = { ...formData };
    if (!showSoilTest) {
      ['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall'].forEach(k => delete payload[k]);
    } else {
      // Convert to numbers
      ['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall'].forEach(k => {
        if (payload[k] !== '') payload[k] = parseFloat(payload[k]);
        else delete payload[k];
      });
    }

    try {
      const response = await axios.post('http://localhost:8000/crop/recommend', payload);
      setResults(response.data);
    } catch (err) {
      setError("Failed to get recommendations. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatINR = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const localStyles = {
    formGroup: { marginBottom: '15px', display: 'flex', flexDirection: 'column', gap: '5px' },
    label: { fontWeight: '600', color: '#444', fontSize: '14px' },
    select: { padding: '10px', borderRadius: '5px', border: '1px solid #ddd', fontSize: '16px', backgroundColor: 'white' },
    input: { padding: '10px', borderRadius: '5px', border: '1px solid #ddd', fontSize: '16px' },
    resultsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginTop: '30px' },
    rankBadge: (rank) => {
      const colors = { 1: '#ffd700', 2: '#c0c0c0', 3: '#cd7f32' };
      return {
        display: 'inline-block',
        padding: '2px 10px',
        borderRadius: '4px',
        backgroundColor: colors[rank],
        color: 'white',
        fontWeight: 'bold',
        fontSize: '12px',
        marginBottom: '10px'
      };
    },
    mlBadge: (isMl) => ({
      padding: '3px 8px',
      borderRadius: '4px',
      fontSize: '10px',
      fontWeight: 'bold',
      textTransform: 'uppercase',
      backgroundColor: isMl ? '#e3f2fd' : '#f5f5f5',
      color: isMl ? '#1976d2' : '#757575',
      marginLeft: '10px'
    })
  };

  return (
    <div style={styles.card}>
      <h2 style={{ color: '#2d5a27', marginBottom: '10px' }}>AI Crop Advisor</h2>
      <p style={{ marginBottom: '25px', color: '#666' }}>Get personalized crop recommendations based on your soil and location.</p>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
          <div style={localStyles.formGroup}>
            <label style={localStyles.label}>Soil Type</label>
            <select style={localStyles.select} value={formData.soil_type} onChange={(e) => setFormData({...formData, soil_type: e.target.value})}>
              {soils.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div style={localStyles.formGroup}>
            <label style={localStyles.label}>State / Location</label>
            <select style={localStyles.select} value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})}>
              {states.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div style={localStyles.formGroup}>
            <label style={localStyles.label}>Land Size (Acres)</label>
            <input type="number" step="0.5" min="0.5" max="100" style={localStyles.input} value={formData.land_size} onChange={(e) => setFormData({...formData, land_size: parseFloat(e.target.value)})} />
          </div>
          <div style={localStyles.formGroup}>
            <label style={localStyles.label}>Water Availability</label>
            <select style={localStyles.select} value={formData.water_availability} onChange={(e) => setFormData({...formData, water_availability: e.target.value})}>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>
          <div style={localStyles.formGroup}>
            <label style={localStyles.label}>Season</label>
            <select style={localStyles.select} value={formData.season} onChange={(e) => setFormData({...formData, season: e.target.value})}>
              <option value="Kharif">Kharif</option>
              <option value="Rabi">Rabi</option>
              <option value="Both">Both</option>
            </select>
          </div>
        </div>

        <div style={{ padding: '15px', backgroundColor: '#f1f8e9', borderRadius: '8px', marginBottom: '20px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: 'bold', color: '#2d5a27' }}>
            <input type="checkbox" checked={showSoilTest} onChange={(e) => setShowSoilTest(e.target.checked)} />
            Have soil test report? (Advanced Prediction)
          </label>
          
          {showSoilTest && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginTop: '15px' }}>
              <div style={localStyles.formGroup}>
                <label style={localStyles.label}>Nitrogen (N)</label>
                <input type="number" placeholder="0-140" style={localStyles.input} value={formData.N} onChange={(e) => setFormData({...formData, N: e.target.value})} />
              </div>
              <div style={localStyles.formGroup}>
                <label style={localStyles.label}>Phosphorus (P)</label>
                <input type="number" placeholder="0-145" style={localStyles.input} value={formData.P} onChange={(e) => setFormData({...formData, P: e.target.value})} />
              </div>
              <div style={localStyles.formGroup}>
                <label style={localStyles.label}>Potassium (K)</label>
                <input type="number" placeholder="0-220" style={localStyles.input} value={formData.K} onChange={(e) => setFormData({...formData, K: e.target.value})} />
              </div>
              <div style={localStyles.formGroup}>
                <label style={localStyles.label}>Temp (°C)</label>
                <input type="number" placeholder="0-45" style={localStyles.input} value={formData.temperature} onChange={(e) => setFormData({...formData, temperature: e.target.value})} />
              </div>
              <div style={localStyles.formGroup}>
                <label style={localStyles.label}>Humidity (%)</label>
                <input type="number" placeholder="0-100" style={localStyles.input} value={formData.humidity} onChange={(e) => setFormData({...formData, humidity: e.target.value})} />
              </div>
              <div style={localStyles.formGroup}>
                <label style={localStyles.label}>Soil pH</label>
                <input type="number" step="0.1" placeholder="0-14" style={localStyles.input} value={formData.ph} onChange={(e) => setFormData({...formData, ph: e.target.value})} />
              </div>
              <div style={localStyles.formGroup}>
                <label style={localStyles.label}>Rainfall (mm)</label>
                <input type="number" placeholder="0-300" style={localStyles.input} value={formData.rainfall} onChange={(e) => setFormData({...formData, rainfall: e.target.value})} />
              </div>
            </div>
          )}
        </div>

        <button type="submit" style={{ ...styles.button, width: '100%' }} disabled={loading}>
          {loading ? 'Analyzing Soil & Finding Best Crops...' : 'Get Personalized Recommendation'}
        </button>
      </form>

      {error && <div style={{ color: 'red', marginTop: '20px', textAlign: 'center' }}>{error}</div>}

      {results && (
        <div style={localStyles.resultsGrid}>
          {results.recommendations.map((rec) => (
            <div key={rec.rank} style={{ ...styles.card, border: '1px solid #eee', position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={localStyles.rankBadge(rec.rank)}>
                  {rec.rank === 1 ? '🥇 1st' : rec.rank === 2 ? '🥈 2nd' : '🥉 3rd'}
                </div>
                <span style={localStyles.mlBadge(rec.ml_used)}>
                  {rec.ml_used ? 'AI Recommended' : 'Rule Based'}
                </span>
              </div>
              
              <h3 style={{ margin: '0 0 5px 0', fontSize: '22px', color: '#2d5a27' }}>{rec.crop}</h3>
              {rec.ml_used && (
                <div style={{ fontSize: '12px', color: '#1976d2', fontWeight: 'bold', marginBottom: '10px' }}>
                  Confidence: {(rec.confidence * 100).toFixed(1)}%
                </div>
              )}
              
              <div style={{ display: 'flex', gap: '10px', fontSize: '13px', color: '#666', marginBottom: '15px' }}>
                <span>📅 {rec.season}</span>
                <span>⏱️ {rec.duration_days} days</span>
              </div>
              
              <div style={{ marginBottom: '15px' }}>
                <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase' }}>Profit for {results.land_size} Acres</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#28a745' }}>{formatINR(rec.total_profit_for_land)}</div>
              </div>

              <div style={{ fontSize: '13px', color: '#555', backgroundColor: '#f9f9f9', padding: '10px', borderRadius: '5px', marginBottom: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                  <span>Input Cost:</span>
                  <span>{formatINR(rec.input_cost_per_acre)}/ac</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '600' }}>
                  <span>Revenue:</span>
                  <span>{formatINR(rec.total_revenue_per_acre)}/ac</span>
                </div>
              </div>

              <p style={{ fontSize: '13px', lineHeight: '1.4', margin: '0 0 10px 0', color: '#444' }}>{rec.description}</p>
              <div style={{ fontSize: '11px', fontStyle: 'italic', color: '#888' }}>{rec.match_reason}</div>
            </div>
          ))}
        </div>
      )}
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
