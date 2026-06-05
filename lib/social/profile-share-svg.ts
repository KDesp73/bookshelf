import { Book } from "@/models/Book";
import { connectDB } from "@/lib/db";
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
import { profileUrl } from "@/lib/site-url";

const CARD_WIDTH = 1200;
const CARD_HEIGHT = 630;
const MAX_COVER_BYTES = 180_000;
const MAX_COVERS = 6;
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
    `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="8" fill="hsl(${hue}, 35%, 28%)" />`,
    `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="8" fill="url(#cover-shine)" opacity="0.35" />`,
    `<text x="${x + width / 2}" y="${y + height / 2 + 12}" text-anchor="middle" font-family="Georgia, serif" font-size="42" font-weight="600" fill="hsl(${hue}, 55%, 88%)">${initial}</text>`,
  ].join("");
}

function buildAvatarMarkup(
  user: NonNullable<Awaited<ReturnType<typeof getUserByUsername>>>,
  avatarDataUri: string | null,
  accent: string,
  accentSoft: string,
): string {
  const size = 96;
  const avatarType = resolveAvatarType(user);

  if (avatarType === "image" && avatarDataUri) {
    return `<clipPath id="avatar-clip"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" /></clipPath><image href="${avatarDataUri}" x="0" y="0" width="${size}" height="${size}" clip-path="url(#avatar-clip)" preserveAspectRatio="xMidYMid slice" />`;
  }

  if (avatarType === "initial") {
    const initial = escapeXml(getInitial(user));
    return [
      `<circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="${accentSoft}" />`,
      `<text x="${size / 2}" y="${size / 2 + 14}" text-anchor="middle" font-family="Georgia, serif" font-size="42" font-weight="600" fill="${accent}">${initial}</text>`,
    ].join("");
  }

  const identicon = generateIdenticonSvg(user._id, size);
  const inner = identicon
    .replace(/^<svg[^>]*>/, "")
    .replace(/<\/svg>$/, "");
  return inner;
}

export async function loadProfileShareCardData(
  username: string,
): Promise<ProfileShareCardData | null> {
  const user = await getUserByUsername(username);
  if (!user?.username) return null;

  await connectDB();

  const [bookCount, readCount, readingCount, likeCount, recentBooks] =
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
      Book.find({ userId: user._id, isWishlist: { $ne: true } })
        .sort({ dateAdded: -1 })
        .limit(MAX_COVERS)
        .select("title coverUrl")
        .lean(),
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

  const coverWidth = 118;
  const coverHeight = 176;
  const coverGap = 16;
  const coverStartX =
    CARD_WIDTH - 72 - MAX_COVERS * coverWidth - (MAX_COVERS - 1) * coverGap;
  const coverY = 300;

  const coverMarkups: string[] = [];

  for (let index = 0; index < MAX_COVERS; index++) {
    const x = coverStartX + index * (coverWidth + coverGap);
    const book = recentBooks[index];

    if (!book) {
      coverMarkups.push(
        `<rect x="${x}" y="${coverY}" width="${coverWidth}" height="${coverHeight}" rx="8" fill="${theme.border}" opacity="0.35" />`,
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
        `<rect x="${x - 2}" y="${coverY - 2}" width="${coverWidth + 4}" height="${coverHeight + 4}" rx="10" fill="${theme.border}" opacity="0.8" />`,
        `<clipPath id="${clipId}"><rect x="${x}" y="${coverY}" width="${coverWidth}" height="${coverHeight}" rx="8" /></clipPath>`,
        `<image href="${coverDataUri}" x="${x}" y="${coverY}" width="${coverWidth}" height="${coverHeight}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${clipId})" />`,
      );
    } else {
      coverMarkups.push(
        placeholderCoverMarkup(book.title, x, coverY, coverWidth, coverHeight),
      );
    }
  }

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
  const displayName = escapeXml(truncate(data.displayName, 48));
  const username = escapeXml(data.username);
  const bio = data.bio ? escapeXml(truncate(data.bio, 140)) : "";
  const profileLink = escapeXml(data.profileUrl);
  const stats = escapeXml(
    [
      `${data.bookCount} ${data.bookCount === 1 ? "book" : "books"}`,
      `${data.readCount} read`,
      data.readingCount > 0 ? `${data.readingCount} reading` : null,
      `${data.likeCount} ${data.likeCount === 1 ? "like" : "likes"}`,
    ]
      .filter(Boolean)
      .join("  ·  "),
  );

  const { theme } = data;

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
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.18" />
    </filter>
  </defs>

  <rect width="${CARD_WIDTH}" height="${CARD_HEIGHT}" fill="url(#card-bg)" />
  <rect x="48" y="48" width="${CARD_WIDTH - 96}" height="${CARD_HEIGHT - 96}" rx="28" fill="${theme.surface}" stroke="${theme.border}" stroke-width="2" filter="url(#soft-shadow)" />

  <g transform="translate(96, 96)">
    ${data.avatarMarkup}
  </g>

  <text x="220" y="132" font-family="Georgia, 'Times New Roman', serif" font-size="44" font-weight="700" fill="${theme.text}">${displayName}</text>
  <text x="220" y="172" font-family="ui-sans-serif, system-ui, sans-serif" font-size="24" fill="${theme.muted}">@${username}</text>
  ${
    bio
      ? `<text x="220" y="220" font-family="ui-sans-serif, system-ui, sans-serif" font-size="22" fill="${theme.text}" opacity="0.88">${bio}</text>`
      : ""
  }

  <text x="220" y="${bio ? 268 : 220}" font-family="ui-sans-serif, system-ui, sans-serif" font-size="22" font-weight="600" fill="${theme.accent}">${stats}</text>

  <text x="96" y="560" font-family="Georgia, 'Times New Roman', serif" font-size="28" font-weight="700" fill="${theme.accent}">BookShelf</text>
  <text x="96" y="592" font-family="ui-sans-serif, system-ui, sans-serif" font-size="20" fill="${theme.muted}">${profileLink}</text>

  <text x="${CARD_WIDTH - 96}" y="560" text-anchor="end" font-family="ui-sans-serif, system-ui, sans-serif" font-size="18" letter-spacing="0.08em" fill="${theme.muted}">COLLECTION PREVIEW</text>

  ${data.coverMarkups.join("\n  ")}
</svg>`;
}

export async function buildProfileShareSvg(username: string): Promise<string | null> {
  const data = await loadProfileShareCardData(username);
  if (!data) return null;
  return renderProfileShareSvg(data);
}
