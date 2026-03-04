import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ChatRoom from './pages/ChatRoom';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        {/* 畫面一：登入畫面 */}
        <Route path="/" element={<Login />} />
        
        {/* 畫面二：個人儀表板（需登入） */}
        <Route path="/dashboard" element={
          <ProtectedRoute><Dashboard /></ProtectedRoute>
        } />

        {/* 畫面三：對話框（需登入） */}
        <Route path="/chat" element={
          <ProtectedRoute><ChatRoom /></ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;