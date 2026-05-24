import { notFound } from "next/navigation";

import { allCourses, heroCommonData } from "@quiz/marketing-site/lib/CoursesCardData";
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

export async function generateCourseStaticParams() {
  return allCourses.map((course) => ({
    slug: course.slug,
  }));
}

export async function CourseMarketingPage({ slug }: { slug: string }) {
  const course = allCourses.find((candidate) => candidate.slug === slug);

  if (!course) {
    notFound();
  }

  const curriculum = course.curriculum ?? defaultCurriculum;
  const assessmentCertification = course.assessmentCertification ?? defaultAssessmentCertification;

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
        companies={course.companies || heroCommonData.companyNames}
        ctaButtons={course.ctaButtons || heroCommonData.ctaButtons}
      />

      <Curriculum id="CourseCurriculum" data={curriculum} />

      <AssessmentsCertification
        id="CourseAssessments"
        title="Assessment & Certification"
        description="Comprehensive evaluation system ensuring mastery through multiple assessment formats"
        assessmentCards={assessmentCertification.assessmentCards}
        certificateData={assessmentCertification.certificateData}
      />

      <GradingEvaluation id="CourseGradingCard" data={heroCommonData.gradingEvaluation} />
      <PlacementSupport id="CoursePlacement" data={heroCommonData.placementSupport} />
      <PlacementStatistics id="CoursePlacementStatistics" data={heroCommonData.placementStatistics} />
      <InstructorsMentors id="CourseInstructorsMentors" data={heroCommonData.instructorsMentors} />
      <CommunityNetworkSection id="CourseCommunityNetwork" />
      <LearningExperienceTimeline id="LearningExperienceTimeline" />
      <TechnicalSupportSection id="CourseTechnicalSupport" />
      <Prerequisites id="CoursePrerequisites" data={heroCommonData.prerequisites} />
      <SuccessStories id="CourseSuccessStories" />
      <Companies id="CourseCompanies" data={heroCommonData.hiringCompanies} />
    </div>
  );
}
