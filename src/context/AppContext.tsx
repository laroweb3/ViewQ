import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppSettings, TerminalLog, VaultRecord, EphemeralShare } from '../types';

interface AppContextType {
  settings: AppSettings;
  updateSettings: (newSettings: AppSettings) => void;
  vaults: VaultRecord[];
  addVault: (record: VaultRecord) => void;
  deleteVault: (id: string) => void;
  logs: TerminalLog[];
  addLog: (level: TerminalLog['level'], message: string) => void;
  clearLogs: () => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  activeTab: 'transmission' | 'settings' | 'history' | 'telemetry' | 'shares' | 'verify';
  setActiveTab: (tab: 'transmission' | 'settings' | 'history' | 'telemetry' | 'shares' | 'verify') => void;
  
  // User Authentication State
  user: { username: string; authType: 'passkey' | 'diceware' } | null;
  login: (username: string, authType: 'passkey' | 'diceware') => void;
  logout: () => void;
  
  // Ephemeral Shares State
  ephemeralShares: EphemeralShare[];
  addEphemeralShare: (share: EphemeralShare) => void;
  updateEphemeralShare: (updated: EphemeralShare) => void;
  deleteEphemeralShare: (token: string) => void;

  // Language State
  language: 'es' | 'en';
  setLanguage: (lang: 'es' | 'en') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const DEFAULT_SETTINGS: AppSettings = {
  ionqApiToken: '',
  target: 'ionq.simulator',
  apiProxyBaseUrl: 'https://api.ionq.co/v0.3',
  stellarSourceSecret: '',
  stellarNetwork: 'testnet',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Initialize settings from localStorage
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('quantum_pqc_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_SETTINGS, ...parsed };
      } catch (e) {
        return DEFAULT_SETTINGS;
      }
    }
    return DEFAULT_SETTINGS;
  });

  // 2. Initialize vaults from localStorage
  const [vaults, setVaults] = useState<VaultRecord[]>(() => {
    const saved = localStorage.getItem('quantum_pqc_vaults');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  // 3. Initialize ephemeral shares from localStorage
  const [ephemeralShares, setEphemeralShares] = useState<EphemeralShare[]>(() => {
    const saved = localStorage.getItem('quantum_pqc_shares');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  // 4. Initialize user from localStorage
  const [user, setUser] = useState<{ username: string; authType: 'passkey' | 'diceware' } | null>(() => {
    const saved = localStorage.getItem('quantum_pqc_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  // 5. Initialize active states
  const [logs, setLogs] = useState<TerminalLog[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'transmission' | 'settings' | 'history' | 'telemetry' | 'shares' | 'verify'>('transmission');

  // Initialize language from localStorage (defaults to 'es')
  const [language, setLanguageState] = useState<'es' | 'en'>(() => {
    const saved = localStorage.getItem('quantum_pqc_language');
    return (saved === 'en' || saved === 'es') ? saved : 'es';
  });

  const setLanguage = (lang: 'es' | 'en') => {
    setLanguageState(lang);
    localStorage.setItem('quantum_pqc_language', lang);
  };

  // Sync vaults to localStorage when modified
  useEffect(() => {
    localStorage.setItem('quantum_pqc_vaults', JSON.stringify(vaults));
  }, [vaults]);

  // Sync ephemeral shares to localStorage
  useEffect(() => {
    localStorage.setItem('quantum_pqc_shares', JSON.stringify(ephemeralShares));
  }, [ephemeralShares]);

  // Sync user to localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem('quantum_pqc_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('quantum_pqc_user');
    }
  }, [user]);

  const updateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    localStorage.setItem('quantum_pqc_settings', JSON.stringify(newSettings));
  };

  const addVault = (record: VaultRecord) => {
    setVaults(prev => [record, ...prev]);
  };

  const deleteVault = (id: string) => {
    setVaults(prev => prev.filter(v => v.id !== id));
  };

  const addEphemeralShare = (share: EphemeralShare) => {
    setEphemeralShares(prev => [share, ...prev]);
  };

  const updateEphemeralShare = (updated: EphemeralShare) => {
    setEphemeralShares(prev => prev.map(s => s.token === updated.token ? updated : s));
  };

  const deleteEphemeralShare = (token: string) => {
    setEphemeralShares(prev => prev.filter(s => s.token !== token));
  };

  const login = (username: string, authType: 'passkey' | 'diceware') => {
    setUser({ username, authType });
    addLog('SUCCESS', `AUTENTICACIÓN EXITOSA: Sesión iniciada para ${username.toUpperCase()} mediante ${authType === 'passkey' ? 'PASSKEY BIOMÉTRICO CUÁNTICO' : 'DICEWARE CUÁNTICO'}`);
  };

  const logout = () => {
    setUser(null);
    addLog('INFO', 'Sesión de fiscalía cerrada correctamente.');
  };

  const addLog = (level: TerminalLog['level'], message: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    const timestamp = new Date().toLocaleTimeString('es-ES', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }) + `.${String(new Date().getMilliseconds()).padStart(3, '0')}`;
    
    setLogs(prev => [...prev, { id, timestamp, level, message }]);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  // Pre-populate demo data if empty
  useEffect(() => {
    if (vaults.length === 0) {
      const initializeDemo = async () => {
        const demoMessage = 'Este es un expediente de prueba judicial consolidado bajo el estándar NIST ML-KEM-768 y anclado en Stellar.';
        const sharedSecretSs = 'f9d8a7c6b5e4d3c2b1a09f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c';
        const ivHex = 'd4e5f60718293a4b5c6d7e8f';
        
        let encryptedData = 'ca712b3f1a0e9d28c3b7a5e9a0c1e4c2b8a7190a2c3b88aa091fcf3177bb9c'; // Fallback
        
        try {
          // Import raw sharedSecretSs bytes for encryption
          const cleanHex = sharedSecretSs;
          const keyBytes = new Uint8Array(cleanHex.length / 2);
          for (let i = 0; i < keyBytes.length; i++) {
            keyBytes[i] = parseInt(cleanHex.substring(i * 2, i * 2 + 2), 16);
          }
          
          const cryptoKey = await window.crypto.subtle.importKey(
            'raw',
            keyBytes,
            { name: 'AES-GCM' },
            false,
            ['encrypt']
          );
          
          const ivBytes = new Uint8Array(ivHex.length / 2);
          for (let i = 0; i < ivBytes.length; i++) {
            ivBytes[i] = parseInt(ivHex.substring(i * 2, i * 2 + 2), 16);
          }
          
          const textEncoder = new TextEncoder();
          const plaintextBytes = textEncoder.encode(demoMessage);
          
          const encryptedBuffer = await window.crypto.subtle.encrypt(
            {
              name: 'AES-GCM',
              iv: ivBytes,
            },
            cryptoKey,
            plaintextBytes
          );
          
          const encryptedBytes = new Uint8Array(encryptedBuffer);
          encryptedData = Array.from(encryptedBytes)
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
        } catch (e) {
          console.error('Failed to pre-encrypt demo message', e);
        }

        const demoRecord: VaultRecord = {
          id: 'vault-demo-1',
          title: 'Expediente Confidencial de Prueba - NIST-Kyber-768',
          timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
          notes: 'Sellado de prueba inicial ejecutado con entropía cuántica de simulación.',
          manifest: {
            version: '1.0.0',
            timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
            algorithm: {
              kem: 'NIST ML-KEM-768 (Kyber)',
              symmetric: 'AES-256-GCM',
              hash: 'SHA3-256',
            },
            parameters: {
              k: 3,
              q: 3329,
              eta1: 2,
            },
            quantumSource: {
              provider: 'IonQ QRNG Core v0.3',
              target: 'ionq.simulator',
              jobId: 'demo-job-quantum-entropy-7711-20a8',
              isSimulated: true,
              quantumSeed: 'a1b2c3d4e5f60718293a4b5c6d7e8f9001122334455667788990aabbccddeeff',
            },
            cryptographicKeys: {
              encapsulationKeyEk: 'EK_MLKEM768_t0:8aef31c4f909187319bc83a2139871fc_t1:1c83a2139871fc8aef31c4f909187319_t2:aef31c4f909187319bc83a2139871fc1_seedA:9c83a2139871fc8a',
              decapsulationKeyDk: 'DK_MLKEM768_s0:09187319bc83a2139871fc8aef31c4f9_s1:bc83a2139871fc8aef31c4f909187319_s2:8aef31c4f909187319bc83a2139871fc1',
              ciphertextCt: 'CT_MLKEM768_u0:9871fc8aef31c4f909187319_u1:c4f909187319bc83a2139871fc8_u2:aef31c4f909187319bc83a21_v:bc83a2139871fc8aef31c4f909187319bc8',
              sharedSecretSs: sharedSecretSs,
            },
            payload: {
              originalFilename: 'manifesto_judicial.txt',
              sha3Hash: 'a571f3918a0918a2bc83a2139871fc8aef31c4f909187319bc83a2139871fca4',
              iv: ivHex,
              encryptedData: encryptedData,
            },
          },
          stellarNotarization: {
            txHash: 'a87ff9871fcaef31c4f909187319bc83a2139871fc8aef31c4f909187319abcd',
            ledger: 50921820,
            network: 'testnet',
            timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
            memo: 'SHA3:a571f3918a0918a2bc83...a4',
          },
        };
        setVaults([demoRecord]);
      };
      initializeDemo();
    }
  }, [vaults]);

  return (
    <AppContext.Provider
      value={{
        settings,
        updateSettings,
        vaults,
        addVault,
        deleteVault,
        logs,
        addLog,
        clearLogs,
        sidebarOpen,
        setSidebarOpen,
        activeTab,
        setActiveTab,
        user,
        login,
        logout,
        ephemeralShares,
        addEphemeralShare,
        updateEphemeralShare,
        deleteEphemeralShare,
        language,
        setLanguage,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
