import React, { useState, useEffect } from 'react';
import { ViewState, PasswordEntry } from './types';
import { LayoutGrid, Plus, ShieldCheck, Terminal, X, Menu, LogOut, Settings, Database, Copy, RefreshCw, AlertTriangle } from 'lucide-react';
import CursorGlow from './components/CursorGlow';
import PasswordGenerator from './components/PasswordGenerator';
import PasswordList from './components/PasswordList';
import AccessTerminal from './components/AccessTerminal';
import { Button } from './components/Button';
import { supabase, isSupabaseConfigured } from './services/supabaseClient';
import { deriveKey, encryptData, decryptData } from './services/crypto';

const App: React.FC = () => {
  const [isLocked, setIsLocked] = useState(true);
  const [cryptoKey, setCryptoKey] = useState<CryptoKey | null>(null);
  const [authError, setAuthError] = useState<string>('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isConfigured, setIsConfigured] = useState(isSupabaseConfigured());
  const [missingTable, setMissingTable] = useState(false);

  const [view, setView] = useState<ViewState>(ViewState.DASHBOARD);
  const [passwords, setPasswords] = useState<PasswordEntry[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEntryTitle, setNewEntryTitle] = useState('');
  const [newEntryUser, setNewEntryUser] = useState('');
  const [newEntryPass, setNewEntryPass] = useState('');
  const [newEntryCategory, setNewEntryCategory] = useState<PasswordEntry['category']>('other');

  // Handle Unlock
  const handleUnlock = async (password: string) => {
    if (!isConfigured) {
        setAuthError("Configuration Missing");
        return;
    }
    
    setIsAuthenticating(true);
    setAuthError('');
    setMissingTable(false);

    try {
        const key = await deriveKey(password);
        setCryptoKey(key);
        
        // Fetch from Supabase
        const { data, error } = await supabase.from('entries').select('*');
        
        if (error) {
            console.error("Supabase Error:", error);
            
            // Check for missing table (Postgres error 42P01)
            if (error.code === '42P01') {
                setMissingTable(true);
                // We proceed to unlock so we can show the setup screen inside the app layout
            } 
            else if (error.code === 'PGRST301' || error.message.includes('FetchError')) {
                throw new Error("Connection Failed: Check URL/Key");
            } 
            else {
                // Default to empty if it's some other non-critical error (e.g. empty table initially)
                setPasswords([]);
            }
        } else if (data) {
            // Decrypt all entries
            const decryptedEntries: PasswordEntry[] = [];
            for (const row of data) {
                try {
                    const entry = await decryptData(row.data, key);
                    decryptedEntries.push(entry);
                } catch (e) {
                    console.error("Failed to decrypt row", row.id);
                }
            }
            // If data exists but we can't decrypt any, the master password is wrong
            if (data.length > 0 && decryptedEntries.length === 0) {
                 throw new Error("Decryption Failed: Invalid Key");
            }
            setPasswords(decryptedEntries);
        }
        
        setIsLocked(false);
    } catch (e: any) {
        setAuthError(e.message || "Access Denied");
        setCryptoKey(null);
    } finally {
        setIsAuthenticating(false);
    }
  };

  const reCheckTable = async () => {
      const { error } = await supabase.from('entries').select('id').limit(1);
      if (!error || error.code !== '42P01') {
          setMissingTable(false);
          // Ideally we would fetch data here, but simple reload works too or user can navigate
          alert("Database structure verified. You may now add entries.");
      } else {
          alert("Table 'entries' is still missing. Please run the SQL script in Supabase.");
      }
  };

  const syncToStorage = async (updatedPasswords: PasswordEntry[]) => {
      // Local Backup
      if (cryptoKey) {
        try {
            const encryptedAll = await encryptData(updatedPasswords, cryptoKey);
            localStorage.setItem('voidvault_encrypted', encryptedAll);
        } catch(e) {}
      }
  }

  const handleDelete = async (id: string) => {
    const updated = passwords.filter(p => p.id !== id);
    setPasswords(updated);
    
    await syncToStorage(updated);
    await supabase.from('entries').delete().eq('id', id);
  };

  const handleSavePassword = (passwordValue: string) => {
    setNewEntryPass(passwordValue);
    setView(ViewState.DASHBOARD);
    setIsModalOpen(true);
  };

  const handleCreateEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cryptoKey) return;

    const newEntry: PasswordEntry = {
      id: crypto.randomUUID(),
      title: newEntryTitle || 'Untitled Entry',
      username: newEntryUser,
      passwordValue: newEntryPass,
      category: newEntryCategory,
      createdAt: Date.now()
    };
    
    const updated = [newEntry, ...passwords];
    setPasswords(updated);
    setIsModalOpen(false);
    resetForm();

    try {
        const encryptedBlob = await encryptData(newEntry, cryptoKey);
        await supabase.from('entries').insert({
            id: newEntry.id,
            data: encryptedBlob
        });
        await syncToStorage(updated);
    } catch (err) {
        console.error("Failed to save to cloud", err);
        alert("Saved locally, but cloud sync failed. Check database connection.");
    }
  };

  const resetForm = () => {
    setNewEntryTitle('');
    setNewEntryUser('');
    setNewEntryPass('');
    setNewEntryCategory('other');
  };

  // ----------------------------------------------------------------------
  // SETUP SCREEN (Missing Env Vars)
  // ----------------------------------------------------------------------
  if (!isConfigured) {
      return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
             <CursorGlow />
             <div className="relative z-10 max-w-lg w-full border border-red-900 bg-red-950/10 p-8 backdrop-blur-md">
                 <div className="flex items-center gap-3 mb-6 text-red-500">
                     <Database className="w-8 h-8" />
                     <h1 className="text-2xl font-mono font-bold tracking-widest uppercase">Configuration Required</h1>
                 </div>
                 <p className="font-mono text-sm text-zinc-400 mb-6 leading-relaxed">
                     VoidVault requires a Supabase connection to store your encrypted data securely. 
                 </p>
                 <div className="bg-black border border-zinc-800 p-4 mb-6 font-mono text-xs text-zinc-500 overflow-x-auto">
                     <p className="mb-2">// 1. Open <span className="text-white">services/supabaseClient.ts</span></p>
                     <p className="mb-2">// 2. Paste your project URL and Anon Key</p>
                     <p>// 3. Save the file to reload</p>
                 </div>
                 <Button onClick={() => window.location.reload()} className="w-full">
                     RELOAD SYSTEM
                 </Button>
             </div>
        </div>
      )
  }

  // ----------------------------------------------------------------------
  // MAIN APP
  // ----------------------------------------------------------------------
  if (isLocked) {
      return <AccessTerminal onUnlock={handleUnlock} isLoading={isAuthenticating} error={authError} />;
  }

  return (
    <div className="min-h-screen text-white font-sans selection:bg-white selection:text-black relative flex flex-col">
      <CursorGlow />
      
      {/* Background Grid */}
      <div className="fixed inset-0 bg-grid-pattern bg-[length:40px_40px] opacity-10 pointer-events-none z-0" />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-800 bg-black/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setView(ViewState.DASHBOARD)}>
            <div className="w-8 h-8 bg-white text-black flex items-center justify-center font-bold text-lg group-hover:bg-transparent group-hover:text-white group-hover:border group-hover:border-white transition-all">V</div>
            <span className="font-mono tracking-[0.2em] font-bold text-lg hidden sm:block">VOIDVAULT_V2</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <button 
              onClick={() => setView(ViewState.DASHBOARD)}
              className={`text-xs font-mono uppercase tracking-widest hover:text-white transition-colors ${view === ViewState.DASHBOARD ? 'text-white border-b-2 border-white pb-1' : 'text-zinc-600'}`}
            >
              / Dashboard
            </button>
            <button 
              onClick={() => setView(ViewState.GENERATOR)}
              className={`text-xs font-mono uppercase tracking-widest hover:text-white transition-colors ${view === ViewState.GENERATOR ? 'text-white border-b-2 border-white pb-1' : 'text-zinc-600'}`}
            >
              / Generator
            </button>
          </div>

          <div className="flex items-center gap-4">
             <Button 
                onClick={() => { setIsModalOpen(true); resetForm(); }}
                className="hidden md:flex py-2 px-4 text-[10px]"
                icon={<Plus className="w-3 h-3"/>}
                disabled={missingTable}
             >
                INJECT_ENTRY
             </Button>
             <button 
                onClick={() => setIsLocked(true)}
                className="p-2 text-zinc-600 hover:text-red-500 transition-colors"
                title="Lock Vault"
             >
                 <LogOut className="w-5 h-5" />
             </button>
             <button className="md:hidden p-2" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                {isMobileMenuOpen ? <X /> : <Menu />}
             </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black pt-20 px-4 md:hidden">
            <div className="flex flex-col gap-4">
                <Button onClick={() => { setView(ViewState.DASHBOARD); setIsMobileMenuOpen(false); }} variant="secondary">Dashboard</Button>
                <Button onClick={() => { setView(ViewState.GENERATOR); setIsMobileMenuOpen(false); }} variant="secondary">Generator</Button>
                <Button onClick={() => { setIsModalOpen(true); setIsMobileMenuOpen(false); }}>Add New</Button>
            </div>
        </div>
      )}

      {/* Main Content */}
      <main className="relative z-10 pt-32 pb-20 px-4 md:px-8 max-w-7xl mx-auto flex-grow w-full">
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between border-b border-zinc-900 pb-8">
            <div>
                <h1 className="text-4xl md:text-7xl font-bold tracking-tighter mb-2 text-white font-display uppercase">
                    {view === ViewState.DASHBOARD ? 'Vault_Index' : 'Entropy_Gen'}
                </h1>
                <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${missingTable ? 'bg-red-500' : 'bg-green-500'} animate-pulse`}></span>
                    {missingTable ? 'DATABASE_SCHEMA_MISSING' : 'System Online // Encryption Active'}
                </p>
            </div>
            <div className="text-right hidden md:block">
                 <div className="text-xs font-mono text-zinc-600">TOTAL ENTRIES</div>
                 <div className="text-4xl font-mono text-white">{passwords.length.toString().padStart(2, '0')}</div>
            </div>
        </header>

        {view === ViewState.DASHBOARD && !missingTable && (
             <PasswordList passwords={passwords} onDelete={handleDelete} />
        )}

        {/* Database Setup View */}
        {missingTable && (
            <div className="border border-red-900 bg-zinc-950/80 p-8 max-w-4xl mx-auto backdrop-blur-md relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-600 to-transparent opacity-50"></div>
                
                <div className="flex items-start gap-4 mb-6">
                    <div className="p-3 bg-red-500/10 border border-red-500 rounded-lg">
                        <AlertTriangle className="w-8 h-8 text-red-500" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold font-mono text-white mb-2">INITIALIZATION REQUIRED</h2>
                        <p className="text-zinc-400 font-mono text-sm">
                            The secure storage table was not found in your Supabase project. 
                            Execute the protocol below to initialize the vault structure.
                        </p>
                    </div>
                </div>

                <div className="bg-black border border-zinc-800 p-6 relative group">
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                            onClick={() => {
                                navigator.clipboard.writeText(`create table if not exists entries (\n  id text primary key,\n  data text not null,\n  created_at timestamptz default now()\n);\n\nalter table entries enable row level security;\n\ncreate policy "Public Access" \non entries for all \nusing (true) \nwith check (true);`);
                            }}
                            className="text-[10px] py-1 px-3"
                            icon={<Copy className="w-3 h-3"/>}
                        >
                            COPY SQL
                        </Button>
                    </div>
                    <code className="text-sm font-mono text-zinc-300 whitespace-pre-wrap block">
                        <span className="text-purple-400">create table if not exists</span> entries (<br/>
                        &nbsp;&nbsp;id <span className="text-yellow-400">text primary key</span>,<br/>
                        &nbsp;&nbsp;data <span className="text-yellow-400">text not null</span>,<br/>
                        &nbsp;&nbsp;created_at <span className="text-yellow-400">timestamptz default now</span>()<br/>
                        );<br/><br/>
                        <span className="text-purple-400">alter table</span> entries <span className="text-purple-400">enable row level security</span>;<br/><br/>
                        <span className="text-zinc-500">-- Zero Knowledge: Security is client-side, so we allow public access to blobs</span><br/>
                        <span className="text-purple-400">create policy</span> "Public Access" <br/>
                        <span className="text-purple-400">on</span> entries <span className="text-purple-400">for all</span> <br/>
                        <span className="text-purple-400">using</span> (<span className="text-blue-400">true</span>) <br/>
                        <span className="text-purple-400">with check</span> (<span className="text-blue-400">true</span>);
                    </code>
                </div>

                <div className="mt-8 flex justify-between items-center">
                    <div className="text-xs font-mono text-zinc-500">
                        STATUS: WAITING_FOR_SCHEMA
                    </div>
                    <Button onClick={reCheckTable} icon={<RefreshCw className="w-4 h-4"/>}>
                        RE-SCAN DATABASE
                    </Button>
                </div>
            </div>
        )}

        {view === ViewState.GENERATOR && (
            <PasswordGenerator onSave={handleSavePassword} />
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-zinc-900 bg-black py-6 text-center">
          <p className="text-[10px] text-zinc-700 font-mono uppercase">
              VoidVault v2.0 // Secured by AES-GCM-256 // Zero Knowledge Architecture
          </p>
      </footer>

      {/* Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
            <div className="relative z-10 bg-black border-2 border-white w-full max-w-md p-8 shadow-[0_0_50px_rgba(255,255,255,0.1)]">
                <div className="absolute top-0 left-0 bg-white text-black px-3 py-1 text-xs font-bold font-mono">
                    NEW_ENTRY_PROTOCOL
                </div>
                
                <div className="flex justify-between items-center mb-8 mt-4">
                    <h3 className="font-mono text-xl uppercase tracking-widest text-white">Credentials</h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-white">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                
                <form onSubmit={handleCreateEntry} className="space-y-6">
                    <div className="space-y-2 group">
                        <label className="text-[10px] font-mono text-zinc-500 uppercase group-focus-within:text-white transition-colors">Identifier (Title)</label>
                        <input 
                            required
                            type="text" 
                            value={newEntryTitle} 
                            onChange={e => setNewEntryTitle(e.target.value)}
                            placeholder="e.g. MEGA_CORP_MAINFrame"
                            className="w-full bg-zinc-950 border border-zinc-800 p-4 text-white font-mono text-sm focus:border-white focus:outline-none transition-colors placeholder-zinc-800"
                        />
                    </div>
                    
                    <div className="space-y-2 group">
                        <label className="text-[10px] font-mono text-zinc-500 uppercase group-focus-within:text-white transition-colors">User_ID</label>
                        <input 
                            type="text" 
                            value={newEntryUser} 
                            onChange={e => setNewEntryUser(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 p-4 text-white font-mono text-sm focus:border-white focus:outline-none transition-colors"
                        />
                    </div>

                    <div className="space-y-2 group">
                        <label className="text-[10px] font-mono text-zinc-500 uppercase group-focus-within:text-white transition-colors">Access_Key (Password)</label>
                        <input 
                            required
                            type="text" 
                            value={newEntryPass} 
                            onChange={e => setNewEntryPass(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 p-4 text-white font-mono text-sm focus:border-white focus:outline-none transition-colors"
                        />
                    </div>

                    <div className="space-y-2 group">
                        <label className="text-[10px] font-mono text-zinc-500 uppercase group-focus-within:text-white transition-colors">Classification</label>
                        <select 
                            value={newEntryCategory}
                            onChange={e => setNewEntryCategory(e.target.value as any)}
                            className="w-full bg-zinc-950 border border-zinc-800 p-4 text-white font-mono text-sm focus:border-white focus:outline-none appearance-none rounded-none"
                        >
                            <option value="other">UNCLASSIFIED</option>
                            <option value="work">CORPORATE</option>
                            <option value="social">SOCIAL_NET</option>
                            <option value="finance">FINANCIAL</option>
                        </select>
                    </div>

                    <div className="pt-4">
                        <Button type="submit" className="w-full">
                            ENCRYPT & STORE
                        </Button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default App;