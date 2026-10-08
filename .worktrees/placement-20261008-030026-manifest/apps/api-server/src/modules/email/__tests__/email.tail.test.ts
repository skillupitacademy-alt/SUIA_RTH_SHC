import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ResendEmailProvider } from '../providers/ResendEmailProvider';
import { LoggerService } from '@/modules/core/logger.service';

vi.mock('resend', () => ({
    Resend: class {
        emails = { send: vi.fn() };
    }
}));

describe('ResendEmailProvider tail coverage', () => {
    let errorSpy: any;
    let infoSpy: any;

    beforeEach(() => {
        vi.clearAllMocks();
        errorSpy = vi.spyOn(LoggerService.prototype, 'error').mockImplementation(() => {});
        infoSpy = vi.spyOn(LoggerService.prototype, 'info').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('sendEmail: handles API error object (Lines 24-26)', async () => {
        const provider = new ResendEmailProvider('key', 'test@test.com');
        (provider as any).resend.emails.send.mockResolvedValue({ error: { message: 'Api Error' }, data: null });
        
        await provider.sendEmail({ to: 't', subject: 's', html: 'h' });
        expect(errorSpy).toHaveBeenCalledWith(expect.any(Object), expect.stringContaining('Resend API returned an error'));
    });

    it('sendEmail: catches unexpected throw (Line 33)', async () => {
        const provider = new ResendEmailProvider('key', 'test@test.com');
        (provider as any).resend.emails.send.mockRejectedValue(new Error('Network fault'));
        
        await provider.sendEmail({ to: 't', subject: 's', html: 'h' });
        expect(errorSpy).toHaveBeenCalledWith(expect.any(Error), expect.stringContaining('Unexpected fault'));
    });

    it('sendEmail: catches string throw (Line 33)', async () => {
        const provider = new ResendEmailProvider('key', 'test@test.com');
        (provider as any).resend.emails.send.mockRejectedValue('String fault');
        
        await provider.sendEmail({ to: 't', subject: 's', html: 'h' });
        expect(errorSpy).toHaveBeenCalledWith('String fault', expect.stringContaining('Unexpected fault'));
    });
});
