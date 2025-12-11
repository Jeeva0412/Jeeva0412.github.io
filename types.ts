export interface PasswordEntry {
  id: string;
  title: string;
  username: string;
  passwordValue: string;
  category: 'social' | 'work' | 'finance' | 'other';
  createdAt: number;
}

export interface GeneratorOptions {
  length: number;
  includeSymbols: boolean;
  includeNumbers: boolean;
  useAI: boolean;
  aiPrompt?: string;
}

export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  GENERATOR = 'GENERATOR',
  SETTINGS = 'SETTINGS'
}
