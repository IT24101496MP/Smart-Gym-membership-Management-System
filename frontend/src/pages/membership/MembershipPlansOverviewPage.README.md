# Membership Plans Overview Page (New Files Only)

This feature was added without modifying existing files.

## New files

- `src/pages/membership/MembershipPlansOverviewPage.jsx`
- `src/pages/membership/MembershipPlansOverviewPage.css`
- `src/pages/membership/membershipOverviewApi.js`
- `src/pages/membership/membershipOverviewFallbackData.js`

## What it supports

- Membership cards with type, duration, pricing, and highlighted benefits.
- Red call-to-action buttons (`Join Now` / `Select Plan`).
- Pricing fallback text: `Currently unavailable.`
- Admin plan creation form using `POST /api/membership-plans`.
- Member join flow:
  - `CLIENT` -> navigates to `/payment/:planId`
  - other authenticated roles -> uses `POST /api/membership-plans/renew`

## How to wire it (optional)

Because no existing file was changed, route integration is not automatic.
You can import the page and add a route in your router when you are ready.
