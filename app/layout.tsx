import type { ReactNode } from 'react';

export const metadata = {
  title: 'Baidu Keyword Tool',
  description: 'Baidu keyword collector MVP',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#fff' }}>
        {children}
      </body>
    </html>
  );
}
