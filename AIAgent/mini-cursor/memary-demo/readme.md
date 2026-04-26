# Agent 记忆模块

- RAG 
  - 最低的成本(embedding) 丰富LLM 的精准(cosine) 上下文
  - 大模型的微调(finetue)也可以提升LLM的能力，但是花费巨大

- LLM 的扩展
  LLM + tool + RAG + Memory

- memory 是基石
  messages 数组 最基础的 memory 实现
  tool ？ 基于Memory ToolMessage
  RAG ？ 检索增强生成  Prompt增强  之前的对话，能力提升

- 和LLM 的对话 是无状态的 Stateless
  - LLM消费算力、电力，高并发
    基于请求 AIGC 生成内容返回
  - http 协议，也是无状态的
    http头，Cookie,Authorization 等，都可以实现状态保持
    万物互联
  - 每次对话都是独立的，不依赖于之前的对话
  - 带上memory，就可以实现对话的连续性
    messages 数组 保存了之前的对话记录
- modelWithTools
  messages 数组放入了SystemMessage,告诉它的角色、功能，
  然后放入HumanMessage,用户的问题
  基于智能循环判断tool_calls
  将Tool 的返回结果，ToolMessage 放入 messages 数组
  利用了Memory 把需要多轮对话的复杂任务，无状态的LLM也能实现

- 单纯messages 数组很简单，但是有问题
  - context 越来越长，token消耗越来越多，也可能达到模型最大的上下文窗口

- 解决方案
  - 截断：slice(-n) 最近的n轮对话 滑动窗口
  - 总结：将要截断的Message 总结一下 (SummaryMessage) 
  - 检索：(先存 数据库、文件)

    清空：清空messages 数组，重新开始
    新的任务，节省token
    
    - cursor 通过messages 计算token 开销
    - 自动触发总结：当token 开销超过阈值时，自动触发总结
    - 手动触发
      /compact   触发总结
      /clear  清空messages 数组，重新开始
      又能vibe coding 又能省token的ai 工程师

## FileSystemChatMessageHistory
   - session 会话 一次会话 有一个主题
     - js 
     - 算法
     - 手写
     - AI
   - 全新主题，新开一个session
   - 持久化存储 messagesHistory
   - 恢复某个session 继续chat 
   - 实现了cursor 的Memory 的持久化功能理解
