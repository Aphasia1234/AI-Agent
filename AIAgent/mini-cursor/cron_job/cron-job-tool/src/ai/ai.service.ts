import { Injectable, Inject } from '@nestjs/common';
import { ChatOpenAI } from '@langchain/openai';
import { Runnable } from '@langchain/core/runnables';
import { 
    BaseMessage, 
    AIMessage, 
    SystemMessage,
    HumanMessage, 
    ToolMessage, 
    AIMessageChunk 
} from '@langchain/core/messages';



@Injectable()
export class AiService {
    // Runnable 是langchain 中的一个接口，表示一个可运行的对象
    // BaseMessage[] 是langchain 中的一个基类，表示一个数组
    // AIMessage HumanMessage ToolMessage 是langchain 中的一个子类，表示一个消息
    // 输入的类型约束 BaseMessage[]
    // 输出的类型约束 AIMessage
    private readonly modelWithTools: Runnable<BaseMessage[],AIMessage>;
    // 将LLM和业务逻辑分离 ，因为LLM变化太快
    // 注入了provide 的model
    constructor(@Inject('CHAT_MODEL') model:ChatOpenAI,
    @Inject('QUERY_USER_TOOL') private readonly queryUserTool:any,
  ){
        this.modelWithTools = model.bindTools([
            this.queryUserTool
        ]);
    }
    // 同步调用 llm  完全生成后再返回
    // async runChain(query:string):Promise<string>{

    // }
    // 流式调用 llm 边生成边返回
    // generator 生成器函数
    async *runChainStream(query:string):AsyncIterable<string>{
      const messages:BaseMessage[] = [
        new SystemMessage(`你是一个智能助手，可以在需要时调用工具(如(query_user)来
            查询用户信息，再用结果回答用户问题。
            `),
        new HumanMessage(query),
      ];
      // agent loop
      while(true){
        const stream = await this.modelWithTools.stream(messages);
        let fullAIMessage:AIMessageChunk | null = null;
        // as 类型断言
        for await (const chunk of stream as AsyncIterable<AIMessageChunk>){
          fullAIMessage = fullAIMessage ? fullAIMessage.concat(chunk) : chunk;
          const hasToolCallChunk = !!fullAIMessage.tool_call_chunks && 
          fullAIMessage.tool_call_chunks.length > 0;
          if(!hasToolCallChunk){
            yield chunk.content as string;
        }
      }
      if(!fullAIMessage){
        return;
      }
      // stream , chunk 且不是 tool yield 直接返回
      // stream 结束， 一条完整的AIMessage
      messages.push(fullAIMessage);
      const toolCalls = fullAIMessage.tool_calls ?? [];
      if(!toolCalls.length){
        return;
      }
      for(const toolCall of toolCalls){
        const toolCallId = toolCall.id || '';
        const toolName = toolCall.name;
        if(toolName === 'query_user'){
            const result = await this.queryUserTool.invoke(toolCall.args);
            messages.push(
                new ToolMessage({
                    content:result,
                    name:toolName,
                    tool_call_id:toolCallId,
                })
            )
        }
      }
    }
  }
}