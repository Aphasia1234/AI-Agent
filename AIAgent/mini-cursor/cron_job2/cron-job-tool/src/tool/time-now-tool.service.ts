// 获取当前时间 
import { Injectable } from '@nestjs/common';
import { tool } from '@langchain/core/tools';
import {z} from 'zod'

@Injectable()
export class TimeNowToolService {
    readonly tool;

    constructor() {
        this.tool = tool(
            async ({ timezone }: { timezone: string }) => {
                const now = new Date();
                const local = now.toLocaleString('zh-CN', { timeZone: timezone, hour12: false });
                return `时区[${timezone}]：${local} | UTC：${now.toISOString()} | 时间戳：${now.getTime()}`;
            }, {
                name: 'time_now',
                description: `获取当前服务器时间，返回ISO 字符串(iso) 和毫秒级时间戳(timestamp)，返回当前服务器日期时间，当你需要知道现在几点、今天几号、
  当前时间戳时必须调用此工具` ,
                schema: z.object({
                timezone: z.string().describe('时区，如 Asia/Shanghai')
                }),
            }
        )
    }
}