import { 
    Injectable,
    Inject,
    Logger, // 日志记录器
    OnApplicationBootstrap, // 应用启动时调用
    NotFoundException
 } from '@nestjs/common';
 import { SchedulerRegistry } from '@nestjs/schedule';
 import { CronJob } from 'cron';
 // 数据库实体管理器
 import { EntityManager } from 'typeorm';
 import { Job } from './entities/job.entity';

@Injectable()
export class JobService implements OnApplicationBootstrap {
    private readonly logger = new Logger(JobService.name);
    @Inject(EntityManager)
    private readonly entityManager: EntityManager;

    @Inject(SchedulerRegistry)
    private readonly schedulerRegistry: SchedulerRegistry;

    async onApplicationBootstrap() {
        console.log('JobService onApplicationBootstrap');
        const enabledJob = await this.entityManager.find(Job, { where: { isEnabled: true } });
        console.log(enabledJob);
    }

    async addJob(
        input:
        | {type : 'cron';instruction:string;cron:string; isEnabled?:boolean}
        | {type : 'every';instruction:string;everyMs:number; isEnabled?:boolean}
        | {type : 'at';instruction:string;at:Date; isEnabled?:boolean}
    ){
        const entity = this.entityManager.create(Job, {
            instruction: input.instruction,
            type: input.type,
            cron:input.type === 'cron' ? input.cron : null,
            everyMs:input.type === 'every' ? input.everyMs : null,
            at:input.type === 'at' ? input.at : null,
            isEnabled:input.isEnabled ?? true,
            lastRun:null
        });

        const saved = await this.entityManager.save(Job,entity);
        if(saved.isEnabled){
            await this.startRunTime(saved);
        }
        return saved;
    }
    private async startRunTime(job:Job){
        if(job.type === 'cron'){
            const cronJobs = this.schedulerRegistry.getCronJobs();
            const existing = cronJobs.get(job.id);
            if(existing){
                existing.start();
                return;
            }
            const runtimeJob = this.createCronJob(job);
            this.schedulerRegistry.addCronJob(job.id, runtimeJob);
        }
    }
    private createCronJob(job:Job){
        const cronExpr = job.cron ?? '';

        return new CronJob(cronExpr, async ()=>{
            this.logger.log(`run job ${job.id},${job.instruction}`);
            await this.entityManager.update(Job,job.id,{lastRun:new Date()});
        });
    }
}
