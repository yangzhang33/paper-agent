import { getNewsStats } from '../../../scripts/update_supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const stats = await getNewsStats()
    
    return NextResponse.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('获取统计信息失败:', error)
    
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