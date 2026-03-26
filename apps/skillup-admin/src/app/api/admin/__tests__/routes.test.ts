import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { listAdminBatches, listAdminEnquiries, listAdminPayments, listAdminPlacementProfiles, listAdminStudents } from '@/lib/skillup-admin-data';

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
import { PATCH as patchBatchDetail } from '../batches/[id]/route';
import { PATCH as patchEnquiryDetail } from '../crm/enquiries/[id]/route';
import { PATCH as admitEnquiry } from '../crm/enquiries/[id]/admit/route';
import { GET as getEnquiries, POST as createEnquiry } from '../crm/enquiries/route';
import { GET as exportPayments } from '../payments/export/route';
import { GET as getPayments, POST as recordPayment } from '../payments/route';
import { GET as getPaymentDetail, PATCH as patchPaymentDetail } from '../payments/[id]/route';
import { GET as exportAuditLog } from '../audit-log/export/route';
import { POST as enrollStudent } from '../students/[id]/enroll/route';
import { GET as getStudent, PATCH as patchStudent } from '../students/[id]/route';
import { GET as getStudents, POST as createStudent } from '../students/route';
import { PATCH as qualifyEnquiry } from '../crm/enquiries/[id]/qualify/route';
import { GET as getPlacementProfile, POST as savePlacementProfile } from '../placement/[id]/route';
import { POST as createPlacementJob } from '../placement/jobs/route';

const makeRequest = (url: string, method = 'GET', body?: unknown) =>
  new NextRequest(`http://localhost${url}`, {
    method,
    headers: {
      'content-type': 'application/json',
      'x-user-roles': 'admin',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

describe('skillup-admin routes', () => {
  let studentId = '';
  let studentUserId = '';
  let enquiryId = '';
  let batchId = '';
  let placementId = '';
  let paymentId = '';

  beforeEach(
    async () => {
    vi.clearAllMocks();
    const [students, enquiries, batches, placements, payments] = await Promise.all([
      listAdminStudents(),
      listAdminEnquiries(),
      listAdminBatches(),
      listAdminPlacementProfiles(),
      listAdminPayments(),
    ]);
    studentId = students[0]?.id ?? '';
    studentUserId = students[0]?.userId ?? '';
    enquiryId = enquiries[0]?.id ?? '';
    batchId = batches[0]?.id ?? '';
    placementId = placements[0]?.id ?? '';
    paymentId = payments[0]?.id ?? '';
    },
    20000
  );

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
    const unique = Date.now().toString(36);
    const listResponse = await getStudents(makeRequest('/api/admin/students'));
    const listPayload = (await listResponse.json()) as { data: Array<{ id: string }> };

    expect(listResponse.status).toBe(200);
    expect(listPayload.data.length).toBeGreaterThan(0);

    const createResponse = await createStudent(
      makeRequest('/api/admin/students', 'POST', {
        name: `New Student ${unique}`,
        email: `new.student.${unique}@example.com`,
        batchId,
        batchName: 'Live batch',
      })
    );
    const createPayload = (await createResponse.json()) as { data: { name: string; email: string } };

    expect(createResponse.status).toBe(201);
    expect(createPayload.data.name).toBe(`New Student ${unique}`);
    expect(createPayload.data.email).toBe(`new.student.${unique}@example.com`);
  });

  it(
    'returns a student detail and enrolls the student with an event',
    async () => {
    const detailResponse = await getStudent(makeRequest(`/api/admin/students/${studentId}`), {
      params: Promise.resolve({ id: studentId }),
    });
    const detailPayload = (await detailResponse.json()) as { data: { name: string } };

    expect(detailResponse.status).toBe(200);
    expect(detailPayload.data.name).toBeTruthy();

    const enrollResponse = await enrollStudent(makeRequest(`/api/admin/students/${studentId}/enroll`, 'POST'), {
      params: Promise.resolve({ id: studentId }),
    });
    const enrollPayload = (await enrollResponse.json()) as { data: { enrollment: { batchId: string } } };

    expect(enrollResponse.status).toBe(200);
    expect(enrollPayload.data.enrollment.batchId).toBeTruthy();
    expect(mocks.publishEvent).toHaveBeenCalledWith(
      'student.enrolled',
      expect.objectContaining({ batchId: enrollPayload.data.enrollment.batchId, enrollmentType: 'batch', userId: studentUserId }),
      expect.any(Object)
    );
    },
    15000
  );

  it(
    'updates a student profile and enrollment assignment',
    async () => {
    const unique = Date.now().toString(36);
    const updateResponse = await patchStudent(
      makeRequest(`/api/admin/students/${studentId}`, 'PATCH', {
        name: `Edited Student ${unique}`,
        email: `edited.student.${unique}@example.com`,
        batchId,
      }),
      {
        params: Promise.resolve({ id: studentId }),
      }
    );
    const updatePayload = (await updateResponse.json()) as { data: { updated: boolean; detail: { name: string; email: string; batchId: string } } };

    expect(updateResponse.status).toBe(200);
    expect(updatePayload.data.updated).toBe(true);
    expect(updatePayload.data.detail.name).toBe(`Edited Student ${unique}`);
    expect(updatePayload.data.detail.email).toBe(`edited.student.${unique}@example.com`);
    expect(updatePayload.data.detail.batchId).toBe(batchId);
    },
    15000
  );

  it(
    'lists enquiries and advances the saga',
    async () => {
    const unique = Date.now().toString(36);
    const listResponse = await getEnquiries(makeRequest('/api/admin/crm/enquiries'));
    const listPayload = (await listResponse.json()) as { data: Array<{ id: string }> };

    expect(listResponse.status).toBe(200);
    expect(listPayload.data.length).toBeGreaterThan(0);

    const createResponse = await createEnquiry(
      makeRequest('/api/admin/crm/enquiries', 'POST', {
        studentName: `New Lead ${unique}`,
        email: `lead.${unique}@example.com`,
        phone: `+91 99999 ${unique.slice(-5).padStart(5, '0')}`,
        program: 'Web Development',
        counsellor: 'Priya Nair',
      })
    );
    const createPayload = (await createResponse.json()) as { data: { studentName: string; status: string } };

    expect(createResponse.status).toBe(201);
    expect(createPayload.data.studentName).toBe(`New Lead ${unique}`);
    expect(createPayload.data.status).toBe('new');

    const qualifyResponse = await qualifyEnquiry(makeRequest(`/api/admin/crm/enquiries/${enquiryId}/qualify`, 'POST'), {
      params: Promise.resolve({ id: enquiryId }),
    });
    const qualifyPayload = (await qualifyResponse.json()) as { data: { status: string } };

    expect(qualifyResponse.status).toBe(200);
    expect(qualifyPayload.data.status).toBe('qualified');

    const admitResponse = await admitEnquiry(makeRequest(`/api/admin/crm/enquiries/${enquiryId}/admit`, 'POST'), {
      params: Promise.resolve({ id: enquiryId }),
    });
    const admitPayload = (await admitResponse.json()) as { data: { status: string; batchId: string } };

    expect(admitResponse.status).toBe(200);
    expect(admitPayload.data.status).toBe('admitted');
    expect(admitPayload.data.batchId).toBe(batchId);
    expect(mocks.publishEvent).toHaveBeenCalledWith(
      'admission.completed',
      expect.objectContaining({ batchId }),
      expect.any(Object)
    );
    },
    15000
  );

  it('updates an enquiry detail record', async () => {
    const unique = Date.now().toString(36);
    const updateResponse = await patchEnquiryDetail(
      makeRequest(`/api/admin/crm/enquiries/${enquiryId}`, 'PATCH', {
        studentName: `Lead ${unique}`,
        email: `lead.${unique}@example.com`,
        phone: `+91 98888 ${unique.slice(-5).padStart(5, '0')}`,
        status: 'contacted',
        notes: `Updated from test ${unique}`,
      }),
      {
        params: Promise.resolve({ id: enquiryId }),
      }
    );
    const updatePayload = (await updateResponse.json()) as { data: { updated: boolean; detail: { studentName: string; status: string } } };

    expect(updateResponse.status).toBe(200);
    expect(updatePayload.data.updated).toBe(true);
    expect(updatePayload.data.detail.studentName).toBe(`Lead ${unique}`);
    expect(updatePayload.data.detail.status).toBe('contacted');
  });

  it('lists and creates batches', async () => {
    const listResponse = await getBatches(makeRequest('/api/admin/batches'));
    const listPayload = (await listResponse.json()) as { data: Array<{ id: string }> };

    expect(listResponse.status).toBe(200);
    expect(listPayload.data.length).toBeGreaterThan(0);

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

  it('loads and updates a batch detail', async () => {
    const detailResponse = await getBatches(makeRequest('/api/admin/batches'));
    const detailPayload = (await detailResponse.json()) as { data: Array<{ id: string }> };
    const targetBatchId = detailPayload.data[0]?.id ?? '';

    expect(targetBatchId).toBeTruthy();

    const unique = Date.now().toString(36);
    const updateResponse = await patchBatchDetail(
      makeRequest(
        `/api/admin/batches/${targetBatchId}`,
        'PATCH',
        {
          name: `Edited Batch ${unique}`,
          facultyName: 'Neha Kapoor',
          capacity: 28,
          startDate: '2026-05-01',
          status: 'active',
        }
      ),
      {
        params: Promise.resolve({ id: targetBatchId }),
      }
    );
    const updatePayload = (await updateResponse.json()) as { data: { updated: boolean; detail: { name: string; capacity: number } } };

    expect(updateResponse.status).toBe(200);
    expect(updatePayload.data.updated).toBe(true);
    expect(updatePayload.data.detail.name).toBe(`Edited Batch ${unique}`);
    expect(updatePayload.data.detail.capacity).toBe(28);
  });

  it('records payments idempotently and exports CSV', async () => {
    const unique = Date.now().toString(36);
    const listResponse = await getPayments(makeRequest('/api/admin/payments'));
    const listPayload = (await listResponse.json()) as { data: Array<{ id: string }> };

    expect(listResponse.status).toBe(200);
    expect(listPayload.data.length).toBeGreaterThan(0);

    const paymentBody = {
      userId: studentUserId,
      studentName: 'Live Student',
      installmentId: `Admission fee ${unique}`,
      amount: 18000,
      dueDate: '2026-01-15',
      paymentRef: `REF-${unique}`,
    };

    const paymentResponse = await recordPayment(makeRequest('/api/admin/payments', 'POST', paymentBody));
    const paymentPayload = (await paymentResponse.json()) as { data: { paymentRef: string; idempotent: boolean } };

    expect(paymentResponse.status).toBe(200);
    expect(paymentPayload.data.paymentRef).toBe(`REF-${unique}`);
    expect(paymentPayload.data.idempotent).toBe(false);

    const duplicateResponse = await recordPayment(makeRequest('/api/admin/payments', 'POST', paymentBody));
    const duplicatePayload = (await duplicateResponse.json()) as { data: { idempotent: boolean } };

    expect(duplicateResponse.status).toBe(200);
    expect(duplicatePayload.data.idempotent).toBe(true);

    const exportResponse = await exportPayments(makeRequest('/api/admin/payments/export'));
    const csv = await exportResponse.text();

    expect(exportResponse.status).toBe(200);
    expect(exportResponse.headers.get('content-type')).toContain('text/csv');
    expect(csv).toContain('studentName,installmentId');
  });

  it('exports a live audit log csv', async () => {
    const response = await exportAuditLog(makeRequest('/api/admin/audit-log/export?student=&action='));
    const csv = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/csv');
    expect(csv).toContain('studentName');
    expect(csv.split('\n').length).toBeGreaterThan(1);
  });

  it('loads and saves a placement profile', async () => {
    const detailResponse = await getPlacementProfile(makeRequest(`/api/admin/placement/${placementId}`), {
      params: Promise.resolve({ id: placementId }),
    });
    const detailPayload = (await detailResponse.json()) as { data: { id: string; targetRole: string } };

    expect(detailResponse.status).toBe(200);
    expect(detailPayload.data.id).toBe(placementId);
    expect(detailPayload.data.targetRole).toBeTruthy();

    const unique = Date.now().toString(36);
    const updateResponse = await savePlacementProfile(
      makeRequest(
        `/api/admin/placement/${placementId}`,
        'POST',
        {
          targetRole: `Frontend Engineer ${unique}`,
          resumeStatus: 'Ready for review',
          profileCompletion: 92,
          interviewCount: 5,
          skills: 'React, TypeScript, APIs',
        }
      ),
      {
        params: Promise.resolve({ id: placementId }),
      }
    );
    const updatePayload = (await updateResponse.json()) as { data: { updated: boolean; detail: { targetRole: string; matchScore: number } } };

    expect(updateResponse.status).toBe(200);
    expect(updatePayload.data.updated).toBe(true);
    expect(updatePayload.data.detail.targetRole).toBe(`Frontend Engineer ${unique}`);
    expect(updatePayload.data.detail.matchScore).toBe(92);
  });

  it('publishes a placement job posting', async () => {
    const unique = Date.now().toString(36);
    const response = await createPlacementJob(
      makeRequest('/api/admin/placement/jobs', 'POST', {
        company: `Company ${unique}`,
        title: `Backend Engineer ${unique}`,
        location: 'Remote',
        matchScore: 89,
        isActive: true,
      })
    );
    const payload = (await response.json()) as { data: { created: boolean; job: { title: string; company: string } } };

    expect(response.status).toBe(201);
    expect(payload.data.created).toBe(true);
    expect(payload.data.job.title).toBe(`Backend Engineer ${unique}`);
    expect(payload.data.job.company).toBe(`Company ${unique}`);
  });

  it('loads and updates a payment detail', async () => {
    const detailResponse = await getPaymentDetail(makeRequest(`/api/admin/payments/${paymentId}`), {
      params: Promise.resolve({ id: paymentId }),
    });
    const detailPayload = (await detailResponse.json()) as { data: { id: string; installmentId: string } };

    expect(detailResponse.status).toBe(200);
    expect(detailPayload.data.id).toBe(paymentId);
    expect(detailPayload.data.installmentId).toBeTruthy();

    const unique = Date.now().toString(36);
    const updateResponse = await patchPaymentDetail(
      makeRequest(
        `/api/admin/payments/${paymentId}`,
        'PATCH',
        {
          installmentId: `Training fee ${unique}`,
          amount: 21000,
          dueDate: '2026-04-10',
          paymentRef: `PAY-${unique}`,
          status: 'due',
        }
      ),
      {
        params: Promise.resolve({ id: paymentId }),
      }
    );
    const updatePayload = (await updateResponse.json()) as { data: { updated: boolean; detail: { installmentId: string; amount: number } } };

    expect(updateResponse.status).toBe(200);
    expect(updatePayload.data.updated).toBe(true);
    expect(updatePayload.data.detail.installmentId).toBe(`Training fee ${unique}`);
    expect(updatePayload.data.detail.amount).toBe(21000);
  });
});
