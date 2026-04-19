# 手写cursor 最小版本

- 千问
  互联网计算向ai agent 推理，运行的一个划时代的产品，更复杂，更强大
- OpenClaw 
  一人公司
  数字虚拟人，多人Agent
  编程Agent(cursor) ppt 算账 市场
  任务拆解、计划，找到一批需要agent 完成的任务

- AI Agent如何打造
  - 直接调用大模型？获得智能，生成代码
    gemini 3.1 pro
  - Memory
  
    AI Agent = 大模型 + Memory + tool + RAG

## Agent 是什么？
Agent 是一个智能体，具有感知、思考、行动能力，能够自主完成任务。

其实就是给大模型扩展了tool和memory，让它能够自主完成任务。大模型本来就可以思考，规划，给他用tool扩展了能力，它就可以自动做任务，用memory 管理记忆，它就可以记住你想让它记住的东西，还可以使用RAG查询内部知识，来辅助完成任务。

这样一个知道内部知识、能思考规划、有记忆，能够帮你做事情的扩展后的大模型

## Tool 工具

### 用react创建一个todoList
- 任务，期待cursor 编程Agent 完成
- llm 思考 规划 aigc 生成代码
- tool 让llm扩展，有文件读写能力，项目就生成了
- tool bash 命令行 执行命令

### Langchain
AI Agent 框架提供了memory tool rag
后端功底(node)

AI Agent 全栈开发

## LLM with Tools

- llm 选择
  - qwen-coder
   api-key：sk-d4b98d7f4fab48dd854c712270928590
   base-url：https://dashscope.aliyuncs.com/compatible-mode/v1
   (pnpm i dotenv)
  - tools
    [read, write,exec]
  - pnpm i @langchain/openai 适配了常见的模型