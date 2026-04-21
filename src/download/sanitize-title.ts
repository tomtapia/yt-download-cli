const WINDOWS_RESERVED_BASENAMES = new Set([
  "CON",
  "PRN",
  "AUX",
  "NUL",
  "COM1",
  "COM2",
  "COM3",
  "COM4",
  "COM5",
  "COM6",
  "COM7",
  "COM8",
  "COM9",
  "LPT1",
  "LPT2",
  "LPT3",
  "LPT4",
  "LPT5",
  "LPT6",
  "LPT7",
  "LPT8",
  "LPT9"
]);

export function sanitizeTitle(value: string, fallback: string): string {
  const normalized = value
    .normalize("NFKC")
    .replace(/[<>:"/\\|?*]/g, "-")
    .replaceAll(
      /./gsu,
      (character) => (character.charCodeAt(0) <= 0x1f ? "-" : character)
    )
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\.+$/g, "")
    .trim();

  if (normalized.length === 0) {
    return fallback;
  }

  const truncated = normalized.slice(0, 180);

  if (WINDOWS_RESERVED_BASENAMES.has(truncated.toUpperCase())) {
    return `${truncated}-file`;
  }

  return truncated;
}
