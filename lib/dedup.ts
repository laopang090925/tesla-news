import { put, head, del } from '@vercel/blob';
import type { Article } from './fetchNews';

const BLOB_KEY = 'tesla-digest/seen-urls.json';

interface SeenRecord {
  url: string;
  seenAt: string;
}

async function loadSeenUrls(): Promise<Set<string>> {
  try {
    // 用 head 检查文件是否存在，避免 404 抛异常
    const meta = await head(BLOB_KEY).catch(() => null);
    if (!meta) return new Set();

    const res = await fetch(meta.url, { cache: 'no-store' });
    const records: SeenRecord[] = await res.json();

    // 只保留7天内的记录
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
    // 加载现有记录（7天内）
    const existingMeta = await head(BLOB_KEY).catch(() => null);
    let existing: SeenRecord[] = [];

    if (existingMeta) {
      const res = await fetch(existingMeta.url, { cache: 'no-store' });
      const all: SeenRecord[] = await res.json();
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 7);
      existing = all.filter((r) => new Date(r.seenAt) > cutoff);
    }

    const now = new Date().toISOString();
    const newRecords: SeenRecord[] = urls.map((url) => ({
      url: url.split('?')[0],
      seenAt: now,
    }));

    const merged = [...existing, ...newRecords];

    // 覆盖写入
    await put(BLOB_KEY, JSON.stringify(merged), {
      access: 'public',
      addRandomSuffix: false,
    });

    // 删旧 blob（put with addRandomSuffix:false 会自动覆盖，但以防万一）
    if (existingMeta && existingMeta.url) {
      // Vercel Blob 的 put + addRandomSuffix:false 已经覆盖，无需手动删除
    }
  } catch (e) {
    console.error('Failed to save seen URLs:', e);
  }
}
