import "dotenv/config";
import {
    MilvusClient, // Milvus 客户端
    DataType, // 数据类型
    MetricType, // 指标类型
    IndexType, // 索引类型
} from '@zilliz/milvus2-sdk-node'
import {
    OpenAIEmbeddings
} from '@langchain/openai'

const ADDRESS = process.env.MILVUS_ADDRESS;
const TOKEN = process.env.MILVUS_TOKEN;
const COLLECTION_NAME = 'EBook';
const VECTOR_DIM = 1024;

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

async function main(){
    try{
        console.log('连接 Milvus 服务器');
        await client.connectPromise;
        try{
            await client.loadCollection({
                collection_name: COLLECTION_NAME,
            })
        } catch (error) {
            console.error('加载集合失败:', error.message);
            throw error;
        }
        const query = '段誉会什么武功？';
        const queryVector = await getEmbeddings(query);
        const searchResult = await client.search({
            collection_name: COLLECTION_NAME,
            vector: queryVector,
            limit:3,
            metric_type: MetricType.COSINE,
            output_fields: ['id', 'content', 'book_id','chapter_num','index','book_name'],
        })

        searchResult.results.forEach((item,index)=>{
            console.log(`\n 第${index+1}个结果：Score:${item.score.toFixed(2)}`);
            console.log(`ID:${item.id}`);
            console.log(`内容:${item.content}`);
            console.log(`书籍ID:${item.book_id}`);
            console.log(`章节编号:${item.chapter_num}`);
            console.log(`索引:${item.index}`);
            console.log(`书籍名称:${item.book_name}`);
        })
    } catch (error) {
        console.error('连接 Milvus 服务器失败:', error.message);
        throw error;
    }
}

main();

/*
用户查询: "段誉会什么武功？"
    ↓ (OpenAI Embedding)
查询向量: [0.123, -0.456, 0.789, ...] (1024维)
    ↓ (余弦相似度计算)
数据库向量1: [0.120, -0.450, 0.785, ...] → 相似度 0.95 ✅ 返回
数据库向量2: [0.001, 0.500, -0.200, ...] → 相似度 0.23 ❌ 不返回
数据库向量3: [0.115, -0.460, 0.790, ...] → 相似度 0.93 ✅ 返回
*/