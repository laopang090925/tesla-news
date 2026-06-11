export default function Home() {
  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: '40px', maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '24px', color: '#1a1a1a' }}>⚡ Tesla 每日资讯</h1>
      <p style={{ color: '#666', lineHeight: 1.6 }}>
        每天北京时间 8:30 自动抓取全球 Tesla 最新资讯，发送至邮箱。
      </p>
      <ul style={{ color: '#444', lineHeight: 2 }}>
        <li>信息源：NewsAPI · Electrek · InsideEVs · CleanTechnica</li>
        <li>关键词：Tesla / 特斯拉 / Model 系列 / 4680 / 上海超级工厂</li>
        <li>推送时间：每天 08:30（北京时间）</li>
      </ul>
    </main>
  );
}
