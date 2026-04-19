import 'dotenv/config';
import { ChatOpenAI } from "@langchain/openai";
import {tool} from "@langchain/core/tools";//  pnpm i langchain @langchain/core
import {
    HumanMessage,
    SystemMessage,
    ToolMessage,
} from "@langchain/core/messages";
// node 内置文件模块 异步I/O
import fs from "node:fs/promises";
// 数据校验 zod tool parameter 校验
import {z} from "zod";

const model = new ChatOpenAI({
    modelName:process.env.MODEL_NAME,
    apiKey:process.env.OPENAI_API_KEY,
    configuration:{
        baseURL:process.env.OPENAI_BASE_URL
    },
    temperature:0,
});

const readFileTool = tool(
    // tool() 的第一个参数是处理函数的函数体
    // tool读取文件内容，path 作为参数 等待它读取完成
    // 再分析文件内容
    async ({path}) => {
        const content = await fs.readFile(path, "utf-8");
        return content;
    },
    // tool() 的第二个参数是工具的定义，包括工具名称、描述和参数的 schema
    {
        name:"read_file",
        description:"读取文件内容的工具",
        schema:z.object({
            path: z.string().describe("要读取的文件路径")
        })

    }
);
// 可能需要多个工具
const tools= [readFileTool];
// 绑定工具到模型
// 模型 now 可以使用工具了
// 模型只能"说"，不能"做"。它无法真正读取文件、搜索网络、执行代码等。
// 模型就像一个聪明的大脑，工具就像手和脚，
// 绑定就是让大脑知道它有手脚可用，但实际动作还需要神经系统来协调执行。
const modelWithTools = model.bindTools(tools);
const messages = [
    // 系统消息，告诉模型它的角色和能力
    new SystemMessage(`
       你是一个代码助手，可以使用工具读取文件并解释代码。

       工作流程:
       1.用户要求读取文件时，立即调用read_file工具
       2.等待工具返回文件内容
       3.基于文件内容进行分析和解释

       可用工具:
       - read_file: 读取文件内容的工具，参数是文件路径
        `),
        // 用户消息，包含用户的问题
        new HumanMessage("请帮我读取文件 tool-file-read.mjs 的内容，并解释代码")
];
// 大模型返回的决策 它需要调用工具来完成任务，
// 模型会生成一个工具调用的消息，告诉工具要执行哪个工具以及传递什么参数
let response = await modelWithTools.invoke(messages);
// console.log(response.content);
// 好的，请稍等，我将读取文件 `tool-file-read.mjs` 的内容并进行解释。
// 模型生成了一个工具调用的消息，告诉工具要执行 `read_file` 工具，
// 并传递参数 `path: "tool-file-read.mjs"`
messages.push(response);// 把llm的回复添加到消息列表中
// 因为模型可能需要：
// 先调用工具A
// 根据A的结果，决定调用工具B
// 最终基于所有结果回答
while(response.tool_calls && response.tool_calls.length > 0){
    console.log(`[检测到${response.tool_calls.length}个工具调用]`);
    const toolResults = await Promise.all(
        // 使用map() 方法遍历每个工具调用，
        // 并并行调用工具执行，等待所有工具调用完成后再继续下一步
        response.tool_calls.map(async(toolCall)=>{
            const tool = tools.find(t => t.name === toolCall.name);
            if(!tool){
                return `未找到工具: ${toolCall.name}`;
            }
            console.log(`[调用工具: ${toolCall.name}, 参数: ${JSON.stringify(toolCall.args)}]`);
            try{
                const result = await tool.invoke(toolCall.args);
                return result;
            }catch(error){
                return `工具调用失败: ${error.message}`;
            }
        })
    )
    // 将工具调用的结果包装成 ToolMessage，并添加到消息列表中
    response.tool_calls.forEach((toolCall, index) => {
        messages.push(
            new ToolMessage({
                content:toolResults[index],
                tool_call_id:toolCall.id
            })
        )
    })
    console.log(messages);
    // 不再有工具调用时，模型会返回最终的回复
    response = await modelWithTools.invoke(messages);
    console.log(response);
    console.log(response.content);
}
/*
用户输入
   ↓
[第1次模型调用] → 模型决策："需要读文件"
   ↓
[代码检测工具调用] → 找到 read_file 工具
   ↓
[执行工具] → fs.readFile() 读取实际文件
   ↓
[包装结果] → 创建 ToolMessage
   ↓
[第2次模型调用] → 模型分析文件内容
   ↓
[返回最终结果] → 用户看到代码解释
 */