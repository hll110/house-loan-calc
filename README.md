# 🏠 房贷计算器

> 一站式房贷计算与房价查询工具，支持等额本息/等额本金计算、还款方式智能推荐、提前还款模拟、全国百城房价实时查询。

## 功能特点

### 📊 房贷计算
- **等额本息** / **等额本金** 两种还款方式计算
- 支持贷款金额（10-1000万）、期限（1-360月）、利率灵活设置
- 内置 2026 年 LPR 利率与公积金利率快捷选择
- 完整的逐月还款计划表（本金、利息、剩余本金）

### ⚖️ 还款方式对比
- 等额本息 vs 等额本金全面对比
- **最优还款方式智能推荐引擎**
- 首套房个税专项附加扣除计算（每月1000元，最长240个月）
- 综合考虑还款压力、利息节省、税务优惠的净收益分析

### 💰 提前还款计算
- 缩短期限 / 减少月供 两种策略模拟
- 精确计算节省利息金额与缩短月数
- 提前还款前后对比一目了然

### 🏙️ 房价查询
- 覆盖全国 **90+ 城市**（一线/二线/三线）
- 新房均价、二手房均价、环比涨跌数据
- 按城市名、省份搜索，按城市等级筛选
- **每天 0 点自动从网络获取最新房价数据**
- 数据更新时间、数据来源实时展示

## 技术架构

```
┌─────────────────────────────────────────────────┐
│                    Frontend                      │
│  React 19 + React Router 7 + Tailwind CSS v3    │
│  shadcn/ui (40+ 组件) + Recharts                │
│  TanStack Query v5 (via tRPC)                   │
├─────────────────────────────────────────────────┤
│                   tRPC v11                       │
│          类型安全的前后端通信层                    │
│         SuperJSON 序列化 + Fetch 适配            │
├─────────────────────────────────────────────────┤
│                    Backend                       │
│  Hono v4 (Node.js) + tRPC Router               │
│  房贷计算引擎 (contracts/loan.ts)                │
│  房价数据服务 (price-store + price-fetcher)      │
├─────────────────────────────────────────────────┤
│                   定时任务                       │
│  自托管: node-cron (每天0点)                     │
│  Vercel: Vercel Cron Jobs                       │
├─────────────────────────────────────────────────┤
│                   数据存储                       │
│  JSON 文件 (data/city-prices.json)              │
│  内置默认数据 (contracts/loan.ts) 作为 fallback  │
│  Drizzle ORM + MySQL (可选，预留接口)            │
└─────────────────────────────────────────────────┘
```

### 技术栈

| 层级 | 技术 |
|------|------|
| **前端框架** | React 19 + TypeScript |
| **路由** | React Router 7 |
| **UI 组件** | shadcn/ui (New York 风格) + Radix UI |
| **样式** | Tailwind CSS v3 + tailwindcss-animate |
| **状态管理** | TanStack React Query v5 |
| **后端框架** | Hono v4 (Node.js 适配器) |
| **API 层** | tRPC v11 (类型安全 RPC) |
| **构建工具** | Vite v7 (前端) + esbuild (后端) |
| **ORM** | Drizzle ORM (MySQL，可选) |
| **定时任务** | node-cron (自托管) / Vercel Cron (Serverless) |
| **测试** | Vitest v4 |
| **代码规范** | ESLint 9 + Prettier |
| **包管理** | npm |

### 项目结构

```
├── api/                    # 后端代码
│   ├── app.ts              # Hono 应用定义
│   ├── boot.ts             # 生产环境启动入口 (含 node-cron)
│   ├── index.ts            # Vercel Serverless 入口
│   ├── router.ts           # tRPC 路由定义
│   ├── context.ts          # tRPC 上下文
│   ├── middleware.ts        # tRPC 中间件
│   ├── cron/               # 定时任务
│   │   └── update-prices.ts # 房价更新 Cron 端点
│   ├── services/           # 业务服务
│   │   ├── price-fetcher.ts # 网络房价数据抓取
│   │   └── price-store.ts   # 房价数据存储管理
│   ├── lib/                # 工具库
│   │   ├── env.ts          # 环境变量
│   │   └── http.ts         # HTTP 客户端
│   └── queries/            # 数据库查询
├── contracts/              # 共享类型与逻辑
│   └── loan.ts             # 房贷计算核心 + 默认房价数据
├── data/                   # 数据文件
│   └── city-prices.json    # 自动更新的房价数据 (运行时生成)
├── db/                     # 数据库
│   ├── schema.ts           # Drizzle 表定义
│   └── seed.ts             # 数据库种子
├── src/                    # 前端代码
│   ├── main.tsx            # 入口
│   ├── App.tsx             # 路由配置
│   ├── pages/Home.tsx      # 主页面 (所有计算器 Tab)
│   ├── components/         # UI 组件
│   │   ├── ui/             # shadcn/ui 基础组件
│   │   └── CityPriceGrid.tsx # 城市房价卡片网格
│   ├── providers/trpc.tsx  # tRPC 客户端配置
│   └── lib/loan.ts         # 前端计算逻辑
├── vercel.json             # Vercel 部署配置 (含 Cron)
├── Dockerfile              # Docker 生产镜像
├── vite.config.ts          # Vite 开发/构建配置
└── package.json            # 依赖与脚本
```

## 快速开始

### 环境要求

- **Node.js** 20+
- **npm** 10+

### 安装与运行

```bash
# 安装依赖
npm install

# 启动开发服务器 (前后端一体，端口 3000)
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 即可使用。

### 常用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器（Vite + Hono，端口 3000） |
| `npm run build` | 构建生产版本 |
| `npm start` | 生产模式启动 |
| `npm run lint` | ESLint 代码检查 |
| `npm run check` | TypeScript 类型检查 |
| `npm run format` | Prettier 代码格式化 |
| `npm test` | 运行测试 (Vitest) |

## 房价自动更新机制

### 工作原理

1. **定时触发**：每天北京时间 0:00 自动执行
2. **多源抓取**：依次尝试多个公开数据源，任一成功即停止
3. **智能合并**：新数据与已有数据合并，保留城市信息完整性
4. **持久存储**：更新后的数据写入 `data/city-prices.json`
5. **容错降级**：所有数据源失败时保留现有数据，不会丢失

### 部署场景

**自托管 (Docker / Node.js)**
- 使用 `node-cron` 在服务器进程内调度
- 数据自动持久化到 JSON 文件
- 无需额外配置，启动即生效

**Vercel Serverless**
- 通过 `vercel.json` 的 `crons` 配置调度
- 每天 UTC 0:00 调用 `/api/cron/update-prices` 端点
- 可设置 `CRON_SECRET` 环境变量保护端点安全

### 手动触发更新

```bash
# 通过 API 手动触发数据更新
curl http://localhost:3000/api/cron/update-prices
```

## 部署

### Docker

```bash
docker build -t house-loan-calc .
docker run -p 3000:3000 house-loan-calc
```

### Vercel

项目已配置 `vercel.json`，支持一键部署：

```bash
vercel deploy
```

Vercel 部署说明：
- 前端静态文件自动构建到 `dist/public/`
- API 通过 `@hono/node-server/vercel` 适配器以 Serverless Function 运行
- Cron Job 自动配置，无需手动设置

## API 接口

| 端点 | 说明 |
|------|------|
| `GET /api/trpc/ping` | 健康检查 |
| `GET /api/trpc/housingPrice.list` | 全部城市房价 |
| `GET /api/trpc/housingPrice.byTier` | 按城市等级查询 |
| `GET /api/trpc/housingPrice.search` | 搜索城市 |
| `GET /api/trpc/housingPrice.updateInfo` | 数据更新状态 |
| `POST /api/trpc/housingPrice.refresh` | 手动刷新数据 |
| `GET /api/trpc/mortgageCalc.equalInterest` | 等额本息计算 |
| `GET /api/trpc/mortgageCalc.equalPrincipal` | 等额本金计算 |
| `GET /api/trpc/mortgageCalc.combo` | 组合贷款计算 |
| `GET /api/trpc/mortgageCalc.prepay` | 提前还款计算 |
| `GET /api/trpc/mortgageCalc.compare` | 还款方式对比 |
| `GET /api/cron/update-prices` | 定时任务触发端点 |

## 数据说明

- 房价数据来源：中指研究院百城价格指数
- 利率参考：2026年5月LPR（1年期 3.0%，5年期以上 3.5%）
- 公积金利率：5年以上 2.85%
- 计算结果仅供参考，以银行实际审批为准

## License

MIT
