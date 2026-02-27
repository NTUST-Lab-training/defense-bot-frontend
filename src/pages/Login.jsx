import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [studentId, setStudentId] = useState('');
  const [studentName, setStudentName] = useState(''); 
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    if (studentId.trim() && studentName.trim()) {
      // 依照後端規格，學號是核心憑證
      localStorage.setItem('studentId', studentId.trim());
      localStorage.setItem('studentName', studentName.trim());
      navigate('/dashboard');
    } else {
      alert('請輸入姓名與學號以核對身分');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
      <div className="bg-white p-10 rounded-3xl shadow-xl w-full max-w-sm border border-slate-100">
        <h1 className="text-3xl font-black text-slate-800 mb-2 text-center">Defense-Bot</h1>
        <p className="text-slate-400 text-center mb-8">智慧口試佈告系統</p>
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="text" placeholder="真實姓名"
            className="w-full p-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-blue-500"
            value={studentName} onChange={e => setStudentName(e.target.value)}
          />
          <input
            type="text" placeholder="學號 (例如: M11402165)"
            className="w-full p-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-blue-500"
            value={studentId} onChange={e => setStudentId(e.target.value)}
          />
          <button type="submit" className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl hover:bg-blue-700 transition shadow-lg">
            登入系統 ➔
          </button>
        </form>
      </div>
    </div>
  );
}