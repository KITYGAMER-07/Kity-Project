import {
  StoreFile, Price, getFiles, getPrices, getKeyStock, getFileById as dbGetFileById
} from './db';

export { getFiles, getPrices, getFileById as dbGetFileById };
export type { StoreFile, Price };

export function getFileById(id: number): StoreFile | undefined {
  return dbGetFileById(id);
}

export function getPricesByFileId(fileId: number): Price[] {
  return getPrices().filter(p => p.fileId === fileId);
}

export function getStockCount(fileId: number, durationDays: number): number {
  return getKeyStock().filter(k => k.fileId === fileId && k.durationDays === durationDays && k.status === 'AVAILABLE').length;
}

export function FileIcon({ fileName }: { fileName: string }): string {
  const n = fileName.toLowerCase();
  if (n.includes('bgmi') || n.includes('pubg')) return '🔫';
  if (n.includes('free fire') || n.includes('ff')) return '🔥';
  if (n.includes('clash')) return '⚔️';
  if (n.includes('cod') || n.includes('call')) return '🎯';
  if (n.includes('minecraft')) return '⛏️';
  if (n.includes('fortnite')) return '🏗️';
  if (n.includes('gta')) return '🚗';
  if (n.includes('valorant') || n.includes('valo')) return '🎯';
  return '🎮';
}

export function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  } catch {
    return iso;
  }
}

export function generateCode(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
