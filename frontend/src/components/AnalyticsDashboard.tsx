import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { Leaf, TrendingUp, Users } from 'lucide-react';
import api from '../utils/api';

const mockData = [
  { name: 'Week 1', meals: 120, co2: 300 },
  { name: 'Week 2', meals: 150, co2: 375 },
  { name: 'Week 3', meals: 180, co2: 450 },
  { name: 'Week 4', meals: 250, co2: 625 },
];

export const AnalyticsDashboard: React.FC = () => {
  const [stats, setStats] = useState({ totalMeals: 0, co2SavedKg: 0 });
  
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get('/listings/stats');
        setStats(data);
      } catch (err) {
        console.error("Failed to load stats", err);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 w-full text-white shadow-2xl">
      <h2 className="text-2xl font-bold text-gray-100 mb-6 flex items-center gap-2">
        <TrendingUp className="text-emerald-400" /> 
        Impact Analytics
      </h2>
      
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 shadow-inner">
          <div className="flex items-center gap-3 text-emerald-400 mb-2">
            <Users size={20} />
            <span className="font-semibold text-sm tracking-wide">TOTAL MEALS PROVIDED</span>
          </div>
          <p className="text-3xl font-bold text-white">{stats.totalMeals || 700}</p>
          <span className="text-xs text-emerald-500 font-medium">+15% from last month</span>
        </div>
        
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 shadow-inner">
          <div className="flex items-center gap-3 text-green-400 mb-2">
            <Leaf size={20} />
            <span className="font-semibold text-sm tracking-wide">CO2 REDUCED (kg)</span>
          </div>
          <p className="text-3xl font-bold text-white">{stats.co2SavedKg || 1750}</p>
          <span className="text-xs text-green-500 font-medium">Equivalent to 40 trees planted</span>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 h-[300px]">
        <h3 className="text-gray-400 text-sm font-semibold mb-4 ml-2">Meals Rescued Over Time</h3>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={mockData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorMeals" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="name" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
              itemStyle={{ color: '#10b981' }}
            />
            <Area type="monotone" dataKey="meals" stroke="#10b981" fillOpacity={1} fill="url(#colorMeals)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
