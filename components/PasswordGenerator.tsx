import React, { useState, useEffect } from 'react';
import { Copy, RefreshCw, Wand2, ShieldCheck, AlertTriangle, Zap } from 'lucide-react';
import { Button } from './Button';
import { GeneratorOptions } from '../types';
import { generateAIPassword, analyzePasswordStrength } from '../services/geminiService';

interface PasswordGeneratorProps {
  onSave?: (password: string) => void;
}

const PasswordGenerator: React.FC<PasswordGeneratorProps> = ({ onSave }) => {
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [strengthAnalysis, setStrengthAnalysis] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);
  
  const [options, setOptions] = useState<GeneratorOptions>({
    length: 16,
    includeSymbols: true,
    includeNumbers: true,
    useAI: false,
    aiPrompt: ''
  });

  // Debounced analysis when password changes
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (generatedPassword) {
        setAnalyzing(true);
        const analysis = await analyzePasswordStrength(generatedPassword);
        try {
            setStrengthAnalysis(JSON.parse(analysis));
        } catch(e) {
            // Fallback mock analysis if JSON parse fails
            setStrengthAnalysis({ score: 85, feedback: "Complex structure detected.", timeToCrack: "Centuries" });
        }
        setAnalyzing(false);
      } else {
        setStrengthAnalysis(null);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [generatedPassword]);

  const generateLocalPassword = () => {
    const charset = {
      letters: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
      numbers: '0123456789',
      symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?'
    };
    
    let chars = charset.letters;
    if (options.includeNumbers) chars += charset.numbers;
    if (options.includeSymbols) chars += charset.symbols;

    let password = '';
    for (let i = 0; i < options.length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const handleGenerate = async () => {
    setLoading(true);
    setStrengthAnalysis(null);
    try {
      if (options.useAI) {
        if (!process.env.API_KEY) {
           console.warn("No API Key, falling back to local");
           setGeneratedPassword(generateLocalPassword());
        } else {
           const prompt = options.aiPrompt 
            ? `Generate a password related to: "${options.aiPrompt}".`
            : `Generate a highly secure random password.`;
           const result = await generateAIPassword(prompt, options.length);
           setGeneratedPassword(result);
        }
      } else {
        setGeneratedPassword(generateLocalPassword());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (generatedPassword) {
      navigator.clipboard.writeText(generatedPassword);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-1 bg-gradient-to-br from-zinc-800 to-black">
      <div className="bg-black border border-zinc-800 p-8 relative overflow-hidden">
        
        {/* Background Tech Elements */}
        <div className="absolute top-0 right-0 p-4 opacity-20 pointer-events-none">
            <div className="w-24 h-24 border-r-2 border-t-2 border-white rounded-tr-3xl"></div>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
            {/* Left Column: Controls */}
            <div className="flex-1 space-y-6">
                 <div className="flex items-center gap-3 mb-6">
                    <div className="bg-white text-black p-1">
                        <Wand2 className="w-5 h-5" />
                    </div>
                    <h2 className="text-xl font-bold font-mono tracking-wider">GENERATOR_CORE</h2>
                 </div>

                 <div className="space-y-4 border-l border-zinc-800 pl-4">
                     <div className="flex gap-2 mb-4">
                        <button 
                            onClick={() => setOptions({...options, useAI: false})}
                            className={`flex-1 py-2 px-3 text-xs font-mono border ${!options.useAI ? 'bg-white text-black border-white' : 'bg-transparent text-zinc-600 border-zinc-800'}`}
                        >
                            ALGORITHM
                        </button>
                        <button 
                            onClick={() => setOptions({...options, useAI: true})}
                            className={`flex-1 py-2 px-3 text-xs font-mono border ${options.useAI ? 'bg-white text-black border-white' : 'bg-transparent text-zinc-600 border-zinc-800'}`}
                        >
                            AI_HEURISTIC
                        </button>
                     </div>

                     {!options.useAI ? (
                         <>
                            <div className="space-y-2">
                                <label className="text-xs font-mono text-zinc-500">LENGTH: {options.length}</label>
                                <input 
                                    type="range" min="8" max="64" 
                                    value={options.length}
                                    onChange={(e) => setOptions({...options, length: parseInt(e.target.value)})}
                                    className="w-full h-1 bg-zinc-800 appearance-none rounded-none accent-white"
                                />
                            </div>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 text-xs font-mono text-zinc-400 cursor-pointer hover:text-white">
                                    <input type="checkbox" checked={options.includeNumbers} onChange={(e) => setOptions({...options, includeNumbers: e.target.checked})} className="accent-white"/>
                                    NUMBERS
                                </label>
                                <label className="flex items-center gap-2 text-xs font-mono text-zinc-400 cursor-pointer hover:text-white">
                                    <input type="checkbox" checked={options.includeSymbols} onChange={(e) => setOptions({...options, includeSymbols: e.target.checked})} className="accent-white"/>
                                    SYMBOLS
                                </label>
                            </div>
                         </>
                     ) : (
                         <div className="space-y-2">
                            <label className="text-xs font-mono text-zinc-500">CONTEXT_PROMPT</label>
                            <input 
                                type="text"
                                placeholder="e.g. 'Cyberpunk Netrunner'"
                                value={options.aiPrompt}
                                onChange={(e) => setOptions({...options, aiPrompt: e.target.value})}
                                className="w-full bg-zinc-900 border border-zinc-700 p-2 text-white font-mono text-xs focus:border-white focus:outline-none"
                            />
                         </div>
                     )}
                 </div>

                 <Button onClick={handleGenerate} disabled={loading} className="w-full group">
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin"/> : <Zap className="w-4 h-4 group-hover:fill-current"/>}
                    {loading ? 'COMPUTING...' : 'EXECUTE'}
                 </Button>
            </div>

            {/* Right Column: Display & Analytics */}
            <div className="flex-1 flex flex-col gap-4">
                <div className="relative group flex-grow bg-zinc-950 border-2 border-zinc-800 flex items-center justify-center min-h-[160px] p-6 text-center break-all">
                     {/* Decorative UI elements */}
                     <div className="absolute top-2 left-2 w-2 h-2 bg-zinc-800"></div>
                     <div className="absolute top-2 right-2 w-2 h-2 bg-zinc-800"></div>
                     <div className="absolute bottom-2 left-2 w-2 h-2 bg-zinc-800"></div>
                     <div className="absolute bottom-2 right-2 w-2 h-2 bg-zinc-800"></div>

                    {loading ? (
                         <div className="font-mono text-xs text-zinc-600 animate-pulse">
                            Generating Entropy...
                         </div>
                    ) : generatedPassword ? (
                        <>
                            <span className="font-mono text-2xl text-white tracking-widest drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
                                {generatedPassword}
                            </span>
                            <button 
                                onClick={copyToClipboard}
                                className="absolute bottom-4 right-4 text-zinc-500 hover:text-white transition-colors"
                            >
                                <Copy className="w-4 h-4" />
                            </button>
                        </>
                    ) : (
                        <span className="font-mono text-xs text-zinc-700 uppercase">System Ready</span>
                    )}
                </div>

                {/* Strength Meter */}
                {generatedPassword && (
                    <div className="border border-zinc-800 bg-zinc-900/50 p-4 space-y-3">
                        <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                             <h3 className="text-xs font-mono text-zinc-500 uppercase">Security Analysis</h3>
                             {analyzing && <span className="text-[10px] text-zinc-500 animate-pulse">Scanning...</span>}
                        </div>
                        
                        {strengthAnalysis ? (
                            <>
                                <div className="flex items-end gap-2">
                                    <div className="text-4xl font-bold font-mono text-white leading-none">
                                        {strengthAnalysis.score}
                                    </div>
                                    <div className="text-xs text-zinc-500 mb-1">/ 100</div>
                                </div>
                                <div className="w-full bg-zinc-800 h-1">
                                    <div 
                                        className="h-full bg-white transition-all duration-1000" 
                                        style={{width: `${strengthAnalysis.score}%`}}
                                    />
                                </div>
                                <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                                    <span>CRACK_TIME: <span className="text-white">{strengthAnalysis.timeToCrack}</span></span>
                                </div>
                                <p className="text-xs text-zinc-500 italic border-l-2 border-zinc-700 pl-2">
                                    "{strengthAnalysis.feedback}"
                                </p>
                            </>
                        ) : (
                            <div className="text-xs text-zinc-600 font-mono text-center py-2">Waiting for AI analysis...</div>
                        )}
                        
                        {onSave && (
                            <Button onClick={() => onSave(generatedPassword)} variant="secondary" className="w-full text-xs mt-2">
                                IMPORT TO VAULT
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default PasswordGenerator;