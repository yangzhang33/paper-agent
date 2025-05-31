import axios from 'axios'

interface NewsEntry {
  title: string
  summary: string
  link: string
  published: string
  source: string
}

// 新闻源配置
const NEWS_SOURCES = [
  {
    name: 'Hugging Face Blog',
    baseUrl: 'https://huggingface.co',
    feedUrl: 'https://huggingface.co/blog.rss'
  },
  {
    name: 'The Decoder',
    baseUrl: 'https://the-decoder.com',
    feedUrl: 'https://the-decoder.com/feed/'
  }
]

// LLM 评估相关关键词
// const RELEVANT_KEYWORDS = [
//   'llm evaluation', 'language model evaluation', 'benchmark', 'assessment',
//   'nlp evaluation', 'ai evaluation', 'model performance', 'conversational ai',
//   'chatbot evaluation', 'text generation evaluation', 'language model benchmark',
//   'ai model testing', 'llm assessment', 'evaluation metrics'
// ]
const RELEVANT_KEYWORDS = [
  'llm evaluation',
  'language model evaluation',
  'benchmark',
  'benchmarked',
  'evaluation metrics',
  'performance metrics',
  'model assessment',
  'tested',
  'model accuracy',
  'model performance',
  'comparison of models',
  'leaderboard',
  'open llm leaderboard',
  'model ranking',
  'chatbot evaluation',
  'conversational ai',
  'generation quality',
  'factual consistency',
  'hallucination',
  'prompt evaluation',
  'output diversity',
  'synthetic text',
  'robustness test',
  'alignment evaluation',
  'zero-shot evaluation',
  'multilingual performance',
  'model fine-tuning evaluation',
  'real-world performance',
  'ai evaluation'
]


export async function fetchNews(maxResults: number = 5): Promise<NewsEntry[]> {
  const allNews: NewsEntry[] = []
  
  for (const source of NEWS_SOURCES) {
    try {
      console.log(`正在抓取 ${source.name} 新闻...`)
      
      // 模拟从 RSS 或 API 获取新闻
      // 实际实现时需要根据具体的新闻源 API 来调整
      const news = await fetchFromSource(source)
      allNews.push(...news)
      
    } catch (error: any) {
      console.error(`从 ${source.name} 抓取新闻失败:`, error.message)
      // 继续处理其他新闻源
    }
  }
  
  // 过滤相关新闻
  const relevantNews = filterRelevantNews(allNews)
  
  // 按发布时间排序并限制数量
  return relevantNews
    .sort((a, b) => new Date(b.published).getTime() - new Date(a.published).getTime())
    .slice(0, maxResults)
}

async function fetchFromSource(source: any): Promise<NewsEntry[]> {
  try {
    // 这里是一个简化的实现
    // 实际中需要根据不同新闻源的 API 格式来解析
    
    // 示例：如果是 RSS feed
    if (source.feedUrl.includes('rss') || source.feedUrl.includes('feed')) {
      return await fetchRSSFeed(source)
    }
    
    // 示例：如果是 JSON API
    return await fetchJSONAPI(source)
    
  } catch (error) {
    throw new Error(`无法从 ${source.name} 获取数据`)
  }
}

async function fetchRSSFeed(source: any): Promise<NewsEntry[]> {
  // 这里应该使用 RSS 解析器
  // 由于简化实现，这里返回模拟数据
  console.log(`模拟从 ${source.name} RSS 获取数据`)
  
  // 实际实现应该：
  // 1. 使用 rss-parser 或类似库解析 RSS
  // 2. 提取标题、描述、链接、发布日期
  // 3. 返回格式化的新闻条目
  
  return []
}

async function fetchJSONAPI(source: any): Promise<NewsEntry[]> {
  // 这里是通用的 JSON API 抓取逻辑
  // 需要根据具体的 API 响应格式来调整
  
  try {
    const response = await axios.get(source.feedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LLM-News-Bot/1.0)'
      },
      timeout: 10000
    })
    
    // 这里需要根据实际的 API 响应格式来解析
    // 以下是示例解析逻辑
    const data = response.data
    
    if (!data || !Array.isArray(data.articles)) {
      return []
    }
    
    return data.articles.map((article: any) => ({
      title: article.title || 'Untitled',
      summary: article.description || article.content || '',
      link: article.url || article.link || '',
      published: article.publishedAt || article.date || new Date().toISOString(),
      source: source.name
    }))
    
  } catch (error: any) {
    console.error(`API 请求失败:`, error.message)
    return []
  }
}

export function filterRelevantNews(news: NewsEntry[]): NewsEntry[] {
  return news.filter(item => {
    const text = `${item.title} ${item.summary}`.toLowerCase()
    
    // 检查是否包含相关关键词
    const isRelevant = RELEVANT_KEYWORDS.some(keyword => 
      text.includes(keyword.toLowerCase())
    )
    
    return isRelevant
  })
}

// 手动添加重要新闻源的函数（备用方案）
export async function fetchManualNews(): Promise<NewsEntry[]> {
  // 这里可以手动配置一些重要的新闻
  // 作为自动抓取的补充
  const manualNews: NewsEntry[] = [
    // 可以手动添加一些重要的新闻链接
  ]
  
  return manualNews.filter(item => item.title && item.link)
} 