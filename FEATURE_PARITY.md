# TailTracker Feature Parity Tracker

> **Development Strategy**: Web-First Development
>
> The web application is the source of truth. All features must be implemented and tested on web first, then ported to mobile.

## Status Legend
- ✅ Complete
- 🚧 In Progress
- ❌ Not Started
- ⏸️ Blocked
- 🔄 Needs Sync (mobile has it, web doesn't)

---

## Phase 1: Core Pet Management (Priority: Critical)

These features form the foundation of the app and must be completed first.

| Feature | Web | Mobile | Notes |
|---------|-----|--------|-------|
| **Pet Onboarding Wizard** | | | |
| Step 1: Basic Info (name, species) | ✅ | ✅ | In sync |
| Step 2: Physical Details (size, breed, appearance) | ✅ | ✅ | In sync |
| Step 3: Health Information | ✅ | ✅ | In sync |
| Step 4: Personality Traits | ✅ | ✅ | In sync |
| Step 5: Care Preferences | ✅ | ✅ | In sync |
| Step 6: Favorite Activities (species-specific) | ✅ | ✅ | In sync |
| Step 7: Review & Save | ✅ | ✅ | In sync |
| **Pet Profile** | | | |
| View pet details | ✅ | ✅ | In sync |
| Edit pet profile | ✅ | ✅ | In sync |
| Delete pet | ✅ | ✅ | In sync |
| Pet photo upload | ✅ | ✅ | In sync |
| Photo gallery | ✅ | ✅ | In sync |
| Digital passport view | ✅ | ✅ | In sync |

---

## Phase 2: Health Tracking (Priority: High)

Essential for the core value proposition of the app.

| Feature | Web | Mobile | Notes |
|---------|-----|--------|-------|
| **Vaccinations** | | | |
| Vaccination list view | ❌ | ✅ | |
| Add vaccination record | ❌ | ✅ | |
| Edit vaccination | ❌ | ✅ | |
| Delete vaccination | ❌ | ✅ | |
| Vaccination reminders | ❌ | ✅ | |
| Vaccination card component | ❌ | ✅ | |
| **Medical Records** | | | |
| Medical records list | ❌ | ✅ | |
| Add medical record | ❌ | ✅ | |
| Edit medical record | ❌ | ✅ | |
| Delete medical record | ❌ | ✅ | |
| Health record card component | ❌ | ✅ | |
| Add health record modal | ❌ | ✅ | |

---

## Phase 3: Family & Sharing (Priority: Medium)

Important for collaboration features.

| Feature | Web | Mobile | Notes |
|---------|-----|--------|-------|
| Family member list | ❌ | ✅ | |
| Invite family member | ❌ | ✅ | |
| Remove family member | ❌ | ✅ | |
| Access level management | ❌ | ✅ | |
| QR code sharing (Premium+) | ❌ | ✅ | |

---

## Phase 4: Subscriptions & Payments (Priority: Medium)

Required for monetization.

| Feature | Web | Mobile | Notes |
|---------|-----|--------|-------|
| Subscription tiers display | ❌ | ✅ | |
| Current plan view | ❌ | ✅ | |
| Upgrade/downgrade flow | ❌ | ✅ | |
| Payment method management | ❌ | ✅ | |
| Subscription upgrade modal | ❌ | ✅ | |
| Stripe integration | ❌ | ✅ | Web uses Stripe directly |

---

## Phase 5: Lost Pet System (Priority: Medium - Pro Only)

Pro tier feature set.

| Feature | Web | Mobile | Notes |
|---------|-----|--------|-------|
| Report lost pet | ❌ | ✅ | |
| Lost pet alert screen | ❌ | ✅ | |
| View nearby lost pets | ❌ | ✅ | |
| Mark pet as found | ❌ | ✅ | |
| Location history | ❌ | ✅ | |
| Map view | ❌ | ✅ | |

---

## Phase 6: Settings & Preferences (Priority: Medium)

User account management.

| Feature | Web | Mobile | Notes |
|---------|-----|--------|-------|
| **Profile** | | | |
| Profile settings | ✅ (basic) | ✅ | Web needs enhancement |
| Avatar upload | ❌ | ✅ | |
| **Security** | | | |
| Change password | ❌ | ✅ | |
| Two-factor auth | ❌ | ✅ | |
| Session management | ❌ | ✅ | |
| **Privacy** | | | |
| Privacy settings | ❌ | ✅ | |
| Data export | ❌ | ✅ | |
| Account deletion | ❌ | ✅ | |
| **App Preferences** | | | |
| Theme (dark/light) | ❌ | ✅ | |
| Notification preferences | ❌ | ✅ | |
| Language selection | ❌ | ✅ | |

---

## Phase 7: Notifications & Communication (Priority: Low)

Enhanced user engagement.

| Feature | Web | Mobile | Notes |
|---------|-----|--------|-------|
| Notification center | ❌ | ✅ | |
| Push notification settings | ❌ | ✅ | Web uses browser notifications |
| Email notification preferences | ❌ | ✅ | |
| In-app notifications | ❌ | ✅ | |

---

## Shared Packages Status

Track what's being shared between web and mobile.

| Package | Used by Web | Used by Mobile | Notes |
|---------|-------------|----------------|-------|
| `@tailtracker/shared-types` | 🚧 | ✅ | Need to verify web usage |
| `@tailtracker/shared-utils` | 🚧 | ✅ | Need to verify web usage |
| `@tailtracker/shared-services` | 🚧 | ✅ | Need to verify web usage |
| `@tailtracker/shared-hooks` | 🚧 | ✅ | Need to verify web usage |

---

## Implementation Guidelines

### Web-First Development Process

1. **Design** - Create/update design for web version
2. **Implement on Web** - Build feature on web platform
3. **Test on Web** - Thorough testing including:
   - Unit tests
   - Integration tests
   - Manual QA
4. **Document** - Update this tracker and any API changes
5. **Port to Mobile** - Adapt implementation for React Native
6. **Test on Mobile** - Platform-specific testing
7. **Mark Complete** - Update status in this document

### Code Sharing Strategy

When implementing features:

1. **Types** - Define in `packages/shared-types`
2. **Business Logic** - Implement in `packages/shared-services`
3. **Utilities** - Add to `packages/shared-utils`
4. **Hooks** - Platform-agnostic hooks in `packages/shared-hooks`
5. **UI Components** - Platform-specific in respective apps

### Component Naming Convention

To maintain parity, use consistent naming:

| Web (React) | Mobile (React Native) |
|-------------|----------------------|
| `PetCard.tsx` | `PetCard.tsx` |
| `VaccinationList.tsx` | `VaccinationList.tsx` |
| `useVaccinations.ts` | `useVaccinations.ts` |

---

## Progress Tracking

### Overall Progress

| Phase | Features | Complete | Progress |
|-------|----------|----------|----------|
| Phase 1: Core Pet | 13 | 13 | 100% |
| Phase 2: Health | 12 | 0 | 0% |
| Phase 3: Family | 5 | 0 | 0% |
| Phase 4: Payments | 6 | 0 | 0% |
| Phase 5: Lost Pet | 6 | 0 | 0% |
| Phase 6: Settings | 12 | 1 | 8% |
| Phase 7: Notifications | 4 | 0 | 0% |
| **Total** | **58** | **14** | **24%** |

### Current Sprint Focus

> Update this section with current development priorities

**Sprint Goal**: Phase 1 - Core Pet Management (COMPLETE!)

**Completed Tasks**:
- [x] Create wizard component structure
- [x] Implement Step 1: Basic Info
- [x] Implement Step 2: Physical Details
- [x] Implement Step 3: Health Information
- [x] Implement Step 4: Personality Traits
- [x] Implement Step 5: Care Preferences
- [x] Implement Step 6: Favorite Activities (species-specific)
- [x] Implement Step 7: Review & Save
- [x] Edit Pet Profile page
- [x] Delete pet functionality
- [x] Pet photo upload
- [x] Photo gallery
- [x] Digital passport view

**Next Phase**: Phase 2 - Health Tracking
- [ ] Vaccination list view
- [ ] Add vaccination record
- [ ] Medical records list
- [ ] Add medical record

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2024-12-23 | Initial document created | Claude |
| | Established web-first development strategy | |
| | Documented current feature parity status | |
| 2024-12-23 | Completed 7-step Pet Onboarding Wizard | Claude |
| | Added Edit Pet Profile page | |
| | Verified Delete pet functionality | |
| 2024-12-23 | Added Pet photo upload and gallery | Claude |
| | Integrated Supabase Storage for photos | |
| | Photo limits based on subscription tier | |
| 2024-12-23 | Added Digital Passport view | Claude |
| | **Phase 1: Core Pet Management COMPLETE** | |

---

## Notes

- Mobile app currently has more features than web
- Priority is to bring web up to parity
- After parity, all new features start on web
- Shared packages should be leveraged for maximum code reuse
