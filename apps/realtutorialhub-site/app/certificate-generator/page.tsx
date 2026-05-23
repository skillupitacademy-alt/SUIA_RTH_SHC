import { CertificateGeneratorPage } from "@quiz/marketing-site";

import { certificateToolBrands } from "../certificate-tools-brands";

export default function RealTutorialHubCertificateGeneratorPage() {
  return (
    <CertificateGeneratorPage
      brands={certificateToolBrands}
      initialBrandId="realtutorialhub"
    />
  );
}
