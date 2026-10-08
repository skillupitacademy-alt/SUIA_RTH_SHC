'use client';

import { useEffect } from 'react';
import React from 'react';
import * as ReactDOM from 'react-dom';

export function DevAxe() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    void import('@axe-core/react').then((axe) => {
      void axe.default(React, ReactDOM, 1000);
    });

    return undefined;
  }, []);

  return null;
}
