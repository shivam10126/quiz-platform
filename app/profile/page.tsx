'use client';

import { useEffect, useMemo, useState } from 'react';
import { Flame, Trophy, Target, Clock, UserPlus, Check, Trash2, Pencil, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/toast';
import BadgeGrid from '@/components/BadgeGrid';
import Loading from '@/components/Loading';
import { useProfile } from '@/components/ProfileProvider';
import { useData } from '@/components/useData';
import { AVATARS } from '@/lib/profiles';
import { getAllResults, clearResults, DEFAULT_PROFILE_ID, type QuizResult } from '@/lib/db';
import { computeStats } from '@/lib/stats';
import { cn } from '@/lib/utils';

export default function ProfilePage() {
  const { profiles, active, setActive, create, update, remove, ready } = useProfile();
  const { loading, stats, badges, reload } = useData();
  const { showToast } = useToast();
  const [allResults, setAllResults] = useState<QuizResult[] | null>(null);
  const [newName, setNewName] = useState('');
  const [newAvatar, setNewAvatar] = useState(AVATARS[1]);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editAvatar, setEditAvatar] = useState('');

  useEffect(() => {
    getAllResults().then(setAllResults).catch(() => setAllResults([]));
  }, [profiles, active.id]);

  // Leaderboard across every local profile.
  const leaderboard = useMemo(() => {
    if (!allResults) return [];
    return profiles
      .map((p) => {
        const mine = allResults.filter((r) => (r.profileId ?? DEFAULT_PROFILE_ID) === p.id);
        const s = computeStats(mine);
        return { profile: p, attempts: s.attempts, best: s.best?.pct ?? 0, average: s.average, streak: s.currentStreak };
      })
      .sort((a, b) => b.average - a.average || b.best - a.best || b.attempts - a.attempts);
  }, [allResults, profiles]);

  const handleCreate = () => {
    if (!newName.trim()) {
      showToast({ title: 'Enter a name for the profile', variant: 'destructive' });
      return;
    }
    const p = create(newName, newAvatar);
    setNewName('');
    showToast({ title: `Welcome, ${p.name}!`, description: 'You are now playing as this profile.', variant: 'success' });
  };

  const startEdit = () => {
    setEditName(active.name);
    setEditAvatar(active.avatar);
    setEditing(true);
  };

  const saveEdit = () => {
    update(active.id, { name: editName, avatar: editAvatar });
    setEditing(false);
    showToast({ title: 'Profile updated', variant: 'success' });
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete profile "${active.name}" and all of its results?`)) return;
    await clearResults(active.id);
    remove(active.id);
    await reload();
    showToast({ title: 'Profile deleted' });
  };

  if (!ready || loading) return <Loading message="Loading your profile..." />;

  const tiles = [
    { icon: Target, label: 'Attempts', value: String(stats?.attempts ?? 0) },
    { icon: Trophy, label: 'Best score', value: stats?.best ? `${stats.best.pct}%` : '–' },
    { icon: Flame, label: 'Current streak', value: `${stats?.currentStreak ?? 0} days`, sub: `Longest ${stats?.longestStreak ?? 0}` },
    { icon: Clock, label: 'Time quizzing', value: `${stats?.totalMinutes ?? 0} min` },
  ];

  return (
    <div className="space-y-10">
      {/* Active profile */}
      <section className="rounded-3xl border border-border bg-card p-6 shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-4xl" aria-hidden="true">
              {active.avatar}
            </span>
            <div>
              <p className="text-sm text-muted-foreground">Playing as</p>
              <h1 className="text-3xl font-bold">{active.name}</h1>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={startEdit}>
              <Pencil className="h-4 w-4 mr-2" /> Edit
            </Button>
            <Button variant="outline" onClick={handleDelete} className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground">
              <Trash2 className="h-4 w-4 mr-2" /> Delete
            </Button>
          </div>
        </div>

        {editing && (
          <div className="mt-6 grid gap-4 rounded-2xl border border-border p-4 sm:grid-cols-[1fr_auto]">
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="edit-name">Name</Label>
                <Input id="edit-name" value={editName} onChange={(e) => setEditName(e.target.value)} className="bg-background" />
              </div>
              <div className="space-y-1">
                <Label>Avatar</Label>
                <AvatarPicker value={editAvatar} onChange={setEditAvatar} />
              </div>
            </div>
            <div className="flex gap-2 sm:flex-col">
              <Button onClick={saveEdit}>
                <Check className="h-4 w-4 mr-2" /> Save
              </Button>
              <Button variant="outline" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {tiles.map((t) => (
            <div key={t.label} className="rounded-2xl border border-border bg-background p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <t.icon className="h-4 w-4 text-primary" /> {t.label}
              </div>
              <p className="mt-1 text-2xl font-bold">{t.value}</p>
              {t.sub && <p className="text-xs text-muted-foreground">{t.sub}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* Badges */}
      {badges && (
        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold">Badges</h2>
            <p className="text-muted-foreground">
              {badges.filter((b) => b.earned).length} of {badges.length} earned
            </p>
          </div>
          <BadgeGrid badges={badges} />
        </section>
      )}

      {/* Profiles + leaderboard */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-card rounded-2xl">
          <CardHeader>
            <CardTitle>Profiles on this device</CardTitle>
            <p className="text-sm text-muted-foreground">Each profile keeps its own history, streaks and badges.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2">
              {profiles.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => setActive(p.id)}
                    aria-pressed={p.id === active.id}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors',
                      p.id === active.id ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent'
                    )}
                  >
                    <span className="text-2xl" aria-hidden="true">{p.avatar}</span>
                    <span className="flex-1 font-medium">{p.name}</span>
                    {p.id === active.id && <Check className="h-4 w-4 text-primary" aria-label="Active" />}
                  </button>
                </li>
              ))}
            </ul>
            <div className="rounded-lg border border-dashed border-border p-4 space-y-3">
              <p className="font-semibold flex items-center gap-2">
                <UserPlus className="h-4 w-4" /> Add a profile
              </p>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleCreate()} placeholder="Name" aria-label="New profile name" className="bg-background" />
              <AvatarPicker value={newAvatar} onChange={setNewAvatar} />
              <Button onClick={handleCreate} className="w-full">Create and switch</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-warning" /> Leaderboard
            </CardTitle>
            <p className="text-sm text-muted-foreground">Ranked by average score across all local profiles.</p>
          </CardHeader>
          <CardContent>
            {leaderboard.every((l) => l.attempts === 0) ? (
              <p className="text-muted-foreground">No scores yet. Play a quiz to get on the board.</p>
            ) : (
              <ol className="space-y-2">
                {leaderboard.map((l, i) => (
                  <li key={l.profile.id} className={cn('flex items-center gap-3 rounded-lg border p-3', l.profile.id === active.id ? 'border-primary/50 bg-primary/5' : 'border-border')}>
                    <span className={cn('w-6 text-center font-bold', i === 0 ? 'text-warning' : 'text-muted-foreground')}>{i + 1}</span>
                    <span className="text-xl" aria-hidden="true">{l.profile.avatar}</span>
                    <span className="flex-1 font-medium truncate">{l.profile.name}</span>
                    <span className="text-sm text-muted-foreground hidden sm:inline">{l.attempts} played</span>
                    <span className="text-sm text-muted-foreground hidden sm:inline">best {l.best}%</span>
                    <span className="font-bold">{l.attempts ? `${l.average}%` : '–'}</span>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-muted-foreground">
        Profiles are stored in this browser only. Connecting a backend such as Supabase would let them sync across devices; the storage layer is isolated in <code>lib/db.ts</code> and <code>lib/profiles.ts</code> so that swap is contained.
      </p>
    </div>
  );
}

function AvatarPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Avatar">
      {AVATARS.map((a) => (
        <button
          key={a}
          type="button"
          role="radio"
          aria-checked={value === a}
          onClick={() => onChange(a)}
          className={cn('grid h-9 w-9 place-items-center rounded-lg border text-xl transition-colors', value === a ? 'border-primary bg-primary/10' : 'border-border hover:bg-accent')}
        >
          {a}
        </button>
      ))}
    </div>
  );
}
