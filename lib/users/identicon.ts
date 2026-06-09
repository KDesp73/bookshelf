function hashString(input: string): number[] {
  const bytes: number[] = [];
  let hash = 0;

  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
    bytes.push(Math.abs(hash) % 256);
  }

  while (bytes.length < 20) {
    hash = (hash << 5) - hash + bytes[bytes.length - 1]!;
    hash |= 0;
    bytes.push(Math.abs(hash) % 256);
  }

  return bytes;
}

export function generateIdenticonSvg(userId: string, size = 64): string {
  const hash = hashString(userId);
  const hue = hash[0]! % 360;
  const background = `hsl(${hue}, 55%, 62%)`;
  const foreground = `hsl(${hue}, 45%, 38%)`;
  const grid = 5;
  const cell = size / grid;
  const rects: string[] = [];

  for (let row = 0; row < grid; row++) {
    for (let col = 0; col < Math.ceil(grid / 2); col++) {
      const filled = hash[1 + row * 3 + col]! % 2 === 0;
      if (!filled) continue;

      for (const mirrorCol of [col, grid - 1 - col]) {
        rects.push(
          `<rect x="${mirrorCol * cell}" y="${row * cell}" width="${cell}" height="${cell}" fill="${foreground}" />`,
        );
      }
    }
  }

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">`,
    `<rect width="${size}" height="${size}" fill="${background}" />`,
    ...rects,
    `</svg>`,
  ].join("");
}

export function identiconDataUrl(userId: string, size = 64): string {
  const svg = generateIdenticonSvg(userId, size);
  const base64 = Buffer.from(svg, "utf-8").toString("base64");
  return `data:image/svg+xml;base64,${base64}`;
}
