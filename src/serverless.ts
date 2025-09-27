import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Server } from 'http';

let cachedServer: Server;

export default async function handler(req: any, res: any) {
    if (!cachedServer) {
        const app = await NestFactory.create(AppModule);
        await app.init();
        cachedServer = app.getHttpAdapter().getInstance();
    }
    return cachedServer.emit('request', req, res);
}
