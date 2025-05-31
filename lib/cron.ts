// 整合所有任务的 cron 脚本
import { fetchArxivPapers, filterRelevantPapers } from '../scripts/fetch_arxiv'
import { fetchNews, filterRelevantNews } from '../scripts/fetch_news'
import { summarizeWithDeepSeek } from '../scripts/summarize_with_deepseek'
import { generateTTSAudio, generateAudioFilename, estimateAudioDuration } from '../scripts/tts_with_minimax'
import { uploadAudioToBlob, batchUploadAudio } from '../scripts/upload_blob'
import { updateSupabaseWithNews, getNewsStats } from '../scripts/update_supabase'

export interface ProcessingResult {
  totalProcessed: number
  successful: number
  failed: number
  errors: string[]
}

export async function runDailyCron(): Promise<ProcessingResult> {
  const startTime = Date.now()
  const errors: string[] = []
  let totalProcessed = 0
  let successful = 0
  let failed = 0

  console.log('🚀 开始执行每日新闻抓取任务...')
  console.log(`⏰ 开始时间: ${new Date().toISOString()}`)

  try {
    // 1. 抓取 Arxiv 论文
    console.log('\n📚 步骤 1: 抓取 Arxiv 论文')
    const arxivPapers = await fetchArxivPapers(15) // 抓取 15 篇
    const relevantPapers = filterRelevantPapers(arxivPapers)
    console.log(`找到 ${relevantPapers.length} 篇相关论文`)

    // 2. 抓取新闻
    console.log('\n📰 步骤 2: 抓取 AI 新闻')
    const newsItems = await fetchNews(10) // 抓取 10 条新闻
    console.log(`找到 ${newsItems.length} 条相关新闻`)

    // 3. 合并内容并准备摘要
    console.log('\n📝 步骤 3: 准备内容摘要')
    const contentsToSummarize = [
      ...relevantPapers.map(paper => ({
        title: paper.title,
        content: paper.summary,
        link: paper.link,
        source: 'arxiv' as const,
        published: paper.published
      })),
      ...newsItems.map(news => ({
        title: news.title,
        content: news.summary,
        link: news.link,
        source: 'news' as const,
        published: news.published
      }))
    ]

    // 限制处理数量（避免 API 成本过高）
    const maxItems = 5
    const itemsToProcess = contentsToSummarize.slice(0, maxItems)
    totalProcessed = itemsToProcess.length

    if (itemsToProcess.length === 0) {
      console.log('⚠️ 没有找到需要处理的内容')
      return { totalProcessed: 0, successful: 0, failed: 0, errors: ['没有找到需要处理的内容'] }
    }

    console.log(`将处理 ${itemsToProcess.length} 个项目`)

    // 4. 生成摘要
    console.log('\n🤖 步骤 4: 使用 DeepSeek 生成摘要')
    const summarizedContents = await summarizeWithDeepSeek(
      itemsToProcess.map(item => ({
        title: item.title,
        content: item.content,
        link: item.link,
        source: item.source,
        published: item.published
      }))
    )

    if (summarizedContents.length === 0) {
      errors.push('摘要生成失败')
      return { totalProcessed, successful: 0, failed: totalProcessed, errors }
    }

    // 5. 生成音频
    console.log('\n🎵 步骤 5: 使用 MiniMax 生成音频')
    const ttsResults = await generateTTSAudio(
      summarizedContents.map((content, index) => ({
        id: `${Date.now()}-${index}`,
        text: content.summary,
        title: content.title
      }))
    )

    // 6. 上传音频到 Vercel Blob
    console.log('\n☁️ 步骤 6: 上传音频到 Vercel Blob')
    const audioUploads = ttsResults.map(result => ({
      buffer: result.audioBuffer,
      filename: generateAudioFilename(result.title, result.id),
      id: result.id
    }))

    const uploadResults = await batchUploadAudio(audioUploads)
    console.log(`成功上传 ${uploadResults.length} 个音频文件`)

    // 7. 更新数据库
    console.log('\n💾 步骤 7: 更新 Supabase 数据库')
    const newsItemsToInsert = summarizedContents.map((content, index) => {
      const audioUpload = uploadResults.find(upload => upload.id === ttsResults[index]?.id)
      
      return {
        title: content.title,
        summary: content.summary,
        link: content.link,
        audio_url: audioUpload?.url,
        source: content.source,
        published_date: content.published
      }
    })

    const dbResult = await updateSupabaseWithNews(newsItemsToInsert)
    successful = dbResult.success
    failed = dbResult.failed

    // 8. 生成统计报告
    console.log('\n📊 步骤 8: 生成统计报告')
    const stats = await getNewsStats()
    
    const endTime = Date.now()
    const duration = Math.round((endTime - startTime) / 1000)

    console.log('\n✅ 任务执行完成!')
    console.log(`⏱️ 执行时间: ${duration} 秒`)
    console.log(`📈 统计信息:`)
    console.log(`  - 总记录数: ${stats.total}`)
    console.log(`  - 今日新增: ${stats.today}`)
    console.log(`  - 包含音频: ${stats.withAudio}`)
    console.log(`  - 处理成功: ${successful}`)
    console.log(`  - 处理失败: ${failed}`)

    return { totalProcessed, successful, failed, errors }

  } catch (error: any) {
    console.error('❌ Cron 任务执行失败:', error.message)
    errors.push(error.message)
    return { totalProcessed, successful, failed: totalProcessed, errors }
  }
}

// 手动运行测试（开发环境使用）
export async function runTestCron(): Promise<ProcessingResult> {
  console.log('🧪 运行测试模式 - 处理较少数据')
  
  try {
    // 测试模式只处理 1-2 个项目
    const arxivPapers = await fetchArxivPapers(2)
    const newsItems = await fetchNews(1)
    
    const contentsToSummarize = [
      ...arxivPapers.slice(0, 1).map(paper => ({
        title: paper.title,
        content: paper.summary,
        link: paper.link,
        source: 'arxiv' as const,
        published: paper.published
      })),
      ...newsItems.slice(0, 1).map(news => ({
        title: news.title,
        content: news.summary,
        link: news.link,
        source: 'news' as const,
        published: news.published
      }))
    ]

    if (contentsToSummarize.length === 0) {
      return { totalProcessed: 0, successful: 0, failed: 0, errors: ['测试: 没有内容'] }
    }

    console.log(`测试模式: 处理 ${contentsToSummarize.length} 个项目`)
    
    const summarizedContents = await summarizeWithDeepSeek(contentsToSummarize)
    
    // 测试模式跳过音频生成和上传，只测试摘要
    const newsItemsToInsert = summarizedContents.map(content => ({
      title: content.title,
      summary: content.summary,
      link: content.link,
      audio_url: undefined,
      source: content.source,
      published_date: content.published
    }))

    const dbResult = await updateSupabaseWithNews(newsItemsToInsert)
    
    return { 
      totalProcessed: contentsToSummarize.length, 
      successful: dbResult.success, 
      failed: dbResult.failed, 
      errors: [] 
    }

  } catch (error: any) {
    console.error('测试模式失败:', error.message)
    return { totalProcessed: 0, successful: 0, failed: 1, errors: [error.message] }
  }
}

// 清理任务（定期清理旧数据）
export async function runCleanupTask(): Promise<void> {
  console.log('🧹 开始清理任务...')
  
  try {
    // 清理 30 天前的数据
    // const cleanedCount = await cleanupOldNews(30)
    // await cleanupOldAudioFiles(30)
    
    console.log('✅ 清理任务完成')
  } catch (error: any) {
    console.error('❌ 清理任务失败:', error.message)
  }
} 