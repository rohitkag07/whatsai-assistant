import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { LEAD_STAGE_LABELS, TEMPERATURE_LABELS } from '@/lib/constants';
import type { LeadStage, LeadTemperature } from '@/types/database';

interface StatusBadgeProps {
  kind:
    | { type: 'lead_stage';        value: LeadStage }
    | { type: 'temperature';       value: LeadTemperature };
  showHindi?: boolean;
}

export function StatusBadge({ kind, showHindi = false }: StatusBadgeProps) {
  let label = '';
  let labelHi = '';
  let colorClass = '';

  switch (kind.type) {
    case 'lead_stage': {
      const def = LEAD_STAGE_LABELS[kind.value];
      label = def.en;  labelHi = def.hi;  colorClass = def.color;
      break;
    }
    case 'temperature': {
      const def = TEMPERATURE_LABELS[kind.value];
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium">
          <span className={cn('h-2 w-2 rounded-full', def.dot)} />
          {def.en}{showHindi && <span className="text-muted-foreground">· {def.hi}</span>}
        </span>
      );
    }
  }

  return (
    <Badge variant="outline" className={cn('font-medium border-transparent', colorClass)}>
      {label}{showHindi && labelHi && <span className="ml-1 opacity-70">· {labelHi}</span>}
    </Badge>
  );
}
