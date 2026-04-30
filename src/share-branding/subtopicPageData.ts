import { BrandConfig } from './brandConfig';

export interface TutorialQuickAction {
  label: string;
  target: string;
}

export interface TutorialTopicTreeNode {
  id: string;
  name: string;
  status: 'completed' | 'active' | 'locked';
  subtopics?: TutorialTopicTreeNode[];
}

export interface TutorialContentBlock {
  id: string;
  title: string;
  tone: 'notes' | 'layman' | 'example' | 'technical' | 'code' | 'tutor';
  content: string;
}

export interface TutorialProjectAssignment {
  id: string;
  name: string;
  status: 'open' | 'locked' | 'submitted';
  dueDate: string;
}

export interface TutorialViewData {
  nav: {
    courseLabel: string;
    lessonLabel: string;
    dashboardCtaLabel: string;
    learnerName: string;
    learnerInitials: string;
  };
  sidebar: {
    quickActionsTitle: string;
    quickActions: TutorialQuickAction[];
    curriculumTitle: string;
    topics: TutorialTopicTreeNode[];
    glossaryTitle: string;
    glossaryHtml: string;
  };
  learnerFlow: {
    title: string;
    description: string;
    totalSections: number;
    tierTitle: string;
    tierNames: string[];
  };
  curriculum: {
    title: string;
    blocks: TutorialContentBlock[];
  };
  facultySupport: {
    liveSessionTitle: string;
    liveSessionSubtitle: string;
    topicLabel: string;
    topicPlaceholder: string;
    timeLabel: string;
    detailLabel: string;
    detailPlaceholder: string;
    requestCtaLabel: string;
    processingLabel: string;
    scheduledTitle: string;
    scheduledDescription: string;
    requestAnotherLabel: string;
    projectsTitle: string;
    projects: TutorialProjectAssignment[];
  };
  tutorDrawer: {
    subtitle: string;
    welcomeMessage: string;
    inputPlaceholder: string;
  };
}

export interface TutorialApiResponse extends TutorialViewData {}

export function mapTutorialApiToViewData(api: TutorialApiResponse): TutorialViewData {
  return api;
}

function buildTutorialApiResponse(brand: BrandConfig): TutorialApiResponse {
  return {
    nav: {
      courseLabel: 'Full-Stack Development',
      lessonLabel: 'Component Architecture',
      dashboardCtaLabel: 'Dashboard',
      learnerName: 'Alex J.',
      learnerInitials: 'AJ',
    },
    sidebar: {
      quickActionsTitle: 'Quick Actions',
      quickActions: [
        { label: 'Continue', target: 'learner-flow' },
        { label: brand.tutorLabel, target: 'ai-tutor' },
        { label: 'Progress', target: 'learner-flow' },
        { label: 'Weak Areas', target: 'learner-flow' },
        { label: 'Sessions', target: 'live-session' },
        { label: 'Projects', target: 'projects' },
      ],
      curriculumTitle: 'Curriculum',
      topics: [
        {
          id: 'topic-1',
          name: 'Introduction to React',
          status: 'completed',
          subtopics: [
            { id: 'sub-1-1', name: 'What is React?', status: 'completed' },
            { id: 'sub-1-2', name: 'JSX Basics', status: 'completed' },
          ],
        },
        {
          id: 'topic-2',
          name: 'Component Architecture',
          status: 'active',
          subtopics: [
            { id: 'sub-2-1', name: 'Functional Components', status: 'completed' },
            { id: 'sub-2-2', name: 'Props & State', status: 'active' },
            { id: 'sub-2-3', name: 'Lifecycle Methods', status: 'locked' },
          ],
        },
        {
          id: 'topic-3',
          name: 'Hooks Deep Dive',
          status: 'locked',
          subtopics: [
            { id: 'sub-3-1', name: 'useState', status: 'locked' },
            { id: 'sub-3-2', name: 'useEffect', status: 'locked' },
          ],
        },
      ],
      glossaryTitle: 'Key Terms',
      glossaryHtml: '<strong>JSX:</strong> JavaScript XML syntax extension<br /><strong>Props:</strong> Data passed to components',
    },
    learnerFlow: {
      title: 'Your Learning Progress',
      description: 'Complete all sections to unlock assignments',
      totalSections: 6,
      tierTitle: 'Assignment Paths',
      tierNames: ['Basic', 'Intermediate', 'Advanced'],
    },
    curriculum: {
      title: 'Curriculum Sections',
      blocks: [
        {
          id: 'notes',
          title: 'Notes',
          tone: 'notes',
          content: 'Component architecture is the foundation of React development. It involves breaking down your UI into reusable, self-contained pieces called components. Each component manages its own state and can be composed together to build complex interfaces.',
        },
        {
          id: 'layman',
          title: 'Layman Explanation',
          tone: 'layman',
          content: 'Think of React components like LEGO blocks. Each block is a separate piece that does one thing well. You can snap them together in different ways to build whatever you want. Just like LEGO, you can reuse the same blocks in different parts of your creation!',
        },
        {
          id: 'reallife',
          title: 'Real Life Example',
          tone: 'example',
          content: "Imagine you're building a social media feed. Instead of writing all the code in one giant file, you create separate components: a Post component, a CommentList component, and a LikeButton component. Now you can use these components anywhere in your app!",
        },
        {
          id: 'technical',
          title: 'Technical Deep Dive',
          tone: 'technical',
          content: 'Components are JavaScript functions or classes that return JSX. They encapsulate state, props, and lifecycle logic. The component tree forms a unidirectional data flow where parent components pass props down to children. State updates trigger re-renders through the reconciliation algorithm.',
        },
        {
          id: 'code',
          title: 'Code Example',
          tone: 'code',
          content: `function UserCard({ name, email }) {\n  const [isFollowing, setIsFollowing] = useState(false);\n\n  return (\n    <div className="user-card">\n      <h3>{name}</h3>\n      <p>{email}</p>\n      <button onClick={() => setIsFollowing(!isFollowing)}>\n        {isFollowing ? 'Unfollow' : 'Follow'}\n      </button>\n    </div>\n  );\n}`,
        },
        {
          id: 'ai-tutor',
          title: `${brand.tutorLabel} Brief`,
          tone: 'tutor',
          content: 'Key concepts to master: 1) Component composition, 2) Props for data flow, 3) State for interactivity, 4) Reusability patterns. Practice by identifying reusable parts in existing websites and imagining how you would componentize them.',
        },
      ],
    },
    facultySupport: {
      liveSessionTitle: 'Request Live Session',
      liveSessionSubtitle: 'Schedule 1-on-1 time with faculty',
      topicLabel: 'Topic',
      topicPlaceholder: 'e.g., React Hooks confusion',
      timeLabel: 'Preferred Time',
      detailLabel: 'Additional Details',
      detailPlaceholder: 'What would you like to discuss?',
      requestCtaLabel: 'Request Session',
      processingLabel: 'Processing Request...',
      scheduledTitle: 'Session Scheduled!',
      scheduledDescription: "You'll receive a confirmation email shortly with the meeting link.",
      requestAnotherLabel: 'Request Another',
      projectsTitle: 'Project Assignments',
      projects: [
        { id: 'p1', name: 'Build a Todo App', status: 'open', dueDate: 'Apr 5, 2026' },
        { id: 'p2', name: 'Create a Weather Dashboard', status: 'submitted', dueDate: 'Apr 12, 2026' },
        { id: 'p3', name: 'Design System Implementation', status: 'locked', dueDate: 'Apr 19, 2026' },
      ],
    },
    tutorDrawer: {
      subtitle: 'Always here to help',
      welcomeMessage: `Hi! I'm your ${brand.tutorLabel}. Ask me anything about the current topic!`,
      inputPlaceholder: 'Ask a question...',
    },
  };
}

export async function loadTutorialData(brand: BrandConfig): Promise<TutorialViewData> {
  const apiResponse = buildTutorialApiResponse(brand);
  return mapTutorialApiToViewData(apiResponse);
}
