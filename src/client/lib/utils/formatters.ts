const CURR_LOCALE = 'en-GB';
const CURR_CURRENCY = 'GBP';

export function getDate(time: string): string {
  return new Date(time).toLocaleDateString(CURR_LOCALE, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function getTimestamp(time: string): string {
  return new Date(time).toLocaleDateString(CURR_LOCALE, {
    minute: '2-digit',
    hour: '2-digit',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function getCurrency(amount: number): string {
  return new Intl.NumberFormat(CURR_LOCALE, { style: 'currency', currency: CURR_CURRENCY }).format(
    amount
  );
}
