import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  publishEvent: vi.fn().mockResolvedValue({ messageId: 'msg-1', envelope: {} }),
}));

vi.mock('@quiz/events', () => ({
  PlatformEventTypes: {
    STUDENT_ENROLLED: 'student.enrolled',
    ADMISSION_COMPLETED: 'admission.completed',
    PAYMENT_RECEIVED: 'payment.received',
  },
  publishEvent: mocks.publishEvent,
}));

import { GET as getBatches, POST as createBatch } from '../batches/route';
import { PATCH as admitEnquiry } from '../crm/enquiries/[id]/admit/route';
import { GET as getEnquiries, POST as createEnquiry } from '../crm/enquiries/route';
import { GET as exportPayments } from '../payments/export/route';
import { GET as getPayments, POST as recordPayment } from '../payments/route';
import { GET as exportAuditLog } from '../audit-log/export/route';
import { POST as enrollStudent } from '../students/[id]/enroll/route';
import { GET as getStudent } from '../students/[id]/route';
import { GET as getStudents, POST as createStudent } from '../students/route';
import { PATCH as qualifyEnquiry } from '../crm/enquiries/[id]/qualify/route';

const makeRequest = (url: string, method = 'GET', body?: unknown) =>
  new NextRequest(`http://localhost${url}`, {
    method,
    headers: {
      'content-type': body === undefined ? 'application/json' : 'application/json',
      'x-user-roles': 'admin',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

describe('skillup-admin routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects requests without an admin role', async () => {
    const response = await getStudents(
      new NextRequest('http://localhost/api/admin/students', {
        method: 'GET',
        headers: { 'x-user-roles': 'student' },
      })
    );

    expect(response.status).toBe(403);
  });

  it('lists and creates students', async () => {
    const listResponse = await getStudents(makeRequest('/api/admin/students'));
    const listPayload = (await listResponse.json()) as { data: Array<{ id: string }> };

    expect(listResponse.status).toBe(200);
    expect(listPayload.data).toHaveLength(3);

    const createResponse = await createStudent(
      makeRequest('/api/admin/students', 'POST', {
        name: 'New Student',
        email: 'new.student@example.com',
        batchId: 'batch-react-2026',
        batchName: 'React Full Stack - April 2026',
      })
    );
    const createPayload = (await createResponse.json()) as { data: { name: string } };

    expect(createResponse.status).toBe(201);
    expect(createPayload.data.name).toBe('New Student');
  });

  it('returns a student detail and enrolls the student with an event', async () => {
    const detailResponse = await getStudent(makeRequest('/api/admin/students/student-1'), {
      params: Promise.resolve({ id: 'student-1' }),
    });
    const detailPayload = (await detailResponse.json()) as { data: { name: string } };

    expect(detailResponse.status).toBe(200);
    expect(detailPayload.data.name).toBe('Aarav Shah');

    const enrollResponse = await enrollStudent(makeRequest('/api/admin/students/student-1/enroll', 'POST'), {
      params: Promise.resolve({ id: 'student-1' }),
    });
    const enrollPayload = (await enrollResponse.json()) as { data: { enrollment: { domainId: string; batchId: string } } };

    expect(enrollResponse.status).toBe(200);
    expect(enrollPayload.data.enrollment.domainId).toBe('44444444-4444-4444-8444-444444444444');
    expect(mocks.publishEvent).toHaveBeenCalledWith(
      'student.enrolled',
      expect.objectContaining({ batchId: 'batch-react-2026', enrollmentType: 'batch' }),
      expect.any(Object)
    );
  });

  it('lists enquiries and advances the saga', async () => {
    const listResponse = await getEnquiries(makeRequest('/api/admin/crm/enquiries'));
    const listPayload = (await listResponse.json()) as { data: Array<{ id: string }> };

    expect(listResponse.status).toBe(200);
    expect(listPayload.data).toHaveLength(3);

    const createResponse = await createEnquiry(
      makeRequest('/api/admin/crm/enquiries', 'POST', {
        studentName: 'New Lead',
        email: 'lead@example.com',
        phone: '+91 99999 00000',
        program: 'Web Development',
        counsellor: 'Priya Nair',
      })
    );
    const createPayload = (await createResponse.json()) as { data: { studentName: string; status: string } };

    expect(createResponse.status).toBe(201);
    expect(createPayload.data.studentName).toBe('New Lead');
    expect(createPayload.data.status).toBe('new');

    const qualifyResponse = await qualifyEnquiry(makeRequest('/api/admin/crm/enquiries/enquiry-1/qualify', 'POST'), {
      params: Promise.resolve({ id: 'enquiry-1' }),
    });
    const qualifyPayload = (await qualifyResponse.json()) as { data: { status: string } };

    expect(qualifyResponse.status).toBe(200);
    expect(qualifyPayload.data.status).toBe('qualified');

    const admitResponse = await admitEnquiry(makeRequest('/api/admin/crm/enquiries/enquiry-1/admit', 'POST'), {
      params: Promise.resolve({ id: 'enquiry-1' }),
    });
    const admitPayload = (await admitResponse.json()) as { data: { status: string; batchId: string } };

    expect(admitResponse.status).toBe(200);
    expect(admitPayload.data.status).toBe('admitted');
    expect(admitPayload.data.batchId).toBe('batch-react-2026');
    expect(mocks.publishEvent).toHaveBeenCalledWith(
      'admission.completed',
      expect.objectContaining({ userId: '55555555-5555-4555-8555-555555555555', batchId: 'batch-react-2026' }),
      expect.any(Object)
    );
  });

  it('lists and creates batches', async () => {
    const listResponse = await getBatches(makeRequest('/api/admin/batches'));
    const listPayload = (await listResponse.json()) as { data: Array<{ id: string }> };

    expect(listResponse.status).toBe(200);
    expect(listPayload.data).toHaveLength(3);

    const createResponse = await createBatch(
      makeRequest('/api/admin/batches', 'POST', {
        name: 'React Full Stack - April 2026',
        facultyName: 'Neha Kapoor',
        program: 'Web Development',
        capacity: 32,
        startDate: '2026-04-01',
        sessionTopic: 'Hooks and state',
      })
    );
    const createPayload = (await createResponse.json()) as { data: { name: string } };

    expect(createResponse.status).toBe(201);
    expect(createPayload.data.name).toBe('React Full Stack - April 2026');
  });

  it('records payments idempotently and exports CSV', async () => {
    const listResponse = await getPayments(makeRequest('/api/admin/payments'));
    const listPayload = (await listResponse.json()) as { data: Array<{ id: string }> };

    expect(listResponse.status).toBe(200);
    expect(listPayload.data).toHaveLength(3);

    const paymentBody = {
      userId: '11111111-1111-4111-8111-111111111111',
      studentName: 'Aarav Shah',
      installmentId: 'inv-3001',
      amount: 18000,
      dueDate: '2026-04-05',
      paymentRef: 'REF-9001',
    };

    const paymentResponse = await recordPayment(makeRequest('/api/admin/payments', 'POST', paymentBody));
    const paymentPayload = (await paymentResponse.json()) as { data: { paymentRef: string; idempotent: boolean } };

    expect(paymentResponse.status).toBe(200);
    expect(paymentPayload.data.paymentRef).toBe('REF-9001');
    expect(paymentPayload.data.idempotent).toBe(false);
    expect(mocks.publishEvent).toHaveBeenCalledWith('payment.received', expect.objectContaining({ installmentId: 'inv-3001' }), expect.any(Object));

    const duplicateResponse = await recordPayment(makeRequest('/api/admin/payments', 'POST', paymentBody));
    const duplicatePayload = (await duplicateResponse.json()) as { data: { idempotent: boolean } };

    expect(duplicatePayload.data.idempotent).toBe(true);

    const exportResponse = await exportPayments(makeRequest('/api/admin/payments/export'));
    const csv = await exportResponse.text();

    expect(exportResponse.status).toBe(200);
    expect(exportResponse.headers.get('content-type')).toContain('text/csv');
    expect(csv).toContain('studentName,installmentId');
  });

  it('exports a filtered audit log csv', async () => {
    const response = await exportAuditLog(makeRequest('/api/admin/audit-log/export?student=Aarav&action=enrolled'));
    const csv = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/csv');
    expect(csv).toContain('Aarav Shah');
    expect(csv).not.toContain('Meera Iyer');
    expect(csv).toContain('action');
  });
});
