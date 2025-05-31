import { runDailyCron, runTestCron } from '../../../lib/cron'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // 验证请求来源（Vercel Cron 会发送特定的 header）
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 检查是否是测试模式
    const { searchParams } = new URL(request.url)
    const isTest = searchParams.get('test') === 'true'

    console.log(`🚀 开始执行 ${isTest ? '测试' : '生产'} Cron 任务`)
    
    const result = isTest ? await runTestCron() : await runDailyCron()
    
    console.log('Cron 任务执行结果:', result)

    return NextResponse.json({
      success: true,
      mode: isTest ? 'test' : 'production',
      result: result,
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('Cron API 错误:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// 允许 GET 请求用于手动触发（仅在开发环境）
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'GET method only available in development' },
      { status: 403 }
    )
  }

  try {
    console.log('🧪 开发模式: 手动触发测试 Cron 任务')
    
    const result = await runTestCron()
    
    return NextResponse.json({
      success: true,
      mode: 'development-test',
      result: result,
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('开发模式 Cron 错误:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
} 