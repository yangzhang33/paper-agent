import { put } from '@vercel/blob'

export interface BlobUploadResult {
  url: string
  pathname: string
}

export async function uploadAudioToBlob(
  audioBuffer: Buffer,
  filename: string
): Promise<BlobUploadResult> {
  try {
    console.log(`正在上传音频文件: ${filename}`)
    
    // 确保文件名是唯一的
    const timestamp = Date.now()
    const uniqueFilename = `audio/${timestamp}-${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    
    // 上传到 Vercel Blob
    const blob = await put(uniqueFilename, audioBuffer, {
      access: 'public',
      addRandomSuffix: false,
      contentType: 'audio/mpeg'
    })
    
    console.log(`✓ 音频上传成功: ${blob.url}`)
    
    return {
      url: blob.url,
      pathname: blob.pathname
    }
    
  } catch (error: any) {
    console.error(`音频上传失败: ${filename}`, error.message)
    throw new Error(`Blob 上传失败: ${error.message}`)
  }
}

// 批量上传音频文件
export async function batchUploadAudio(
  audioFiles: Array<{ buffer: Buffer; filename: string; id: string }>
): Promise<Array<BlobUploadResult & { id: string }>> {
  const results: Array<BlobUploadResult & { id: string }> = []
  
  console.log(`开始批量上传 ${audioFiles.length} 个音频文件...`)
  
  for (let i = 0; i < audioFiles.length; i++) {
    const { buffer, filename, id } = audioFiles[i]
    
    try {
      const result = await uploadAudioToBlob(buffer, filename)
      results.push({ ...result, id })
      
      console.log(`[${i + 1}/${audioFiles.length}] 上传成功: ${filename}`)
      
      // 添加延迟以避免过快的上传
      if (i < audioFiles.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
      
    } catch (error: any) {
      console.error(`文件上传失败: ${filename}`, error.message)
      // 继续处理下一个文件
    }
  }
  
  console.log(`批量上传完成，成功上传 ${results.length}/${audioFiles.length} 个文件`)
  return results
}

// 清理旧的音频文件（可选功能）
export async function cleanupOldAudioFiles(daysOld: number = 30): Promise<void> {
  try {
    // 这里需要使用 Vercel Blob 的 list 和 delete API
    // 目前 @vercel/blob 可能还没有提供完整的管理 API
    // 这是一个占位符实现
    
    console.log(`清理 ${daysOld} 天前的音频文件...`)
    
    // TODO: 实现清理逻辑
    // 1. 列出所有 blob 文件
    // 2. 检查文件的创建时间
    // 3. 删除过期的文件
    
    console.log('清理功能待实现')
    
  } catch (error: any) {
    console.error('清理旧文件失败:', error.message)
  }
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

// 验证音频文件
export function validateAudioBuffer(buffer: Buffer): boolean {
  if (!buffer || buffer.length === 0) {
    return false
  }
  
  // 检查是否是有效的音频文件（简单的格式检查）
  // MP3 文件通常以 ID3 标签或帧同步开始
  const header = buffer.slice(0, 4)
  
  // 检查 MP3 同步字节
  if (header[0] === 0xFF && (header[1] & 0xE0) === 0xE0) {
    return true
  }
  
  // 检查 ID3 标签
  if (header.toString('ascii', 0, 3) === 'ID3') {
    return true
  }
  
  // 如果都不匹配，假设是有效的（因为可能有其他格式）
  return buffer.length > 1000 // 至少 1KB
} 