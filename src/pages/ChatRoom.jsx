import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ChatRoom() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  // 1. 抓取身分與對照後的學術資訊 (從 Dashboard 存入的記憶)
  const user = {
    name: localStorage.getItem('studentName') || '訪客',
    id: localStorage.getItem('studentId') || 'unknown',
    thesis: localStorage.getItem('thesisTitle') || '尚未提供',
    advisor: localStorage.getItem('advisor') || '尚未提供'
  };

  // 自動捲動到底部
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 初始化開場白
  useEffect(() => {
    if (!localStorage.getItem('studentId')) navigate('/');
    setMessages([{ 
      role: 'ai', 
      content: `您好 ${user.name} 同學！我已讀取到您的論文題目為《${user.thesis}》。請告訴我口試的地點與時間，我將為您產生排版好的佈告。` 
    }]);
  }, []);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userQuery = input;
    setMessages(prev => [...prev, { role: 'user', content: userQuery }]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: userQuery,
          inputs: {
            user_name: user.name,
            thesis_title: user.thesis,
            advisor_name: user.advisor,
            current_date: new Date().toLocaleDateString('zh-TW') // 動態日期
          },
          user: user.id
        })
      });
      const data = await response.json();
      
      // A2UI 邏輯：判斷回應是否包含下載指令
      // 假設後端回傳格式包含 [FILE: 網址]
      setMessages(prev => [...prev, { role: 'ai', content: data.answer }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'ai', content: '⚠️ 後端連線中斷，請確認 FastAPI 服務。' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen bg-slate-50 flex flex-col font-sans">
      <header className="h-16 bg-white/80 backdrop-blur-md border-b flex items-center px-8 justify-between sticky top-0 z-10">
        <span className="font-black text-blue-600 tracking-tighter">口試佈告管家</span>
        <button onClick={() => navigate('/dashboard')} className="text-sm font-bold text-slate-400 hover:text-blue-600 transition">返回儀表板</button>
      </header>

      {/* 對話區域 */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 max-w-3xl mx-auto w-full">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`group relative p-5 rounded-3xl max-w-[85%] shadow-sm leading-relaxed ${
              m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white border border-slate-100 text-slate-700'
            }`}>
              {/* 解析 A2UI 下載卡片 */}
              {m.content.includes('[DOWNLOAD]') ? (
                <div className="space-y-4 text-center">
                  <p>✨ 佈告已排版完成！</p>
                  <div className="p-4 bg-slate-50 rounded-2xl border-2 border-dashed border-blue-200">
                    <p className="text-xs font-bold text-blue-400 mb-2">PowerPoint 格式已生成</p>
                    <button className="bg-blue-600 text-white px-6 py-2 rounded-full font-bold shadow-lg shadow-blue-100">
                      📥 點我下載 PPT
                    </button>
                  </div>
                </div>
              ) : (
                m.content
              )}
            </div>
          </div>
        ))}
        {loading && <div className="text-slate-300 text-xs font-bold animate-pulse">管家正在排版中，請稍候...</div>}
        <div ref={scrollRef} />
      </div>

      {/* 輸入區域 */}
      <footer className="p-8 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent">
        <div className="max-w-3xl mx-auto relative">
          <input 
            className="w-full bg-white border-none shadow-2xl shadow-slate-200 rounded-2xl px-8 py-5 pr-32 outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-700" 
            placeholder="輸入口試時間、地點或委員..." value={input} 
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            disabled={loading}
          />
          <button 
            onClick={sendMessage} 
            className="absolute right-3 top-3 bottom-3 bg-blue-600 text-white px-6 rounded-xl font-bold hover:bg-blue-700 transition active:scale-95 disabled:bg-slate-300"
            disabled={loading}
          >
            發送
          </button>
        </div>
      </footer>
    </div>
  );
}