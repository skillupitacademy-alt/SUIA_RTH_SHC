import { JobType } from '@quiz/types';

import { JobOrchestrator } from '@/modules/system/job-orchestrator';

import { logger } from '../../logger';
import { EmailJobPayload as BullEmailPayload } from '../job-types';
import { createWorker } from '../workers';

/**
 * BullMQ Worker for processing background emails.
 */
export const emailWorker = createWorker<BullEmailPayload, void>(
  'emailQueue',
  async (job) => {
    const { to, subject, html, template, data } = job.data;
    logger.info({ to, subject, jobId: job.id }, '[EmailWorker] Processing email job');

    try {
      if (template === 'password_reset' && typeof data?.resetUrl === 'string') {
          await JobOrchestrator.runJobDirectly(
              JobType.EMAIL_SEND,
              { type: 'password_reset', email: to, data: { resetUrl: data.resetUrl } },
              'system'
          );
      } else {
          await JobOrchestrator.runJobDirectly(
              JobType.EMAIL_SEND,
              { 
                  type: 'generic', 
                  email: to, 
                  data: { 
                      subject: subject ?? 'Notification', 
                      html: html ?? '', 
                      from: process.env.RESEND_FROM ?? 'onboarding@resend.dev' 
                  } 
              },
              'system'
          );
      }
      
      logger.info({ to, jobId: job.id }, '[EmailWorker] Email sent successfully');
    } catch (error) {
       logger.error({ to, error }, '[EmailWorker] Failed to send email');
       throw error;
    }
  }
);
