'use client';

import React from 'react';
import type { ReactNode } from 'react';

import { BlockErrorFallback } from '@/components/content/BlockErrorFallback';

type ErrorBoundaryProps = {
  blockName: string;
  children: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
};

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch() {
    // Fallback UI is sufficient for this experience.
  }

  render() {
    if (this.state.hasError) {
      return <BlockErrorFallback blockName={this.props.blockName} />;
    }

    return this.props.children;
  }
}
