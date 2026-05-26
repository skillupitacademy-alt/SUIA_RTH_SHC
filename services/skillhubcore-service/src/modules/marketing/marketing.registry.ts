import type { AnalyticsBrandId } from '@quiz/marketing-site/config/analytics';
import { marketingFeatureFlags } from '@quiz/marketing-site/lib/feature-flags/feature-flags';

export interface MarketingExperimentDefinition {
  key: string;
  enabled: boolean;
  assignmentMode: 'proxy' | 'client';
  variants: Array<{
    key: 'control' | 'variant-a' | 'variant-b';
    weight: number;
  }>;
  brands: AnalyticsBrandId[];
}

export interface CampaignDefinition {
  key: string;
  title: string;
  brands: AnalyticsBrandId[];
  channels: string[];
  defaultAudience: string;
}

export interface PersonalizationRuleDefinition {
  key: string;
  brands: AnalyticsBrandId[];
  trigger: 'campaign' | 'device' | 'geo' | 'segment';
  target: string;
  message: string;
}

export interface AttributionMetadataDefinition {
  defaultModel: 'last_touch' | 'first_touch' | 'linear' | 'time_decay' | 'position_based';
  supportedModels: Array<'last_touch' | 'first_touch' | 'linear' | 'time_decay' | 'position_based'>;
  brands: AnalyticsBrandId[];
}

export interface RecommendationConfigDefinition {
  brands: AnalyticsBrandId[];
  strategy: 'lead-score' | 'engagement' | 'journey-stage';
  cacheTtlSeconds: number;
}

const experiments: MarketingExperimentDefinition[] = [
  {
    key: 'home-hero',
    enabled: true,
    assignmentMode: 'proxy',
    variants: [
      { key: 'control', weight: 50 },
      { key: 'variant-a', weight: 50 },
    ],
    brands: ['realtutorialhub', 'skillupitacademy'],
  },
];

const campaigns: CampaignDefinition[] = [
  {
    key: 'summer-bootcamp-2026',
    title: 'Summer Bootcamp 2026',
    brands: ['realtutorialhub', 'skillupitacademy'],
    channels: ['instagram', 'youtube', 'seo'],
    defaultAudience: 'career-switchers',
  },
  {
    key: 'data-analyst-accelerator',
    title: 'Data Analyst Accelerator',
    brands: ['realtutorialhub', 'skillupitacademy'],
    channels: ['meta', 'organic', 'whatsapp'],
    defaultAudience: 'entry-level-analysts',
  },
];

const personalizationRules: PersonalizationRuleDefinition[] = [
  {
    key: 'campaign-hero-copy',
    brands: ['realtutorialhub', 'skillupitacademy'],
    trigger: 'campaign',
    target: 'utm_campaign',
    message: 'Align hero copy to active campaign intent.',
  },
  {
    key: 'device-cta-density',
    brands: ['realtutorialhub', 'skillupitacademy'],
    trigger: 'device',
    target: 'mobile',
    message: 'Reduce CTA density for mobile to preserve focus.',
  },
];

const attributionMetadata: AttributionMetadataDefinition[] = [
  {
    defaultModel: 'last_touch',
    supportedModels: ['first_touch', 'last_touch', 'linear', 'time_decay', 'position_based'],
    brands: ['realtutorialhub', 'skillupitacademy'],
  },
];

const recommendationConfigs: RecommendationConfigDefinition[] = [
  {
    brands: ['realtutorialhub', 'skillupitacademy'],
    strategy: 'lead-score',
    cacheTtlSeconds: 900,
  },
];

export function buildMarketingControlPlane(brandId: AnalyticsBrandId) {
  return {
    brandId,
    featureFlags: marketingFeatureFlags.filter((flag) => !flag.brands || flag.brands.includes(brandId)),
    experiments: experiments.filter((experiment) => experiment.brands.includes(brandId)),
    campaigns: campaigns.filter((campaign) => campaign.brands.includes(brandId)),
    personalization: personalizationRules.filter((rule) => rule.brands.includes(brandId)),
    analyticsGovernance: {
      consentRequired: true,
      collectorMode: 'external',
      schemaVersion: 'v1',
    },
    attribution: attributionMetadata.find((item) => item.brands.includes(brandId)) ?? null,
    recommendations: recommendationConfigs.find((item) => item.brands.includes(brandId)) ?? null,
  };
}
