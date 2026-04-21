# MCP
“MCP 指的是按照 MCP 规范来开发的 Server，而 Tools 是这个 Server 中提供给 AI 模型调用的具体功能单元。”
Tools 是 MCP 生态中 AI 可直接调用的“动作”，而 MCP 是整个系统的“规则”。

- llm with tools

   read write listDir exec tool
   llm + tools = Agent
   llm真的能干活了

- mini-cursor
   mcp with tools 不太满意？
   怎么把llm 能干活的甜头扩大？ 更多的tool，更好的tool
   向外提供tool 大厂将自己的服务以mcp的方式向外提供
   - 80%的APP 会消失
   - 集成第三方mcp服务，mcp其实就是tool
   - node 调用java/python/rust 等其他语言的tool
   - 远程的tool

## MCP
Model Context Protocol
在大量的将本地、跨语言、第三方的tool集成到Agent里来的时候，让llm强大的同时，也会带来一定的复杂性（对接联调）
最好就是大家都按一个约定

## 按MCP 协议来开发，将我们的服务或资源输出
## MCP 协议 还有通信部分
   - stdio 本地命令行
   - http 远程调用

## MCP 最大的特点就是可以跨进程调用工具
  - 子进程 node：child_process
  - 跨进程 java/rust
  - 远程进程
  llm 干更强大的任务
  繁杂（本地、跨语言、跨部门、远程） 不同的通信方式(stdio/http)
  规范的提供工具和资源，mcp协议

## 编写满足mcp协议规范的tool
- Model Context Protocol
  tool result,ToolMessage Context 上下文
- Anthorpic 24年底 发布了mcp协议  25年底贡献给开源社区
- sdk @modelcontextprotocol/sdk
pnpm i @modelcontextprotocol/sdk

- 为什么MCP 需要配置？
  - cursor/trae 编程Agent 支持MCP client

## 💡 工作流程
// 1. 用户在 Cursor 中输入
"帮我查询用户 001 的信息"

// 2. MCP Host (Cursor) 接收请求
Host: 用户想查询用户信息

// 3. MCP Client (Cursor内部) 查找可用的 Server
Client: 发现 my-mcp-server 提供了 query-user 工具

// 4. Client 发送请求到 Server
Client → Server: {
    method: "callTool",
    params: {
        name: "query-user",
        arguments: { userId: "001" }
    }
}

// 5. MCP Server  执行
Server: 查询 database.users["001"]
Server: 返回用户信息

// 6. Client 接收响应并传给 Host
Server → Client: { 用户信息 }

// 7. Host 展示给用户
Cursor: "用户001的信息是：张三，邮箱..."

## MCP 三者关系

- MCP Hosts
  运行 AI 应用程序的环境，是用户直接交互的界面
- MCP Clients
  在 Host 内部运行的通信组件，负责与 MCP Server 通信
- MCP Servers
  提供具体工具和数据服务的独立进程，mcp tool 运行的服务器容器

## 在trae的mcp配置页面为什么可以看到调用工具的名称和描述
每个 MCP 服务器在启动时，都会通过协议主动向 Trae 发送一份“工具清单”，清单上清晰地列出自己能提供的所有工具，以及每个工具的名称、功能描述和所需的参数。