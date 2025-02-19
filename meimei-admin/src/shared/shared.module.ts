/*
 * @Author: Sheng.Jiang
 * @Date: 2021-12-08 16:44:29
 * @LastEditTime: 2022-01-19 13:29:18
 * @LastEditors: Sheng.Jiang
 * @Description: 公共模块
 * @FilePath: \meimei-admin\src\shared\shared.module.ts
 * You can you up，no can no bb！！
 */
import { SharedService } from './shared.service';
import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisModule } from '@nestjs-modules/ioredis';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ReponseTransformInterceptor } from 'src/common/interceptors/reponse-transform.interceptor';
import { OperationLogInterceptor } from 'src/common/interceptors/operation-log.interceptor';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { PermissionAuthGuard } from 'src/common/guards/permission-auth.guard';
import { RoleAuthGuard } from 'src/common/guards/role-auth.guard';
import { LogModule } from 'src/modules/monitor/log/log.module';
import { BullModule } from '@nestjs/bull';
import { DataScopeInterceptor } from 'src/common/interceptors/data-scope.interceptor';
import { DemoEnvironmentInterceptor } from 'src/common/interceptors/demo-environment.interceptor';
import { RepeatSubmitInterceptor } from 'src/common/interceptors/repeat-submit.interceptor';

@Global()
@Module({
    imports: [
        /* 连接mysql数据库 */
        TypeOrmModule.forRootAsync({
            useFactory: (configService: ConfigService) => ({
                autoLoadEntities: true,
                type: configService.get<any>('database.type'),
                host: configService.get<string>('database.host'),
                port: configService.get<number>('database.port'),
                username: configService.get<string>('database.username'),
                password: configService.get<string>('database.password'),
                database: configService.get<string>('database.database'),
                autoLoadModels: configService.get<boolean>('database.autoLoadModels'),
                synchronize: configService.get<boolean>('database.synchronize'),
                logging: configService.get('database.logging'),
            }),
            inject: [ConfigService]
        }),

        /* 连接redis */
        RedisModule.forRootAsync({
            useFactory: (configService: ConfigService) => configService.get<any>('redis'),
            inject: [ConfigService]
        }),
        /* 启用队列 */
        BullModule.forRootAsync({
            useFactory: async (configService: ConfigService) => ({
                redis: {
                    host: configService.get<string>('bullRedis.host'),
                    port: configService.get<number>('bullRedis.port'),
                }
            }),
            inject: [ConfigService]

        }),
        LogModule
    ],
    controllers: [],
    providers: [
        SharedService,

        //jwt守卫
        {
            provide: APP_GUARD,
            useClass: JwtAuthGuard,
        },

        // 角色守卫
        {
            provide: APP_GUARD,
            useClass: RoleAuthGuard,
        },

        // 权限守卫
        {
            provide: APP_GUARD,
            useClass: PermissionAuthGuard,
        },


        /* 操作日志拦截器 。 注：拦截器中的 handle 从下往上执行（ReponseTransformInterceptor ----> OperationLogInterceptor），返回值值依次传递 */
        {
            provide: APP_INTERCEPTOR,
            useClass: OperationLogInterceptor
        },
        /* 连续提交拦截器 */
        {
            provide: APP_INTERCEPTOR,
            useClass: RepeatSubmitInterceptor
        },
        /* 全局返回值转化拦截器 */
        {
            provide: APP_INTERCEPTOR,
            useClass: ReponseTransformInterceptor
        },
        /* 数据权限拦截器 */
        {
            provide: APP_INTERCEPTOR,
            useClass: DataScopeInterceptor
        },
        /* 是否开发演示环境拦截器 */
        {
            provide: APP_INTERCEPTOR,
            useClass: DemoEnvironmentInterceptor
        },
    ],
    exports: [
        SharedService,
    ]
})
export class SharedModule { }
