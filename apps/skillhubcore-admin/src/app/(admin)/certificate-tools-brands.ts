import type { MarketingBrand } from "@quiz/marketing-site";

export const rthBrand: MarketingBrand = {
  id: "realtutorialhub",
  name: "Real Tutorial Hub",
  shortName: "RTH",
  domain: "https://www.realtutorialhub.com",
  logo: "/Logo.png",
  iconLogo: "/Logo.png",
  showNameInHeader: true,
  colors: {
    primary: "#d03f00",
    secondary: "#124fd6",
  },
  metadata: {
    title: "Real Tutorial Hub",
    description: "Learn real-world skills with Real Tutorial Hub",
  },
};

export const certificateToolBrands: MarketingBrand[] = [
  rthBrand,
  {
    id: "skillupitacademy",
    name: "SkillUp IT Academy",
    shortName: "SUIA",
    domain: "https://www.skillupitacademy.com",
    logo: "/brand/skillup-logo.png",
    iconLogo: "/brand/skillup-icon.jpg",
    showNameInHeader: false,
    colors: {
      primary: "#f54a8d",
      secondary: "#133282",
    },
    metadata: {
      title: "SkillUp IT Academy",
      description: "Learn real-world skills with SkillUp IT Academy",
    },
  },
];
