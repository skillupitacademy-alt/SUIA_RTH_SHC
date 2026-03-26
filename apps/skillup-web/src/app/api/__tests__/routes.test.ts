import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getSkillupPrograms: vi.fn(),
  getSkillupProgramDetail: vi.fn(),
  getSkillupStudentDashboard: vi.fn(),
  getSkillupMyBatch: vi.fn(),
  getSkillupAttendance: vi.fn(),
  getSkillupPayments: vi.fn(),
  getSkillupPlacement: vi.fn(),
  getSkillupBatches: vi.fn(),
  getSkillupFaculty: vi.fn(),
}));

vi.mock('@/lib/skillup-data', () => ({
  getSkillupPrograms: mocks.getSkillupPrograms,
  getSkillupProgramDetail: mocks.getSkillupProgramDetail,
  getSkillupStudentDashboard: mocks.getSkillupStudentDashboard,
  getSkillupMyBatch: mocks.getSkillupMyBatch,
  getSkillupAttendance: mocks.getSkillupAttendance,
  getSkillupPayments: mocks.getSkillupPayments,
  getSkillupPlacement: mocks.getSkillupPlacement,
  getSkillupBatches: mocks.getSkillupBatches,
  getSkillupFaculty: mocks.getSkillupFaculty,
}));

import { GET as getPrograms } from '@/app/api/programs/route';
import { GET as getProgram } from '@/app/api/programs/[slug]/route';
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
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.getSkillupPrograms.mockResolvedValue({
      programs: [
        {
          id: 'skillup-full-stack',
          slug: 'full-stack-web',
          name: 'Full Stack Developer',
          duration: 'Live track',
          description: 'Frontend, APIs, deployment, and project delivery.',
          audience: 'Students targeting product engineering roles',
          summary: 'Build production-ready web apps and interview-ready projects.',
          highlights: ['Frontend foundations', 'Next.js app architecture', 'API integration', 'Deployment readiness'],
        },
      ],
    });

    mocks.getSkillupProgramDetail.mockResolvedValue({
      id: 'skillup-full-stack',
      slug: 'full-stack-web',
      name: 'Full Stack Developer',
      duration: 'Live track',
      description: 'Frontend, APIs, deployment, and project delivery.',
      audience: 'Students targeting product engineering roles',
      summary: 'Build production-ready web apps and interview-ready projects.',
      highlights: ['Frontend foundations', 'Next.js app architecture', 'API integration', 'Deployment readiness'],
      curriculum: [
        { title: 'Foundation', items: ['Frontend foundations', 'Next.js app architecture'] },
        { title: 'Build and ship', items: ['API integration', 'Deployment readiness'] },
        { title: 'Placement prep', items: ['Interview readiness drills'] },
      ],
    });

    mocks.getSkillupStudentDashboard.mockResolvedValue({
      summary: {
        nextSessionAt: '2026-03-24T09:30:00+05:30',
        paymentDue: 18000,
        outstandingInstallments: 1,
        attendancePercent: 86,
        progressPercent: 68,
        upcomingSessions: 3,
        placementMatches: 6,
        facultyName: 'Asha Iyer',
        batchName: 'SkillUp FS-24 Morning',
        currentTopic: 'React state patterns',
      },
      sessions: [{ id: 'session-1', date: '2026-03-24T09:30:00+05:30', title: 'React state patterns', mode: 'offline', status: 'upcoming' }],
    });

    mocks.getSkillupMyBatch.mockResolvedValue({
      batch: {
        name: 'SkillUp FS-24 Morning',
        faculty: 'Asha Iyer',
        currentTopic: 'React state patterns',
        nextSession: '2026-03-24T09:30:00+05:30',
        studentCount: 28,
        schedule: [],
        materials: ['React component guide'],
      },
      sessions: [{ id: 'session-1', date: '2026-03-24T09:30:00+05:30', title: 'React state patterns', mode: 'offline', status: 'upcoming' }],
    });

    mocks.getSkillupAttendance.mockResolvedValue({
      history: [{ date: 'Mon 18 Mar', state: 'present', note: 'On time for class' }],
    });

    mocks.getSkillupPayments.mockResolvedValue({
      installments: [{ id: 'inst-1', label: 'Admission fee', dueDate: '2026-01-15', amount: 15000, status: 'paid', paymentRef: 'PAY-1001' }],
    });

    mocks.getSkillupPlacement.mockResolvedValue({
      profile: {
        roleGoal: 'Frontend Developer',
        resumeStatus: 'Ready for review',
        profileCompletion: 82,
        interviewCount: 4,
        skills: ['React', 'Next.js'],
      },
      jobs: [{ id: 'job-1', company: 'BrightStack', title: 'Junior Frontend Engineer', location: 'Bengaluru', match: 94 }],
    });

    mocks.getSkillupBatches.mockResolvedValue({
      batch: {
        name: 'SkillUp FS-24 Morning',
        faculty: 'Asha Iyer',
        currentTopic: 'React state patterns',
        nextSession: '2026-03-24T09:30:00+05:30',
        studentCount: 28,
        schedule: [],
        materials: ['React component guide'],
      },
      sessions: [{ id: 'session-1', date: '2026-03-24T09:30:00+05:30', title: 'React state patterns', mode: 'offline', status: 'upcoming' }],
    });

    mocks.getSkillupFaculty.mockResolvedValue({
      faculty: [{ name: 'Asha Iyer', title: 'Full Stack Mentor', description: 'Guides front-end and API delivery with weekly code review sessions.' }],
      heroStats: [
        { label: 'Active mentors', value: '1' },
        { label: 'Batch reviews', value: '3' },
        { label: 'Upcoming sessions', value: '3' },
        { label: 'Quality score', value: '96%' },
      ],
    });
  });

  it('returns program catalog data', async () => {
    const response = await getPrograms();
    const payload = await readJson<{ programs: Array<{ slug: string }> }>(response);
    expect(response.status).toBe(200);
    expect(payload.programs.length).toBeGreaterThan(0);
    expect(payload.programs[0].slug).toBeTruthy();
  });

  it('returns program detail data', async () => {
    const response = await getProgram(new Request('http://localhost/api/programs/full-stack-web') as Request, {
      params: Promise.resolve({ slug: 'full-stack-web' }),
    });
    const payload = await readJson<{ program: { slug: string; curriculum: Array<{ title: string }> } }>(response);
    expect(response.status).toBe(200);
    expect(payload.program.slug).toBe('full-stack-web');
    expect(payload.program.curriculum.length).toBeGreaterThan(0);
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
