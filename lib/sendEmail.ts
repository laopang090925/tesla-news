import { Resend } from 'resend';
import { buildEmailHTML, buildEmailText } from './emailTemplate';
import type { Article } from './fetchNews';

export async function sendDigestEmail(articles: Article[]): Promise<void> {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const now = new Date();
  const dateLabel = now.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Shanghai',
  });

  await resend.emails.send({
    from: process.env.FROM_EMAIL ?? 'Tesla日报 <onboarding@resend.dev>',
    to: process.env.TO_EMAIL ?? '',
    subject: `⚡ Tesla 每日资讯 · ${dateLabel} (${articles.length} 条)`,
    html: buildEmailHTML(articles),
    text: buildEmailText(articles),
  });
}
