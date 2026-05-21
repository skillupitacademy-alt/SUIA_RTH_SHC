import { CommunityFeaturesGrid } from "./CommunityFeaturesGrid";
import { AlumniBenefitsGrid } from "./AlumniBenefitsGrid";
import { CommunitySection } from "@/lib/CoursesCardData";
import { SectionHeader } from "@/components/CommonHeader/SectionHeader";


interface CommunityNetworkSectionProps {
  id: string;
}


export const CommunityNetworkSection = ({ id }: CommunityNetworkSectionProps) => {
  const { communityFeatures, alumniBenefits } = CommunitySection;

  return (
    <section id="CourseCommunityNetwork" className="relative py-16 px-4 md:px-8 lg:px-20">


      <div className="relative max-w-7xl mx-auto">

        <SectionHeader title={CommunitySection.title} description={CommunitySection.description} />


        {/* Community features section */}
        <CommunityFeaturesGrid features={communityFeatures} />

        {/* Alumni benefits section with header */}
        <div className="mt-20 pt-12 border-t border-blue-200/50">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-700 to-blue-600 bg-clip-text text-transparent">
              Alumni Network Benefits
            </h2>
            <p className="text-gray-500">Unlock exclusive advantages with our alumni network</p>
          </div>

          <AlumniBenefitsGrid benefits={alumniBenefits} />
        </div>

      </div>
    </section>
  );
};