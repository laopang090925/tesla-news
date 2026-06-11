import { put, list } from '@vercel/blob';
import type { Article } from './fetchNews';

const BLOB_PREFIX = 'tesla-digest/seen-urls.json';

interface SeenRecord {
  url: string;
  seenAt: string;
}

async function loadSeenUrls(): Promise<Set<string>> {
  try {
    const { blobs } = await list({ prefix: BLOB_PREFIX });
    if (blobs.length === 0) return new Set();

    const res = await fetch(blobs[0].url, { cache: 'no-store' });
    const records: SeenRecord[] = await res.json();

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);

    return new Set(
      records
        .filter((r) => new Date(r.seenAt) > cutoff)
        .map((r) => r.url)
    );
  } catch {
    return new Set();
  }
}

export async function filterDuplicates(articles: Article[]): Promise<Article[]> {
  const seen = await loadSeenUrls();
  return articles.filter((a) => !seen.has(a.url.split('?')[0]));
}

export async function saveSeenUrls(urls: string[]): Promise<void> {
  try {
    const { blobs } = await list({ prefix: BLOB_PREFIX });
    let existing: SeenRecord[] = [];

    if (blobs.length > 0) {
      const res = await fetch(blobs[0].url, { cache: 'no-store' });
      const all: SeenRecord[] = await res.json();
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 7);
      existing = all.filter((r) => new Date(r.seenAt) > cutoff);
    }

    const now = new Date().toISOString();
    const merged = [
      ...existing,
      ...urls.map((url) => ({ url: url.split('?')[0], seenAt: now })),
    ];

    await put(BLOB_PREFIX, JSON.stringify(merged), {
      access: 'public',
      addRandomSuffix: false,
    });
  } catch (e) {
    console.error('Failed to save seen URLs:', e);
  }
}
