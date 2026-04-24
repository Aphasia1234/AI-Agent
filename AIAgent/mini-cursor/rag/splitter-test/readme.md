# Splitter 理解

- loader 加载的大Document @langchain/community
- RecursiveCharacterTextSplitter 切割文档
   Text
- splitter 
    character 按这个切 符合语义
    ["。","？","！","，"] 
    优先级 。 最先
    chunkSize 的靠近 递归的尝试，？！
    保持语义完整性
    切断 overlap 重叠 牺牲一定的空间(大约10%的chunkSize) 保持语义完整性

    先character 切，再 chunkSize 切，最后overlap

- RAG 问题
   - 流程
   - loader
   - splitter 细节 三个参数
   - splitter 面向对象体系和关系
     父类 TextSplitter  切割的是文本，  mp3，mp4 不适合
     一系列的子类  
     CharacterTextSplitter  切割的是字符 
     TokenTextSplitter  切割的是token
     RecursiveCharacterTextSplitter  递归的尝试切割字符 语义完整性特别好
         MarkdownTextSplitter 为什么属于 RecursiveCharacterTextSplitter的子类？
         因为Markdown 用# ## ### 递归切割，符合语义完整性
- CharacterTextSplitter
    是按固定分隔符“一刀切”的简单分割器，
- 而 RecursiveCharacterTextSplitter 
    则是会“层层递进”尝试保留语义的智能分割器

# ecursiveCharacterTextSplitter 逻辑三步走
- 按优先级递归切割：按 separators 数组的顺序，优先使用高优先级分隔符切割文本。若某个原子片段仍超过 chunkSize，则递归使用下一级分隔符继续切割，直到所有片段都 ≤ chunkSize。

- 贪婪合并：从第一个原子片段开始，尽可能多地合并相邻片段，只要合并后的总长度不超过 chunkSize。一旦加入下一个片段会超限，则立即将当前缓冲区输出为一个文档。

- 最终输出：每个输出的文档长度 ≤ chunkSize，且尽可能保留了语义完整性。
  