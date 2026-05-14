# OpenCode Interceptor Viewer 项目蓝图

## 项目目标

构建一个用于查看 `opencode-interceptor` 抓取数据的本地网页工具，将类似 `/tmp/opencode-interceptor/ses_*` 的原始会话目录展示成可阅读、可搜索、可导航的对话时间线。

这个项目的重点是检查、调试和分析抓包数据，而不是修改抓取结果。

## 问题背景

`opencode-interceptor` 会把 LLM 请求和响应拆分存储为一组 JSON 文件：

- `*.meta.json`：请求元信息，例如时间戳、URL、状态码、耗时、内容类型、请求字节数、响应字节数等
- `*.request.json`：完整请求体，例如模型、消息列表、system prompt、工具定义和参数
- `*.response.json`：响应包装数据，通常会在 `body` 字段中保存重建后的回复文本

直接阅读这些文件并不方便，因为一次 LLM 调用会被拆成多个文件，大量 system prompt 会干扰阅读，而且整个会话的请求顺序和上下文关系不直观。

## 目标用户

- 调试 OpenCode 或 OpenAI/Anthropic 兼容接口流量的开发者
- 需要检查 prompt 构造和模型响应的 Agent 框架开发者
- 对比同一会话中多次请求变化的研究人员
- 想用本地网页方式浏览 LLM 抓包数据的高级用户

## 核心概念

### 会话

一个会话对应 `/tmp/opencode-interceptor/` 下的一个目录，例如：

```text
/tmp/opencode-interceptor/ses_1e1f5baa9ffeNIpaBJSkoMbzgq/
```

目录中包含按编号排列的请求文件组：

```text
001-anthropic-2026-05-12T21-16-40-117Z.meta.json
001-anthropic-2026-05-12T21-16-40-117Z.request.json
001-anthropic-2026-05-12T21-16-40-117Z.response.json
```

### 调用

一次调用由同一个前缀下的 `meta`、`request` 和 `response` 三个文件组成。

### 回放文本

响应文件中可能包含 `bodyFormat: "replay-text"`。此时 `body` 字段就是重建后的模型输出文本。查看器应优先展示这部分内容。

## 产品范围

### MVP 功能

1. 会话目录选择
   - 允许用户输入或选择一个会话目录。
   - 校验该目录中是否存在成组的 `*.meta.json`、`*.request.json` 和 `*.response.json` 文件。

2. 调用时间线
   - 按编号顺序展示所有调用。
   - 展示时间戳、provider、状态码、耗时、请求大小、响应大小和模型名称。
   - 对失败请求、空响应或异常响应进行明显标记。

3. 请求查看器
   - 展示模型名称和关键请求参数。
   - 默认折叠较长的 system/developer prompt。
   - 将用户消息和助手消息渲染为易读的消息块。
   - 提供原始 JSON 查看入口，方便精确排查。

4. 响应查看器
   - 优先展示 `body` 中的重建文本。
   - 展示响应状态、`statusText`、`bodyFormat`、读取错误等元信息。
   - 提供原始 JSON 标签页。
   - 如果响应为空或被省略，应显示 `bodyOmittedReason` 等可解释信息。

5. 搜索与过滤
   - 支持在请求消息、响应正文、模型、URL 和元信息中搜索。
   - 支持按 provider、状态码、空响应、耗时范围和模型过滤。

6. 本地优先
   - 查看器应在本地运行。
   - 抓取到的 prompt 和响应默认不能上传到外部服务。

### 后续功能

- 对比两次调用或两个会话。
- 将会话导出为 Markdown、HTML 或 JSONL。
- 重建简洁版对话 transcript。
- 高亮 tool call 和 tool result。
- 检测 token 消耗较高的 prompt 区块。
- 展示 prompt 随调用增长的趋势。
- 可视化延迟和响应大小变化。
- 如果未来 interceptor 保存完整 SSE event 流，则支持原始流式事件查看。

## 建议界面布局

```text
+-------------------------------------------------------------+
| 顶部栏：会话路径 | 刷新 | 导出 | 搜索                    |
+----------------------+--------------------------------------+
| 调用列表             | 调用详情                             |
|                      |                                      |
| 001 200 1.5s GLM     | 标签页：概览 | 请求 | 响应        |
| 002 200 1.2s GLM     |                                      |
| 003 200 0.1s 空响应  | 概览卡片                             |
| ...                  | 消息/对话视图                        |
|                      | 原始 JSON 抽屉                       |
+----------------------+--------------------------------------+
```

## 数据模型草案

```ts
type Session = {
  id: string;
  path: string;
  calls: Call[];
};

type Call = {
  index: number;
  provider: string;
  timestamp: string;
  prefix: string;
  meta?: CallMeta;
  request?: CallRequest;
  response?: CallResponse;
  parseErrors: ParseError[];
};

type CallMeta = {
  url?: string;
  method?: string;
  status?: number;
  contentType?: string;
  durationMs?: number;
  requestBytes?: number;
  responseBytes?: number;
  capturedBytes?: number;
};

type CallRequest = {
  model?: string;
  messages?: unknown[];
  tools?: unknown[];
  raw: unknown;
};

type CallResponse = {
  status?: number;
  statusText?: string;
  body?: string;
  bodyFormat?: string;
  bodyReadError?: string | null;
  bodyOmittedReason?: string | null;
  raw: unknown;
};
```

## 解析策略

1. 扫描会话目录，查找 `.meta.json`、`.request.json` 和 `.response.json` 文件。
2. 按共同文件前缀将三类文件分组。
3. 按数字编号排序。
4. 分别解析每个 JSON 文件，避免单个损坏文件导致整个会话无法打开。
5. 提取高价值字段，归一化为统一的 `Call` 对象。
6. 保留原始 JSON，用于高级调试和精确检查。

## 隐私与安全

- 默认不将会话内容发送到任何远程服务。
- 在导出或复制大量 prompt 内容前给出明确提示。
- 可选导出时应支持常见敏感信息脱敏，例如 API key、Bearer token、Authorization header。
- 所有加载的本地文件都应被视为不可信输入。

## 非目标

- MVP 不负责重放请求到模型供应商。
- 不编辑或覆盖 interceptor 抓取的原始文件。
- 初版不实现 provider 费用计算。
- 基础查看能力不依赖托管后端。

## 推荐技术方向

项目更适合采用前后端一体的全栈框架，而不是纯前端应用。原因是浏览器直接读取 `/tmp/opencode-interceptor/` 这类本地目录会受到权限限制，而服务端路由可以稳定地扫描目录、读取 JSON、归一化数据，再交给前端展示。

推荐优先级：

1. Next.js
   - 适合 React 生态。
   - 可以用 API Routes 或 Server Actions 读取本地 session 目录。
   - 前端页面负责时间线、搜索、过滤、Markdown 渲染和 JSON 树展示。
   - 本地启动后即可访问，例如 `http://localhost:3000`。

2. Nuxt
   - 适合 Vue 生态。
   - 可以用 server routes 读取本地文件系统。
   - 适合做结构清晰的本地调试面板。

3. SvelteKit
   - 适合轻量、交互响应快的本地工具。
   - 服务端 load/API 负责解析 session，前端组件负责展示。

MVP 推荐方案：Next.js + Node.js 文件系统读取。

建议职责划分：

- 服务端
  - 扫描 `/tmp/opencode-interceptor/` 下的 session 目录。
  - 读取并解析 `*.meta.json`、`*.request.json`、`*.response.json`。
  - 将三类文件按共同前缀合并成统一的 `Call` 数据结构。
  - 提供 session 列表、session 详情、单次调用详情等 API。

- 前端
  - 展示 session 列表。
  - 展示调用时间线。
  - 展示请求摘要、响应正文、原始 JSON。
  - 提供搜索、过滤、折叠 system prompt、Markdown 渲染等交互。

- 渲染能力
  - 使用 Markdown 渲染助手响应。
  - 使用 JSON tree viewer 展示原始请求/响应。
  - 对长会话使用虚拟列表提升性能。

本项目不需要单独拆成独立后端和独立前端。一个全栈框架内完成即可，部署形态也以本地开发工具为主。

## MVP 成功标准

第一个可用版本应允许开发者指向一个 session 目录，并快速回答以下问题：

- 这个会话中发生了哪些调用？
- 某次用户/助手交流对应哪一个请求？
- 请求发送了什么模型和参数？
- 模型实际返回了什么？
- 哪些响应为空、失败或被截断？
- 每次调用的耗时和数据量是多少？

## 示例会话摘要

```text
会话：ses_1e1f5baa9ffeNIpaBJSkoMbzgq
调用数：13
Provider：anthropic-compatible endpoint
Content-Type：text/event-stream
主要响应格式：replay-text

001 | 200 | 1.56s | 响应正文 82 字符
002 | 200 | 1.25s | 响应正文 139 字符
003 | 200 | 0.18s | 空 replay body
004 | 200 | 0.22s | 响应正文 1832 字符
```
