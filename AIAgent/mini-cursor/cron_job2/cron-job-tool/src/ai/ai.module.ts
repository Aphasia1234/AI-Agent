import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { UsersModule } from '../users/users.module';
import { UsersService } from '../users/users.service';
import { z } from 'zod';
import { tool } from '@langchain/core/tools';

@Module({
  imports: [UsersModule],
  controllers: [AiController],
  providers: [
    AiService,
    {
      provide: 'DB_USERS_CRUD_TOOL',
      useFactory: (usersService: UsersService) => {
        const dbUsersCrudArgsSchema = z.object({
          action: z
            .enum(['create', 'list', 'get', 'update', 'delete'])
            .describe('要执行的操作:create/list/get/update/delete'),
          id: z
            .number()
            .int()
            .positive()
            .optional()
            .describe('用户ID(get/update/delete时需要)'),
          name: z
            .string()
            .min(1)
            .max(50)
            .optional()
            .describe('用户名(create/update时可用)'),
          email: z
            .string()
            .email()
            .max(50)
            .optional()
            .describe('用户邮箱(create/update时可用)'),
        });

        return tool(
          async ({
            action,
            id,
            name,
            email,
          }: {
            action: 'create' | 'list' | 'get' | 'update' | 'delete';
            id?: number;
            name?: string;
            email?: string;
          }) => {
            switch (action) {
              case 'create': {
                if (!name || !email) {
                  return 'create操作需要同时提供name和email参数';
                }
                const created = await usersService.create({ name, email });
                return `创建用户成功: ID:${created.id}, 用户名:${created.name}, 邮箱:${created.email}`;
              }

              case 'list': {
                const users = await usersService.findAll(); // 假设有此方法
                if (users.length === 0) {
                  return '暂无用户数据';
                }
                return users.map(u => `ID:${u.id}, 用户名:${u.name}, 邮箱:${u.email}`).join('\n');
              }

              case 'get': {
                if (!id) {
                  return 'get操作需要提供id参数';
                }
                const user = await usersService.findOne(id); // 假设有此方法
                if (!user) {
                  return `未找到ID为${id}的用户`;
                }
                return `用户信息: ID:${user.id}, 用户名:${user.name}, 邮箱:${user.email}`;
              }

              case 'update': {
                if (!id) {
                  return 'update操作需要提供id参数';
                }
                const updateData: any = {};
                if (name) updateData.name = name;
                if (email) updateData.email = email;

                if (Object.keys(updateData).length === 0) {
                  return 'update操作需要提供name或email参数';
                }

                // 执行更新操作
                await usersService.update(id, updateData);

                // 重新查询获取更新后的用户数据
                const updatedUser = await usersService.findOne(id);
                if (!updatedUser) {
                  return `更新成功，但无法获取ID为${id}的用户信息`;
                }

                return `更新用户成功: ID:${updatedUser.id}, 用户名:${updatedUser.name}, 邮箱:${updatedUser.email}`;
              }

              case 'delete': {
                if (!id) {
                  return 'delete操作需要提供id参数';
                }
                await usersService.remove(id); // 假设有此方法
                return `成功删除ID为${id}的用户`;
              }

              default:
                return `不支持的操作: ${action}`;
            }
          },
          {
            name: 'db_users_crud',
            description: `对数据库users表执行增删改查操作。通过action字段选择create/list/get/update/delete，并按需提供id、name、email等参数`,
            schema: dbUsersCrudArgsSchema,
          }
        );
      },
      inject: [UsersService], // 重要：注入依赖
    },
  ],
})
export class AiModule { }