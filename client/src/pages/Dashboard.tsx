import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { useStore } from "../store/useStore";
import { Play, Activity, Clock, CheckCircle, XCircle, ShieldCheck, Zap, GitBranch, Cpu, TerminalSquare, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";

const API_URL = "http://localhost:4000";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: "spring", stiffness: 100 }
  }
};

export default function Dashboard() {
  const { pipelines, setPipelines, executions, setExecutions } = useStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pipelinesRes, executionsRes] = await Promise.all([
          axios.get(`${API_URL}/api/pipelines`),
          axios.get(`${API_URL}/api/executions`),
        ]);
        setPipelines(pipelinesRes.data);
        setExecutions(executionsRes.data);
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [setPipelines, setExecutions]);

  const handleRunPipeline = async (pipelineId: string) => {
    try {
      const res = await axios.post(`${API_URL}/api/executions`, { pipelineId });
      setExecutions([res.data, ...executions]);
    } catch (err) {
      console.error("Failed to run pipeline", err);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'running': return { icon: <Activity className="w-4 h-4 animate-pulse text-blue-400" />, bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400' };
      case 'success': return { icon: <CheckCircle className="w-4 h-4 text-emerald-400" />, bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400' };
      case 'failed': return { icon: <XCircle className="w-4 h-4 text-rose-400" />, bg: 'bg-rose-500/10', border: 'border-rose-500/30', text: 'text-rose-400' };
      case 'retrying': return { icon: <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />, bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400' };
      default: return { icon: <Clock className="w-4 h-4 text-slate-400" />, bg: 'bg-slate-800', border: 'border-slate-700', text: 'text-slate-400' };
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Activity className="w-12 h-12 text-blue-500 animate-spin" />
          <p className="text-slate-400 font-medium">Initializing DevOps Platform...</p>
        </div>
      </div>
    );
  }

  const successRate = executions.length > 0 
    ? Math.round((executions.filter(e => e.status === 'success').length / executions.length) * 100) 
    : 100;

  const autoHealedCount = executions.filter(e => e.wasAutoHealed && e.status === 'success').length;

  return (
    <motion.div 
      initial="hidden" 
      animate="visible" 
      variants={containerVariants} 
      className="max-w-7xl mx-auto space-y-10 pb-12"
    >
      
      {/* Header Metrics */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="relative p-6 rounded-2xl overflow-hidden group bg-slate-900/60 backdrop-blur-md border border-white/5 hover:border-blue-500/30 transition-all duration-300">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Cpu className="w-16 h-16 text-blue-400" />
          </div>
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2">Total Pipelines</p>
          <div className="text-4xl font-black text-white">{pipelines.length}</div>
        </div>
        
        <div className="relative p-6 rounded-2xl overflow-hidden group bg-slate-900/60 backdrop-blur-md border border-white/5 hover:border-emerald-500/30 transition-all duration-300">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Activity className="w-16 h-16 text-emerald-400" />
          </div>
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2">Success Rate</p>
          <div className="text-4xl font-black text-emerald-400">{successRate}%</div>
        </div>
        
        <div className="relative p-6 rounded-2xl overflow-hidden group bg-slate-900/60 backdrop-blur-md border border-white/5 hover:border-amber-500/30 transition-all duration-300 shadow-[0_0_15px_rgba(251,191,36,0.1)] hover:shadow-[0_0_30px_rgba(251,191,36,0.2)]">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <ShieldCheck className="w-16 h-16 text-amber-400" />
          </div>
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2">Auto-Healed Recoveries</p>
          <div className="text-4xl font-black text-amber-400">{autoHealedCount}</div>
        </div>
        
        <div className="relative p-6 rounded-2xl overflow-hidden group bg-slate-900/60 backdrop-blur-md border border-white/5 hover:border-purple-500/30 transition-all duration-300">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Zap className="w-16 h-16 text-purple-400" />
          </div>
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2">Total Executions</p>
          <div className="text-4xl font-black text-purple-400">{executions.length}</div>
        </div>
      </motion.div>

      {/* Pipeline Cards Grid */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center gap-3 mb-6">
          <TerminalSquare className="w-6 h-6 text-blue-400" />
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Active Workflows</h2>
        </div>
        
        <motion.div 
          variants={containerVariants}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {pipelines.map(pipeline => (
            <motion.div 
              variants={itemVariants} 
              key={pipeline._id} 
              className="bg-slate-900/40 backdrop-blur-xl border border-white/10 p-6 flex flex-col rounded-2xl group hover:-translate-y-2 hover:shadow-[0_10px_30px_-10px_rgba(59,130,246,0.3)] hover:border-blue-500/40 transition-all duration-300 relative overflow-hidden"
            >
              <div className="absolute -top-10 -right-10 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-colors" />
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">{pipeline.name}</h3>
                  <div className="flex items-center gap-2 mt-2 text-slate-400 text-sm">
                    <GitBranch className="w-4 h-4" />
                    <span className="truncate max-w-[200px]">{pipeline.repository}</span>
                  </div>
                </div>
                <div className="px-3 py-1 bg-white/5 rounded-lg border border-white/10 backdrop-blur-sm">
                  <span className="text-xs font-mono font-bold text-blue-300 uppercase">{pipeline.language}</span>
                </div>
              </div>

              <div className="mt-auto">
                <button
                  onClick={() => handleRunPipeline(pipeline._id)}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-medium transition-all shadow-[0_4px_15px_rgba(79,70,229,0.3)] hover:shadow-[0_6px_25px_rgba(79,70,229,0.5)] active:scale-[0.98]"
                >
                  <Play className="w-5 h-5 fill-white" />
                  Trigger Build
                </button>
              </div>
            </motion.div>
          ))}
          {pipelines.length === 0 && (
            <div className="col-span-full py-16 text-center border-2 border-dashed border-white/10 rounded-2xl bg-white/5 backdrop-blur-sm">
              <TerminalSquare className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-300">No pipelines configured</h3>
              <p className="text-slate-500 mt-2">Add pipelines to your environment to begin.</p>
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* Execution History */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center gap-3 mb-6">
          <Activity className="w-6 h-6 text-emerald-400" />
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Execution Intelligence</h2>
        </div>
        
        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/10 text-slate-300 text-xs font-semibold uppercase tracking-wider">
                  <th className="p-5">Status</th>
                  <th className="p-5">Pipeline</th>
                  <th className="p-5">AI Analysis & Recovery</th>
                  <th className="p-5">Time</th>
                  <th className="p-5 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {executions.map(ex => {
                  const statusConf = getStatusConfig(ex.status);
                  return (
                    <tr key={ex._id} className="hover:bg-white/[0.03] transition-colors group">
                      <td className="p-5">
                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${statusConf.bg} ${statusConf.border}`}>
                          {statusConf.icon}
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${statusConf.text}`}>
                            {ex.status}
                          </span>
                        </div>
                      </td>
                      <td className="p-5 font-semibold text-white">
                        {ex.pipelineId && typeof ex.pipelineId === 'object' ? ex.pipelineId.name : 'Pipeline Execution'}
                      </td>
                      <td className="p-5">
                        <div className="flex flex-col gap-2">
                          {ex.wasAutoHealed && (
                            <div className="flex items-center gap-1.5 w-fit px-2 py-1 rounded bg-amber-500/20 border border-amber-500/30 text-amber-400 text-[11px] font-bold uppercase tracking-wider">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              Auto-Healed
                            </div>
                          )}
                          {ex.rootCause ? (
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-slate-300">{ex.rootCause}</span>
                              {ex.aiConfidence && (
                                <span className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-mono font-medium border border-blue-500/20">
                                  {(ex.aiConfidence * 100).toFixed(0)}% Conf
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-slate-500 italic font-medium">No anomalies detected</span>
                          )}
                        </div>
                      </td>
                      <td className="p-5 text-sm text-slate-400 font-mono font-medium">
                        {new Date(ex.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td className="p-5 text-right">
                        <Link
                          to={`/executions/${ex._id}`}
                          className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-white/5 text-white hover:bg-white/10 hover:text-blue-300 transition-all font-medium text-sm border border-white/10"
                        >
                          View Logs
                        </Link>
                      </td>
                    </tr>
                  );
                })}
                {executions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-slate-500 font-medium">
                      No executions recorded yet. Trigger a pipeline to begin gathering intelligence.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}