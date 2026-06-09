# Bookshop Accounts — Design Document

> **Status:** Draft  
> **Last updated:** 2026-06-09

---

## Table of Contents

1. [Overview](#1-overview)
2. [Data Models](#2-data-models)
3. [Registration & Onboarding](#3-registration--onboarding)
4. [Inventory Management](#4-inventory-management)
5. [Non-Intrusive Ad System](#5-non-intrusive-ad-system)
6. [Shop Profiles & Discovery](#6-shop-profiles--discovery)
7. [Admin Panel Integration](#7-admin-panel-integration)
8. [API & Server Actions](#8-api--server-actions)
9. [UI/UX Guidelines](#9-uiux-guidelines)
10. [Future Considerations](#10-future-considerations)

---

## 1. Overview

Bookshelf is currently a social book cataloging platform (similar to Goodreads) where individuals track their personal libraries, rate books, and discover other readers. This document proposes a **Bookshop Account** feature that extends the platform to include local, independent bookshops.

### 1.1 Goals

- Allow local bookshops to create a verified presence on the platform
- Let shops list their inventory with pricing and discounts
- Surface shop inventory to users **non-intrusively** when they view books they own or want
- Drive foot traffic and sales to local bookshops
- Keep the experience user-first — ads are contextual, subtle, and opt-in

### 1.2 Non-Goals (v1)

- Payment processing or on-platform checkout (lead gen only)
- Time-limited flash sales or coupon codes
- Affiliate tracking or commission models
- Programmatic/third-party advertising
- Shop reviews or ratings

### 1.3 Terminology

| Term | Definition |
|---|---|
| **Shop** | A bookshop account (business entity) |
| **ShopBook** | A book listing in a shop's inventory, with price and condition |
| **Ad impression** | A contextual hint shown to a user that a shop carries a book they're viewing |
| **Lead gen** | Displaying shop info + price, linking to the shop's own website or contact |
| **Verification** | Admin approval that a shop is a legitimate business |

---

## 2. Data Models

### 2.1 User Model — `accountType` Discriminator

**File:** `models/User.ts`

Add a single field to the existing `User` schema:

| Field | Type | Default | Notes |
|---|---|---|---|
| `accountType` | `"individual" \| "bookshop"` | `"individual"` | Discriminates user type at the account level |

**Rationale:** A single `accountType` field keeps the User model simple and avoids separate auth flows. Bookshop accounts still have a password, login, and session like any other user. The type is set at registration and cannot change (a separate shop profile is created alongside).

The existing `isAdmin` and `adminPermissions` fields are orthogonal — a bookshop account can also be an admin.

### 2.2 BookshopProfile Model

**File:** `models/BookshopProfile.ts`

New model — one per bookshop account (1:1 with User).

```typescript
interface IBookshopProfile {
  userId:            Types.ObjectId;   // ref -> User, unique, required
  shopName:          string;           // required, trimmed
  slug:              string;           // unique, lowercase, URL-safe, 3-50 chars
  description:       string;           // max 2000 chars, markdown?
  logo:              string;           // base64 data URL or URL, max 500KB
  coverImage:        string;           // optional banner image
  address: {
    street:          string;           // optional
    city:            string;
    state:           string;
    zip:             string;
    country:         string;
  };
  coordinates: {
    lat:             number;           // optional, for proximity queries
    lng:             number;
  };
  website:           string;           // optional, validated URL
  phone:             string;           // optional
  contactEmail:      string;           // optional, public contact
  deliveryRadius:    number;           // km, 0 = local pickup only, null = shipping
  isVerified:        boolean;          // default false, admin sets to true
  isActive:          boolean;          // default true, admin can soft-disable
  createdAt:         Date;             // auto
  updatedAt:         Date;             // auto
}
```

**Indexes:**
- `{ userId }` — unique (1:1 with User)
- `{ slug }` — unique (URL-friendly identifier)
- `{ "coordinates.lat": 1, "coordinates.lng": 1 }` — 2dsphere for geo queries
- `{ isVerified: 1, isActive: 1 }` — filter active verified shops

**Validation:**
- `slug` must match `^[a-z0-9]+(?:-[a-z0-9]+)*$` (lowercase, hyphens allowed)
- `slug` must be 3–50 characters
- `shopName` must be 2–100 characters

### 2.3 ShopBook Model

**File:** `models/ShopBook.ts`

Represents a single book listing in a shop's inventory. Denormalizes some book metadata for performance and to preserve the listing if the original book metadata changes.

```typescript
interface IShopBook {
  shopId:            Types.ObjectId;   // ref -> BookshopProfile, required, indexed
  isbn13:            string;           // normalized 13-digit ISBN, required
  title:             string;           // denormalized from metadata
  authors:           string[];         // denormalized from metadata
  coverUrl:          string;           // denormalized from metadata
  price:             number;           // in cents (e.g. 1999 = €19.99), required, min 0
  originalPrice:     number;           // in cents, nullable — if set, shows discount badge
  currency:          string;           // ISO 4217, default "EUR"
  condition:         "new" | "used" | "like-new" | "acceptable"; // default "new"
  stock:             number;           // 0 = out of stock, default 1
  description:       string;           // shop's own note about this copy (max 500 chars)
  isActive:          boolean;          // default true, hide individual listings
  createdAt:         Date;             // auto
  updatedAt:         Date;             // auto
}
```

**Indexes:**
- `{ shopId: 1, isbn13: 1 }` — unique (a shop can list a given ISBN once)
- `{ shopId: 1, isActive: 1 }` — filter active listings for a shop
- `{ isbn13: 1, isActive: 1 }` — find all active listings for a book
- `{ isbn13: 1, "coordinates": "2dsphere" }` — find nearby shops with a book (requires joining/aggregation with BookshopProfile)

**Discount logic:**
- If `originalPrice` is set AND `originalPrice > price`, a discount badge is shown:  
  `20% off — was €24.99, now €19.99`
- Discount percentage: `Math.round((1 - price / originalPrice) * 100)`
- If `originalPrice` is null or equal to `price`, no discount is displayed.

### 2.4 ShopFollow Model (Optional v1, Recommended v1)

**File:** `models/ShopFollow.ts`

Allows users to follow/bookmark shops (used in the ad system to prioritize followed shops).

```typescript
interface IShopFollow {
  userId:            Types.ObjectId;   // ref -> User, required
  shopId:            Types.ObjectId;   // ref -> BookshopProfile, required
  createdAt:         Date;             // auto
}
```

**Indexes:**
- `{ userId: 1, shopId: 1 }` — unique (prevent duplicate follows)
- `{ shopId: 1 }` — count followers for a shop
- `{ userId: 1 }` — get all shops a user follows

### 2.5 Entity Relationship Diagram

```
User (1) ─────────── (1) BookshopProfile
  |                       |
  |                       | (1)
  |                       v
  |                   ShopBook (N) — ISBN lookup
  |
  | (N)
  +────────────────── ShopFollow
  | (1)              (N) |
  +──────────────────────+
```

---

## 3. Registration & Onboarding

### 3.1 Flow

```
/register/shop  ──>  Fill out form  ──>  Create User + BookshopProfile  ──>  Redirect to /shop/pending
                      (pending approval)
                            │
                            v
                Admin approves via admin panel
                            │
                            v
                Shop receives email notification
                            │
                            v
                Shop owner logs in, sees dashboard
                            │
                            v
                Shop can now add inventory
```

### 3.2 Registration Form (`/register/shop`)

Form fields (split into steps):

**Step 1 — Account credentials:**
- Email (used for login)
- Password + confirm password
- Owner name (the person registering)

**Step 2 — Shop details:**
- Shop name → auto-generates slug (editable)
- Description (optional)
- Logo upload (optional)

**Step 3 — Location & contact:**
- Address (street, city, state, zip, country)
- Website (optional)
- Phone (optional)
- Public contact email (optional)

**Step 4 — Review & submit:**
- Summary of all info
- Checkbox: "I confirm this is a real bookshop"
- Submit button → creates account (status: pending)

### 3.3 Server Action: `registerShopAction`

**File:** `actions/bookshop.ts`

```
registerShopAction(formData: FormData) -> { success, errors?, shopId? }
```

1. Validate all fields (server-side)
2. Check email uniqueness
3. Check slug uniqueness
4. Hash password (bcrypt, 12 rounds)
5. Create `User` document with `accountType: "bookshop"`
6. Create `BookshopProfile` document with `isVerified: false`
7. Send confirmation email to shop owner
8. Send notification to admins (pending approval)
9. Return success with redirect to `/shop/pending`

### 3.4 Pending Page (`/shop/pending`)

A simple page informing the shop that their account is under review. Polls or checks status on load — once `isVerified` becomes true, redirects to the shop dashboard.

### 3.5 Approval Email Notification

Uses the existing Resend integration. Template: "Your bookshop account has been approved! Start adding your inventory."

---

## 4. Inventory Management

### 4.1 Shop Dashboard

**Route:** `/shop/dashboard` (or `/shop/manage`)

Only accessible to users with `accountType: "bookshop"` and `isVerified: true`.

**Sections:**
- **Overview** — total listings, active listings, out-of-stock count
- **Add Book** — search by ISBN, auto-fill metadata, set price/condition/stock
- **My Inventory** — searchable/sortable table of all ShopBooks
  - Columns: Cover, Title, Authors, Price, Discount, Condition, Stock, Status, Actions
  - Actions: Edit, Toggle active, Delete
- **Bulk Import** — CSV upload with columns: isbn13, price, originalPrice, condition, stock, currency
- **Bulk Export** — download current inventory as CSV

### 4.2 Adding a Book

Two methods:

**Method A — ISBN search (primary):**
1. Shop enters or scans an ISBN
2. Server looks up metadata via OpenLibrary / Google Books (same enrichment pipeline as `actions/books.ts`)
3. Returns title, authors, cover, publisher, etc.
4. Shop sets price, condition, stock, optional note
5. Submits → creates `ShopBook`

**Method B — Manual entry (fallback):**
1. Shop fills in ISBN manually
2. Server validates ISBN checksum
3. Same metadata lookup; if no results, shop can type title/authors manually
4. Same price/condition/stock step

### 4.3 Editing & Deleting

- Edit: Change price, condition, stock, active status, description
- Delete: Hard delete from database (or soft-delete via `isActive: false`)
- Shops cannot edit metadata (title, authors, cover) — these come from the enrichment pipeline. If metadata is wrong, it should be fixed globally (this is an existing admin concern).

### 4.4 Bulk CSV Import

**Format:**

```csv
isbn13,price,originalPrice,condition,stock,currency
9780143127741,1499,1999,new,5,EUR
9780061120084,999,,used,1,EUR
```

Rows with invalid ISBNs or missing required fields are skipped and reported in an error summary.

### 4.5 Price & Discount Rules

- `price` is required, must be ≥ 0 (in cents)
- `originalPrice` is optional; if set, must be ≥ `price`
- If `originalPrice > price`, a discount percentage is calculated and displayed
- Prices are stored in cents to avoid floating-point issues
- Currency defaults to EUR (configurable per env? — future consideration)

---

## 5. Non-Intrusive Ad System

### 5.1 Philosophy

The ad system is **contextual, opt-in, and subtle**. It exists only to connect users with local bookshops that carry books they are already looking at. It is not:
- A banner or popup
- Targeted based on browsing history
- Paid placement or auction-based
- Distracting or interruptive

### 5.2 Where Ads Appear

#### 5.2.1 Book Detail Page (`/books/[id]`)

Below the user's own copy info (status, rating, notes), a small section:

```
────────────────────────────────────
📚 Also available at nearby shops

The Book Nook      €18.99  New   → Shop
Page & Palette     €22.00  Used  → Shop
Stories Bookshop   €15.50  New   → Shop
────────────────────────────────────
```

**Rules:**
- Only shown if the viewer is logged in and has this book in their library (or wishlist)
- Max 3 shops shown, sorted: followed shops first, then nearest, then cheapest
- Each line: shop logo (24px) + name, price, condition badge, link
- If a discount exists: `€18.99 ~~€24.99~~ -20%`
- If no shops carry the book, nothing is shown (no empty state)

#### 5.2.2 Scan Results

When a user scans an ISBN and the result modal appears, a single line:

```
This book is available at 3 local shops — starting at €12.50
```

Clicking expands to show the same shop list as the detail page.

#### 5.2.3 Wishlist

On the wishlist page, books that are available at nearby/followed shops get a small badge:

```
[Book cover]  [Book title]
              by Author Name
              ♥ Available at The Book Nook — €18.99
```

### 5.3 Matching Logic

When rendering a book view, the server fetches ad candidates:

```
1. Get the book's isbn13
2. Find all ShopBook where:
   - isbn13 matches
   - isActive = true
   - stock > 0
   - shop.isVerified = true
   - shop.isActive = true
3. If viewer's location is known (IP geolocation or profile):
   - Filter to shops within deliveryRadius (or a default 100km)
   - Sort by distance (ascending)
4. If viewer follows any shops:
   - Promote followed shops to top (regardless of distance)
5. Limit to 3 results
```

### 5.4 Privacy

- No impression tracking or click logging in v1
- No personal data is sent to shops
- Shop inventory is public (visible to any logged-in user viewing a book)
- Location is derived from IP geolocation (imprecise, not stored) or not used if unavailable
- Users can opt out of location-based matching (profile setting)
- Followed-shop matching does not require location

### 5.5 Opt-Out

Users can disable ad suggestions entirely in settings:

```
Settings → Privacy
  [ ] Show nearby bookshop suggestions when viewing books
```

When disabled, none of the ad slots render.

---

## 6. Shop Profiles & Discovery

### 6.1 Public Shop Page (`/shop/[slug]`)

A public, shareable page for each verified shop.

**Content:**
- Shop logo + name + verification badge
- Description
- Location (with optional embedded map — static image or Leaflet)
- Contact info: website, phone, email (as shown)
- Follower count
- "Follow" button (for logged-in users)

**Inventory section:**
- Search/filter: by title, author, genre, price range, condition
- Sort: by title, price (asc/desc), date added
- Paginated grid of books (similar to user library grid)
- Each book card: cover, title, price, condition badge, discount badge

### 6.2 Shop Discovery (`/discover/shops` or `/shops`)

A page listing verified shops.

**Features:**
- Map view (if coordinates available)
- List view with search
- Filter by city/country
- Sort by newest, most followers, alphabetical
- "Near me" button (uses geolocation)

### 6.3 Following Shops

Logged-in users can follow/unfollow shops.

- Follow button on shop profile page
- Followed shops appear in a "My Shops" section on the user's profile (optional, configurable)
- Followed shops are prioritized in the ad system
- No notifications for shop updates in v1

### 6.4 SEO

Shop pages should be indexable:
- Meta title: `{shopName} — Bookshelf`
- Meta description: truncated description
- Open Graph image: shop logo or cover
- Structured data: `LocalBusiness` schema.org markup

---

## 7. Admin Panel Integration

### 7.1 New Permission: `manage_shops`

Add to `ALL_ADMIN_PERMISSIONS` in `lib/constants.ts`:

```typescript
"manage_shops"  // Approve, suspend, delete shop accounts
```

### 7.2 Shop Approval Queue (`/admin/shops`)

**Table columns:**
- Shop name, slug, owner email, location, submitted date
- Status: Pending | Verified | Suspended
- Actions: Approve | Suspend | View | Delete

**Approval flow:**
1. Admin clicks "Approve" on a pending shop
2. `isVerified` set to `true` on `BookshopProfile`
3. Email sent to shop owner (existing Resend integration)
4. Shop appears in public discovery and ad system

**Suspension:**
1. Admin clicks "Suspend"
2. `isActive` set to `false` on `BookshopProfile`
3. All `ShopBook` listings for this shop are excluded from queries
4. Shop profile page shows "This shop is currently unavailable"
5. Shop owner is notified via email

### 7.3 Shop Detail View

Admin can view all details of a shop account:
- Full `BookshopProfile` fields (read-only)
- Linked `User` info (email, owner name, join date)
- Listing count, active listing count
- Follower count

### 7.4 Listing Moderation

Admins can:
- View any shop's inventory
- Delete individual `ShopBook` listings (spam, incorrect pricing, etc.)
- Flag: if a shop has multiple deleted listings, admin is notified

### 7.5 Admin Notifications

When a new shop registers, admins with `manage_shops` permission receive a notification:
- Dashboard badge: "X shop(s) pending approval"
- Email notification (optional, configurable per admin)

---

## 8. API & Server Actions

### 8.1 New Server Actions

**File:** `actions/bookshop.ts`

| Action | Description |
|---|---|
| `registerShopAction(data)` | Register a new bookshop account |
| `addShopBook(isbn13, price, ...)` | Add a book to inventory |
| `updateShopBook(shopBookId, fields)` | Update price/stock/status |
| `deleteShopBook(shopBookId)` | Remove a listing |
| `bulkImportShopBooks(csv)` | Import CSV bulk inventory |
| `bulkExportShopBooks()` | Export inventory as CSV |
| `getShopDashboard()` | Fetch dashboard stats |
| `followShop(shopId)` | Follow a shop |
| `unfollowShop(shopId)` | Unfollow a shop |
| `isFollowingShop(shopId)` | Check follow status |
| `getShopBooks(shopId, filters)` | Paginated inventory query |
| `getNearbyShopsForBook(isbn13, ...)` | Ad query — get matching shops |

### 8.2 API Routes

| Route | Method | Auth | Purpose |
|---|---|---|---|
| `/api/shops` | GET | — | List verified shops |
| `/api/shops/[slug]` | GET | — | Public shop profile |
| `/api/shops/[slug]/books` | GET | — | Paginated inventory |
| `/api/books/[isbn13]/shops` | GET | Optional | Ad candidates for a book |

### 8.3 Admin Actions

**File:** `actions/admin.ts` (extend existing)

| Action | Description |
|---|---|
| `approveShop(shopId)` | Set `isVerified = true` |
| `suspendShop(shopId)` | Set `isActive = false` |
| `reactivateShop(shopId)` | Set `isActive = true` |
| `deleteShop(shopId)` | Delete shop + user + listings |
| `getPendingShops()` | List unverified shops |
| `getAllShops(filters)` | Full shop list for admin |

---

## 9. UI/UX Guidelines

### 9.1 General Principles

- All shop-related UI must be **subtle and non-distracting**
- Use existing design system (Tailwind CSS, Radix primitives, shadcn-style components)
- Follow existing layout patterns (grids, tables, dialogs)
- Shop features should feel like a natural extension, not a separate product

### 9.2 Design Tokens

Use existing theme tokens. No new color variables specific to shops — leverage the existing accent/primary/brand tokens.

### 9.3 Ad Placement Visual Spec

```
┌─────────────────────────────────────────────┐
│  📚 Also available at nearby shops          │
│                                             │
│  [logo] The Book Nook    €18.99  New   →    │
│  [logo] Page & Palette   €22.00  Used  →    │
│                                             │
│  ── 3 more shops have this book ──          │
└─────────────────────────────────────────────┘
```

- Section is separated from user's book info by a subtle divider (border-t)
- Shop logo: 24×24px, rounded, fallback is shop name initial
- Price: monospace font, bold
- Condition: small badge (same style as existing book status badges)
- Link: arrow icon, opens shop page in same tab (or external website if set)

### 9.4 Interactive States

| Element | Default | Hover | Focus |
|---|---|---|---|
| Shop row | bg-transparent | bg-muted/30 | ring-2 ring-primary |
| Follow button (shop page) | outline button | filled variant | — |
| Ad section "more" link | text-muted-foreground | text-foreground | — |

### 9.5 Mobile Adaptations

- Ad section collapses below user's book info, same as desktop (stacked layout)
- Shop list on mobile: swipeable or stacked rows
- Shop inventory on mobile: 2-column grid (same as user library on mobile)

### 9.6 Accessibility

- All shop-related UI must meet WCAG 2.1 AA
- Ad section uses `<aside>` with `aria-label="Nearby bookshops"`
- Shop links use descriptive text: `"View The Book Nook's page"`
- Color-only indicators (like discount badges) include text labels
- Keyboard navigation: all shop rows and buttons are keyboard-accessible

### 9.7 Loading States

- Shop profile page: skeleton matching existing profile skeleton (logo + text blocks)
- Inventory: existing `BookGridSkeleton` component
- Ad section: subtle shimmer placeholder, max 30px height (avoids layout shift)
- Follow button shows spinner during request

### 9.8 Empty & Error States

| Scenario | UI |
|---|---|
| Shop has no listings | Empty state: "No books listed yet. Check back soon!" |
| No shops found for a book | Nothing shown (ad section is absent) |
| Ad query fails | Silently hidden (graceful degradation, no error toast) |
| Shop suspended | Profile page shows "This shop is currently unavailable" |
| User opts out of ads | Ad section never renders |
| Coordinates missing for shop | Shop excluded from proximity queries (still shows for followed users) |

---

## 10. Future Considerations

These are explicitly **not part of v1** but are noted for architectural awareness.

### 10.1 On-Platform Checkout

- Stripe Connect integration for payments
- Cart system
- Platform commission (% per sale)
- Order management dashboard for shops
- Shipping address handling

### 10.2 Advanced Ad System

- Impression tracking (view count, click-through rate)
- Shop analytics (how many users saw their listings)
- A/B testing placement variants
- Paid featured listings (shop pays for priority placement)

### 10.3 Time-Limited Sales

- Sale start/end dates
- Automatic price restoration
- Sale banners on shop profile
- Countdown timers in listings

### 10.4 Shop Reviews & Ratings

- User reviews of shops (not books)
- Star ratings
- Photo uploads with reviews
- Shop response to reviews

### 10.5 Events & Community

- Shop-hosted events (book signings, readings)
- Event calendar on shop profile
- RSVP via platform

### 10.6 Multi-User Shop Management

- Multiple employees can manage a shop account
- Role-based access within a shop (owner, manager, staff)
- Activity logging per user

### 10.7 Internationalization

- Multi-currency support (price per currency)
- Address format localization
- Language support for shop descriptions

---

## Appendix A: File Manifest

| File | Action |
|---|---|
| `models/User.ts` | Add `accountType` field |
| `models/BookshopProfile.ts` | Create new model |
| `models/ShopBook.ts` | Create new model |
| `models/ShopFollow.ts` | Create new model |
| `actions/bookshop.ts` | Create new server actions |
| `actions/admin.ts` | Extend with shop management actions |
| `lib/constants.ts` | Add `manage_shops` permission |
| `lib/email/templates/shop-approved.tsx` | New email template |
| `lib/email/templates/shop-pending.tsx` | New email template |
| `lib/email/templates/shop-suspended.tsx` | New email template |
| `lib/admin/shops.ts` | Admin shop queries |
| `lib/books/bookshop-ads.ts` | Ad matching logic |
| `types/bookshop.ts` | New type definitions |
| `types/next-auth.d.ts` | Add shop fields to session |
| `auth.ts` | Attach `accountType` to JWT |
| `middleware.ts` | Add shop routes to protected patterns |
| `app/register/shop/page.tsx` | New registration page |
| `app/shop/pending/page.tsx` | Pending approval page |
| `app/shop/dashboard/page.tsx` | Shop dashboard |
| `app/shop/[slug]/page.tsx` | Public shop profile |
| `app/shops/page.tsx` | Shop discovery page |
| `app/admin/shops/page.tsx` | Admin shop management |
| `app/admin/shops/[id]/page.tsx` | Admin shop detail |
| `components/bookshop/` | New component directory |
| `components/books/book-detail-ads.tsx` | Ad section on book detail |

## Appendix B: Migration Plan

### Phase 1 — Foundation
1. Create Mongoose models (`BookshopProfile`, `ShopBook`, `ShopFollow`)
2. Add `accountType` to User model
3. Add `manage_shops` permission
4. Create types and update auth session
5. Create admin shop actions

### Phase 2 — Registration & Admin
1. Build `/register/shop` form
2. Build `/shop/pending` page
3. Build admin approval queue (`/admin/shops`)
4. Implement approval/suspension email notifications

### Phase 3 — Inventory
1. Build shop dashboard with overview
2. Build "Add Book" flow (ISBN search + price form)
3. Build inventory table with edit/delete
4. Implement bulk CSV import/export

### Phase 4 — Public Presence
1. Build `/shop/[slug]` public profile page
2. Build shop discovery page (`/shops`)
3. Implement follow/unfollow
4. SEO metadata for shop pages

### Phase 5 — Ad System
1. Implement ad matching logic (`lib/books/bookshop-ads.ts`)
2. Build ad section component for book detail page
3. Integrate with scan results
4. Integrate with wishlist
5. Add user opt-out in settings

## Appendix C: Open Questions

- Should shops be able to choose their own slug, or should it be auto-generated from shop name?
- Should the default currency be configurable per deployment (`.env`)?
- Should shop inventory be publicly visible to non-logged-in users, or only to logged-in users?
- Should followed-shop notifications be added in v1 (e.g., "The Book Nook added 5 new books")?
- Should there be a limit on how many `ShopBook` listings a shop can have (free tier vs. paid tier)?
