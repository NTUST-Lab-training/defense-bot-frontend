import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { authenticatedDownload } from '../utils/download';



export default function ChatRoom() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);
  const [conversationId, setConversationId] = useState('');

  // 1. 抓取身分憑證 (從 Login 存入的學號)
  const user = {
    id: localStorage.getItem('studentId') || '',
    name: localStorage.getItem('student_name') || ''
    
  };

  // 自動捲動到底部
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 初始化開場白
  useEffect(() => {
    if (!user.id) {
      alert("尚未登入！請先驗證身分。");
      navigate('/');
      return;
    }
    setMessages([{ 
      role: 'ai', 
      content: `您好 ${user.name} 同學！我已讀取到您的論文題目。請告訴我您的「口試地點」與「口試時間」，以及「委員名單」，我將為您產生排版好的佈告。` 
    }]);
  }, [navigate, user.id, user.name]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userQuery = input;
    setMessages(prev => [...prev, { role: 'user', content: userQuery }]);
    setInput('');
    setLoading(true);

    // 支援環境變數，若無則預設本地端
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/chat`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-student-id': user.id //  極度重要：把學號放在 Header 交給後端驗證
        },
        body: JSON.stringify({
          query: userQuery,
          conversation_id: conversationId //  用來維持對話狀態
          //  注意：這裡被大幅精簡了！不需要傳姓名跟題目，後端會以零信任模式自行去資料庫核對。
        })
      });

      if (!response.ok) {
         if (response.status === 401) throw new Error('身分驗證失敗，請重新登入');
         throw new Error('伺服器回應錯誤');
      }
      
      const data = await response.json();
      setMessages(prev => [...prev, { role: 'ai', content: data.answer }]);
      if (data.conversation_id) {
        setConversationId(data.conversation_id);
      }
      
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { role: 'ai', content: `⚠️ 系統提示：${e.message || '後端連線中斷，請確認 FastAPI 服務是否啟動。'}` }]);
    } finally {
      setLoading(false);
    }
  };

  // Markdown 連結元件：若為下載連結則轉為認證下載按鈕
  const markdownComponents = {
    a({ href, children }) {
      const isDownloadLink = href && (
        href.includes('/api/v1/downloads/') || href.endsWith('.pptx')
      );
      if (isDownloadLink) {
        const relativeUrl = href.replace(/^https?:\/\/[^/]+/, '');
        const label = String(children) === 'DOWNLOAD' ? '📥 點此下載 PPT' : children;
        return (
          <button
            onClick={() => authenticatedDownload(relativeUrl)}
            className="inline-flex items-center gap-1.5 bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-blue-700 transition active:scale-95 cursor-pointer mx-0.5"
          >
            {label}
          </button>
        );
      }
      return <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{children}</a>;
    },
    p({ children }) {
      return <p className="mb-2 last:mb-0">{children}</p>;
    },
    ul({ children }) {
      return <ul className="list-disc pl-5 mb-2 space-y-0.5">{children}</ul>;
    },
    ol({ children }) {
      return <ol className="list-decimal pl-5 mb-2 space-y-0.5">{children}</ol>;
    },
    li({ children }) {
      return <li className="leading-relaxed">{children}</li>;
    },
    strong({ children }) {
      return <strong className="font-semibold">{children}</strong>;
    },
  };

  return (
    <div className="h-screen bg-slate-50 flex flex-col font-sans">
      <header className="h-16 bg-white/80 backdrop-blur-md border-b flex items-center px-8 justify-between sticky top-0 z-10">
        <span className="font-black text-blue-600 tracking-tighter">口試佈告管家</span>
        <button onClick={() => navigate('/dashboard')} className="text-sm font-bold text-slate-400 hover:text-blue-600 transition">返回儀表板</button>
      </header>

      {/* 對話區域 */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 max-w-3xl mx-auto w-full">
        {messages.map((m, i) => {
          return (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`group relative p-5 rounded-3xl max-w-[85%] shadow-sm leading-relaxed ${
                m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white border border-slate-100 text-slate-700'
              }`}>
                {m.role === 'user' ? (
                  <span>{m.content}</span>
                ) : (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={markdownComponents}
                  >
                    {m.content}
                  </ReactMarkdown>
                )}
              </div>
            </div>
          );
        })}
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