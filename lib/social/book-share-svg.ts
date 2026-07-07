import sharp from "sharp";
import { connectDB } from "@/lib/db";
import { Book } from "@/models/Book";
import { User } from "@/models/User";
import { getSiteUrl } from "@/lib/site-url";

const MAX_COVER_BYTES = 250_000;
const COVER_FETCH_TIMEOUT_MS = 4_000;

const CARD_WIDTH = 480;
const CARD_HEIGHT = 640;

async function fetchImageDataUri(url: string): Promise<string | null> {
  if (!/^https?:\/\//i.test(url)) return null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), COVER_FETCH_TIMEOUT_MS);
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "image/*" },
    });
    clearTimeout(timeout);

    if (!response.ok) return null;

    const contentType = response.headers.get("content-type") ?? "image/jpeg";
    if (!contentType.startsWith("image/")) return null;

    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.byteLength > MAX_COVER_BYTES) return null;

    return `data:${contentType.split(";")[0]};base64,${buffer.toString("base64")}`;
  } catch {
    return null;
  }
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function truncate(value: string, maxLength: number): string {
  const trimmed = value.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength - 1).trim()}…`;
}

function renderStars(rating: number): string {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return "★".repeat(full) + (half ? "½" : "") + "☆".repeat(empty);
}

export interface BookShareCardData {
  title: string;
  authors: string;
  coverDataUri: string | null;
  rating: number | null;
  readerName: string;
  readerUsername: string;
  hasCover: boolean;
}

export async function loadBookShareCardData(
  bookId: string,
): Promise<BookShareCardData | null> {
  await connectDB();

  const book = await Book.findById(bookId).lean();
  if (!book) return null;

  const user = await User.findById(book.userId).lean();
  if (!user) return null;

  let coverDataUri: string | null = null;
  if (book.coverUrl) {
    if (book.coverUrl.startsWith("data:image/")) {
      coverDataUri = book.coverUrl;
    } else {
      coverDataUri = await fetchImageDataUri(book.coverUrl);
    }
  }

  return {
    title: book.title,
    authors: (book.authors ?? []).join(", "),
    coverDataUri,
    rating: book.rating ?? null,
    readerName: user.name ?? user.username ?? "a reader",
    readerUsername: user.username ?? "unknown",
    hasCover: Boolean(coverDataUri),
  };
}

export function renderBookShareSvg(data: BookShareCardData): string {
  const title = escapeXml(truncate(data.title, 45));
  const authors = escapeXml(truncate(data.authors || "Unknown author", 50));
  const reader = escapeXml(data.readerName);
  const username = escapeXml(data.readerUsername);
  const siteUrl = escapeXml(getSiteUrl().replace(/^https?:\/\//, ""));

  const coverWidth = 180;
  const coverHeight = 260;
  const coverX = (CARD_WIDTH - coverWidth) / 2;
  const coverY = 60;

  const starsY = coverY + coverHeight + 28;
  const titleY = starsY + 28;
  const authorY = titleY + 28;
  const dividerY = authorY + 18;
  const readerY = dividerY + 18;

  const coverMarkup = data.hasCover
    ? `<g mask="url(#cm)"><image href="${data.coverDataUri}" x="${coverX}" y="${coverY}" width="${coverWidth}" height="${coverHeight}" preserveAspectRatio="xMidYMid slice" /></g>`
    : `<text x="${CARD_WIDTH / 2}" y="${coverY + coverHeight / 2 + 4}" text-anchor="middle" font-family="serif" font-size="52" font-weight="bold" fill="#a8a29e">${escapeXml(data.title[0]?.toUpperCase() ?? "?")}</text>`;

  const ratingMarkup = data.rating != null
    ? `<text x="${CARD_WIDTH / 2}" y="${starsY}" text-anchor="middle" font-family="serif" font-size="20" fill="#fbbf24">${renderStars(data.rating)}</text>`
    : "";

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${CARD_WIDTH}" height="${CARD_HEIGHT}" viewBox="0 0 ${CARD_WIDTH} ${CARD_HEIGHT}" role="img" aria-label="${title} on BookShelf">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#292524" stop-opacity="1" />
      <stop offset="60%" stop-color="#1c1917" stop-opacity="1" />
      <stop offset="100%" stop-color="#0c0a09" stop-opacity="1" />
    </linearGradient>
    <linearGradient id="glow" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fbbf24" stop-opacity="0.08" />
      <stop offset="100%" stop-color="#fbbf24" stop-opacity="0" />
    </linearGradient>
    <mask id="cm">
      <rect x="0" y="0" width="${CARD_WIDTH}" height="${CARD_HEIGHT}" fill="black" />
      <rect x="${coverX}" y="${coverY}" width="${coverWidth}" height="${coverHeight}" rx="10" fill="white" />
    </mask>
  </defs>

  <rect x="0" y="0" width="${CARD_WIDTH}" height="${CARD_HEIGHT}" fill="url(#bg)" />

  <rect x="0" y="0" width="${CARD_WIDTH}" height="${starsY + 10}" fill="url(#glow)" />

  <rect x="${coverX}" y="${coverY}" width="${coverWidth}" height="${coverHeight}" rx="10" fill="#44403c" />

  ${coverMarkup}

  <rect x="${coverX}" y="${coverY}" width="${coverWidth}" height="${coverHeight}" rx="10" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="1" />

  ${ratingMarkup}

  <text x="${CARD_WIDTH / 2}" y="${titleY}" text-anchor="middle" font-family="serif" font-size="24" font-weight="bold" fill="#fafaf9">${title}</text>

  <text x="${CARD_WIDTH / 2}" y="${authorY}" text-anchor="middle" font-family="sans-serif" font-size="15" fill="#d6d3d1">${authors}</text>

  <rect x="180" y="${dividerY}" width="120" height="1" fill="rgba(255,255,255,0.06)" />

  <text x="${CARD_WIDTH / 2}" y="${readerY}" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#a8a29e">Read by ${reader} · @${username}</text>

  <text x="${CARD_WIDTH / 2}" y="${CARD_HEIGHT - 24}" text-anchor="middle" font-family="serif" font-size="11" fill="#78716c">BookShelf</text>

  <text x="${CARD_WIDTH / 2}" y="${CARD_HEIGHT - 10}" text-anchor="middle" font-family="sans-serif" font-size="9" fill="#57534e">${siteUrl}</text>
</svg>`;
}

export async function buildBookShareSvg(bookId: string): Promise<string | null> {
  const data = await loadBookShareCardData(bookId);
  if (!data) return null;
  return renderBookShareSvg(data);
}

export async function buildBookSharePng(bookId: string): Promise<Uint8Array | null> {
  const svg = await buildBookShareSvg(bookId);
  if (!svg) return null;

  try {
    return await sharp(Buffer.from(svg)).png().toBuffer();
  } catch {
    return null;
  }
}
