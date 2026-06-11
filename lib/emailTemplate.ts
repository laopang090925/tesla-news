import type { Article } from './fetchNews';

// ── 工具函数 ────────────────────────────────────────────────────────────────

function relativeTime(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const h = Math.floor(diffMs / 3600000);
  if (h < 1) return '刚刚';
  if (h < 24) return `${h} 小时前`;
  if (h < 48) return '昨天';
  return `${Math.floor(h / 24)} 天前`;
}

function truncate(text: string, maxLen: number): string {
  const clean = text.replace(/<[^>]+>/g, '').trim();
  return clean.length > maxLen ? clean.slice(0, maxLen) + '…' : clean;
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}.${m}.${d}`;
}

function weekdayZh(date: Date): string {
  return ['日', '一', '二', '三', '四', '五', '六'][date.getDay()];
}

// 判断是否为"周边/优惠"类内容
function isPeripheral(article: Article): boolean {
  const text = `${article.title} ${article.source}`.toLowerCase();
  const kwds = ['deal', 'save', 'saving', 'prime day', 'discount', '$', 'coupon', 'mount', 'accessory', 'accessories', 'promo'];
  const srcs = ['dealnews', 'researchbuzz', 'cointelegraph', 'crypto'];
  return kwds.some((k) => text.includes(k)) || srcs.some((s) => text.includes(s));
}

// ── 分区渲染 ────────────────────────────────────────────────────────────────

function renderHeadStory(a: Article): string {
  const time = relativeTime(a.publishedAt);
  const source = a.source.toUpperCase();
  const desc = truncate(a.description, 140);

  return `
<tr><td style="background-color:#ffffff; padding:40px 48px 36px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
    style="font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Helvetica,'PingFang SC','Microsoft YaHei',sans-serif;">
    <tr><td>
      <div style="font-size:11px; letter-spacing:3px; color:#E31937; font-weight:700;">今日头条</div>
      <div style="font-size:12px; color:#999999; padding-top:14px; letter-spacing:0.5px;">${source}&nbsp;&nbsp;·&nbsp;&nbsp;${time}</div>
      <a href="${a.url}" style="text-decoration:none;">
        <div style="font-size:23px; line-height:1.4; color:#111111; font-weight:700; padding-top:10px;">${a.title}</div>
      </a>
      ${desc ? `<div style="font-size:14px; line-height:1.8; color:#555555; padding-top:12px;">${desc}</div>` : ''}
      <div style="padding-top:18px;">
        <a href="${a.url}" style="font-size:13px; color:#111111; text-decoration:none; font-weight:600; border-bottom:1px solid #111111; padding-bottom:2px;">阅读全文&nbsp;&nbsp;→</a>
      </div>
    </td></tr>
  </table>
</td></tr>

<tr><td style="background-color:#ffffff; padding:0 48px;">
  <div style="border-top:1px solid #eaeaea; font-size:0; line-height:0;">&nbsp;</div>
</td></tr>`;
}

function renderNewsItem(a: Article, isLast: boolean): string {
  const time = relativeTime(a.publishedAt);
  const source = a.source.toUpperCase();
  const desc = truncate(a.description, 100);
  const border = isLast ? '' : 'border-bottom:1px solid #f0f0f0;';

  return `
<tr><td style="background-color:#ffffff; padding:24px 48px 0;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
    style="font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Helvetica,'PingFang SC','Microsoft YaHei',sans-serif;">
    <tr><td style="padding-bottom:24px; ${border}">
      <div style="font-size:12px; color:#999999; letter-spacing:0.5px;">${source}&nbsp;&nbsp;·&nbsp;&nbsp;${time}</div>
      <a href="${a.url}" style="text-decoration:none;">
        <div style="font-size:16px; line-height:1.5; color:#111111; font-weight:600; padding-top:8px;">${a.title}</div>
      </a>
      ${desc ? `<div style="font-size:13px; line-height:1.7; color:#777777; padding-top:8px;">${desc}</div>` : ''}
    </td></tr>
  </table>
</td></tr>`;
}

function renderPeripheralSection(items: Article[]): string {
  if (items.length === 0) return '';

  const links = items
    .map(
      (a) =>
        `<tr><td style="padding-bottom:14px;">
          <a href="${a.url}" style="text-decoration:none;">
            <span style="font-size:13px; line-height:1.7; color:#555555;">${a.title}&nbsp;&nbsp;<span style="color:#bbbbbb;">— ${a.source}</span></span>
          </a>
        </td></tr>`
    )
    .join('');

  return `
<tr><td style="background-color:#ffffff; padding:32px 48px 8px;">
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Helvetica,'PingFang SC','Microsoft YaHei',sans-serif;
    font-size:11px; letter-spacing:3px; color:#999999; font-weight:700;">周边 · 优惠速览</div>
</td></tr>

<tr><td style="background-color:#ffffff; padding:20px 48px 40px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
    style="font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Helvetica,'PingFang SC','Microsoft YaHei',sans-serif;">
    ${links}
  </table>
</td></tr>`;
}

// ── 主入口 ──────────────────────────────────────────────────────────────────

export function buildEmailHTML(articles: Article[]): string {
  const now = new Date();
  const dateStr = formatDate(now);
  const weekday = weekdayZh(now);

  // 分区
  const mainArticles = articles.filter((a) => !isPeripheral(a));
  const peripheralArticles = articles.filter((a) => isPeripheral(a));

  const headStory = mainArticles[0];
  const newsItems = mainArticles.slice(1);

  // 收件箱预览文字
  const previewText = mainArticles
    .slice(0, 3)
    .map((a) => truncate(a.title, 30))
    .join(' · ');

  // 头条
  const headHtml = headStory ? renderHeadStory(headStory) : '';

  // 要闻列表
  const newsHeader =
    newsItems.length > 0
      ? `<tr><td style="background-color:#ffffff; padding:32px 48px 8px;">
          <div style="font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Helvetica,'PingFang SC','Microsoft YaHei',sans-serif;
            font-size:11px; letter-spacing:3px; color:#999999; font-weight:700;">今日要闻</div>
        </td></tr>`
      : '';
  const newsHtml = newsItems.map((a, i) => renderNewsItem(a, i === newsItems.length - 1)).join('');

  // 周边速览
  const peripheralHtml = renderPeripheralSection(peripheralArticles);

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<title>TESLA 每日资讯</title>
</head>
<body style="margin:0; padding:0; background-color:#f2f2f0; -webkit-text-size-adjust:100%;">

<div style="display:none; max-height:0; overflow:hidden; mso-hide:all;">${previewText} · 共 ${articles.length} 条新闻</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f2f2f0;">
<tr><td align="center" style="padding:40px 16px 56px;">

<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px; max-width:100%;">

<!-- 报头 -->
<tr><td style="background-color:#000000; padding:44px 48px 40px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td style="font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Helvetica,'PingFang SC','Microsoft YaHei',sans-serif;">
        <div style="font-size:11px; letter-spacing:6px; color:#E31937; font-weight:700; text-transform:uppercase;">Daily Digest</div>
        <div style="font-size:34px; letter-spacing:10px; color:#ffffff; font-weight:600; padding-top:14px; line-height:1;">TESLA</div>
        <div style="font-size:13px; letter-spacing:4px; color:#888888; padding-top:12px;">每 日 资 讯</div>
      </td>
      <td align="right" valign="bottom" style="font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Helvetica,'PingFang SC','Microsoft YaHei',sans-serif;">
        <div style="font-size:12px; color:#666666; letter-spacing:1px; line-height:1.8;">${dateStr}<br>星期${weekday} · ${articles.length} 条</div>
      </td>
    </tr>
  </table>
</td></tr>

<!-- 红线 -->
<tr><td style="height:3px; background-color:#E31937; font-size:0; line-height:0;">&nbsp;</td></tr>

${headHtml}
${newsHeader}
${newsHtml}
${peripheralHtml}

<!-- 页脚 -->
<tr><td style="background-color:#000000; padding:32px 48px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
    style="font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Helvetica,'PingFang SC','Microsoft YaHei',sans-serif;">
    <tr>
      <td style="font-size:11px; color:#666666; letter-spacing:1px; line-height:2;">
        信息来源&nbsp;&nbsp;NewsAPI · Electrek · InsideEVs · CleanTechnica<br>
        每天 8:30 准时送达
      </td>
      <td align="right" valign="bottom">
        <div style="font-size:11px; letter-spacing:4px; color:#444444; font-weight:600;">T E S L A</div>
      </td>
    </tr>
  </table>
</td></tr>

</table>
</td></tr>
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
