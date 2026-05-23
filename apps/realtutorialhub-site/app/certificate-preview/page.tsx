import { Suspense } from "react";

import {
  CertificatePreviewFallback,
  CertificatePreviewPage,
} from "@quiz/marketing-site";

import { brand } from "../../brand";

export default function RealTutorialHubCertificatePreviewPage() {
  return (
    <Suspense fallback={<CertificatePreviewFallback brand={brand} />}>
      <CertificatePreviewPage brand={brand} />
    </Suspense>
  );
}
