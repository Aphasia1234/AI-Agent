import {
    readFileTool,
    writeFileTool,
    execCommandTool,
    listDirectoryTool
} from './all_tools.mjs';

import 'dotenv/config';
import {ChatOpenAI} from '@langchain/openai';
import {
    HumanMessage,
    SystemMessage,
    ToolMessage
} from '@langchain/core/messages';
import chalk from 'chalk'; // 用于在控制台输出彩色文本

const model = new ChatOpenAI({
    modelName:process.env.MODEL_NAME,
    apiKey: process.env.OPENAI_API_KEY,
    temperature: 0,
    configuration:{
        baseURL: process.env.OPENAI_BASE_URL
    }
});

const tools = [
    readFileTool,
    writeFileTool,
    execCommandTool,
    listDirectoryTool
]
// 将工具集成到模型中
const modelWithTools = model.bindTools(tools);
async function runAgentWithTools(query,maxIterations = 30) {
    // 检测任务完成情况
    // 不用tool
    // 在用tool llm还在自动进行中
    const messages = [
        new SystemMessage(`
            你是一个项目管理助手，使用工具完成任务。
            当前工作目录：${process.cwd()})
            
            工具：
            1.read_file:读取文件
            2.write_file:写入文件
            3.exec_command:执行命令(支持workingDirectory参数)
            4.list_directory:列出目录

            重要规则 - execute_command：
            - workingDirectory 参数会自动切换到指定目录
            - 当使用workingDirectory参数时，不要在command中使用cd 命令
            - 错误示例：{ command:"cd react-todo-app && pnpm install", workingDirectory: "react-todo-app" }
              这是错误的！因为workingDirectory已经切换到react-todo-app了，再cd react-todo-app 会找不到目录。
            - 正确示例：{ command:"pnpm install", workingDirectory: "react-todo-app" }
              这样就对了！workingDirectory切换到react-todo-app后，直接执行pnpm install 就可以了。

              回复要简洁，只说做了什么
            `),
            new HumanMessage(query)
    ];
    // 循环是agent的核心，
    // agent会不断地根据当前的对话状态来决定下一步是调用工具还是继续对话，
    // 直到完成任务或者达到最大迭代次数
    // llm 思考、规划、调整 不断迭代 直到任务完成，更加智能化
    for(let i=0;i<maxIterations;i++){
        console.log(chalk.bgGreen('⏳正在等待AI思考...'));
        const response = await modelWithTools.invoke(messages);
        messages.push(response);
       // console.log(response);
        if(!response.tool_calls || response.tool_calls.length === 0){
            console.log(`\n AI最终回复:\n${response.content}\n`);
            return response.content;
        }
        for(const toolCall of response.tool_calls){
            const foundTool = tools.find(tool => tool.name === toolCall.name);
            if(foundTool){
                const toolResult = await foundTool.invoke(toolCall.args);
                messages.push(new ToolMessage({
                    content:toolResult,
                    tool_call_id:toolCall.id
                }));
            }
        }
    }
    return messages[messages.length-1].content;
}

const case1 = `
创建一个功能丰富的React TodoList应用，要求如下：

1.创建项目：echo -e "n\nn" | pnpm create vite react-todo-app --template react-ts
2.修改 src/App.tsx，实现功能完整的TodoList:
- 添加、删除、编辑、标记完成
- 分类筛选（全部/进行中/已完成）
- 统计信息显示
- LocalStorage持久化
3.添加复杂样式:
- 渐变背景(蓝到紫)
- 卡片阴影、圆角
- 悬停效果
4.添加动画
- 添加/删除时的过渡动画
- 使用CSS transitions
5. 列出目录确认

注意：使用pnpm，功能要完整，样式要美观，要有动画效果

之后在 react-todo-app 项目中：
1.使用 pnpm install 安装依赖
2.使用 pnpm run dev 启动开发服务器
`;
try {
    await runAgentWithTools(case1);
} catch (error){
    console.error(`\n错误: ${error.message}`);
}