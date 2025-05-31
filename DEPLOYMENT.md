# 部署说明

## 环境变量配置

在部署到 Vercel 之前，需要配置以下环境变量：

### Supabase 配置
```
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### API 密钥
```
DEEPSEEK_API_KEY=your_deepseek_api_key
MINIMAX_API_KEY=your_minimax_api_key
MINIMAX_GROUP_ID=your_minimax_group_id
```

### Vercel Blob 存储
```
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token
```

### Cron 任务安全（可选）
```
CRON_SECRET=your_random_secret_string
```

## 数据库设置

1. 在 Supabase 控制台中创建新项目
2. 在 SQL 编辑器中执行以下 SQL 创建数据表：

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

-- 创建索引以优化查询性能
CREATE INDEX IF NOT EXISTS idx_news_items_created_at ON news_items(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_items_source ON news_items(source);
```

## Vercel 部署步骤

1. 将代码推送到 GitHub 仓库
2. 在 Vercel 中导入项目
3. 配置环境变量
4. 部署项目

## Cron 任务配置

项目包含 `.vercel/cron.json` 配置文件，会自动设置每日上午 8 点执行的 Cron 任务。

## 手动测试

部署完成后，可以通过以下方式测试：

1. 访问主页查看界面
2. 在开发环境中访问 `/api/cron?test=true` 测试 Cron 任务
3. 访问 `/api/stats` 查看统计信息

## 注意事项

1. 确保所有 API 密钥都已正确配置
2. Supabase 数据库表必须先创建
3. Vercel Blob 存储需要有足够的配额
4. 建议先在测试模式下运行 Cron 任务 