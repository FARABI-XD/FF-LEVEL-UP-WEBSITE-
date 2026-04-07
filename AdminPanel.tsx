import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Trash2, LogOut, Shield, RefreshCw } from 'lucide-react';
import { fetchUsers, createUser, deleteUser, fetchAppConfig, saveAppConfig } from '../services/auth';
import { User, BotConfig } from './types';
import ExpiryTimer from './ExpiryTimer';

interface AdminPanelProps {
  onLogout: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onLogout }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // System Config State
  const [contactLink, setContactLink] = useState('');
  const [youtubeLink, setYoutubeLink] = useState('');
  const [dashboardInstructions, setDashboardInstructions] = useState('');
  const [levelApiUrl, setLevelApiUrl] = useState('');
  const [bannerApiUrl, setBannerApiUrl] = useState('');
  const [safeModeDuration, setSafeModeDuration] = useState(60);

  // Loading States
  const [isConfigLoading, setIsConfigLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Create User Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [limit, setLimit] = useState(1);
  const [days, setDays] = useState(30);
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);

  // Bots
  const [bots, setBots] = useState<BotConfig[]>([
    {
      name: 'FF LEVEL UP',
      addApiUrl: 'https://indrajit-free-all-w3ft.vercel.app/adding_friend?uid=4417767484&password=6EF689D349CD0FBAA8952A51DA12ED640C0200056354902BC554ADAD5FE07A4E&friend_uid={target_uid}',
      removeApiUrl: 'https://indrajit-free-all-w3ft.vercel.app/remove_friend?uid=4417767484&password=6EF689D349CD0FBAA8952A51DA12ED640C0200056354902BC554ADAD5FE07A4E&friend_uid={target_uid}'
    }
  ]);

  useEffect(() => {
    refreshUsers();
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setIsConfigLoading(true);
    try {
      const config = await fetchAppConfig();
      setContactLink(config.contactLink ?? '');
      setYoutubeLink(config.youtubeLink ?? '');
      setDashboardInstructions(config.dashboardInstructions ?? '');
      setLevelApiUrl(config.levelApiUrl || 'https://star-info-api.vercel.app/accinfo?uid={UID}&region=IND');
      setBannerApiUrl(config.bannerApiUrl || 'https://ff-avator-banner-api-mafia-x-ayan.vercel.app/profile?uid={uid}');
      setSafeModeDuration(config.safeModeDurationMinutes || 60);
    } catch (e) {
      console.error("Failed to load config", e);
      alert("Warning: Could not load current system settings. Saving now might overwrite with defaults.");
    } finally {
      setIsConfigLoading(false);
    }
  };

  const refreshUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const fetchedUsers = await fetchUsers();
      setUsers(fetchedUsers);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const ensureProtocol = (url: string) => {
    if (!url || url.trim() === '') return '';
    const clean = url.trim();
    if (!/^https?:\/\//i.test(clean)) return `https://${clean}`;
    return clean;
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isConfigLoading) return;

    setIsSaving(true);
    try {
      const configToSave = {
        contactLink: ensureProtocol(contactLink),
        youtubeLink: ensureProtocol(youtubeLink),
        dashboardInstructions,
        levelApiUrl,
        bannerApiUrl,
        safeModeDurationMinutes: Number(safeModeDuration)
      };
      await saveAppConfig(configToSave);
      setContactLink(configToSave.contactLink);
      setYoutubeLink(configToSave.youtubeLink);
      alert("System configuration saved to Firebase successfully!");
      await loadConfig();
    } catch (error) {
      console.error("Save error", error);
      alert("Failed to save configuration to Firebase. Check console for details.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleBotChange = (index: number, field: keyof BotConfig, value: string) => {
    const newBots = [...bots];
    newBots[index] = { ...newBots[index], [field]: value };
    setBots(newBots);
  };

  const addBotRow = () => setBots([...bots, { name: '', addApiUrl: '', removeApiUrl: '' }]);
  const removeBotRow = (index: number) => bots.length > 1 && setBots(bots.filter((_, i) => i !== index));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return alert("Username and Password are required");

    setIsCreating(true);
    try {
      const expiryTime = Date.now() + (days * 24 * 60 * 60 * 1000) + (hours * 60 * 60 * 1000) + (minutes * 60 * 1000);
      const newUser: User = { username, password, role: 'user', expiryDate: expiryTime, maxInstances: Number(limit), allowedBots: bots };
      await createUser(newUser);
      await refreshUsers();
      setUsername('');
      setPassword('');
      alert("User created in Firebase successfully!");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (username: string) => {
    if (confirm(`Delete user ${username}?`)) {
      try {
        await deleteUser(username);
        await refreshUsers();
      } catch {
        alert("Failed to delete user");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gaming-dark text-slate-200 p-4 md:p-8 flex flex-col">
      <div className="max-w-7xl mx-auto space-y-8 flex-grow w-full">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center border-b border-slate-700 pb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-purple-600/20 p-3 rounded-xl border border-purple-500/30">
              <Shield size={32} className="text-purple-400" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white">ADMIN PANEL</h1>
              <p className="text-sm text-slate-500 font-mono">Firebase Connected System</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={refreshUsers} className="p-2 rounded-lg hover:bg-slate-700 transition-colors cursor-pointer text-slate-400 hover:text-white" title="Refresh Users">
              <RefreshCw size={18} className={isLoadingUsers ? "animate-spin" : ""} />
            </button>
            <button onClick={onLogout} className="flex items-center gap-2 bg-red-500/10 text-red-400 px-4 py-2 rounded-lg hover:bg-red-500/20 transition-colors cursor-pointer active:scale-95 ml-2">
              <LogOut size={18} /> Logout
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-5 space-y-6">

            {/* System Config Form */}
            <div className="bg-gaming-panel border border-slate-700 rounded-xl p-6 shadow-xl">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">System Settings</h2>
              <form onSubmit={handleSaveConfig} className="space-y-4">
                <div>
                  <label>Contact Link</label>
                  <input value={contactLink} onChange={e => setContactLink(e.target.value)} className="w-full p-2 rounded bg-slate-800 border border-slate-600 text-white" />
                </div>
                <div>
                  <label>Youtube Link</label>
                  <input value={youtubeLink} onChange={e => setYoutubeLink(e.target.value)} className="w-full p-2 rounded bg-slate-800 border border-slate-600 text-white" />
                </div>
                <div>
                  <label>Dashboard Instructions</label>
                  <textarea value={dashboardInstructions} onChange={e => setDashboardInstructions(e.target.value)} className="w-full p-2 rounded bg-slate-800 border border-slate-600 text-white" />
                </div>
                <div>
                  <label>Level API URL</label>
                  <input value={levelApiUrl} onChange={e => setLevelApiUrl(e.target.value)} className="w-full p-2 rounded bg-slate-800 border border-slate-600 text-white" />
                </div>
                <div>
                  <label>Banner API URL</label>
                  <input value={bannerApiUrl} onChange={e => setBannerApiUrl(e.target.value)} className="w-full p-2 rounded bg-slate-800 border border-slate-600 text-white" />
                </div>
                <div>
                  <label>Safe Mode Duration (minutes)</label>
                  <input type="number" value={safeModeDuration} onChange={e => setSafeModeDuration(Number(e.target.value))} className="w-full p-2 rounded bg-slate-800 border border-slate-600 text-white" />
                </div>
                <button type="submit" disabled={isSaving} className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700 transition-colors">{isSaving ? 'Saving...' : 'Save Config'}</button>
              </form>
            </div>

            {/* Create User Form */}
            <div className="bg-gaming-panel border border-slate-700 rounded-xl p-6 shadow-xl">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">Create User</h2>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label>Username</label>
                  <input value={username} onChange={e => setUsername(e.target.value)} className="w-full p-2 rounded bg-slate-800 border border-slate-600 text-white" />
                </div>
                <div>
                  <label>Password</label>
                  <input value={password} onChange={e => setPassword(e.target.value)} type="password" className="w-full p-2 rounded bg-slate-800 border border-slate-600 text-white" />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label>Days</label>
                    <input type="number" value={days} onChange={e => setDays(Number(e.target.value))} className="w-full p-2 rounded bg-slate-800 border border-slate-600 text-white" />
                  </div>
                  <div>
                    <label>Hours</label>
                    <input type="number" value={hours} onChange={e => setHours(Number(e.target.value))} className="w-full p-2 rounded bg-slate-800 border border-slate-600 text-white" />
                  </div>
                  <div>
                    <label>Minutes</label>
                    <input type="number" value={minutes} onChange={e => setMinutes(Number(e.target.value))} className="w-full p-2 rounded bg-slate-800 border border-slate-600 text-white" />
                  </div>
                </div>
                <div>
                  <label>Max Instances</label>
                  <input type="number" value={limit} onChange={e => setLimit(Number(e.target.value))} className="w-full p-2 rounded bg-slate-800 border border-slate-600 text-white" />
                </div>

                {/* Bots */}
                {bots.map((bot, index) => (
                  <div key={index} className="grid grid-cols-3 gap-2 items-end mb-2">
                    <div>
                      <label>Bot Name</label>
                      <input value={bot.name} onChange={e => handleBotChange(index, 'name', e.target.value)} className="w-full p-2 rounded bg-slate-800 border border-slate-600 text-white" />
                    </div>
                    <div>
                      <label>Add API URL</label>
                      <input value={bot.addApiUrl} onChange={e => handleBotChange(index, 'addApiUrl', e.target.value)} className="w-full p-2 rounded bg-slate-800 border border-slate-600 text-white" />
                    </div>
                    <div>
                      <label>Remove API URL</label>
                      <div className="flex gap-2">
                        <input value={bot.removeApiUrl} onChange={e => handleBotChange(index, 'removeApiUrl', e.target.value)} className="w-full p-2 rounded bg-slate-800 border border-slate-600 text-white" />
                        <button type="button" onClick={() => removeBotRow(index)} className="px-2 bg-red-600 rounded">X</button>
                      </div>
                    </div>
                  </div>
                ))}
                <button type="button" onClick={addBotRow} className="px-4 py-2 bg-green-600 rounded hover:bg-green-700 transition-colors">Add Bot</button>

                <button type="submit" disabled={isCreating} className="bg-purple-600 px-4 py-2 rounded hover:bg-purple-700 transition-colors mt-2">{isCreating ? 'Creating...' : 'Create User'}</button>
              </form>
            </div>
          </div>

          {/* Right Column: User List */}
          <div className="lg:col-span-7">
            <div className="bg-gaming-panel border border-slate-700 rounded-xl p-6 shadow-xl overflow-hidden">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Users size={20} className="text-blue-400" /> Firebase Database Users
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-700 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      <th>Username</th>
                      <th>Role</th>
                      <th>Expiry</th>
                      <th>Max Instances</th>
                      <th>Bots</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.username} className="border-b border-slate-700 hover:bg-slate-800">
                        <td>{user.username}</td>
                        <td>{user.role}</td>
                        <td><ExpiryTimer expiryDate={user.expiryDate} /></td>
                        <td>{user.maxInstances}</td>
                        <td>{user.allowedBots.map(bot => bot.name).join(', ')}</td>
                        <td>
                          <button onClick={() => handleDelete(user.username)} className="text-red-400 hover:text-red-500">
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
