import { SupportChannelCard } from "./SupportChannelCard";
import { SupportChannel } from "@quiz/marketing-site/lib/CoursesCardData";

interface SupportChannelsGridProps {
  channels: SupportChannel[];
}

export const SupportChannelsGrid = ({ channels }: SupportChannelsGridProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {channels.map((channel, index) => (
        <SupportChannelCard
          key={index}
          icon={channel.icon}
          name={channel.name}
          description={channel.description}
        />
      ))}
    </div>
  );
};