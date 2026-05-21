import { TechnicalFeatureCard } from "./TechnicalFeatureCard";
import { TechnicalSupportFeature } from "@/lib/CoursesCardData";

interface TechnicalFeaturesGridProps {
  features: TechnicalSupportFeature[];
}

export const TechnicalFeaturesGrid = ({ features }: TechnicalFeaturesGridProps) => {
  // Define colors for each feature
  const colors: Array<'blue' | 'green' | 'orange' | 'purple' | 'red' | 'teal' | 'indigo' | 'pink'> = [
    'blue', 'green', 'orange', 'purple'
  ];
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
      {features.map((feature, index) => (
        <TechnicalFeatureCard
          key={index}
          icon={feature.icon}
          title={feature.title}
          description={feature.description}
          color={colors[index % colors.length]}
        />
      ))}
    </div>
  );
};