import { Suspense } from "react";

import {
  CertificatePreviewFallback,
  CertificatePreviewPage,
} from "@quiz/marketing-site/certificates/CertificatePreviewPage";

import { certificateToolBrands } from "../certificate-tools-brands";

export default function RealTutorialHubCertificatePreviewPage() {
  return (
    <Suspense fallback={<CertificatePreviewFallback brands={certificateToolBrands} />}>
      <CertificatePreviewPage brands={certificateToolBrands} />
    </Suspense>
  );
}
