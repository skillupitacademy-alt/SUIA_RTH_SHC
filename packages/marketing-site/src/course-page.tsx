import { notFound } from "next/navigation";

import { defaultAssessmentCertification, defaultCurriculum } from "@quiz/marketing-site/lib/DefaultCourseData";
import { CourseHeroSection } from "@quiz/marketing-site/components/CoursePages/HeroSection/MainHeroSection";
import AssessmentsCertification from "@quiz/marketing-site/components/CoursePages/Assessments/mainAssessments";
import GradingEvaluation from "@quiz/marketing-site/components/CoursePages/GradingEvaluation/mainGradingCard";
import PlacementSupport from "@quiz/marketing-site/components/CoursePages/Placement/mainPlacement";
import PlacementStatistics from "@quiz/marketing-site/components/CoursePages/PlacementStatistics/mainPlacementStatistics";
import InstructorsMentors from "@quiz/marketing-site/components/CoursePages/InstructorsMentors/mainInstructorsMentors";
import Prerequisites from "@quiz/marketing-site/components/CoursePages/Prerequisites/mainPrerequisiter";
import SuccessStories from "@quiz/marketing-site/components/CoursePages/SuccessStories/mainSuccessStories";
import Companies from "@quiz/marketing-site/components/CoursePages/Companies/mainCompanies";
import Curriculum from "@quiz/marketing-site/components/CoursePages/Curriculum/mainCurriculum";
import { CommunityNetworkSection } from "@quiz/marketing-site/components/CoursePages/Community&Network/CommunityNetworkSection";
import { LearningExperienceTimeline } from "@quiz/marketing-site/components/CoursePages/LearningExperience/LearningExperienceTimeline";
import { TechnicalSupportSection } from "@quiz/marketing-site/components/CoursePages/TechnicalSection/TechnicalSupportSection";
import ParticleClient from "@quiz/marketing-site/components/Particles/ParticleClient";
import { loadMarketingCourseCatalogSnapshot, loadMarketingCoursePageSnapshot } from "@quiz/marketing-site/content/courses";

export async function generateCourseStaticParams() {
  const catalog = await loadMarketingCourseCatalogSnapshot();
  return catalog.courses.map((course) => ({
    slug: course.slug,
  }));
}

export async function CourseMarketingPage({ slug }: { slug: string }) {
  const snapshot = await loadMarketingCoursePageSnapshot(slug);
  const course = snapshot?.course;

  if (!course) {
    notFound();
  }

  const curriculum = course.curriculum ?? defaultCurriculum;
  const assessmentCertification = course.assessmentCertification ?? defaultAssessmentCertification;
  const heroData = snapshot?.heroCommonData;

  return (
    <div>
      <div className="absolute inset-0 -z-10">
        <ParticleClient />
      </div>

      <CourseHeroSection
        id="CourseHero"
        title={course.title}
        heroTitle={course.heroTitle}
        heroSubtitle={course.heroSubtitle}
        description={course.description}
        heroDescription={course.heroDescription}
        heroSubDescription={course.heroSubDescription}
        features={course.features}
        companies={course.companies || heroData?.companyNames || []}
        ctaButtons={course.ctaButtons || heroData?.ctaButtons}
      />

      <Curriculum id="CourseCurriculum" data={curriculum} />

      <AssessmentsCertification
        id="CourseAssessments"
        title="Assessment & Certification"
        description="Comprehensive evaluation system ensuring mastery through multiple assessment formats"
        assessmentCards={assessmentCertification.assessmentCards}
        certificateData={assessmentCertification.certificateData}
      />

      <GradingEvaluation id="CourseGradingCard" data={heroData!.gradingEvaluation} />
      <PlacementSupport id="CoursePlacement" data={heroData!.placementSupport} />
      <PlacementStatistics id="CoursePlacementStatistics" data={heroData!.placementStatistics} />
      <InstructorsMentors id="CourseInstructorsMentors" data={heroData!.instructorsMentors} />
      <CommunityNetworkSection id="CourseCommunityNetwork" />
      <LearningExperienceTimeline id="LearningExperienceTimeline" />
      <TechnicalSupportSection id="CourseTechnicalSupport" />
      <Prerequisites id="CoursePrerequisites" data={heroData!.prerequisites} />
      <SuccessStories id="CourseSuccessStories" />
      <Companies id="CourseCompanies" data={heroData!.hiringCompanies} />
    </div>
  );
}
