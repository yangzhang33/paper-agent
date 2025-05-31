import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'placeholder-key'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-key'

// 客户端用的 Supabase 实例
export const supabase = createClient(supabaseUrl, supabaseKey)

// 服务端用的 Supabase 实例（具有更高权限）
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