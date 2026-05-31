import { useState, useEffect } from 'react';
import axios from 'axios';
import { Save, Activity, ShieldCheck, Database, RefreshCw } from 'lucide-react';

const API_URL = "http://localhost:4000";

const CATEGORIES = [
  "Build Failure",
  "Test Failure",
  "Dependency Error",
  "Environment Issue",
  "Timeout Failure",
  "Flaky Test",
  "Network Failure",
  "Container Crash",
  "Permission Error"
];

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [autoHealEnabled, setAutoHealEnabled] = useState(true);
  const [maxRetries, setMaxRetries] = useState(2);
  const [autoRetryCategories, setAutoRetryCategories] = useState<string[]>([]);
  const [slackWebhookUrl, setSlackWebhookUrl] = useState('');
  const [discordWebhookUrl, setDiscordWebhookUrl] = useState('');
  const [k8sDeploymentName, setK8sDeploymentName] = useState('');
  const [awsInstanceId, setAwsInstanceId] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/settings`);
      const data = res.data;
      setAutoHealEnabled(data.autoHealEnabled);
      setMaxRetries(data.maxRetries);
      setAutoRetryCategories(data.autoRetryCategories || []);
      setSlackWebhookUrl(data.slackWebhookUrl || '');
      setDiscordWebhookUrl(data.discordWebhookUrl || '');
      setK8sDeploymentName(data.k8sDeploymentName || '');
      setAwsInstanceId(data.awsInstanceId || '');
    } catch (err) {
      console.error('Failed to fetch settings', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.post(`${API_URL}/api/settings`, {
        autoHealEnabled,
        maxRetries,
        autoRetryCategories,
        slackWebhookUrl,
        discordWebhookUrl,
        k8sDeploymentName,
        awsInstanceId
      });
      alert('Settings saved successfully');
    } catch (err) {
      console.error('Failed to save settings', err);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const toggleCategory = (category: string) => {
    if (autoRetryCategories.includes(category)) {
      setAutoRetryCategories(autoRetryCategories.filter(c => c !== category));
    } else {
      setAutoRetryCategories([...autoRetryCategories, category]);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">System Settings</h1>
          <p className="text-slate-400 mt-1">Configure AI and Auto-Healing parameters</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-500 text-white hover:bg-blue-600 transition shadow-lg shadow-blue-500/20 font-medium disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          {saving ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>

      <div className="space-y-6">
        
        {/* Auto-Healing Master Switch */}
        <div className="glass-panel p-6 flex items-center justify-between group hover:border-blue-500/50 transition">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl transition ${autoHealEnabled ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-500'}`}>
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Global Auto-Healing</h2>
              <p className="text-slate-400 text-sm mt-1">Enable or disable the AI self-healing engine entirely.</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" checked={autoHealEnabled} onChange={(e) => setAutoHealEnabled(e.target.checked)} />
            <div className="w-14 h-7 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-500"></div>
          </label>
        </div>

        {autoHealEnabled && (
          <>
            {/* Retry Configuration */}
            <div className="glass-panel p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-4">
                <RefreshCw className="w-5 h-5 text-slate-400" />
                <h3 className="text-lg font-semibold text-white">Retry Parameters</h3>
              </div>
              
              <div className="pt-2">
                <label className="block text-sm font-medium text-slate-300 mb-2">Maximum Healing Retries</label>
                <div className="flex items-center gap-4">
                  <input 
                    type="range" 
                    min="1" 
                    max="5" 
                    value={maxRetries} 
                    onChange={(e) => setMaxRetries(Number(e.target.value))}
                    className="flex-1 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                  <span className="text-xl font-bold text-white w-8 text-center">{maxRetries}</span>
                </div>
                <p className="text-xs text-slate-500 mt-2">The number of times the engine will attempt to run dynamic healing commands before marking the pipeline as failed.</p>
              </div>
            </div>

            {/* AI Auto-Retry Categories */}
            <div className="glass-panel p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-4">
                <Activity className="w-5 h-5 text-slate-400" />
                <h3 className="text-lg font-semibold text-white">Targeted Healing Categories</h3>
              </div>
              <p className="text-sm text-slate-400 pb-2">Select which AI-predicted failure categories should trigger the active self-healing protocol.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {CATEGORIES.map(cat => {
                  const isActive = autoRetryCategories.includes(cat);
                  return (
                    <button
                      key={cat}
                      onClick={() => toggleCategory(cat)}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-left transition ${
                        isActive 
                        ? 'bg-blue-500/10 border-blue-500/50 text-blue-100' 
                        : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800 hover:border-slate-600'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isActive ? 'bg-blue-500 border-blue-500' : 'border-slate-500'}`}>
                        {isActive && <div className="w-2 h-2 bg-white rounded-full" />}
                      </div>
                      <span className="text-sm font-medium">{cat}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            {/* Enterprise Integrations */}
            <div className="glass-panel p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-4">
                <Database className="w-5 h-5 text-slate-400" />
                <h3 className="text-lg font-semibold text-white">Enterprise Integrations</h3>
              </div>
              <p className="text-sm text-slate-400 pb-2">Configure out-of-band automated infrastructure healing and notifications.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-sm text-slate-300">Slack Webhook URL</label>
                  <input type="text" value={slackWebhookUrl} onChange={(e) => setSlackWebhookUrl(e.target.value)} placeholder="https://hooks.slack.com/..." className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500 transition" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-slate-300">Discord Webhook URL</label>
                  <input type="text" value={discordWebhookUrl} onChange={(e) => setDiscordWebhookUrl(e.target.value)} placeholder="https://discord.com/api/webhooks/..." className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500 transition" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-slate-300">Kubernetes Deployment Name</label>
                  <input type="text" value={k8sDeploymentName} onChange={(e) => setK8sDeploymentName(e.target.value)} placeholder="e.g. nexusci-deployment" className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500 transition" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-slate-300">AWS EC2 Instance ID</label>
                  <input type="text" value={awsInstanceId} onChange={(e) => setAwsInstanceId(e.target.value)} placeholder="e.g. i-0abcdef1234567890" className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500 transition" />
                </div>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
