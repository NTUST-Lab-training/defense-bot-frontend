import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
// 雖然這兩個檔案還沒寫，但我們先 Import 進來準備好
import Dashboard from './pages/Dashboard';
import ChatRoom from './pages/ChatRoom';

function App() {
  return (
    <Router>
      <Routes>
        {/* 畫面一：登入畫面 */}
        <Route path="/" element={<Login />} />
        
        {/* 畫面二：個人儀表板 */}
        <Route path="/dashboard" element={<Dashboard />} />

        {/* 畫面三：對話框 (口試佈告管家) */}
        <Route path="/chat" element={<ChatRoom />} />
      </Routes>
    </Router>
  );
}

export default App;