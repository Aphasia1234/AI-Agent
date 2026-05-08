import { Module, forwardRef } from '@nestjs/common';
import { LllmService } from './llm.service';
import { WebSearchToolService } from './web-search-tool.service';
// import { SendMailToolService } from './send-mail-tool.service';
import { DbUsersCrudToolService } from './db-users-crud-tool.service';
import { UsersModule } from 'src/users/users.module';
import { SendMailToolService } from './send-mail-tool.service';
import { TimeNowToolService } from './time-now-tool.service';
import { CronJobToolService } from './cron-job-tool.service';
import { JobModule } from 'src/job/job.module';

@Module({
    imports: [UsersModule, forwardRef(() => JobModule)],
    providers: [
        LllmService, // 提供llm 服务
        WebSearchToolService,
        DbUsersCrudToolService,
        SendMailToolService,
        TimeNowToolService,
        CronJobToolService,
        {
            provide: 'DB_USERS_CRUD_TOOL',
            useFactory: (dbUsersCrudToolService: DbUsersCrudToolService) => dbUsersCrudToolService.tool,
            inject:[DbUsersCrudToolService]
        },
        {
            provide: 'WEB_SEARCH_TOOL',
            useFactory: (webSearchToolService: WebSearchToolService) => webSearchToolService.tool,
            inject:[WebSearchToolService]
        },
        { // 自定义的注入项
            provide: 'CHAT_MODEL',
            // 
            useFactory: (llmService: LllmService) => llmService.getModel(),
            inject: [LllmService]
        },
        {
            provide: 'SEND_MAIL_TOOL',
            useFactory: (sendMailToolService: SendMailToolService) => sendMailToolService.tool,
            inject:[SendMailToolService]
        },
        {
            provide: 'TIME_NOW_TOOL',
            useFactory: (timeNowToolService: TimeNowToolService) => timeNowToolService.tool,
            inject:[TimeNowToolService]
        },
        {
            provide: 'CRON_JOB_TOOL',
            useFactory: (cronJobToolService: CronJobToolService) => cronJobToolService.tool,
            inject:[CronJobToolService]
        }
    ],
    exports: [
        'CHAT_MODEL',
        'WEB_SEARCH_TOOL',
        'DB_USERS_CRUD_TOOL',
        'SEND_MAIL_TOOL',
        'TIME_NOW_TOOL',
        'CRON_JOB_TOOL'
    ],
})
export class ToolModule {}
