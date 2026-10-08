import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../[subtopicId]/route';
import { NextRequest } from 'next/server';

// Mock the database
vi.mock('@quiz/db-tutorial', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
  },
  tutorialSubtopics: {},
  tutorialSections: {},
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn(),
  and: vi.fn(),
}));

describe('GET /api/tutorial/sections/[subtopicId]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 404 when subtopic not found', async () => {
    const { db } = await import('@quiz/db-tutorial');
    
    // Mock empty subtopic result
    vi.mocked(db.select().from).mockResolvedValueOnce([]);

    const request = new NextRequest('http://localhost:3000/api/tutorial/sections/non-existent');
    const context = { params: Promise.resolve({ subtopicId: 'non-existent' }) };

    const response = await GET(request, context);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Subtopic not found');
  });

  it('should return sections for valid subtopic', async () => {
    const { db } = await import('@quiz/db-tutorial');
    
    const mockSubtopic = {
      id: 'subtopic-123',
      name: 'Component Architecture',
      slug: 'component-architecture',
    };

    const mockSections = [
      {
        id: 'section-1',
        sectionType: 'notes',
        difficulty: 'simple',
        status: 'approved',
        content: { simpleWords: 'Test content' },
        version: 1,
        language: 'en',
      },
      {
        id: 'section-2',
        sectionType: 'layman',
        difficulty: 'simple',
        status: 'approved',
        content: { overview: 'Test overview' },
        version: 1,
        language: 'en',
      },
    ];

    // Mock subtopic found
    vi.mocked(db.select().from).mockResolvedValueOnce([mockSubtopic]);
    // Mock sections found
    vi.mocked(db.select().from).mockResolvedValueOnce(mockSections);

    const request = new NextRequest('http://localhost:3000/api/tutorial/sections/component-architecture');
    const context = { params: Promise.resolve({ subtopicId: 'component-architecture' }) };

    const response = await GET(request, context);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.subtopicId).toBe('component-architecture');
    expect(data.subtopicName).toBe('Component Architecture');
    expect(data.sections).toBeDefined();
    expect(data.sections.notes).toBeDefined();
    expect(data.sections.layman).toBeDefined();
    expect(data.totalSections).toBe(2);
  });

  it('should filter by difficulty parameter', async () => {
    const { db } = await import('@quiz/db-tutorial');
    
    const mockSubtopic = {
      id: 'subtopic-123',
      name: 'Component Architecture',
      slug: 'component-architecture',
    };

    vi.mocked(db.select().from).mockResolvedValueOnce([mockSubtopic]);
    vi.mocked(db.select().from).mockResolvedValueOnce([]);

    const request = new NextRequest('http://localhost:3000/api/tutorial/sections/component-architecture?difficulty=intermediate');
    const context = { params: Promise.resolve({ subtopicId: 'component-architecture' }) };

    const response = await GET(request, context);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.difficulty).toBe('intermediate');
  });

  it('should return specific section type when requested', async () => {
    const { db } = await import('@quiz/db-tutorial');
    
    const mockSubtopic = {
      id: 'subtopic-123',
      name: 'Component Architecture',
      slug: 'component-architecture',
    };

    const mockSection = {
      id: 'section-1',
      sectionType: 'notes',
      difficulty: 'simple',
      status: 'approved',
      content: { simpleWords: 'Test content' },
      version: 1,
      language: 'en',
    };

    vi.mocked(db.select().from).mockResolvedValueOnce([mockSubtopic]);
    vi.mocked(db.select().from).mockResolvedValueOnce([mockSection]);

    const request = new NextRequest('http://localhost:3000/api/tutorial/sections/component-architecture?sectionType=notes');
    const context = { params: Promise.resolve({ subtopicId: 'component-architecture' }) };

    const response = await GET(request, context);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.sectionType).toBe('notes');
    expect(data.content).toBeDefined();
  });

  it('should handle database errors gracefully', async () => {
    const { db } = await import('@quiz/db-tutorial');
    
    vi.mocked(db.select().from).mockRejectedValueOnce(new Error('Database connection failed'));

    const request = new NextRequest('http://localhost:3000/api/tutorial/sections/component-architecture');
    const context = { params: Promise.resolve({ subtopicId: 'component-architecture' }) };

    const response = await GET(request, context);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });
});
