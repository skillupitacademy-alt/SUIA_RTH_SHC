import { createBrowserRouter } from 'react-router';
import { LandingPage } from './pages/LandingPage';
import { BrandSelector } from './pages/BrandSelector';

export const router = createBrowserRouter([
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
]);
