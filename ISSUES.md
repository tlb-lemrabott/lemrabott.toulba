# 🚀 Pending Improvements

## Issue #1: Optimize Image Loading Performance
**Status**: 🔄 In Progress  
**Priority**: High  
**Labels**: enhancement, performance, frontend

### Problem
Images on the website are not optimized for performance, causing slow loading times and poor user experience.

### Requirements
- [ ] Implement lazy loading for images
- [ ] Add WebP format support with fallbacks
- [ ] Optimize image sizes and compression
- [ ] Add loading placeholders/skeletons
- [ ] Implement progressive image loading
- [ ] Add responsive images with srcset

### Technical Details
- Use `loading="lazy"` attribute for images
- Implement intersection observer for lazy loading
- Add WebP format with JPEG/PNG fallbacks
- Optimize Hugo image processing
- Add loading skeletons for better UX

### Acceptance Criteria
- [ ] All images load progressively
- [ ] Page load time improved by 30%
- [ ] Images are properly sized for different devices
- [ ] Loading states provide good user feedback

---

## Issue #2: Fix Submission Breakdown Chart View
**Status**: 🔄 In Progress  
**Priority**: Medium  
**Labels**: bug, frontend, chart

### Problem
The Submission Breakdown chart is currently disabled to prevent browser crashes, but users need this visualization.

### Requirements
- [ ] Re-enable Chart.js with proper error handling
- [ ] Implement chart fallback for unsupported browsers
- [ ] Add chart loading states
- [ ] Optimize chart performance
- [ ] Add chart accessibility features

### Technical Details
- Re-enable chart rendering with try-catch blocks
- Add chart loading skeleton
- Implement chart destroy/cleanup properly
- Add responsive chart sizing
- Add ARIA labels for accessibility

### Acceptance Criteria
- [ ] Chart displays without browser crashes
- [ ] Chart is responsive on all devices
- [ ] Chart has proper loading states
- [ ] Chart is accessible to screen readers

---

## Issue #3: Add Cookie Consent Toast/Popup
**Status**: 🔄 In Progress  
**Priority**: Medium  
**Labels**: enhancement, legal, frontend

### Problem
The website uses cookies (localStorage) but doesn't inform users or get their consent.

### Requirements
- [ ] Create cookie consent popup/toast
- [ ] Allow users to accept or deny cookies
- [ ] Store user preference
- [ ] Respect user choice
- [ ] Add privacy policy link
- [ ] Make it GDPR compliant

### Technical Details
- Create cookie consent component
- Store consent in localStorage
- Check consent before using cookies
- Add privacy policy page
- Implement consent management

### Acceptance Criteria
- [ ] Users are informed about cookie usage
- [ ] Users can accept or deny cookies
- [ ] Website respects user choice
- [ ] Consent is stored properly
- [ ] Privacy policy is accessible

---

## Implementation Order
1. **Cookie Consent** (Legal requirement)
2. **Image Optimization** (Performance improvement)
3. **Chart Fix** (Feature restoration) 