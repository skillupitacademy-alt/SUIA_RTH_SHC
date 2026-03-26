import { GET as getPrograms } from '@/app/api/programs/route';
import { GET as getDashboard } from '@/app/api/student/dashboard/route';
import { GET as getBatch } from '@/app/api/student/my-batch/route';
import { GET as getAttendance } from '@/app/api/student/attendance/route';
import { GET as getPayments } from '@/app/api/student/payments/route';
import { GET as getPlacement } from '@/app/api/student/placement/route';
import { GET as getBatches } from '@/app/api/batches/route';
import { GET as getFaculty } from '@/app/api/faculty/route';

async function readJson<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}

describe('SkillUp BFF routes', () => {
  it('returns program catalog data', async () => {
    const response = await getPrograms();
    const payload = await readJson<{ programs: Array<{ slug: string }> }>(response);
    expect(response.status).toBe(200);
    expect(payload.programs.length).toBeGreaterThan(0);
    expect(payload.programs[0].slug).toBeTruthy();
  });

  it('returns dashboard data', async () => {
    const response = await getDashboard();
    const payload = await readJson<{ summary: { batchName: string }; sessions: unknown[] }>(response);
    expect(response.status).toBe(200);
    expect(payload.summary.batchName).toBeTruthy();
    expect(payload.sessions.length).toBeGreaterThan(0);
  });

  it('returns batch data', async () => {
    const response = await getBatch();
    const payload = await readJson<{ batch: { name: string }; sessions: unknown[] }>(response);
    expect(response.status).toBe(200);
    expect(payload.batch.name).toBeTruthy();
    expect(payload.sessions.length).toBeGreaterThan(0);
  });

  it('returns attendance data', async () => {
    const response = await getAttendance();
    const payload = await readJson<{ history: Array<{ state: string }> }>(response);
    expect(response.status).toBe(200);
    expect(payload.history.length).toBeGreaterThan(0);
    expect(payload.history[0].state).toBeTruthy();
  });

  it('returns payments data', async () => {
    const response = await getPayments();
    const payload = await readJson<{ installments: Array<{ status: string }> }>(response);
    expect(response.status).toBe(200);
    expect(payload.installments.length).toBeGreaterThan(0);
    expect(payload.installments[0].status).toBeTruthy();
  });

  it('returns placement data', async () => {
    const response = await getPlacement();
    const payload = await readJson<{ profile: { roleGoal: string }; jobs: unknown[] }>(response);
    expect(response.status).toBe(200);
    expect(payload.profile.roleGoal).toBeTruthy();
    expect(payload.jobs.length).toBeGreaterThan(0);
  });

  it('returns parent batch data', async () => {
    const response = await getBatches();
    const payload = await readJson<{ batch: { faculty: string }; sessions: unknown[] }>(response);
    expect(response.status).toBe(200);
    expect(payload.batch.faculty).toBeTruthy();
    expect(payload.sessions.length).toBeGreaterThan(0);
  });

  it('returns faculty data', async () => {
    const response = await getFaculty();
    const payload = await readJson<{ faculty: Array<{ name: string }>; heroStats: Array<{ label: string }> }>(response);
    expect(response.status).toBe(200);
    expect(payload.faculty.length).toBeGreaterThan(0);
    expect(payload.heroStats.length).toBeGreaterThan(0);
  });
});
