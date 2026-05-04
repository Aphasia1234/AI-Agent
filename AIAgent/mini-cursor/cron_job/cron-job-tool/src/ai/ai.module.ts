import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { ChatOpenAI } from '@langchain/openai';
import { ConfigService } from '@nestjs/config';
import { UserService } from './user.service';
import { z } from 'zod';
import { tool } from '@langchain/core/tools';

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
    },
    UserService,
    {
        provide:'QUERY_USER_TOOL',
        useFactory:(userService:UserService) =>{
            const queryUserArgsSchema = z.object({
                userId:z.string().describe('用户ID'),
            });
            return tool(
                async ({userId}:{userId:string}) =>{
                    const user = userService.findOne(userId);
                    if(!user){
                        const availableIds = userService 
                            .findAll()
                            .map(u=>u.id)
                            .join(',');
                        return `用户 ${userId} 不存在，可用用户ID：${availableIds}`;
                    }
                        return `用户信息:\n-ID ${user.id} \n- 姓名 ${user.name}
                        \n- 邮箱 ${user.email}
                        \n- 角色 ${user.role}
                        `;
                },
                {
                    name:'query_user',
                    description:'查询数据库中的用户信息。输入用户ID，返回该用户的详细信息(姓名、邮箱、角色)。',
                    schema:queryUserArgsSchema
                }
            )
        },
        inject:[UserService]
    }
  ],
})
export class AiModule {}