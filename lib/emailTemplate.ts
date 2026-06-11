import type { Article } from './fetchNews';

function relativeTime(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const h = Math.floor(diffMs / 3600000);
  if (h < 1) return '刚刚';
  if (h < 24) return `${h} 小时前`;
  if (h < 48) return '昨天';
  return `${Math.floor(h / 24)} 天前`;
}

function truncate(text: string, maxLen: number): string {
  if (!text) return '';
  const clean = text.replace(/<[^>]+>/g, '').trim();
  return clean.length > maxLen ? clean.slice(0, maxLen) + '…' : clean;
}

// 每个来源对应的颜色标签
const SOURCE_COLORS: Record<string, string> = {
  Electrek: '#00A86B',
  InsideEVs: '#0066CC',
  CleanTechnica: '#4CAF50',
};

function sourceColor(source: string): string {
  return SOURCE_COLORS[source] ?? '#666666';
}

function articleCard(article: Article, index: number): string {
  const color = sourceColor(article.source);
  const time = relativeTime(article.publishedAt);
  const desc = truncate(article.description, 120);
  const bg = index % 2 === 0 ? '#ffffff' : '#fafafa';

  return `
    <tr>
      <td style="padding: 6px 0;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background: ${bg}; border-radius: 10px; border: 1px solid #e8e8e8; overflow: hidden;">
          <tr>
            <td style="padding: 18px 20px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="display: inline-block; background: ${color}; color: #fff; font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 4px; letter-spacing: 0.5px; text-transform: uppercase;">${article.source}</span>
                    <span style="color: #aaa; font-size: 12px; margin-left: 8px;">${time}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top: 10px;">
                    <a href="${article.url}" style="color: #1a1a1a; font-size: 15px; font-weight: 600; text-decoration: none; line-height: 1.4;">${article.title}</a>
                  </td>
                </tr>
                ${desc ? `
                <tr>
                  <td style="padding-top: 6px; color: #666; font-size: 13px; line-height: 1.6;">
                    ${desc}
                  </td>
                </tr>` : ''}
                <tr>
                  <td style="padding-top: 12px;">
                    <a href="${article.url}" style="color: #E31937; font-size: 13px; font-weight: 500; text-decoration: none;">阅读全文 →</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>`;
}

export function buildEmailHTML(articles: Article[]): string {
  const now = new Date();
  const dateStr = now.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Shanghai',
  });

  const cards = articles.map((a, i) => articleCard(a, i)).join('');

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tesla 每日资讯</title>
</head>
<body style="margin: 0; padding: 0; background: #f0f0f0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', sans-serif;">

  <!-- Wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background: #f0f0f0; padding: 24px 0 40px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">

          <!-- Header -->
          <tr>
            <td style="background: #0a0a0a; border-radius: 12px 12px 0 0; padding: 28px 32px 24px; text-align: center;">
              <p style="margin: 0 0 4px; color: #E31937; font-size: 11px; font-weight: 700; letter-spacing: 4px; text-transform: uppercase;">DAILY DIGEST</p>
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: 3px;">TESLA 每日资讯</h1>
              <p style="margin: 10px 0 0; color: #888; font-size: 13px;">${dateStr} · 共 ${articles.length} 条新闻</p>
            </td>
          </tr>

          <!-- Red accent bar -->
          <tr>
            <td style="background: #E31937; height: 3px; line-height: 3px; font-size: 0;">&nbsp;</td>
          </tr>

          <!-- Articles -->
          <tr>
            <td style="background: #f8f8f8; padding: 16px 20px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                ${cards}
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: #0a0a0a; border-radius: 0 0 12px 12px; padding: 20px 32px; text-align: center;">
              <p style="margin: 0; color: #555; font-size: 12px; line-height: 1.6;">
                信息来源：NewsAPI · Electrek · InsideEVs · CleanTechnica<br>
                <span style="color: #333;">每天 8:30 准时送达</span>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;
}

export function buildEmailText(articles: Article[]): string {
  const lines = articles.map((a, i) => {
    const time = relativeTime(a.publishedAt);
    return `${i + 1}. [${a.source}] ${time}\n${a.title}\n${a.url}\n`;
  });
  return `Tesla 每日资讯\n${'─'.repeat(40)}\n\n${lines.join('\n')}`;
}
