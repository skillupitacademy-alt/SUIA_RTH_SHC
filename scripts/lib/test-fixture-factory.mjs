/**
 * Test Fixture Factory
 * 
 * Reusable pattern for creating isolated tutorial fixtures for E2E tests.
 * 
 * Rule: A test may mutate only data that the same test created.
 * 
 * Lifecycle:
 * 1. Login
 * 2. Create dedicated tutorial fixture (D1 + C1 + C1)
 * 3. Capture immutable baseline
 * 4. Run test
 * 5. Verify
 * 6. DELETE tutorial
 * 7. Verify tutorial no longer exists
 */

import { randomUUID } from 'crypto';

// Canonical D1 fixture from c1-018-fixture.ts
const DEFINITION_D1_PYTHON_VARIABLE = {
  page: {
    type: 'definition',
    category: 'Python Fundamentals',
    title: 'What Is a Python Variable?',
    intro: 'A variable gives a name to a value so that a Python program can work with that value later.',
    definition: 'A Python variable is a name that refers to an object stored in memory.',
    explanation: [
      'Python variables do not directly contain the value itself.',
      'The variable name refers to a Python object.',
      'The same object can be referenced by multiple names.',
    ],
    example: {
      language: 'python',
      code: 'name = "Alice"',
    },
    characteristics: [
      {
        icon: '🏷️',
        title: 'Name',
        description: 'A variable provides a readable name for referring to an object.',
      },
      {
        icon: '🧠',
        title: 'Object Reference',
        description: 'The variable refers to an object rather than storing a primitive value directly.',
      },
    ],
    takeaway: 'Think of a Python variable as a name that refers to an object.',
  },
};

// Canonical C1 fixtures
const CODE_C1_CREATING_VARIABLE = {
  page: {
    type: 'code',
    title: 'Creating a Python Variable',
    introduction: 'Python variables can be created by assigning a value to a name using the assignment operator.',
    language: 'python',
    code: 'name = "Alice"\nage = 25\nprint(name)\nprint(age)',
    explanation: [
      {
        focus: 'name = "Alice"',
        description: 'The name variable refers to the string object "Alice".',
      },
      {
        focus: 'age = 25',
        description: 'The age variable refers to the integer object 25.',
      },
      {
        focus: 'print(name)',
        description: 'Python retrieves the object referenced by name and prints it.',
      },
    ],
    output: {
      value: 'Alice\n25',
      description: 'The program prints both variable values',
    },
    takeaway: 'Assignment creates or updates a name-to-object reference in Python.',
  },
};

const CODE_C1_CHANGING_VARIABLE = {
  page: {
    type: 'code',
    title: 'Changing a Python Variable',
    introduction: 'A variable can later be assigned to a different object through reassignment.',
    language: 'python',
    code: 'score = 10\nprint(score)\nscore = 20\nprint(score)',
    explanation: [
      {
        focus: 'score = 10',
        description: 'score initially refers to the integer object 10.',
      },
      {
        focus: 'score = 20',
        description: 'The name score is reassigned to the integer object 20.',
      },
    ],
    output: {
      value: '10\n20',
    },
    takeaway: 'Variables can be reassigned to different objects during execution.',
  },
};

export class TutorialFixtureFactory {
  constructor(baseUrl, adminEmail, adminPassword, brandId = 'shared') {
    this.baseUrl = baseUrl;
    this.adminEmail = adminEmail;
    this.adminPassword = adminPassword;
    this.brandId = brandId;
    this.adminToken = null;
    this.createdTutorials = [];
  }

  async login() {
    const response = await fetch(`${this.baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: this.adminEmail,
        password: this.adminPassword,
      }),
    });

    if (!response.ok) {
      throw new Error(`Login failed: ${response.status}`);
    }

    const setCookie = response.headers.get('set-cookie');
    this.adminToken = setCookie?.match(/accessToken=([^;]+)/)?.[1];

    if (!this.adminToken) {
      throw new Error('No access token found');
    }
  }

  /**
   * Create isolated D1 + C1 + C1 tutorial fixture
   * @param {string} subtopicId - Test subtopic ID (should be dedicated test subtopic)
   * @param {object} options - Optional overrides
   * @returns {Promise<object>} Created tutorial with baseline
   */
  async createD1C1C1Fixture(subtopicId, options = {}) {
    if (!this.adminToken) {
      throw new Error('Must login() before creating fixtures');
    }

    const d1Id = randomUUID();
    const c1Id1 = randomUUID();
    const c1Id2 = randomUUID();

    const d1Title = options.d1Title || 'What Is a Python Variable?';
    const c1Title1 = options.c1Title1 || 'Creating a Python Variable';
    const c1Title2 = options.c1Title2 || 'Changing a Python Variable';

    const document = {
      schemaVersion: 1,
      blocks: [
        {
          id: d1Id,
          type: 'definition',
          version: 'D1',
          content: {
            ...DEFINITION_D1_PYTHON_VARIABLE,
            page: {
              ...DEFINITION_D1_PYTHON_VARIABLE.page,
              title: d1Title,
            },
          },
        },
        {
          id: c1Id1,
          type: 'code',
          version: 'C1',
          content: {
            ...CODE_C1_CREATING_VARIABLE,
            page: {
              ...CODE_C1_CREATING_VARIABLE.page,
              title: c1Title1,
            },
          },
        },
        {
          id: c1Id2,
          type: 'code',
          version: 'C1',
          content: {
            ...CODE_C1_CHANGING_VARIABLE,
            page: {
              ...CODE_C1_CHANGING_VARIABLE.page,
              title: c1Title2,
            },
          },
        },
      ],
    };

    const response = await fetch(
      `${this.baseUrl}/api/tutorial-composer/sections`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `accessToken=${this.adminToken}`,
        },
        body: JSON.stringify({
          subtopicId,
          brandId: this.brandId,
          content: document,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create fixture: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    const tutorialId = result.data.id;

    // Track for cleanup
    this.createdTutorials.push({ tutorialId, subtopicId });

    // Capture immutable baseline
    const baseline = await this.getTutorialById(tutorialId);

    return {
      tutorialId,
      subtopicId,
      d1Id,
      c1Id1,
      c1Id2,
      document,
      baseline,
    };
  }

  async getTutorialById(tutorialId) {
    const response = await fetch(
      `${this.baseUrl}/api/tutorial-composer/sections/${tutorialId}`,
      {
        headers: { Cookie: `accessToken=${this.adminToken}` },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get tutorial ${tutorialId}: ${response.status}`);
    }

    const result = await response.json();
    return result.data || result;
  }

  async getTutorialBySubtopic(subtopicId) {
    const response = await fetch(
      `${this.baseUrl}/api/tutorial-composer/sections?subtopicId=${subtopicId}&brandId=${this.brandId}&limit=1`,
      {
        headers: { Cookie: `accessToken=${this.adminToken}` },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get tutorial for subtopic ${subtopicId}: ${response.status}`);
    }

    const result = await response.json();
    return result.data?.[0] || null;
  }

  async updateTutorial(tutorialId, document) {
    const response = await fetch(
      `${this.baseUrl}/api/tutorial-composer/sections/${tutorialId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `accessToken=${this.adminToken}`,
        },
        body: JSON.stringify({ content: document }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to update tutorial: ${response.status} - ${errorText}`);
    }

    return await response.json();
  }

  async deleteTutorial(tutorialId) {
    const response = await fetch(
      `${this.baseUrl}/api/tutorial-composer/sections/${tutorialId}`,
      {
        method: 'DELETE',
        headers: { Cookie: `accessToken=${this.adminToken}` },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to delete tutorial ${tutorialId}: ${response.status}`);
    }

    // Remove from tracking after successful deletion
    this.createdTutorials = this.createdTutorials.filter(t => t.tutorialId !== tutorialId);

    return true;
  }

  async verifyTutorialDeleted(tutorialId) {
    try {
      await this.getTutorialById(tutorialId);
      throw new Error(`Tutorial ${tutorialId} still exists after deletion`);
    } catch (error) {
      if (error.message.includes('still exists')) {
        throw error;
      }
      // Expected: tutorial not found
      return true;
    }
  }

  /**
   * Cleanup all created tutorials
   * Call this in finally{} block
   */
  async cleanup() {
    for (const { tutorialId, subtopicId } of this.createdTutorials) {
      try {
        await this.deleteTutorial(tutorialId);
        await this.verifyTutorialDeleted(tutorialId);
      } catch (error) {
        console.warn(`⚠️  Failed to cleanup tutorial ${tutorialId}:`, error.message);
      }
    }
    this.createdTutorials = [];
  }

  getAuthHeaders() {
    return {
      Cookie: `accessToken=${this.adminToken}`,
    };
  }
}
