import "dotenv/config";
import { parse } from "path";
import {
    MilvusClient, // Milvus 客户端
    DataType, // 数据类型
    MetricType, // 指标类型
    IndexType, // 索引类型
} from '@zilliz/milvus2-sdk-node'
import {
    OpenAIEmbeddings
} from '@langchain/openai'
import {
    // 加载 EPUB 文件
    EPubLoader
} from '@langchain/community/document_loaders/fs/epub'
import {
    RecursiveCharacterTextSplitter
} from '@langchain/textsplitters'

const COLLECTION_NAME = 'EBook';
const VECTOR_DIM = 1024;
const CHUNK_SIZE = 500;
const EPUB_FILE = './天龙八部-金庸.epub';
const CHUNK_OVERLAP = 50;

const ADDRESS = process.env.MILVUS_ADDRESS;
const TOKEN = process.env.MILVUS_TOKEN;

const BOOK_NAME = parse(EPUB_FILE).name;
console.log(BOOK_NAME);

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

async function getEmbeddings(text) {
    const result = await embeddings.embedQuery(text);
    return result;
}

async function ensureBookCollection(bookId){
    try{
        const hasCollection = await client.hasCollection({
            collection_name: COLLECTION_NAME,
        })
        if(!hasCollection.value){
            console.log('创建集合');
            await client.createCollection({
                collection_name: COLLECTION_NAME,
                fields: [
                    { name:'id',data_type:DataType.VarChar,max_length:100,is_primary_key:true },
                    { name:'book_id',data_type:DataType.VarChar,max_length:100 },
                    { name:'book_name',data_type:DataType.VarChar,max_length:100 },
                    { name:'chapter_num',data_type:DataType.Int32 },
                    { name:'index',data_type:DataType.Int32 },
                    { name:'content',data_type:DataType.VarChar,max_length:10000 },
                    { name:'vector',data_type:DataType.FloatVector,dim:VECTOR_DIM }
                ]
            });
            console.log('集合创建成功');
            await client.createIndex({
               collection_name: COLLECTION_NAME,
               field_name: 'vector',
               index_type: IndexType.IVF_FLAT,
               metric_type: MetricType.COSINE,
               params: {
                   nlist: VECTOR_DIM,
               }
            });
            console.log('索引创建成功');
        }
        try{
            await client.loadCollection({
                collection_name: COLLECTION_NAME,
            });
            console.log('集合加载成功');

        } catch (error) {
           console.log("集合已处于加载状态");
        }
    } catch (error) {
        console.error('创建集合失败:', error.message);
        throw error;
    }
}

async function insertChunksBatch(chunks,bookId,chapterNum){
    try{
        if(chunks.length === 0){
            return 0;
        }
        // 性能优化 embedding 并发
        const insertData = await Promise.all(
            chunks.map(async (chunk,chunkIndex) => {
                const vector = await getEmbeddings(chunk);
                return {
                    id:`${bookId}-${chapterNum}-${chunkIndex}`,
                    book_id:bookId,
                    book_name:BOOK_NAME,
                    chapter_num:chapterNum,
                    index:chunkIndex,
                    content:chunk,
                    vector:vector
                }
            })
        )
        const insertResult = await client.insert({
            collection_name: COLLECTION_NAME,
            data: insertData,
        });
        return Number(insertResult.insert_cnt) || 0;
    } catch (error) {
        console.error('插入向量失败:', error.message);
        throw error;
    }
}

async function loadAndProcessEpubStreaming(bookId){
    try{
        console.log('加载 EPUB 文件');
        const loader = new EPubLoader(
            EPUB_FILE,
            {
                // 按章节分割文档
                splitChapters: true
            }
        );
        // 加载文档
        const documents = await loader.load();
        console.log(documents);
        const textSplitter = new RecursiveCharacterTextSplitter({
            chunkSize: CHUNK_SIZE,
            chunkOverlap: CHUNK_OVERLAP,
            // 默认 \n\n 段落的分割符  \n 。 ，
        });

        let totalInserted = 0;
        for(let chapterIndex = 0;chapterIndex<documents.length;chapterIndex++){
            const chapter = documents[chapterIndex];
            const chapterContent = chapter.pageContent;
            console.log(`处理第${chapterIndex+1}/${documents.length}章`);
            const chunks = await textSplitter.splitText(chapterContent);
            console.log(`拆分后共${chunks.length}个段落`);
            if(chunks.length === 0){
                console.log(`跳过空章节\n`);
                continue;
            }
            console.log('生成向量并插入中……');
            const insertedCount = await insertChunksBatch(chunks,bookId,chapterIndex+1);
            totalInserted += insertedCount;
            console.log(`已插入${totalInserted}个向量`);
        }
        return totalInserted;
    } catch (error) {
        console.error('加载 EPUB 文件失败:', error.message);
        throw error;
    }
}


async function main(){
    try{
        console.log('电子书处理');
        console.log('连接 Milvus');
        await client.connectPromise;
        console.log('连接 Milvus 成功');

        const bookId = 1;
        await ensureBookCollection(bookId);
        // 加载 EPUB 文件
        await loadAndProcessEpubStreaming(bookId);
    } catch (error) {
        
    }
}
main();

/*
EPUB电子书 
   ↓ (EPubLoader)
章节数组 [章1, 章2, ...]
   ↓ (RecursiveCharacterTextSplitter)
文本块 [块1, 块2, ...] (每个500字符)
   ↓ (OpenAIEmbeddings)
向量 [[0.123,...], [0.456,...], ...] (1024维)
   ↓ (MilvusClient.insert)
存入向量数据库
   ↓
可用于语义搜索 🎯
*/