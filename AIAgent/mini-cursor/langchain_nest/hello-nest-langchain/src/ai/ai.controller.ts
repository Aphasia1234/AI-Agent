import { Controller, Get, Query } from '@nestjs/common';
import { AiService } from './ai.service';

@Controller('ai')
export class AiController {
  // 依赖注入：让 NestJS 自动创建 AiService 实例并注入到控制器中。
  constructor(private readonly aiService: AiService) {}

  @Get('chat')
  async chat(@Query('query') query:string){
    const answer = await this.aiService.runChain(query);
    return {
      answer
    }
}
}


