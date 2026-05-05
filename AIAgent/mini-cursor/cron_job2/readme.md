# cron job Agent

- openclaw 自动化任务
  每天早上九点将最新的AI新闻发送到我的邮箱

- mysql
  psql 激进 配置 支持 vector 向量数据库存储
  关系型数据库 mysql oracle

  create database hello

- ORM 
  Object Relational Mapping  对象关系映射
  
  - Prisma
  - TypeORM

- 创建了项目
  nest new cron-job-tool
  npm i @nestjs/typeorm typeorm mysql2
  mysql2 是数据库驱动程序
  typeorm + @nestjs/typeorm  orm typeorm 作为nestjs 插件启动
- nest g resource users --no-spec
  创建一个users 模块

## 定时任务
cron 表达式

7 12 13 10 * *
秒 分 时 日 月 周
每月10号下午1:12:07执行一次
* 每个
？ 忽略

多种类型的cron job  openclaw 自动化，定时任务非常有需要