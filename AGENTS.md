# AGENTS.md

## 项目说明

本项目用于开发一个本地网页查看器，将 `opencode-interceptor` 抓取到的 LLM 请求/响应数据可视化展示出来。

目标是把原始 session 目录中的 `*.meta.json`、`*.request.json`、`*.response.json` 文件组合成可阅读、可搜索、可分析的调用时间线。

## 当前阶段

当前项目仍处于蓝图和准备阶段。

目前已有内容：

- `BLUEPRINT.md`：项目蓝图和功能规划
- `fixtures/`：用于沙箱开发和测试的 interceptor 抓包样例

暂时不要实现业务代码，除非用户明确要求开始开发。

## 测试数据

项目内置了一份测试 session：

```text
fixtures/ses_1e1f5baa9ffeNIpaBJSkoMbzgq/
```

该目录复制自：

```text
/tmp/opencode-interceptor/ses_1e1f5baa9ffeNIpaBJSkoMbzgq/
```

每一次 LLM 调用通常由三类文件组成：

```text
001-xxx.meta.json
001-xxx.request.json
001-xxx.response.json
```

含义如下：

- `*.meta.json`：请求元信息，例如 URL、状态码、耗时、字节数等
- `*.request.json`：完整请求体，例如模型、消息、system prompt、工具定义等
- `*.response.json`：响应包装数据，通常包含 `bodyFormat` 和 `body`

## 推荐技术方向

项目应优先采用前后端一体框架，而不是纯前端项目。

推荐 MVP 技术方向：

```text
Next.js + Node.js 文件系统读取
```

原因：

- 浏览器直接读取本地 `/tmp/opencode-interceptor/` 目录会受到权限限制。
- 服务端路由可以稳定扫描目录、读取 JSON、归一化数据。
- 前端可以专注于时间线、搜索、过滤、Markdown 渲染和 JSON 树展示。

Nuxt 或 SvelteKit 可以作为备选方案，但默认优先考虑 Next.js。

## 开发约束

- 默认只读取数据，不修改 interceptor 原始文件。
- 默认不把 prompt、响应或抓包内容上传到远程服务。
- 所有本地 JSON 文件都应视为不可信输入。
- 单个 JSON 文件解析失败不应导致整个 session 无法打开。
- 长 system prompt 应默认折叠，避免干扰主要阅读流。
- 响应展示应优先使用 `response.body` 中的 replay text。
- 需要保留 raw JSON 查看入口，方便精确调试。

## 期望的 MVP 能力

后续开始实现时，MVP 应能回答以下问题：

- 当前 session 中有哪些调用？
- 每次调用的状态码、耗时、请求大小、响应大小是多少？
- 请求使用了哪个模型和哪些关键参数？
- 用户消息和助手响应分别是什么？
- 哪些响应为空、失败或被截断？
- 能否快速搜索某段 prompt 或响应内容？

## 文件组织建议

后续如果使用 Next.js，可以考虑如下结构：

```text
app/
  page.tsx
  sessions/[id]/page.tsx
  api/sessions/route.ts
  api/sessions/[id]/route.ts
lib/
  interceptor-parser.ts
  types.ts
components/
  SessionList.tsx
  CallTimeline.tsx
  CallDetail.tsx
  JsonViewer.tsx
fixtures/
  ses_1e1f5baa9ffeNIpaBJSkoMbzgq/
```

以上只是建议结构，不是当前必须实现的代码。




