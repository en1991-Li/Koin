'use client';

import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// 1. 配色與樣式系統 (模仿 MOZE 深色模式)
const colors = {
  bg: '#1a1c2c',
  card: '#23263a',
  primary: '#f16565', // MOZE 的標誌性紅色
  text: '#e2e8f0',
  sub: '#94a3b8',
  green: '#4ade80',
  red: '#fb7185',
  blue: '#60a5fa',
};

// 2. 模擬圖表數據 (3/17 - 3/26)
const chartData = [
  { date: '3/17', balance: 1200, trend: 1100 },
  { date: '3/18', balance: 15000, trend: 8200 }, // 突發大額支出
  { date: '3/19', balance: 14800, trend: 7900 },
  { date: '3/20', balance: 14500, trend: 7600 },
  { date: '3/21', balance: 14600, trend: 7200 },
  { date: '3/22', balance: 14300, trend: 6900 },
  { date: '3/23', balance: 14000, trend: 6700 },
  { date: '3/24', balance: 14100, trend: 6500 },
  { date: '3/25', balance: 13900, trend: 6300 },
  { date: '3/26', balance: 1,524, trend: 6100 }, // 當前餘額
];

// 3. 模擬帳戶數據
const initialAccounts = [
  { id: 1, name: '現金', count: 3, balance: -36306, icon: '💵', accounts: ['錢包', '悠遊卡', 'iCash'] },
  { id: 2, name: '銀行', count: 4, balance: 32571, icon: '🏦', accounts: ['台新 Richart', '國泰 KOKO', '中信'] },
  { id: 3, name: '數位銀行', count: 8, balance: 2211, icon: '📱', accounts: ['LINE Bank', '樂天', '將來'] },
  { id: 4, name: '紅利點數', count: 1, balance: 0, icon: '🎁', accounts: ['OPENPOINT'] },
  { id: 5, name: '其他', count: 2, balance: 0, icon: '🌀', accounts: ['借出款'] },
  { id: 6, name: '封存', count: 6, balance: 0, icon: '📦', accounts: ['舊銀行帳戶'] },
];

// 4. 小元件：帳戶項目 (可縮放)
const AccountGroup = ({ group }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-slate-700 last:border-0 hover:bg-slate-800 transition-colors">
      <div 
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-4">
          <span className="text-xl">{group.icon}</span>
          <div>
            <span className="text-slate-100 font-medium">{group.name}</span>
            <span className="text-xs ml-2 px-2 py-0.5 rounded-full bg-slate-700 text-slate-400">
              ({group.count})
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <p className={`font-bold ${group.balance < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {group.balance < 0 ? `-$${Math.abs(group.balance).toLocaleString()}` : `+$${group.balance.toLocaleString()}`}
          </p>
          <span className={`text-slate-500 transform transition-transform ${isOpen ? 'rotate-90' : ''}`}>▶</span>
        </div>
      </div>
      
      {isOpen && (
        <div className="pl-14 pr-4 pb-3 bg-slate-800 border-t border-slate-700">
          {group.accounts.map(acc => (
            <div key={acc} className="py-2 text-sm text-slate-300 border-b border-slate-700 last:border-0">
              {acc}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// 5. 主元件：帳戶總覽 Dashboard
export default function AccountDashboard() {
  const [activeDate, setActiveDate] = useState('2026/03/26 週四');

  return (
    <div className="min-h-screen p-6 space-y-8" style={{ backgroundColor: colors.bg, color: colors.text }}>
      
      {/* 5.1. Header - 總額資訊 (1/3 高度) */}
      <header className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 總額 (主卡片) */}
        <div className="md:col-span-1 p-6 rounded-2xl shadow-lg space-y-2" style={{ backgroundColor: colors.card, borderColor: colors.primary, borderWidth: 1 }}>
          <p className="text-sm" style={{ color: colors.sub }}>總額 (TWD)</p>
          <h1 className="text-5xl font-extrabold tracking-tight" style={{ color: colors.primary }}>
            1,524
          </h1>
          <p className="text-xs" style={{ color: colors.sub }}>最後更新: {activeDate}</p>
        </div>
        
        {/* 資產與負債 (小卡片) */}
        <div className="md:col-span-2 grid grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-slate-800 space-y-1">
            <p className="text-xs text-slate-400">總資產</p>
            <p className="text-2xl font-bold text-emerald-400">34,782</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-800 space-y-1">
            <p className="text-xs text-slate-400">總負債</p>
            <p className="text-2xl font-bold text-rose-400">36,306</p>
          </div>
          <button className="col-span-2 text-sm text-slate-400 hover:text-slate-200 py-1 transition">
            查看「各分組佔比」/「各幣種佔比」
          </button>
        </div>
      </header>
      
      {/* 5.2. 圖表與清單並排 (2/3 高度) */}
      <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 5.2.1. 趨勢圖卡片 (2/3 寬度) */}
        <div className="lg:col-span-2 p-6 rounded-2xl space-y-4" style={{ backgroundColor: colors.card }}>
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold">資產趨勢</h2>
            <select className="text-sm bg-slate-700 p-1 rounded text-slate-300">
              <option>最近 10 天</option>
              <option>本月</option>
            </select>
          </div>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} unit="K" />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f1f5f9' }} />
                <Area type="monotone" dataKey="trend" stroke="#a855f7" fillOpacity={1} fill="url(#colorTrend)" strokeWidth={2}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* 5.2.2. 帳戶清單卡片 (1/3 寬度) */}
        <div className="lg:col-span-1 rounded-2xl overflow-hidden shadow-2xl" style={{ backgroundColor: colors.card }}>
          <div className="flex justify-between items-center p-4 border-b border-slate-700 bg-slate-800">
            <h2 className="text-lg font-bold">帳戶分組</h2>
            <div className="flex gap-2">
              <button className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">🔍</button>
              <button className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">📊</button>
            </div>
          </div>
          
          {/* 帳戶分組元件清單 */}
          <div className="divide-y divide-slate-700">
            {initialAccounts.map(group => (
              <AccountGroup key={group.id} group={group} />
            ))}
          </div>
        </div>
      </main>
      
      {/* 5.3. 新增帳戶按鈕 (Web 版特色) */}
      <div className="fixed bottom-8 right-8 flex gap-3">
        <button className="p-4 rounded-full bg-rose-500 hover:bg-rose-400 shadow-2xl transition text-2xl">
          👁
        </button>
        <button className="p-4 rounded-full shadow-2xl transition text-2xl" style={{ backgroundColor: colors.primary, hover: {backgroundColor: '#e05050'} }}>
          +
        </button>
      </div>

    </div>
  );
}
