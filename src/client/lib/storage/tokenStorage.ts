import { KEYS } from './keys.js';

const key = KEYS.sessionToken;

export const tokenStorage = {
  save(token: string, persist: boolean): void {
    const storage = persist ? localStorage : sessionStorage;
    storage.setItem(key, token);
  },

  get(): string | null {
    return localStorage.getItem(key) ?? sessionStorage.getItem(key);
  },

  clear(): void {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  },

  exists(): boolean {
    return tokenStorage.get() !== null;
  },
};
