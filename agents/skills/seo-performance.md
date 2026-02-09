# SEO & Performance Monitoring Skill

## SKILL.md

**Name:** seo-performance
**Version:** 1.0.0
**Agent:** Frontend Architect (Primary), Product Manager (Secondary)
**Triggers:** SEO, performance, Core Web Vitals, Lighthouse, page speed, LCP, FID, CLS, meta tags, schema markup

---

## Description

Comprehensive SEO and performance optimization skill that ensures Financial GPS ranks well in search engines, loads quickly, and provides an excellent user experience. Critical for consumer-facing financial websites competing for organic traffic.

---

## System Prompt Addition

```xml
<seo_performance>
You are equipped with SEO and performance optimization capabilities for Financial GPS.
Your goal is to maximize search visibility and ensure fast, smooth user experiences.

PERFORMANCE TARGETS (Core Web Vitals):

| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| LCP (Largest Contentful Paint) | ≤2.5s | ≤4.0s | >4.0s |
| INP (Interaction to Next Paint) | ≤200ms | ≤500ms | >500ms |
| CLS (Cumulative Layout Shift) | ≤0.1 | ≤0.25 | >0.25 |

Additional targets:
- Time to First Byte (TTFB): <800ms
- First Contentful Paint (FCP): <1.8s
- Total Blocking Time (TBT): <200ms
- Speed Index: <3.4s

SEO REQUIREMENTS:

Technical SEO:
- Semantic HTML structure
- Proper heading hierarchy (single H1)
- Meta titles (50-60 chars)
- Meta descriptions (150-160 chars)
- Canonical URLs
- XML sitemap
- robots.txt configured
- Schema.org structured data

Content SEO:
- Unique, valuable content
- Keyword optimization (natural usage)
- Internal linking strategy
- Image optimization with alt text
- Mobile-first content

Financial SEO Specifics:
- E-E-A-T signals (Experience, Expertise, Authority, Trust)
- Author attribution for content
- Clear "About" and credentials pages
- Trust signals (security badges, testimonials)
- Local SEO if applicable

PERFORMANCE OPTIMIZATION:

Critical Rendering Path:
- Inline critical CSS
- Defer non-critical CSS
- Async/defer JavaScript
- Preload key resources
- Minimize render-blocking

Asset Optimization:
- Image compression and modern formats (WebP, AVIF)
- Lazy loading for below-fold content
- Code splitting and tree shaking
- Minification of CSS/JS
- Gzip/Brotli compression

Caching Strategy:
- Browser caching headers
- Service worker for offline
- CDN for static assets
- Cache busting for updates

OUTPUT FORMAT:

SEO/PERFORMANCE AUDIT: [Page Name]
Date: [Date]

CORE WEB VITALS:
| Metric | Score | Target | Status |
|--------|-------|--------|--------|

SEO CHECKLIST:
| Item | Status | Notes |
|------|--------|-------|

RECOMMENDATIONS:
1. [Priority] [Issue] → [Fix]

IMPLEMENTATION GUIDE:
[Code/configuration changes needed]
</seo_performance>
```

---

## SEO Workflows

### Workflow 1: Page SEO Audit

```
TRIGGER: New page created or SEO review requested

STEPS:

1. META TAG VERIFICATION
   ```html
   <!-- Required meta tags -->
   <head>
     <!-- Title: 50-60 characters, keyword near front -->
     <title>Retirement Calculator - Free FIRE Planning Tool | Financial GPS</title>

     <!-- Description: 150-160 characters, compelling CTA -->
     <meta name="description" content="Calculate your retirement savings needs with our free FIRE calculator. See how much you need to retire early based on your income, expenses, and goals.">

     <!-- Canonical URL -->
     <link rel="canonical" href="https://financialgps.com/calculators/retirement">

     <!-- Open Graph -->
     <meta property="og:title" content="Free Retirement Calculator">
     <meta property="og:description" content="Plan your path to financial independence">
     <meta property="og:image" content="https://financialgps.com/images/og-calculator.png">
     <meta property="og:url" content="https://financialgps.com/calculators/retirement">
     <meta property="og:type" content="website">

     <!-- Twitter Card -->
     <meta name="twitter:card" content="summary_large_image">
     <meta name="twitter:title" content="Free Retirement Calculator">
     <meta name="twitter:description" content="Plan your path to financial independence">
     <meta name="twitter:image" content="https://financialgps.com/images/twitter-calculator.png">

     <!-- Mobile -->
     <meta name="viewport" content="width=device-width, initial-scale=1">

     <!-- Favicon -->
     <link rel="icon" href="/favicon.ico">
     <link rel="apple-touch-icon" href="/apple-touch-icon.png">
   </head>
   ```

2. HEADING STRUCTURE
   ```
   Verify hierarchy:
   □ Single H1 per page (contains primary keyword)
   □ H2s for main sections
   □ H3s for subsections
   □ No skipped levels (H1 → H3)
   □ Headings are descriptive

   Example structure:
   H1: Retirement Calculator
     H2: Calculate Your FIRE Number
     H2: How It Works
       H3: Step 1: Enter Your Income
       H3: Step 2: Set Your Goals
     H2: Understanding Your Results
     H2: Frequently Asked Questions
   ```

3. CONTENT ANALYSIS
   ```
   Keyword optimization:
   □ Primary keyword in H1
   □ Primary keyword in first paragraph
   □ Secondary keywords in H2s
   □ Natural keyword density (1-2%)
   □ LSI keywords included

   For financial content:
   □ Expertise demonstrated
   □ Sources cited
   □ Last updated date shown
   □ Author credentials visible
   □ Disclaimer present
   ```

4. INTERNAL LINKING
   ```
   □ Links to related calculators
   □ Links to educational content
   □ Breadcrumb navigation
   □ Footer links to key pages
   □ Contextual links in content
   □ Anchor text is descriptive (not "click here")
   ```

5. SCHEMA MARKUP
   ```html
   <!-- Financial Calculator Schema -->
   <script type="application/ld+json">
   {
     "@context": "https://schema.org",
     "@type": "WebApplication",
     "name": "Retirement Calculator",
     "description": "Calculate how much you need to save for retirement",
     "applicationCategory": "FinanceApplication",
     "operatingSystem": "Any",
     "offers": {
       "@type": "Offer",
       "price": "0",
       "priceCurrency": "USD"
     },
     "author": {
       "@type": "Organization",
       "name": "Financial GPS",
       "url": "https://financialgps.com"
     }
   }
   </script>

   <!-- FAQ Schema (if FAQ section exists) -->
   <script type="application/ld+json">
   {
     "@context": "https://schema.org",
     "@type": "FAQPage",
     "mainEntity": [{
       "@type": "Question",
       "name": "How much do I need to retire?",
       "acceptedAnswer": {
         "@type": "Answer",
         "text": "A common rule is to save 25x your annual expenses..."
       }
     }]
   }
   </script>

   <!-- Organization Schema (site-wide) -->
   <script type="application/ld+json">
   {
     "@context": "https://schema.org",
     "@type": "Organization",
     "name": "Financial GPS",
     "url": "https://financialgps.com",
     "logo": "https://financialgps.com/logo.png",
     "sameAs": [
       "https://twitter.com/financialgps",
       "https://linkedin.com/company/financialgps"
     ]
   }
   </script>
   ```

OUTPUT: SEO audit report with specific recommendations
```

### Workflow 2: Performance Optimization

```
TRIGGER: Performance issues identified or pre-launch optimization

STEPS:

1. LIGHTHOUSE AUDIT
   Run Lighthouse and capture:
   - Performance score
   - Accessibility score
   - Best Practices score
   - SEO score
   - Core Web Vitals

2. CRITICAL RENDERING PATH
   ```html
   <!-- Optimize CSS loading -->
   <head>
     <!-- Critical CSS inline -->
     <style>
       /* Above-the-fold styles only */
       body { font-family: system-ui; margin: 0; }
       .header { /* ... */ }
       .hero { /* ... */ }
     </style>

     <!-- Non-critical CSS deferred -->
     <link rel="preload" href="/css/styles.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
     <noscript><link rel="stylesheet" href="/css/styles.css"></noscript>
   </head>
   ```

3. JAVASCRIPT OPTIMIZATION
   ```html
   <!-- Defer non-critical JS -->
   <script src="/js/app.js" defer></script>

   <!-- Async for independent scripts -->
   <script src="/js/analytics.js" async></script>

   <!-- Module scripts are deferred by default -->
   <script type="module" src="/js/components.js"></script>

   <!-- Preload critical scripts -->
   <link rel="preload" href="/js/app.js" as="script">
   ```

4. IMAGE OPTIMIZATION
   ```html
   <!-- Responsive images with modern formats -->
   <picture>
     <source
       type="image/avif"
       srcset="image-400.avif 400w, image-800.avif 800w, image-1200.avif 1200w"
       sizes="(max-width: 600px) 100vw, 50vw"
     >
     <source
       type="image/webp"
       srcset="image-400.webp 400w, image-800.webp 800w, image-1200.webp 1200w"
       sizes="(max-width: 600px) 100vw, 50vw"
     >
     <img
       src="image-800.jpg"
       srcset="image-400.jpg 400w, image-800.jpg 800w, image-1200.jpg 1200w"
       sizes="(max-width: 600px) 100vw, 50vw"
       alt="Description"
       loading="lazy"
       decoding="async"
       width="800"
       height="600"
     >
   </picture>
   ```

5. LAYOUT SHIFT PREVENTION
   ```css
   /* Reserve space for dynamic content */
   .image-container {
     aspect-ratio: 16 / 9;
     background-color: #f0f0f0;
   }

   /* Font loading optimization */
   @font-face {
     font-family: 'CustomFont';
     src: url('/fonts/custom.woff2') format('woff2');
     font-display: swap; /* or optional for non-critical */
   }

   /* Skeleton loading states */
   .skeleton {
     animation: pulse 1.5s infinite;
     background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
     background-size: 200% 100%;
   }
   ```

6. RESOURCE HINTS
   ```html
   <head>
     <!-- Preconnect to critical origins -->
     <link rel="preconnect" href="https://fonts.googleapis.com">
     <link rel="preconnect" href="https://api.financialgps.com">

     <!-- DNS prefetch for likely navigations -->
     <link rel="dns-prefetch" href="https://cdn.financialgps.com">

     <!-- Preload critical resources -->
     <link rel="preload" href="/fonts/main.woff2" as="font" type="font/woff2" crossorigin>
     <link rel="preload" href="/images/hero.webp" as="image">

     <!-- Prefetch likely next pages -->
     <link rel="prefetch" href="/calculators/retirement">
   </head>
   ```

7. CACHING CONFIGURATION
   ```
   # .htaccess or server config

   # Cache static assets for 1 year
   <FilesMatch "\.(css|js|jpg|jpeg|png|gif|webp|avif|woff2|ico)$">
     Header set Cache-Control "public, max-age=31536000, immutable"
   </FilesMatch>

   # Cache HTML for 1 hour
   <FilesMatch "\.(html)$">
     Header set Cache-Control "public, max-age=3600"
   </FilesMatch>
   ```

OUTPUT: Performance optimization implementation guide
```

### Workflow 3: Financial Website E-E-A-T Optimization

```
TRIGGER: Building trust signals for financial content

E-E-A-T CHECKLIST:

1. EXPERIENCE SIGNALS
   ```
   □ Author bios with relevant experience
   □ "Written by" attribution on articles
   □ Case studies or examples
   □ User testimonials (FTC compliant)
   □ Years of operation mentioned
   ```

2. EXPERTISE SIGNALS
   ```
   □ Credentials displayed (CFP, CFA, etc.)
   □ Educational content demonstrating knowledge
   □ Methodology explanations
   □ Sources and citations
   □ Technical accuracy (validated by Compliance)
   ```

3. AUTHORITATIVENESS SIGNALS
   ```
   □ Links from reputable financial sites
   □ Mentions in financial publications
   □ Professional affiliations
   □ Industry certifications displayed
   □ Awards or recognition
   ```

4. TRUSTWORTHINESS SIGNALS
   ```
   □ SSL certificate (HTTPS)
   □ Clear privacy policy
   □ Terms of service
   □ Contact information visible
   □ Physical address (if applicable)
   □ Security badges
   □ Transparent disclaimers
   □ No misleading claims
   □ Updated content dates
   ```

IMPLEMENTATION:

About Page Requirements:
```html
<article class="about-page">
  <h1>About Financial GPS</h1>

  <section class="mission">
    <h2>Our Mission</h2>
    <p>Founded in [year], Financial GPS helps...</p>
  </section>

  <section class="team">
    <h2>Our Team</h2>
    <div class="team-member" itemscope itemtype="https://schema.org/Person">
      <img src="..." alt="...">
      <h3 itemprop="name">John Smith, CFP®</h3>
      <p itemprop="jobTitle">Founder & Lead Financial Educator</p>
      <p itemprop="description">John has 15 years of experience in financial planning...</p>
      <ul>
        <li>Certified Financial Planner™</li>
        <li>Former advisor at [Firm]</li>
        <li>Published in [Publication]</li>
      </ul>
    </div>
  </section>

  <section class="credentials">
    <h2>Our Credentials</h2>
    <ul>
      <li>Member, Financial Planning Association</li>
      <li>Featured in: Forbes, NerdWallet, MarketWatch</li>
    </ul>
  </section>

  <section class="contact">
    <h2>Contact Us</h2>
    <address>
      Email: contact@financialgps.com<br>
      Phone: (555) 123-4567
    </address>
  </section>
</article>
```

OUTPUT: E-E-A-T implementation checklist and code
```

---

## Performance Checklist

```markdown
## Performance Optimization Checklist

### Core Web Vitals
- [ ] LCP under 2.5 seconds
- [ ] INP under 200ms
- [ ] CLS under 0.1

### Loading
- [ ] Critical CSS inlined
- [ ] Non-critical CSS deferred
- [ ] JavaScript deferred/async
- [ ] Resources preloaded
- [ ] Third-party scripts minimized

### Images
- [ ] WebP/AVIF formats used
- [ ] Responsive srcset implemented
- [ ] Lazy loading enabled
- [ ] Explicit dimensions set
- [ ] Compression optimized

### Fonts
- [ ] font-display: swap used
- [ ] Fonts preloaded
- [ ] Subset fonts (only needed characters)
- [ ] WOFF2 format used

### Caching
- [ ] Cache headers configured
- [ ] Service worker implemented
- [ ] CDN utilized
- [ ] Cache busting for updates

### Code
- [ ] CSS/JS minified
- [ ] Code split appropriately
- [ ] Tree shaking enabled
- [ ] Compression (gzip/brotli) enabled
```

---

## SEO Checklist

```markdown
## SEO Optimization Checklist

### Technical
- [ ] robots.txt configured
- [ ] XML sitemap created
- [ ] Canonical URLs set
- [ ] HTTPS enabled
- [ ] Mobile-friendly
- [ ] Fast loading (<3s)
- [ ] No broken links

### On-Page
- [ ] Unique title tags (50-60 chars)
- [ ] Meta descriptions (150-160 chars)
- [ ] Single H1 per page
- [ ] Proper heading hierarchy
- [ ] Keyword optimization
- [ ] Image alt text
- [ ] Internal linking

### Structured Data
- [ ] Organization schema
- [ ] WebApplication schema (for tools)
- [ ] FAQ schema (if applicable)
- [ ] Breadcrumb schema
- [ ] Schema validated (no errors)

### Content
- [ ] E-E-A-T signals present
- [ ] Author attribution
- [ ] Last updated dates
- [ ] Sources cited
- [ ] Unique, valuable content

### Financial Specific
- [ ] Disclaimers indexed
- [ ] Trust signals visible
- [ ] Credentials displayed
- [ ] Security indicators
```

---

## Monitoring Setup

```javascript
// Web Vitals monitoring
import { onCLS, onINP, onLCP } from 'web-vitals';

function sendToAnalytics(metric) {
  // Send to your analytics service
  console.log(metric.name, metric.value, metric.rating);

  // Example: Send to Google Analytics
  gtag('event', metric.name, {
    value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
    event_category: 'Web Vitals',
    event_label: metric.id,
    non_interaction: true,
  });
}

onCLS(sendToAnalytics);
onINP(sendToAnalytics);
onLCP(sendToAnalytics);
```
