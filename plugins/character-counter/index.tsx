function formatCount({ length, maxLength }: { length: number; maxLength: number | null }) {
  if (maxLength === null) return `${length} character${length === 1 ? '' : 's'}`;
  const text = `${length} / ${maxLength} · ${Math.max(0, maxLength - length)} left`;
  return length >= maxLength ? { text, tone: 'warning' as const } : text;
}

export default function () {
  return {
    onLoad() {
      // The catalog also builds against the publicly released v1.1 SDK typings.
      const composer = 'composer' in yapmod ? yapmod.composer : undefined;
      if (!composer || typeof composer !== 'object' || !('registerStatus' in composer) ||
          typeof composer.registerStatus !== 'function') {
        throw new Error('Update Yapmod to a client with composer status support to use Character Counter.');
      }
      composer.registerStatus(formatCount);
    },
  };
}
