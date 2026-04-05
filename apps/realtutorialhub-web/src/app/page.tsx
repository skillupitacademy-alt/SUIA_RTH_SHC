import { realtutorialhubBrand } from '@quiz/config/src/brands';

import { SharedLandingPage } from '../../../../src/share-branding/SharedLandingPage';

export default function HomePage() {
  return (
    <SharedLandingPage
      brand={realtutorialhubBrand}
      startLearningHref="/start-learning"
      loginHref="/login"
    />
  );
}
