import { createClient } from '@supabase/supabase-js'

// 客户端可访问的环境变量（使用 NEXT_PUBLIC_ 前缀）
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'placeholder-key'

// 服务端专用的环境变量（不需要 NEXT_PUBLIC_ 前缀）
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-key'

// 客户端用的 Supabase 实例（使用 anon key）
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 服务端用的 Supabase 实例（具有更高权限，使用 service role key）
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

// 数据库表结构类型定义
export interface NewsItem {
  id?: number
  title: string
  summary: string
  link: string
  audio_url?: string
  source: 'arxiv' | 'news'
  created_at?: string
  published_date: string
}

// 创建数据表的 SQL（在 Supabase 控制台中执行）
export const createTableSQL = `
CREATE TABLE IF NOT EXISTS news_items (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  link TEXT NOT NULL UNIQUE,
  audio_url TEXT,
  source TEXT NOT NULL CHECK (source IN ('arxiv', 'news')),
  published_date TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 创建索引以优化查询性能
CREATE INDEX IF NOT EXISTS idx_news_items_created_at ON news_items(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_items_source ON news_items(source);
` 