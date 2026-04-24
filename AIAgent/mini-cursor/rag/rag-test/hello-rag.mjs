import "dotenv/config";
import { 
    ChatOpenAI,
    OpenAIEmbeddings
 } from "@langchain/openai";
 // 知识库中一段知识的抽象概念
 import { 
    Document
  } from "@langchain/core/documents";
// 内存向量数据库
import {
    MemoryVectorStore
} from "@langchain/classic/vectorstores/memory";

const model = new ChatOpenAI({
    modelName:process.env.MODEL_NAME,
    apiKey:process.env.OPENAI_API_KEY,
    configuration:{
        baseURL:process.env.OPENAI_BASE_URL,
    },
    temperature:0,
});

const embeddings = new OpenAIEmbeddings({
    apiKey:process.env.OPENAI_API_KEY,
    model: process.env.EMBEDDINGS_MODEL_NAME,
    configuration:{
        baseURL:process.env.OPENAI_BASE_URL,
    },
});

const documents = [
    new Document({
        pageContent:`光光是一个活泼开朗的小男孩，他有一双明亮的大眼睛，总是带着灿烂的笑容。光光最喜欢的事情就是和朋友一起玩耍，他特别擅长踢足球，每次在球场上奔跑时，就像一道阳光一样充满活力。`,
        metadata:{
            chapter:1,
            character:"光光",
            type:"角色介绍",
            mood:"活泼",
        }
    }),
    new Document({
        pageContent:`东东是光光最好的朋友，他是一个安静聪明的男孩。东东喜欢读书和画画，他的画总是充满了想象力。虽然性格不同，但东东和光光从幼儿园就认识了，他们一起度过了无数个快乐的时光。`,
        metadata:{
         chapter:2,
         character:"东东",
         type:"角色介绍",
         mood:"温馨",
        }
    }),
    new Document({
    pageContent: `一天放学后，光光抱着足球冲到东东家楼下大喊：“东东！下来踢球！今天天气超级好！”东东从窗户探出头，手里还拿着画笔：“可是我的画还没画完……”“先玩嘛！画可以明天再画！”光光笑着挥挥手。东东犹豫了一下，还是放下画笔跑下了楼。两人在小区空地上踢球、嬉笑，直到太阳落山。东东回家后惊讶地发现，弟弟不小心把颜料洒在了他没画完的作品上。东东难过极了，一整晚都没说话。`,
    metadata: {
        chapter: 3,
        character: "光光,东东",
        type: "冲突伏笔",
        mood: "快乐转为低落",
    }
}),
new Document({
    pageContent: `第二天，光光听说了画被弄坏的事，心里特别内疚。他趁东东去上美术班的时候，悄悄找美术老师借了颜料和画纸，照着记忆中东东的画重新画了一幅。虽然画得不如东东好，但他在画纸背面写了一行字：“对不起，东东，你是我最好的朋友。”东东回来后看到那幅画，忍不住笑了出来：“你画的小猫好像一只足球啊！”两个朋友哈哈大笑，一起重新完成了一幅更棒的作品。那天傍晚，他们坐在夕阳下，光光说：“以后你画画的时候，我就在旁边踢球给你看，当你的模特。”东东点点头，拿起画笔认真画下了光光踢球的样子。`,
    metadata: {
        chapter: 4,
        character: "光光,东东",
        type: "和解与成长",
        mood: "温暖、治愈",
    }
})
];

const vectorStore = await MemoryVectorStore.fromDocuments(
    documents, 
    embeddings
);

// 检索器 从向量数据库中检索最相关的文档
// k:返回的文档数量
const retriever = vectorStore.asRetriever({k:2});

const questions = ["光光为什么要和东东道歉？"];

for(const question of questions){
    console.log("=".repeat(80));
    console.log(`问题：${question}`);
    console.log("=".repeat(80));
    // 先将问题转换为向量表示
    // 再通过向量搜索，cosine 找到最相关的文档
    const retrievedDocs = await retriever.invoke(question);
    //console.log(retrievedDocs);
    // 相似度搜索 打分
    const scoreResults = await vectorStore.similaritySearchWithScore(question,3);
    console.log(scoreResults);
    console.log("\n[检索到的文档及相似度评分]");
    retrievedDocs.forEach((doc,i)=>{
        const scoreResult = scoreResults.find(
            ([scoredDoc])=> scoredDoc.pageContent === doc.pageContent
        );
        const score = scoreResult ? scoreResult[1] : null;
        const similarity = score ? (1 - score).toFixed(2) : "N/A";
        console.log(`文档${i+1}相似度：${similarity}`);
        console.log(`文档内容：${doc.pageContent}`);
        console.log(`元数据:${JSON.stringify(doc.metadata)}`);
    })

    const context = retrievedDocs
        .map((doc,i)=>`[片段${i+1}：]\n${doc.pageContent}`)
        .join("\n\n---\n\n");

    const prompt = `
      你是一个讲友情故事的老师。
      基于以下故事片段回答问题，用温暖生动的语言。
      如果故事中没有提及，就说“这个故事里没有提到这个细节”

      故事片段：
      ${context}

      问题：
      ${question}

      老师的回答：
    `;
    
    console.log("\n[模型回答]");
    const response = await model.invoke(prompt);
    console.log(response.content);
    console.log("\n[模型回答结束]");

}
