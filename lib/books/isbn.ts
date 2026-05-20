const ISBN13_REGEX = /^\d{13}$/;
const ISBN10_REGEX = /^\d{9}[\dX]$/i;

export function normalizeIsbn(raw: string): string | null {
  const cleaned = raw.replace(/[^0-9Xx]/g, "").toUpperCase();

  if (ISBN13_REGEX.test(cleaned)) {
    return cleaned;
  }

  if (ISBN10_REGEX.test(cleaned)) {
    return isbn10ToIsbn13(cleaned);
  }

  return null;
}

function isbn10ToIsbn13(isbn10: string): string {
  const body = `978${isbn10.slice(0, 9)}`;
  let sum = 0;

  for (let i = 0; i < 12; i++) {
    const digit = Number(body[i]);
    sum += i % 2 === 0 ? digit : digit * 3;
  }

  const check = (10 - (sum % 10)) % 10;
  return `${body}${check}`;
}

export function isValidIsbn13(isbn: string): boolean {
  if (!ISBN13_REGEX.test(isbn)) return false;

  let sum = 0;
  for (let i = 0; i < 13; i++) {
    const digit = Number(isbn[i]);
    sum += i % 2 === 0 ? digit : digit * 3;
  }

  return sum % 10 === 0;
}
