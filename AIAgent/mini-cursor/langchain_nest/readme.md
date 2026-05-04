# Nest + langchain 实现AI接口
- 大多数的Agent都是跑在后端服务
  - Nest + Langchain 开发api接口
- nest?
  - NestJS 是一个用于构建高效、可扩展的 Node.js 服务器端应用程序的渐进式框架。
  - node.js + typescript 的最主流框架
    底层是 express.js 轻量级
    提供了MVC、DI(依赖注入)、AOP等特性

- 创建项目
   - MVC 在哪？
    后端的开发设计模式
    Model Service 数据操作，远程rpc调用
    View(前后端分离)
    Controller 控制器 参数校验和逻辑
    module 会将Controller、Service组织起来，形成一个功能模块
    适合企业级开发。
    - DI(依赖注入)
    - 装饰器模式
    面向对象设计模式之一
    函数或类快速通过装饰器
 
  // g -> generate 
  // res -> resource  
  // ai -> ai 模块名
  // --no-spec -> 不要生成spec文件
  nest g res ai --no-spec