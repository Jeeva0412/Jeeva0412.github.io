import React, { useState } from 'react';
import { PasswordEntry } from '../types';
import { Trash2, Copy, Eye, EyeOff, Shield, Database, AlertTriangle } from 'lucide-react';

interface PasswordListProps {
  passwords: PasswordEntry[];
  onDelete: (id: string) => void;
}

const PasswordCard: React.FC<{ entry: PasswordEntry; onDelete: (id: string) => void; isDuplicate: boolean }> = ({ entry, onDelete, isDuplicate }) => {
  const [revealed, setRevealed] = useState(false);
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(entry.passwordValue);
  };

  return (
    <div className={`group relative bg-black border ${isDuplicate ? 'border-red-900/50' : 'border-zinc-800'} hover:border-white transition-colors duration-300`}>
      {/* Corner Accents */}
      <div className="absolute top-0 left-0 w-1 h-1 bg-white opacity-20 group-hover:opacity-100 transition-opacity"></div>
      <div className="absolute top-0 right-0 w-1 h-1 bg-white opacity-20 group-hover:opacity-100 transition-opacity"></div>
      <div className="absolute bottom-0 left-0 w-1 h-1 bg-white opacity-20 group-hover:opacity-100 transition-opacity"></div>
      <div className="absolute bottom-0 right-0 w-1 h-1 bg-white opacity-20 group-hover:opacity-100 transition-opacity"></div>

      {/* Header */}
      <div className="p-4 border-b border-zinc-900 flex justify-between items-start bg-zinc-950">
        <div>
           <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 ${
                  entry.category === 'social' ? 'bg-blue-500 shadow-[0_0_8px_blue]' : 
                  entry.category === 'finance' ? 'bg-green-500 shadow-[0_0_8px_green]' :
                  entry.category === 'work' ? 'bg-purple-500 shadow-[0_0_8px_purple]' : 'bg-zinc-500'
              }`} />
              <h3 className="font-bold font-mono text-sm tracking-wide text-white group-hover:text-neon transition-colors">
                {entry.title}
              </h3>
           </div>
           <p className="text-[10px] text-zinc-500 font-mono mt-1 uppercase tracking-wider pl-3.5">
             ID: {entry.username}
           </p>
        </div>
        
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
           <button onClick={copyToClipboard} className="p-1.5 hover:bg-white hover:text-black transition-colors"><Copy className="w-3 h-3" /></button>
           <button onClick={() => onDelete(entry.id)} className="p-1.5 hover:bg-red-600 hover:text-white text-red-900 transition-colors"><Trash2 className="w-3 h-3" /></button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 bg-black/50 relative overflow-hidden">
         {/* Scanline overlay for card */}
         <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNCIgaGVpZ2h0PSI0IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Ik0wIDBoNHYxSDB6IiBmaWxsPSJyZ2JhKDI1NSwgMjU1LDI1NSwgMC4wNSkiIGZpbGwtcnVsZT0iZXZlbm9kZCIvPjwvc3ZnPg==')] opacity-20 pointer-events-none"></div>

         <div className="flex items-center justify-between">
            <div className={`font-mono text-xs tracking-widest ${revealed ? 'text-white' : 'text-zinc-600 blur-[2px] select-none'}`}>
               {revealed ? entry.passwordValue : '••••••••••••••••'}
            </div>
            <button onClick={() => setRevealed(!revealed)} className="text-zinc-600 hover:text-white transition-colors">
               {revealed ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
            </button>
         </div>
         
         <div className="mt-3 flex justify-between items-end border-t border-zinc-900 pt-2">
            <div className="flex items-center gap-2">
                 <span className="text-[9px] text-zinc-600 font-mono">AES_256</span>
                 {isDuplicate && (
                     <div className="flex items-center gap-1 text-[9px] text-red-500 animate-pulse font-bold">
                         <AlertTriangle className="w-3 h-3" />
                         REUSED_PW
                     </div>
                 )}
            </div>
            <span className="text-[9px] text-zinc-600 font-mono">{new Date(entry.createdAt).toLocaleDateString()}</span>
         </div>
      </div>
    </div>
  );
};

const PasswordList: React.FC<PasswordListProps> = ({ passwords, onDelete }) => {
    // Calculate duplicates
    const passwordCounts = passwords.reduce((acc, entry) => {
        acc[entry.passwordValue] = (acc[entry.passwordValue] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    if (passwords.length === 0) {
        return (
            <div className="w-full flex flex-col items-center justify-center py-24 border-2 border-dashed border-zinc-900 text-zinc-700 font-mono bg-zinc-950/30">
                <Database className="w-16 h-16 mb-4 opacity-20" />
                <p className="tracking-widest text-sm">DATABASE_EMPTY</p>
                <p className="text-[10px] mt-2 opacity-50">Initiate new entry sequence</p>
            </div>
        )
    }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {passwords.map(entry => (
        <PasswordCard 
            key={entry.id} 
            entry={entry} 
            onDelete={onDelete} 
            isDuplicate={passwordCounts[entry.passwordValue] > 1}
        />
      ))}
    </div>
  );
};

export default PasswordList;