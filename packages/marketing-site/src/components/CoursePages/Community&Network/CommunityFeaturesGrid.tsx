import { CommunityCard } from "./CommunityCard";
import { CommunityData } from "@quiz/marketing-site/lib/CoursesCardData";

interface CommunityFeaturesGridProps {
  features: CommunityData[];
}

export const CommunityFeaturesGrid = ({ features }: CommunityFeaturesGridProps) => {
  // Define colors for each card
  const colors: Array<'blue' | 'green' | 'orange' | 'purple' | 'red' | 'teal' | 'indigo' | 'pink'> = [
    'blue', 'green', 'orange'
  ];
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
      {features.map((feature, index) => (
        <CommunityCard
          key={index}
          icon={feature.icon}
          heading={feature.heading}
          subline={feature.subline}
          color={colors[index % colors.length]} // Cycle through colors
        />
      ))}
    </div>
  );
};