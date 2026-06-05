import { connectDB } from "@/lib/db";
import { getFavoriteBooksForShare } from "@/lib/books/favorites";
import { getLikeCount } from "@/lib/social/queries";
import { getUserByUsername } from "@/lib/users/queries";
import {
  getInitial,
  resolveAvatarType,
} from "@/lib/users/avatar";
import { generateIdenticonSvg } from "@/lib/users/identicon";
import {
  SHELF_PRESET_VARS,
  buildShelfStyleVars,
} from "@/lib/shelf/presets";
import { MAX_FAVORITE_BOOKS } from "@/lib/constants";
import { profileUrl } from "@/lib/site-url";
import { Book } from "@/models/Book";

const MAX_COVERS = MAX_FAVORITE_BOOKS;
const MAX_COVER_BYTES = 180_000;
const COVER_FETCH_TIMEOUT_MS = 4_000;

const AVATAR_SIZE = 36;
const COVER_WIDTH = 34;
const COVER_HEIGHT = 52;
const COVER_GAP = 4;
const TEXT_X = 44;
const PADDING_X = 0;
const PADDING_Y = 0;
const ROW_HEIGHT = 68;

export interface ProfileShareCardData {
  displayName: string;
  username: string;
  bio?: string;
  bookCount: number;
  readCount: number;
  readingCount: number;
  likeCount: number;
  profileUrl: string;
  accent: string;
  avatarMarkup: string;
  coverMarkups: string[];
  coverCount: number;
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

function hashHue(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % 360;
}

function computeCardWidth(coverCount: number): number {
  const coversWidth =
    coverCount > 0
      ? coverCount * COVER_WIDTH + (coverCount - 1) * COVER_GAP
      : 0;
  const textWidth = 230;
  const gap = coverCount > 0 ? 12 : 0;
  return PADDING_X * 2 + TEXT_X + textWidth + gap + coversWidth;
}

function computeCardHeight(): number {
  return PADDING_Y * 2 + ROW_HEIGHT;
}

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

function placeholderCoverMarkup(
  title: string,
  x: number,
  y: number,
): string {
  const hue = hashHue(title);
  const initial = escapeXml(title.trim()[0]?.toUpperCase() ?? "?");
  return [
    `<rect x="${x}" y="${y}" width="${COVER_WIDTH}" height="${COVER_HEIGHT}" rx="4" fill="hsl(${hue}, 30%, 42%)" />`,
    `<text x="${x + COVER_WIDTH / 2}" y="${y + COVER_HEIGHT / 2 + 5}" text-anchor="middle" font-family="Georgia, serif" font-size="14" font-weight="600" fill="hsl(${hue}, 45%, 90%)">${initial}</text>`,
  ].join("");
}

function buildAvatarMarkup(
  user: NonNullable<Awaited<ReturnType<typeof getUserByUsername>>>,
  avatarDataUri: string | null,
  accent: string,
  accentSoft: string,
): string {
  const size = AVATAR_SIZE;
  const avatarType = resolveAvatarType(user);

  if (avatarType === "image" && avatarDataUri) {
    return `<clipPath id="avatar-clip"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" /></clipPath><image href="${avatarDataUri}" x="0" y="0" width="${size}" height="${size}" clip-path="url(#avatar-clip)" preserveAspectRatio="xMidYMid slice" />`;
  }

  if (avatarType === "initial") {
    const initial = escapeXml(getInitial(user));
    return [
      `<circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="${accentSoft}" />`,
      `<text x="${size / 2}" y="${size / 2 + 6}" text-anchor="middle" font-family="Georgia, serif" font-size="15" font-weight="600" fill="${accent}">${initial}</text>`,
    ].join("");
  }

  const identicon = generateIdenticonSvg(user._id, size);
  return identicon.replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "");
}

async function buildCoverMarkupsAsync(
  favoriteBooks: Array<{ title: string; coverUrl?: string }>,
  cardWidth: number,
): Promise<string[]> {
  if (favoriteBooks.length === 0) return [];

  const coverStartX =
    cardWidth -
    PADDING_X -
    favoriteBooks.length * COVER_WIDTH -
    (favoriteBooks.length - 1) * COVER_GAP;
  const coverY = PADDING_Y + (ROW_HEIGHT - COVER_HEIGHT) / 2;
  const coverMarkups: string[] = [];

  for (let index = 0; index < favoriteBooks.length; index++) {
    const x = coverStartX + index * (COVER_WIDTH + COVER_GAP);
    const book = favoriteBooks[index]!;

    let coverDataUri: string | null = null;
    if (book.coverUrl) {
      coverDataUri = await fetchImageDataUri(book.coverUrl);
    }

    if (coverDataUri) {
      const clipId = `cover-clip-${index}`;
      coverMarkups.push(
        `<clipPath id="${clipId}"><rect x="${x}" y="${coverY}" width="${COVER_WIDTH}" height="${COVER_HEIGHT}" rx="4" /></clipPath>`,
        `<image href="${coverDataUri}" x="${x}" y="${coverY}" width="${COVER_WIDTH}" height="${COVER_HEIGHT}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${clipId})" />`,
      );
    } else {
      coverMarkups.push(placeholderCoverMarkup(book.title, x, coverY));
    }
  }

  return coverMarkups;
}

export async function loadProfileShareCardData(
  username: string,
): Promise<ProfileShareCardData | null> {
  const user = await getUserByUsername(username);
  if (!user?.username) return null;

  await connectDB();

  const [bookCount, readCount, readingCount, likeCount, favoriteBooks] =
    await Promise.all([
      Book.countDocuments({ userId: user._id, isWishlist: { $ne: true } }),
      Book.countDocuments({
        userId: user._id,
        isWishlist: { $ne: true },
        status: "Read",
      }),
      Book.countDocuments({
        userId: user._id,
        isWishlist: { $ne: true },
        status: "Reading",
      }),
      getLikeCount(user._id),
      getFavoriteBooksForShare(user._id, user.favoriteBookIds, MAX_COVERS),
    ]);

  const presetVars = SHELF_PRESET_VARS[user.shelfAppearance.preset];
  const overrides = buildShelfStyleVars(user.shelfAppearance);
  const accent = overrides["--shelf-accent"] ?? presetVars.accent;
  const accentSoft = presetVars.accentSoft;

  let avatarDataUri: string | null = null;
  if (resolveAvatarType(user) === "image" && user.image) {
    if (user.image.startsWith("data:image/")) {
      avatarDataUri = user.image;
    } else {
      avatarDataUri = await fetchImageDataUri(user.image);
    }
  }

  const coverCount = favoriteBooks.length;
  const cardWidth = computeCardWidth(coverCount);
  const coverMarkups = await buildCoverMarkupsAsync(favoriteBooks, cardWidth);

  return {
    displayName: user.name ?? user.username,
    username: user.username,
    bio: user.bio,
    bookCount,
    readCount,
    readingCount,
    likeCount,
    profileUrl: profileUrl(user.username),
    accent,
    avatarMarkup: buildAvatarMarkup(user, avatarDataUri, accent, accentSoft),
    coverMarkups,
    coverCount,
  };
}

export function renderProfileShareSvg(data: ProfileShareCardData): string {
  const cardWidth = computeCardWidth(data.coverCount);
  const cardHeight = computeCardHeight();
  const displayName = escapeXml(truncate(data.displayName, 28));
  const username = escapeXml(data.username);
  const profileLink = escapeXml(data.profileUrl.replace(/^https?:\/\//, ""));
  const stats = escapeXml(
    [
      `${data.bookCount} ${data.bookCount === 1 ? "book" : "books"}`,
      `${data.readCount} read`,
      data.readingCount > 0 ? `${data.readingCount} reading` : null,
      `${data.likeCount} ${data.likeCount === 1 ? "like" : "likes"}`,
    ]
      .filter(Boolean)
      .join(" · "),
  );

  const avatarY = PADDING_Y + (ROW_HEIGHT - AVATAR_SIZE) / 2;
  const nameY = PADDING_Y + 24;
  const handleY = PADDING_Y + 40;
  const statsY = PADDING_Y + 56;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${cardWidth}" height="${cardHeight}" viewBox="0 0 ${cardWidth} ${cardHeight}" role="img" aria-label="${displayName} on BookShelf">
  <style>
    .title { fill: #1f2328; font-family: Georgia, 'Times New Roman', serif; font-size: 15px; font-weight: 700; }
    .meta { fill: #656d76; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 11px; }
    .stats { fill: ${data.accent}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 11px; font-weight: 600; }
    @media (prefers-color-scheme: dark) {
      .title { fill: #f0f6fc; }
      .meta { fill: #8b949e; }
    }
  </style>

  <g transform="translate(${PADDING_X}, ${avatarY})">
    ${data.avatarMarkup}
  </g>

  <text x="${TEXT_X}" y="${nameY}" class="title">${displayName}</text>
  <text x="${TEXT_X}" y="${handleY}" class="meta">@${username} · BookShelf</text>
  <text x="${TEXT_X}" y="${statsY}" class="stats">${stats} · ${profileLink}</text>

  ${data.coverMarkups.join("\n  ")}
</svg>`;
}

export async function buildProfileShareSvg(username: string): Promise<string | null> {
  const data = await loadProfileShareCardData(username);
  if (!data) return null;
  return renderProfileShareSvg(data);
}
