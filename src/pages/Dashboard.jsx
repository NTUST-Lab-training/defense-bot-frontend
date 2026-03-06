import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authenticatedDownload } from '../utils/download';

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const studentId = localStorage.getItem('studentId');
    if (!studentId) return navigate('/');

    const controller = new AbortController();
    // 依照 API.md 規範，使用 x-student-id Header
    const headers = { 'x-student-id': studentId };
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

    // 1. 取得個人檔案（同時驗證學號是否合法）
    fetch(`${API_BASE_URL}/api/v1/students/me`, { headers, signal: controller.signal, cache: 'no-store' })
      .then(res => {
        if (!res.ok) throw new Error('unauthorized');
        return res.json();
      })
      .then(data => {
        if (!data || !data.student_id) throw new Error('invalid');
        setUser({
          name: data.student_name,
          id: data.student_id,
          thesis: data.thesis_title_zh,
          advisor: data.advisor
        });
        localStorage.setItem('student_name', data.student_name);
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        // 學號無效或後端拒絕 → 清除登入狀態並導回登入頁
        localStorage.clear();
        navigate('/');
      });

    // 2. 取得歷史紀錄
    fetch(`${API_BASE_URL}/api/v1/defense/history`, { headers, signal: controller.signal, cache: 'no-store' })
      .then(res => {
        if (!res.ok) return [];
        return res.json();
      })
      .then(data => setHistory(Array.isArray(data) ? data : []))
      .catch((err) => {
        if (err.name !== 'AbortError') setHistory([]);
      });

    return () => controller.abort();
  }, [navigate]);

  // 在後端驗證完成前，不顯示任何 Dashboard 內容
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <p className="text-slate-400">載入中...</p>
      </div>
    );
  }

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
                <button onClick={() => authenticatedDownload(item.download_url)} className="bg-blue-50 text-blue-600 px-4 py-2 rounded-lg text-sm font-bold cursor-pointer hover:bg-blue-100 transition">下載 PPT</button>
              </div>
            )) : <p className="text-slate-400">尚無產出紀錄</p>}
          </div>
        </div>
      </div>
    </div>
  );
}