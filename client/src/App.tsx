
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import ExecutionDetails from './pages/ExecutionDetails';
import Pipelines from './pages/Pipelines';
import SettingsPage from './pages/Settings';
import { Activity, LayoutDashboard, Settings, Boxes } from 'lucide-react';
import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { useStore } from './store/useStore';

export const socket = io('http://localhost:4000');

function App() {
  const { updateExecutionStatus, appendLog, updateAIInsight } = useStore();

  useEffect(() => {
    socket.on('execution-status', (data) => {
      updateExecutionStatus(data.executionId, data.status, data.errorCategory, data.wasAutoHealed);
    });

    socket.on('pipeline-log', (data) => {
      appendLog(data.executionId, data.log);
    });

    socket.on('ai-insight', (data) => {
      updateAIInsight(data.executionId, data.prediction);
    });

    return () => {
      socket.off('execution-status');
      socket.off('pipeline-log');
      socket.off('ai-insight');
    };
  }, [updateExecutionStatus, appendLog, updateAIInsight]);

  return (
    <Router>
      <div className="flex h-screen bg-devops-dark text-gray-100 overflow-hidden font-sans">
        {/* Sidebar */}
        <aside className="w-64 bg-devops-card border-r border-devops-border hidden md:flex flex-col">
          <div className="p-6 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
              <Activity className="text-white w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">NexusCI</h1>
          </div>
          
          <nav className="flex-1 px-4 space-y-2 mt-4">
            <Link to="/" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors">
              <LayoutDashboard className="w-5 h-5" />
              <span className="font-medium">Dashboard</span>
            </Link>
            <Link to="/pipelines" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors">
              <Boxes className="w-5 h-5" />
              <span className="font-medium">Pipelines</span>
            </Link>
            <Link to="/settings" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors">
              <Settings className="w-5 h-5" />
              <span className="font-medium">Settings</span>
            </Link>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden relative">
          {/* Subtle Background Glow */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <header className="h-16 border-b border-devops-border bg-devops-card/50 backdrop-blur-sm flex items-center px-8 z-10">
            <h2 className="text-lg font-medium text-slate-200">System Overview</h2>
          </header>
          
          <div className="flex-1 overflow-auto p-8 z-10 relative">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/executions/:id" element={<ExecutionDetails />} />
              <Route path="/pipelines" element={<Pipelines />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
}

export default App;
