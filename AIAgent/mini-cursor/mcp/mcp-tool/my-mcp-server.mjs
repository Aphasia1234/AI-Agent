// B/S架构 Web程序
// C/S 架构 桌面程序
// mcp 协议 通信协议
// mcp client -> cursor/trae
// mcp server  -> my-mcp-server.mjs
// 可以在cursor或者trae中添加这个mcp扩展

// Cursor/Trae (MCP Client) 
//     ↓ (通过 stdio 通信)
// my-mcp-server.mjs (MCP Server)
//     ↓ (查询)
// database (内存数据库)

// 引入mcp server 类 用于创建mcp服务器
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
// mcp server 通过标准输入输出进行通信 与cursor/trae进行通信
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
//import { UriTemplate } from '@modelcontextprotocol/sdk/dist/esm/shared/uriTemplate';
import { z } from 'zod';

// tool 数据服务
const database = {
    users: {
        "001":{id:"001",name:"张三",email:"zhangsan@example.com",role:"admin"},
        "002":{id:"002",name:"李四",email:"lisi@example.com",role:"user"},
        "003":{id:"003",name:"王五",email:"wangwu@example.com",role:"user"},
    }
}
// 注册mcp工具
const server = new McpServer({
    name:'my-mcp-server',
    version:'1.0.0',
});
// 注册查询用户工具
server.registerTool('query-user',{
    description:'查询数据库中的用户信息。输入用户ID，返回用户的详细信息(姓名、邮箱、角色等)。',
    inputSchema:{
        userId:z.string().describe('用户ID,例如: "001"')
    }
},async ({userId})=>{
    const user = database.users[userId];
    if(!user){
        return {
            content:[
                {
                    type:'text',
                    text:'用户不存在',
                }
            ]
        }
    }
    return {
        content:[
            {
                type:'text',
                text:`用户信息:\n- ID: ${user.id}\n- 姓名: ${user.name}\n- 邮箱: ${user.email}\n- 角色: ${user.role}`,
            }
        ]
    }
})

// 注册资源:使用指南
server.registerResource('使用指南','docs://guide',{
    description:'MCP工具使用指南，包含工具的基本介绍、参数说明、调用示例等。',
    mimeType:'text/plain',
},async ()=>{
    return {
        content:[
            {
                uri:'docs://guide',
                mimeType:'text/plain',
                text:'使用指南:\n- 工具介绍: 本MCP服务器提供查询用户信息的工具。\n- 参数说明: userId - 用户ID，例如: "001"。\n- 调用示例: {"method":"callTool","params":{"name":"query-user","arguments":{"userId":"001"}}}',
            }
        ]
    }
})

// 连接方式 本地进程调用
const transport = new StdioServerTransport();
await server.connect(transport);
