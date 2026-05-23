import type { MarketingBrand } from "@quiz/marketing-site";

import { brand as rthBrand } from "../brand";

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
