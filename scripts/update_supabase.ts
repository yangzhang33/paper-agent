import { supabaseAdmin, NewsItem } from '../lib/supabase'

export interface NewsItemInput {
  title: string
  summary: string
  link: string
  audio_url?: string
  source: 'arxiv' | 'news'
  published_date: string
}

export async function updateSupabaseWithNews(
  newsItems: NewsItemInput[]
): Promise<{ success: number; failed: number }> {
  let success = 0
  let failed = 0
  
  console.log(`开始更新 Supabase 数据库，共 ${newsItems.length} 条记录...`)
  
  for (let i = 0; i < newsItems.length; i++) {
    const item = newsItems[i]
    
    try {
      console.log(`[${i + 1}/${newsItems.length}] 正在插入: ${item.title.substring(0, 30)}...`)
      
      // 检查是否已存在相同链接的记录
      const { data: existing, error: checkError } = await supabaseAdmin
        .from('news_items')
        .select('id')
        .eq('link', item.link)
        .single()
      
      if (checkError && checkError.code !== 'PGRST116') {
        // PGRST116 是 "not found" 错误，这是我们期望的
        console.error('检查重复记录时出错:', checkError.message)
        failed++
        continue
      }
      
      if (existing) {
        console.log(`跳过重复记录: ${item.link}`)
        continue
      }
      
      // 插入新记录
      const { error: insertError } = await supabaseAdmin
        .from('news_items')
        .insert({
          title: item.title,
          summary: item.summary,
          link: item.link,
          audio_url: item.audio_url,
          source: item.source,
          published_date: item.published_date
        })
      
      if (insertError) {
        console.error(`插入记录失败:`, insertError.message)
        failed++
      } else {
        console.log(`✓ 插入成功`)
        success++
      }
      
    } catch (error: any) {
      console.error(`处理记录失败: ${item.title}`, error.message)
      failed++
    }
  }
  
  console.log(`数据库更新完成: 成功 ${success} 条，失败 ${failed} 条`)
  return { success, failed }
}

// 获取最新的新闻条目
export async function getLatestNews(limit: number = 20): Promise<NewsItem[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('news_items')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) {
      console.error('获取最新新闻失败:', error.message)
      return []
    }
    
    return data || []
    
  } catch (error: any) {
    console.error('查询数据库失败:', error.message)
    return []
  }
}

// 获取指定日期范围的新闻
export async function getNewsByDateRange(
  startDate: string,
  endDate: string
): Promise<NewsItem[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('news_items')
      .select('*')
      .gte('published_date', startDate)
      .lte('published_date', endDate)
      .order('published_date', { ascending: false })
    
    if (error) {
      console.error('按日期范围获取新闻失败:', error.message)
      return []
    }
    
    return data || []
    
  } catch (error: any) {
    console.error('查询数据库失败:', error.message)
    return []
  }
}

// 更新新闻条目的音频 URL
export async function updateAudioUrl(
  link: string,
  audioUrl: string
): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from('news_items')
      .update({ audio_url: audioUrl })
      .eq('link', link)
    
    if (error) {
      console.error(`更新音频 URL 失败:`, error.message)
      return false
    }
    
    console.log(`✓ 音频 URL 更新成功: ${link}`)
    return true
    
  } catch (error: any) {
    console.error('更新音频 URL 出错:', error.message)
    return false
  }
}

// 清理旧的新闻记录
export async function cleanupOldNews(daysOld: number = 30): Promise<number> {
  try {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)
    
    const { data, error } = await supabaseAdmin
      .from('news_items')
      .delete()
      .lt('created_at', cutoffDate.toISOString())
      .select('id')
    
    if (error) {
      console.error('清理旧记录失败:', error.message)
      return 0
    }
    
    const deletedCount = data?.length || 0
    console.log(`清理了 ${deletedCount} 条 ${daysOld} 天前的记录`)
    return deletedCount
    
  } catch (error: any) {
    console.error('清理旧记录出错:', error.message)
    return 0
  }
}

// 获取统计信息
export async function getNewsStats(): Promise<{
  total: number
  today: number
  withAudio: number
  bySource: Record<string, number>
}> {
  try {
    const today = new Date().toISOString().split('T')[0]
    
    // 总数
    const { count: total } = await supabaseAdmin
      .from('news_items')
      .select('*', { count: 'exact', head: true })
    
    // 今日新增
    const { count: todayCount } = await supabaseAdmin
      .from('news_items')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today)
    
    // 有音频的数量
    const { count: withAudio } = await supabaseAdmin
      .from('news_items')
      .select('*', { count: 'exact', head: true })
      .not('audio_url', 'is', null)
    
    // 按来源分类
    const { data: sourceData } = await supabaseAdmin
      .from('news_items')
      .select('source')
    
    const bySource: Record<string, number> = {}
    sourceData?.forEach((item: { source: string }) => {
      bySource[item.source] = (bySource[item.source] || 0) + 1
    })
    
    return {
      total: total || 0,
      today: todayCount || 0,
      withAudio: withAudio || 0,
      bySource
    }
    
  } catch (error: any) {
    console.error('获取统计信息失败:', error.message)
    return { total: 0, today: 0, withAudio: 0, bySource: {} }
  }
} 