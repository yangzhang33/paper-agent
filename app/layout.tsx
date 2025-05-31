import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'LLM 评估新闻聚合器',
  description: '自动抓取与大语言模型评估相关的 AI 新闻和论文，生成摘要并转换为音频',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50">
          <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center">
                  <h1 className="text-xl font-semibold text-gray-900">
                    🤖 LLM 评估新闻聚合器
                  </h1>
                </div>
                <div className="text-sm text-gray-500">
                  每日自动更新
                </div>
              </div>
            </div>
          </header>
          
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
          
          <footer className="bg-white border-t border-gray-200 mt-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="text-center text-sm text-gray-500">
                <p>
                  数据来源: Arxiv • AI 新闻网站 | 
                  摘要生成: DeepSeek | 
                  语音合成: MiniMax
                </p>
                <p className="mt-2">
                  Built with Next.js • Supabase • Vercel
                </p>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
} 