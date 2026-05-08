import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Sprout, 
  IndianRupee, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  BarChart3,
  Waves,
  MapPin,
  Sparkles
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Input from '../components/ui/Input';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const Crop = ({ profile }) => {
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

  useEffect(() => {
    axios.get(`${API_BASE}/crop/soils`).then(res => setSoils(res.data)).catch(() => null);
    axios.get(`${API_BASE}/crop/states`).then(res => setStates(res.data)).catch(() => null);
    
    if (profile?.location && profile?.soilType) {
      handleSubmit();
    }
  }, []);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);
    const payload = { ...form, land_size: parseFloat(form.land_size) || 1.0 };
    
    if (showSoilTest) {
      Object.entries(advForm).forEach(([k, v]) => {
        if (v) payload[k] = parseFloat(v);
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
    <div className="space-y-8 animate-fade-in pb-20">
      <section>
        <h1 className="text-3xl font-bold text-nature-soil dark:text-dark-text mb-2">Crop Advisor</h1>
        <p className="text-nature-sage dark:text-dark-muted">Discover the most profitable crops for your specific land and soil conditions.</p>
      </section>

      {/* Input Form */}
      <Card className="border-t-4 border-nature-leaf">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-nature-soil/50 dark:text-dark-muted uppercase tracking-widest flex items-center gap-2">
                <MapPin size={14} /> Location
              </label>
              <select 
                className="w-full bg-nature-earth/50 dark:bg-dark-bg p-4 rounded-xl border border-nature-fog dark:border-white/10 outline-none focus:border-nature-leaf transition-all"
                value={form.location} 
                onChange={e => setForm({ ...form, location: e.target.value })}
              >
                <option value="">Select State</option>
                {states.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-nature-soil/50 dark:text-dark-muted uppercase tracking-widest flex items-center gap-2">
                <Waves size={14} /> Soil Type
              </label>
              <select 
                className="w-full bg-nature-earth/50 dark:bg-dark-bg p-4 rounded-xl border border-nature-fog dark:border-white/10 outline-none focus:border-nature-leaf transition-all"
                value={form.soil_type} 
                onChange={e => setForm({ ...form, soil_type: e.target.value })}
              >
                {soils.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-nature-soil/50 dark:text-dark-muted uppercase tracking-widest flex items-center gap-2">
                <Calendar size={14} /> Season
              </label>
              <select 
                className="w-full bg-nature-earth/50 dark:bg-dark-bg p-4 rounded-xl border border-nature-fog dark:border-white/10 outline-none focus:border-nature-leaf transition-all"
                value={form.season} 
                onChange={e => setForm({ ...form, season: e.target.value })}
              >
                <option>Kharif</option>
                <option>Rabi</option>
                <option>Zaid</option>
                <option>Both</option>
              </select>
            </div>
            <Input 
              label="Land Size (Acres)" 
              type="number" 
              step="0.1" 
              value={form.land_size} 
              onChange={e => setForm({ ...form, land_size: e.target.value })} 
            />
          </div>

          <div className="p-6 bg-nature-earth/50 dark:bg-dark-bg/50 rounded-3xl border border-nature-fog dark:border-white/10">
            <button 
              type="button"
              onClick={() => setShowSoilTest(!showSoilTest)}
              className="flex items-center gap-3 w-full text-left"
            >
              <div className={`w-6 h-6 rounded-md border-2 border-nature-leaf flex items-center justify-center transition-colors ${showSoilTest ? 'bg-nature-leaf text-white' : 'text-transparent'}`}>
                {showSoilTest && <CheckCircle2 size={16} />}
              </div>
              <span className="font-bold text-nature-soil dark:text-dark-text">Add detailed soil test data</span>
              <Badge variant="neutral" className="ml-2">Optional</Badge>
              <HelpCircle size={18} className="ml-auto text-nature-sage" />
            </button>

            {showSoilTest && (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mt-6 animate-slide-up">
                {Object.keys(advForm).map(k => (
                  <Input 
                    key={k}
                    label={k.toUpperCase()} 
                    type="number" 
                    placeholder="--"
                    value={advForm[k]} 
                    onChange={e => setAdvForm({ ...advForm, [k]: e.target.value })} 
                  />
                ))}
              </div>
            )}
          </div>

          <Button variant="primary" type="submit" className="w-full text-lg py-5" disabled={loading}>
            {loading ? 'Analyzing data...' : 'Find Best Crops'}
          </Button>
        </form>
      </Card>

      {error && (
        <div className="p-4 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl flex gap-3 items-center border border-red-200 dark:border-red-800">
          <AlertCircle size={20} />
          <p className="font-medium">{error}</p>
        </div>
      )}

      {results && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-nature-soil dark:text-dark-text flex items-center gap-2 px-2">
            <Sparkles size={24} className="text-nature-wheat" />
            Recommended for your {results.land_size} acre farm
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {results.recommendations.map((rec, i) => {
              const rankStyles = {
                1: { bg: 'bg-nature-wheat/10', text: 'text-nature-wheat', border: 'border-nature-wheat/30', label: '1st Best Choice' },
                2: { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200', label: '2nd Best Choice' },
                3: { bg: 'bg-orange-100', text: 'text-orange-600', border: 'border-orange-200', label: '3rd Best Choice' },
              };
              const style = rankStyles[rec.rank] || rankStyles[2];

              return (
                <Card key={rec.crop} className={`flex flex-col relative ${rec.rank === 1 ? 'shadow-premium scale-[1.02] border-nature-wheat/20' : ''}`}>
                  <div className="flex justify-between items-start mb-6">
                    <Badge variant={rec.rank === 1 ? 'warning' : 'neutral'} className="text-[10px] py-1">
                      {style.label}
                    </Badge>
                    {rec.ml_used && (
                      <div className="flex items-center gap-1 text-[10px] font-bold text-nature-leaf dark:text-nature-sky uppercase tracking-widest">
                        <Sparkles size={12} /> AI Verified
                      </div>
                    )}
                  </div>

                  <h3 className="text-3xl font-bold text-nature-soil dark:text-dark-text mb-2">{rec.crop}</h3>
                  <div className="p-6 bg-nature-leaf/5 dark:bg-nature-leaf/10 rounded-3xl mb-6">
                    <p className="text-xs font-bold text-nature-leaf dark:text-nature-sky uppercase tracking-widest mb-1">Expected Profit</p>
                    <div className="flex items-baseline gap-1 text-nature-leaf dark:text-nature-sky">
                      <IndianRupee size={24} strokeWidth={3} />
                      <span className="text-4xl font-black">{rec.total_profit_for_land?.toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-nature-sage dark:text-dark-muted mt-2">Per season duration</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-nature-sage dark:text-dark-muted text-xs uppercase font-bold tracking-wider">
                        <Clock size={14} /> Duration
                      </div>
                      <p className="font-bold">{rec.duration_days} Days</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-nature-sage dark:text-dark-muted text-xs uppercase font-bold tracking-wider">
                        <Calendar size={14} /> Season
                      </div>
                      <p className="font-bold">{rec.season}</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-nature-sage dark:text-dark-muted text-xs uppercase font-bold tracking-wider">
                        <BarChart3 size={14} /> Est. Yield
                      </div>
                      <p className="font-bold">{rec.yield_quintal_per_acre} q/ac</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-nature-sage dark:text-dark-muted text-xs uppercase font-bold tracking-wider">
                        <IndianRupee size={14} /> Market Price
                      </div>
                      <p className="font-bold">₹{rec.price_per_quintal}/q</p>
                    </div>
                  </div>

                  <div className="mt-auto space-y-4">
                    <div className="p-4 bg-nature-earth dark:bg-dark-bg rounded-2xl border border-nature-fog dark:border-white/5">
                      <p className="text-xs font-bold text-nature-soil/40 dark:text-dark-muted uppercase tracking-widest mb-2 flex items-center gap-2">
                        <CheckCircle2 size={12} className="text-nature-leaf" /> Why it matches
                      </p>
                      <p className="text-sm font-medium leading-relaxed">{rec.match_reason}</p>
                    </div>
                    <Button variant={rec.rank === 1 ? 'primary' : 'outline'} className="w-full">
                      View Cultivation Guide
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Crop;
