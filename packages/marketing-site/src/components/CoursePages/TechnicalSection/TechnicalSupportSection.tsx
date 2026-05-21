import { SupportChannelsGrid } from "./SupportChannelGrid";
import { TechnicalSupportSection as TechData } from "@quiz/marketing-site/lib/CoursesCardData";
import { TechnicalFeaturesGrid } from "./TechnicalFeatureGrid";
import { SectionHeader } from "@quiz/marketing-site/components/CommonHeader/SectionHeader";


interface TechnicalSupportSectionProps {
    id: string;
}


export const TechnicalSupportSection = ({ id }: TechnicalSupportSectionProps) => {
    const { features, supportChannels, tagline } = TechData;

    return (
        <section id={id} className="relative py-16 px-4 md:px-8 lg:px-20 bg-transparent">
            {/* Background elements */}

            <div className="relative max-w-6xl mx-auto">
                {/* Section Header */}

                <SectionHeader title={TechData.sectionTitle} description={TechData.sectionDescription
                } />

                {/* Technical Features */}
                <TechnicalFeaturesGrid features={features} />

                {/* Support Channels Section */}
                <div className="mt-16 pt-12 border-t border-blue-200/50">
                    <div className="text-center mb-10">
                        <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-700 to-blue-300 bg-clip-text text-transparent">
                            Support Channels
                        </h2>
                    </div>

                    <SupportChannelsGrid channels={supportChannels} />
                </div>

            </div>
        </section>
    );
};