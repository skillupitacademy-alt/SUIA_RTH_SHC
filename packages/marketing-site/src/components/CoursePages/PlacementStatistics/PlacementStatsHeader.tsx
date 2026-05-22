'use client';

interface PlacementStatsHeaderProps {
  title: string;
  description: string;
}

export const PlacementStatsHeader: React.FC<PlacementStatsHeaderProps> = ({ 
  title, 
  description 
}) => (
  <div 
    data-aos="fade-up"
    data-aos-duration="700"
    data-aos-once="false"
    className="text-center mb-12"
  >
    <h1 className="text-4xl md:text-5xl lg:text-4xl font-bold text-[#4B49AC] mb-4">
      {title}
      <div className="flex justify-center mt-6">
        <div className="h-1.5 w-48 rounded-full" style={{ backgroundColor: "var(--brand-primary)" }}></div>
      </div>
    </h1>
    <p className="text-xl md:text-xl text-gray-600">
      {description}
    </p>
  </div>
);
