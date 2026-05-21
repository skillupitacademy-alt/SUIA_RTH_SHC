import { AlumniBenefitCard } from "./AlumniBenefitCard";
import { AlumniBenefits } from "@quiz/marketing-site/lib/CoursesCardData";

interface AlumniBenefitsGridProps {
  benefits: AlumniBenefits[];
}

export const AlumniBenefitsGrid = ({ benefits }: AlumniBenefitsGridProps) => {
  // Define colors for each benefit (4 different colors for 4 cards)
  const colors: Array<'blue' | 'green' | 'orange' | 'purple' | 'red' | 'teal' | 'indigo' | 'pink'> = [
    'blue', 'green', 'orange', 'purple'
  ];
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      {benefits.map((benefit, index) => (
        <AlumniBenefitCard
          key={index}
          icon={benefit.icon}
          name={benefit.name}
          color={colors[index % colors.length]} // Assign color based on position
        />
      ))}
    </div>
  );
};