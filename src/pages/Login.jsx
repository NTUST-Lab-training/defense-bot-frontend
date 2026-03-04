import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

// ⚠️ 偵錯版本戳記 — 確認瀏覽器載入的是新版程式碼
const BUILD_VERSION = 'v2-debug-0305';

export default function Login() {
  const [studentId, setStudentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // 首次渲染時在 console 印出版本，確認是否為新版
  useEffect(() => {
    console.log(`%c[Login] BUILD_VERSION = ${BUILD_VERSION}`, 'color: lime; font-size: 16px; font-weight: bold;');
  }, []);

  // 用來追蹤使用者是否已開始手動登入，防止 useEffect 自動跳轉競態
  const loginSubmittedRef = useRef(false);
  // 用來取消自動跳轉的 fetch 請求
  const autoRedirectAbortRef = useRef(null);

  // 若使用者已有合法登入狀態，直接跳轉至 Dashboard
  useEffect(() => {
    const existingId = localStorage.getItem('studentId');
    console.log('[Login] useEffect 啟動，localStorage studentId =', existingId);
    if (!existingId) {
      console.log('[Login] 無舊 session，跳過自動跳轉');
      return;
    }

    const controller = new AbortController();
    autoRedirectAbortRef.current = controller;

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
    fetch(`${API_BASE_URL}/api/v1/students/me`, {
      headers: { 'x-student-id': existingId },
      signal: controller.signal,
      cache: 'no-store',
    })
      .then(res => {
        console.log('[Login] 自動跳轉驗證回應: status =', res.status);
        if (res.ok) return res.json();
        throw new Error('invalid');
      })
      .then(data => {
        console.log('[Login] 自動跳轉驗證資料:', data);
        // 若使用者已開始手動登入流程，不執行自動跳轉
        if (loginSubmittedRef.current) {
          console.log('[Login] 使用者已手動登入，取消自動跳轉');
          return;
        }
        if (data && data.student_id && data.student_name) {
          console.log('[Login] 舊 session 合法，自動跳轉至 /dashboard');
          navigate('/dashboard', { replace: true });
        } else {
          console.warn('[Login] 舊 session 回應資料不完整，清除 localStorage');
          localStorage.clear();
        }
      })
      .catch((err) => {
        if (err.name === 'AbortError') {
          console.log('[Login] 自動跳轉 fetch 已被 abort');
          return;
        }
        console.warn('[Login] 舊 session 驗證失敗，清除 localStorage:', err.message);
        // 舊 session 無效，清除 localStorage
        localStorage.clear();
      });

    return () => controller.abort();
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    console.log('[Login] handleLogin 觸發，輸入學號 =', studentId.trim());

    // 標記使用者已手動登入，並取消自動跳轉
    loginSubmittedRef.current = true;
    if (autoRedirectAbortRef.current) {
      console.log('[Login] 取消自動跳轉 fetch');
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

      console.log('[Login] handleLogin 回應: status =', res.status);
      if (res.ok) {
        let data;
        try {
          data = await res.json();
        } catch {
          console.error('[Login] 回應 JSON 解析失敗');
          setError('伺服器回應格式異常，請稍後再試');
          return;
        }
        console.log('[Login] handleLogin 回應資料:', data);
        // 確認回應確實包含合法的學生資料
        if (!data || !data.student_id || !data.student_name) {
          console.warn('[Login] 回應資料不完整，拒絕登入');
          setError('驗證失敗：回應資料不完整，請確認學號是否正確');
          return;
        }
        console.log('[Login] ✅ 登入成功，導向 /dashboard');
        localStorage.setItem('studentId', data.student_id);
        localStorage.setItem('student_name', data.student_name);
        navigate('/dashboard');
      } else if (res.status === 404) {
        console.warn('[Login] ❌ 查無此學號 (404)');
        setError('查無此學號，請確認後重試');
      } else {
        console.warn('[Login] ❌ 驗證失敗，HTTP', res.status);
        setError('驗證失敗，請稍後再試');
      }
    } catch (err) {
      console.error('[Login] ❌ 網路錯誤:', err.message);
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