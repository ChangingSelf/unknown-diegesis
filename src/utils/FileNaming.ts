import { MaterialType } from '@/types/document';

const UUID_LENGTH = 12;

export function formatTimestamp(date: Date = new Date()): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  return `${year}${month}${day}_${hours}${minutes}${seconds}`;
}

export function generateShortUUID(): string {
  return crypto.randomUUID().replace(/-/g, '').slice(0, UUID_LENGTH);
}

export function generateDocumentFileName(type?: MaterialType): string {
  const timestamp = formatTimestamp();
  const uuid = generateShortUUID();
  if (type) {
    return `${timestamp}_${type}_${uuid}.ud`;
  }
  return `${timestamp}_${uuid}.ud`;
}

export interface ParsedFileName {
  timestamp: string;
  type?: MaterialType;
  uuid: string;
  extension: string;
}

export function parseDocumentFileName(fileName: string): ParsedFileName | null {
  const regex = /^(\d{8}_\d{6})(?:_([a-z]+))?_([a-f0-9]{12})\.([a-z]+)$/;
  const match = fileName.match(regex);

  if (!match) {
    return null;
  }

  const [, timestamp, type, uuid, extension] = match;

  return {
    timestamp,
    type: type as MaterialType | undefined,
    uuid,
    extension,
  };
}

export function extractTimestampFromFileName(fileName: string): Date | null {
  const parsed = parseDocumentFileName(fileName);
  if (!parsed) return null;

  const { timestamp } = parsed;
  const year = parseInt(timestamp.slice(0, 4), 10);
  const month = parseInt(timestamp.slice(4, 6), 10) - 1;
  const day = parseInt(timestamp.slice(6, 8), 10);
  const hours = parseInt(timestamp.slice(9, 11), 10);
  const minutes = parseInt(timestamp.slice(11, 13), 10);
  const seconds = parseInt(timestamp.slice(13, 15), 10);

  return new Date(year, month, day, hours, minutes, seconds);
}

export function isValidDocumentFileName(fileName: string): boolean {
  return parseDocumentFileName(fileName) !== null;
}
