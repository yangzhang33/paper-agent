import axios from 'axios'

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions'

export interface SummarizeOptions {
  content: string
  title: string
  maxLength?: number
}

export async function summarizeContent(options: SummarizeOptions): Promise<string> {
  const { content, title, maxLength = 5 } = options
  
  try {
    const response = await axios.post(
      DEEPSEEK_API_URL,
      {
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: `你是一个专业的AI研究摘要生成器。请将给定的内容总结为${maxLength}句话以内的中文摘要，重点关注：
1. 核心研究内容和创新点
2. 主要技术方法
3. 重要发现或结论
4. 对LLM评估领域的意义

请保持摘要简洁、准确且易于理解。`
          },
          {
            role: 'user',
            content: `请为以下内容生成摘要：

标题：${title}

内容：${content}

请生成一个简洁的中文摘要。`
          }
        ],
        max_tokens: 500,
        temperature: 0.3
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    )

    const summary = response.data.choices[0]?.message?.content?.trim()
    
    if (!summary) {
      throw new Error('DeepSeek API 返回空摘要')
    }

    return summary
  } catch (error) {
    console.error('DeepSeek API 调用失败:', error)
    
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.error?.message || error.message
      throw new Error(`DeepSeek API 错误: ${errorMessage}`)
    }
    
    throw new Error('摘要生成失败')
  }
} 