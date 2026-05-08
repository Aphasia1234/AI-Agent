import { 
    Inject,  // 注入依赖
    Injectable  // 注入服务
} from '@nestjs/common'
import {
    ConfigService
} from '@nestjs/config';
import {
    MailerService
} from '@nestjs-modules/mailer'
import { tool } from '@langchain/core/tools';
import { z } from 'zod';

@Injectable()
export class SendMailToolService {
    readonly tool;

    @Inject(MailerService)
    private readonly mailerService: MailerService;

    @Inject(ConfigService)
    private readonly configService: ConfigService;

    constructor() {
        const sendMailArgsScema = z.object({
            to: z.email().describe('收件人邮箱地址，例如：someone@example.com'),
            subject: z.string().describe('邮件主题'),
            text: z.string().optional().describe('纯文本内容, 可选'),
            html: z.string().optional().describe('HTML 内容, 可选')
        });

        this.tool = tool(
            async ({
                to,
                subject,
                text,
                html
            }: {
                to: string;
                subject: string;
                text?: string;
                html?: string;
            }) => {
                const fallbackForm = this.configService.get<string>('MAIL_FROM');
                await this.mailerService.sendMail({
                    to,
                    subject,
                    text: text ?? '(无文本内容)',
                    html: html ?? `<p>${text ?? '(无HTML内容)'}</p>`,
                    from: fallbackForm  
                });
                return `邮件发送成功，收件人: ${to}，主题: ${subject}`;
            },
            {
                name: 'send_mail',
                description:'发送电子邮件，需要提供收件人邮箱、主题，可选文本内容和HTML内容。',
                schema: sendMailArgsScema
            }
        )
    }
}
