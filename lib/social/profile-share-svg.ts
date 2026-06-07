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
  type ShelfThemeVars,
} from "@/lib/shelf/presets";
import { MAX_FAVORITE_BOOKS } from "@/lib/constants";
import { profileUrl } from "@/lib/site-url";
import { Book } from "@/models/Book";

const MAX_COVERS = MAX_FAVORITE_BOOKS;
const MAX_COVER_BYTES = 180_000;
const COVER_FETCH_TIMEOUT_MS = 4_000;

const PADDING = 28;
const AVATAR_SIZE = 52;
const COVER_WIDTH = 44;
const COVER_HEIGHT = 66;
const COVER_GAP = 6;
const CARD_WIDTH = 480;

const HEADER_HEIGHT = 44;
const FOOTER_HEIGHT = 32;

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
  theme: ShelfThemeVars;
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

function solidRgb(color: string): string {
  const match = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (match) {
    return `rgb(${match[1]}, ${match[2]}, ${match[3]})`;
  }
  return color;
}

function computeLayout(
  hasBio: boolean,
  hasCovers: boolean,
  coverCount: number,
): {
  cardHeight: number;
  avatarY: number;
  nameY: number;
  handleY: number;
  bioY: number;
  statsSepY: number;
  coversSepY: number;
  coversY: number;
  coverStartX: number;
} {
  const avatarY = HEADER_HEIGHT + 16;
  const nameY = avatarY + 18;
  const handleY = avatarY + 38;
  const bioY = handleY + 14;
  const statsSepY = bioY + (hasBio ? 16 : 0);

  let cursor = statsSepY + 40;

  const coversSepY = cursor - 4;
  const coversY = cursor + 8;
  const coverStartX = PADDING;

  if (hasCovers) {
    cursor = coversY + COVER_HEIGHT + 16;
  }

  const cardHeight = cursor + FOOTER_HEIGHT;

  return {
    cardHeight,
    avatarY,
    nameY,
    handleY,
    bioY,
    statsSepY,
    coversSepY,
    coversY,
    coverStartX,
  };
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
    `<rect x="${x}" y="${y}" width="${COVER_WIDTH}" height="${COVER_HEIGHT}" rx="4" fill="hsl(${hue}, 25%, 50%)" />`,
    `<text x="${x + COVER_WIDTH / 2}" y="${y + COVER_HEIGHT / 2 + 5}" text-anchor="middle" font-family="Georgia, serif" font-size="16" font-weight="600" fill="hsl(${hue}, 40%, 92%)">${initial}</text>`,
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
      `<text x="${size / 2}" y="${size / 2 + 6}" text-anchor="middle" font-family="Georgia, serif" font-size="20" font-weight="600" fill="${accent}">${initial}</text>`,
    ].join("");
  }

  const identicon = generateIdenticonSvg(user._id, size);
  return identicon.replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "");
}

async function buildCoverMarkupsAsync(
  favoriteBooks: Array<{ title: string; coverUrl?: string }>,
  startX: number,
  startY: number,
): Promise<string[]> {
  if (favoriteBooks.length === 0) return [];

  const coverMarkups: string[] = [];

  for (let index = 0; index < favoriteBooks.length; index++) {
    const x = startX + index * (COVER_WIDTH + COVER_GAP);
    const book = favoriteBooks[index]!;

    let coverDataUri: string | null = null;
    if (book.coverUrl) {
      coverDataUri = await fetchImageDataUri(book.coverUrl);
    }

    if (coverDataUri) {
      const clipId = `cover-clip-${index}`;
      coverMarkups.push(
        `<clipPath id="${clipId}"><rect x="${x}" y="${startY}" width="${COVER_WIDTH}" height="${COVER_HEIGHT}" rx="4" /></clipPath>`,
        `<image href="${coverDataUri}" x="${x}" y="${startY}" width="${COVER_WIDTH}" height="${COVER_HEIGHT}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${clipId})" />`,
      );
    } else {
      coverMarkups.push(placeholderCoverMarkup(book.title, x, startY));
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
  const background = overrides["--shelf-bg"] ?? presetVars.background;

  const theme: ShelfThemeVars = {
    ...presetVars,
    accent,
    background,
  };

  let avatarDataUri: string | null = null;
  if (resolveAvatarType(user) === "image" && user.image) {
    if (user.image.startsWith("data:image/")) {
      avatarDataUri = user.image;
    } else {
      avatarDataUri = await fetchImageDataUri(user.image);
    }
  }

  const hasBio = Boolean(user.bio);
  const hasCovers = favoriteBooks.length > 0;
  const layout = computeLayout(hasBio, hasCovers, favoriteBooks.length);

  const coverMarkups = await buildCoverMarkupsAsync(
    favoriteBooks,
    layout.coverStartX,
    layout.coversY,
  );

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
    avatarMarkup: buildAvatarMarkup(
      user,
      avatarDataUri,
      accent,
      presetVars.accentSoft,
    ),
    coverMarkups,
    coverCount: favoriteBooks.length,
    theme,
  };
}

export function renderProfileShareSvg(data: ProfileShareCardData): string {
  const { theme } = data;
  const hasBio = Boolean(data.bio);
  const hasCovers = data.coverCount > 0;
  const layout = computeLayout(hasBio, hasCovers, data.coverCount);

  const displayName = escapeXml(truncate(data.displayName, 26));
  const username = escapeXml(data.username);
  const bio = data.bio ? escapeXml(truncate(data.bio, 80)) : null;
  const profileLink = escapeXml(data.profileUrl.replace(/^https?:\/\//, ""));

  const avatarX = PADDING;
  const nameX = PADDING + AVATAR_SIZE + 14;

  const statsColumns = [
    { label: "Books", value: data.bookCount },
    { label: "Read", value: data.readCount },
    { label: "Reading", value: data.readingCount },
    { label: "Likes", value: data.likeCount },
  ].filter((s) => s.value > 0);

  const statsWidth = CARD_WIDTH - PADDING * 2;
  const statColWidth = statsWidth / statsColumns.length;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_WIDTH}" height="${layout.cardHeight}" viewBox="0 0 ${CARD_WIDTH} ${layout.cardHeight}" role="img" aria-label="${displayName} on BookShelf">
  <rect x="0" y="0" width="${CARD_WIDTH}" height="${layout.cardHeight}" rx="16" fill="${theme.background}" />

  <rect x="0" y="0" width="${CARD_WIDTH}" height="${HEADER_HEIGHT}" rx="16" fill="${theme.accent}" opacity="0.08" />

  <text x="${PADDING}" y="28" font-family="Georgia, 'Times New Roman', serif" font-size="13" font-weight="700" fill="${theme.accent}" letter-spacing="0.5">BookShelf</text>

  <g transform="translate(${avatarX}, ${layout.avatarY})">
    ${data.avatarMarkup}
  </g>

  <text x="${nameX}" y="${layout.nameY}" font-family="Georgia, 'Times New Roman', serif" font-size="17" font-weight="700" fill="${theme.text}">${displayName}</text>

  <text x="${nameX}" y="${layout.handleY}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif" font-size="12" fill="${theme.muted}">@${username}</text>

  ${bio ? `<text x="${PADDING}" y="${layout.bioY}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif" font-size="12" fill="${theme.muted}">${bio}</text>` : ""}

  <rect x="${PADDING}" y="${layout.statsSepY}" width="${statsWidth}" height="1" fill="${solidRgb(theme.border)}" opacity="0.5" />

  ${statsColumns
    .map((stat, i) => {
      const x = PADDING + i * statColWidth;
      return [
        `<text x="${x}" y="${layout.statsSepY + 16}" font-family="Georgia, 'Times New Roman', serif" font-size="16" font-weight="700" fill="${theme.accent}">${stat.value}</text>`,
        `<text x="${x}" y="${layout.statsSepY + 30}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif" font-size="10" fill="${theme.muted}">${stat.label}</text>`,
      ].join("");
    })
    .join("")}

  ${hasCovers ? `<rect x="${PADDING}" y="${layout.coversSepY}" width="${statsWidth}" height="1" fill="${solidRgb(theme.border)}" opacity="0.5" />` : ""}

  ${data.coverMarkups.join("\n  ")}

  <rect x="0" y="${layout.cardHeight - FOOTER_HEIGHT}" width="${CARD_WIDTH}" height="${FOOTER_HEIGHT}" fill="${theme.accent}" opacity="0.06" />

  <text x="${CARD_WIDTH / 2}" y="${layout.cardHeight - 12}" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif" font-size="10" fill="${theme.muted}">${profileLink}</text>
</svg>`;
}

export async function buildProfileShareSvg(username: string): Promise<string | null> {
  const data = await loadProfileShareCardData(username);
  if (!data) return null;
  return renderProfileShareSvg(data);
}
