import pinoHttp from 'pino-http';

import { logger } from '../lib/logger';

export const requestLogger = pinoHttp({
    logger,
    autoLogging: true,
    customLogLevel: (_req, res, err) => {
        if (err) return 'error';
        const status = res.statusCode;
        if (status >= 500) return 'error';
        if (status >= 400) return 'warn';
        return 'info';
    }
});

