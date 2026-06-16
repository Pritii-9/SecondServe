# secondServe - Implementation TODO

## Step 1 (Backend core)
- [ ] Extend `Listing` model with receiver ownership + rescue status fields
- [ ] Add auth middleware to verify JWT and enforce roles
- [ ] Add receiver endpoints:
  - [ ] `POST /api/listings/:id/claim`
  - [ ] `POST /api/listings/:id/rescue` (status transitions)
- [ ] Emit socket event `listing_updated` on claim/rescue changes

## Step 2 (Frontend claim/rescue UI)
- [ ] Update `ListingCard` with Claim button + rescue status UI
- [ ] Update `ReceiverMap` to refresh/merge updates on claim/rescue
- [ ] Update `SocketContext` to listen for `listing_updated`

## Step 3 (Auth UI + role-based navigation)
- [ ] Build `SignupPage` and `LoginPage`
- [ ] Add protected routing / role gating in `App.tsx`
- [ ] Create receiver view that uses `ReceiverMap`
- [ ] Create donor view that uses `DonorDashboard`

## Step 4 (Profiles, filters, notifications)
- [ ] Add profile pages
- [ ] Add listing/claims views per role
- [ ] Add filters for map/listing list
- [ ] Add basic notifications panel

## Step 5 (QA + polish)
- [ ] Validate edge cases (double-claim, expiry, permission checks)
- [ ] Improve UX for errors and loading states
- [ ] Ensure AI display is consistent

## Step 6 (Deployment)
- [ ] Add/verify `.env` requirements
- [ ] Build frontend for production
- [ ] Ensure backend CORS + socket origin config
- [ ] Provide run instructions for both services

