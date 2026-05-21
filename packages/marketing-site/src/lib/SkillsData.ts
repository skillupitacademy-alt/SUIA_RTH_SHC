export interface SkillItem {
  id: number;
  name: string;
  imagePath: string;
  category?: 'frontend' | 'backend' | 'cloud' | 'database' | 'tools';
}

export const SKILLS_DATA: SkillItem[] = [
  { id: 1, name: "JS", imagePath: "/One.webp", category: 'frontend' },
  { id: 2, name: "TypeScript", imagePath: "/Two.webp", category: 'frontend' },
  { id: 3, name: "Python", imagePath: "/Three.webp", category: 'backend' },
  { id: 4, name: "AWS", imagePath: "/Four.webp", category: 'cloud' },
  { id: 5, name: "Next.js", imagePath: "/Five.webp", category: 'frontend' },
  { id: 6, name: "Docker", imagePath: "/Six.webp", category: 'tools' },
  { id: 7, name: "NumPy", imagePath: "/Seven.webp", category: 'backend' },
  { id: 8, name: "Node.js", imagePath: "/Eight.webp", category: 'backend' },
  { id: 9, name: "Kubernetes", imagePath: "/Nine.webp", category: 'cloud' },
  { id: 10, name: "Mongo DB", imagePath: "/Ten.webp", category: 'database' },
  { id: 11, name: "PostgreSQL", imagePath: "/Eleven.webp", category: 'database' },
  { id: 12, name: "SQL", imagePath: "/Twelve.webp", category: 'database' },
  { id: 13, name: "Git", imagePath: "/Thirteen.webp", category: 'tools' },
  { id: 14, name: "HTML", imagePath: "/Fourteen.webp", category: 'frontend' },
  { id: 15, name: "Tailwind", imagePath: "/Fiftheen.webp", category: 'frontend' },
  { id: 16, name: "React", imagePath: "/Sixteen.webp", category: 'frontend' },
  { id: 17, name: "Spring Boot", imagePath: "/Seventeen.webp", category: 'backend' },
  { id: 18, name: "Python", imagePath: "/Eighteen.webp", category: 'backend' },
  { id: 19, name: "Pandas", imagePath: "/Nineteen.webp", category: 'backend' },
  { id: 20, name: "Django", imagePath: "/Twenty.webp", category: 'backend' }
];

export const SECTION_CONFIG = {
  title: "We Teach Industry-Standard Stacks",
  description: "Master the tools and technologies used by top companies",
  accentColor: "from-orange-500 via-orange-400 to-orange-500",
  textColor: "#4B49AC"
} as const;