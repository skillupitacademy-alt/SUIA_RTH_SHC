import { Briefcase, Code, Database, Globe, Smartphone, Cpu } from 'lucide-react';
import { useBrand } from '../context/BrandContext';

export function RealProjects() {
  const brand = useBrand();
  const accentClass = brand.accentColor === 'orange' ? 'orange' : 'pink';

  const projects = [
    {
      icon: Globe,
      title: "E-Commerce Platform",
      description: "Build a full-stack online store with payment integration, inventory management, and user authentication",
      tech: ["React", "Node.js", "MongoDB", "Stripe"],
      difficulty: "Advanced"
    },
    {
      icon: Smartphone,
      title: "Social Media Dashboard",
      description: "Create a responsive analytics dashboard with real-time data visualization and user engagement metrics",
      tech: ["Next.js", "TypeScript", "Chart.js", "API"],
      difficulty: "Intermediate"
    },
    {
      icon: Database,
      title: "Task Management System",
      description: "Develop a collaborative project management tool with drag-and-drop, notifications, and team features",
      tech: ["Vue.js", "Firebase", "Vuex", "Cloud Functions"],
      difficulty: "Intermediate"
    },
    {
      icon: Cpu,
      title: "AI Chat Application",
      description: "Build an intelligent chatbot using natural language processing and machine learning APIs",
      tech: ["Python", "OpenAI", "Flask", "WebSockets"],
      difficulty: "Expert"
    },
    {
      icon: Code,
      title: "Code Editor IDE",
      description: "Create a browser-based code editor with syntax highlighting, auto-completion, and live preview",
      tech: ["React", "Monaco Editor", "WebAssembly"],
      difficulty: "Advanced"
    },
    {
      icon: Briefcase,
      title: "Portfolio CMS",
      description: "Design a headless CMS for managing portfolio content with a modern admin interface",
      tech: ["GraphQL", "Strapi", "React Admin"],
      difficulty: "Intermediate"
    }
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Intermediate':
        return 'bg-blue-100 text-blue-700';
      case 'Advanced':
        return 'bg-purple-100 text-purple-700';
      case 'Expert':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <section id="projects" className="py-24 bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full mb-6">
            <Briefcase className={`w-4 h-4 text-${accentClass}-400`} />
            <span className={`text-sm text-${accentClass}-300`}>Real-World Experience</span>
          </div>
          <h2
            className="font-bold mb-4 md:mb-6 leading-tight"
            style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}
          >
            Build Portfolio-Ready Projects
          </h2>
          <p className="text-base md:text-xl text-gray-300 max-w-3xl mx-auto px-4">
            Move beyond toy examples. Create production-quality applications that demonstrate
            your skills to employers and clients.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto px-4 md:px-0">
          {projects.map((project, idx) => {
            const Icon = project.icon;
            return (
              <div
                key={idx}
                className="group min-w-0 w-full overflow-hidden bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 shadow-[0_15px_30px_rgba(0,0,0,0.3)] hover:shadow-2xl hover:bg-white/10 hover:border-orange-400/50 hover:-translate-y-2 transition-all duration-300"
              >
                <div className="flex items-start justify-between gap-4 mb-4 min-w-0">
                  <div className={`w-14 h-14 bg-gradient-to-br ${brand.gradientFrom} ${brand.gradientTo} rounded-xl flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${getDifficultyColor(project.difficulty)}`}>
                    {project.difficulty}
                  </span>
                </div>

                <h3 className="text-xl font-bold mb-3 group-hover:text-orange-400 transition-colors break-words">
                  {project.title}
                </h3>

                <p className="text-gray-300 mb-4 leading-relaxed break-words">
                  {project.description}
                </p>

                <div className="flex flex-wrap gap-2 min-w-0">
                  {project.tech.map((tech, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-white/10 rounded-lg text-xs font-medium text-gray-300 break-words"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <button className={`px-6 sm:px-8 py-4 bg-gradient-to-r ${brand.gradientFrom} ${brand.gradientTo} text-white rounded-xl font-semibold shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1`}>
            Explore All Projects
          </button>
        </div>
      </div>
    </section>
  );
}