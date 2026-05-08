import React, { useState, useEffect } from 'react';

import {
  CloudSun,
  Droplets,
  TrendingUp,
  Bug,
  Sprout,
  ArrowRight,
  ChevronRight,
  Edit3
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';

const Dashboard = ({ profile, setProfile, navigateTo, fetchSummaries, cropData, irrigationData, marketData }) => {
  const [isEditing, setIsEditing] = useState(!profile);
  const [form, setForm] = useState(profile || {
    name: '', location: '', state: '', crop: '', soilType: 'Loamy', landSize: '', sowingDate: ''
  });

  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Morning';
    if (hour < 17) return 'Afternoon';
    return 'Evening';
  };

  const handleSave = () => {
    setProfile(form);
    setIsEditing(false);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Section */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-nature-soil dark:text-dark-text">
            Good {getTimeOfDay()}, {profile?.name || 'Farmer'}
          </h1>
          <p className="text-lg text-nature-sage dark:text-dark-muted mt-2">
            Here's what's happening on your farm today.
          </p>
        </div>

        {profile && (
          <div className="flex items-center gap-4 bg-white/50 dark:bg-dark-card/50 backdrop-blur-sm p-4 rounded-2xl border border-nature-fog dark:border-white/5">
            <div className="bg-nature-sky/20 p-3 rounded-xl text-nature-sky">
              <CloudSun size={24} />
            </div>
            <div>
              <div className="text-sm font-medium text-nature-soil/60 dark:text-dark-muted uppercase tracking-wider">
                {profile.location}
              </div>
              <div className="text-xl font-bold text-nature-soil dark:text-dark-text">
                32°C <span className="text-sm font-normal text-nature-sage">Cloudy</span>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Hero Section - Crop Health */}
      <section>
        <Card className="overflow-hidden relative border-none bg-gradient-to-br from-nature-leaf to-nature-leaf/80 text-white">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Sprout size={200} />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1 space-y-4">
              <Badge variant="primary" className="bg-white/20 text-white border-none">
                Live Status: {profile?.crop || 'No Crop Selected'}
              </Badge>
              <h2 className="text-3xl font-bold">Your crop looks healthy today.</h2>
              <p className="text-white/80 text-lg leading-relaxed max-w-xl">
                The current weather is favorable for your {profile?.crop || 'crops'}. Keep monitoring the soil moisture.
              </p>
              <div className="pt-4">
                <Button
                  variant="secondary"
                  onClick={() => navigateTo('Crop')}
                  icon={ArrowRight}
                >
                  View Details
                </Button>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center p-6 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 w-full md:w-auto min-w-[200px]">
              <div className="relative w-32 h-32 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="58"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    className="text-white/20"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="58"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={364}
                    strokeDashoffset={364 - (364 * 85) / 100}
                    strokeLinecap="round"
                    className="text-white"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold">85%</span>
                  <span className="text-[10px] uppercase font-bold tracking-widest opacity-70">Health</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* Quick Insights Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Irrigation Insight */}
        <Card
          className="flex flex-col hover:border-nature-sky/30"
          onClick={() => navigateTo('Water')}
        >
          <div className="flex justify-between items-start mb-6">
            <div className="p-3 bg-nature-sky/10 text-nature-sky rounded-2xl">
              <Droplets size={24} />
            </div>
            <div className="text-nature-sage hover:text-nature-sky transition-colors">
              <ChevronRight size={20} />
            </div>
          </div>
          <h3 className="text-sm font-bold text-nature-soil/50 dark:text-dark-muted uppercase tracking-widest mb-2">Irrigation</h3>
          <div className="flex-1">
            {irrigationData.loading ? (
              <div className="animate-pulse space-y-2">
                <div className="h-6 bg-nature-fog dark:bg-white/5 rounded-md w-3/4"></div>
                <div className="h-4 bg-nature-fog dark:bg-white/5 rounded-md w-1/2"></div>
              </div>
            ) : irrigationData.data?.daily_schedule?.[0]?.recommendation?.irrigate ? (
              <div className="space-y-1">
                <p className="text-xl font-bold text-nature-sky">
                  {irrigationData.data.daily_schedule[0].recommendation.amount_mm} mm needed
                </p>
                <p className="text-sm text-nature-sage">Irrigate in the evening.</p>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-xl font-bold text-nature-leaf">Not needed today</p>
                <p className="text-sm text-nature-sage">Rain expected soon.</p>
              </div>
            )}
          </div>
        </Card>

        {/* Market Insight */}
        <Card
          className="flex flex-col hover:border-nature-wheat/30"
          onClick={() => navigateTo('Market')}
        >
          <div className="flex justify-between items-start mb-6">
            <div className="p-3 bg-nature-wheat/10 text-nature-wheat rounded-2xl">
              <TrendingUp size={24} />
            </div>
            <div className="text-nature-sage hover:text-nature-wheat transition-colors">
              <ChevronRight size={20} />
            </div>
          </div>
          <h3 className="text-sm font-bold text-nature-soil/50 dark:text-dark-muted uppercase tracking-widest mb-2">Market Trend</h3>
          <div className="flex-1">
            {marketData.loading ? (
              <div className="animate-pulse space-y-2">
                <div className="h-6 bg-nature-fog dark:bg-white/5 rounded-md w-3/4"></div>
                <div className="h-4 bg-nature-fog dark:bg-white/5 rounded-md w-1/2"></div>
              </div>
            ) : marketData.data ? (
              <div className="space-y-1">
                <p className="text-xl font-bold text-nature-wheat">
                  Prices {marketData.data.summary.price_trend}
                </p>
                <p className="text-sm text-nature-sage">Best time to sell: {new Date(marketData.data.summary.best_day_to_sell).toLocaleDateString()}</p>
              </div>
            ) : (
              <p className="text-sm text-nature-sage">Checking trends...</p>
            )}
          </div>
        </Card>

        {/* Pest Insight */}
        <Card
          className="flex flex-col hover:border-red-400/30"
          onClick={() => navigateTo('Pest')}
        >
          <div className="flex justify-between items-start mb-6">
            <div className="p-3 bg-red-100 text-red-500 dark:bg-red-900/20 rounded-2xl">
              <Bug size={24} />
            </div>
            <div className="text-nature-sage hover:text-red-500 transition-colors">
              <ChevronRight size={20} />
            </div>
          </div>
          <h3 className="text-sm font-bold text-nature-soil/50 dark:text-dark-muted uppercase tracking-widest mb-2">Pest Risk</h3>
          <div className="flex-1 space-y-1">
            <p className="text-xl font-bold text-nature-leaf">Low Risk</p>
            <p className="text-sm text-nature-sage">No pests detected recently.</p>
          </div>
        </Card>

        {/* Crop Insight */}
        <Card
          className="flex flex-col hover:border-nature-leaf/30"
          onClick={() => navigateTo('Crop')}
        >
          <div className="flex justify-between items-start mb-6">
            <div className="p-3 bg-nature-leaf/10 text-nature-leaf rounded-2xl">
              <Sprout size={24} />
            </div>
            <div className="text-nature-sage hover:text-nature-leaf transition-colors">
              <ChevronRight size={20} />
            </div>
          </div>
          <h3 className="text-sm font-bold text-nature-soil/50 dark:text-dark-muted uppercase tracking-widest mb-2">Next Season</h3>
          <div className="flex-1">
            {cropData.loading ? (
              <div className="animate-pulse space-y-2">
                <div className="h-6 bg-nature-fog dark:bg-white/5 rounded-md w-3/4"></div>
                <div className="h-4 bg-nature-fog dark:bg-white/5 rounded-md w-1/2"></div>
              </div>
            ) : cropData.data ? (
              <div className="space-y-1">
                <p className="text-xl font-bold text-nature-leaf">
                  {cropData.data.recommendations[0]?.crop}
                </p>
                <p className="text-sm text-nature-sage">High profit potential.</p>
              </div>
            ) : (
              <p className="text-sm text-nature-sage">Loading advice...</p>
            )}
          </div>
        </Card>
      </section>

      {/* Profile Section */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-nature-soil dark:text-dark-text flex items-center gap-2">
            <Edit3 size={24} className="text-nature-leaf" />
            Your Farm Details
          </h2>
          {!isEditing && (
            <Button variant="ghost" onClick={() => setIsEditing(true)}>Edit Profile</Button>
          )}
        </div>

        <Card className={`${isEditing ? 'border-nature-leaf/30 shadow-premium' : ''}`}>
          {isEditing ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-4">
                <label className="block text-sm font-bold text-nature-soil/50 dark:text-dark-muted uppercase tracking-widest">Farmer Name</label>
                <input
                  className="w-full bg-nature-earth/50 dark:bg-dark-bg p-4 rounded-xl border border-nature-fog dark:border-white/10 outline-none focus:border-nature-leaf transition-all"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Ramesh Kumar"
                />
              </div>
              <div className="space-y-4">
                <label className="block text-sm font-bold text-nature-soil/50 dark:text-dark-muted uppercase tracking-widest">Location</label>
                <input
                  className="w-full bg-nature-earth/50 dark:bg-dark-bg p-4 rounded-xl border border-nature-fog dark:border-white/10 outline-none focus:border-nature-leaf transition-all"
                  value={form.location}
                  onChange={e => setForm({ ...form, location: e.target.value })}
                  placeholder="e.g. Pune, Maharashtra"
                />
              </div>
              <div className="space-y-4">
                <label className="block text-sm font-bold text-nature-soil/50 dark:text-dark-muted uppercase tracking-widest">State</label>
                <select
                  className="w-full bg-nature-earth/50 dark:bg-dark-bg p-4 rounded-xl border border-nature-fog dark:border-white/10 outline-none focus:border-nature-leaf transition-all"
                  value={form.state}
                  onChange={e => setForm({ ...form, state: e.target.value })}
                >
                  <option value="">Select State</option>
                  {["Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-4">
                <label className="block text-sm font-bold text-nature-soil/50 dark:text-dark-muted uppercase tracking-widest">Land Size (Acres)</label>
                <input
                  type="number"
                  className="w-full bg-nature-earth/50 dark:bg-dark-bg p-4 rounded-xl border border-nature-fog dark:border-white/10 outline-none focus:border-nature-leaf transition-all"
                  value={form.landSize}
                  onChange={e => setForm({ ...form, landSize: e.target.value })}
                  placeholder="e.g. 5.5"
                />
              </div>
              <div className="space-y-4">
                <label className="block text-sm font-bold text-nature-soil/50 dark:text-dark-muted uppercase tracking-widest">Soil Type</label>
                <select
                  className="w-full bg-nature-earth/50 dark:bg-dark-bg p-4 rounded-xl border border-nature-fog dark:border-white/10 outline-none focus:border-nature-leaf transition-all"
                  value={form.soilType}
                  onChange={e => setForm({ ...form, soilType: e.target.value })}
                >
                  {["Loamy", "Sandy", "Clay", "Red", "Black"].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-4">
                <label className="block text-sm font-bold text-nature-soil/50 dark:text-dark-muted uppercase tracking-widest">Current Crop</label>
                <input
                  className="w-full bg-nature-earth/50 dark:bg-dark-bg p-4 rounded-xl border border-nature-fog dark:border-white/10 outline-none focus:border-nature-leaf transition-all"
                  value={form.crop}
                  onChange={e => setForm({ ...form, crop: e.target.value })}
                  placeholder="e.g. Wheat"
                />
              </div>
              <div className="md:col-span-3 flex justify-end gap-4 pt-4 border-t border-nature-fog dark:border-white/10">
                <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                <Button variant="primary" onClick={handleSave}>Save Changes</Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div>
                <p className="text-xs font-bold text-nature-soil/40 dark:text-dark-muted uppercase tracking-widest mb-1">State</p>
                <p className="text-lg font-bold text-nature-soil dark:text-dark-text">{profile?.state || '--'}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-nature-soil/40 dark:text-dark-muted uppercase tracking-widest mb-1">Main Crop</p>
                <p className="text-lg font-bold text-nature-soil dark:text-dark-text">{profile?.crop || '--'}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-nature-soil/40 dark:text-dark-muted uppercase tracking-widest mb-1">Land Size</p>
                <p className="text-lg font-bold text-nature-soil dark:text-dark-text">{profile?.landSize || '--'} Acres</p>
              </div>
              <div>
                <p className="text-xs font-bold text-nature-soil/40 dark:text-dark-muted uppercase tracking-widest mb-1">Soil Type</p>
                <p className="text-lg font-bold text-nature-soil dark:text-dark-text">{profile?.soilType || '--'}</p>
              </div>
            </div>
          )}
        </Card>
      </section>
    </div>
  );
};

export default Dashboard;
