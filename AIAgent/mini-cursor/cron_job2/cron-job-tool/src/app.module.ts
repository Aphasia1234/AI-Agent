import { Module,OnApplicationBootstrap,Inject } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { User } from './users/entities/user.entity';
import { AiModule } from './ai/ai.module';
// 定时任务
import { CronJob } from 'cron';
// nest.js 定时任务模块
import { 
  CronExpression, // 定时时间表达式
  ScheduleModule, // 定时任务模块
  SchedulerRegistry // 定时任务注册表
} from '@nestjs/schedule';
import { JobModule } from './job/job.module';
import { Job } from './job/entities/job.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'Ray20040131!',
      database: 'hello',
      synchronize: true,// 是否自动同步数据库表结构
      connectorPackage: 'mysql2',// 数据库驱动程序包mysql2
      logging: true,// 是否开启日志记录
      entities:[User,Job]// 引入实体类

    }),
    UsersModule,
    AiModule,
    ScheduleModule.forRoot(),
    JobModule,
  ],
  controllers: [AppController],
  providers: [
    AppService
  ],
})
// 强制实现 OnApplicationBootstrap 接口，确保在应用启动时执行定时任务
export class AppModule implements OnApplicationBootstrap {
  @Inject(SchedulerRegistry)
  schedulerRegistry: SchedulerRegistry;
  async onApplicationBootstrap() {
     const job = new CronJob(CronExpression.EVERY_MINUTE,()=>{
      console.log('run cron job');
     });
     this.schedulerRegistry.addCronJob('job1',job);
     // 启动定时任务,但不会立即执行,直到下一次时间表达式匹配时(整分时)才会执行
     job.start();
     // 5秒后停止定时任务
     setTimeout(()=>{
       this.schedulerRegistry.getCronJob('job1').stop();
     },5000);
     
     const intervalRef = setInterval(()=>{
      console.log('run interval job');
     },1000);
     this.schedulerRegistry.addInterval('interval1',intervalRef);
     setTimeout(()=>{
      this.schedulerRegistry.deleteInterval('interval1');
     },5000);

     const timeoutRef = setTimeout(()=>{
      console.log('run timeout job');
     },3000);
     this.schedulerRegistry.addTimeout('timeout1',timeoutRef);
     setTimeout(()=>{
      this.schedulerRegistry.deleteTimeout('timeout1');
     },5000);
  }
}
