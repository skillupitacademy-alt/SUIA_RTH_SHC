import { TimelineItem } from "./TimelineItem";
import { TimelineItem as TimelineItemType } from "@quiz/marketing-site/lib/CoursesCardData";


interface TimelineGridProps {
  items: TimelineItemType[];
}

export const TimelineGrid = ({ items }: TimelineGridProps) => {
  return (
    <div className="relative py-8">
      {/* Center vertical line */}
      <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-0.5 bg-gradient-to-b from-blue-200 via-blue-400 to-orange-200 opacity-50"></div>

      {/* Timeline items */}
      <div className="relative">
        {items.map((item, index) => ( // ← Added index parameter here
          <TimelineItem
            key={item.id}
            item={item}
            index={index} // ← Added this prop
          />
        ))}
      </div>

      {/* Start and end indicators */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full border-4 border-white shadow-lg"></div>
      </div>
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2">
        <div className="w-6 h-6 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full border-4 border-white shadow-lg"></div>
      </div>
    </div>
  );
};