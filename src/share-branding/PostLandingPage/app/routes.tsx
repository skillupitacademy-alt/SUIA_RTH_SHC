// Note: This file is for standalone React apps using react-router, not used in Next.js apps
// If react-router is needed, install it: npm install react-router react-router-dom
import { LandingPage } from './pages/LandingPage';
import { BrandSelector } from './pages/BrandSelector';

export const router = {
  routes: [
    {
      path: '/',
      Component: BrandSelector,
    },
    {
      path: '/rth',
      element: <LandingPage brand="rth" />,
    },
    {
      path: '/skillup',
      element: <LandingPage brand="skillup" />,
    },
  ]
};
