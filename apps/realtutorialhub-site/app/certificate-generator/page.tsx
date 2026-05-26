import { CertificateGeneratorPage } from "@quiz/marketing-site/certificates/CertificateGeneratorPage";

import { certificateToolBrands } from "../certificate-tools-brands";

export default function RealTutorialHubCertificateGeneratorPage() {
  return (
    <CertificateGeneratorPage
      brands={certificateToolBrands}
      initialBrandId="realtutorialhub"
    />
  );
}
