export interface SkillItem {
  id: number;
  name: string;
  imagePath: string;
  category?: 'frontend' | 'backend' | 'cloud' | 'database' | 'tools';
}

export const SKILLS_DATA: SkillItem[] = [
  { id: 1, name: "JS", imagePath: "/One.png", category: 'frontend' },
  { id: 2, name: "TypeScript", imagePath: "/Two.png", category: 'frontend' },
  { id: 3, name: "Python", imagePath: "/Three.png", category: 'backend' },
  { id: 4, name: "AWS", imagePath: "/Four.png", category: 'cloud' },
  { id: 5, name: "Next.js", imagePath: "/Five.png", category: 'frontend' },
  { id: 6, name: "Docker", imagePath: "/Six.png", category: 'tools' },
  { id: 7, name: "NumPy", imagePath: "/Seven.png", category: 'backend' },
  { id: 8, name: "Node.js", imagePath: "/Eight.png", category: 'backend' },
  { id: 9, name: "Kubernetes", imagePath: "/Nine.png", category: 'cloud' },
  { id: 10, name: "Mongo DB", imagePath: "/Ten.png", category: 'database' },
  { id: 11, name: "PostgreSQL", imagePath: "/Eleven.png", category: 'database' },
  { id: 12, name: "SQL", imagePath: "/Twelve.png", category: 'database' },
  { id: 13, name: "Git", imagePath: "/Thirteen.png", category: 'tools' },
  { id: 14, name: "HTML", imagePath: "/Fourteen.png", category: 'frontend' },
  { id: 15, name: "Tailwind", imagePath: "/Fiftheen.png", category: 'frontend' },
  { id: 16, name: "React", imagePath: "/Sixteen.png", category: 'frontend' },
  { id: 17, name: "Spring Boot", imagePath: "/Seventeen.png", category: 'backend' },
  { id: 18, name: "Python", imagePath: "/Eighteen.png", category: 'backend' },
  { id: 19, name: "Pandas", imagePath: "/Nineteen.png", category: 'backend' },
  { id: 20, name: "Django", imagePath: "/Twenty.png", category: 'backend' }
];

export const SECTION_CONFIG = {
  title: "We Teach Industry-Standard Stacks",
  description: "Master the tools and technologies used by top companies",
  accentColor: "from-orange-500 via-orange-400 to-orange-500",
  textColor: "#4B49AC"
} as const;