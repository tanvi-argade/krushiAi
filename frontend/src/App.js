import React, { useState, useEffect, useContext, useRef, createContext } from 'react';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const FarmerContext = createContext();

const COLORS = {
  primary: '#1D9E75',
  lightGreen: '#E1F5EE',
  darkGreen: '#085041',
  amber: '#EF9F27',
  lightAmber: '#FAEEDA',
  red: '#E24B4A',
  lightRed: '#FCEBEB',
  blue: '#378ADD',
  lightBlue: '#E6F1FB',
  gray: '#888780',
  lightGray: '#F1EFE8',
  border: '#e0e0e0',
  borderGreen: '#c8e6c9',
};
const SHADOW = '0 1px 3px rgba(0,0,0,0.08)';
const RADIUS = '8px';
const CARD_RADIUS = '12px';

const GlobalStyles = () => (
  <style>{`
    * { box-sizing: border-box; }
    body { margin: 0; padding: 0; font-family: 'Segoe UI', system-ui, sans-serif; background-color: ${COLORS.lightGray}; color: #333; line-height: 1.6; }
    h1, h2, h3, h4, h5, h6 { margin: 0; font-weight: 500; }
    
    .nav-links { display: flex; gap: 8px; }
    .nav-link { transition: all 0.2s; padding: 6px 16px; border-radius: 20px; font-size: 14px; cursor: pointer; text-decoration: none; color: white; display: flex; align-items: center; gap: 6px; }
    .nav-link:hover:not(.active) { background-color: rgba(255,255,255,0.15); }
    .nav-link.active { background-color: white; color: ${COLORS.darkGreen}; font-weight: bold; }
    
    .page-transition { animation: fadeIn 0.2s ease-in-out; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
    .grid-4 { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 16px; }
    @media (max-width: 600px) {
      .grid-2, .grid-3, .grid-4 { grid-template-columns: 1fr !important; }
      .nav-links { overflow-x: auto; white-space: nowrap; padding-bottom: 5px; }
    }
    
    .btn { background-color: ${COLORS.primary}; color: white; border: none; padding: 10px 16px; border-radius: ${RADIUS}; cursor: pointer; font-size: 14px; font-weight: 500; transition: opacity 0.2s; display: inline-flex; align-items: center; justify-content: center; }
    .btn:hover:not(:disabled) { opacity: 0.9; }
    .btn:disabled { opacity: 0.6; cursor: not-allowed; }
    
    .btn-quick { background: transparent; border: 1px solid ${COLORS.primary}; color: ${COLORS.primary}; padding: 8px; border-radius: ${RADIUS}; font-size: 12px; font-weight: 500; cursor: pointer; text-align: center; transition: background 0.2s; }
    .btn-quick:hover { background: ${COLORS.lightGreen}; }
    
    .input-field { width: 100%; padding: 8px 12px; border: 1px solid ${COLORS.border}; border-radius: ${RADIUS}; font-family: inherit; font-size: 14px; background: white; }
    .input-field:focus { outline: none; border-color: ${COLORS.primary}; }
    .input-error { border-color: ${COLORS.red} !important; }

    .upload-box { transition: background-color 0.2s; }
    .upload-box:hover { background-color: ${COLORS.lightGreen}; }
    
    .spinner {
      border: 2px solid rgba(255,255,255,0.3);
      border-radius: 50%;
      border-top: 2px solid white;
      width: 16px;
      height: 16px;
      animation: spin 1s linear infinite;
      display: inline-block;
      vertical-align: middle;
      margin-right: 8px;
    }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

    .skeleton {
      background: #e0e0e0;
      background: linear-gradient(90deg, #e0e0e0 25%, #f0f0f0 50%, #e0e0e0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 4px;
    }
    @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

    .card { background: white; border-radius: ${CARD_RADIUS}; padding: 24px; box-shadow: ${SHADOW}; border: 1px solid ${COLORS.border}; }
  `}</style>
);

const EmptyState = ({ message }) => (
  <div style={{ textAlign: 'center', padding: '48px 24px', color: COLORS.gray }}>
    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🌾</div>
    <div style={{ fontSize: '16px' }}>{message || "Enter your farm details to get personalized advice"}</div>
  </div>
);

const Dashboard = ({ navigateTo }) => {
  const { profile, setProfile } = useContext(FarmerContext);
  const [isEditing, setIsEditing] = useState(!profile);
  const [form, setForm] = useState(profile || {
    name: '', location: '', crop: '', soilType: 'Loamy', landSize: '', sowingDate: ''
  });
  const [errors, setErrors] = useState({});

  const [cropData, setCropData] = useState({ loading: false, data: null, error: null });
  const [irrigationData, setIrrigationData] = useState({ loading: false, data: null, error: null });
  const [marketData, setMarketData] = useState({ loading: false, data: null, error: null });

  const validate = () => {
    let errs = {};
    if (!form.name) errs.name = true;
    if (!form.location) errs.location = true;
    if (!form.crop) errs.crop = true;
    if (!form.landSize) errs.landSize = true;
    if (!form.sowingDate) errs.sowingDate = true;
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (validate()) {
      setProfile(form);
      setIsEditing(false);
    }
  };

  useEffect(() => {
    if (profile && !isEditing) {
      fetchSummaries(profile);
    }
  }, [profile, isEditing]);

  const fetchSummaries = async (prof) => {
    setCropData({ loading: true, data: null, error: null });
    axios.post(`${API_BASE}/crop/recommend`, {
      soil_type: prof.soilType, location: prof.location, land_size: Number(prof.landSize), water_availability: 'Medium', season: 'Kharif'
    }).then(res => setCropData({ loading: false, data: res.data, error: null }))
      .catch(err => setCropData({ loading: false, data: null, error: err.response?.data?.detail || err.message }));

    setIrrigationData({ loading: true, data: null, error: null });
    axios.post(`${API_BASE}/irrigation/schedule`, {
      crop: prof.crop, location: prof.location, sowing_date: prof.sowingDate, soil_type: prof.soilType, land_size_acres: Number(prof.landSize)
    }).then(res => {
      setIrrigationData({ loading: false, data: res.data, error: null });
    }).catch(err => setIrrigationData({ loading: false, data: null, error: err.response?.data?.error?.message || err.message }));

    setMarketData({ loading: true, data: null, error: null });
    const harvestDate = new Date(prof.sowingDate);
    harvestDate.setDate(harvestDate.getDate() + 90);
    const harvestStr = harvestDate.toISOString().split('T')[0];
    axios.post(`${API_BASE}/market/predict`, {
      crop: prof.crop, state: prof.location, harvest_date: harvestStr
    }).then(res => setMarketData({ loading: false, data: res.data, error: null }))
      .catch(err => setMarketData({ loading: false, data: null, error: err.response?.data?.detail || err.message }));
  };

  return (
    <div className="page-transition">
      <div className="card" style={{ borderLeft: `4px solid ${COLORS.primary}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '18px', color: COLORS.darkGreen }}>Your Farm Profile</h2>
          {profile && !isEditing && (
            <button onClick={() => setIsEditing(true)} style={{ background: 'none', border: 'none', color: COLORS.primary, cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>Edit</button>
          )}
        </div>
        {isEditing ? (
          <div>
            <div className="grid-3" style={{ marginBottom: '16px' }}>
              <div><label style={{ fontSize: '12px', color: COLORS.gray }}>Your name</label><input className={`input-field ${errors.name ? 'input-error' : ''}`} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Name" /></div>
              <div><label style={{ fontSize: '12px', color: COLORS.gray }}>Location / nearest city</label><input className={`input-field ${errors.location ? 'input-error' : ''}`} value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Location" /></div>
              <div><label style={{ fontSize: '12px', color: COLORS.gray }}>Main crop</label><input className={`input-field ${errors.crop ? 'input-error' : ''}`} value={form.crop} onChange={e => setForm({ ...form, crop: e.target.value })} placeholder="e.g. Wheat" /></div>
              <div>
                <label style={{ fontSize: '12px', color: COLORS.gray }}>Soil type</label>
                <select className="input-field" value={form.soilType} onChange={e => setForm({ ...form, soilType: e.target.value })}>
                  <option>Sandy</option><option>Loamy</option><option>Clay</option><option>Black</option><option>Red</option><option>Alluvial</option>
                </select>
              </div>
              <div><label style={{ fontSize: '12px', color: COLORS.gray }}>Land size in acres</label><input type="number" step="0.1" className={`input-field ${errors.landSize ? 'input-error' : ''}`} value={form.landSize} onChange={e => setForm({ ...form, landSize: e.target.value })} /></div>
              <div><label style={{ fontSize: '12px', color: COLORS.gray }}>Sowing date</label><input type="date" className={`input-field ${errors.sowingDate ? 'input-error' : ''}`} value={form.sowingDate} onChange={e => setForm({ ...form, sowingDate: e.target.value })} /></div>
            </div>
            <button className="btn" onClick={handleSave}>Save Profile</button>
          </div>
        ) : (
          <div className="grid-3">
            <div><div style={{ fontSize: '12px', color: COLORS.gray }}>Name</div><div style={{ fontWeight: '500' }}>{profile.name}</div></div>
            <div><div style={{ fontSize: '12px', color: COLORS.gray }}>Location</div><div style={{ fontWeight: '500' }}>{profile.location}</div></div>
            <div><div style={{ fontSize: '12px', color: COLORS.gray }}>Crop</div><div style={{ fontWeight: '500' }}>{profile.crop}</div></div>
            <div><div style={{ fontSize: '12px', color: COLORS.gray }}>Soil</div><div style={{ fontWeight: '500' }}>{profile.soilType}</div></div>
            <div><div style={{ fontSize: '12px', color: COLORS.gray }}>Land</div><div style={{ fontWeight: '500' }}>{profile.landSize} acres</div></div>
            <div><div style={{ fontSize: '12px', color: COLORS.gray }}>Sowing date</div><div style={{ fontWeight: '500' }}>{profile.sowingDate}</div></div>
          </div>
        )}
      </div>

      <div className="grid-4" style={{ marginTop: '24px', marginBottom: '24px' }}>
        <button className="btn-quick" onClick={() => navigateTo('Pest')}>🔬 Check Pest</button>
        <button className="btn-quick" onClick={() => navigateTo('Crop')}>🌱 Get Crop Advice</button>
        <button className="btn-quick" onClick={() => navigateTo('Irrigation')}>💧 Check Irrigation</button>
        <button className="btn-quick" onClick={() => navigateTo('Market')}>📈 Market Price</button>
      </div>

      <div className="grid-2">
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <span style={{ fontWeight: '500', color: COLORS.darkGreen }}>🌱 Crop Advisor</span>
            {cropData.data && <span style={{ background: cropData.data.recommendations[0]?.ml_used ? COLORS.lightGreen : COLORS.lightGray, color: cropData.data.recommendations[0]?.ml_used ? COLORS.primary : COLORS.gray, padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>{cropData.data.recommendations[0]?.ml_used ? 'AI' : 'Rule'}</span>}
          </div>
          <div style={{ flexGrow: 1 }}>
            {cropData.loading ? (
              <div><div className="skeleton" style={{ height: '26px', width: '60%', marginBottom: '8px' }}></div><div className="skeleton" style={{ height: '14px', width: '80%' }}></div></div>
            ) : cropData.error ? (
              <div style={{ color: COLORS.red, fontSize: '12px' }}>Error: {cropData.error} <button onClick={() => fetchSummaries(profile)} style={{ background: 'none', border: 'none', color: COLORS.primary, cursor: 'pointer' }}>Retry</button></div>
            ) : cropData.data ? (
              <>
                <div style={{ fontSize: '26px', fontWeight: '500', color: COLORS.primary, marginBottom: '4px' }}>{cropData.data.recommendations[0]?.crop}</div>
                <div style={{ display: 'flex', gap: '12px', fontSize: '14px', color: COLORS.gray, marginBottom: '8px' }}>
                  <span>₹{cropData.data.recommendations[0]?.total_profit_for_land?.toLocaleString()} expected</span>
                  <span>• {cropData.data.recommendations[0]?.season}</span>
                </div>
                <div style={{ fontSize: '14px', marginBottom: '16px' }}>Best crop for your soil and location</div>
              </>
            ) : (
              <div style={{ fontSize: '14px', color: COLORS.gray }}>Fill profile to see insights.</div>
            )}
          </div>
          <button className="btn" style={{ width: '100%', background: COLORS.lightGreen, color: COLORS.darkGreen, marginTop: 'auto' }} onClick={() => navigateTo('Crop')}>See all recommendations →</button>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <span style={{ fontWeight: '500', color: COLORS.darkGreen }}>💧 Irrigation Advisor</span>
          </div>
          <div style={{ flexGrow: 1 }}>
            {irrigationData.loading ? (
              <div><div className="skeleton" style={{ height: '26px', width: '60%', marginBottom: '8px' }}></div><div className="skeleton" style={{ height: '14px', width: '80%' }}></div></div>
            ) : irrigationData.error ? (
              <div style={{ color: COLORS.red, fontSize: '12px' }}>Error: {irrigationData.error} <button onClick={() => fetchSummaries(profile)} style={{ background: 'none', border: 'none', color: COLORS.primary, cursor: 'pointer' }}>Retry</button></div>
            ) : irrigationData.data?.daily_schedule?.length > 0 ? (
              (() => {
                const today = irrigationData.data.daily_schedule[0];
                const needsWater = today?.recommendation?.irrigate;
                const mm = today?.recommendation?.amount_mm || 0;
                return (
                  <>
                    <div style={{ fontSize: '26px', fontWeight: '500', color: needsWater ? COLORS.blue : COLORS.primary, marginBottom: '4px' }}>{needsWater ? `${mm} mm` : '0 mm'}</div>
                    <div style={{ display: 'flex', gap: '12px', fontSize: '14px', color: COLORS.gray, marginBottom: '8px' }}>
                      <span>{needsWater ? today?.recommendation?.amount_liters_per_acre?.toLocaleString() : 0} L/acre</span>
                      <span>• {today?.growth_stage}</span>
                    </div>
                    <div style={{ fontSize: '14px', marginBottom: '16px' }}>
                      {needsWater ? `Irrigate ${mm}mm evening today` : `No irrigation needed today — ${today?.weather?.rainfall_mm}mm rain forecast`}
                    </div>
                  </>
                )
              })()
            ) : (
              <div style={{ fontSize: '14px', color: COLORS.gray }}>Fill profile to see insights.</div>
            )}
          </div>
          <button className="btn" style={{ width: '100%', background: irrigationData.data?.daily_schedule?.[0]?.recommendation?.irrigate ? COLORS.lightBlue : COLORS.lightGreen, color: irrigationData.data?.daily_schedule?.[0]?.recommendation?.irrigate ? COLORS.blue : COLORS.darkGreen, marginTop: 'auto' }} onClick={() => navigateTo('Irrigation')}>See 7-day schedule →</button>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <span style={{ fontWeight: '500', color: COLORS.darkGreen }}>📈 Market Predictor</span>
          </div>
          <div style={{ flexGrow: 1 }}>
            {marketData.loading ? (
              <div><div className="skeleton" style={{ height: '26px', width: '60%', marginBottom: '8px' }}></div><div className="skeleton" style={{ height: '14px', width: '80%' }}></div></div>
            ) : marketData.error ? (
              <div style={{ color: COLORS.red, fontSize: '12px' }}>Error: {marketData.error} <button onClick={() => fetchSummaries(profile)} style={{ background: 'none', border: 'none', color: COLORS.primary, cursor: 'pointer' }}>Retry</button></div>
            ) : marketData.data ? (
              <>
                <div style={{ fontSize: '26px', fontWeight: '500', color: COLORS.darkGreen, marginBottom: '4px' }}>₹{marketData.data.summary.best_price_per_quintal?.toLocaleString()}</div>
                <div style={{ display: 'flex', gap: '12px', fontSize: '14px', color: COLORS.gray, marginBottom: '8px', alignItems: 'center' }}>
                  <span>{new Date(marketData.data.summary.best_day_to_sell).toLocaleDateString()}</span>
                  <span style={{ background: marketData.data.summary.price_trend === 'rising' ? COLORS.lightGreen : marketData.data.summary.price_trend === 'falling' ? COLORS.lightRed : COLORS.lightGray, color: marketData.data.summary.price_trend === 'rising' ? COLORS.primary : marketData.data.summary.price_trend === 'falling' ? COLORS.red : COLORS.gray, padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>
                    {marketData.data.summary.price_trend === 'rising' ? '↑ Rising' : marketData.data.summary.price_trend === 'falling' ? '↓ Falling' : '→ Stable'}
                  </span>
                </div>
                <div style={{ fontSize: '14px', marginBottom: '16px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{marketData.data.summary.advice}</div>
              </>
            ) : (
              <div style={{ fontSize: '14px', color: COLORS.gray }}>Fill profile to see insights.</div>
            )}
          </div>
          <button className="btn" style={{ width: '100%', background: COLORS.lightAmber, color: COLORS.amber, marginTop: 'auto' }} onClick={() => navigateTo('Market')}>See 30-day forecast →</button>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <span style={{ fontWeight: '500', color: COLORS.darkGreen }}>🔬 Pest Detection</span>
          </div>
          <div style={{ flexGrow: 1 }}>
            <div style={{ fontSize: '14px', marginBottom: '16px' }}>Upload a leaf image to check for disease</div>
            {(() => {
              const lastPest = localStorage.getItem('lastPestResult');
              if (lastPest) {
                try {
                  const res = JSON.parse(lastPest);
                  return (
                    <div style={{ marginBottom: '16px', padding: '12px', background: COLORS.lightGray, borderRadius: '8px', fontSize: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: '500' }}>{res.disease}</span>
                      <span style={{ background: res.severity === 'High' ? COLORS.red : res.severity === 'Low' ? COLORS.primary : COLORS.amber, color: 'white', padding: '2px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: 'bold' }}>{res.severity}</span>
                    </div>
                  )
                } catch (e) { }
              }
              return null;
            })()}
          </div>
          <button className="btn" style={{ width: '100%', background: COLORS.lightGreen, color: COLORS.darkGreen, marginTop: 'auto' }} onClick={() => navigateTo('Pest')}>Upload new image →</button>
        </div>
      </div>
    </div>
  );
};

const PestDetection = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    axios.get(`${API_BASE}/pest/history`).then(res => setHistory(Array.isArray(res.data) ? res.data.slice(0, 5) : [])).catch(() => null);
  }, []);

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
      const response = await axios.post(`${API_BASE}/pest/detect`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setResult(response.data);
      localStorage.setItem('lastPestResult', JSON.stringify(response.data));
    } catch (err) {
      setError(err.response?.data?.detail || 'Error connecting to backend.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-transition">
      <h1 style={{ fontSize: '26px', marginBottom: '24px', color: COLORS.darkGreen }}>Pest Detection</h1>
      <div className="card">
        {error && <div style={{ background: COLORS.lightRed, color: COLORS.red, padding: '12px', borderRadius: RADIUS, marginBottom: '16px' }}>{error}</div>}

        <div
          className="upload-box"
          style={{ border: `2px dashed ${COLORS.primary}`, borderRadius: CARD_RADIUS, height: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative', overflow: 'hidden', marginBottom: '24px' }}
          onClick={() => !preview && fileInputRef.current.click()}
        >
          <input type="file" accept="image/*" onChange={handleFileChange} ref={fileInputRef} style={{ display: 'none' }} />
          {!preview ? (
            <>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>🍃</div>
              <div style={{ fontWeight: '500', color: COLORS.darkGreen }}>Click to upload leaf image</div>
              <div style={{ fontSize: '12px', color: COLORS.gray, marginTop: '4px' }}>Supports JPG, PNG · Max 10MB</div>
            </>
          ) : (
            <>
              <img src={preview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              <button
                style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '12px', cursor: 'pointer' }}
                onClick={(e) => { e.stopPropagation(); setPreview(null); setSelectedFile(null); setResult(null); }}
              >
                × Remove
              </button>
            </>
          )}
        </div>

        <button className="btn" style={{ width: '100%' }} disabled={!selectedFile || loading} onClick={detectDisease}>
          {loading ? <><div className="spinner"></div> Analyzing...</> : 'Detect Disease'}
        </button>
      </div>

      {result && (
        <div className="card" style={{ marginTop: '24px', borderLeft: `4px solid ${result.disease.toLowerCase().includes('healthy') ? COLORS.primary : result.disease === 'Unknown' || result.confidence < 0.5 ? COLORS.amber : COLORS.red}` }}>
          {result.disease.toLowerCase().includes('healthy') ? (
            <div style={{ fontSize: '18px', fontWeight: '500', color: COLORS.primary }}>✅ Healthy crop — no disease detected</div>
          ) : result.disease === 'Unknown' || result.confidence < 0.5 ? (
            <div>
              <div style={{ fontSize: '18px', fontWeight: '500', color: COLORS.amber, marginBottom: '8px' }}>⚠️ Uncertain Result</div>
              <p style={{ fontSize: '14px' }}>Tips for better photo: Ensure the photo is clearly focused on a plant leaf with good lighting.</p>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{result.disease}</div>
                <div style={{ background: COLORS.red, color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>{result.severity} Severity</div>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: COLORS.gray, marginBottom: '4px' }}>
                  <span>Confidence</span><span>{(result.confidence * 100).toFixed(0)}%</span>
                </div>
                <div style={{ height: '8px', background: COLORS.border, borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${result.confidence * 100}%`, background: result.severity === 'High' ? COLORS.red : COLORS.primary }}></div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '16px', flexDirection: 'column', fontSize: '14px' }}>
                <div><strong>🧪 Treatment:</strong> {result.treatment}</div>
                <div><strong>🛡️ Prevention:</strong> {result.prevention}</div>
              </div>
            </>
          )}
        </div>
      )}

      {history.length > 0 && (
        <div style={{ marginTop: '32px' }}>
          <h3 style={{ fontSize: '16px', color: COLORS.gray, marginBottom: '16px' }}>Recent detections</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {history.map((h, i) => (
              <div key={i} style={{ padding: '12px', background: 'white', borderRadius: RADIUS, border: `1px solid ${COLORS.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px' }}>
                <span>{h.disease}</span>
                <span style={{ fontSize: '12px', color: COLORS.gray }}>{new Date(h.timestamp).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const CropAdvisor = () => {
  const { profile } = useContext(FarmerContext);
  const [form, setForm] = useState({
    soil_type: profile?.soilType || 'Loamy',
    location: profile?.location || '',
    land_size: profile?.landSize || '',
    water_availability: 'Medium',
    season: 'Kharif'
  });
  const [showSoilTest, setShowSoilTest] = useState(false);
  const [advForm, setAdvForm] = useState({ N: '', P: '', K: '', temperature: '', humidity: '', ph: '', rainfall: '' });

  const [soils, setSoils] = useState([]);
  const [states, setStates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    axios.get(`${API_BASE}/crop/soils`).then(res => setSoils(res.data)).catch(() => null);
    axios.get(`${API_BASE}/crop/states`).then(res => setStates(res.data)).catch(() => null);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    let errs = {};
    if (!form.location) errs.location = true;
    if (!form.land_size) errs.land_size = true;
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true); setError(null);
    const payload = { ...form, land_size: parseFloat(form.land_size) };
    if (showSoilTest) {
      ['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall'].forEach(k => {
        if (advForm[k]) payload[k] = parseFloat(advForm[k]);
      });
    }

    try {
      const res = await axios.post(`${API_BASE}/crop/recommend`, payload);
      setResults(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to get recommendations.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-transition">
      <h1 style={{ fontSize: '26px', marginBottom: '24px', color: COLORS.darkGreen }}>Crop Advisor</h1>

      <div className="card" style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>Tell us about your farm</h2>
        <form onSubmit={handleSubmit}>
          <div className="grid-2" style={{ marginBottom: '16px' }}>
            <div>
              <label style={{ fontSize: '12px', color: COLORS.gray }}>Soil Type</label>
              <select className="input-field" value={form.soil_type} onChange={e => setForm({ ...form, soil_type: e.target.value })}>
                {soils.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '12px', color: COLORS.gray }}>Location</label>
              <select className={`input-field ${errors.location ? 'input-error' : ''}`} value={form.location} onChange={e => setForm({ ...form, location: e.target.value })}>
                <option value="">Select State</option>
                {states.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '12px', color: COLORS.gray }}>Land Size (Acres)</label>
              <input type="number" step="0.1" className={`input-field ${errors.land_size ? 'input-error' : ''}`} value={form.land_size} onChange={e => setForm({ ...form, land_size: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: COLORS.gray }}>Season</label>
              <select className="input-field" value={form.season} onChange={e => setForm({ ...form, season: e.target.value })}>
                <option>Kharif</option><option>Rabi</option><option>Zaid</option><option>Both</option>
              </select>
            </div>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '12px', color: COLORS.gray }}>Water Availability</label>
            <select className="input-field" value={form.water_availability} onChange={e => setForm({ ...form, water_availability: e.target.value })}>
              <option>Low</option><option>Medium</option><option>High</option>
            </select>
          </div>

          <div style={{ padding: '16px', background: COLORS.lightGray, borderRadius: RADIUS, marginBottom: '24px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', color: COLORS.darkGreen }}>
              <input type="checkbox" checked={showSoilTest} onChange={e => setShowSoilTest(e.target.checked)} />
              Add Soil Test Data (Optional)
            </label>
            {showSoilTest && (
              <div className="grid-3" style={{ marginTop: '16px' }}>
                {Object.keys(advForm).map(k => (
                  <div key={k}>
                    <label style={{ fontSize: '12px', color: COLORS.gray }}>{k.toUpperCase()}</label>
                    <input type="number" step="any" className="input-field" value={advForm[k]} onChange={e => setAdvForm({ ...advForm, [k]: e.target.value })} />
                  </div>
                ))}
              </div>
            )}
          </div>

          <button type="submit" className="btn" style={{ width: '100%' }} disabled={loading}>
            {loading ? <><div className="spinner"></div> Finding Best Crops...</> : 'Find Best Crops'}
          </button>
        </form>
      </div>

      {error && <div style={{ background: COLORS.lightRed, color: COLORS.red, padding: '12px', borderRadius: RADIUS, marginBottom: '24px' }}>{error}</div>}

      {!results && !loading && !error && <EmptyState />}

      {results && (
        <div className="grid-3">
          {results.recommendations.map((rec, i) => {
            const rankColors = { 1: COLORS.amber, 2: COLORS.gray, 3: '#CD7F32' };
            return (
              <div key={rec.crop} className="card" style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div style={{ background: rankColors[rec.rank], color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>{rec.rank}{rec.rank === 1 ? 'st' : rec.rank === 2 ? 'nd' : 'rd'}</div>
                  <div style={{ background: rec.ml_used ? COLORS.lightGreen : COLORS.lightGray, color: rec.ml_used ? COLORS.primary : COLORS.gray, padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' }}>{rec.ml_used ? 'AI Model' : 'Rule Based'}</div>
                </div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: COLORS.darkGreen }}>{rec.crop}</div>

                <div style={{ marginTop: '16px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: COLORS.primary }}>₹{rec.total_profit_for_land?.toLocaleString()}</div>
                  <div style={{ fontSize: '12px', color: COLORS.gray }}>profit for your {results.land_size} acre farm</div>
                </div>

                <hr style={{ border: 'none', borderTop: `1px solid ${COLORS.border}`, width: '100%', margin: '0 0 16px 0' }} />

                <div className="grid-2" style={{ gap: '8px', marginBottom: '16px', flexGrow: 1 }}>
                  <div><div style={{ fontSize: '11px', color: COLORS.gray }}>Yield</div><div style={{ fontSize: '13px', fontWeight: '500' }}>{rec.yield_quintal_per_acre} q/ac</div></div>
                  <div><div style={{ fontSize: '11px', color: COLORS.gray }}>Price</div><div style={{ fontSize: '13px', fontWeight: '500' }}>₹{rec.price_per_quintal}/kg</div></div>
                  <div><div style={{ fontSize: '11px', color: COLORS.gray }}>Duration</div><div style={{ fontSize: '13px', fontWeight: '500' }}>{rec.duration_days} days</div></div>
                  <div><div style={{ fontSize: '11px', color: COLORS.gray }}>Season</div><div style={{ fontSize: '13px', fontWeight: '500' }}>{rec.season}</div></div>
                </div>

                <div style={{ fontSize: '12px', fontStyle: 'italic', color: COLORS.gray, marginBottom: '8px' }}>{rec.description}</div>
                <div style={{ fontSize: '11px', color: COLORS.primary, background: COLORS.lightGreen, padding: '6px', borderRadius: '4px' }}>{rec.match_reason}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const IrrigationAdvisor = () => {
  const { profile } = useContext(FarmerContext);
  const [form, setForm] = useState({
    crop: profile?.crop || 'Rice',
    location: profile?.location || '',
    sowing_date: profile?.sowingDate || new Date().toISOString().split('T')[0],
    soil_type: profile?.soilType || 'Loamy',
    land_size_acres: profile?.landSize || 1.0
  });

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [errors, setErrors] = useState({});

  const crops = ["Rice", "Wheat", "Maize", "Cotton", "Sugarcane", "Soybean", "Potato", "Tomato", "Onion", "Chickpea", "Mustard", "Groundnut", "Sunflower", "Bajra", "Pigeonpeas", "Banana"];
  const soils = ["Sandy", "Loamy", "Clay", "Black", "Red", "Alluvial", "Laterite"];

  const handleSubmit = async (e) => {
    e.preventDefault();
    let errs = {};
    if (!form.location) errs.location = true;
    if (!form.sowing_date) errs.sowing_date = true;
    if (!form.land_size_acres) errs.land_size_acres = true;
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true); setError(null);
    try {
      const payload = { ...form, land_size_acres: parseFloat(form.land_size_acres) };
      const res = await axios.post(`${API_BASE}/irrigation/schedule`, payload);
      if (!res.data.success) throw new Error(res.data.error?.message || "API Error");
      setResults(res.data.data);
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message || "Failed to fetch irrigation schedule.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-transition">
      <h1 style={{ fontSize: '26px', marginBottom: '24px', color: COLORS.darkGreen }}>Irrigation Advisor</h1>

      <div className="card" style={{ marginBottom: '32px' }}>
        <form onSubmit={handleSubmit}>
          <div className="grid-2" style={{ marginBottom: '16px' }}>
            <div>
              <label style={{ fontSize: '12px', color: COLORS.gray }}>Crop</label>
              <select className="input-field" value={form.crop} onChange={e => setForm({ ...form, crop: e.target.value })}>
                {crops.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '12px', color: COLORS.gray }}>Soil Type</label>
              <select className="input-field" value={form.soil_type} onChange={e => setForm({ ...form, soil_type: e.target.value })}>
                {soils.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '12px', color: COLORS.gray }}>Location</label>
              <input className={`input-field ${errors.location ? 'input-error' : ''}`} value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="e.g. Pune" />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: COLORS.gray }}>Land Size (Acres)</label>
              <input type="number" step="0.1" className={`input-field ${errors.land_size_acres ? 'input-error' : ''}`} value={form.land_size_acres} onChange={e => setForm({ ...form, land_size_acres: e.target.value })} />
            </div>
          </div>
          <div style={{ marginBottom: '24px' }}>
            <label style={{ fontSize: '12px', color: COLORS.gray }}>Sowing Date</label>
            <input type="date" className={`input-field ${errors.sowing_date ? 'input-error' : ''}`} value={form.sowing_date} onChange={e => setForm({ ...form, sowing_date: e.target.value })} />
          </div>
          <button type="submit" className="btn" style={{ width: '100%' }} disabled={loading}>
            {loading ? <><div className="spinner"></div> Calculating Schedule...</> : 'Get Irrigation Schedule'}
          </button>
        </form>
      </div>

      {error && <div style={{ background: COLORS.lightRed, color: COLORS.red, padding: '12px', borderRadius: RADIUS, marginBottom: '24px' }}>{error}</div>}

      {!results && !loading && !error && <EmptyState />}

      {results && (
        <>
          <div className="grid-4" style={{ marginBottom: '24px' }}>
            <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: COLORS.gray, textTransform: 'uppercase' }}>Growth Stage</div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: COLORS.darkGreen, marginTop: '8px' }}>{results.current_growth_stage}</div>
            </div>
            <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: COLORS.gray, textTransform: 'uppercase' }}>Water This Week</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: COLORS.blue, marginTop: '4px' }}>{results['7_day_summary'].total_irrigation_needed_mm} mm</div>
            </div>
            <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: COLORS.gray, textTransform: 'uppercase' }}>Days Needing Water</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: COLORS.primary, marginTop: '4px' }}>{results['7_day_summary'].days_requiring_irrigation}</div>
            </div>
            <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: COLORS.gray, textTransform: 'uppercase' }}>Days With Rain</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: COLORS.amber, marginTop: '4px' }}>{results.daily_schedule.filter(d => d.weather.rainfall_mm > 0).length}</div>
            </div>
          </div>

          {(() => {
            const today = results.daily_schedule?.[0];
            const irrigate = today?.recommendation?.irrigate;
            return (
              <div style={{ background: irrigate ? COLORS.lightBlue : COLORS.lightGreen, color: irrigate ? COLORS.blue : COLORS.darkGreen, padding: '24px', borderRadius: CARD_RADIUS, marginBottom: '24px', fontSize: '18px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '32px' }}>{irrigate ? '💧' : '✅'}</span>
                {irrigate
                  ? `Irrigate ${today.recommendation.amount_mm}mm today — ${form.crop} is in ${today.growth_stage} stage`
                  : `No irrigation needed today — rain covers demand`}
              </div>
            );
          })()}

          <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ background: COLORS.lightGray, color: COLORS.gray, fontSize: '12px', textTransform: 'uppercase' }}>
                  <tr>
                    <th style={{ padding: '16px' }}>Date</th>
                    <th style={{ padding: '16px' }}>Stage</th>
                    <th style={{ padding: '16px' }}>Temp</th>
                    <th style={{ padding: '16px' }}>Rain</th>
                    <th style={{ padding: '16px' }}>ETo</th>
                    <th style={{ padding: '16px' }}>Kc</th>
                    <th style={{ padding: '16px' }}>Amount</th>
                    <th style={{ padding: '16px' }}>Action</th>
                  </tr>
                </thead>
                <tbody style={{ fontSize: '14px' }}>
                  {results.daily_schedule.map((day, i) => {
                    const irrigate = day.recommendation.irrigate;
                    return (
                      <tr key={i} style={{ borderBottom: `1px solid ${COLORS.border}`, background: irrigate ? COLORS.lightBlue : 'white' }}>
                        <td style={{ padding: '16px', fontWeight: '500' }}>{new Date(day.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</td>
                        <td style={{ padding: '16px' }}>{day.growth_stage}</td>
                        <td style={{ padding: '16px' }}>{day.weather.tmax}°C</td>
                        <td style={{ padding: '16px' }}>{day.weather.rainfall_mm}mm</td>
                        <td style={{ padding: '16px' }}>{day.calculation.eto_mm}</td>
                        <td style={{ padding: '16px' }}>{day.calculation.kc}</td>
                        <td style={{ padding: '16px', fontWeight: irrigate ? 'bold' : 'normal', color: irrigate ? COLORS.blue : 'inherit' }}>{day.recommendation.amount_mm}mm</td>
                        <td style={{ padding: '16px' }}>
                          {irrigate ? (
                            <div style={{ background: COLORS.blue, color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', display: 'inline-block' }}>Irrigate {day.recommendation.amount_mm}mm</div>
                          ) : (
                            <div style={{ background: COLORS.lightGreen, color: COLORS.primary, padding: '4px 8px', borderRadius: '4px', fontSize: '12px', display: 'inline-block' }}>✓ Rain</div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const MarketPredictor = () => {
  const { profile } = useContext(FarmerContext);

  let defaultHarvest = new Date().toISOString().split('T')[0];
  if (profile?.sowingDate) {
    const d = new Date(profile.sowingDate);
    d.setDate(d.getDate() + 90);
    defaultHarvest = d.toISOString().split('T')[0];
  }

  const [form, setForm] = useState({
    crop: profile?.crop || '',
    state: profile?.location || '',
    harvest_date: defaultHarvest
  });

  const [crops, setCrops] = useState([]);
  const [states, setStates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    axios.get(`${API_BASE}/market/crops`).then(res => {
      setCrops(res.data.crops);
      if (!form.crop && res.data.crops.length > 0) setForm(f => ({ ...f, crop: res.data.crops[0] }));
    }).catch(() => null);
    axios.get(`${API_BASE}/market/states`).then(res => {
      setStates(res.data.states);
      if (!form.state && res.data.states.length > 0) setForm(f => ({ ...f, state: res.data.states[0] }));
    }).catch(() => null);
  }, []);

  useEffect(() => {
    if (result && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const data = result['30_day_forecast'];
      const bestDate = result.summary.best_day_to_sell;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const padding = 40;
      const w = canvas.width - padding * 2;
      const h = canvas.height - padding * 2;

      const prices = data.map(d => d.predicted_price_per_quintal);
      const maxPrice = Math.max(...prices) * 1.05;
      const minPrice = Math.min(...prices) * 0.95;
      const range = maxPrice - minPrice;
      const barWidth = w / data.length - 4;

      data.forEach((day, i) => {
        const x = padding + i * (barWidth + 4);
        const barH = ((day.predicted_price_per_quintal - minPrice) / range) * h;
        const y = canvas.height - padding - barH;

        ctx.fillStyle = day.date === bestDate ? COLORS.amber :
          day.predicted_price_per_quintal === Math.min(...prices) ? COLORS.red : COLORS.primary;

        ctx.fillRect(x, y, barWidth, barH);

        if (i % 5 === 0) {
          ctx.fillStyle = COLORS.gray;
          ctx.font = '12px system-ui';
          ctx.textAlign = 'center';
          const dt = new Date(day.date);
          ctx.fillText(`${dt.getDate()}/${dt.getMonth() + 1}`, x + barWidth / 2, canvas.height - padding + 20);
        }
      });

      ctx.fillStyle = COLORS.gray;
      ctx.font = '12px system-ui';
      ctx.textAlign = 'right';
      ctx.fillText(`₹${Math.round(maxPrice)}`, padding - 10, padding + 5);
      ctx.fillText(`₹${Math.round(minPrice)}`, padding - 10, canvas.height - padding);
    }
  }, [result]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.crop || !form.state || !form.harvest_date) return;
    setLoading(true); setError(null);
    try {
      const res = await axios.post(`${API_BASE}/market/predict`, form);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to get price prediction.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-transition">
      <h1 style={{ fontSize: '26px', marginBottom: '24px', color: COLORS.darkGreen }}>Market Predictor</h1>

      <div className="card" style={{ marginBottom: '32px' }}>
        <form onSubmit={handleSubmit} className="grid-3" style={{ alignItems: 'end' }}>
          <div>
            <label style={{ fontSize: '12px', color: COLORS.gray }}>Crop</label>
            <select className="input-field" value={form.crop} onChange={e => setForm({ ...form, crop: e.target.value })}>
              <option value="">Select Crop</option>
              {crops.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '12px', color: COLORS.gray }}>State</label>
            <select className="input-field" value={form.state} onChange={e => setForm({ ...form, state: e.target.value })}>
              <option value="">Select State</option>
              {states.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '12px', color: COLORS.gray }}>Harvest Date</label>
            <input type="date" className="input-field" value={form.harvest_date} onChange={e => setForm({ ...form, harvest_date: e.target.value })} />
          </div>
          <button type="submit" className="btn" style={{ gridColumn: '1 / -1', marginTop: '16px' }} disabled={loading || !form.crop || !form.state}>
            {loading ? <><div className="spinner"></div> Predicting Market Price...</> : 'Predict Mandi Price'}
          </button>
        </form>
      </div>

      {error && <div style={{ background: COLORS.lightRed, color: COLORS.red, padding: '12px', borderRadius: RADIUS, marginBottom: '24px' }}>{error}</div>}

      {!result && !loading && !error && <EmptyState />}

      {result && (
        <>
          <div className="card grid-2" style={{ marginBottom: '24px', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '14px', color: COLORS.gray, textTransform: 'uppercase', marginBottom: '8px' }}>Best day to sell</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: COLORS.darkGreen }}>{new Date(result.summary.best_day_to_sell).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
              <div style={{ marginTop: '16px', display: 'flex', alignItems: 'baseline', gap: '16px' }}>
                <span style={{ fontSize: '32px', fontWeight: 'bold', color: COLORS.primary }}>₹{result.summary.best_price_per_quintal?.toLocaleString()}</span>
                <span style={{ fontSize: '14px', color: COLORS.gray }}>/ quintal</span>
              </div>
              <div style={{ fontSize: '14px', color: COLORS.gray }}>AND ₹{result.summary.best_price_per_kg} / kg</div>
            </div>

            <div style={{ paddingLeft: '24px', borderLeft: `1px solid ${COLORS.border}` }}>
              <div style={{ display: 'inline-block', background: result.summary.price_trend === 'rising' ? COLORS.lightGreen : result.summary.price_trend === 'falling' ? COLORS.lightRed : COLORS.lightGray, color: result.summary.price_trend === 'rising' ? COLORS.primary : result.summary.price_trend === 'falling' ? COLORS.red : COLORS.gray, padding: '6px 16px', borderRadius: '20px', fontSize: '14px', fontWeight: 'bold', marginBottom: '16px' }}>
                {result.summary.price_trend === 'rising' ? '↑ Rising Trend' : result.summary.price_trend === 'falling' ? '↓ Falling Trend' : '→ Stable Trend'}
              </div>
              <div style={{ fontSize: '16px', color: COLORS.darkGreen, marginBottom: '24px', lineHeight: '1.4' }}>{result.summary.advice}</div>
              <div style={{ fontSize: '12px', color: COLORS.gray }}>Model accuracy: MAE ₹{result.model_accuracy.mae_inr_per_quintal?.toFixed(0)} | R² {result.model_accuracy.r2_score?.toFixed(2)}</div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', marginBottom: '16px' }}>30-day price forecast</h3>
            <div style={{ width: '100%', overflowX: 'auto' }}>
              <canvas ref={canvasRef} width={800} height={300} style={{ width: '800px', maxWidth: '100%' }} />
            </div>
          </div>

          {result.extrapolation_warning && (
            <div style={{ background: COLORS.lightAmber, color: COLORS.amber, padding: '16px', borderRadius: RADIUS, display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '20px' }}>⚠️</span>
              <div style={{ fontSize: '14px' }}>{result.extrapolation_warning}</div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const App = () => {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('krushiai_profile');
    if (saved) {
      try { setProfile(JSON.parse(saved)); } catch (e) { }
    }
  }, []);

  const handleSetProfile = (p) => {
    setProfile(p);
    localStorage.setItem('krushiai_profile', JSON.stringify(p));
  };

  const navLinks = [
    { id: 'Dashboard', icon: '🏠', label: 'Dashboard' },
    { id: 'Pest', icon: '🔬', label: 'Pest' },
    { id: 'Crop', icon: '🌱', label: 'Crop' },
    { id: 'Irrigation', icon: '💧', label: 'Irrigation' },
    { id: 'Market', icon: '📈', label: 'Market' },
  ];

  return (
    <FarmerContext.Provider value={{ profile, setProfile: handleSetProfile }}>
      <GlobalStyles />
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <nav style={{ background: COLORS.darkGreen, height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', flexShrink: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ color: 'white', fontSize: '18px', fontWeight: 'bold' }}>🌾 KrushiAI</div>
            <div style={{ color: '#9FE1CB', fontSize: '11px' }}>Apni Fasal, Apna Data</div>
          </div>
          <div className="nav-links">
            {navLinks.map(link => (
              <a
                key={link.id}
                className={`nav-link ${activeTab === link.id ? 'active' : ''}`}
                onClick={(e) => { e.preventDefault(); setActiveTab(link.id); }}
                href={`#${link.id}`}
              >
                <span>{link.icon}</span> {link.label}
              </a>
            ))}
          </div>
        </nav>

        <main style={{ flexGrow: 1, padding: '32px 24px', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
          {activeTab === 'Dashboard' && <Dashboard navigateTo={setActiveTab} />}
          {activeTab === 'Pest' && <PestDetection />}
          {activeTab === 'Crop' && <CropAdvisor />}
          {activeTab === 'Irrigation' && <IrrigationAdvisor />}
          {activeTab === 'Market' && <MarketPredictor />}
        </main>
      </div>
    </FarmerContext.Provider>
  );
};

export default App;
