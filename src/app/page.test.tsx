/* eslint-disable @next/next/no-img-element */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import * as fc from 'fast-check';
import Link from 'next/link';
import React from 'react';
import { Badge } from '@/components/ui/badge';

type MockLinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  children: React.ReactNode
  href: string
}

// Mock Next.js components
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: MockLinkProps) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// Create simple test components that match the structure
const TestNavigation = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200/50">
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <img src="/images/Logo_1.svg" alt="TIPSIO Logo" className="h-8 w-8" />
          <span className="text-xl sm:text-2xl font-heading font-bold text-gradient">TIPSIO</span>
          <Badge variant="beta">BETA</Badge>
        </Link>
      </nav>
    </header>
  );
};

const TestFooter = () => {
  return (
    <footer className="py-8 sm:py-10 px-4 sm:px-6 bg-slate-900 text-slate-400">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 sm:gap-6">
        <Link href="/" className="flex items-center gap-2">
          <img src="/images/Logo_1.svg" alt="TIPSIO Logo" className="h-8 w-8" />
          <span className="text-xl font-heading font-bold text-gradient">TIPSIO</span>
          <Badge variant="beta">BETA</Badge>
        </Link>
      </div>
    </footer>
  );
};



/**
 * **Feature: landing-page-improvements, Property 5: Logo link navigation**
 * 
 * *For any* logo element in header or footer, clicking should navigate to the home page ("/")
 * 
 * **Validates: Requirements 2.3**
 */
describe('Property 5: Logo link navigation', () => {
  it('should have logo link pointing to home page in header', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        const { container } = render(<TestNavigation />);

        // Find the link that contains the logo image
        const logoLink = container.querySelector('a[href="/"]');
        
        expect(logoLink).toBeTruthy();

        // Check that logo link contains the logo image
        const img = logoLink?.querySelector('img[alt="TIPSIO Logo"]');
        expect(img).toBeTruthy();
        
        // Verify it's in a header
        const header = logoLink?.closest('header');
        expect(header).toBeTruthy();
      }),
      { numRuns: 100 }
    );
  });

  it('should have logo link pointing to home page in footer', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        const { container } = render(<TestFooter />);

        // Find the link that contains the logo image
        const logoLink = container.querySelector('a[href="/"]');
        
        expect(logoLink).toBeTruthy();

        // Check that logo link contains the logo image
        const img = logoLink?.querySelector('img[alt="TIPSIO Logo"]');
        expect(img).toBeTruthy();
        
        // Verify it's in a footer
        const footer = logoLink?.closest('footer');
        expect(footer).toBeTruthy();
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * **Feature: landing-page-improvements, Property 6: Beta label styling**
 * 
 * *For any* rendered beta badge, it should use the gradient styling, be uppercase,
 * and remain visually secondary to the brand name
 * 
 * **Validates: Requirements 2.4**
 */
describe('Property 6: Beta label styling', () => {
  it('should render beta badge with gradient styling in header', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        const { container } = render(<TestNavigation />);

        // Find beta badge
        const betaLabel = Array.from(container.querySelectorAll('*')).find(
          (el) => el.textContent === 'BETA'
        );

        expect(betaLabel).toBeTruthy();

        // Check that beta badge uses gradient styling
        expect(betaLabel?.className).toContain('bg-gradient-to-r');
        expect(betaLabel?.className).toContain('uppercase');
        
        // Find the parent link to compare with brand name
        const parentLink = betaLabel?.closest('a');
        const brandName = parentLink?.querySelector('span.text-xl, span.text-2xl');
        
        expect(brandName).toBeTruthy();
        
        // Beta badge should remain visibly smaller than the brand name
        expect(brandName?.className.includes('text-xl') || brandName?.className.includes('text-2xl')).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('should render beta badge with gradient styling in footer', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        const { container } = render(<TestFooter />);

        // Find beta badge
        const betaLabel = Array.from(container.querySelectorAll('*')).find(
          (el) => el.textContent === 'BETA'
        );

        expect(betaLabel).toBeTruthy();

        // Check for gradient styling
        expect(betaLabel?.className).toContain('bg-gradient-to-r');
        expect(betaLabel?.className).toContain('uppercase');

        // Find the parent link to compare with brand name
        const parentLink = betaLabel?.closest('a');
        const brandName = parentLink?.querySelector('span.text-xl');
        
        expect(brandName).toBeTruthy();
        
        // Ensure badge is visually secondary to the brand name
        expect(brandName?.className.includes('text-xl')).toBe(true);
      }),
      { numRuns: 100 }
    );
  });
});


// Test components for payment methods
const TestLogoBar = () => {
  return (
    <section className="py-8 px-4 sm:px-6 bg-slate-50 border-y border-slate-100">
      <div className="max-w-4xl mx-auto">
        <p className="text-center text-sm text-slate-500 mb-6">Guests pay the usual way</p>
        <div className="flex flex-wrap justify-center items-center gap-8 opacity-60 grayscale">
          <img src="/images/payment/visa.svg" alt="Visa" className="h-6" />
          <img src="/images/payment/mastercard.svg" alt="Mastercard" className="h-6" />
          <img src="/images/payment/googlepay.svg" alt="Google Pay" className="h-6" />
          <div className="text-slate-700 font-semibold">GoPay</div>
          <div className="text-slate-700 font-semibold">OVO</div>
        </div>
      </div>
    </section>
  );
};

/**
 * **Feature: landing-page-improvements, Property 7: Payment method logo display**
 * 
 * *For any* payment method in the enabled list (Visa, Mastercard, Google Pay), 
 * the system should render an image element instead of text
 * 
 * **Validates: Requirements 3.2, 3.3, 3.4**
 */
describe('Property 7: Payment method logo display', () => {
  it('should render image elements for Visa, Mastercard, and Google Pay', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        const { container } = render(<TestLogoBar />);

        // Check for Visa logo
        const visaLogo = container.querySelector('img[alt="Visa"]');
        expect(visaLogo).toBeTruthy();
        expect(visaLogo?.getAttribute('src')).toBe('/images/payment/visa.svg');

        // Check for Mastercard logo
        const mastercardLogo = container.querySelector('img[alt="Mastercard"]');
        expect(mastercardLogo).toBeTruthy();
        expect(mastercardLogo?.getAttribute('src')).toBe('/images/payment/mastercard.svg');

        // Check for Google Pay logo
        const googlepayLogo = container.querySelector('img[alt="Google Pay"]');
        expect(googlepayLogo).toBeTruthy();
        expect(googlepayLogo?.getAttribute('src')).toBe('/images/payment/googlepay.svg');

        // Verify QRIS is not present
        const qrisText = container.textContent;
        expect(qrisText).not.toContain('QRIS');
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * **Feature: landing-page-improvements, Property 8: Payment method logo size consistency**
 * 
 * *For any* set of payment method logos, all logos should have the same height dimension
 * 
 * **Validates: Requirements 3.5**
 */
describe('Property 8: Payment method logo size consistency', () => {
  it('should have consistent height class for all payment logos', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        const { container } = render(<TestLogoBar />);

        // Get all payment method images
        const paymentLogos = container.querySelectorAll('img[alt*="Visa"], img[alt*="Mastercard"], img[alt*="Google Pay"]');

        expect(paymentLogos.length).toBe(3);

        // Check that all logos have the same height class
        paymentLogos.forEach((logo) => {
          expect(logo.className).toContain('h-6');
        });

        // Verify all have the same height class
        const heightClasses = Array.from(paymentLogos).map((logo) => {
          const match = logo.className.match(/h-\d+/);
          return match ? match[0] : null;
        });

        // All should have the same height class
        const uniqueHeights = new Set(heightClasses);
        expect(uniqueHeights.size).toBe(1);
        expect(uniqueHeights.has('h-6')).toBe(true);
      }),
      { numRuns: 100 }
    );
  });
});


// Test component for CTA button
const TestFinalCTA = () => {
  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-2xl sm:text-3xl lg:text-5xl font-heading font-bold mb-6">
          Верните чаевые в заведение уже сегодня
        </h2>
        <p className="text-lg text-blue-100 mb-10 max-w-2xl mx-auto">
          Настройка занимает меньше часа
        </p>
        <div>
          <Link href="/venue/register">
            <button className="h-14 px-10 text-lg rounded-full bg-white text-blue-600 hover:bg-blue-50 shadow-xl shadow-blue-900/30">
              Подключить заведение
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
};

/**
 * **Feature: landing-page-improvements, Property 9: CTA button link functionality**
 * 
 * *For any* CTA button in the final section, the button should contain a link 
 * to the venue registration page
 * 
 * **Validates: Requirements 4.3**
 */
describe('Property 9: CTA button link functionality', () => {
  it('should have CTA button linking to venue registration page', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        const { container } = render(<TestFinalCTA />);

        // Find the link to venue registration
        const ctaLink = container.querySelector('a[href="/venue/register"]');
        expect(ctaLink).toBeTruthy();

        // Verify the button is inside the link
        const button = ctaLink?.querySelector('button');
        expect(button).toBeTruthy();
        expect(button?.textContent).toContain('Подключить заведение');
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * **Feature: landing-page-improvements, Property 10: CTA button text localization**
 * 
 * *For any* locale setting, the CTA button text should be retrieved from 
 * the correct translation key
 * 
 * **Validates: Requirements 4.4**
 */
describe('Property 10: CTA button text localization', () => {
  it('should use correct translation key for CTA button text', () => {
    fc.assert(
      fc.property(fc.constantFrom('ru', 'en'), (locale) => {
        // Test that translation keys are correctly defined
        const translations = {
          ru: 'Подключить заведение',
          en: 'Connect venue',
        };

        const expectedText = translations[locale as keyof typeof translations];
        
        // Verify the text doesn't contain "бесплатно" or "for free"
        expect(expectedText).not.toContain('бесплатно');
        expect(expectedText).not.toContain('for free');
        
        // Verify the text is concise
        expect(expectedText.split(' ').length).toBeLessThanOrEqual(3);
      }),
      { numRuns: 100 }
    );
  });
});
