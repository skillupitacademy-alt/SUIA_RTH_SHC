'use client';

import React from 'react';
import { CTAButtons } from './types';

interface HeroCTAProps {
  buttons: CTAButtons;
}

export const HeroCTA: React.FC<HeroCTAProps> = () => (
  <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-20" />
);
