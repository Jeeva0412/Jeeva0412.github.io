import React, { useState, useEffect } from 'react';
import { Lock, ArrowRight, ShieldAlert, Terminal } from 'lucide-react';
import { Button } from './Button';

interface AccessTerminalProps {
  onUnlock: (password: string) => void;
  isLoading: boolean;
  error?: string;
}

const AccessTerminal: React.FC<AccessTerminalProps> = ({ onUnlock, isLoading, error }) => {
  const [input, setInput] = useState('');
  const [bootSequence, setBootSequence] = useState<string[]>([]);
  
  useEffect(() => {
    const logs = [
        "INITIALIZING SECURE CORE...",
        "CHECKING INTEGRITY...",
        "CONNECTING TO SUPABASE...",
        "ESTABLISHING SECURE CHANNEL...",
        "READY FOR AUTHENTICATION."
    ];
    let delay = 0;
    logs.forEach((log, i) => {
        // Reduced delays significantly for speed
        delay += Math.random() * 100 + 50; 
        setTimeout(() => {
            setBootSequence(prev => [...prev, `[SYSTEM] ${log}`]);
        }, delay);
    });
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) onUnlock(input);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-lg border-2 border-zinc-800 bg-zinc-950/90 relative p-8 shadow-[0_0_50px_rgba(255,255,255,0.05)]">
        {/* Terminal Header */}
        <div className="absolute top-0 left-0 w-full h-8 bg-zinc-900 border-b border-zinc-800 flex items-center px-4 justify-between">
            <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500"></div>
            </div>
            <span className="font-mono text-xs text-zinc-500">SECURE_ACCESS_V2.0</span>
        </div>

        <div className="mt-8 space-y-6 font-mono">
            {/* Boot Logs */}
            <div className="h-32 overflow-hidden text-xs text-zinc-500 space-y-1 mb-8 border-l border-zinc-800 pl-4">
                {bootSequence.map((log, i) => (
                    <div key={i}>{log}</div>
                ))}
                <div className="animate-blink">_</div>
            </div>

            <div className="text-center space-y-2">
                <Lock className="w-12 h-12 mx-auto text-white mb-4 animate-pulse" />
                <h1 className="text-2xl font-bold tracking-[0.2em] text-white">VOID_VAULT</h1>
                <p className="text-sm text-zinc-500">ZERO KNOWLEDGE ENCRYPTION ACTIVE</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 relative">
                <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">></span>
                    <input
                        type="password"
                        autoFocus
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="ENTER MASTER KEY"
                        className="w-full bg-black border border-zinc-700 py-4 pl-10 pr-4 text-white font-mono focus:border-white focus:outline-none focus:ring-1 focus:ring-white transition-all uppercase tracking-widest placeholder-zinc-700"
                    />
                    {/* Decorative edges */}
                    <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white opacity-50 group-hover:opacity-100 transition-opacity"/>
                    <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white opacity-50 group-hover:opacity-100 transition-opacity"/>
                </div>

                <Button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full"
                >
                    {isLoading ? "DECRYPTING..." : "AUTHENTICATE"}
                </Button>

                {error && (
                    <div className="flex items-center gap-2 text-red-500 text-xs font-mono justify-center mt-4 bg-red-900/10 p-2 border border-red-900/50">
                        <ShieldAlert className="w-4 h-4" />
                        {error}
                    </div>
                )}
            </form>
        </div>
      </div>
    </div>
  );
};

export default AccessTerminal;