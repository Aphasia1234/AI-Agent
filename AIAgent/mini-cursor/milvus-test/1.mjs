import { MilvusClient, DataType, IndexType, MetricType } from '@zilliz/milvus2-sdk-node';
import 'dotenv/config';
import {
    OpenAIEmbeddings
} from '@langchain/openai';

const VECTOR_DIM = 1024;
const COLLECTION_NAME = 'ai_diary';

const embeddings = new OpenAIEmbeddings({
    apiKey: process.env.OPENAI_API_KEY,
    model:process.env.EMBEDDINGS_MODEL_NAME,
    configuration:{
        baseURL: process.env.OPENAI_BASE_URL,
    },
    dimension: VECTOR_DIM,
});
const TOKEN = process.env.MILVUS_TOKEN;
const ADDRESS = process.env.MILVUS_ADDRESS;
const client = new MilvusClient({
    address: ADDRESS,
    token: TOKEN,
});
// 嵌入模型 将文本转换为向量表示的函数封装
async function getEmbeddings(text){
    const result = await embeddings.embedQuery(text);
    return result;
}

async function main(){
    console.log('正在连接 Milvus 服务...');
    const checkHealth = await client.checkHealth();
    if(!checkHealth.isHealthy){
        console.error('连接 Milvus 服务失败', checkHealth.reasons);
        return;
    }
    console.log('连接 Milvus 服务成功');
    await client.loadCollection({
        collection_name: COLLECTION_NAME,
   })

   const query = '我想看看关于户外活动的日记';
   const queryVector = await getEmbeddings(query);
   const searchResult = await client.search({
    collection_name: COLLECTION_NAME,
    vector: queryVector,
    limit: 3,
    metric_type:MetricType.COSINE,
    output_fields:['id','content','date','mood','tags'],
   })
   searchResult.results.forEach(result => {
    console.log(`\n 日记ID:${result.id}`);
    console.log(`内容:${result.content}`);
    console.log(`日期:${result.date}`);
    console.log(`心情:${result.mood}`);
    console.log(`标签:${result.tags}`);
   })
   
    /*
    await client.createCollection({
        collection_name: COLLECTION_NAME,
        fields:[
            { name:'id',data_type:DataType.VarChar,max_length:50,is_primary_key:true},
            { name:'vector',data_type:DataType.FloatVector,dim:VECTOR_DIM },
            { name:'content',data_type:DataType.VarChar,max_length:5000 },
            { name:'date',data_type:DataType.VarChar,max_length:50 },
            { name:'mood',data_type:DataType.VarChar,max_length:50 },
            { name:'tags',data_type:DataType.Array,element_type:DataType.VarChar,max_capacity:10,max_length:50 }
        ]
    })

    await client.createIndex({
        collection_name: COLLECTION_NAME,
        field_name: 'vector',// 常用的查询字段
        index_type:IndexType.IVF_FLAT,
        metric_type:MetricType.COSINE,
        params:{
            nlist:VECTOR_DIM,
        },
    })
    
   await client.loadCollection({
        collection_name: COLLECTION_NAME,
   })

   console.log('\nInserting diary...');
   const diaryContents = [
    {
        id: 'diary_001',
        content: '今天天气特别好，傍晚去小区公园散步，看到了美丽的夕阳。路上遇到了邻居家的小狗，特别可爱。感觉这样的日子平静又美好，希望每天都能保持这样的心情。',
        date: '2026-01-10',
        mood: 'happy',
        tags: ['生活', '散步', '自然']
    },
    {
        id: 'diary_002',
        content: '工作压力有点大，项目截止日期临近，加班到很晚。但是团队配合很默契，大家一起攻克了一个技术难题，还是很有成就感的。明天继续加油！',
        date: '2026-01-11',
        mood: 'stressed',
        tags: ['工作', '加班', '团队合作']
    },
    {
        id: 'diary_003',
        content: '周末和朋友一起去吃了新开的日料店，三文鱼刺身很新鲜，寿司也做得不错。饭后还去看了场电影，好久没有这么放松了，友谊真的很治愈。',
        date: '2026-01-12',
        mood: 'excited',
        tags: ['美食', '朋友', '周末', '聚会']
    },
    {
        id: 'diary_004',
        content: '今天收到了期待已久的offer，感觉自己的努力终于得到了回报。从一个舒适区跳出来需要勇气，但为了更好的发展，值得一试。感谢一直支持我的家人和朋友！',
        date: '2026-01-13',
        mood: 'grateful',
        tags: ['工作', '成长', '感恩', '新起点']
    },
    {
        id: 'diary_005',
        content: '阴雨绵绵的一天，心情也有些低落。想起了已经离世的奶奶，她以前最喜欢在这样的天气给我讲故事。思念就像窗外的雨，连绵不断。',
        date: '2026-01-14',
        mood: 'sad',
        tags: ['思念', '雨天', '回忆', '家人']
    },
    {
        id: 'diary_006',
        content: '报名了一个线上课程，开始学习新的技能。虽然有点难，但我相信坚持就是胜利。还加入了学习小组，认识了一些志同道合的朋友。',
        date: '2026-01-15',
        mood: 'motivated',
        tags: ['学习', '成长', '技能提升', '社交']
    },
    {
        id: 'diary_007',
        content: '今天和伴侣吵架了，因为一些小事。冷静下来想想，有时候是我太固执了。晚上主动道歉，两个人好好沟通，化解了矛盾。感情需要经营啊。',
        date: '2026-01-16',
        mood: 'calm',
        tags: ['感情', '成长', '沟通', '反思']
    },
    {
        id: 'diary_008',
        content: '去健身房打卡第一天！虽然很累，但是流汗的感觉很爽。教练说我体能还不错，给了我一些建议。目标是三个月后能看到明显变化，坚持下去！',
        date: '2026-01-17',
        mood: 'energetic',
        tags: ['健身', '健康', '目标', '自律']
    },
    {
        id: 'diary_009',
        content: '买了新相机，尝试拍vlog记录生活。虽然技术还很生疏，但发现用镜头观察世界是件有趣的事。今天拍了很多街景和路人，生活处处是风景。',
        date: '2026-01-18',
        mood: 'creative',
        tags: ['摄影', 'vlog', '新爱好', '记录生活']
    },
    {
        id: 'diary_010',
        content: '读完了一本很有启发性的书《原子习惯》，明白了小改变的大力量。决定从每天读10页书开始，养成好习惯。改变不需要很大，但要坚持。',
        date: '2026-01-19',
        mood: 'inspired',
        tags: ['阅读', '自我提升', '习惯养成', '感悟']
    }
];

console.log('Generating embeddings...');
const diaryData = await Promise.all(
    diaryContents.map(async (diary)=>({
        ...diary,
        vector:await getEmbeddings(diary.content),
    }))
);
const inserRes = await client.insert({
    collection_name: COLLECTION_NAME,
    data:diaryData,
})
console.log(`插入 ${inserRes.insert_cnt} 条数据成功`);
*/
}

main();


// async function main(){
//     const client = new MilvusClient({
//         address: process.env.MILVUS_ADDRESS,
//         token: process.env.MILVUS_TOKEN,
//     });
//     console.log('正在连接 Milvus 服务...');
//     const checkHealth = await client.checkHealth();
//     if(!checkHealth.isHealthy){
//         console.error('连接 Milvus 服务失败', checkHealth.reasons);
//         return;
//     }
//     console.log('连接 Milvus 服务成功');

//     const COLLECTION_NAME = 'test';
//     const DIMENSION = 4; // 向量维度

    // try{
    //     await client.createCollection({
    //         collection_name: COLLECTION_NAME,
    //         dimension: DIMENSION,
    //         auto_id: true,
    //     });
    //     console.log(`Collection ${COLLECTION_NAME} 创建成功……`);
    //     await client.createIndex({
    //         collection_name: COLLECTION_NAME,
    //         field_name: 'vector',
    //         index_type:IndexType.AUTOINDEX,
    //         metric_type:MetricType.COSINE,
    //     })
    //     console.log(`Index ${COLLECTION_NAME}_vector 创建成功……`);
    // } catch(err){
    //     console.log(`创建 Collection ${COLLECTION_NAME} 失败：`, err);
    // }

    // const data = [
    //     {
    //         vector: [0.1, 0.2, 0.3, 0.4],
    //         content:'这是第一个测试向量'
    //     },
    //     {
    //         vector: [0.5, 0.6, 0.7, 0.8],
    //         content:'这是第二个测试向量'
    //     }
    // ];
    // const insertRes = await client.insert({
    //     collection_name: COLLECTION_NAME,
    //     data
    // })
    // console.log(`插入 ${insertRes.IDs.length} 条数据成功`);
//     const searchRes = await client.search({
//         collection_name: COLLECTION_NAME,
//         data:[[0.1, 0.2, 0.3, 0.4]],
//         limit:1,
//         output_fields:['content'],
//     })
//     console.log(`搜索结果：${JSON.stringify(searchRes)}`);
// }
// main();