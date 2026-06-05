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

const CARD_WIDTH = 960;
const CARD_HEIGHT = 400;
const MAX_COVERS = MAX_FAVORITE_BOOKS;
const MAX_COVER_BYTES = 180_000;
const COVER_FETCH_TIMEOUT_MS = 4_000;

export interface ProfileShareCardData {
  displayName: string;
  username: string;
  bio?: string;
  bookCount: number;
  readCount: number;
  readingCount: number;
  likeCount: number;
  profileUrl: string;
  theme: {
    background: string;
    surface: string;
    border: string;
    accent: string;
    accentSoft: string;
    text: string;
    muted: string;
  };
  avatarMarkup: string;
  coverMarkups: string[];
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
  width: number,
  height: number,
): string {
  const hue = hashHue(title);
  const initial = escapeXml(title.trim()[0]?.toUpperCase() ?? "?");
  return [
    `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="6" fill="hsl(${hue}, 35%, 28%)" />`,
    `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="6" fill="url(#cover-shine)" opacity="0.35" />`,
    `<text x="${x + width / 2}" y="${y + height / 2 + 8}" text-anchor="middle" font-family="Georgia, serif" font-size="24" font-weight="600" fill="hsl(${hue}, 55%, 88%)">${initial}</text>`,
  ].join("");
}

function buildAvatarMarkup(
  user: NonNullable<Awaited<ReturnType<typeof getUserByUsername>>>,
  avatarDataUri: string | null,
  accent: string,
  accentSoft: string,
): string {
  const size = 56;
  const avatarType = resolveAvatarType(user);

  if (avatarType === "image" && avatarDataUri) {
    return `<clipPath id="avatar-clip"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" /></clipPath><image href="${avatarDataUri}" x="0" y="0" width="${size}" height="${size}" clip-path="url(#avatar-clip)" preserveAspectRatio="xMidYMid slice" />`;
  }

  if (avatarType === "initial") {
    const initial = escapeXml(getInitial(user));
    return [
      `<circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="${accentSoft}" />`,
      `<text x="${size / 2}" y="${size / 2 + 8}" text-anchor="middle" font-family="Georgia, serif" font-size="24" font-weight="600" fill="${accent}">${initial}</text>`,
    ].join("");
  }

  const identicon = generateIdenticonSvg(user._id, size);
  return identicon.replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "");
}

async function buildCoverMarkupsAsync(
  favoriteBooks: Array<{ title: string; coverUrl?: string }>,
  theme: ProfileShareCardData["theme"],
): Promise<string[]> {
  const coverWidth = 52;
  const coverHeight = 78;
  const coverGap = 8;
  const coverStartX =
    CARD_WIDTH - 32 - MAX_COVERS * coverWidth - (MAX_COVERS - 1) * coverGap;
  const coverY = 72;
  const coverMarkups: string[] = [];

  for (let index = 0; index < MAX_COVERS; index++) {
    const x = coverStartX + index * (coverWidth + coverGap);
    const book = favoriteBooks[index];

    if (!book) {
      coverMarkups.push(
        `<rect x="${x}" y="${coverY}" width="${coverWidth}" height="${coverHeight}" rx="6" fill="${theme.border}" opacity="0.3" />`,
      );
      continue;
    }

    let coverDataUri: string | null = null;
    if (book.coverUrl) {
      coverDataUri = await fetchImageDataUri(book.coverUrl);
    }

    if (coverDataUri) {
      const clipId = `cover-clip-${index}`;
      coverMarkups.push(
        `<clipPath id="${clipId}"><rect x="${x}" y="${coverY}" width="${coverWidth}" height="${coverHeight}" rx="6" /></clipPath>`,
        `<image href="${coverDataUri}" x="${x}" y="${coverY}" width="${coverWidth}" height="${coverHeight}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${clipId})" />`,
      );
    } else {
      coverMarkups.push(
        placeholderCoverMarkup(book.title, x, coverY, coverWidth, coverHeight),
      );
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

  const theme = {
    background: overrides["--shelf-bg"] ?? presetVars.background,
    surface: presetVars.surface,
    border: presetVars.border,
    accent: overrides["--shelf-accent"] ?? presetVars.accent,
    accentSoft: presetVars.accentSoft,
    text: presetVars.text,
    muted: presetVars.muted,
  };

  let avatarDataUri: string | null = null;
  if (resolveAvatarType(user) === "image" && user.image) {
    if (user.image.startsWith("data:image/")) {
      avatarDataUri = user.image;
    } else {
      avatarDataUri = await fetchImageDataUri(user.image);
    }
  }

  const coverMarkups = await buildCoverMarkupsAsync(favoriteBooks, theme);

  return {
    displayName: user.name ?? user.username,
    username: user.username,
    bio: user.bio,
    bookCount,
    readCount,
    readingCount,
    likeCount,
    profileUrl: profileUrl(user.username),
    theme,
    avatarMarkup: buildAvatarMarkup(user, avatarDataUri, theme.accent, theme.accentSoft),
    coverMarkups,
  };
}

export function renderProfileShareSvg(data: ProfileShareCardData): string {
  const displayName = escapeXml(truncate(data.displayName, 36));
  const username = escapeXml(data.username);
  const bio = data.bio ? escapeXml(truncate(data.bio, 90)) : "";
  const profileLink = escapeXml(data.profileUrl);
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

  const { theme } = data;
  const statsY = bio ? 132 : 112;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_WIDTH}" height="${CARD_HEIGHT}" viewBox="0 0 ${CARD_WIDTH} ${CARD_HEIGHT}" role="img" aria-label="${displayName} on BookShelf">
  <defs>
    <linearGradient id="card-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${theme.background}" />
      <stop offset="100%" stop-color="${theme.surface}" />
    </linearGradient>
    <linearGradient id="cover-shine" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.35" />
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
    </linearGradient>
    <filter id="soft-shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#000000" flood-opacity="0.14" />
    </filter>
  </defs>

  <rect width="${CARD_WIDTH}" height="${CARD_HEIGHT}" fill="url(#card-bg)" />
  <rect x="24" y="24" width="${CARD_WIDTH - 48}" height="${CARD_HEIGHT - 48}" rx="18" fill="${theme.surface}" stroke="${theme.border}" stroke-width="1.5" filter="url(#soft-shadow)" />

  <g transform="translate(40, 48)">
    ${data.avatarMarkup}
  </g>

  <text x="112" y="72" font-family="Georgia, 'Times New Roman', serif" font-size="30" font-weight="700" fill="${theme.text}">${displayName}</text>
  <text x="112" y="96" font-family="ui-sans-serif, system-ui, sans-serif" font-size="16" fill="${theme.muted}">@${username}</text>
  ${
    bio
      ? `<text x="112" y="118" font-family="ui-sans-serif, system-ui, sans-serif" font-size="14" fill="${theme.text}" opacity="0.88">${bio}</text>`
      : ""
  }
  <text x="112" y="${statsY}" font-family="ui-sans-serif, system-ui, sans-serif" font-size="14" font-weight="600" fill="${theme.accent}">${stats}</text>

  <text x="112" y="356" font-family="Georgia, 'Times New Roman', serif" font-size="18" font-weight="700" fill="${theme.accent}">BookShelf</text>
  <text x="112" y="376" font-family="ui-sans-serif, system-ui, sans-serif" font-size="12" fill="${theme.muted}">${profileLink}</text>

  <text x="${CARD_WIDTH - 40}" y="356" text-anchor="end" font-family="ui-sans-serif, system-ui, sans-serif" font-size="11" letter-spacing="0.1em" fill="${theme.muted}">FAVORITES</text>

  ${data.coverMarkups.join("\n  ")}
</svg>`;
}

export async function buildProfileShareSvg(username: string): Promise<string | null> {
  const data = await loadProfileShareCardData(username);
  if (!data) return null;
  return renderProfileShareSvg(data);
}
