import { useState, useEffect } from 'react';
import axios from 'axios';
import { useStore } from '../store/useStore';
import { Plus, Trash2, Save, X, Boxes, Code2, GitBranch, Terminal } from 'lucide-react';

const API_URL = "http://localhost:4000";

export default function Pipelines() {
  const { pipelines, addPipeline, setPipelines } = useStore();
  const [isCreating, setIsCreating] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [repository, setRepository] = useState('');
  const [branch, setBranch] = useState('main');
  const [language, setLanguage] = useState('node');
  const [steps, setSteps] = useState([{ name: '', command: '' }]);
  const [envVars, setEnvVars] = useState([{ key: '', value: '' }]);
  const [customRepairScript, setCustomRepairScript] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (pipelines.length === 0) {
      axios.get(`${API_URL}/api/pipelines`)
        .then(res => setPipelines(res.data))
        .catch(err => console.error('Failed to fetch pipelines', err));
    }
  }, [pipelines.length, setPipelines]);

  const handleAddStep = () => setSteps([...steps, { name: '', command: '' }]);
  const handleRemoveStep = (index: number) => setSteps(steps.filter((_, i) => i !== index));
  const handleStepChange = (index: number, field: 'name' | 'command', value: string) => {
    const newSteps = [...steps];
    newSteps[index][field] = value;
    setSteps(newSteps);
  };

  const handleAddEnv = () => setEnvVars([...envVars, { key: '', value: '' }]);
  const handleRemoveEnv = (index: number) => setEnvVars(envVars.filter((_, i) => i !== index));
  const handleEnvChange = (index: number, field: 'key' | 'value', value: string) => {
    const newEnvVars = [...envVars];
    newEnvVars[index][field] = value;
    setEnvVars(newEnvVars);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        name,
        repository,
        branch,
        language,
        steps: steps.filter(s => s.name && s.command),
        envVars: envVars.filter(e => e.key && e.value),
        customRepairScript
      };

      const res = await axios.post(`${API_URL}/api/pipelines`, payload);
      addPipeline(res.data);
      setIsCreating(false);
      resetForm();
    } catch (err) {
      console.error('Failed to create pipeline', err);
      alert('Failed to create pipeline. Check console for details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setName('');
    setRepository('');
    setBranch('main');
    setLanguage('node');
    setSteps([{ name: '', command: '' }]);
    setEnvVars([{ key: '', value: '' }]);
    setCustomRepairScript('');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this pipeline?')) return;
    try {
      await axios.delete(`${API_URL}/api/pipelines/${id}`);
      setPipelines(pipelines.filter((p) => p._id !== id));
    } catch (err) {
      console.error('Failed to delete', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Pipeline Management</h1>
          <p className="text-slate-400 mt-1">Configure and manage your CI/CD workflows</p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500 text-white hover:bg-blue-600 transition shadow-lg shadow-blue-500/20 font-medium"
        >
          <Plus className="w-5 h-5" />
          Create Pipeline
        </button>
      </div>

      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Boxes className="w-5 h-5 text-blue-400" />
                New Pipeline Configuration
              </h2>
              <button onClick={() => setIsCreating(false)} className="text-slate-400 hover:text-white transition">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
              <form id="pipeline-form" onSubmit={handleSubmit} className="space-y-8">
                
                {/* General Settings */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Terminal className="w-4 h-4" /> General Settings
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-sm text-slate-300">Pipeline Name</label>
                      <input required type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Production Build" className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500 transition" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm text-slate-300">Language Environment</label>
                      <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500 transition">
                        <option value="node">Node.js</option>
                        <option value="python">Python</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Source Control */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <GitBranch className="w-4 h-4" /> Source Control
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-sm text-slate-300">Repository URL</label>
                      <input required type="text" value={repository} onChange={(e) => setRepository(e.target.value)} placeholder="github.com/org/repo" className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500 transition" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm text-slate-300">Target Branch</label>
                      <div className="relative">
                        <GitBranch className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                        <input required type="text" value={branch} onChange={(e) => setBranch(e.target.value)} placeholder="main" className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500 transition" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Execution Steps */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <Code2 className="w-4 h-4" /> Execution Steps
                    </h3>
                    <button type="button" onClick={handleAddStep} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 bg-blue-500/10 px-2 py-1 rounded">
                      <Plus className="w-3 h-3" /> Add Step
                    </button>
                  </div>
                  <div className="space-y-3">
                    {steps.map((step, index) => (
                      <div key={index} className="flex gap-3 items-start p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 relative group">
                        <div className="flex-1 space-y-3">
                          <input required type="text" value={step.name} onChange={(e) => handleStepChange(index, 'name', e.target.value)} placeholder={`Step ${index + 1} Name (e.g. Install Dependencies)`} className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-sm text-white focus:outline-none focus:border-blue-500" />
                          <textarea required value={step.command} onChange={(e) => handleStepChange(index, 'command', e.target.value)} placeholder="npm install" rows={2} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-sm font-mono text-white focus:outline-none focus:border-blue-500" />
                        </div>
                        {steps.length > 1 && (
                          <button type="button" onClick={() => handleRemoveStep(index)} className="text-slate-500 hover:text-red-400 transition mt-1">
                            <Trash2 className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Environment Variables */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <Boxes className="w-4 h-4" /> Environment Variables
                    </h3>
                    <button type="button" onClick={handleAddEnv} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 bg-blue-500/10 px-2 py-1 rounded">
                      <Plus className="w-3 h-3" /> Add Variable
                    </button>
                  </div>
                  <div className="space-y-3">
                    {envVars.map((env, index) => (
                      <div key={index} className="flex gap-3 items-center">
                        <input type="text" value={env.key} onChange={(e) => handleEnvChange(index, 'key', e.target.value)} placeholder="KEY (e.g. NODE_ENV)" className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm font-mono text-white focus:outline-none focus:border-blue-500" />
                        <span className="text-slate-500">=</span>
                        <input type="text" value={env.value} onChange={(e) => handleEnvChange(index, 'value', e.target.value)} placeholder="VALUE" className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm font-mono text-white focus:outline-none focus:border-blue-500" />
                        <button type="button" onClick={() => handleRemoveEnv(index)} className="text-slate-500 hover:text-red-400 transition">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Advanced Healing */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Terminal className="w-4 h-4" /> Advanced Healing (Optional)
                  </h3>
                  <div className="space-y-1">
                    <label className="text-sm text-slate-300">Custom Shell Repair Script</label>
                    <textarea value={customRepairScript} onChange={(e) => setCustomRepairScript(e.target.value)} placeholder="e.g. chmod -R 777 . && npm cache clean --force" rows={2} className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-blue-500 transition" />
                    <p className="text-xs text-slate-500">This script will be executed automatically by the AI if a failure occurs during pipeline execution.</p>
                  </div>
                </div>

              </form>
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex justify-end gap-3">
              <button type="button" onClick={() => setIsCreating(false)} className="px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-800 transition">
                Cancel
              </button>
              <button type="submit" form="pipeline-form" disabled={isSubmitting} className="flex items-center gap-2 px-6 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition disabled:opacity-50">
                <Save className="w-4 h-4" />
                {isSubmitting ? 'Saving...' : 'Save Pipeline'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Existing Pipelines Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pipelines.map(pipe => (
          <div key={pipe._id} className="glass-panel p-6 flex flex-col group hover:border-blue-500/50 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white">{pipe.name}</h3>
                <div className="flex items-center gap-2 mt-1 text-slate-400 text-sm">
                  <GitBranch className="w-4 h-4" />
                  <span className="truncate max-w-[200px]">{pipe.repository}</span>
                </div>
              </div>
              <span className="px-2 py-1 rounded bg-slate-800 text-xs text-slate-300 border border-slate-700 uppercase tracking-wider">
                {pipe.language}
              </span>
            </div>
            
            <div className="flex-1">
              <div className="space-y-2 mt-4">
                {pipe.steps?.slice(0, 3).map((step: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-slate-300 bg-slate-800/50 px-3 py-2 rounded-lg border border-slate-700/50">
                    <span className="text-blue-400 font-mono text-xs w-4">{i + 1}.</span>
                    <span className="truncate">{step.name}</span>
                  </div>
                ))}
                {pipe.steps && pipe.steps.length > 3 && (
                  <div className="text-xs text-slate-500 pl-3">+{pipe.steps.length - 3} more steps</div>
                )}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <GitBranch className="w-4 h-4" />
                {pipe.branch || 'main'}
              </div>
              <button onClick={() => handleDelete(pipe._id)} className="text-slate-500 hover:text-red-400 transition opacity-0 group-hover:opacity-100">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
        {pipelines.length === 0 && !isCreating && (
          <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-800 rounded-2xl">
            <Boxes className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-300">No pipelines configured</h3>
            <p className="text-slate-500 mt-1">Create your first pipeline to get started with automated deployments.</p>
            <button onClick={() => setIsCreating(true)} className="mt-4 px-4 py-2 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20 transition">
              Create Pipeline
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
