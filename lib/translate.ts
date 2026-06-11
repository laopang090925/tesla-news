import type { Article } from './fetchNews';

function isAlreadyChinese(text: string): boolean {
  return /[一-鿿]/.test(text);
}

async function translateToZh(text: string): Promise<string> {
  if (!text.trim() || isAlreadyChinese(text)) return text;
  try {
    const url =
      `https://translate.googleapis.com/translate_a/single` +
      `?client=gtx&sl=en&tl=zh-CN&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url, {
      cache: 'no-store',
      signal: AbortSignal.timeout(6000),
    });
    const data = await res.json();
    return (data[0] as [string][]).map((seg) => seg[0]).join('');
  } catch {
    return text; // 翻译失败保留原文
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function translateArticles(articles: Article[]): Promise<Article[]> {
  const results: Article[] = [];

  for (const article of articles) {
    const [title, description] = await Promise.all([
      translateToZh(article.title),
      article.description ? translateToZh(article.description) : Promise.resolve(''),
    ]);
    results.push({ ...article, title, description });
    await delay(150); // 避免触发频率限制
  }

  return results;
}
