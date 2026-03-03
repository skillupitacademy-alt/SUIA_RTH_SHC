import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ResendEmailProvider } from '../providers/ResendEmailProvider';

vi.mock('resend', () => ({
    Resend: class {
        emails = { send: vi.fn() };
    }
}));

describe('ResendEmailProvider tail coverage', () => {
    let oldConsoleLog: any;
    let oldConsoleError: any;

    beforeEach(() => {
        vi.clearAllMocks();
        oldConsoleLog = console.log;
        oldConsoleError = console.error;
        console.log = vi.fn();
        console.error = vi.fn();
    });

    afterEach(() => {
        console.log = oldConsoleLog;
        console.error = oldConsoleError;
    });

    it('sendEmail: handles API error object (Lines 24-26)', async () => {
        const provider = new ResendEmailProvider('key', 'test@test.com');
        (provider as any).resend.emails.send.mockResolvedValue({ error: { message: 'Api Error' }, data: null });
        
        await provider.sendEmail({ to: 't', subject: 's', html: 'h' });
        expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Resend API returned an error'), expect.any(Object));
    });

    it('sendEmail: catches unexpected throw (Line 33)', async () => {
        const provider = new ResendEmailProvider('key', 'test@test.com');
        (provider as any).resend.emails.send.mockRejectedValue(new Error('Network fault'));
        
        await provider.sendEmail({ to: 't', subject: 's', html: 'h' });
        expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Unexpected fault'), 'Network fault');
    });

    it('sendEmail: catches string throw (Line 33)', async () => {
        const provider = new ResendEmailProvider('key', 'test@test.com');
        (provider as any).resend.emails.send.mockRejectedValue('String fault');
        
        await provider.sendEmail({ to: 't', subject: 's', html: 'h' });
        expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Unexpected fault'), 'String fault');
    });
});
