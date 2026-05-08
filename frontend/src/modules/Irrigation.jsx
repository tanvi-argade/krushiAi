import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Droplets, 
  CloudRain, 
  Thermometer, 
  Calendar,
  CheckCircle2,
  AlertCircle,
  Wind,
  Info
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Input from '../components/ui/Input';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const Irrigation = ({ profile }) => {
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

  const crops = ["Rice", "Wheat", "Maize", "Cotton", "Sugarcane", "Soybean", "Potato", "Tomato", "Onion", "Chickpea", "Mustard", "Groundnut", "Sunflower", "Bajra", "Pigeonpeas", "Banana"];
  const soils = ["Sandy", "Loamy", "Clay", "Black", "Red", "Alluvial", "Laterite"];

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);
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

  useEffect(() => {
    if (profile?.location) {
      handleSubmit();
    }
  }, []);

  return (
    <div className="space-y-8 animate-fade-in">
      <section>
        <h1 className="text-3xl font-bold text-nature-soil dark:text-dark-text mb-2">Irrigation Advisor</h1>
        <p className="text-nature-sage dark:text-dark-muted">Smart watering schedule based on weather and crop needs.</p>
      </section>

      {/* Input Form */}
      <Card>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-nature-soil/50 dark:text-dark-muted uppercase tracking-widest">Crop</label>
            <select 
              className="w-full bg-nature-earth/50 dark:bg-dark-bg p-4 rounded-xl border border-nature-fog dark:border-white/10 outline-none focus:border-nature-leaf transition-all"
              value={form.crop} 
              onChange={e => setForm({ ...form, crop: e.target.value })}
            >
              {crops.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-nature-soil/50 dark:text-dark-muted uppercase tracking-widest">Soil Type</label>
            <select 
              className="w-full bg-nature-earth/50 dark:bg-dark-bg p-4 rounded-xl border border-nature-fog dark:border-white/10 outline-none focus:border-nature-leaf transition-all"
              value={form.soil_type} 
              onChange={e => setForm({ ...form, soil_type: e.target.value })}
            >
              {soils.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <Input 
            label="Location" 
            placeholder="e.g. Pune" 
            value={form.location} 
            onChange={e => setForm({ ...form, location: e.target.value })} 
          />
          <Input 
            label="Land Size (Acres)" 
            type="number" 
            step="0.1" 
            value={form.land_size_acres} 
            onChange={e => setForm({ ...form, land_size_acres: e.target.value })} 
          />
          <Input 
            label="Sowing Date" 
            type="date" 
            value={form.sowing_date} 
            onChange={e => setForm({ ...form, sowing_date: e.target.value })} 
          />
          <div className="md:col-span-1 lg:col-span-1 flex items-end">
            <Button variant="primary" type="submit" className="w-full" disabled={loading}>
              {loading ? 'Calculating...' : 'Get Schedule'}
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

      {results && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="flex flex-col items-center text-center p-4">
              <span className="text-[10px] font-bold text-nature-soil/40 dark:text-dark-muted uppercase tracking-widest mb-1">Status</span>
              <Badge variant="primary" className="mb-2">{results.current_growth_stage}</Badge>
            </Card>
            <Card className="flex flex-col items-center text-center p-4">
              <span className="text-[10px] font-bold text-nature-soil/40 dark:text-dark-muted uppercase tracking-widest mb-1">Weekly Needs</span>
              <p className="text-xl font-bold text-nature-sky">{results['7_day_summary'].total_irrigation_needed_mm} mm</p>
            </Card>
            <Card className="flex flex-col items-center text-center p-4">
              <span className="text-[10px] font-bold text-nature-soil/40 dark:text-dark-muted uppercase tracking-widest mb-1">Days Needing Water</span>
              <p className="text-xl font-bold text-nature-leaf">{results['7_day_summary'].days_requiring_irrigation}</p>
            </Card>
            <Card className="flex flex-col items-center text-center p-4">
              <span className="text-[10px] font-bold text-nature-soil/40 dark:text-dark-muted uppercase tracking-widest mb-1">Liters/Acre (Total)</span>
              <p className="text-lg font-bold text-nature-soil dark:text-dark-text">{(results['7_day_summary'].total_irrigation_needed_mm * 4047 * 0.1).toFixed(0)}L</p>
            </Card>
          </div>

          {/* Daily Schedule - Stacked Cards */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-nature-soil dark:text-dark-text flex items-center gap-2 px-2">
              <Calendar size={20} className="text-nature-leaf" />
              7-Day Schedule
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {results.daily_schedule.map((day, i) => {
                const irrigate = day.recommendation.irrigate;
                return (
                  <Card 
                    key={i} 
                    className={`
                      border-2 transition-all 
                      ${irrigate 
                        ? 'border-nature-sky/30 shadow-premium bg-gradient-to-br from-white to-nature-sky/5 dark:from-dark-card dark:to-nature-sky/5' 
                        : 'border-transparent'}
                    `}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="font-bold text-nature-soil dark:text-dark-text text-lg">
                          {new Date(day.date).toLocaleDateString('en-IN', { weekday: 'long' })}
                        </p>
                        <p className="text-sm text-nature-sage">{new Date(day.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                      </div>
                      {irrigate ? (
                        <div className="p-2 bg-nature-sky/20 text-nature-sky rounded-xl animate-pulse">
                          <Droplets size={24} />
                        </div>
                      ) : (
                        <div className="p-2 bg-nature-leaf/20 text-nature-leaf rounded-xl">
                          <CheckCircle2 size={24} />
                        </div>
                      )}
                    </div>

                    <div className="space-y-3 mb-6">
                      <div className="flex items-center justify-between py-2 border-b border-nature-fog dark:border-white/5">
                        <div className="flex items-center gap-2 text-nature-sage text-sm">
                          <Thermometer size={16} />
                          <span>Temperature</span>
                        </div>
                        <span className="font-bold">{day.weather.tmax}°C</span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-nature-fog dark:border-white/5">
                        <div className="flex items-center gap-2 text-nature-sage text-sm">
                          <CloudRain size={16} />
                          <span>Rainfall</span>
                        </div>
                        <span className="font-bold">{day.weather.rainfall_mm} mm</span>
                      </div>
                    </div>

                    <div className="mt-auto">
                      {irrigate ? (
                        <div className="p-4 bg-nature-sky/10 rounded-2xl">
                          <p className="text-[10px] font-bold text-nature-sky uppercase tracking-widest mb-1">Recommendation</p>
                          <p className="font-bold text-nature-sky text-lg">Irrigate {day.recommendation.amount_mm}mm</p>
                          <p className="text-xs text-nature-sky/80 mt-1">Approx. {day.recommendation.amount_liters_per_acre.toLocaleString()} Liters per acre</p>
                        </div>
                      ) : (
                        <div className="p-4 bg-nature-leaf/10 rounded-2xl">
                          <p className="text-[10px] font-bold text-nature-leaf uppercase tracking-widest mb-1">Recommendation</p>
                          <p className="font-bold text-nature-leaf text-lg">No Water Needed</p>
                          <p className="text-xs text-nature-leaf/80 mt-1">Rainfall covers crop demand.</p>
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Irrigation;
