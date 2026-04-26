import "dotenv/config"
import { ChatOpenAI } from "@langchain/openai"
import { InMemoryMessageHistory } from "@langchain/core/chat_history";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";

const model = new ChatOpenAI({
  modelName:process.env.MODEL_NAME,
  apiKey: process.env.OPENAI_API_KEY,
  temperature: 0,
  configuration: {
    baseURL: process.env.OPENAI_BASE_URL,
  },
});

async function inMemoryDemo() {
  const history = new InMemoryMessageHistory();
  const systemMessage = new SystemMessage(
     "你是一个友好、幽默的烹饪助手，喜欢分享美食和烹饪技巧。"
  );
  console.log("[第一轮对话]");
  const useMessage1 = new HumanMessage(
    "今天吃点什么？"
  );
  await history.addMessage(useMessage1);
  const messages1 = [systemMessage, ...(await history.getMessages())];
  const response1 = await model.invoke(messages1);
  await history.addMessage(response1);
  console.log(`用户: ${useMessage1.content}`);
  console.log(`助手: ${response1.content}`);
  
}

inMemoryDemo()
   .catch(console.error);