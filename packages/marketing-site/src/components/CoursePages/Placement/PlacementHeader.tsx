'use client';

interface PlacementHeaderProps {
  title: string;
  description: string;
}

export const PlacementHeader: React.FC<PlacementHeaderProps> = ({ 
  title, 
  description 
}) => (
  <div className="text-center mb-12">
    <h1 className="text-4xl md:text-5xl lg:text-4xl font-bold text-[#4B49AC] mb-4">
      {title}
      <div className="flex justify-center mt-6">
        <div className="h-1.5 bg-gradient-to-r from-orange-500 via-orange-400 to-orange-500 w-48 rounded-full"></div>
      </div>
    </h1>
    <p className="text-xl md:text-xl text-gray-600">
      {description}
    </p>
  </div>
);