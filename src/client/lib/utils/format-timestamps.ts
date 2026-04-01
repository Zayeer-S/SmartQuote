const CURR_LOCALE = 'en-GB';

export function getCurrentLocalDateString(time: string): string {
  return new Date(time).toLocaleDateString(CURR_LOCALE, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
