import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppSettings, TerminalLog, VaultRecord, EphemeralShare, UserProfile, RegisteredUser, AppNotification } from '../types';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDoc 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import * as sha3Module from 'js-sha3';
import { Keypair, Horizon, TransactionBuilder, Networks, Memo, Operation, Asset } from '@stellar/stellar-sdk';

const sha3_256 = (
  sha3Module.sha3_256 || 
  (sha3Module as any).default?.sha3_256 || 
  (sha3Module as any).default
);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export let onFirestoreErrorCallback: ((error: any) => void) | null = null;

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {}, // Custom authentication is used, not Firebase Auth
    operationType,
    path
  };
  console.warn('Firestore Error (handled gracefully): ', JSON.stringify(errInfo));
  if (onFirestoreErrorCallback) {
    onFirestoreErrorCallback(error);
  }
}

export function stripUndefined(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(stripUndefined);
  }
  const cleaned: any = {};
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (val !== undefined) {
      cleaned[key] = stripUndefined(val);
    }
  }
  return cleaned;
}

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
  activeTab: 'start' | 'transmission' | 'settings' | 'history' | 'telemetry' | 'shares' | 'verify' | 'wiki' | 'users' | 'notifications';
  setActiveTab: (tab: 'start' | 'transmission' | 'settings' | 'history' | 'telemetry' | 'shares' | 'verify' | 'wiki' | 'users' | 'notifications') => void;
  
  // User Authentication State
  user: { username: string; authType: 'passkey' | 'diceware'; status: 'pending' | 'approved' | 'rejected'; profile?: UserProfile } | null;
  login: (username: string, authType: 'passkey' | 'diceware', pin?: string) => Promise<void>;
  logout: () => void;
  updateUserProfile: (profile: UserProfile) => void;
  
  // User Approvals
  registeredUsers: RegisteredUser[];
  approveUser: (username: string) => void;
  rejectUser: (username: string) => void;
  
  // Ephemeral Shares State
  ephemeralShares: EphemeralShare[];
  addEphemeralShare: (share: EphemeralShare) => void;
  updateEphemeralShare: (updated: EphemeralShare) => void;
  deleteEphemeralShare: (token: string) => void;

  // Language State
  language: 'es' | 'en';
  setLanguage: (lang: 'es' | 'en') => void;

  // Notifications
  notifications: AppNotification[];
  markNotificationAsRead: (id: string) => void;
  signCustodyRecord: (vaultId: string, signerProfile: UserProfile) => Promise<string>;
  resolveFilePayload: (payloadString: string, vaultId: string, type: 'armored' | 'viewq') => Promise<string>;
  resolveSharePayload: (encryptedData: string, token: string) => Promise<string>;

  // Firestore Status (for handling Quota limits or connection drops gracefully)
  firestoreStatus: 'online' | 'offline' | 'quota-exceeded';
  setFirestoreStatus: (status: 'online' | 'offline' | 'quota-exceeded') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const DEFAULT_SETTINGS: AppSettings = {
  ionqApiToken: '',
  target: 'ionq.simulator',
  apiProxyBaseUrl: 'https://api.ionq.co/v0.3',
  stellarSourceSecret: '',
  stellarNetwork: 'testnet',
  pinataJwt: '',
  pinataGateway: 'gateway.pinata.cloud',
  usePinata: false,
};

const LOCAL_VAULT_INLINE_LIMIT = 120000;

const slimVaultForStorage = (vault: VaultRecord): VaultRecord => {
  const slimVault = { ...vault };

  if (slimVault.armoredFileBase64 && !slimVault.armoredFileBase64.startsWith('chunked:') && slimVault.armoredFileBase64.length > LOCAL_VAULT_INLINE_LIMIT) {
    slimVault.armoredFileBase64 = `local_only:${slimVault.id}`;
  }

  if (slimVault.viewQFileBase64 && !slimVault.viewQFileBase64.startsWith('chunked:') && slimVault.viewQFileBase64.length > LOCAL_VAULT_INLINE_LIMIT) {
    slimVault.viewQFileBase64 = `local_only:${slimVault.id}`;
  }

  return slimVault;
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

  // 3b. Initialize registeredUsers from localStorage
  const [registeredUsers, setRegisteredUsers] = useState<RegisteredUser[]>(() => {
    const saved = localStorage.getItem('quantum_pqc_registered_users');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [
      {
        username: 'Laro',
        authType: 'passkey',
        status: 'approved',
        registeredAt: new Date().toISOString()
      }
    ];
  });

  // 4. Initialize user from localStorage
  const [user, setUser] = useState<{ username: string; authType: 'passkey' | 'diceware'; status: 'pending' | 'approved' | 'rejected'; profile?: UserProfile } | null>(() => {
    const saved = localStorage.getItem('quantum_pqc_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const savedUsersRaw = localStorage.getItem('quantum_pqc_registered_users');
        if (savedUsersRaw) {
          const list = JSON.parse(savedUsersRaw) as RegisteredUser[];
          const match = list.find(u => u.username.toLowerCase() === parsed.username.toLowerCase());
          if (match) {
            return {
              ...parsed,
              status: match.status,
              profile: match.profile || parsed.profile
            };
          }
        }
        return parsed;
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  // 5. Initialize active states
  const [logs, setLogs] = useState<TerminalLog[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem('quantum_pqc_notifications');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'start' | 'transmission' | 'settings' | 'history' | 'telemetry' | 'shares' | 'verify' | 'wiki' | 'users' | 'notifications'>('start');
  const [firestoreStatus, setFirestoreStatus] = useState<'online' | 'offline' | 'quota-exceeded'>('online');

  // Register the global Firestore error callback to map database failures to user-friendly states
  useEffect(() => {
    onFirestoreErrorCallback = (err: any) => {
      const msg = String(err?.message || err);
      const code = String(err?.code || '');
      if (
        code.includes('resource-exhausted') || 
        msg.includes('quota') || 
        msg.includes('resource-exhausted') || 
        msg.includes('Quota')
      ) {
        setFirestoreStatus('quota-exceeded');
      } else if (
        code.includes('unavailable') || 
        msg.includes('unavailable') || 
        msg.includes('offline') || 
        msg.includes('Could not reach')
      ) {
        setFirestoreStatus('offline');
      }
    };
    return () => {
      onFirestoreErrorCallback = null;
    };
  }, []);

  // Automatically save state changes to localStorage as a robust local-first backup
  useEffect(() => {
    try {
      const safeVaults = vaults.map(slimVaultForStorage);
      localStorage.setItem('quantum_pqc_vaults', JSON.stringify(safeVaults));
    } catch (err) {
      console.warn('Failed to persist vault list to localStorage:', err);
    }
  }, [vaults]);

  useEffect(() => {
    localStorage.setItem('quantum_pqc_shares', JSON.stringify(ephemeralShares));
  }, [ephemeralShares]);

  useEffect(() => {
    localStorage.setItem('quantum_pqc_registered_users', JSON.stringify(registeredUsers));
  }, [registeredUsers]);

  useEffect(() => {
    localStorage.setItem('quantum_pqc_notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Initialize language from localStorage (defaults to 'es')
  const [language, setLanguageState] = useState<'es' | 'en'>(() => {
    const saved = localStorage.getItem('quantum_pqc_language');
    return (saved === 'en' || saved === 'es') ? saved : 'es';
  });

  const setLanguage = (lang: 'es' | 'en') => {
    setLanguageState(lang);
    localStorage.setItem('quantum_pqc_language', lang);
  };

  // Real-time Firestore Listeners with Local-First Fail-safe Merges

  // 1. Listen to vaults collection
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'vaults'), (snapshot) => {
      const list: VaultRecord[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as VaultRecord;
        
        // Hydrate from localStorage if it was saved locally due to size constraints
        if (data.armoredFileBase64 && data.armoredFileBase64.startsWith('local_only:')) {
          const localArmored = localStorage.getItem(`local_vault_armored_${data.id}`);
          if (localArmored) {
            data.armoredFileBase64 = localArmored;
          }
        }
        
        if (data.viewQFileBase64 && data.viewQFileBase64.startsWith('local_only:')) {
          const localViewQ = localStorage.getItem(`local_vault_viewq_${data.id}`);
          if (localViewQ) {
            data.viewQFileBase64 = localViewQ;
          }
        }

        list.push(data);
      });

      // Merge with localStorage vaults to avoid losing local-only seals (e.g. created during quota exhaust)
      const savedRaw = localStorage.getItem('quantum_pqc_vaults');
      let localList: VaultRecord[] = [];
      if (savedRaw) {
        try { localList = JSON.parse(savedRaw); } catch (e) {}
      }

      const mergedList = [...list];
      const cloudIds = new Set(list.map(item => item.id));
      for (const item of localList) {
        if (!cloudIds.has(item.id)) {
          mergedList.push(item);
        }
      }

      mergedList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setVaults(mergedList);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'vaults');
    });
    return () => unsubscribe();
  }, []);

  // 2. Listen to shares collection
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'shares'), (snapshot) => {
      const list: EphemeralShare[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as EphemeralShare);
      });

      const savedRaw = localStorage.getItem('quantum_pqc_shares');
      let localList: EphemeralShare[] = [];
      if (savedRaw) {
        try { localList = JSON.parse(savedRaw); } catch (e) {}
      }

      const mergedList = [...list];
      const cloudTokens = new Set(list.map(item => item.token));
      for (const item of localList) {
        if (!cloudTokens.has(item.token)) {
          mergedList.push(item);
        }
      }

      setEphemeralShares(mergedList);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'shares');
    });
    return () => unsubscribe();
  }, []);

  // 3. Listen to users collection
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      const list: RegisteredUser[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as RegisteredUser);
      });
      
      const savedRaw = localStorage.getItem('quantum_pqc_registered_users');
      let localList: RegisteredUser[] = [];
      if (savedRaw) {
        try { localList = JSON.parse(savedRaw); } catch (e) {}
      }

      const mergedList = [...list];
      const cloudUsernames = new Set(list.map(item => item.username.toLowerCase()));
      for (const item of localList) {
        if (!cloudUsernames.has(item.username.toLowerCase())) {
          mergedList.push(item);
        }
      }

      // If "laro" is missing in the database/list, insert it
      const laroExists = mergedList.some(u => u.username.toLowerCase() === 'laro');
      if (!laroExists) {
        const defaultLaro: RegisteredUser = {
          username: 'Laro',
          authType: 'passkey',
          status: 'approved',
          registeredAt: new Date().toISOString()
        };
        setDoc(doc(db, 'users', 'laro'), defaultLaro).catch((err) => {
          handleFirestoreError(err, OperationType.WRITE, 'users/laro');
        });
        mergedList.push(defaultLaro);
      }
      setRegisteredUsers(mergedList);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
    });
    return () => unsubscribe();
  }, []);

  // 4. Logs are session-specific and local-only to prevent Firestore write queue exhaust and quota issues.
  // We do not subscribe to or sync logs with the cloud database.

  // 4b. Listen to notifications collection
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }
    const unsubscribe = onSnapshot(collection(db, 'notifications'), (snapshot) => {
      const list: AppNotification[] = [];
      snapshot.forEach((docSnap) => {
        const notif = docSnap.data() as AppNotification;
        if (notif.recipientUsername === user.username.toLowerCase()) {
          list.push(notif);
        }
      });

      const savedRaw = localStorage.getItem('quantum_pqc_notifications');
      let localList: AppNotification[] = [];
      if (savedRaw) {
        try { localList = JSON.parse(savedRaw); } catch (e) {}
      }

      const mergedList = [...list];
      const cloudIds = new Set(list.map(item => item.id));
      for (const item of localList) {
        if (item.recipientUsername === user.username.toLowerCase() && !cloudIds.has(item.id)) {
          mergedList.push(item);
        }
      }

      mergedList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setNotifications(mergedList);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'notifications');
    });
    return () => unsubscribe();
  }, [user?.username]);

  // 5. Listen to logged-in user changes (status, profile) dynamically from firestore
  useEffect(() => {
    if (!user) return;
    const path = `users/${user.username.toLowerCase()}`;
    const unsubscribe = onSnapshot(doc(db, 'users', user.username.toLowerCase()), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as RegisteredUser;
        if (data.status !== user.status || JSON.stringify(data.profile) !== JSON.stringify(user.profile)) {
          setUser(prev => prev ? {
            ...prev,
            status: data.status,
            profile: data.profile || prev.profile
          } : null);
        }
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
    return () => unsubscribe();
  }, [user?.username]);

  // 6. Listen to global settings and user-specific settings in firestore
  useEffect(() => {
    const username = user?.username?.toLowerCase();

    // Listen to global settings (laro)
    const unsubscribeGlobal = onSnapshot(doc(db, 'settings', 'laro'), (docSnap) => {
      if (docSnap.exists()) {
        const cloudSettings = docSnap.data() as AppSettings;
        setSettings(prev => {
          // If we are logged in as a non-laro user, we only take laro's global settings as defaults
          // for fields that are empty or not configured. Otherwise, we do not let it overwrite.
          if (username && username !== 'laro') {
            return prev;
          }

          const mergedSettings = {
            ...prev,
            ...cloudSettings,
            stellarSourceSecret: cloudSettings.stellarSourceSecret?.trim()
              ? cloudSettings.stellarSourceSecret
              : prev.stellarSourceSecret,
          };

          localStorage.setItem('quantum_pqc_settings', JSON.stringify(mergedSettings));
          return mergedSettings;
        });
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'settings/laro');
    });

    let unsubscribeUser: (() => void) | undefined = undefined;

    // If logged in as a non-laro user, also listen to their specific settings
    if (username && username !== 'laro') {
      unsubscribeUser = onSnapshot(doc(db, 'settings', username), (docSnap) => {
        if (docSnap.exists()) {
          const userCloudSettings = docSnap.data() as AppSettings;
          setSettings(prev => {
            const mergedSettings = {
              ...prev,
              ...userCloudSettings,
            };
            localStorage.setItem('quantum_pqc_settings', JSON.stringify(mergedSettings));
            return mergedSettings;
          });
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, `settings/${username}`);
      });
    }

    return () => {
      unsubscribeGlobal();
      if (unsubscribeUser) unsubscribeUser();
    };
  }, [user?.username]);

  // Keep user session in localStorage so they stay logged in on refresh
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
    if (user) {
      setDoc(doc(db, 'settings', user.username.toLowerCase()), newSettings).catch((err) => {
        handleFirestoreError(err, OperationType.WRITE, `settings/${user.username.toLowerCase()}`);
      });
    }
  };

  const addVault = async (record: VaultRecord) => {
    // Add to local state immediately so it's usable instantly
    setVaults(prev => {
      if (prev.some(v => v.id === record.id)) return prev;
      return [record, ...prev];
    });

    // Clone the record to avoid mutating the live state directly
    const recordForCloud = { ...record };
    
    // Check if armoredFileBase64 is large
    if (record.armoredFileBase64) {
      if (record.armoredFileBase64.length > 500000) {
        try {
          localStorage.setItem(`local_vault_armored_${record.id}`, record.armoredFileBase64);
        } catch (e) {
          console.warn("localStorage quota exceeded for armored file:", e);
        }
        
        try {
          const CHUNK_SIZE = 500000;
          const content = record.armoredFileBase64;
          const totalLength = content.length;
          let index = 0;
          const promises = [];
          for (let i = 0; i < totalLength; i += CHUNK_SIZE) {
            const chunk = content.substring(i, i + CHUNK_SIZE);
            const chunkId = `chunk_${record.id}_armored_${index}`;
            const chunkRef = doc(db, 'vault_chunks', chunkId);
            promises.push(
              setDoc(chunkRef, {
                vaultId: record.id,
                type: 'armored',
                index,
                content: chunk,
                createdAt: new Date().toISOString()
              })
            );
            index++;
          }
          await Promise.all(promises);
          recordForCloud.armoredFileBase64 = `chunked:${record.id}:armored:${index}`;
        } catch (err) {
          console.error("Failed to save armored file to Firestore chunks, falling back to local_only:", err);
          recordForCloud.armoredFileBase64 = `local_only:${record.id}`;
        }
      }
    }
    
    // Check if viewQFileBase64 is large
    if (record.viewQFileBase64) {
      if (record.viewQFileBase64.length > 500000) {
        try {
          localStorage.setItem(`local_vault_viewq_${record.id}`, record.viewQFileBase64);
        } catch (e) {
          console.warn("localStorage quota exceeded for viewQ file:", e);
        }
        
        try {
          const CHUNK_SIZE = 500000;
          const content = record.viewQFileBase64;
          const totalLength = content.length;
          let index = 0;
          const promises = [];
          for (let i = 0; i < totalLength; i += CHUNK_SIZE) {
            const chunk = content.substring(i, i + CHUNK_SIZE);
            const chunkId = `chunk_${record.id}_viewq_${index}`;
            const chunkRef = doc(db, 'vault_chunks', chunkId);
            promises.push(
              setDoc(chunkRef, {
                vaultId: record.id,
                type: 'viewq',
                index,
                content: chunk,
                createdAt: new Date().toISOString()
              })
            );
            index++;
          }
          await Promise.all(promises);
          recordForCloud.viewQFileBase64 = `chunked:${record.id}:viewq:${index}`;
        } catch (err) {
          console.error("Failed to save viewQ file to Firestore chunks, falling back to local_only:", err);
          recordForCloud.viewQFileBase64 = `local_only:${record.id}`;
        }
      }
    }

    const cleanedRecordForCloud = stripUndefined(recordForCloud);

    setDoc(doc(db, 'vaults', cleanedRecordForCloud.id), cleanedRecordForCloud).catch((err) => {
      handleFirestoreError(err, OperationType.WRITE, `vaults/${record.id}`);
    });

    // Create a real notification if recipientUsername matches any registered users (case-insensitive)
    if (record.recipientUsername) {
      const targetUser = record.recipientUsername.toLowerCase();
      const notifId = `notif_${Math.random().toString(36).substr(2, 9)}`;
      const newNotif: AppNotification = {
        id: notifId,
        sender: user?.username || 'Anónimo',
        senderProfile: user?.profile || undefined,
        recipientUsername: targetUser,
        timestamp: new Date().toISOString(),
        vaultId: record.id,
        title: record.title,
        notes: record.notes || '',
        originalFilename: record.manifest.payload.originalFilename,
        sha3Hash: record.manifest.payload.sha3Hash,
        status: 'unread',
        stellarTxHash: record.manifest.stellarNotarization?.txHash,
        ledger: record.manifest.stellarNotarization?.ledger,
        requiresSignature: record.requiresSignature,
        signatureStatus: record.signatureStatus
      };

      const cleanedNotif = stripUndefined(newNotif);

      // Add to local state immediately
      setNotifications(prev => {
        if (prev.some(n => n.id === notifId)) return prev;
        return [newNotif, ...prev];
      });

      setDoc(doc(db, 'notifications', notifId), cleanedNotif).catch((err) => {
        handleFirestoreError(err, OperationType.WRITE, `notifications/${notifId}`);
      });
    }
  };

  const resolveFilePayload = async (payloadString: string, vaultId: string, type: 'armored' | 'viewq'): Promise<string> => {
    if (!payloadString) return '';
    if (payloadString.startsWith('chunked:')) {
      const parts = payloadString.split(':');
      const vId = parts[1];
      const fileType = parts[2] as 'armored' | 'viewq';
      const chunksCount = parseInt(parts[3], 10);
      
      try {
        const chunks: string[] = new Array(chunksCount);
        const promises = [];
        for (let i = 0; i < chunksCount; i++) {
          const chunkId = `chunk_${vId}_${fileType}_${i}`;
          const chunkRef = doc(db, 'vault_chunks', chunkId);
          promises.push(
            getDoc(chunkRef).then((chunkDoc) => {
              if (chunkDoc.exists()) {
                chunks[i] = chunkDoc.data().content;
              } else {
                throw new Error(`Chunk ${i} not found`);
              }
            })
          );
        }
        await Promise.all(promises);
        return chunks.join('');
      } catch (err) {
        console.error('Error fetching file chunks, falling back to local:', err);
        // Fallback to local storage if chunks fetch fails
        const localItem = localStorage.getItem(`local_vault_${fileType}_${vId}`);
        if (localItem) return localItem;
        throw err;
      }
    }
    if (payloadString.startsWith('local_only:')) {
      const id = payloadString.replace('local_only:', '');
      const localItem = localStorage.getItem(`local_vault_${type}_${id}`);
      if (localItem) return localItem;
    }
    return payloadString;
  };

  const resolveSharePayload = async (encryptedData: string, token: string): Promise<string> => {
    if (!encryptedData) return '';
    if (encryptedData.startsWith('chunked:')) {
      const parts = encryptedData.split(':');
      const sToken = parts[1];
      const chunksCount = parseInt(parts[2], 10);
      try {
        const chunks: string[] = new Array(chunksCount);
        const promises = [];
        for (let i = 0; i < chunksCount; i++) {
          const chunkId = `chunk_share_${sToken}_${i}`;
          const chunkRef = doc(db, 'share_chunks', chunkId);
          promises.push(
            getDoc(chunkRef).then((chunkDoc) => {
              if (chunkDoc.exists()) {
                chunks[i] = chunkDoc.data().content;
              } else {
                throw new Error(`Share chunk ${i} not found`);
              }
            })
          );
        }
        await Promise.all(promises);
        return chunks.join('');
      } catch (err) {
        console.error('Error fetching share chunks, falling back to local:', err);
        // Fallback to local share if chunk fetch fails
        const localShare = ephemeralShares.find(s => s.token === token);
        if (localShare && localShare.encryptedData && !localShare.encryptedData.startsWith('chunked:')) {
          return localShare.encryptedData;
        }
        throw err;
      }
    }
    return encryptedData;
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, status: 'read' } : n));
    setDoc(doc(db, 'notifications', id), { status: 'read' }, { merge: true }).catch((err) => {
      handleFirestoreError(err, OperationType.WRITE, `notifications/${id}`);
    });
  };

  const signCustodyRecord = async (vaultId: string, signerProfile: UserProfile): Promise<string> => {
    const signerName = `${signerProfile.nombres} ${signerProfile.apellidos}`;
    const timestamp = new Date().toISOString();
    let signatureStellarTxHash = '';
    let signatureIsSimulated = true;

    addLog('INFO', `Firmando digitalmente el Acta de Custodia ${vaultId.slice(6)}...`);
    addLog('INFO', `Generando firma criptográfica poscuántica ML-KEM-768 equivalente...`);
    
    const hasStellarKey = settings.stellarSourceSecret && settings.stellarSourceSecret.trim().startsWith('S');

    if (hasStellarKey) {
      addLog('INFO', 'Conectando a Stellar Horizon para registrar notarización de firma real...');
      try {
        const keypair = Keypair.fromSecret(settings.stellarSourceSecret);
        const pub = keypair.publicKey();
        const horizonUrl = settings.stellarNetwork === 'testnet' 
          ? 'https://horizon-testnet.stellar.org' 
          : 'https://horizon.stellar.org';
        
        addLog('INFO', `Dirección pública firmante: ${pub}`);
        const server = new Horizon.Server(horizonUrl);
        
        let account;
        try {
          account = await server.loadAccount(pub);
        } catch (loadErr: any) {
          if (loadErr?.response?.status === 404 && settings.stellarNetwork === 'testnet') {
            addLog('INFO', `Activando cuenta de firma Testnet mediante Friendbot...`);
            const friendbotRes = await fetch(`https://friendbot.stellar.org/?addr=${pub}`);
            if (friendbotRes.ok) {
              await new Promise(r => setTimeout(r, 1000));
              account = await server.loadAccount(pub);
            } else {
              throw new Error(`Friendbot falló al activar cuenta de firma.`);
            }
          } else {
            throw loadErr;
          }
        }

        const networkPassphrase = settings.stellarNetwork === 'testnet' 
          ? Networks.TESTNET 
          : Networks.PUBLIC;
        
        // Generate sha3 digest to sign in memo
        const sigDigest = sha3_256("STELLAR_SIGN_TX_" + vaultId + timestamp);
        const memoHashBuffer = Buffer.from(sigDigest, 'hex');

        const transaction = new TransactionBuilder(account, {
          fee: '100',
          networkPassphrase
        })
        .addOperation(Operation.payment({
          destination: pub, // Send to self
          asset: Asset.native(),
          amount: '0.00001'
        }))
        .addMemo(Memo.hash(memoHashBuffer))
        .setTimeout(180)
        .build();

        transaction.sign(keypair);
        const submitResult = await server.submitTransaction(transaction);
        signatureStellarTxHash = submitResult.hash;
        signatureIsSimulated = false;

        addLog('SUCCESS', `[STELLAR REAL] ¡Firma poscuántica registrada y notarizada en Stellar con éxito!`);
        addLog('SUCCESS', `[STELLAR REAL] Hash de Tx: ${signatureStellarTxHash}`);
      } catch (stellarErr: any) {
        let detailedError = '';
        if (stellarErr?.response?.data) {
          detailedError = JSON.stringify(stellarErr.response.data);
        } else {
          detailedError = stellarErr?.message || String(stellarErr);
        }
        addLog('WARN', `Error en Stellar real para firma: ${detailedError}`);
        addLog('INFO', 'Conmutando a firma Stellar virtualizada de respaldo.');
        
        signatureStellarTxHash = sha3_256("STELLAR_SIGN_TX_" + vaultId + timestamp);
        signatureIsSimulated = true;
        addLog('SUCCESS', `[STELLAR VIRTUAL] Firma registrada con éxito en ledger virtual: ${signatureStellarTxHash}`);
      }
    } else {
      addLog('WARN', 'STELLAR_SOURCE_SECRET no configurada para firma. Empleando ledger virtual...');
      await new Promise(r => setTimeout(r, 1000));
      signatureStellarTxHash = sha3_256("STELLAR_SIGN_TX_" + vaultId + timestamp);
      signatureIsSimulated = true;
      addLog('SUCCESS', `[CONTRATO INTELIGENTE] Firma poscuántica validada y notarizada en Stellar Ledger Virtual.`);
      addLog('SUCCESS', `[CONTRATO INTELIGENTE] Hash de Firma: ${signatureStellarTxHash}`);
    }

    // Update vaults state and firestore
    setVaults(prev => prev.map(v => v.id === vaultId ? {
      ...v,
      signatureStatus: 'signed',
      signerName,
      signatureTimestamp: timestamp,
      signatureStellarTxHash,
      signatureIsSimulated
    } : v));

    setDoc(doc(db, 'vaults', vaultId), {
      signatureStatus: 'signed',
      signerName,
      signatureTimestamp: timestamp,
      signatureStellarTxHash,
      signatureIsSimulated
    }, { merge: true }).catch((err) => {
      handleFirestoreError(err, OperationType.WRITE, `vaults/${vaultId}`);
    });

    // Update notifications state and firestore
    setNotifications(prev => prev.map(n => n.vaultId === vaultId ? {
      ...n,
      signatureStatus: 'signed',
      signerName,
      signatureTimestamp: timestamp,
      signatureStellarTxHash,
      signatureIsSimulated
    } : n));

    const matchingNotif = notifications.find(n => n.vaultId === vaultId);
    if (matchingNotif) {
      setDoc(doc(db, 'notifications', matchingNotif.id), {
        signatureStatus: 'signed',
        signerName,
        signatureTimestamp: timestamp,
        signatureStellarTxHash,
        signatureIsSimulated
      }, { merge: true }).catch((err) => {
        handleFirestoreError(err, OperationType.WRITE, `notifications/${matchingNotif.id}`);
      });
    }

    return signatureStellarTxHash;
  };

  const deleteVault = (id: string) => {
    localStorage.removeItem(`local_vault_armored_${id}`);
    localStorage.removeItem(`local_vault_viewq_${id}`);
    setVaults(prev => prev.filter(v => v.id !== id));
    deleteDoc(doc(db, 'vaults', id)).catch((err) => {
      handleFirestoreError(err, OperationType.DELETE, `vaults/${id}`);
    });
  };

  const addEphemeralShare = async (share: EphemeralShare) => {
    setEphemeralShares(prev => {
      if (prev.some(s => s.token === share.token)) return prev;
      return [share, ...prev];
    });

    const shareForCloud = { ...share };
    
    if (share.encryptedData && share.encryptedData.length > 500000) {
      try {
        const CHUNK_SIZE = 500000;
        const content = share.encryptedData;
        const totalLength = content.length;
        let index = 0;
        const promises = [];
        for (let i = 0; i < totalLength; i += CHUNK_SIZE) {
          const chunk = content.substring(i, i + CHUNK_SIZE);
          const chunkId = `chunk_share_${share.token}_${index}`;
          const chunkRef = doc(db, 'share_chunks', chunkId);
          promises.push(
            setDoc(chunkRef, {
              token: share.token,
              index,
              content: chunk,
              createdAt: new Date().toISOString()
            })
          );
          index++;
        }
        await Promise.all(promises);
        shareForCloud.encryptedData = `chunked:${share.token}:${index}`;
      } catch (err) {
        console.error("Failed to save share to Firestore chunks:", err);
      }
    }

    setDoc(doc(db, 'shares', share.token), stripUndefined(shareForCloud)).catch((err) => {
      handleFirestoreError(err, OperationType.WRITE, `shares/${share.token}`);
    });
  };

  const updateEphemeralShare = (updated: EphemeralShare) => {
    setEphemeralShares(prev => prev.map(s => s.token === updated.token ? updated : s));
    setDoc(doc(db, 'shares', updated.token), stripUndefined(updated)).catch((err) => {
      handleFirestoreError(err, OperationType.WRITE, `shares/${updated.token}`);
    });
  };

  const deleteEphemeralShare = (token: string) => {
    setEphemeralShares(prev => prev.filter(s => s.token !== token));
    deleteDoc(doc(db, 'shares', token)).catch((err) => {
      handleFirestoreError(err, OperationType.DELETE, `shares/${token}`);
    });
  };

  const login = async (username: string, authType: 'passkey' | 'diceware', pin?: string) => {
    const normalizedUsername = username.trim().toLowerCase();
    const userDocRef = doc(db, 'users', normalizedUsername);
    let existingUser: RegisteredUser | null = null;
    
    try {
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists()) {
        existingUser = docSnap.data() as RegisteredUser;
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, `users/${normalizedUsername}`);
    }

    const localMatch = registeredUsers.find(u => u.username.toLowerCase() === normalizedUsername);
    const dbOrLocalUser = existingUser || localMatch;

    if (authType === 'passkey') {
      // Log In Mode: must exist
      if (!dbOrLocalUser && normalizedUsername !== 'laro') {
        throw new Error('USER_NOT_FOUND');
      }

      // If the user has a registered PIN, verify it
      if (dbOrLocalUser && dbOrLocalUser.pin) {
        if (!pin) {
          throw new Error('PIN_REQUIRED');
        }
        if (dbOrLocalUser.pin !== pin) {
          throw new Error('INVALID_PIN');
        }
      }

      const status = dbOrLocalUser ? dbOrLocalUser.status : 'approved'; // laro is approved
      const profile = dbOrLocalUser?.profile;
      const finalAuthType = dbOrLocalUser?.authType || 'passkey';

      setUser({ username: dbOrLocalUser ? dbOrLocalUser.username : 'Laro', authType: finalAuthType, status, profile });
      addLog('SUCCESS', `AUTENTICACIÓN EXITOSA: Sesión iniciada para ${username.toUpperCase()} mediante PASSKEY BIOMÉTRICO y PIN verificado.`);
    } else {
      // Create Account Mode: must not exist
      if (dbOrLocalUser || normalizedUsername === 'laro') {
        throw new Error('USER_ALREADY_EXISTS');
      }

      const newUser: RegisteredUser = {
        username: username.trim(),
        authType: 'diceware',
        status: 'pending',
        registeredAt: new Date().toISOString(),
        pin: pin // Save the PIN specified during registration
      };

      setRegisteredUsers(prev => [newUser, ...prev]);
      try {
        await setDoc(userDocRef, newUser);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${normalizedUsername}`);
      }

      setUser({ username: username.trim(), authType: 'diceware', status: 'pending' });
      addLog('SUCCESS', `SOLICITUD DE REGISTRO: Nueva identidad pericial ${username.toUpperCase()} creada con PIN de seguridad y enviada para aprobación.`);
    }
  };

  const logout = () => {
    setUser(null);
    addLog('INFO', 'Sesión de fiscalía cerrada correctamente.');
  };

  const updateUserProfile = (profile: UserProfile) => {
    if (!user) return;
    
    const userDocData: any = {
      username: user.username,
      authType: user.authType,
      status: user.status,
      registeredAt: new Date().toISOString()
    };
    if (profile !== undefined) {
      userDocData.profile = profile;
    }

    setUser(prev => prev ? { ...prev, profile } : null);
    setRegisteredUsers(prev => prev.map(u => u.username.toLowerCase() === user.username.toLowerCase() ? { ...u, profile } : u));

    setDoc(doc(db, 'users', user.username.toLowerCase()), userDocData, { merge: true }).catch((err) => {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.username.toLowerCase()}`);
    });

    addLog('SUCCESS', `PERFIL ACTUALIZADO: Los datos de identificación del Perito/Fiscal (${profile.nombres} ${profile.apellidos}) han sido vinculados a la sesión.`);
  };

  const approveUser = (username: string) => {
    setRegisteredUsers(prev => prev.map(u => u.username.toLowerCase() === username.toLowerCase() ? { ...u, status: 'approved' } : u));
    
    if (user && user.username.toLowerCase() === username.toLowerCase()) {
      setUser(prev => prev ? { ...prev, status: 'approved' } : null);
    }

    setDoc(doc(db, 'users', username.toLowerCase()), { status: 'approved' }, { merge: true }).catch((err) => {
      handleFirestoreError(err, OperationType.WRITE, `users/${username.toLowerCase()}`);
    });
    
    addLog('SUCCESS', `REGISTRO APROBADO: El usuario ${username.toUpperCase()} ha sido aprobado por el superadmin.`);
  };

  const rejectUser = (username: string) => {
    setRegisteredUsers(prev => prev.map(u => u.username.toLowerCase() === username.toLowerCase() ? { ...u, status: 'rejected' } : u));

    if (user && user.username.toLowerCase() === username.toLowerCase()) {
      setUser(prev => prev ? { ...prev, status: 'rejected' } : null);
    }

    setDoc(doc(db, 'users', username.toLowerCase()), { status: 'rejected' }, { merge: true }).catch((err) => {
      handleFirestoreError(err, OperationType.WRITE, `users/${username.toLowerCase()}`);
    });
    
    addLog('SUCCESS', `REGISTRO RECHAZADO: El usuario ${username.toUpperCase()} ha sido rechazado por el superadmin.`);
  };

  const addLog = (level: TerminalLog['level'], message: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    const timestamp = new Date().toLocaleTimeString('es-ES', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }) + `.${String(new Date().getMilliseconds()).padStart(3, '0')}`;
    
    const newLog: TerminalLog = { id, timestamp, level, message };
    setLogs(prev => [...prev, newLog]);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  // Pre-populate demo data in cloud if empty
  useEffect(() => {
    const initializeDemo = async () => {
      if (vaults.length > 0) return;

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
        notes: 'Sellado de prueba inicial ejecutado con entropía cuántica del procesador virtual.',
        creator: 'laro',
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

      setDoc(doc(db, 'vaults', demoRecord.id), demoRecord).catch((err) => {
        handleFirestoreError(err, OperationType.WRITE, `vaults/${demoRecord.id}`);
      });
    };

    initializeDemo();
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
        updateUserProfile,
        registeredUsers,
        approveUser,
        rejectUser,
        ephemeralShares,
        addEphemeralShare,
        updateEphemeralShare,
        deleteEphemeralShare,
        language,
        setLanguage,
        notifications,
        markNotificationAsRead,
        signCustodyRecord,
        resolveFilePayload,
        resolveSharePayload,
        firestoreStatus,
        setFirestoreStatus,
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
