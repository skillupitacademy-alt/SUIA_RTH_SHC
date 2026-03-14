import { put } from '@vercel/blob';

import { logger } from '@/lib/logger';
import { redis } from '@/lib/redis';
import { withSpan } from '@/lib/tracer';

import { ExportAggregator } from './exportAggregator';
import { ExportQueryBuilder } from './exportQueryBuilder';
import type { ExportFormat, ExportPayload } from './exportTypes';
import { CsvFormatter } from './formatters/csvFormatter';
import { JsonFormatter } from './formatters/jsonFormatter';

export class ExportEngine {
  private static instance: ExportEngine;
  private log = logger.child({ module: 'export-engine' });
  private queryBuilder = new ExportQueryBuilder();
  private aggregator = new ExportAggregator();
  private jsonFormatter = new JsonFormatter();
  private csvFormatter = new CsvFormatter();

  private constructor() {}

  static getInstance(): ExportEngine {
    if (ExportEngine.instance == null) {
      ExportEngine.instance = new ExportEngine();
    }
    return ExportEngine.instance;
  }

  async processExport(examId: string, userId: string, format: ExportFormat): Promise<string> {
    return withSpan('ExportEngine.processExport', async (span) => {
      span.setAttribute('examId', examId);
      span.setAttribute('userId', userId);
      span.setAttribute('format', format);

      this.log.info({ examId, userId, format }, 'Starting analytical export process');

      const cacheKey = `export:${examId}:${userId}:${format}`;
      try {
        const cachedUrl = await redis.get<string>(cacheKey);
        if (typeof cachedUrl === 'string' && cachedUrl.trim() !== '') {
          this.log.info({ examId, userId, format }, 'Export cache hit');
          return cachedUrl;
        }
      } catch (error: unknown) {
        this.log.warn({ err: error, examId, userId }, 'Export cache read failed');
      }

      // 1. Fetch Data
      const [meta, currentRows, historicalRows] = await Promise.all([
        this.queryBuilder.fetchUserMeta(examId),
        this.queryBuilder.fetchRawAttempts(examId),
        this.queryBuilder.fetchHistoricalAttempts(userId, examId)
      ]);

      // 2. Aggregate
      const [aggregations, historicalProgress] = await Promise.all([
        this.aggregator.buildAggregations(currentRows),
        this.aggregator.buildHistoricalProgress(historicalRows)
      ]);
      const guidanceSignals = this.aggregator.buildGuidanceSignals(currentRows, historicalRows);

      const payload: ExportPayload = {
        meta,
        rawAttempts: currentRows,
        aggregations,
        historicalProgress,
        guidanceSignals
      };

      // 3. Format
      let buffer: Buffer;
      let contentType: string;
      let extension: string;

      if (format === 'json') {
        buffer = this.jsonFormatter.format(payload);
        contentType = 'application/json';
        extension = 'json';
      } else if (format === 'csv') {
        buffer = await this.csvFormatter.formatAsZip(payload);
        contentType = 'application/zip';
        extension = 'zip';
      } else {
        throw new Error(`Unsupported format: ${format}`);
      }

      // 4. Upload to Vercel Blob
      const filename = `exports/${userId}/${examId}/analysis_${Date.now()}.${extension}`;
      const { url } = await put(filename, buffer, {
        access: 'private',
        contentType,
        addRandomSuffix: false,
        allowOverwrite: true,
      });

      try {
        await redis.set(cacheKey, url, { ex: 900 });
      } catch (error: unknown) {
        this.log.warn({ err: error, examId, userId }, 'Export cache write failed');
      }

      this.log.info({ examId, url }, 'Export completed and uploaded');
      return url;
    });
  }
}
