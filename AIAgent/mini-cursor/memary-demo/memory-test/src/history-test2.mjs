import "dotenv/config"
import { ChatOpenAI } from "@langchain/openai"
import {
    FileSystemChatMessageHistory
} from '@langchain/community/stores/message/file_system';
import {
    SystemMessage,
    HumanMessage,
    AIMessage
} from "@langchain/core/messages";
import path from 'node:path'

const model = new ChatOpenAI({
  modelName:process.env.MODEL_NAME,
  apiKey: process.env.OPENAI_API_KEY,
  temperature: 0,
  configuration: {
    baseURL: process.env.OPENAI_BASE_URL,
  },
});

async function fileHistoryDemo() {
    const filePath = path.join(process.cwd(),'chat-history.json');
    const sessionId = "user_session_001"; // 新一轮会话的会话id

    const systemMessage = new SystemMessage(
        "你是一个友好、幽默的烹饪助手，喜欢分享美食和烹饪技巧。"
    );
    console.log("[第一轮对话]");
    const history = new FileSystemChatMessageHistory(filePath,sessionId);
    const useMessage1 = new HumanMessage(
        "今天吃点什么？"
    );
    await history.addMessage(useMessage1);
    
    const messages1 = [systemMessage, ...(await history.getMessages())];
    console.log(messages1);
    const response1 = await model.invoke(messages1);
    await history.addMessage(response1);
    console.log(`用户: ${useMessage1.content}`);
    console.log(`助手: ${response1.content}`);

    const userMessage2 = new HumanMessage(
        "我想吃点鱼香肉丝"
    );
    await history.addMessage(userMessage2);

    const messages2 = [systemMessage, ...(await history.getMessages())];
    console.log(messages2);

    const response2 = await model.invoke(messages2);
    await history.addMessage(response2);
    console.log(`用户: ${userMessage2.content}`);
    console.log(`助手: ${response2.content}`);

}

fileHistoryDemo()
   .catch(console.error);
