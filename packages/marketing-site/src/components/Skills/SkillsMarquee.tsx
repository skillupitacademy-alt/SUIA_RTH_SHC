

import { SKILLS_DATA } from '@quiz/marketing-site/lib/SkillsData';
import SkillsCard from './SkillsCard';

interface Props {
  direction?: 'left' | 'right';
  speed?: number;
}

export default function SkillsMarquee({
  direction = 'left',
  speed = 30,
}: Props) {
  const skills = [...SKILLS_DATA, ...SKILLS_DATA];

  return (
    <div className="marquee w-full overflow-hidden">
      <div
        className={`marquee-track ${direction === 'right' ? 'reverse' : ''}`}
        style={{ animationDuration: `${speed}s` }}
      >
        {skills.map((skill, i) => (
          <div key={`${skill.id}-${i}`} className="mx-4 shrink-0 pt-2 pb-2">
            <SkillsCard skill={skill} />
          </div>
        ))}

      </div>
    </div>
  );
}
