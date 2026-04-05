export function checkNumberInput(value: string): string | null {
  if (value !== '' && !/^\d+$/.test(value)) return value;
  return null;
}

export function toTitleCase(value: string): string {
  return value
    .split(' ')
    .map((word) => (word.length > 0 ? word[0].toUpperCase() + word.slice(1).toLowerCase() : word))
    .join(' ');
}
