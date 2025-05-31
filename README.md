# LLM Evaluation News Aggregator

自动抓取与"大语言模型评估（LLM Evaluation）"相关的 AI 新闻和论文，生成摘要并转换为音频的 Next.js 应用。

## 功能特性

- 📰 自动抓取 Arxiv 论文和相关新闻
- 📝 使用 DeepSeek API 生成内容摘要
- 🎵 使用 MiniMax TTS 将摘要转换为音频
- 📱 现代化前端界面展示内容
- ⏰ 每日自动更新内容

## 技术栈

- **前端**: Next.js (App Router), React, TypeScript, Tailwind CSS
- **后端**: Vercel Serverless Functions, Cron Jobs
- **数据库**: Supabase
- **存储**: Vercel Blob
- **API**: DeepSeek (摘要), MiniMax (TTS)

## 环境配置

1. 复制环境变量文件：
```bash
cp .env.example .env.local
```

2. 填写以下环境变量：
- `SUPABASE_URL` - Supabase 项目 URL
- `SUPABASE_ANON_KEY` - Supabase 匿名密钥
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase 服务密钥
- `DEEPSEEK_API_KEY` - DeepSeek API 密钥
- `MINIMAX_API_KEY` - MiniMax API 密钥
- `MINIMAX_GROUP_ID` - MiniMax 组 ID
- `BLOB_READ_WRITE_TOKEN` - Vercel Blob 读写令牌

## 安装和运行

```bash
# 安装依赖
npm install

# 运行开发服务器
npm run dev

# 构建项目
npm run build
```

## 部署

项目配置为在 Vercel 上部署，包含自动的 Cron Job 任务。 