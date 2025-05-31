import { generateAudio } from '../lib/minimax_tts'

export interface TTSTask {
  id: string
  text: string
  title: string
}

export interface TTSResult extends TTSTask {
  audioBuffer: Buffer
  duration?: number
}

export async function generateTTSAudio(tasks: TTSTask[]): Promise<TTSResult[]> {
  const results: TTSResult[] = []
  
  console.log(`开始为 ${tasks.length} 个项目生成音频...`)
  
  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i]
    
    try {
      console.log(`[${i + 1}/${tasks.length}] 正在生成音频: ${task.title.substring(0, 30)}...`)
      
      // 预处理文本，确保 TTS 效果更好
      const processedText = preprocessTextForTTS(task.text)
      
      // 生成音频
      const audioBuffer = await generateAudio({
        text: processedText,
        voice_id: 'female-tianmei-jingpin', // 使用甜美女声
        speed: 1.0,
        vol: 1.0
      })
      
      results.push({
        ...task,
        audioBuffer
      })
      
      console.log(`✓ 音频生成成功，大小: ${audioBuffer.length} bytes`)
      
      // 添加延迟以避免 API 限流
      if (i < tasks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
      
    } catch (error: any) {
      console.error(`音频生成失败: ${task.title}`, error.message)
      
      // 如果生成失败，可以尝试生成一个简化版本
      try {
        console.log('尝试生成简化版本...')
        const simplifiedText = simplifyTextForTTS(task.text)
        const audioBuffer = await generateAudio({
          text: simplifiedText,
          voice_id: 'female-tianmei-jingpin',
          speed: 1.1, // 稍微快一点
          vol: 1.0
        })
        
        results.push({
          ...task,
          audioBuffer
        })
        
        console.log(`✓ 简化版音频生成成功`)
        
      } catch (fallbackError: any) {
        console.error(`简化版音频也生成失败:`, fallbackError.message)
        // 跳过这个任务，继续处理下一个
      }
    }
  }
  
  console.log(`音频生成完成，成功处理 ${results.length}/${tasks.length} 个项目`)
  return results
}

// 预处理文本以优化 TTS 效果
function preprocessTextForTTS(text: string): string {
  let processedText = text
  
  // 移除特殊字符和格式化标记
  processedText = processedText
    .replace(/[""'']/g, '"') // 统一引号
    .replace(/[–—]/g, '-') // 统一破折号
    .replace(/\s+/g, ' ') // 合并多个空格
    .trim()
  
  // 添加停顿标记以提高朗读效果
  processedText = processedText
    .replace(/([。！？])/g, '$1，') // 在句号后添加短暂停顿
    .replace(/([；;])/g, '$1，') // 在分号后添加停顿
    .replace(/，，/g, '，') // 移除重复的停顿标记
  
  // 限制文本长度（TTS API 通常有长度限制）
  if (processedText.length > 1000) {
    processedText = processedText.substring(0, 997) + '...'
  }
  
  return processedText
}

// 简化文本以避免 TTS 失败
function simplifyTextForTTS(text: string): string {
  let simplified = text
  
  // 移除复杂的符号和格式
  simplified = simplified
    .replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s.,!?;:，。！？；：]/g, '') // 只保留基本字符
    .replace(/\s+/g, ' ')
    .trim()
  
  // 进一步缩短文本
  const sentences = simplified.split(/[.!?。！？]/).filter(s => s.trim().length > 5)
  
  if (sentences.length > 2) {
    simplified = sentences.slice(0, 2).join('。') + '。'
  }
  
  // 确保不超过 500 字符
  if (simplified.length > 500) {
    simplified = simplified.substring(0, 497) + '...'
  }
  
  return simplified || '内容摘要'
}

// 批量处理音频生成
export async function batchGenerateTTS(
  tasks: TTSTask[],
  batchSize: number = 2
): Promise<TTSResult[]> {
  const results: TTSResult[] = []
  
  for (let i = 0; i < tasks.length; i += batchSize) {
    const batch = tasks.slice(i, i + batchSize)
    console.log(`处理音频批次 ${Math.floor(i / batchSize) + 1}/${Math.ceil(tasks.length / batchSize)}`)
    
    const batchResults = await generateTTSAudio(batch)
    results.push(...batchResults)
    
    // 批次之间的延迟
    if (i + batchSize < tasks.length) {
      console.log('等待 3 秒后处理下一批次...')
      await new Promise(resolve => setTimeout(resolve, 3000))
    }
  }
  
  return results
}

// 估算音频时长（用于显示）
export function estimateAudioDuration(text: string): number {
  // 根据文本长度估算音频时长
  // 假设中文朗读速度约为 4-5 字/秒
  const charCount = text.length
  const estimatedSeconds = Math.ceil(charCount / 4.5)
  return Math.max(estimatedSeconds, 5) // 最少 5 秒
}

// 生成音频文件名
export function generateAudioFilename(title: string, id: string): string {
  // 清理标题以生成安全的文件名
  const cleanTitle = title
    .replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g, '') // 移除特殊字符
    .replace(/\s+/g, '_') // 空格替换为下划线
    .substring(0, 30) // 限制长度
  
  return `${cleanTitle}_${id}.mp3`
} 