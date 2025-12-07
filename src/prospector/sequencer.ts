export type Channel = 'whatsapp' | 'email' | 'call';

export interface SequenceStep {
  id: string;
  channel: Channel;
  templateKey: string; // key to select message template
  delayHours: number; // delay from previous step
}

export interface GeneratedPlan {
  steps: SequenceStep[];
  nextActionAt: number; // epoch ms
}

export function generateDefaultSequence(hasEmail: boolean): SequenceStep[] {
  // Simple, effective multi-touch sequence
  const seq: SequenceStep[] = [
    { id: 's1', channel: 'whatsapp', templateKey: 'intro_value', delayHours: 0 },
    {
      id: 's2',
      channel: hasEmail ? 'email' : 'whatsapp',
      templateKey: 'case_study',
      delayHours: 24,
    },
    { id: 's3', channel: 'whatsapp', templateKey: 'question_nudge', delayHours: 48 },
    { id: 's4', channel: 'call', templateKey: 'call_script_short', delayHours: 72 },
  ];
  return seq;
}

export function planNextAction(lastExecutedAt?: number, sequence?: SequenceStep[]): GeneratedPlan {
  const now = Date.now();
  const steps = sequence && sequence.length ? sequence : generateDefaultSequence(true);
  // If nothing executed yet, next action is first step
  if (!lastExecutedAt) return { steps, nextActionAt: now };
  // Otherwise, compute next based on cumulative delays
  const elapsedHours = (now - lastExecutedAt) / (1000 * 60 * 60);
  let cumulative = 0;
  for (const s of steps) {
    cumulative += s.delayHours;
    if (elapsedHours < cumulative) {
      const next = lastExecutedAt + cumulative * 60 * 60 * 1000;
      return { steps, nextActionAt: Math.floor(next) };
    }
  }
  // Completed sequence; propose a re-engagement after 7 days
  return { steps, nextActionAt: Math.floor(lastExecutedAt + 7 * 24 * 60 * 60 * 1000) };
}
