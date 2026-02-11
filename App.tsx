
import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import StartPage from './pages/StartPage';
import PlayPage from './pages/PlayPage';
import ResultPage from './pages/ResultPage';
import LeaderboardPage from './pages/LeaderboardPage';
import AdminPage from './pages/AdminPage';
import { QuizRun } from './types';

const App: React.FC = () => {
  const [currentRun, setCurrentRun] = useState<QuizRun | null>(null);

  return (
    <Router>
      <div className="min-h-screen transition-all duration-500">
        <Routes>
          <Route path="/" element={<StartPage onStart={setCurrentRun} />} />
          <Route path="/play" element={<PlayPage run={currentRun} onFinish={setCurrentRun} />} />
          <Route path="/result" element={<ResultPage run={currentRun} onRestart={() => setCurrentRun(null)} />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
