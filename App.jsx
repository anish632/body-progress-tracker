import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Camera, Target, TrendingUp, RefreshCw, Plus, X, Volume2, Trash2 } from 'lucide-react';

// Storage service
const loadData = (key, defaultValue) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Error loading data:', error);
    return defaultValue;
  }
};

const saveData = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Error saving data:', error);
  }
};

// Metric Card Component
const MetricCard = ({ title, value, progress, colorClass }) => (
  <div className="bg-gray-700 p-3 rounded-lg shadow-sm border border-gray-600">
    <div>
      <h3 className="text-xs font-medium text-gray-300">{title}</h3>
      <p className="text-lg font-bold text-gray-100 mt-1">{value}</p>
    </div>
    {progress !== undefined && (
      <div className="w-full bg-gray-600 rounded-full h-2 mt-2">
        <div className={`${colorClass} h-2 rounded-full transition-all duration-300`} style={{ width: `${Math.min(100, progress)}%` }}></div>
      </div>
    )}
  </div>
);

// Metrics Dashboard Component
const MetricsDashboard = ({ latestEntry, targets, onSetTargets }) => {
  const weight = latestEntry?.weight ?? 0;
  const bodyFat = latestEntry?.bodyFat ?? 0;
  
  const leanMass = weight > 0 && bodyFat > 0 ? weight * (1 - bodyFat / 100) : 0;
  const fatMass = weight > 0 && bodyFat > 0 ? weight * (bodyFat / 100) : 0;

  const weightProgress = targets.weight > 0 ? (weight / targets.weight) * 100 : 0;
  const bodyFatProgress = targets.bodyFat > 0 ? (targets.bodyFat / bodyFat) * 100 : 0;

  return (
    <div className="bg-gray-700 p-4 rounded-xl shadow-lg border border-gray-600">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-semibold text-gray-100">Current Stats</h2>
        <button 
          onClick={onSetTargets} 
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-200 bg-gray-600 rounded-lg hover:bg-gray-500 transition-colors"
        >
          <Target size={14} />
          Set Targets
        </button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard title="Weight (lbs)" value={weight.toFixed(1)} progress={weightProgress} colorClass="bg-gray-500" />
        <MetricCard title="Body Fat (%)" value={bodyFat.toFixed(1)} progress={100 - bodyFatProgress} colorClass="bg-gray-500" />
        <MetricCard title="Lean Mass (lbs)" value={leanMass.toFixed(1)} colorClass="bg-gray-500" />
        <MetricCard title="Fat Mass (lbs)" value={fatMass.toFixed(1)} colorClass="bg-gray-500" />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="text-center p-2 bg-gray-600 rounded-lg">
          <p className="text-xs text-gray-300">Weight Target</p>
          <p className="font-bold text-gray-100">{targets.weight > 0 ? `${targets.weight.toFixed(1)} lbs` : 'Not Set'}</p>
        </div>
        <div className="text-center p-2 bg-gray-600 rounded-lg">
          <p className="text-xs text-gray-300">Body Fat Target</p>
          <p className="text-gray-100 font-bold">{targets.bodyFat > 0 ? `${targets.bodyFat.toFixed(1)} %` : 'Not Set'}</p>
        </div>
      </div>
    </div>
  );
};

// Data Entry Form Component
const DataEntryForm = ({ onAddEntry }) => {
  const [formData, setFormData] = useState({ weight: '', bodyFat: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.weight && formData.bodyFat) {
      onAddEntry({
        weight: parseFloat(formData.weight),
        bodyFat: parseFloat(formData.bodyFat)
      });
      setFormData({ weight: '', bodyFat: '' });
    }
  };

  return (
    <div className="bg-gray-700 p-4 rounded-xl shadow-lg border border-gray-600">
      <h2 className="text-lg font-semibold mb-3 text-gray-100">Add New Entry</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1">Weight (lbs)</label>
          <input
            type="number"
            step="0.1"
            value={formData.weight}
            onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-600 bg-gray-600 text-gray-100 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent text-sm placeholder-gray-400"
            placeholder="155.5"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1">Body Fat (%)</label>
          <input
            type="number"
            step="0.1"
            value={formData.bodyFat}
            onChange={(e) => setFormData(prev => ({ ...prev, bodyFat: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-600 bg-gray-600 text-gray-100 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent text-sm placeholder-gray-400"
            placeholder="15.2"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-500 transition-all font-medium text-sm"
        >
          Add Entry
        </button>
      </form>
    </div>
  );
};

// Progress Chart Component
const ProgressChart = ({ data }) => {
  if (data.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500">
        <TrendingUp size={32} className="mx-auto mb-2 text-gray-300" />
        <p className="text-sm">No data yet. Add your first entry to see your progress!</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis 
          dataKey="date" 
          stroke="#6b7280"
          fontSize={10}
          tickFormatter={(date) => new Date(date).toLocaleDateString()}
        />
        <YAxis stroke="#6b7280" fontSize={10} />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'white', 
            border: '1px solid #e5e7eb',
            borderRadius: '8px'
          }}
          labelFormatter={(date) => new Date(date).toLocaleDateString()}
        />
        <Line 
          type="monotone" 
          dataKey="weight" 
          stroke="#8b5cf6" 
          strokeWidth={2}
          dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 3 }}
        />
        <Line 
          type="monotone" 
          dataKey="bodyFat" 
          stroke="#10b981" 
          strokeWidth={2}
          dot={{ fill: '#10b981', strokeWidth: 2, r: 3 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

// Photo Gallery Component
const PhotoGallery = ({ photos, onAddPhoto, onDeletePhoto }) => {
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => onAddPhoto(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="bg-gray-700 p-4 rounded-xl shadow-lg border border-gray-600">
      <h2 className="text-lg font-semibold mb-3 text-gray-100">Progress Photos</h2>
      <div className="mb-3">
        <label className="cursor-pointer inline-flex items-center gap-1 px-3 py-1.5 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-all text-sm">
          <Camera size={14} />
          Add Photo
          <input
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            className="hidden"
          />
        </label>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {photos.map((photo, index) => (
          <div key={index} className="relative group">
            <img
              src={photo.dataUrl}
              alt={`Progress photo ${index + 1}`}
              className="w-full h-24 object-cover rounded-lg"
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg flex items-center justify-center">
              <span className="text-white opacity-0 group-hover:opacity-100 text-xs mb-6">
                {new Date(photo.date).toLocaleDateString()}
              </span>
              <button
                onClick={() => onDeletePhoto(index)}
                className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-700"
                title="Delete photo"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Motivation Card Component
const MotivationCard = ({ quote, onNewQuote }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const speakQuote = () => {
    if ('speechSynthesis' in window) {
      if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        return;
      }

      const utterance = new SpeechSynthesisUtterance(quote.text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 0.8;
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="bg-gray-700 p-4 rounded-xl shadow-lg text-white relative overflow-hidden">
      {/* Breathtaking Mountain Valley Background */}
      <div className="absolute inset-0 opacity-30">
        <svg 
          className="w-full h-full rounded-xl"
          viewBox="0 0 400 300" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="sky" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{stopColor: '#1e40af', stopOpacity: 1}} />
              <stop offset="50%" style={{stopColor: '#3b82f6', stopOpacity: 1}} />
              <stop offset="100%" style={{stopColor: '#93c5fd', stopOpacity: 1}} />
            </linearGradient>
            <linearGradient id="distantMountain" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{stopColor: '#e5e7eb', stopOpacity: 1}} />
              <stop offset="50%" style={{stopColor: '#d1d5db', stopOpacity: 1}} />
              <stop offset="100%" style={{stopColor: '#9ca3af', stopOpacity: 1}} />
            </linearGradient>
            <linearGradient id="foregroundMountain" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{stopColor: '#374151', stopOpacity: 1}} />
              <stop offset="50%" style={{stopColor: '#1f2937', stopOpacity: 1}} />
              <stop offset="100%" style={{stopColor: '#111827', stopOpacity: 1}} />
            </linearGradient>
            <linearGradient id="forest" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{stopColor: '#166534', stopOpacity: 1}} />
              <stop offset="50%" style={{stopColor: '#15803d', stopOpacity: 1}} />
              <stop offset="100%" style={{stopColor: '#16a34a', stopOpacity: 1}} />
            </linearGradient>
            <linearGradient id="valley" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{stopColor: '#22c55e', stopOpacity: 1}} />
              <stop offset="50%" style={{stopColor: '#16a34a', stopOpacity: 1}} />
              <stop offset="100%" style={{stopColor: '#15803d', stopOpacity: 1}} />
            </linearGradient>
            <linearGradient id="river" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{stopColor: '#3b82f6', stopOpacity: 0.8}} />
              <stop offset="100%" style={{stopColor: '#1d4ed8', stopOpacity: 0.9}} />
            </linearGradient>
            <radialGradient id="sunGlow" cx="30%" cy="20%" r="60%">
              <stop offset="0%" style={{stopColor: '#fbbf24', stopOpacity: 0.6}} />
              <stop offset="70%" style={{stopColor: '#f59e0b', stopOpacity: 0.3}} />
              <stop offset="100%" style={{stopColor: '#f59e0b', stopOpacity: 0}} />
            </radialGradient>
          </defs>
          
          {/* Sky Background */}
          <rect width="400" height="300" fill="url(#sky)"/>
          
          {/* Sun Glow Effect */}
          <circle cx="120" cy="60" r="50" fill="url(#sunGlow)"/>
          
          {/* Clouds */}
          <ellipse cx="80" cy="40" rx="25" ry="15" fill="white" opacity="0.9"/>
          <ellipse cx="320" cy="50" rx="20" ry="12" fill="white" opacity="0.8"/>
          
          {/* Distant Snow-Capped Peaks */}
          <polygon points="0,180 50,120 100,150 150,100 200,130 250,90 300,120 350,80 400,100 400,300 0,300" fill="white" opacity="0.95"/>
          <polygon points="0,200 30,160 60,180 90,140 120,160 150,120 180,140 210,100 240,120 270,80 300,100 330,60 360,80 400,90 400,300 0,300" fill="url(#distantMountain)"/>
          
          {/* Left Foreground Mountain */}
          <polygon points="0,300 0,140 80,80 120,120 160,60 200,100 240,40 280,80 320,20 360,60 400,40 400,300" fill="url(#foregroundMountain)"/>
          
          {/* Right Foreground Mountain */}
          <polygon points="200,300 200,120 240,80 280,120 320,60 360,100 400,40 400,300" fill="url(#foregroundMountain)"/>
          
          {/* Forest Cover on Mountains */}
          <polygon points="0,300 0,160 80,100 120,140 160,80 200,120 240,60 280,100 320,40 360,80 400,60 400,300" fill="url(#forest)" opacity="0.7"/>
          <polygon points="200,300 200,140 240,100 280,140 320,80 360,120 400,60 400,300" fill="url(#forest)" opacity="0.7"/>
          
          {/* Valley Floor */}
          <polygon points="0,300 0,200 50,180 100,200 150,180 200,200 250,180 300,200 350,180 400,200 400,300" fill="url(#valley)"/>
          
          {/* Winding River */}
          <path d="M 50,190 Q 100,180 150,190 Q 200,200 250,190 Q 300,180 350,190" stroke="url(#river)" strokeWidth="8" fill="none" opacity="0.8"/>
          <path d="M 50,190 Q 100,180 150,190 Q 200,200 250,190 Q 300,180 350,190" stroke="url(#river)" strokeWidth="4" fill="none" opacity="0.9"/>
          
          {/* River Reflections */}
          <path d="M 50,190 Q 100,180 150,190 Q 200,200 250,190 Q 300,180 350,190" stroke="#3b82f6" strokeWidth="1" fill="none" opacity="0.6"/>
          
          {/* Mountain Details - Ridges and Shadows */}
          <path d="M 20,200 L 60,160 L 100,180 L 140,140 L 180,160 L 220,120 L 260,140 L 300,100 L 340,120 L 380,80" 
                stroke="#1f2937" strokeWidth="1" fill="none" opacity="0.4"/>
          <path d="M 220,200 L 240,160 L 280,180 L 320,140 L 360,160 L 400,120" 
                stroke="#1f2937" strokeWidth="1" fill="none" opacity="0.4"/>
          
          {/* Motivational Compass */}
          <g transform="translate(200,280)">
            <circle cx="0" cy="0" r="12" fill="none" stroke="#fbbf24" strokeWidth="2" opacity="0.9"/>
            <path d="M-8,0 L8,0 M0,-8 L0,8" stroke="#fbbf24" strokeWidth="1.5" opacity="0.9"/>
            <path d="M-6,-6 L0,-10 L6,-6" stroke="#fbbf24" strokeWidth="1.5" fill="none" opacity="0.9"/>
            <circle cx="0" cy="0" r="2" fill="#fbbf24" opacity="0.9"/>
          </g>
        </svg>
      </div>
      
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z"/>
            </svg>
          </div>
          <h2 className="text-lg font-semibold">Daily Motivation</h2>
        </div>
        <blockquote className="text-sm mb-3 italic">"{quote.text}"</blockquote>
        <p className="text-xs opacity-90 mb-3">— {quote.author}</p>
        <div className="flex gap-2">
          <button
            onClick={onNewQuote}
            className="flex items-center gap-1 px-3 py-1.5 bg-gray-600 rounded-lg hover:bg-gray-500 transition-colors text-sm"
          >
            <RefreshCw size={14} />
            New Quote
          </button>
          <button
            onClick={speakQuote}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all text-sm ${
              isSpeaking 
                ? 'bg-gray-500 text-gray-800' 
                : 'bg-gray-600 hover:bg-gray-500'
            }`}
            title={isSpeaking ? "Stop reading" : "Read quote aloud"}
          >
            <Volume2 size={14} />
            {isSpeaking ? "Stop" : "Read"}
          </button>
        </div>
      </div>
    </div>
  );
};

// Target Modal Component
const TargetModal = ({ currentTargets, onSetTargets, onClose }) => {
  const [targets, setTargets] = useState(currentTargets);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSetTargets(targets);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-xl p-4 w-full max-w-sm border border-slate-700">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold text-gray-100">Set Targets</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-300">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">Target Weight (lbs)</label>
            <input
              type="number"
              step="0.1"
              value={targets.weight}
              onChange={(e) => setTargets(prev => ({ ...prev, weight: parseFloat(e.target.value) || 0 }))}
              className="w-full px-3 py-2 border border-slate-600 bg-slate-700 text-gray-100 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">Target Body Fat (%)</label>
            <input
              type="number"
              step="0.1"
              value={targets.bodyFat}
              onChange={(e) => setTargets(prev => ({ ...prev, bodyFat: parseFloat(e.target.value) || 0 }))}
              className="w-full px-3 py-2 border border-slate-600 bg-slate-700 text-gray-100 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-teal-600 to-teal-700 text-white py-2 px-3 rounded-lg hover:from-teal-700 hover:to-teal-800 transition-all text-sm"
            >
              Save Targets
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-600 text-gray-100 py-2 px-3 rounded-lg hover:bg-slate-500 transition-colors text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Main App Component
const App = () => {
  const [data, setData] = useState(() => loadData('dataEntries', []));
  const [targets, setTargets] = useState(() => loadData('targets', { weight: 0, bodyFat: 0 }));
  const [photos, setPhotos] = useState(() => loadData('photos', []));
  const [quote, setQuote] = useState({ text: 'Your body can stand almost anything. It\'s your mind you have to convince.', author: 'Unknown' });
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchQuote = useCallback(() => {
    const quotes = [
      { text: 'The only bad workout is the one that didn\'t happen.', author: 'Unknown' },
      { text: 'Your body can stand almost anything. It\'s your mind you have to convince.', author: 'Unknown' },
      { text: 'Strength does not come from the physical capacity. It comes from an indomitable will.', author: 'Mahatma Gandhi' },
      { text: 'The difference between the impossible and the possible lies in determination.', author: 'Tommy Lasorda' },
      { text: 'Don\'t wish for it. Work for it.', author: 'Unknown' }
    ];
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    setQuote(randomQuote);
  }, []);

  useEffect(() => {
    fetchQuote();
  }, [fetchQuote]);

  useEffect(() => {
    saveData('dataEntries', data);
  }, [data]);

  useEffect(() => {
    saveData('targets', targets);
  }, [targets]);

  useEffect(() => {
    saveData('photos', photos);
  }, [photos]);

  const handleAddEntry = (entry) => {
    const newEntry = { ...entry, date: new Date().toISOString().split('T')[0] };
    setData(prevData => [...prevData, newEntry].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
  };

  const handleAddPhoto = (photoDataUrl) => {
    const newPhoto = { dataUrl: photoDataUrl, date: new Date().toISOString() };
    setPhotos(prevPhotos => [newPhoto, ...prevPhotos]);
  };

  const handleDeletePhoto = (index) => {
    setPhotos(prevPhotos => prevPhotos.filter((_, i) => i !== index));
  };
  
  const handleSetTargets = (newTargets) => {
    setTargets(newTargets);
    setIsModalOpen(false);
  };

  const latestEntry = useMemo(() => data.length > 0 ? data[data.length - 1] : null, [data]);

  return (
    <div className="min-h-screen bg-gray-800 text-gray-100 font-sans">
      <div className="max-w-7xl mx-auto p-4">
        <header className="mb-4 text-center">
          <h1 className="text-3xl font-bold text-gray-200 mb-1">Tracker</h1>
          <p className="text-sm text-gray-300">Track your fitness journey with ease</p>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <MetricsDashboard latestEntry={latestEntry} targets={targets} onSetTargets={() => setIsModalOpen(true)} />
            <div className="bg-gray-700 p-4 rounded-xl shadow-lg border border-gray-600">
              <h2 className="text-lg font-semibold mb-3 text-gray-100">Progress Over Time</h2>
              <ProgressChart data={data} />
            </div>
            <PhotoGallery photos={photos} onAddPhoto={handleAddPhoto} onDeletePhoto={handleDeletePhoto} />
          </div>

          <div className="lg:col-span-1 space-y-4">
            <DataEntryForm onAddEntry={handleAddEntry} />
            <MotivationCard quote={quote} onNewQuote={fetchQuote} />
          </div>
        </main>
      </div>
      {isModalOpen && <TargetModal currentTargets={targets} onSetTargets={handleSetTargets} onClose={() => setIsModalOpen(false)} />}
    </div>
  );
};

export default App;
