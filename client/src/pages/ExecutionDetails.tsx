import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client";
import { useStore } from "../store/useStore";
import { 
  ArrowLeft, Terminal, Activity, Brain, ShieldAlert, 
  CheckCircle, XCircle, Clock, RefreshCw, Zap, Bot
} from "lucide-react";

const API_URL = "http://localhost:4000";

export default function ExecutionDetails() {
  const { id } = useParams();
  const { activeExecution, setActiveExecution, appendLog, updateExecutionStatus, updateAIInsight } = useStore();
  const [loading, setLoading] = useState(true);
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchExecution = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/executions/${id}`);
        setActiveExecution(res.data);
      } catch (err) {
        console.error("Failed to fetch execution", err);
      } finally {
        setLoading(false);
      }
    };
    fetchExecution();

    const socket = io(API_URL);

    socket.on("execution-status", (data) => {
      if (data.executionId === id) {
        updateExecutionStatus(id!, data.status, data.errorCategory);
        // Re-fetch to get latest healing steps if status changes heavily
        if (data.status === 'retrying' || data.status === 'success' || data.status === 'failed') {
          fetchExecution();
        }
      }
    });

    socket.on("pipeline-log", (data) => {
      if (data.executionId === id) {
        appendLog(id!, data.log);
      }
    });

    socket.on("ai-insight", (data) => {
      if (data.executionId === id) {
        updateAIInsight(id!, data.prediction);
      }
    });

    return () => {
      socket.disconnect();
      setActiveExecution(null);
    };
  }, [id, setActiveExecution, appendLog, updateExecutionStatus, updateAIInsight]);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [activeExecution?.logs]);

  if (loading || !activeExecution) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Activity className="w-12 h-12 text-blue-500 animate-spin" />
          <p className="text-slate-400 font-medium">Connecting to execution stream...</p>
        </div>
      </div>
    );
  }

  const pipelineName = activeExecution.pipelineId && typeof activeExecution.pipelineId === 'object'
      ? activeExecution.pipelineId.name
      : 'Pipeline Execution';

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'running': return { icon: <Activity className="w-5 h-5 animate-pulse text-blue-400" />, bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400' };
      case 'success': return { icon: <CheckCircle className="w-5 h-5 text-emerald-400" />, bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400' };
      case 'failed': return { icon: <XCircle className="w-5 h-5 text-red-400" />, bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400' };
      case 'retrying': return { icon: <RefreshCw className="w-5 h-5 animate-spin text-amber-400" />, bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400' };
      default: return { icon: <Clock className="w-5 h-5 text-slate-400" />, bg: 'bg-slate-800', border: 'border-slate-700', text: 'text-slate-400' };
    }
  };

  const statusConf = getStatusConfig(activeExecution.status);

  // Parse logs for coloring
  const formatLogLine = (line: string, idx: number) => {
    if (!line.trim()) return <br key={idx} />;
    
    let colorClass = "text-slate-300";
    if (line.includes("[ERROR]") || line.toLowerCase().includes("error")) colorClass = "text-red-400";
    if (line.includes("[AI]")) colorClass = "text-purple-400 font-bold";
    if (line.includes("[HEAL]")) colorClass = "text-amber-400 font-bold";
    if (line.includes("[SUCCESS]")) colorClass = "text-emerald-400 font-bold";
    if (line.includes("[INFO]")) colorClass = "text-blue-400";
    
    return (
      <div key={idx} className={`font-mono text-sm leading-relaxed ${colorClass}`}>
        {line}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500 pb-12">
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link to="/" className="p-2 hover:bg-slate-800 rounded-lg transition text-slate-400 hover:text-white">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-white tracking-tight">{pipelineName}</h1>
            <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full border ${statusConf.bg} ${statusConf.border}`}>
              {statusConf.icon}
              <span className={`text-sm font-bold uppercase tracking-wider ${statusConf.text}`}>
                {activeExecution.status}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
            <span className="flex items-center gap-1.5"><Terminal className="w-4 h-4" /> ID: {id}</span>
            <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> Started: {new Date(activeExecution.createdAt || Date.now()).toLocaleTimeString()}</span>
            {activeExecution.retryCount > 0 && (
              <span className="flex items-center gap-1.5 text-amber-400 font-medium">
                <RefreshCw className="w-4 h-4" /> Retry Attempt {activeExecution.retryCount}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Intelligence & Healing */}
        <div className="space-y-6">
          
          {/* AI Root Cause Analysis */}
          <div className="glass-panel p-6 rounded-2xl relative overflow-hidden">
            <div className="flex items-center gap-2 mb-4">
              <Brain className="w-5 h-5 text-purple-400" />
              <h2 className="text-lg font-bold text-white">AI Root Cause Analysis</h2>
            </div>
            
            {activeExecution.rootCause || activeExecution.errorCategory ? (
              <div className="space-y-4">
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <p className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-1">Detected Anomaly</p>
                  <p className="text-lg font-bold text-white">{activeExecution.rootCause || activeExecution.errorCategory}</p>
                </div>
                
                {activeExecution.aiConfidence && (
                  <div>
                    <div className="flex justify-between text-xs font-medium mb-1">
                      <span className="text-slate-400">Classification Confidence</span>
                      <span className="text-purple-400">{(activeExecution.aiConfidence * 100).toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2">
                      <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full" style={{ width: `${activeExecution.aiConfidence * 100}%` }}></div>
                    </div>
                  </div>
                )}
                
                {activeExecution.aiSuggestion && (
                  <div className="pt-2 border-t border-slate-800">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Recommended Recovery Strategy</p>
                    <p className="text-sm text-slate-300 italic">"{activeExecution.aiSuggestion}"</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-slate-500">
                <ShieldAlert className="w-10 h-10 mb-2 opacity-50" />
                <p className="text-sm text-center">No anomalies detected yet.<br/>Monitoring live telemetry...</p>
              </div>
            )}
          </div>

          {/* Autonomous Healing Timeline */}
          {activeExecution.healingSteps && activeExecution.healingSteps.length > 0 && (
            <div className="glass-panel p-6 rounded-2xl">
              <div className="flex items-center gap-2 mb-6">
                <Zap className="w-5 h-5 text-amber-400" />
                <h2 className="text-lg font-bold text-white">Autonomous Healing Timeline</h2>
              </div>
              
              <div className="relative pl-6 space-y-6 before:absolute before:inset-y-0 before:left-[11px] before:w-[2px] before:bg-slate-800">
                {activeExecution.healingSteps.map((step, idx) => (
                  <div key={idx} className="relative">
                    <div className="absolute -left-[30px] p-1 rounded-full bg-slate-900 border-2 border-amber-500 text-amber-500">
                      <Bot className="w-3 h-3" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{step.action.replace(/\[.*?\]/g, '').trim()}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{new Date(step.timestamp).toLocaleTimeString()}</p>
                    </div>
                  </div>
                ))}
                {activeExecution.status === 'success' && activeExecution.wasAutoHealed && (
                  <div className="relative">
                    <div className="absolute -left-[30px] p-1 rounded-full bg-slate-900 border-2 border-emerald-500 text-emerald-500">
                      <CheckCircle className="w-3 h-3" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-emerald-400">Recovery Successful</p>
                      <p className="text-xs text-slate-500 mt-0.5">Pipeline restored to operational state</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Right Column: Live Terminal */}
        <div className="lg:col-span-2">
          <div className="glass-panel rounded-2xl overflow-hidden flex flex-col h-full min-h-[600px]">
            <div className="bg-slate-900/80 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-slate-400" />
                <h2 className="text-sm font-medium text-slate-300">Live Execution Stream</h2>
              </div>
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
              </div>
            </div>
            <div 
              ref={terminalRef}
              className="flex-1 p-6 bg-[#0d1117] overflow-y-auto custom-scrollbar"
            >
              {activeExecution.logs ? (
                activeExecution.logs.split('\n').map((line, idx) => formatLogLine(line, idx))
              ) : (
                <div className="text-slate-500 font-mono text-sm">Waiting for worker telemetry...</div>
              )}
              {activeExecution.status === 'running' && (
                <div className="mt-4 flex items-center gap-2 text-blue-400 font-mono text-sm animate-pulse">
                  <span className="w-2 h-4 bg-blue-400 block"></span> Processing...
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}