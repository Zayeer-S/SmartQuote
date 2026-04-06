export function checkIntegerInput(value: string): boolean {
  return value !== '' && !/^\d+$/.test(value);
}

export function checkDecimalInput(value: string): boolean {
  return value !== '' && !/^\d*\.?\d*$/.test(value);
}

export function toTitleCase(value: string): string {
  return value
    .split(' ')
    .map((word) => (word.length > 0 ? word[0].toUpperCase() + word.slice(1).toLowerCase() : word))
    .join(' ');
}
