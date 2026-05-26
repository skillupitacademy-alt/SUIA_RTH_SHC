import type { MarketingBrand } from "../brand";
import type {
  ContactInfo as LegacyContactInfo,
  WorkingHours,
} from "../lib/ContactData";
import type {
  ContactInfo as FooterContactInfo,
  Course as FooterCourse,
  FooterLink,
  PaymentMethod,
} from "../lib/FooterData";
import type { NavItem } from "../lib/NavBarData";

export type MarketingBrandId = MarketingBrand["id"];

export interface MarketingContactButton {
  type: "whatsapp" | "phone";
  href: string;
  label: string;
}

export interface MarketingNavigationContent {
  navItems: NavItem[];
  contactButtons: MarketingContactButton[];
}

export interface MarketingContactContent {
  config: {
    title: string;
    description: string;
    phoneNumber: string;
    defaultMessage: string;
  };
  info: LegacyContactInfo[];
  workingHours: WorkingHours[];
  location: {
    address: string;
    landmark: string;
    mapUrl: string;
  };
}

export interface MarketingFooterContent {
  brand: {
    name: string;
    highlight: string;
    description: string;
    studentCount: string;
  };
  popularCourses: FooterCourse[];
  quickLinks: FooterLink[];
  policyLinks: FooterLink[];
  paymentMethods: PaymentMethod[];
  contactInfo: FooterContactInfo[];
}

export interface MarketingControlPlaneSnapshot {
  contentVersion: string;
  homepageRevalidateSeconds: number;
  coursePageRevalidateSeconds: number;
  personalization: {
    deviceHintsEnabled: boolean;
    campaignHintsEnabled: boolean;
    geoHintsEnabled: boolean;
  };
  experiments: Array<{
    key: string;
    enabled: boolean;
    assignmentMode: "proxy" | "client";
  }>;
  analytics: {
    collectorEndpoint: string | null;
  };
}

export interface MarketingContentSnapshot {
  brandId: MarketingBrandId;
  navigation: MarketingNavigationContent;
  contact: MarketingContactContent;
  footer: MarketingFooterContent;
}

export interface MarketingBootstrapSnapshot {
  content: MarketingContentSnapshot;
  controlPlane: MarketingControlPlaneSnapshot;
}
