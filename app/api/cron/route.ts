import { NextResponse } from 'next/server';
import { fetchAllNews } from '@/lib/fetchNews';
import { filterDuplicates, saveSeenUrls } from '@/lib/dedup';
import { sendDigestEmail } from '@/lib/sendEmail';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: Request) {
  // 验证 Cron 密钥（Vercel 会自动附带此 Header）
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return runDigest();
}

// 手动触发接口（用于测试），通过 ?secret=xxx 传密钥
export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return runDigest();
}

async function runDigest() {
  try {
    console.log('[Tesla Digest] Starting news fetch...');

    const all = await fetchAllNews();
    console.log(`[Tesla Digest] Fetched ${all.length} articles total`);

    const newArticles = await filterDuplicates(all);
    console.log(`[Tesla Digest] ${newArticles.length} new articles after dedup`);

    if (newArticles.length === 0) {
      return NextResponse.json({ message: 'No new articles today', sent: 0 });
    }

    await sendDigestEmail(newArticles);
    await saveSeenUrls(newArticles.map((a) => a.url));

    console.log(`[Tesla Digest] Email sent with ${newArticles.length} articles`);
    return NextResponse.json({
      message: 'Digest sent successfully',
      sent: newArticles.length,
      articles: newArticles.map((a) => ({ title: a.title, source: a.source })),
    });
  } catch (error) {
    console.error('[Tesla Digest] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', detail: String(error) },
      { status: 500 }
    );
  }
}
