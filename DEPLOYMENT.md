# 部署说明

## 环境变量配置

在部署到 Vercel 之前，需要配置以下环境变量：

### Supabase 配置
```
# 客户端可访问（前端使用）
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# 服务端专用（API 路由使用）
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

### Cron 任务安全配置 🔐
```
# 为你的项目生成的安全密钥
CRON_SECRET=
```

> **重要提示**: 这个 CRON_SECRET 是为你的项目专门生成的 64 位十六进制密钥，用于保护 Cron API 端点免受未授权访问。请在 Vercel 环境变量中设置此密钥。

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
3. 配置环境变量（特别注意设置 `CRON_SECRET`）
4. 部署项目

### Vercel 环境变量设置清单 ✅

在 Vercel 项目设置 → Environment Variables 中添加：

**必需的客户端变量:**
- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**必需的服务端变量:**
- ✅ `SUPABASE_URL`
- ✅ `SUPABASE_ANON_KEY`  
- ✅ `SUPABASE_SERVICE_ROLE_KEY`
- ✅ `DEEPSEEK_API_KEY`
- ✅ `MINIMAX_API_KEY`
- ✅ `MINIMAX_GROUP_ID`
- ✅ `BLOB_READ_WRITE_TOKEN`

**安全配置:**
- ✅ `CRON_SECRET=`

## Cron 任务配置

项目包含 `.vercel/cron.json` 配置文件，会自动设置每日上午 8 点执行的 Cron 任务。

### 🔒 Cron 任务安全机制

我们的 Cron API 端点 (`/api/cron`) 使用 `CRON_SECRET` 进行保护：

- **无 CRON_SECRET**: 任何人都可以触发 Cron 任务（不安全）
- **有 CRON_SECRET**: 只有提供正确密钥的请求才能执行（安全）

Vercel 的自动 Cron 任务会在请求头中包含这个密钥，确保只有合法的定时任务能够执行。

## 测试指南

### 1. 基础功能测试

#### 1.1 前端界面测试
```bash
# 访问部署后的应用
https://your-app-name.vercel.app
```

**验证项目:**
- [ ] 页面正常加载，无控制台错误
- [ ] 统计卡片显示（即使数据为0）
- [ ] 过滤按钮可正常切换
- [ ] 无 Supabase 连接错误

#### 1.2 API 端点测试
```bash
# 1. 统计信息 API
curl https://your-app-name.vercel.app/api/stats

# 期望返回:
{
  "success": true,
  "data": {
    "total": 0,
    "today": 0,
    "withAudio": 0,
    "bySource": {}
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 2. Cron 任务测试

#### 2.1 测试模式 Cron 任务（推荐）

**手动触发测试模式（使用 CRON_SECRET）:**
```bash
# 使用生成的 CRON_SECRET 进行安全测试
curl -X POST "https://your-app-name.vercel.app/api/cron?test=true" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer "

# 如果没有设置 CRON_SECRET（不推荐用于生产环境）
curl -X POST "https://your-app-name.vercel.app/api/cron?test=true" \
  -H "Content-Type: application/json"
```

**测试模式特点:**
- ✅ 只处理 1-2 个项目（节省API成本）
- ✅ 跳过音频生成（避免TTS API调用）
- ✅ 会真实写入数据库
- ✅ 适合验证整个流程

**期望响应:**
```json
{
  "success": true,
  "mode": "test",
  "result": {
    "totalProcessed": 2,
    "successful": 2,
    "failed": 0,
    "errors": []
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### 2.2 生产模式 Cron 任务（谨慎使用）

**⚠️ 警告:** 生产模式会调用所有API，产生实际费用

```bash
# 生产模式（需要 CRON_SECRET，会产生API费用）
curl -X POST "https://your-app-name.vercel.app/api/cron" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer "
```

#### 2.3 安全测试

**测试未授权访问（应该返回 401 错误）:**
```bash
# 不提供 Authorization header（应该被拒绝）
curl -X POST "https://your-app-name.vercel.app/api/cron?test=true" \
  -H "Content-Type: application/json"

# 提供错误的密钥（应该被拒绝）
curl -X POST "https://your-app-name.vercel.app/api/cron?test=true" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer wrong_secret"
```

**期望响应（应该是 401 未授权）:**
```json
{
  "error": "Unauthorized"
}
```

### 3. 数据库验证

#### 3.1 检查数据是否写入成功

**方法 1: 通过 Supabase 控制台**
1. 登录 Supabase 控制台
2. 选择你的项目
3. 进入 "Table Editor"
4. 查看 `news_items` 表
5. 确认有新数据被插入

**方法 2: 通过应用前端**
1. 刷新应用主页
2. 检查统计卡片数字是否增加
3. 查看是否有新的新闻卡片显示

**方法 3: 通过 SQL 查询**
```sql
-- 查看总记录数
SELECT COUNT(*) FROM news_items;

-- 查看最新的记录
SELECT title, source, created_at 
FROM news_items 
ORDER BY created_at DESC 
LIMIT 5;

-- 查看今日新增记录
SELECT COUNT(*) 
FROM news_items 
WHERE created_at >= CURRENT_DATE;
```

#### 3.2 验证数据完整性

**检查项目:**
- [ ] 记录包含必要字段（title, summary, link, source）
- [ ] published_date 格式正确
- [ ] source 字段为 'arxiv' 或 'news'
- [ ] 没有重复的 link（UNIQUE 约束）

### 4. 故障排除

#### 4.1 常见错误及解决方案

**错误 1: Supabase 连接失败**
```
Error: supabaseUrl is not defined
```
**解决方案:**
- 确保设置了 `NEXT_PUBLIC_SUPABASE_URL`
- 检查 Vercel 环境变量配置

**错误 2: API 密钥错误**
```
Error: DeepSeek API 错误: Invalid API key
```
**解决方案:**
- 验证 API 密钥是否正确
- 检查 API 账户余额

**错误 3: 数据库权限错误**
```
Error: 插入记录失败: permission denied
```
**解决方案:**
- 检查 Supabase RLS 策略
- 确认使用了正确的 service role key

**错误 4: Cron 任务未授权**
```
Error: Unauthorized
```
**解决方案:**
- 检查 `CRON_SECRET` 环境变量是否正确设置
- 确认请求头中的 Authorization Bearer token 正确
- 验证 Vercel 环境变量配置

#### 4.2 调试步骤

1. **检查 Vercel 日志:**
   - 在 Vercel 控制台查看 Function Logs
   - 查找错误消息和堆栈跟踪

2. **检查环境变量:**
   ```bash
   # 在 Vercel 控制台的 Settings > Environment Variables 中确认所有变量都已设置
   ```

3. **测试单个组件:**
   ```bash
   # 先测试统计 API
   curl https://your-app-name.vercel.app/api/stats
   
   # 再测试 Cron（测试模式，带密钥）
   curl -X POST "https://your-app-name.vercel.app/api/cron?test=true" \
     -H "Authorization: Bearer "
   ```

### 5. 监控和维护

#### 5.1 日常检查清单
- [ ] 每日 Cron 任务执行状态
- [ ] 数据库存储使用量
- [ ] API 调用次数和费用
- [ ] Vercel Blob 存储使用量
- [ ] Cron 任务安全日志

#### 5.2 定期维护
```bash
# 检查过去7天的数据增长
SELECT DATE(created_at) as date, COUNT(*) as count 
FROM news_items 
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

## 注意事项

1. **费用控制:**
   - 建议先在测试模式下验证功能
   - 监控 API 调用次数，避免超出预算
   - 定期检查 Vercel 和 Supabase 使用量

2. **安全考虑:**
   - 确保所有 API 密钥都已正确配置
   - **必须设置 CRON_SECRET 保护 Cron 端点**
   - 定期轮换 API 密钥和 CRON_SECRET
   - 监控未授权的 API 访问尝试

3. **数据管理:**
   - Supabase 数据库表必须先创建
   - 建议设置数据备份策略
   - 定期清理旧数据（如 30 天前的记录）

4. **性能优化:**
   - Vercel Blob 存储需要有足够的配额
   - 监控数据库查询性能
   - 考虑添加更多索引以优化查询

## 🔐 安全最佳实践

1. **保护 CRON_SECRET:**
   - 不要在代码中硬编码密钥
   - 只在 Vercel 环境变量中设置
   - 定期更换密钥（建议每 3-6 个月）

2. **访问控制:**
   - 只允许来自 Vercel 的 Cron 请求
   - 监控异常的 API 调用模式
   - 设置合理的 API 限流

3. **日志监控:**
   - 定期检查 Vercel Function Logs
   - 关注失败的身份验证尝试
   - 监控异常的数据库活动 