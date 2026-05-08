import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  IndianRupee,
  ArrowRight,
  Info,
  CalendarDays,
  LineChart,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  AlertCircle
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Input from '../components/ui/Input';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const Market = ({ profile }) => {
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

    if (profile?.crop && profile?.location) {
      handleSubmit();
    }
  }, []);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post(`${API_BASE}/market/predict`, form);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to fetch market data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (result && canvasRef.current) {
      drawChart();
    }
  }, [result]);

  const drawChart = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const data = result['30_day_forecast'];
    const bestDate = result.summary.best_day_to_sell;

    const width = canvas.offsetWidth;
    const height = 200;
    canvas.width = width * 2; // High DPI
    canvas.height = height * 2;
    ctx.scale(2, 2);

    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const prices = data.map(d => d.predicted_price_per_quintal);
    const minPrice = Math.min(...prices) * 0.95;
    const maxPrice = Math.max(...prices) * 1.05;
    const priceRange = maxPrice - minPrice;

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Gradient
    const gradient = ctx.createLinearGradient(0, padding, 0, height - padding);
    gradient.addColorStop(0, 'rgba(45, 90, 39, 0.1)');
    gradient.addColorStop(1, 'rgba(45, 90, 39, 0)');

    // Line
    ctx.beginPath();
    ctx.strokeStyle = '#2D5A27';
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    data.forEach((d, i) => {
      const x = padding + (i / (data.length - 1)) * chartWidth;
      const y = height - padding - ((d.predicted_price_per_quintal - minPrice) / priceRange) * chartHeight;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Area
    ctx.lineTo(padding + chartWidth, height - padding);
    ctx.lineTo(padding, height - padding);
    ctx.fillStyle = gradient;
    ctx.fill();

    // Highlight Best Day
    const bestIndex = data.findIndex(d => d.date === bestDate);
    if (bestIndex !== -1) {
      const bx = padding + (bestIndex / (data.length - 1)) * chartWidth;
      const by = height - padding - ((data[bestIndex].predicted_price_per_quintal - minPrice) / priceRange) * chartHeight;

      ctx.beginPath();
      ctx.fillStyle = '#E2B13C';
      ctx.arc(bx, by, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <section>
        <h1 className="text-3xl font-bold text-nature-soil dark:text-dark-text mb-2 text-center md:text-left">Market Predictor</h1>
        <p className="text-nature-sage dark:text-dark-muted text-center md:text-left">AI-powered price forecasting for your harvest.</p>
      </section>

      {/* Input Section */}
      <Card>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-nature-soil/50 dark:text-dark-muted uppercase tracking-widest flex items-center gap-2">
              <LineChart size={14} /> Crop
            </label>
            <select
              className="w-full bg-nature-earth/50 dark:bg-dark-bg p-4 rounded-xl border border-nature-fog dark:border-white/10 outline-none focus:border-nature-leaf transition-all"
              value={form.crop}
              onChange={e => setForm({ ...form, crop: e.target.value })}
            >
              {crops.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-nature-soil/50 dark:text-dark-muted uppercase tracking-widest flex items-center gap-2">
              <MapPin size={14} /> State
            </label>
            <select
              className="w-full bg-nature-earth/50 dark:bg-dark-bg p-4 rounded-xl border border-nature-fog dark:border-white/10 outline-none focus:border-nature-leaf transition-all"
              value={form.state}
              onChange={e => setForm({ ...form, state: e.target.value })}
            >
              {states.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <Input
            label="Harvest Date"
            type="date"
            value={form.harvest_date}
            onChange={e => setForm({ ...form, harvest_date: e.target.value })}
          />
          <div className="flex items-end">
            <Button variant="primary" type="submit" className="w-full h-14" disabled={loading}>
              {loading ? 'Predicting...' : 'Get Forecast'}
            </Button>
          </div>
        </form>
      </Card>

      {error && (
        <div className="p-4 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl flex gap-3 items-center border border-red-200 dark:border-red-800">
          <AlertCircle size={20} />
          <p className="font-medium">{error}</p>
        </div>
      )}

      {result && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Forecast Card */}
          <Card className="lg:col-span-2 flex flex-col">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-2xl font-bold text-nature-soil dark:text-dark-text">Price Forecast</h3>
                <p className="text-sm text-nature-sage">Estimated trend for the next 30 days</p>
              </div>
              <Badge variant={result.summary.price_trend === 'rising' ? 'success' : result.summary.price_trend === 'falling' ? 'danger' : 'neutral'}>
                {result.summary.price_trend === 'rising' ? (
                  <span className="flex items-center gap-1"><ArrowUpRight size={14} /> Rising</span>
                ) : result.summary.price_trend === 'falling' ? (
                  <span className="flex items-center gap-1"><ArrowDownRight size={14} /> Falling</span>
                ) : (
                  <span className="flex items-center gap-1"><Minus size={14} /> Stable</span>
                )}
              </Badge>
            </div>

            <div className="flex-1 min-h-[250px] relative">
              <canvas ref={canvasRef} className="w-full h-[200px]" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t border-nature-fog dark:border-white/5">
              <div>
                <p className="text-[10px] font-bold text-nature-soil/40 dark:text-dark-muted uppercase tracking-widest mb-1">Low Price</p>
                <p className="text-lg font-bold">₹{Math.min(...result['30_day_forecast'].map(d => d.predicted_price_per_quintal)).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-nature-soil/40 dark:text-dark-muted uppercase tracking-widest mb-1">High Price</p>
                <p className="text-lg font-bold">₹{Math.max(...result['30_day_forecast'].map(d => d.predicted_price_per_quintal)).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-nature-soil/40 dark:text-dark-muted uppercase tracking-widest mb-1">Market State</p>
                <p className="text-lg font-bold">{form.state}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-nature-soil/40 dark:text-dark-muted uppercase tracking-widest mb-1">Crop</p>
                <p className="text-lg font-bold">{form.crop}</p>
              </div>
            </div>
          </Card>

          {/* Actionable Advice Card */}
          <div className="space-y-6">
            <Card className="bg-nature-leaf text-white border-none shadow-premium">
              <h4 className="text-sm font-bold uppercase tracking-widest opacity-70 mb-6">Recommendation</h4>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                  <CalendarDays size={32} />
                </div>
                <div>
                  <p className="text-xs opacity-70">Best day to sell</p>
                  <p className="text-2xl font-black">{new Date(result.summary.best_day_to_sell).toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })}</p>
                </div>
              </div>
              <div className="p-4 bg-white/10 rounded-2xl mb-6">
                <p className="text-sm leading-relaxed italic">"{result.summary.advice}"</p>
              </div>
              <Button variant="secondary" className="w-full">Set Price Alert</Button>
            </Card>

            <Card>
              <h4 className="text-sm font-bold text-nature-soil/50 dark:text-dark-muted uppercase tracking-widest mb-4">Price Breakdown</h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-nature-fog dark:border-white/5">
                  <span className="text-nature-sage text-sm">Best Price</span>
                  <span className="text-lg font-bold text-nature-leaf dark:text-nature-sky">₹{result.summary.best_price_per_quintal?.toLocaleString()}/q</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-nature-fog dark:border-white/5">
                  <span className="text-nature-sage text-sm">Average Price</span>
                  <span className="text-lg font-bold text-nature-soil dark:text-dark-text">₹{(result['30_day_forecast'].reduce((a, b) => a + b.predicted_price_per_quintal, 0) / 30).toFixed(0).toLocaleString()}/q</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-nature-sage text-sm">Forecast Confidence</span>
                  <Badge variant="primary">High</Badge>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

const MapPin = ({ size, className }) => <span className={className}><svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg></span>;

export default Market;
