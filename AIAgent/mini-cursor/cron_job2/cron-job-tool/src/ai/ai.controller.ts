import { Controller,Sse,Query } from '@nestjs/common';
import { AiService } from './ai.service';
// rxjs 流式响应
import { Observable,from } from 'rxjs';
// map 映射
import { map } from 'rxjs/operators';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}
   // const url = `/ai/chat/stream?query=${encodeURIComponent(query)}`;
   //  es = new EventSource(url);
  @Sse('chat/stream')
  chatStream(@Query('query') query: string): Observable<MessageEvent> {
    const stream = this.aiService.runChainStream(query);
    return from(stream)
      .pipe(map((chunk) => ({
        data: chunk
      }))) as Observable<MessageEvent>;
  }
}
