import { Injectable, Inject } from '@nestjs/common';
import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import type { Runnable } from '@langchain/core/runnables';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AiService {
    // 链式调用
    private readonly chain:Runnable;

    constructor(@Inject(ConfigService) configService: ConfigService) {
        const prompt = PromptTemplate.fromTemplate(`
              请回答以下问题:\n\n{query}
            `);
        const model = new ChatOpenAI({
            temperature: 0.5,
            modelName:configService.get('MODEL_NAME'),
            apiKey:configService.get('OPENAI_API_KEY'),
            configuration:{
                baseURL:configService.get('OPENAI_BASE_URL')
            }
        });
        this.chain = prompt.pipe(model).pipe(new StringOutputParser());
    }
    // 方法天然就是类的成员，不需要像属性那样先声明再使用。
    // async 的作用是让函数返回 Promise，即使函数内部没有 await。
    async runChain(query:string):Promise<string>{
         return this.chain.invoke({query});
    }
}