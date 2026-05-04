import { Controller, Get, Query, Sse } from '@nestjs/common';
import { AiService } from './ai.service';
import {
  from,
  Observable
} from 'rxjs';
import {map} from 'rxjs/operators';


@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

//   @Get('chat')
// async chat(@Query('query') query:string){
//     const answer = await this.aiService.runChain(query);
//     return {
//       answer
//     }
//   }
  // 装饰器模式
  // server-sent-events
  // Content-Type: text/event-stream
  // Cache-Control: no-cache  别缓存
  // Connection: keep-alive  保持连接
  // Transfer-Encoding: chunked  分块传输
  @Sse('chat/stream')
  chatStream(@Query('query') query:string):Observable<MessageEvent>{
    const stream = this.aiService.runChainStream(query);
    // 将 llm stream 转换为 observable 对象
    return from(stream)
       .pipe(
        map((chunk)=>({
          // 前端需要解析 data 字段，才能显示在页面上
            data: chunk
        }))
       ) as Observable<MessageEvent>
  }
}
