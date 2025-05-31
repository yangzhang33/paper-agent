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
            content: `你是一个专业的人工智能研究助理，擅长为科研文章撰写高质量的中文摘要。

你的任务是基于用户提供的论文标题和内容，生成一段 **不超过 ${maxLength} 句话的中文摘要**，要求表达清晰、准确、简洁，适合AI/NLP研究人员快速理解该研究的核心价值。

请确保摘要覆盖以下四个重点内容：
1. **研究问题与核心创新点**：该研究试图解决什么问题？与现有工作的主要区别是什么？
2. **主要技术方法**：使用了哪些模型、算法或实验设置？
3. **关键发现或结论**：最重要的实验结果或分析洞察。
4. **对LLM评估或NLP领域的意义**：该研究如何推进了该领域的发展？

请使用简洁客观的语言撰写摘要，避免冗余和主观评价，确保信息结构清晰，适合科研平台展示使用。`
          },
          {
            role: 'user',
            content: `请为以下论文内容生成摘要：

标题：${title}

正文内容如下：
${content}

请根据上述要求，生成一段高质量的中文摘要。`
          }
        ],
        max_tokens: 600,
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