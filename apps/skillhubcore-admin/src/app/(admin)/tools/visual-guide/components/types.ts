export interface SubsectionInfo {
  id: string;
  label: string;
  purpose: string;
  components: string[];
  svgId?: string;
  svgLabel?: string;
}

export interface SectionSpec {
  id: string;
  label: string;
  description: string;
  color: string;
  glowColor: string;
  subsections: SubsectionInfo[];
}
