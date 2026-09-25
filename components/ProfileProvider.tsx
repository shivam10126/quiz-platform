'use client';

import * as React from 'react';
import {
  AVATARS,
  defaultProfile,
  loadActiveProfileId,
  loadProfiles,
  newProfileId,
  saveActiveProfileId,
  saveProfiles,
  type Profile,
} from '@/lib/profiles';

type ProfileContextValue = {
  ready: boolean;
  profiles: Profile[];
  active: Profile;
  setActive: (id: string) => void;
  create: (name: string, avatar?: string) => Profile;
  update: (id: string, patch: Partial<Pick<Profile, 'name' | 'avatar'>>) => void;
  remove: (id: string) => void;
};

const ProfileContext = React.createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = React.useState(false);
  const [profiles, setProfiles] = React.useState<Profile[]>([defaultProfile()]);
  const [activeId, setActiveId] = React.useState<string>(defaultProfile().id);

  React.useEffect(() => {
    const list = loadProfiles();
    const id = loadActiveProfileId();
    setProfiles(list);
    setActiveId(list.some((p) => p.id === id) ? id : list[0].id);
    setReady(true);
  }, []);

  const persist = React.useCallback((next: Profile[]) => {
    setProfiles(next);
    saveProfiles(next);
  }, []);

  const setActive = React.useCallback((id: string) => {
    setActiveId(id);
    saveActiveProfileId(id);
  }, []);

  const create = React.useCallback(
    (name: string, avatar?: string) => {
      const p: Profile = {
        id: newProfileId(),
        name: name.trim() || 'Player',
        avatar: avatar || AVATARS[profiles.length % AVATARS.length],
        createdAt: new Date().toISOString(),
      };
      persist([...profiles, p]);
      setActive(p.id);
      return p;
    },
    [persist, profiles, setActive]
  );

  const update = React.useCallback(
    (id: string, patch: Partial<Pick<Profile, 'name' | 'avatar'>>) => {
      persist(profiles.map((p) => (p.id === id ? { ...p, ...patch, name: (patch.name ?? p.name).trim() || p.name } : p)));
    },
    [persist, profiles]
  );

  const remove = React.useCallback(
    (id: string) => {
      const next = profiles.filter((p) => p.id !== id);
      const list = next.length ? next : [defaultProfile()];
      persist(list);
      if (activeId === id) setActive(list[0].id);
    },
    [activeId, persist, profiles, setActive]
  );

  const active = profiles.find((p) => p.id === activeId) ?? profiles[0];

  const value = React.useMemo(
    () => ({ ready, profiles, active, setActive, create, update, remove }),
    [ready, profiles, active, setActive, create, update, remove]
  );
  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const ctx = React.useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used inside <ProfileProvider>');
  return ctx;
}
