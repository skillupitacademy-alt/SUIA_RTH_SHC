import type { MarketingBrand } from "../brand";
import {
  CONTACT_CONFIG,
  CONTACT_INFO,
  LOCATION_INFO,
  WORKING_HOURS,
} from "../lib/ContactData";
import {
  CONTACT_INFO as FOOTER_CONTACT_INFO,
  FOOTER_CONFIG,
  PAYMENT_METHODS,
  POLICY_LINKS,
  POPULAR_COURSES,
  QUICK_LINKS,
} from "../lib/FooterData";
import { contactButtons, navItems } from "../lib/NavBarData";
import type {
  MarketingBootstrapSnapshot,
  MarketingBrandId,
  MarketingContentSnapshot,
  MarketingControlPlaneSnapshot,
} from "./contracts";

const defaultBrandMetadata: Record<MarketingBrandId, MarketingBrand> = {
  realtutorialhub: {
    id: "realtutorialhub",
    name: "Real Tutorial Hub",
    shortName: "RTH",
    domain: "https://www.realtutorialhub.com",
    logo: "/Logo.png",
    iconLogo: "/Logo.png",
    colors: {
      primary: "#d03f00",
      secondary: "#124fd6",
    },
    metadata: {
      title: "Real Tutorial Hub",
      description: "Learn real-world skills with Real Tutorial Hub",
    },
  },
  skillupitacademy: {
    id: "skillupitacademy",
    name: "SkillUp IT Academy",
    shortName: "SUIA",
    domain: "https://www.skillupitacademy.com",
    logo: "/brand/skillup-logo.png",
    iconLogo: "/brand/skillup-icon.jpg",
    colors: {
      primary: "#f54a8d",
      secondary: "#133282",
    },
    metadata: {
      title: "SkillUp IT Academy",
      description: "Learn real-world skills with SkillUp IT Academy",
    },
  },
};

const brandContactProfiles: Record<
  MarketingBrandId,
  { phoneNumber: string; email: string; whatsappLabel: string }
> = {
  realtutorialhub: {
    phoneNumber: "9967599801",
    email: "hello@realtutorialhub.com",
    whatsappLabel: "WhatsApp",
  },
  skillupitacademy: {
    phoneNumber: "9967599801",
    email: "hello@skillupitacademy.com",
    whatsappLabel: "WhatsApp",
  },
};

export function getFallbackMarketingContentSnapshot(
  brandId: MarketingBrandId,
  brandOverride?: MarketingBrand,
): MarketingContentSnapshot {
  const brand = brandOverride ?? defaultBrandMetadata[brandId];
  const contactProfile = brandContactProfiles[brandId];
  const defaultMessage = `Hello ${brand.name}! I would like to learn more about your courses.`;

  return {
    brandId,
    navigation: {
      navItems,
      contactButtons: contactButtons.map((button) => ({
        type: button.type,
        href:
          button.type === "whatsapp"
            ? `https://wa.me/91${contactProfile.phoneNumber}?text=${encodeURIComponent(defaultMessage)}`
            : `tel:+91${contactProfile.phoneNumber}`,
        label: button.type === "whatsapp" ? contactProfile.whatsappLabel : button.label,
      })),
    },
    contact: {
      config: {
        ...CONTACT_CONFIG,
        phoneNumber: contactProfile.phoneNumber,
        defaultMessage,
      },
      info: CONTACT_INFO.map((item) => {
        if (item.type === "phone" || item.type === "whatsapp") {
          return {
            ...item,
            value: contactProfile.phoneNumber,
          };
        }

        return item;
      }),
      workingHours: WORKING_HOURS,
      location: LOCATION_INFO,
    },
    footer: {
      brand: {
        ...FOOTER_CONFIG.brand,
        name: brand.name,
        description: `Join ${FOOTER_CONFIG.brand.studentCount} learners building job-ready skills with ${brand.name}.`,
      },
      popularCourses: POPULAR_COURSES,
      quickLinks: QUICK_LINKS,
      policyLinks: POLICY_LINKS,
      paymentMethods: PAYMENT_METHODS,
      contactInfo: FOOTER_CONTACT_INFO.map((item) => {
        if (item.type === "phone") {
          return {
            ...item,
            value: contactProfile.phoneNumber,
          };
        }

        if (item.type === "email") {
          return {
            ...item,
            value: contactProfile.email,
          };
        }

        if (item.type === "website") {
          return {
            ...item,
            value: brand.domain,
          };
        }

        return item;
      }),
    },
  };
}

export function getFallbackMarketingControlPlaneSnapshot(): MarketingControlPlaneSnapshot {
  return {
    contentVersion: "2026-05-26.hybrid-migration.v1",
    homepageRevalidateSeconds: 1800,
    coursePageRevalidateSeconds: 3600,
    personalization: {
      deviceHintsEnabled: true,
      campaignHintsEnabled: true,
      geoHintsEnabled: false,
    },
    experiments: [
      {
        key: "home-hero",
        enabled: true,
        assignmentMode: "proxy",
      },
    ],
    analytics: {
      collectorEndpoint:
        process.env.NEXT_PUBLIC_RTH_ANALYTICS_ENDPOINT ??
        process.env.NEXT_PUBLIC_SUIA_ANALYTICS_ENDPOINT ??
        process.env.ANALYTICS_COLLECTOR_BASE_URL ??
        null,
    },
  };
}

export function getFallbackMarketingBootstrapSnapshot(
  brandId: MarketingBrandId,
  brandOverride?: MarketingBrand,
): MarketingBootstrapSnapshot {
  return {
    content: getFallbackMarketingContentSnapshot(brandId, brandOverride),
    controlPlane: getFallbackMarketingControlPlaneSnapshot(),
  };
}
