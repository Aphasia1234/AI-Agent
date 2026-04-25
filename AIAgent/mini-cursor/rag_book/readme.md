# RAG 电子书

- 一本电子书，如何做 RAG 搜索

- RAG 的流程
1. 知识库
2. @langchain/community
   来自社区的各种loader
3. Splitter 文档分割器
4. Document 
   pageContent
   meta: 
5. Embedding Model 嵌入模型
6. Milvus 向量数据库

## 开发流程

- ensureBookCollection 确保电子书集合存在
   - 判断集合是否存在 hasCollection
   - 如果不存在，创建集合 createCollection
     schema
      创建索引 createIndex
      加载集合 loadCollection

## MVP
- Vibe Coding
  - 代码平权
  - idear 设计师
  Minimal Viable Product 最小可执行产品
  cursor/claude code 编程Agent MVP
  产品原型是产品经理设计出来的原型稿
- 正式的商业级别开发
  程序员 继续vibe coding
- 语义搜索和文本匹配
  - 文本匹配  低级搜索 模糊搜索  like  %段誉%
  - 语义搜索  高级搜索  基于向量的相似度搜索