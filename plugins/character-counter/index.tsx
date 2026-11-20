import type { ComposerStatusState } from '@yapmod/types';

function formatCount({ length, maxLength }: ComposerStatusState) {
  if (maxLength === null) return `${length} character${length === 1 ? '' : 's'}`;
  const text = `${length} / ${maxLength} · ${Math.max(0, maxLength - length)} left`;
  return length >= maxLength ? { text, tone: 'warning' as const } : text;
}

export default function () {
  return {
    onLoad() {
      if (typeof yapmod.composer?.registerStatus !== 'function') {
        throw new Error('Character Counter 1.1 requires Yapmod client 1.1.0 or later.');
      }
      yapmod.composer.registerStatus(formatCount);
    },
  };
}
