import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import {
  Upload,
  Leaf,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  X,
  Camera,
  History,
  ShieldCheck,
  Stethoscope
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const Pest = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    axios.get(`${API_BASE}/pest/history`)
      .then(res => setHistory(Array.isArray(res.data) ? res.data.slice(0, 5) : []))
      .catch(() => null);
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
      const response = await axios.post(`${API_BASE}/pest/detect`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResult(response.data);
      localStorage.setItem('lastPestResult', JSON.stringify(response.data));
    } catch (err) {
      setError(err.response?.data?.detail || 'Error connecting to backend.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setSelectedFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <section>
        <h1 className="text-3xl font-bold text-nature-soil dark:text-dark-text mb-2 text-center md:text-left">Pest Detection</h1>
        <p className="text-nature-sage dark:text-dark-muted text-center md:text-left">Upload a photo of your crop leaf to identify diseases instantly.</p>
      </section>

      <div className="max-w-3xl mx-auto space-y-8">
        {/* Upload Area */}
        <section>
          {!preview ? (
            <div
              onClick={() => fileInputRef.current.click()}
              className="group border-4 border-dashed border-nature-fog dark:border-white/10 rounded-4xl p-12 flex flex-col items-center justify-center gap-6 cursor-pointer hover:border-nature-leaf/30 hover:bg-nature-leaf/5 transition-all duration-300 min-h-[350px] bg-white dark:bg-dark-card"
            >
              <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
              <div className="w-24 h-24 rounded-3xl bg-nature-leaf/10 text-nature-leaf flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Camera size={48} />
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-bold text-nature-soil dark:text-dark-text mb-2">Take a Photo</h3>
                <p className="text-nature-sage dark:text-dark-muted">or click to browse your gallery</p>
              </div>
              <div className="flex gap-4 mt-4">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-nature-soil/40 dark:text-dark-muted">
                  <CheckCircle2 size={14} /> Clear Focus
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-nature-soil/40 dark:text-dark-muted">
                  <CheckCircle2 size={14} /> Good Lighting
                </div>
              </div>
            </div>
          ) : (
            <Card className="p-4 relative overflow-hidden">
              <div className="aspect-video w-full rounded-2xl overflow-hidden bg-nature-earth dark:bg-dark-bg relative">
                <img src={preview} alt="Leaf Preview" className="w-full h-full object-contain" />
                {!result && (
                  <button
                    onClick={reset}
                    className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-xl hover:bg-black/70 transition-colors"
                  >
                    <X size={24} />
                  </button>
                )}
              </div>
              {!result && (
                <div className="mt-6 flex flex-col gap-4">
                  <Button
                    variant="primary"
                    className="w-full text-xl py-6"
                    onClick={detectDisease}
                    disabled={loading}
                    icon={Stethoscope}
                  >
                    {loading ? 'Analyzing Leaf...' : 'Start Analysis'}
                  </Button>
                  <Button variant="ghost" onClick={reset} disabled={loading}>
                    Choose Different Photo
                  </Button>
                </div>
              )}
            </Card>
          )}
        </section>

        {/* Results Area */}
        {result && (
          <section className="animate-slide-up">
            {result.disease?.toLowerCase().includes('healthy') ? (
              <Card className="border-t-8 border-nature-leaf bg-gradient-to-br from-white to-nature-leaf/5 dark:from-dark-card dark:to-nature-leaf/5">
                <div className="flex flex-col items-center text-center gap-4 py-6">
                  <div className="w-20 h-20 bg-nature-leaf/10 text-nature-leaf rounded-full flex items-center justify-center">
                    <CheckCircle2 size={48} />
                  </div>
                  <h2 className="text-3xl font-bold text-nature-leaf">Your Crop is Healthy!</h2>
                  <p className="text-lg text-nature-sage dark:text-dark-muted max-w-md">
                    No signs of disease or pest infestation were detected in this image. Keep up the good work!
                  </p>
                  <Button variant="outline" className="mt-4" onClick={reset}>Check Another Leaf</Button>
                </div>
              </Card>
            ) : result.disease === 'Unknown' || (result.confidence && result.confidence < 0.5) ? (
              <Card className="border-t-8 border-nature-wheat bg-gradient-to-br from-white to-nature-wheat/5 dark:from-dark-card dark:to-nature-wheat/5">
                <div className="flex flex-col items-center text-center gap-4 py-6">
                  <div className="w-20 h-20 bg-nature-wheat/10 text-nature-wheat rounded-full flex items-center justify-center">
                    <HelpCircle size={48} />
                  </div>
                  <h2 className="text-3xl font-bold text-nature-wheat">Uncertain Result</h2>
                  <p className="text-lg text-nature-sage dark:text-dark-muted max-w-md">
                    The image is not clear enough for a confident diagnosis. Please try again with a clearer photo of the affected area.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mt-6">
                    <div className="p-4 bg-white/50 dark:bg-dark-bg/50 rounded-2xl border border-nature-fog dark:border-white/5">
                      <p className="text-xs font-bold text-nature-soil/40 uppercase mb-2">Tip 1</p>
                      <p className="text-sm font-medium">Avoid shadows</p>
                    </div>
                    <div className="p-4 bg-white/50 dark:bg-dark-bg/50 rounded-2xl border border-nature-fog dark:border-white/5">
                      <p className="text-xs font-bold text-nature-soil/40 uppercase mb-2">Tip 2</p>
                      <p className="text-sm font-medium">Focus on the leaf</p>
                    </div>
                    <div className="p-4 bg-white/50 dark:bg-dark-bg/50 rounded-2xl border border-nature-fog dark:border-white/5">
                      <p className="text-xs font-bold text-nature-soil/40 uppercase mb-2">Tip 3</p>
                      <p className="text-sm font-medium">Use bright light</p>
                    </div>
                  </div>
                  <Button variant="primary" className="mt-6" onClick={reset}>Retry Upload</Button>
                </div>
              </Card>
            ) : (
              <Card className="border-t-8 border-red-500 overflow-hidden">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                  <div className="w-full md:w-1/3 aspect-square rounded-2xl overflow-hidden bg-red-50 border-4 border-red-100">
                    <img src={preview} alt="Result" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 space-y-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <Badge variant="danger" className="mb-2">Disease Detected</Badge>
                        <h2 className="text-4xl font-bold text-nature-soil dark:text-dark-text">{result.disease || 'Unknown Disease'}</h2>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-nature-soil/40 uppercase mb-1">Severity</p>
                        <Badge variant={result.severity === 'High' ? 'danger' : result.severity === 'Medium' ? 'warning' : 'success'}>
                          {result.severity || 'Low'}
                        </Badge>
                      </div>
                    </div>

                    <div className="p-6 bg-red-50 dark:bg-red-900/10 rounded-3xl space-y-4">
                      <div className="flex gap-4">
                        <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 text-red-500 rounded-2xl flex items-center justify-center flex-shrink-0">
                          <Stethoscope size={24} />
                        </div>
                        <div>
                          <p className="font-bold text-red-800 dark:text-red-400">Treatment Plan</p>
                          <p className="text-red-700 dark:text-red-300 leading-relaxed">{result.treatment || 'Consult an agricultural expert for specific treatment advice.'}</p>
                        </div>
                      </div>
                      <div className="flex gap-4 border-t border-red-200 dark:border-red-800 pt-4">
                        <div className="w-12 h-12 bg-nature-leaf/10 text-nature-leaf rounded-2xl flex items-center justify-center flex-shrink-0">
                          <ShieldCheck size={24} />
                        </div>
                        <div>
                          <p className="font-bold text-nature-leaf dark:text-nature-sky">Prevention Tips</p>
                          <p className="text-nature-sage dark:text-dark-muted leading-relaxed">{result.prevention || 'Ensure proper crop rotation and soil health monitoring.'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <Button variant="primary" className="flex-1" onClick={reset}>Check Another Plant</Button>
                      <Button variant="outline" onClick={() => window.print()}>Save Report</Button>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </section>
        )}

        {/* History Section */}
        {history.length > 0 && !result && (
          <section className="space-y-4">
            <h3 className="text-xl font-bold text-nature-soil dark:text-dark-text flex items-center gap-2 px-2">
              <History size={20} className="text-nature-leaf" />
              Recent Scans
            </h3>
            <div className="space-y-3">
              {history.map((h, i) => {
                const resultData = h?.output_data ? JSON.parse(h.output_data) : {};
                const diseaseName = resultData.disease || 'Unknown Result';
                const severity = resultData.severity || 'Normal';
                const isHealthy = diseaseName.toLowerCase().includes('healthy');

                return (
                  <div
                    key={i}
                    className="premium-card p-4 flex items-center justify-between hover:scale-[1.01] cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-xl ${isHealthy ? 'bg-nature-leaf/10 text-nature-leaf' : 'bg-red-100 text-red-500'}`}>
                        <Leaf size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-nature-soil dark:text-dark-text">{diseaseName}</p>
                        <p className="text-xs text-nature-sage">{h?.timestamp ? new Date(h.timestamp).toLocaleDateString() : 'Date missing'}</p>
                      </div>
                    </div>
                    <Badge variant={severity === 'High' ? 'danger' : severity === 'Medium' ? 'warning' : 'success'}>
                      {severity}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </section>
        )}

      </div>
    </div>
  );
};

export default Pest;
