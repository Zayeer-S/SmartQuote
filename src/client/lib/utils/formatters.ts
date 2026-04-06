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

export function getHours(hours: number): string {
  if (hours < 1) {
    return `${String(Math.round(hours * 60))} min`;
  }
  if (hours % 1 === 0) {
    return `${String(hours)} hr${hours === 1 ? '' : 's'}`;
  }
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  return `${String(wholeHours)} hr ${String(minutes)} min`;
}

export function getCurrency(amount: number): string {
  return new Intl.NumberFormat(CURR_LOCALE, { style: 'currency', currency: CURR_CURRENCY }).format(
    amount
  );
}
