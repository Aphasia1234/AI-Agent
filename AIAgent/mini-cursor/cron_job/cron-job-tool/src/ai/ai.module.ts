import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { ChatOpenAI } from '@langchain/openai';
import { ConfigService } from '@nestjs/config';
import { UserService } from './user.service';
import { z } from 'zod';
import { tool } from '@langchain/core/tools';
import { MailerService } from '@nestjs-modules/mailer';

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
    },
    {
      provide:'SEND_EMAIL_TOOL',
      useFactory:(mailerService:MailerService,configService:ConfigService)=>{
         const sendEmailArgsSchema = z.object({
            // zod 是大模型tool 工作的工程化保障之一
            to:z.email().describe('收件人邮箱地址，例如：test@example.com'),
            subject:z.string().describe('邮件主题'),
            text:z.string().describe('邮件内容 可选'),
            html:z.string().describe('邮件内容（HTML格式） 可选'),
        });
        return tool(
          async ({to,subject,text,html}: {
            to:string;
            subject:string;
            text?:string;
            html?:string;
          }) => {
            const fallbackFrom = configService.get<string>('MAIL_FROM');
            await mailerService.sendMail({
                to,
                subject,
                // ?? 是空值合并运算符，如果text 为空，就用'(无文本内容)'
                text: text ?? '(无文本内容)',
                html: html ?? `<p>${text ?? '(无文本内容)'}</p>`,
                from: fallbackFrom,
            });
            return `邮件发送成功，收件人：${to}，主题：${subject}`;
          },
          {
            name:'send_email',
            description:'发送邮件。输入收件人邮箱、主题、可选的文本内容和HTML内容，返回发送结果。',
            schema:sendEmailArgsSchema
          }
        )
      },
      inject:[MailerService,ConfigService]
    },
    {
      provide:'WEB_SEARCH_TOOL',
      useFactory:(configService:ConfigService) =>{
                const webSearchArgsSchema = z.object({
                  query:z
                    .string()
                    .min(1)
                    .describe('搜索关键词'),
                  count:z
                    .number()
                    .int()
                    .min(1)
                    .max(20)
                    .optional()
                    .describe('返回结果数量，默认10条')
                });
                return tool(
                  async ({query,count}: {query:string;count?:number}) =>{
                    const apiKey = configService.get<string>('BOCHA_API_KEY');
                    if(!apiKey){
                        return 'Bocha API Key 未配置，请联系管理员。';
                    }
                    const url = 'https://api.bochaai.com/v1/web-search';
                    const body = {
                      query,
                      freshness:'noLimit',
                      summary:true,
                      count:count ?? 10
                    }
                    const response = await fetch(url,{
                      method:'POST',
                      headers:{
                        'Authorization':`Bearer ${apiKey}`,
                        'Content-Type':'application/json',
                      },
                      body:JSON.stringify(body),
                    });
                    if(!response.ok){
                        const errorText = await response.text();
                        return `搜索失败,错误信息：${errorText}，状态码：${response.status}`
                    }
                    let json:any;
                    try{
                      json = await response.json();
                      //console.log('完整API响应:', JSON.stringify(json, null, 2));
                    } catch (error) {
                      return `搜索API失败：${error}`
                    }

                    try {
                      if(json.code!==200 || !json.data){
                        return `搜索失败,错误信息：${json.message || '未知错误'}`
                      }
                      const webpages = json.data.webPages?.value ?? [];
                      if(!webpages.length){
                         return '搜索结果为空'
                      }
                      const formatted = webpages
                         .map(
                          (page:any,idx:number) =>
                            `引用:${idx+1}
                          标题:${page.name}
                          URL:${page.url}
                          摘要:${page.summary}
                          网站名称:${page.siteName}
                          图标:${page.siteIcon}
                          时间:${page.dateLastCrawled}
                          `
                         )
                         .join('\n\n');
                      return formatted;
                    } catch (error) {
                      return `搜索结果格式错误：${error}`
                    }
                  },
                  {
                    name:'web_search',
                    description:`使用Bocha Web Search API 搜索互联网网页。输入为搜索关键词
                    (可选count 指定结果数量),返回包含标题，URL，摘要，网站名称，图标和时间等信息的结果列表`,
                    schema:webSearchArgsSchema
                  }
                )
      },
      inject:[ConfigService]
    }
  ],
})
export class AiModule {}