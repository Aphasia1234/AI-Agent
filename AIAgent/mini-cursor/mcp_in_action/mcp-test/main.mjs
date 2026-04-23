import 'dotenv/config';
import { MultiServerMCPClient } from '@langchain/mcp-adapters';
import { ChatOpenAI } from '@langchain/openai';
import {
    HumanMessage,
    SystemMessage,
    ToolMessage
} from '@langchain/core/messages';
import chalk from 'chalk';

const model = new ChatOpenAI({
    modelName: process.env.MODEL_NAME,
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL,
});

const mcpClient = new MultiServerMCPClient({
    mcpServers: {
     "amap-maps-streamableHTTP": {
        "url": `https://mcp.amap.com/mcp?key=${process.env.AMAP_API_KEY}`
    },
    // mcp 官方提供的文件系统工具，用于读写文件
    "filesystem":{
        "command":"npx",
        "args":[
            "-y",
            "@modelcontextprotocol/server-filesystem",
            "D:/DeskTop/AI-Agent/AIAgent/mini-cursor/mcp_in_action/mcp-test"
        ]
    },
    "chrome-devtools":{
        "command":"npx",
        "args":[
            "-y",
            // 官方提供的chrome devtools工具，用于操作chrome浏览器
            "chrome-devtools-mcp@latest"
        ]
    }
  }
})

const tools = await mcpClient.getTools();
const modelWithTools = model.bindTools(tools);

async function runAgentWithTools(query,maxInteration=30){
    const messages = [
        new HumanMessage(query)
    ];
    for(let i=0;i<maxInteration;i++){
        console.log(chalk.bgGreen('等待ai思考……'));
        const response = await modelWithTools.invoke(messages);
        messages.push(response); // assistant message  
        
        if(!response.tool_calls || response.tool_calls.length === 0){
            console.log(`\n AI最终回复：\n ${response.content}`);
            return response.content;
        }
        for(const toolCall of response.tool_calls){
            const foundTool = tools.find(t => t.name === toolCall.name);
            if(foundTool){
                const toolResult = await foundTool.invoke(toolCall.args);
                let contentStr;
                if(typeof toolResult === 'string'){
                    contentStr = toolResult;
                }else{
                    contentStr = JSON.stringify(toolResult);
                }
                messages.push(new ToolMessage({
                    content:contentStr,
                    tool_call_id:toolCall.id,
                }));
            }
        }
    }
}
// await runAgentWithTools('南昌高铁站附近酒店');
// await runAgentWithTools(`抚州到南昌的路线保存文档到D:/DeskTop 的一个md文件`);
 await runAgentWithTools(`
     北京南站附近的3个酒店，拿到酒店图片，打开浏览器，展示每个酒店的图片，每个tab一个url展示，并且把那个页面标题改为酒店名
     `);
await mcpClient.close();