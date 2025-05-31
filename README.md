# LLM Evaluation News Aggregator

自动抓取与"大语言模型评估（LLM Evaluation）"相关的 AI 新闻和论文，生成摘要并转换为音频的 Next.js 应用。

## 功能特性

- 📚 自动抓取 Arxiv 论文和相关新闻
- 🤖 使用 DeepSeek API 生成专业学术级中文摘要
- 🎵 使用 MiniMax TTS 将摘要转换为中文音频
- 📱 现代化前端界面展示内容
- ⏰ 每日自动更新内容
- 🔒 安全的 Cron 任务保护机制

## 技术栈

- **前端**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **后端**: Vercel Serverless Functions, Cron Jobs
- **数据库**: Supabase (PostgreSQL)
- **存储**: Vercel Blob
- **AI 服务**: DeepSeek (摘要), MiniMax (TTS)

## 🔐 安全配置

### 生成的 CRON_SECRET

为了保护 Cron API 端点，已为你的项目生成了安全密钥：

```
CRON_SECRET=4160f336b4a39e522355f82fb12e6c788ce30c4409120c123b0fa5634096077b
```

> **重要**: 这是一个 64 位十六进制安全密钥，请妥善保管并在所有环境中正确配置。

## 环境配置

### 1. 创建环境变量文件

复制以下内容到 `.env.local` 文件：

```bash
# Supabase 配置（客户端）
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Supabase 配置（服务端）
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key

# AI API 配置
DEEPSEEK_API_KEY=your_deepseek_api_key
MINIMAX_API_KEY=your_minimax_api_key
MINIMAX_GROUP_ID=your_minimax_group_id

# Vercel Blob 存储
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token

# 安全配置（已生成）
CRON_SECRET=4160f336b4a39e522355f82fb12e6c788ce30c4409120c123b0fa5634096077b
```

### 2. 获取 API 密钥

| 服务 | 获取地址 | 说明 |
|------|----------|------|
| Supabase | https://supabase.com | 创建项目，获取 URL 和 API 密钥 |
| DeepSeek | https://platform.deepseek.com | 注册并创建 API 密钥 |
| MiniMax | https://api.minimax.chat | 获取 TTS API 密钥和群组 ID |
| Vercel Blob | Vercel 项目设置 | 启用 Blob 存储并生成令牌 |

## 安装和运行

```bash
# 克隆项目
git clone <your-repo-url>
cd paper_agent

# 安装依赖
npm install

# 创建并配置 .env.local 文件（参考上面的配置）
cp .env.example .env.local
# 编辑 .env.local 填入真实的 API 密钥

# 运行开发服务器
npm run dev

# 构建项目
npm run build
```

## 🧪 本地测试

### 基础功能测试

```bash
# 1. 启动开发服务器
npm run dev

# 2. 访问应用
open http://localhost:3000

# 3. 测试 API 端点
curl http://localhost:3000/api/stats

# 4. 测试 Cron 任务（开发模式，无需密钥）
curl http://localhost:3000/api/cron?test=true
```

### 安全测试（带密钥）

```bash
# 测试带 CRON_SECRET 的请求
curl -X POST "http://localhost:3000/api/cron?test=true" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer 4160f336b4a39e522355f82fb12e6c788ce30c4409120c123b0fa5634096077b"
```

## 🚀 部署到 Vercel

### 1. 推送到 GitHub

```bash
git add .
git commit -m "Initial commit with CRON_SECRET configuration"
git push origin main
```

### 2. 在 Vercel 中导入项目

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 "New Project"
3. 导入你的 GitHub 仓库

### 3. 配置环境变量

在 Vercel 项目设置 → Environment Variables 中添加：

**客户端变量（Production + Preview + Development）:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**服务端变量（Production + Preview）:**
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DEEPSEEK_API_KEY`
- `MINIMAX_API_KEY`
- `MINIMAX_GROUP_ID`
- `BLOB_READ_WRITE_TOKEN`

**安全配置（Production + Preview）:**
- `CRON_SECRET=4160f336b4a39e522355f82fb12e6c788ce30c4409120c123b0fa5634096077b`

### 4. 部署后测试

```bash
# 替换为你的 Vercel 应用 URL
export APP_URL="https://your-app-name.vercel.app"

# 测试统计 API
curl $APP_URL/api/stats

# 测试 Cron 任务（带密钥）
curl -X POST "$APP_URL/api/cron?test=true" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer 4160f336b4a39e522355f82fb12e6c788ce30c4409120c123b0fa5634096077b"
```

## 📊 数据库设置

在 Supabase 控制台中执行以下 SQL：

```sql
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

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_news_items_created_at ON news_items(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_items_source ON news_items(source);
```

## 🔒 安全最佳实践

1. **保护 CRON_SECRET:**
   - 不要在代码中硬编码
   - 只在环境变量中设置
   - 定期更换（建议每 3-6 个月）

2. **API 密钥管理:**
   - 定期检查 API 使用量
   - 设置合理的使用限制
   - 监控异常调用

3. **访问控制:**
   - 只允许必要的 Cron 任务执行
   - 监控未授权的访问尝试
   - 定期检查 Vercel 日志

## 📋 任务调度

- **自动执行**: 每日上午 8:00 (UTC)
- **处理量**: 最多 5 篇论文 + 3 条新闻/天
- **执行时间**: 约 35 分钟
- **安全性**: 使用 CRON_SECRET 保护

## 🛠 故障排除

### 常见错误

1. **Unauthorized 错误**: 检查 CRON_SECRET 配置
2. **API 密钥错误**: 验证各个 API 服务的密钥
3. **数据库连接失败**: 检查 Supabase 配置
4. **音频生成失败**: 确认 MiniMax TTS 权限

详细的故障排除指南请参考 [DEPLOYMENT.md](./DEPLOYMENT.md)。

## 📚 文档

- [部署指南](./DEPLOYMENT.md) - 详细的部署和测试说明
- [项目总结](./PROJECT_SUMMARY.md) - 完整的工作流程和技术架构

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## �� 许可证

MIT License 