'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { NewsItem } from '../lib/supabase'

interface NewsItemWithAudio extends NewsItem {
  isPlaying?: boolean
}

export default function HomePage() {
  const [newsItems, setNewsItems] = useState<NewsItemWithAudio[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'arxiv' | 'news'>('all')
  const [currentPlayingId, setCurrentPlayingId] = useState<number | null>(null)

  useEffect(() => {
    fetchNews()
  }, [])

  const fetchNews = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('news_items')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (fetchError) {
        throw fetchError
      }

      setNewsItems(data || [])
    } catch (err: any) {
      console.error('获取新闻失败:', err)
      setError('获取新闻数据失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const filteredNews = newsItems.filter(item => {
    if (filter === 'all') return true
    return item.source === filter
  })

  const handleAudioPlay = (newsId: number) => {
    setCurrentPlayingId(newsId)
  }

  const handleAudioPause = () => {
    setCurrentPlayingId(null)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return <LoadingSkeleton />
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">⚠️ {error}</div>
        <button 
          onClick={fetchNews}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          重试
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* 统计信息 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard 
          title="总内容数" 
          value={newsItems.length} 
          icon="📊"
        />
        <StatsCard 
          title="论文数量" 
          value={newsItems.filter(item => item.source === 'arxiv').length} 
          icon="📚"
        />
        <StatsCard 
          title="新闻数量" 
          value={newsItems.filter(item => item.source === 'news').length} 
          icon="📰"
        />
      </div>

      {/* 过滤器 */}
      <div className="flex space-x-4">
        <FilterButton 
          active={filter === 'all'} 
          onClick={() => setFilter('all')}
        >
          全部
        </FilterButton>
        <FilterButton 
          active={filter === 'arxiv'} 
          onClick={() => setFilter('arxiv')}
        >
          📚 论文
        </FilterButton>
        <FilterButton 
          active={filter === 'news'} 
          onClick={() => setFilter('news')}
        >
          📰 新闻
        </FilterButton>
      </div>

      {/* 新闻列表 */}
      {filteredNews.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          暂无相关内容
        </div>
      ) : (
        <div className="space-y-6">
          {filteredNews.map((item) => (
            <NewsCard 
              key={item.id} 
              item={item}
              isPlaying={currentPlayingId === item.id}
              onAudioPlay={() => handleAudioPlay(item.id!)}
              onAudioPause={handleAudioPause}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// 统计卡片组件
function StatsCard({ title, value, icon }: { title: string; value: number; icon: string }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className="text-3xl">{icon}</div>
      </div>
    </div>
  )
}

// 过滤按钮组件
function FilterButton({ 
  children, 
  active, 
  onClick 
}: { 
  children: React.ReactNode
  active: boolean
  onClick: () => void 
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg transition-colors ${
        active 
          ? 'bg-blue-600 text-white' 
          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
      }`}
    >
      {children}
    </button>
  )
}

// 新闻卡片组件
function NewsCard({ 
  item, 
  isPlaying, 
  onAudioPlay, 
  onAudioPause 
}: { 
  item: NewsItemWithAudio
  isPlaying: boolean
  onAudioPlay: () => void
  onAudioPause: () => void
}) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="news-card">
      {/* 头部信息 */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-2">
          <span className={`source-badge ${item.source === 'arxiv' ? 'source-arxiv' : 'source-news'}`}>
            {item.source === 'arxiv' ? '📚 论文' : '📰 新闻'}
          </span>
          <span className="text-xs text-gray-500">
            {formatDate(item.created_at || '')}
          </span>
        </div>
      </div>

      {/* 标题 */}
      <h2 className="news-title">
        <a 
          href={item.link} 
          target="_blank" 
          rel="noopener noreferrer"
          className="hover:text-blue-600 transition-colors"
        >
          {item.title}
        </a>
      </h2>

      {/* 摘要 */}
      <p className="news-summary">
        {item.summary}
      </p>

      {/* 音频播放器 */}
      {item.audio_url && (
        <div className="audio-player">
          <div className="flex items-center space-x-3">
            <span className="text-sm font-medium text-gray-700">🎵 音频摘要</span>
          </div>
          <audio 
            controls 
            className="mt-2"
            onPlay={onAudioPlay}
            onPause={onAudioPause}
            preload="metadata"
          >
            <source src={item.audio_url} type="audio/mpeg" />
            您的浏览器不支持音频播放。
          </audio>
        </div>
      )}

      {/* 链接 */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
        <a 
          href={item.link} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
        >
          查看原文 →
        </a>
        {!item.audio_url && (
          <span className="text-xs text-gray-400">音频生成中...</span>
        )}
      </div>
    </div>
  )
}

// 加载骨架屏
function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {[...Array(3)].map((_, index) => (
        <div key={index} className="news-card">
          <div className="flex items-center space-x-2 mb-4">
            <div className="loading-skeleton h-6 w-16"></div>
            <div className="loading-skeleton h-4 w-24"></div>
          </div>
          <div className="loading-skeleton h-6 w-3/4 mb-3"></div>
          <div className="loading-skeleton h-4 w-full mb-2"></div>
          <div className="loading-skeleton h-4 w-2/3 mb-4"></div>
          <div className="loading-skeleton h-10 w-full"></div>
        </div>
      ))}
    </div>
  )
} 