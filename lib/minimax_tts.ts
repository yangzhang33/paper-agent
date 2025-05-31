import axios from 'axios'

const MINIMAX_TTS_URL = 'https://api.minimax.chat/v1/t2a_v2'

export interface TTSOptions {
  text: string
  voice_id?: string
  speed?: number
  vol?: number
}

export async function generateAudio(options: TTSOptions): Promise<Buffer> {
  const { text, voice_id = 'female-tianmei-jingpin', speed = 1.0, vol = 1.0 } = options
  
  try {
    const response = await axios.post(
      MINIMAX_TTS_URL,
      {
        text,
        voice_id,
        speed,
        vol,
        audio_format: 'mp3',
        bitrate: 128000
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.MINIMAX_API_KEY}`,
          'Content-Type': 'application/json'
        },
        responseType: 'arraybuffer'
      }
    )

    if (response.status !== 200) {
      throw new Error(`MiniMax API 响应错误: ${response.status}`)
    }

    return Buffer.from(response.data)
  } catch (error: any) {
    console.error('MiniMax TTS API 调用失败:', error)
    
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.error?.message || error.message
      throw new Error(`MiniMax TTS 错误: ${errorMessage}`)
    }
    
    throw new Error('音频生成失败')
  }
}

// 备用的 TTS 实现（如果 MiniMax 不可用）
export async function generateAudioFallback(text: string): Promise<Buffer> {
  // 这里可以实现备用的 TTS 服务
  // 例如使用其他 TTS API 或本地 TTS
  throw new Error('备用 TTS 服务未实现')
} 