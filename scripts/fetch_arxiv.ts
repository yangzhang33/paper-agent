import axios from 'axios'
import * as xml2js from 'xml2js'

interface ArxivEntry {
  title: string
  summary: string
  link: string
  published: string
  authors: string[]
}

const ARXIV_API_URL = 'http://export.arxiv.org/api/query'

// LLM 评估相关的搜索关键词
// const SEARCH_TERMS = [
//   'LLM evaluation',
//   'large language model evaluation',
//   'language model benchmarking',
//   'LLM assessment',
//   'natural language processing evaluation',
//   'conversational AI evaluation',
//   'chatbot evaluation',
//   'text generation evaluation'
// ]

const SEARCH_TERMS = [
  'language model evaluation',
  'linguistic diversity LLM',
  'synthetic text training LLM',
  'iterative generation degradation',
  'broken telephone language model',
  'long-term LLM robustness',
  'hallucination detection LLM',
  'reasoning faithfulness evaluation',
  'LLM information distortion',
  'language model calibration',
  'out-of-distribution LLM evaluation',
  'semantic diversity language model',
  'bias and ethics in LLMs',
  'LLM temporal generalization',
  'alignment drift in language models',
  'continual finetuning evaluation',
  'language model memory forgetting',
  'multilingual consistency evaluation'
]

export async function fetchArxivPapers(maxResults: number = 10): Promise<ArxivEntry[]> {
  try {
    // 构建搜索查询
    const searchQuery = SEARCH_TERMS.map(term => `all:"${term}"`).join(' OR ')
    
    const params = {
      search_query: searchQuery,
      start: 0,
      max_results: maxResults,
      sortBy: 'submittedDate',
      sortOrder: 'descending'
    }

    console.log('正在抓取 Arxiv 论文...')
    
    const response = await axios.get(ARXIV_API_URL, { params })
    
    if (response.status !== 200) {
      throw new Error(`Arxiv API 响应错误: ${response.status}`)
    }

    // 解析 XML 响应
    const parser = new xml2js.Parser({
      explicitArray: false,
      mergeAttrs: true,
      trim: true
    })

    const result = await parser.parseStringPromise(response.data)
    
    if (!result.feed || !result.feed.entry) {
      console.log('未找到相关论文')
      return []
    }

    // 确保 entry 是数组
    const entries = Array.isArray(result.feed.entry) 
      ? result.feed.entry 
      : [result.feed.entry]

    const papers: ArxivEntry[] = entries.map((entry: any) => {
      // 提取作者信息
      let authors: string[] = []
      if (entry.author) {
        if (Array.isArray(entry.author)) {
          authors = entry.author.map((author: any) => author.name || author)
        } else {
          authors = [entry.author.name || entry.author]
        }
      }

      // 提取链接（使用 PDF 链接优先）
      let link = entry.id || ''
      if (entry.link) {
        if (Array.isArray(entry.link)) {
          const pdfLink = entry.link.find((l: any) => l.type === 'application/pdf')
          link = pdfLink?.href || entry.link[0]?.href || entry.id
        } else {
          link = entry.link.href || entry.link
        }
      }

      return {
        title: entry.title?.replace(/\s+/g, ' ').trim() || 'Untitled',
        summary: entry.summary?.replace(/\s+/g, ' ').trim() || '',
        link: link,
        published: entry.published || entry.updated || new Date().toISOString(),
        authors: authors
      }
    })

    console.log(`成功抓取 ${papers.length} 篇 Arxiv 论文`)
    return papers

  } catch (error: any) {
    console.error('抓取 Arxiv 论文失败:', error.message)
    throw new Error(`Arxiv 抓取失败: ${error.message}`)
  }
}

// 过滤与 LLM 评估高度相关的论文
export function filterRelevantPapers(papers: ArxivEntry[]): ArxivEntry[] {
  // const relevantKeywords = [
  //   'evaluation', 'benchmark', 'assessment', 'metric', 'performance',
  //   'llm', 'language model', 'gpt', 'bert', 'transformer',
  //   'nlp', 'natural language', 'conversational', 'dialogue',
  //   'chatbot', 'question answering', 'text generation'
  // ]

  const relevantKeywords = [
    'llm', 'language model', 'large language model', 'transformer',
    'evaluation', 'assessment', 'benchmark', 'comparison',
    'linguistic diversity', 'lexical diversity', 'syntactic diversity', 'semantic diversity',
    'synthetic text', 'iterative generation', 'generation degradation',
    'hallucination', 'faithfulness', 'factual consistency',
    'alignment', 'bias', 'robustness', 'generalization', 'calibration',
    'memory', 'forgetting', 'multilingual', 'consistency',
    'style transfer', 'reasoning', 'long-term', 'recursive',
    'broken telephone', 'semantic drift', 'prompt robustness'
  ]
  

  return papers.filter(paper => {
    const text = `${paper.title} ${paper.summary}`.toLowerCase()
    const relevanceScore = relevantKeywords.reduce((score, keyword) => {
      return score + (text.includes(keyword) ? 1 : 0)
    }, 0)
    
    // 至少包含 2 个相关关键词
    return relevanceScore >= 2
  })
} 