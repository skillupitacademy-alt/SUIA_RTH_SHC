import { TimelineGrid } from "./TimelineGrid";
import { timelineData } from "@quiz/marketing-site/lib/CoursesCardData";
import { SectionHeader } from "@quiz/marketing-site/components/CommonHeader/SectionHeader";
import { LearningExperienceTimelineData } from "@quiz/marketing-site/lib/CoursesCardData";


interface LearningExperienceTimelineProps {
  id: string;
}


export const LearningExperienceTimeline = ({id} : LearningExperienceTimelineProps) => {
  return (
    <section id={id} className="relative py-16 px-4 md:px-8 lg:px-20 bg-gradient-to-b from-white to-blue-50/30 overflow-hidden">
      {/* Background elements */}


      <div className="relative max-w-6xl mx-auto">
        {/* Header */}

        <SectionHeader title={LearningExperienceTimelineData.sectionTitle} description={LearningExperienceTimelineData.sectionDescription} />

        {/* Timeline */}
        <TimelineGrid items={timelineData} />

        {/* Weekly Schedule Section */}
        <div className="mt-20">
          {/* Section Header */}
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Weekly Schedule
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Structured learning plan for maximum productivity and skill development
            </p>
          </div>

          {/* Schedule Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {/* Mon-Fri */}
            <div className="text-center bg-white rounded-xl p-6 border border-blue-100 hover:border-orange-300 transition-colors duration-300">
              <div className="inline-block px-4 py-2 bg-blue-100 text-blue-700 font-bold rounded-lg mb-4">
                Mon-Fri
              </div>
              <div className="text-lg font-bold text-gray-900 mb-2">3-4 hours</div>
              <div className="text-gray-700">Live Classes</div>
            </div>

            {/* Daily */}
            <div className="text-center bg-white rounded-xl p-6 border border-blue-100 hover:border-orange-300 transition-colors duration-300">
              <div className="inline-block px-4 py-2 bg-orange-100 text-orange-700 font-bold rounded-lg mb-4">
                Daily
              </div>
              <div className="text-lg font-bold text-gray-900 mb-2">2-3 hours</div>
              <div className="text-gray-700">Self Practice</div>
            </div>

            {/* Weekends */}
            <div className="text-center bg-white rounded-xl p-6 border border-blue-100 hover:border-orange-300 transition-colors duration-300">
              <div className="inline-block px-4 py-2 bg-blue-100 text-blue-700 font-bold rounded-lg mb-4">
                Weekends
              </div>
              <div className="text-lg font-bold text-gray-900 mb-2">Projects &</div>
              <div className="text-gray-700">Workshops</div>
            </div>

            {/* 24/7 */}
            <div className="text-center bg-white rounded-xl p-6 border border-blue-100 hover:border-orange-300 transition-colors duration-300">
              <div className="inline-block px-4 py-2 bg-orange-100 text-orange-700 font-bold rounded-lg mb-4">
                24/7
              </div>
              <div className="text-lg font-bold text-gray-900 mb-2">Community</div>
              <div className="text-gray-700">Support</div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};