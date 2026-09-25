import { Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Badge } from '@/lib/stats';

export default function BadgeGrid({ badges, compact = false }: { badges: Badge[]; compact?: boolean }) {
  return (
    <ul className={cn('grid gap-3', compact ? 'grid-cols-3 sm:grid-cols-6' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4')}>
      {badges.map((b) => (
        <li
          key={b.id}
          title={`${b.name}: ${b.description}`}
          className={cn(
            'relative flex flex-col items-center rounded-2xl border p-3 text-center transition-colors',
            b.earned ? 'border-primary/40 bg-primary/5' : 'border-border bg-card opacity-70'
          )}
        >
          <span className={cn('text-3xl', !b.earned && 'grayscale')} aria-hidden="true">
            {b.icon}
          </span>
          <span className={cn('mt-1 font-semibold', compact ? 'text-xs' : 'text-sm')}>{b.name}</span>
          {!compact && <span className="mt-0.5 text-xs text-muted-foreground">{b.description}</span>}
          {!b.earned && (
            <>
              <Lock className="absolute right-2 top-2 h-3.5 w-3.5 text-muted-foreground" aria-label="Locked" />
              <span className="mt-2 h-1 w-full rounded-full bg-muted" aria-hidden="true">
                <span className="block h-1 rounded-full bg-primary" style={{ width: `${Math.round(b.progress * 100)}%` }} />
              </span>
            </>
          )}
          {b.earned && <span className="sr-only">Earned</span>}
        </li>
      ))}
    </ul>
  );
}
