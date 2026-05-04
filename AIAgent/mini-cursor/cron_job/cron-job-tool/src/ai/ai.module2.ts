import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { ChatOpenAI } from '@langchain/openai';
import { ConfigService } from '@nestjs/config';

@Module({
  controllers: [
    AiController
  ],
  providers: [
    AiService,
    // provide 动态创建
    // 将model 从逻辑中剥离出来
    // LLM 作为 provide 提供
    // 工厂模式
    {
      provide: 'CHAT_MODEL',
      useFactory:(configService:ConfigService)=>{
        return new ChatOpenAI({
          model : configService.get('MODEL_NAME'),
          apiKey : configService.get('OPENAI_API_KEY'),
          configuration:{
            baseURL: configService.get('OPENAI_API_URL'),
            }
       })
      },
      inject:[ConfigService]
    }
  ],
})
export class AiModule {}