// Local profiles: several people can share one browser, each with their own history.
// This is the storage seam a real backend (e.g. Supabase auth) would replace.
import { DEFAULT_PROFILE_ID } from './db';

export type Profile = {
  id: string;
  name: string;
  /** Emoji shown as the avatar. */
  avatar: string;
  createdAt: string;
};

const PROFILES_KEY = 'quiz.profiles';
const ACTIVE_KEY = 'quiz.activeProfile';

export const AVATARS = ['🦊', '🐼', '🦁', '🐸', '🦉', '🐙', '🦄', '🐝', '🐬', '🦋', '🌵', '🚀'];

export const defaultProfile = (): Profile => ({
  id: DEFAULT_PROFILE_ID,
  name: 'Guest',
  avatar: '🦊',
  createdAt: new Date(0).toISOString(),
});

const safeParse = <T,>(raw: string | null, fallback: T): T => {
  try {
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

export const loadProfiles = (): Profile[] => {
  if (typeof localStorage === 'undefined') return [defaultProfile()];
  const list = safeParse<Profile[]>(localStorage.getItem(PROFILES_KEY), []);
  return list.length ? list : [defaultProfile()];
};

export const saveProfiles = (profiles: Profile[]) => {
  localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
};

export const loadActiveProfileId = (): string => {
  if (typeof localStorage === 'undefined') return DEFAULT_PROFILE_ID;
  return localStorage.getItem(ACTIVE_KEY) || DEFAULT_PROFILE_ID;
};

export const saveActiveProfileId = (id: string) => localStorage.setItem(ACTIVE_KEY, id);

export const newProfileId = () => `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
