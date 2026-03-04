import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';

/**
 * 路由守衛：
 * 1. localStorage 中必須存在 studentId，否則立即導回登入頁。
 * 2. 首次渲染時向後端驗證該 studentId 是否合法，
 *    若後端回應不合法則清除 localStorage 並導回登入頁。
 */
export default function ProtectedRoute({ children }) {
  const navigate = useNavigate();
  const studentId = localStorage.getItem('studentId');
  const [verified, setVerified] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // 沒有 studentId → 不需要驗證，直接標記完成（由下方 render 導回登入頁）
    if (!studentId) {
      setChecking(false);
      return;
    }

    const controller = new AbortController();
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
    fetch(`${API_BASE_URL}/api/v1/students/me`, {
      headers: { 'x-student-id': studentId },
      signal: controller.signal,
      cache: 'no-store',
    })
      .then(res => {
        if (!res.ok) throw new Error('unauthorized');
        return res.json();
      })
      .then(data => {
        if (data && data.student_id && data.student_name) {
          setVerified(true);
        } else {
          throw new Error('invalid');
        }
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        localStorage.clear();
        navigate('/', { replace: true });
      })
      .finally(() => setChecking(false));

    return () => controller.abort();
  }, [studentId, navigate]);

  // 沒有 studentId → 直接導回登入頁
  if (!studentId) {
    return <Navigate to="/" replace />;
  }

  // 正在向後端驗證中，顯示載入畫面避免閃爍
  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <p className="text-slate-400">驗證身分中...</p>
      </div>
    );
  }

  // 驗證失敗（此時已被 navigate('/') 導走，此為防禦性程式碼）
  if (!verified) {
    return <Navigate to="/" replace />;
  }

  return children;
}
