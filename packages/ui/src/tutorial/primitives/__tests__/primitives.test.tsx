// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Target, Sparkles } from 'lucide-react';
import { BlockShell } from '../BlockShell';
import { BlockHeader } from '../BlockHeader';
import { CardSurface } from '../CardSurface';
import { StepBadge } from '../StepBadge';
import { SyntaxPill } from '../SyntaxPill';
import { CalloutBanner } from '../CalloutBanner';

describe('Universal Block Architecture (UBA) Primitives', () => {
  const mockTheme = {
    primary: '#0B1B3D',
    secondary: '#F54A8D',
    primaryDark: '#071228',
  };

  describe('BlockShell', () => {
    it('renders with canonical UBRC data attributes and standard outer padding', () => {
      const { container } = render(
        <BlockShell
          blockId="block-123"
          blockType="objective"
          blockVersion="O1"
          theme={mockTheme}
        >
          <div data-testid="inner-content">Content</div>
        </BlockShell>
      );

      const article = container.querySelector('article');
      expect(article).not.toBeNull();
      expect(article?.getAttribute('data-block-id')).toBe('block-123');
      expect(article?.getAttribute('data-block-type')).toBe('objective');
      expect(article?.getAttribute('data-block-version')).toBe('O1');
      expect(article?.className).toContain('px-[5%]');
      expect(article?.className).toContain('py-8 sm:py-10');
      expect(screen.getByTestId('inner-content')).toBeTruthy();
    });

    it('supports alternative HTML tag via as prop', () => {
      const { container } = render(
        <BlockShell
          as="section"
          blockId="block-sec"
          blockType="definition"
          blockVersion="D1"
        >
          <span>Section Content</span>
        </BlockShell>
      );

      expect(container.querySelector('section')).not.toBeNull();
    });
  });

  describe('BlockHeader', () => {
    it('renders the complete universal header stack: eyebrow, title, accent bar, intro', () => {
      const { container } = render(
        <BlockHeader
          eyebrow="LEARNING OBJECTIVES"
          icon={Target}
          title="What You Will Master"
          headingLevel="h1"
          titleScale="hero"
          showAccentBar={true}
          introduction="Comprehensive overview of core skills."
          theme={mockTheme}
        />
      );

      expect(screen.getByText('LEARNING OBJECTIVES')).toBeTruthy();
      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toBeTruthy();
      expect(h1.textContent).toBe('What You Will Master');
      expect(h1.className).toContain('clamp');

      // Accent divider
      const divider = container.querySelector('[data-testid="block-header-divider"]');
      expect(divider).not.toBeNull();
      expect(divider?.className).toContain('h-1 w-12 rounded-full');

      // Introduction
      expect(screen.getByText('Comprehensive overview of core skills.')).toBeTruthy();
    });

    it('supports h2 heading level and standard scale', () => {
      render(
        <BlockHeader
          title="Section Heading"
          headingLevel="h2"
          titleScale="standard"
          theme={mockTheme}
        />
      );

      const h2 = screen.getByRole('heading', { level: 2 });
      expect(h2).toBeTruthy();
      expect(h2.className).toContain('text-2xl sm:text-3xl lg:text-4xl');
    });
  });

  describe('CardSurface', () => {
    it('renders with rounded-2xl boundaries and elevated dashboard styling by default', () => {
      const { container } = render(
        <CardSurface theme={mockTheme} variant="default" hoverable={true}>
          <span>Card Body</span>
        </CardSurface>
      );

      const card = container.firstElementChild as HTMLElement;
      expect(card.className).toContain('rounded-2xl');
      expect(card.className).toContain('border');
      expect(card.className).toContain('shadow-xl');
      expect(card.className).toContain('-translate-y-1');
      expect(card.className).toContain('backdrop-blur-md');
    });

    it('supports subtle elevation mode', () => {
      const { container } = render(
        <CardSurface theme={mockTheme} elevation="subtle" hoverable={true}>
          <span>Card Body</span>
        </CardSurface>
      );

      const card = container.firstElementChild as HTMLElement;
      expect(card.className).toContain('shadow-sm');
      expect(card.className).toContain('hover:shadow-md');
    });
  });

  describe('StepBadge', () => {
    it('renders circular number badge with theme primary color', () => {
      render(<StepBadge step="01" theme={mockTheme} size="md" />);
      const badge = screen.getByText('01');
      expect(badge).toBeTruthy();
      expect(badge.className).toContain('rounded-full');
    });
  });

  describe('SyntaxPill', () => {
    it('renders monospaced verb / syntax tag pill', () => {
      render(<SyntaxPill label="Create" theme={mockTheme} icon={Sparkles} />);
      const pill = screen.getByText('Create');
      expect(pill).toBeTruthy();
      expect(pill.parentElement?.className).toContain('font-mono');
      expect(pill.parentElement?.className).toContain('text-xs font-bold');
    });
  });

  describe('CalloutBanner', () => {
    it('renders elevated takeaway card without left-side border', () => {
      const { container } = render(
        <CalloutBanner
          title="Key Takeaway"
          theme={mockTheme}
          variant="takeaway"
        >
          Remember to always close database connections.
        </CalloutBanner>
      );

      expect(screen.getByText('Key Takeaway')).toBeTruthy();
      expect(screen.getByText('Remember to always close database connections.')).toBeTruthy();

      const banner = container.firstElementChild as HTMLElement;
      expect(banner.className).toContain('rounded-2xl');
      expect(banner.className).toContain('shadow-xl');
      // Strict rule: No asymmetrical left-side border
      expect(banner.className).not.toContain('border-l-4');
      expect(banner.className).not.toContain('border-l-');
    });

    it('consumes 4-color brand tokens for SUIA and RTH', () => {
      const suiaTheme = {
        primary: '#0B1B3D',
        secondary: '#F54A8D',
        accent1: '#0284C7',
        accent2: '#10B981',
      };
      const { container } = render(
        <CalloutBanner
          title="Info Banner"
          theme={suiaTheme}
          variant="info"
        >
          Using Sky Cyan interactive token.
        </CalloutBanner>
      );

      const banner = container.firstElementChild as HTMLElement;
      expect(banner.className).toContain('rounded-2xl');
      expect(banner.className).not.toContain('border-l-');
    });
  });
});
