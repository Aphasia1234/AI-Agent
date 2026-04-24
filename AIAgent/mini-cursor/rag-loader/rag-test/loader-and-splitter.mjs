import "dotenv/config"
//cheerio: 用于解析网页和提取 HTML 内容，类似于前端的 CSS 选择器，
// 可以帮助从网页 DOM 中提取指定内容。
import "cheerio";
// LangChain 的一个加载器，用于从指定网页（通过 URL）提取指定的 HTML 元素。
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio"
// 文本分割器，用于将大段文本分割成较小的块（chunks），方便后续处理。
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters"
//用于在内存中存储向量数据（通过嵌入模型生成的向量）。
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory"
//用于加载 OpenAI 的嵌入和聊天模型。
// OpenAIEmbeddings 用于将文本转换为向量，ChatOpenAI 用于生成基于给定文本的对话。
import { OpenAIEmbeddings,ChatOpenAI } from "@langchain/openai"

// 初始化 OpenAI 模型
const model = new ChatOpenAI({
    modelName:process.env.MODEL_NAME,
    apiKey:process.env.OPENAI_API_KEY,
    configuration:{
        baseURL:process.env.OPENAI_BASE_URL,
    },
    temperature:0,
});
// 初始化 OpenAI 嵌入模型
const embeddings = new OpenAIEmbeddings({
    apiKey:process.env.OPENAI_API_KEY,
    model: process.env.EMBEDDINGS_MODEL_NAME,
    configuration:{
        baseURL:process.env.OPENAI_BASE_URL,
    },
});
// 通过 selector 指定要抓取的 HTML 元素。
// 在这里，选择了网页中 .main-area p 元素。
const cheerioLoader = new CheerioWebBaseLoader("https://juejin.cn/post/7606548472223498282"
    ,
    {
        selector:'.main-area p'
    }
)
// load() 方法会返回页面上符合选择器条件的所有元素内容，并将其作为文档返回。
const documents = await cheerioLoader.load();
// 文本分割器
const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize:400,// 每个chunk的最大字符数
    chunkOverlap:50,// 相邻chunk之间的重叠字符数, 用于上下文关联 语义的连续性
    separators:['。','，','？','！'] // 分隔符
})

// 文割文档
const splitDocuments = await textSplitter.splitDocuments(documents);
console.log(`分割后的文档数量: ${splitDocuments.length}`)
// 向量数据库
// 用于将文档分割后的文本转换成向量，并存储在内存中。这些向量可以被用于之后的检索操作
// fromDocuments() 方法会将分割后的文档和嵌入模型一起使用，生成对应的向量。
const vectorStore = await MemoryVectorStore.fromDocuments(
    splitDocuments,
    embeddings
);
console.log("向量数据库创建完成");
// asRetriever() 方法将向量存储转化为检索器。
// k: 2 表示每次检索时返回 2 个最相关的文档。
const retriever = vectorStore.asRetriever({k:2});

const question = ["文章关于什么的？"];

for(const q of question){
    console.log(`问题: ${q}`);
    console.log("=".repeat(80));

    // retriever.invoke(q) 会根据问题 q 从向量数据库中检索出与问题相关的文档。
    // retriever 是基于 MemoryVectorStore 创建的检索器，它通过嵌入向量计算文档之间的相似度。
    // invoke(q) 会根据问题 q 进行检索，返回与问题最相关的文档。返回的 retrievedDocs 是一个包含文档的数组，每个文档包含 pageContent 和可能的 metadata。
    const retrievedDocs =await retriever.invoke(q);
    // similaritySearchWithScore(q, 2) 方法会返回与问题 q 最相关的文档，并附带每个文档的相似度分数（从 0 到 1）。
    // 2 表示返回与问题最相关的前两个文档。
    // 返回的 scoreResults 是一个数组，每个元素是一个元组，包含文档和该文档与问题的相似度分数。
    const scoreResults = await vectorStore.similaritySearchWithScore(q,2);

    console.log(scoreResults);
    console.log("\n [检索结果]");
    // retrievedDocs 是检索到的文档，scoreResults 是相似度得分。
    // 为了显示每个文档的相似度，我们将这两个结果做匹配。
    // forEach 循环遍历 retrievedDocs，对于每个文档，查找它在 scoreResults 中对应的相似度分数。
    retrievedDocs.forEach((doc,i)=>{
        const scoreResult = scoreResults.find(
            ([scoredDoc])=>scoredDoc.pageContent === doc.pageContent
        );
        // scoreResult 是一个包含文档和分数的数组（例如：[document, score]）
        // scoreResult[1] 表示取 scoreResult 数组的第二个元素
        const score = scoreResult ? scoreResult[1] : null;
        // 评分越低相似度越高（评分的大小通常表示差异的大小，即差异越大，评分通常越高。）
        // 在余弦相似度中，如果两个向量非常相似（即夹角非常小），相似度评分接近 1 <== cos 0。
        // 如果它们完全不同（夹角接近 90°），则相似度接近 0 <== cos 90；
        // 如果方向相反，值接近 -1 < == cos 180。
        const similarity = score ? (1-score).toFixed(2) : "N/A";
        console.log(`文档${i+1}: ${doc.pageContent} (相似度: ${similarity})`);
        console.log(`内容: ${doc.pageContent}`);
        if(doc.metadata && Object.keys(doc.metadata).length > 0){
            console.log(`元数据: ${JSON.stringify(doc.metadata)}`);
        }
    });

    const content = retrievedDocs
        .map((doc,i) => `[片段${i+1}:] ${doc.pageContent}`)
        .join("\n\n----\n\n");

    const prompt = `你是一个文章辅助阅读助手，根据文章内容来解答：
    文章内容：
    ${content}

    问题：
    ${q}

    回答：
    `;
    console.log("\n [AI回答]");
    const response = await model.invoke(prompt);
    console.log(response.content);
}

