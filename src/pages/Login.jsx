import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [studentId, setStudentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // 用來追蹤使用者是否已開始手動登入，防止 useEffect 自動跳轉競態
  const loginSubmittedRef = useRef(false);
  // 用來取消自動跳轉的 fetch 請求
  const autoRedirectAbortRef = useRef(null);

  // 若使用者已有合法登入狀態，直接跳轉至 Dashboard
  useEffect(() => {
    const existingId = localStorage.getItem('studentId');
    if (!existingId) return;

    const controller = new AbortController();
    autoRedirectAbortRef.current = controller;

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
    fetch(`${API_BASE_URL}/api/v1/students/me`, {
      headers: { 'x-student-id': existingId },
      signal: controller.signal,
      cache: 'no-store',
    })
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('invalid');
      })
      .then(data => {
        // 若使用者已開始手動登入流程，不執行自動跳轉
        if (loginSubmittedRef.current) return;
        if (data && data.student_id && data.student_name) {
          navigate('/dashboard', { replace: true });
        } else {
          localStorage.clear();
        }
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        // 舊 session 無效，清除 localStorage
        localStorage.clear();
      });

    return () => controller.abort();
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();

    // 標記使用者已手動登入，並取消自動跳轉
    loginSubmittedRef.current = true;
    if (autoRedirectAbortRef.current) {
      autoRedirectAbortRef.current.abort();
      autoRedirectAbortRef.current = null;
    }

    const trimmedId = studentId.trim();
    if (!trimmedId) {
      setError('請輸入學號以核對身分');
      return;
    }

    // 清除任何舊的登入狀態，確保用新學號重新驗證
    localStorage.clear();

    setLoading(true);
    setError('');

    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
      const res = await fetch(`${API_BASE_URL}/api/v1/students/me`, {
        headers: { 'x-student-id': trimmedId },
        cache: 'no-store',
      });

      if (res.ok) {
        let data;
        try {
          data = await res.json();
        } catch {
          setError('伺服器回應格式異常，請稍後再試');
          return;
        }
        // 確認回應確實包含合法的學生資料
        if (!data || !data.student_id || !data.student_name) {
          setError('驗證失敗：回應資料不完整，請確認學號是否正確');
          return;
        }
        localStorage.setItem('studentId', data.student_id);
        localStorage.setItem('student_name', data.student_name);
        navigate('/dashboard');
      } else if (res.status === 404) {
        setError('查無此學號，請確認後重試');
      } else {
        setError('驗證失敗，請稍後再試');
      }
    } catch (err) {
      setError('無法連線至伺服器，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
      <div className="bg-white p-10 rounded-3xl shadow-xl w-full max-w-sm border border-slate-100">
        <h1 className="text-3xl font-black text-slate-800 mb-2 text-center">Defense-Bot</h1>
        <p className="text-slate-400 text-center mb-8">智慧口試佈告系統</p>
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="text" placeholder="學號 (例如: M1140XXXX)"
            className="w-full p-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-blue-500"
            value={studentId} onChange={e => { setStudentId(e.target.value); setError(''); }}
            disabled={loading}
          />
          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl hover:bg-blue-700 transition shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? '驗證中...' : '登入系統 ➔'}
          </button>
        </form>
      </div>
    </div>
  );
}