export interface Article {
  title: string;
  url: string;
  source: string;
  publishedAt: string;
  description: string;
  imageUrl?: string;
}

const TESLA_KEYWORDS = [
  'tesla', '特斯拉', 'model 3', 'model y', 'model s', 'model x',
  'model 2', 'cybertruck', 'roadster', '4680', 'gigafactory shanghai',
  'shanghai gigafactory', 'supercharger', 'tsla', 'tesla autopilot',
  'full self-driving', 'fsd', 'tesla semi', 'tesla powerwall',
];

function isTeslaRelated(title: string, description: string): boolean {
  const text = `${title} ${description}`.toLowerCase();
  return TESLA_KEYWORDS.some((kw) => text.includes(kw));
}

// ── NewsAPI ──────────────────────────────────────────────────────────────────

export async function fetchNewsAPI(): Promise<Article[]> {
  const query =
    'Tesla OR "Model Y" OR "Model 3" OR "Model X" OR "Cybertruck" OR "4680 battery" OR "Shanghai Gigafactory" OR "Tesla Semi"';
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const from = yesterday.toISOString().split('T')[0];

  const url =
    `https://newsapi.org/v2/everything` +
    `?q=${encodeURIComponent(query)}` +
    `&language=en` +
    `&sortBy=publishedAt` +
    `&from=${from}` +
    `&pageSize=30` +
    `&apiKey=${process.env.NEWS_API_KEY}`;

  try {
    const res = await fetch(url, { cache: 'no-store' });
    const data = await res.json();
    if (!data.articles) return [];

    return data.articles
      .filter((a: { title?: string; description?: string; url?: string }) =>
        a.title &&
        a.url &&
        !a.url.includes('[Removed]') &&
        isTeslaRelated(a.title, a.description ?? '')
      )
      .slice(0, 15)
      .map(
        (a: {
          title: string;
          url: string;
          source: { name: string };
          publishedAt: string;
          description?: string;
          urlToImage?: string;
        }) => ({
          title: a.title,
          url: a.url,
          source: a.source.name,
          publishedAt: a.publishedAt,
          description: a.description ?? '',
          imageUrl: a.urlToImage ?? undefined,
        })
      );
  } catch (e) {
    console.error('NewsAPI fetch failed:', e);
    return [];
  }
}

// ── RSS Feeds ────────────────────────────────────────────────────────────────

const RSS_FEEDS = [
  { url: 'https://electrek.co/feed/', source: 'Electrek' },
  { url: 'https://insideevs.com/feed/', source: 'InsideEVs' },
  { url: 'https://cleantechnica.com/feed/', source: 'CleanTechnica' },
];

function extractTagContent(xml: string, tag: string): string {
  const pattern = new RegExp(
    `<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`,
    'i'
  );
  const m = pattern.exec(xml);
  if (!m) return '';
  return m[1].trim().replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/<[^>]+>/g, '');
}

function parseRSS(xml: string, source: string): Article[] {
  const articles: Article[] = [];
  const itemPattern = /<item>([\s\S]*?)<\/item>/g;
  let match;

  const cutoff = new Date();
  cutoff.setHours(cutoff.getHours() - 36); // 过去36小时

  while ((match = itemPattern.exec(xml)) !== null) {
    const item = match[1];
    const title = extractTagContent(item, 'title');

    // 提取 link（RSS 2.0 的 <link> 有时是自闭合标签）
    let url = extractTagContent(item, 'link');
    if (!url) {
      const guidMatch = /<guid[^>]*>([^<]+)<\/guid>/.exec(item);
      if (guidMatch) url = guidMatch[1].trim();
    }

    const description = extractTagContent(item, 'description');
    const pubDateStr = extractTagContent(item, 'pubDate');
    const publishedAt = pubDateStr
      ? new Date(pubDateStr).toISOString()
      : new Date().toISOString();

    if (!title || !url) continue;
    if (new Date(publishedAt) < cutoff) continue;
    if (!isTeslaRelated(title, description)) continue;

    articles.push({ title, url, source, publishedAt, description });
  }

  return articles;
}

export async function fetchRSSFeeds(): Promise<Article[]> {
  const results = await Promise.allSettled(
    RSS_FEEDS.map(async ({ url, source }) => {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(8000),
        cache: 'no-store',
      });
      const text = await res.text();
      return parseRSS(text, source);
    })
  );

  return results.flatMap((r) => (r.status === 'fulfilled' ? r.value : []));
}

// ── 合并去重 ─────────────────────────────────────────────────────────────────

export async function fetchAllNews(): Promise<Article[]> {
  const [newsApiArticles, rssArticles] = await Promise.all([
    fetchNewsAPI(),
    fetchRSSFeeds(),
  ]);

  const seen = new Set<string>();
  const all: Article[] = [];

  for (const article of [...newsApiArticles, ...rssArticles]) {
    const key = article.url.split('?')[0];
    if (!seen.has(key)) {
      seen.add(key);
      all.push(article);
    }
  }

  // 按时间倒序，最多返回20条
  const sorted = all
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, 20);

  // 翻译成中文
  const { translateArticles } = await import('./translate');
  return translateArticles(sorted);
}
