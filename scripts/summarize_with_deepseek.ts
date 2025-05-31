import { summarizeContent } from '../lib/deepseek_api'

export interface ContentToSummarize {
  title: string
  content: string
  link: string
  source: 'arxiv' | 'news'
  published: string
}

export interface SummarizedContent extends ContentToSummarize {
  summary: string
}

export async function summarizeWithDeepSeek(
  contents: ContentToSummarize[]
): Promise<SummarizedContent[]> {
  const summarized: SummarizedContent[] = []
  
  console.log(`开始对 ${contents.length} 个内容项生成摘要...`)
  
  for (let index = 0; index < contents.length; index++) {
    const content = contents[index]
    
    try {
      console.log(`[${index + 1}/${contents.length}] 正在生成摘要: ${content.title.substring(0, 50)}...`)
      
      // 调用 DeepSeek API 生成摘要
      const summary = await summarizeContent({
        content: content.content,
        title: content.title,
        maxLength: content.source === 'arxiv' ? 5 : 3 // 论文摘要稍长一些
      })
      
      summarized.push({
        ...content,
        summary
      })
      
      console.log(`✓ 摘要生成成功`)
      
      // 添加延迟以避免 API 限流
      if (index < contents.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
      
    } catch (error: any) {
      console.error(`摘要生成失败: ${content.title}`, error.message)
      
      // 如果摘要生成失败，使用原始内容的前几句作为备用摘要
      const fallbackSummary = generateFallbackSummary(content.content, content.source)
      
      summarized.push({
        ...content,
        summary: fallbackSummary
      })
    }
  }
  
  console.log(`摘要生成完成，成功处理 ${summarized.length} 个项目`)
  return summarized
}

// 备用摘要生成（如果 API 失败）
function generateFallbackSummary(content: string, source: 'arxiv' | 'news'): string {
  if (!content) {
    return '暂无摘要'
  }
  
  // 清理文本
  const cleanContent = content
    .replace(/\s+/g, ' ')
    .replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s.,!?;:]/g, '')
    .trim()
  
  // 按句子分割
  const sentences = cleanContent
    .split(/[.!?。！？]/)
    .map(s => s.trim())
    .filter(s => s.length > 10)
  
  if (sentences.length === 0) {
    return '内容摘要暂不可用'
  }
  
  // 根据内容源选择摘要长度
  const maxSentences = source === 'arxiv' ? 3 : 2
  const selectedSentences = sentences.slice(0, maxSentences)
  
  let summary = selectedSentences.join('。') + '。'
  
  // 限制摘要长度
  if (summary.length > 200) {
    summary = summary.substring(0, 197) + '...'
  }
  
  return summary
}

// 批量处理大量内容的函数
export async function batchSummarize(
  contents: ContentToSummarize[],
  batchSize: number = 3
): Promise<SummarizedContent[]> {
  const results: SummarizedContent[] = []
  
  for (let i = 0; i < contents.length; i += batchSize) {
    const batch = contents.slice(i, i + batchSize)
    console.log(`处理批次 ${Math.floor(i / batchSize) + 1}/${Math.ceil(contents.length / batchSize)}`)
    
    const batchResults = await summarizeWithDeepSeek(batch)
    results.push(...batchResults)
    
    // 批次之间的延迟
    if (i + batchSize < contents.length) {
      console.log('等待 2 秒后处理下一批次...')
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
  }
  
  return results
} 