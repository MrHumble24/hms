import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../prisma/prisma.service.js';
import { LogLevel } from '@prisma/client';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP');

  constructor(private prisma: PrismaService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const { ip, method, originalUrl } = req;
    const userAgent = req.get('user-agent') || '';
    const start = Date.now();

    res.on('finish', () => {
      const { statusCode } = res;
      const contentLength = res.get('content-length');
      const duration = Date.now() - start;
      const message = `${method} ${originalUrl} ${statusCode} ${contentLength} - ${duration}ms | ${userAgent} ${ip}`;

      this.logger.log(message);

      // Persist to DB asynchronously
      this.prisma.systemLog
        .create({
          data: {
            level: statusCode >= 400 ? LogLevel.ERROR : LogLevel.INFO,
            context: 'HTTP',
            message: `${method} ${originalUrl} ${statusCode}`,
            metadata: {
              method,
              url: originalUrl,
              statusCode,
              contentLength,
              duration,
              userAgent,
              ip,
              timestamp: new Date().toISOString(),
            },
          },
        })
        .catch((err) => {
          this.logger.error('Failed to persist log to DB', err);
        });
    });

    next();
  }
}
