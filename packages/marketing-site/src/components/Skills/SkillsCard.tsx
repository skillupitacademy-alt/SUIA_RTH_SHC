

import Image from 'next/image';
import { SkillItem } from '@quiz/marketing-site/lib/SkillsData';

interface Props {
  skill: SkillItem;
}

export default function SkillsCard({ skill }: Props) {
  return (
    <div
      className="
        w-28 h-28 rounded-xl flex flex-col items-center justify-center
        bg-white border-transparent transition-all duration-300
        hover:-translate-y-1
        hover:bg-gradient-to-br
        hover:from-blue-500/10
        hover:via-orange-500/10
        hover:to-orange-400/10
        group
      "
      style={{ boxShadow: '2px 2px 5px 1px #00000026' }}
    >
      <div className="relative w-12 h-12 mb-2">
        <Image
          src={skill.imagePath}
          alt={skill.name}
          fill
          className="object-contain"
        />
      </div>

      <p className="text-sm font-semibold text-gray-700 text-center">
        {skill.name}
      </p>
    </div>
  );
}
