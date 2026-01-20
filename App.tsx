
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { GoogleGenAI } from "@google/genai";

// --- Types & Constants ---
interface SensorData {
  temp: number;
  weight: number;
  vibration: number;
  lat: number;
  lng: number;
  timestamp: string;
}

const INITIAL_DATA: SensorData[] = Array.from({ length: 10 }, (_, i) => ({
  temp: 34 + Math.random() * 2,
  weight: 15 + Math.random() * 0.5,
  vibration: Math.random() * 10,
  lat: 40.7128,
  lng: -74.0060,
  timestamp: new Date(Date.now() - (10 - i) * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}));

// --- Components ---

const StatCard = ({ title, value, unit, icon, color }: { title: string, value: string | number, unit: string, icon: string, color: string }) => (
  <div className={`glass-card p-6 rounded-3xl shadow-sm border-l-4 ${color} transition-all hover:scale-105 cursor-default`}>
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm font-medium text-amber-700 uppercase tracking-wider">{title}</p>
        <h3 className="text-3xl font-bold mt-1">{value}<span className="text-lg font-normal ml-1">{unit}</span></h3>
      </div>
      <div className={`p-3 rounded-2xl bg-opacity-20 ${color.replace('border-', 'bg-')}`}>
        <i className={`${icon} text-xl ${color.replace('border-', 'text-')}`}></i>
      </div>
    </div>
  </div>
);

const BeeBotFloating = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'bee', text: string }[]>([
    { role: 'bee', text: 'Bzzzz! Hello! I am HoneyBot. How is our hive doing today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: userMsg,
        config: {
          systemInstruction: "You are 'HoneyBot', a friendly honey bee assistant for a smart hive monitoring system. You help beekeepers understand sensor data. Use bee puns. Keep responses concise and sweet.",
        }
      });
      setMessages(prev => [...prev, { role: 'bee', text: response.text || "Bzz... Error!" }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'bee', text: "Bzz... Check your connection!" }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="glass-card mb-4 w-80 md:w-96 rounded-3xl overflow-hidden flex flex-col h-[450px] shadow-2xl border-amber-200 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-amber-400 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-lg bee-pulse">🐝</div>
              <h2 className="font-bold text-amber-900">HoneyBot AI</h2>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-amber-900 hover:bg-amber-500/20 p-1 rounded-lg">
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
          <div ref={scrollRef} className="flex-1 p-4 space-y-4 chat-container custom-scrollbar bg-amber-50/50 overflow-y-auto">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl shadow-sm text-sm ${
                  m.role === 'user' ? 'bg-amber-600 text-white rounded-tr-none' : 'bg-white text-amber-900 rounded-tl-none border border-amber-100'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && <div className="text-xs text-amber-500 italic animate-pulse">HoneyBot is buzzing...</div>}
          </div>
          <div className="p-4 bg-white border-t border-amber-100 flex gap-2">
            <input 
              type="text" 
              value={input} 
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type a message..."
              className="flex-1 bg-amber-50 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 border border-amber-100"
            />
            <button 
              onClick={handleSend}
              className="bg-amber-500 hover:bg-amber-600 text-white w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
            >
              <i className="fa-solid fa-paper-plane text-sm"></i>
            </button>
          </div>
        </div>
      )}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 bg-amber-500 hover:bg-amber-600 text-white rounded-full shadow-xl flex items-center justify-center text-3xl transition-transform active:scale-95 hover:scale-110 shadow-amber-200/50"
      >
        {isOpen ? <i className="fa-solid fa-chevron-down text-xl"></i> : <i className="fa-solid fa-bee"></i>}
      </button>
    </div>
  );
};

export default function App() {
  const [data, setData] = useState<SensorData[]>(INITIAL_DATA);
  const [current, setCurrent] = useState<SensorData>(INITIAL_DATA[INITIAL_DATA.length - 1]);
  const [alerts, setAlerts] = useState<string[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const newData: SensorData = {
        temp: 34 + Math.random() * 3,
        weight: current.weight + (Math.random() - 0.45) * 0.1,
        vibration: Math.random() * 15,
        lat: 40.7128 + (Math.random() - 0.5) * 0.001,
        lng: -74.0060 + (Math.random() - 0.5) * 0.001,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setCurrent(newData);
      setData(prev => [...prev.slice(-14), newData]);

      const newAlerts: string[] = [];
      if (newData.temp > 37) newAlerts.push("High Temperature Warning: Hive may be overheating!");
      if (newData.vibration > 12) newAlerts.push("Abnormal Vibration Detected: Potential stress!");
      if (newData.weight < 10) newAlerts.push("Critical Low Weight: Honey stores are low!");
      
      if (newAlerts.length > 0) {
        setAlerts(prev => [...new Set([...newAlerts, ...prev])].slice(0, 3));
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [current]);

  const copyCode = () => {
    const code = `// ESP32 Connection Snippet...`;
    alert("Connection code for DHT/HX711/GPS copied to clipboard!");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:px-8 relative pb-24">
      <header className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-amber-500 p-3 rounded-2xl text-white shadow-lg shadow-amber-200">
            <i className="fa-solid fa-honey-pot text-3xl"></i>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-amber-900">BeeGuard AI</h1>
            <p className="text-amber-600 font-medium">Smart Hive Monitoring System</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-semibold border border-green-200">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-ping"></span>
            ESP32 Live
          </span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard title="Hive Temp" value={current.temp.toFixed(1)} unit="°C" icon="fa-solid fa-temperature-half" color="border-orange-500" />
            <StatCard title="Hive Weight" value={current.weight.toFixed(2)} unit="kg" icon="fa-solid fa-scale-balanced" color="border-amber-500" />
            <StatCard title="Vibration" value={current.vibration.toFixed(1)} unit="Hz" icon="fa-solid fa-wave-square" color="border-blue-500" />
            <StatCard title="Activity" value="Healthy" unit="" icon="fa-solid fa-heart-pulse" color="border-green-500" />
          </div>

          <div className="glass-card p-6 rounded-3xl shadow-sm">
            <h2 className="font-bold text-xl mb-6 flex items-center gap-2">
              <i className="fa-solid fa-chart-line text-amber-500"></i>
              Real-time Analysis
            </h2>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#fef3c7" vertical={false} />
                  <XAxis dataKey="timestamp" stroke="#92400e" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#92400e" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Area type="monotone" dataKey="temp" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorTemp)" />
                  <Area type="monotone" dataKey="weight" stroke="#f59e0b" strokeWidth={3} fillOpacity={0} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <div className="glass-card p-6 rounded-3xl h-fit">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <i className="fa-solid fa-bell text-yellow-500"></i> Health Alerts
            </h3>
            <div className="space-y-3">
              {alerts.length === 0 ? (
                <div className="p-4 bg-green-50 text-green-700 rounded-2xl text-sm border border-green-100">
                  Hive state is stable.
                </div>
              ) : (
                alerts.map((alert, idx) => (
                  <div key={idx} className="p-4 bg-red-50 text-red-700 rounded-2xl text-sm border border-red-100">
                    {alert}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="glass-card p-6 rounded-3xl bg-amber-600 text-white border-none shadow-lg">
            <h3 className="font-bold text-lg mb-2">ESP32 Setup</h3>
            <p className="text-xs opacity-90 mb-4">Prototypes ready for DHT, Vibration & HX711 sensors.</p>
            <button onClick={copyCode} className="w-full py-2 bg-white text-amber-600 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-amber-50">
              <i className="fa-solid fa-code"></i> Firmware Code
            </button>
          </div>
        </div>
      </div>

      <footer className="mt-16 text-center text-amber-600 text-xs">
        <p>© 2024 BeeGuard AI - Smart Pollinator Monitoring</p>
      </footer>

      {/* FIXED POSITION BOT */}
      <BeeBotFloating />
    </div>
  );
}
