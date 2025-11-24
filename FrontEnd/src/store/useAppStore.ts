import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { encryptApiKey, decryptApiKey, isEncrypted } from '@/utils/encryption';

interface User {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string;
    email?: string;
}

interface AppState {
    apiKey: string | null;
    analysisData: any | null;
    user: User | null;
    setApiKey: (key: string) => void;
    setAnalysisData: (data: any) => void;
    setUser: (user: User | null) => void;
    clearApiKey: () => void;
    hasKey: () => boolean;
}

export const useAppStore = create<AppState>()(
    persist(
        (set, get) => ({
            apiKey: null,
            analysisData: null,
            user: null,
            setApiKey: (key) => {
                // Encrypt before storing
                const encryptedKey = encryptApiKey(key);
                set({ apiKey: encryptedKey });
            },
            setAnalysisData: (data) => set({ analysisData: data }),
            setUser: (user) => set({ user }),
            clearApiKey: () => set({ apiKey: null }),
            hasKey: () => {
                const key = get().apiKey;
                if (!key) return false;

                // Decrypt to verify it's valid
                try {
                    const decrypted = decryptApiKey(key);
                    return decrypted.length > 0;
                } catch {
                    return false;
                }
            },
        }),
        {
            name: 'codesight-storage', // unique name for localStorage key
            partialize: (state) => ({
                apiKey: state.apiKey, // Store encrypted
                analysisData: state.analysisData
            }),
            version: 1, // Bump version to invalidate old state including 'user'
        }
    )
);

/**
 * Hook to get the decrypted API key
 */
export const useDecryptedApiKey = (): string | null => {
    const encryptedKey = useAppStore((state) => state.apiKey);

    if (!encryptedKey) return null;

    // If it doesn't appear to be encrypted, return as-is (backward compatibility)
    if (!isEncrypted(encryptedKey)) {
        return encryptedKey;
    }

    // Decrypt it
    return decryptApiKey(encryptedKey);
};
