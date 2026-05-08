# cron job Agent

- openclaw 自动化任务
  每天早上九点将最新的AI新闻发送到我的邮箱

- mysql
  psql 激进 配置 支持 vector 向量数据库存储
  关系型数据库 mysql oracle

  create database hello

- ORM 
  Object Relational Mapping  对象关系映射
  
  - Prisma
  - TypeORM

- 创建了项目
  nest new cron-job-tool
  npm i @nestjs/typeorm typeorm mysql2
  mysql2 是数据库驱动程序
  typeorm + @nestjs/typeorm  orm typeorm 作为nestjs 插件启动
- nest g resource users --no-spec
  创建一个users 模块

## 定时任务
cron 表达式

7 12 13 10 * *
秒 分 时 日 月 周
每月10号下午1:12:07执行一次
* 每个
？ 忽略

多种类型的cron job  openclaw 自动化，定时任务非常有需要

## tools 模块
- AI Module imports Tool
- ai 模块，providers 越来越多，增长趋势
  不方便管理
- agent ？

# ai agent 和 job agent
当走到需要创建定时任务时：

> Ai Agent **不会等待** Job Agent 执行结果。
> Ai Agent **当场结束对话**。

这是很多人第一次做 Agent 时最容易误解的一点。

---

## 关键结论（一句话）

> **AiAgent 只负责“安排未来”**
> **JobAgent 负责“未来真的去做”**

两者是**时间解耦**的。

---

## 用你的真实代码走一遍

用户说：

> 每天早上 9 点把当前时间发我邮箱

### 第一步：AiService 在跑（对话阶段）

📄 `ai.service.ts` 

LLM 判断：

> 这不是立刻执行，是要创建定时任务

于是调用：

```text
tool: cron_job
action: add
type: cron
cron: "0 0 9 * * *"
instruction: "把当前时间发我邮箱"
```

---

### 第二步：调用 `cron_job` 工具

📄 `cron-job-tool.service.ts` 

这里发生的是：

```ts
await this.jobService.addJob(...)
```

👉 **只是往数据库里插入一条 Job 记录 + 注册调度器**

没有执行任何「发邮件 / 查时间」。

---

### 第三步：Tool 返回结果给 AiAgent

返回的是：

```text
已新增定时任务：id=xxx type=cron ...
```

AiAgent 把这个结果喂回 LLM。

---

### 第四步：LLM 给用户最终回复

类似：

> 好的，我已经为你创建了一个每天早上 9 点执行的定时任务。

**对话结束。SSE 结束。**

⛔ 到这里为止，JobAgent **一次都没有运行**。

---

## 真正的 JobAgent 什么时候运行？

9:00 到了。

📄 `job.service.ts` 

```ts
const result = await this.jobAgentService.runJob(job.instruction);
```

这时才：

```text
JobService → JobAgentService → LLM → Tool → 发邮件
```

**这个过程和用户对话完全没关系。**

用户甚至不在线。

## 时间线非常清晰

T = 现在
User ──> AiAgent
        └─> 创建 cron_job
        └─> 回复用户
        ❌ 结束

T = 明天 9:00
JobService ──> JobAgent ──> 执行任务
