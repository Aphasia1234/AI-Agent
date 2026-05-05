import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AiModule } from './ai/ai.module';
import {
  ConfigModule,
  ConfigService
} from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { MailerModule } from '@nestjs-modules/mailer';


@Module({
  imports: [
    AiModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env'
    }),
    // 静态服务器
    ServeStaticModule.forRoot({
        rootPath: join(__dirname,"..", 'public')
    }),
    // 邮件服务 async 会等待配置完成后再启动
    MailerModule.forRootAsync({
      inject: [ConfigService],
      useFactory:(configService: ConfigService)=>({
            transport: {
              host: configService.get('MAIL_HOST'),
              port: Number(configService.get('MAIL_PORT')),
              secure:configService.get<string>('MAIL_SECURE')==='true',
              auth: {
                user: configService.get<string>('MAIL_USER'),
                pass: configService.get<string>('MAIL_PASS'),
              },
              defaults:{
                from: configService.get<string>('MAIL_FROM'),
              }
            }
      })
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
