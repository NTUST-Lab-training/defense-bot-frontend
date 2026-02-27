import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState({ name: '', id: '', thesis: '載入中...', advisor: '載入中...' });
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const studentId = localStorage.getItem('studentId');
    if (!studentId) return navigate('/');

    // 依照 API.md 規範，使用 x-student-id Header
    const headers = { 'x-student-id': studentId };

    // 1. 取得個人檔案
    fetch('http://localhost:8088/api/v1/students/me', { headers })
      .then(res => res.json())
      .then(data => {
        setUser({
          name: data.student_name,
          id: data.student_id,
          thesis: data.thesis_title_zh,
          advisor: data.advisor
        });
      });

    // 2. 取得歷史紀錄
    fetch('http://localhost:8088/api/v1/defense/history', { headers })
      .then(res => res.json())
      .then(data => setHistory(data));
  }, [navigate]);

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="h-16 bg-white border-b px-8 flex items-center justify-between">
        <span className="font-bold text-xl text-blue-600">Defense-Bot</span>
        <button onClick={() => {localStorage.clear(); navigate('/');}} className="text-slate-400 text-sm">登出</button>
      </nav>

      <div className="max-w-6xl mx-auto py-12 px-6 grid md:grid-cols-3 gap-8">
        {/* 左側資訊卡片 */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <h2 className="text-2xl font-bold mb-4">{user.name}</h2>
          <div className="space-y-4 pt-6 border-t">
            <div><p className="text-xs font-black text-slate-300">論文題目</p><p className="text-sm">{user.thesis}</p></div>
            <div><p className="text-xs font-black text-slate-300">指導教授</p><p className="text-sm">{user.advisor}</p></div>
          </div>
        </div>

        {/* 右側操作與歷史紀錄 */}
        <div className="md:col-span-2 space-y-6">
          <button onClick={() => navigate('/chat')} className="w-full bg-blue-600 text-white p-6 rounded-2xl font-bold text-xl shadow-lg hover:bg-blue-700">
            ➕ 產生新佈告
          </button>
          
          <h3 className="text-xl font-bold text-slate-800">📜 歷史產出</h3>
          <div className="space-y-4">
            {history.length > 0 ? history.map(item => (
              <div key={item.log_id} className="bg-white p-4 rounded-xl border flex justify-between items-center shadow-sm">
                <div>
                  <p className="font-bold text-sm">{item.defense_date}</p>
                  <p className="text-xs text-slate-400">{item.location}</p>
                </div>
                <a href={item.download_url} className="bg-blue-50 text-blue-600 px-4 py-2 rounded-lg text-sm font-bold">下載 PPT</a>
              </div>
            )) : <p className="text-slate-400">尚無產出紀錄</p>}
          </div>
        </div>
      </div>
    </div>
  );
}