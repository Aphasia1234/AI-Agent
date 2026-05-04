# 定时任务

明早九点帮我把最新的关于open claw的新闻，整理成一篇日报，发送到我的邮箱。

- 日程安排的能力交给小龙虾
- 网络搜索的tool
- 写文章
- 发邮件

## 生成器
普通函数，一调用就从头跑到尾
生成器函数，跑到yield，就暂停，promise 解决后可以从暂停的地方继续跑
async/await 的前身

## RxJS
用数据流的方式来处理异步事件
- JS里常见的异步方式
  - callback 回调地狱
  - Promise 
  - generator 生成器函数
  - async/await
  - event listener 事件监听

以上是适合一次性的异步任务
有很多异步任务是连续发生的事件
  - SSE 
  - 输入框输入 防抖节流
  - 鼠标移动事件
  - AI 流式输出

事件1 -> 事件2 -> 事件3 -> ...
像一条河流

## 流式输出
- nest.js + rxjs 实现服务端 sse 接口
  - nest.js 以@sse 装饰器模式 /ai/chat/stream
  - 本质是设置了 
    - Content-Type: text/event-stream
    - Cache-Control: no-cache  别缓存
    - Connection: keep-alive  保持连接
    - Transfer-Encoding: chunked  分块传输
    - service 模块根据langchain stream :true  LLM流式响应
    - 使用rxjs from api 将LLM 流式响应转换成一个Observable对象
      pipe 一下 map 转成前端需要的data:chunk 格式
    - service 使用 langchain tool 定义了 queryUserTool 等tool
    - llm 流式大模型响应 for await chunk of stream
    - 判断 fullAIMessageChunk.tool_call_chunks
      - 如果是， 不干
      - 如果不是， yield 输出
    - agentLoop
      - 如果要用到工具，执行 tool(args)
    - 结束

## EventSource
- html5 新特性
  - localStorage 本地存储  持久化存储 (比cookie 大 5MB )
  - sessionStorage 会话存储  关闭浏览器后自动删除
  - 语义化标签
  - Web Worker  JS 多线程  异步任务
  - WebSocket 双向通信
  - 拖放 API  拖拽文件到浏览器
  - getUserMedia  获取用户媒体流  视频和音频
  - history API 前端路由
  - video 视频标签 bilibili
  - audio 音频标签
  - canvas 画布标签 游戏和3D
  - 定位 GeoLocation  定位用户位置  经纬度  美团
  - 表单的增强能力 placeholder  提示用户输入  required  必填项  type="range" 滑动条
  - LLM 流式输出 EventSource
    - 服务器到浏览器的单向实时连接，自动接收服务器推送的文本数据流

- ts 的Partial 和 Omit
  Partial 表示可选的属性
  Omit 表示排除属性
  partial: Partial<Omit<User,'id'>> 表示可选的属性，排除 id 属性
  应用场景：
    - nest.js Patch 局部更新用户信息时，参数的数据校验

- 深化tool
  - query_user
  把tool 作为 provide 再module 里声明，和原有的service 解耦
  依赖注入的方式 model.bindTools()
