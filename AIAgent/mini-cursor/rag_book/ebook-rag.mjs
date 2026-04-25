import "dotenv/config";
import {
    MilvusClient, // Milvus 客户端
    DataType, // 数据类型
    MetricType, // 指标类型
    IndexType, // 索引类型
} from '@zilliz/milvus2-sdk-node'
import {
    OpenAIEmbeddings,
    ChatOpenAI,
} from '@langchain/openai'

const ADDRESS = process.env.MILVUS_ADDRESS;
const TOKEN = process.env.MILVUS_TOKEN;
const COLLECTION_NAME = 'EBook';
const VECTOR_DIM = 1024;

const model = new ChatOpenAI({
    temperature: 0.7,
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.MODEL_NAME,
    configuration:{
        baseURL: process.env.OPENAI_BASE_URL,
    },
})

// 实例化嵌入模型
const embeddings = new OpenAIEmbeddings({
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.EMBEDDING_MODEL_NAME,
    configuration:{
        baseURL: process.env.OPENAI_BASE_URL,
    },
    dimension: VECTOR_DIM,
})
// 实例化 Milvus 客户端
const client = new MilvusClient({
    address: ADDRESS,
    token: TOKEN,
})
// 获取文本的向量表示
async function getEmbeddings(text) {
    const result = await embeddings.embedQuery(text);
    return result;
}

async function retrieveRelatedContent(question,k=3){
    try{
        const queryVector = await getEmbeddings(question);
        const searchResult = await client.search({
            collection_name: COLLECTION_NAME,
            vector: queryVector,
            limit: k,
            metric_type: MetricType.COSINE,
            output_fields: ['id','book_id','book_name','chapter_num','index','content']
        });
        return searchResult.results;
    } catch (error){
        console.error('查询失败:', error.message);
        return [];
    }
}

async function answerEbookQuestion(question,k=3){
    try{
        console.log('开始回答问题：',question);

        const retrievedContent = await retrieveRelatedContent(question,k);
        console.log('检索到的内容:', retrievedContent);
        if(retrievedContent.length === 0){
            console.log('未检索到相关内容');
            return '未检索到相关内容';
        }
        // retrievedContent.forEach((item,index) => {

        // })
        const context = retrievedContent
        .map((item,i) =>`
        [片段${i+1}]
        章节：第${item.chapter_num}章
        内容：${item.content}
        `).join('\n\n----\n\n');

        const prompt = `
         你是一个专业的《天龙八部》小说助手。基于小说内容，回答用户的问题，用准确、详细的语言。

         请根据以下《天龙八部》小说片段内容回答问题：
         ${context}

         用户问题：${question}

         回答要求：
         1.如果片段中有相关信息，请结合小说内容给出详情，准确的回答
         2.可以综合多个片段内容，提供完整的答案
         3.如果片段中没有相关的信息，请如实告知用户
         4.回答要准确，符合小说的情节和人物设定
         5.可以引用原文内容来支持你的回答

         AI助手的回答：
        `
        const response = await model.invoke(prompt);
        console.log('模型回答:', response.content);
        return response.content;
    } catch (error) {
        return '回答问题失败';
    }
}

async function main(){
    try{
        console.log('连接 Milvus 服务器');
        await client.connectPromise;
        try{
            await client.loadCollection({
                collection_name: COLLECTION_NAME,
            });
            console.log('集合加载成功');
        } catch (error) {
            console.error('加载集合失败:', error.message);
            throw error;
        }

        const result = await answerEbookQuestion("谁的武功最高？");
        console.log(result);
    } catch (error) {
        console.error('连接 Milvus 服务器失败:', error.message);
        throw error;
    }
}

main();

/*
用户问题: "谁的武功最高？"
    ↓
[检索模块] → 在向量数据库中搜索相关段落
    ↓
[上下文构建] → 将检索到的段落组合成提示词
    ↓
[LLM生成] → 大模型基于上下文生成答案
    ↓
输出: "扫地僧的武功最为深不可测..."
*/