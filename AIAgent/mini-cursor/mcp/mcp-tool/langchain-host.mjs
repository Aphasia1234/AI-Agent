import 'dotenv/config'
// adapters  mcp 适配器 用于连接mcp服务器
import {
    MultiServerMCPClient
} from '@langchain/mcp-adapters';
import  { ChatOpenAI } from '@langchain/openai';
import {
    HumanMessage,
    ToolMessage
} from '@langchain/core/messages';
import chalk from 'chalk';
// host
const model = new ChatOpenAI({
    modelName:process.env.MODEL_NAME,
    apiKey:process.env.OPENAI_API_KEY,
    baseURL:process.env.OPENAI_BASE_URL,
});

// 创建mcp客户端
const mcpClient = new MultiServerMCPClient({
    mcpServers:{
        'my-mcp-server':{
            command:'node',
            args:["D:/DeskTop/AI-Agent/AIAgent/mini-cursor/mcp/mcp-tool/my-mcp-server.mjs"]
        },
    },
});    
// 获取工具
const tools = await mcpClient.getTools();
console.log(tools);
// 绑定工具到模型
const modelWithTools = model.bindTools(tools);

async function runAgentWithTools(query,maxInteration=30){
    const messages = [
        new HumanMessage(query)
    ];
    for(let i=0;i<maxInteration;i++){
        console.log(chalk.bgGreen('等待ai思考……'));
        const response = await modelWithTools.invoke(messages);
        messages.push(response); // assistant message  
        // 有工具调用 → content 为空
        // 无工具调用 → content 为最终答案
        if(!response.tool_calls || response.tool_calls.length === 0){
            console.log(`\n AI最终回复：\n ${response.content}`);
            return response.content;
        }

        console.log(chalk.bgBlue(`检测到${response.tool_calls.length}个工具调用`));
        console.log(chalk.bgBlue(`工具调用:${response.tool_calls.map(t=>t.name).join(', ')}`))
    
        for(const toolCall of response.tool_calls){
            const foundTool = tools.find(t => t.name === toolCall.name);
            if(foundTool){
                const toolResult = await foundTool.invoke(toolCall.args);
                messages.push(new ToolMessage({
                    content:toolResult,
                    tool_call_id:toolCall.id,
                }));
            }
        }
    }
    // 最终返回
    return messages[messages.length-1].content;
}

const result = await runAgentWithTools('查询用户001的信息');
console.log(result);
await mcpClient.close();