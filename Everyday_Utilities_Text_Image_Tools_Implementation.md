# Everyday Utilities, Text & Image Tools — Implementation Specification

**Version:** 1.0  
**Date:** 2026-09-16  
**Status:** Implementation-ready specification

## 1. Scope

Add these daily-use tools to the existing PDF/document platform:

### Utilities
- Percentage Calculator
- GST Calculator
- EMI Calculator
- Discount Calculator
- Age Calculator
- Date Difference
- Unit Converter
- Currency Converter

### Text & Developer
- JSON Formatter
- JSON Validator
- Word Counter
- Character Counter

### Images
- Resize Image
- Compress Image
- Convert JPG / PNG / WebP

These should reuse the existing authentication, workspace, entitlements, analytics, API gateway, storage, jobs, audit and observability infrastructure.

---

## 2. Product Navigation

Recommended top-level categories:

```text
PDF
IMAGE
TEXT & DATA
QR & BARCODE
LABELS
CAREER
CALCULATORS
DEVELOPER TOOLS
```

Add an **Everyday Tools / Quick Tools** area to the homepage:

```text
[ Percentage ] [ GST ] [ EMI ] [ Discount ]
[ Age ] [ Date Difference ] [ Unit Converter ]
[ Currency ] [ JSON Formatter ] [ JSON Validator ]
[ Word Counter ] [ Character Counter ]
[ Resize Image ] [ Compress Image ] [ Image Converter ]
```

Logged-in users should also see **Recently Used** and **Favorites**.

---

## 3. Common Tool Architecture

Create a centralized tool registry instead of hard-coding metadata in each page.

```typescript
interface ToolDefinition {
  id: string;
  category: string;
  name: string;
  slug: string;
  description: string;
  route: string;
  processingMode: "CLIENT" | "SERVER" | "HYBRID";
  requiresAuth: boolean;
  searchable: boolean;
  enabled: boolean;
}
```

Example:

```json
{
  "id": "percentage-calculator",
  "category": "UTILITIES",
  "name": "Percentage Calculator",
  "slug": "percentage-calculator",
  "route": "/tools/percentage-calculator",
  "processingMode": "CLIENT",
  "requiresAuth": false,
  "searchable": true,
  "enabled": true
}
```

The registry should power:

- Homepage cards
- All Tools page
- Search
- Categories
- Related tools
- Recently used
- Favorites
- SEO metadata
- Analytics
- Feature flags

---

## 4. Processing Strategy

### Client-side by default

Use browser computation for:

- Percentage
- GST
- EMI
- Discount
- Age
- Date Difference
- Unit conversion
- JSON formatting
- JSON validation
- Word count
- Character count

Benefits:

- Instant results
- Better privacy
- Lower server cost
- Offline capability
- No upload latency

### Server / hybrid

Use backend processing when required for:

- Large images
- Advanced image compression
- Large image conversion
- Unsupported browser codecs
- HEIC or other specialized formats
- Currency rate retrieval
- API usage
- Batch processing

---

# 5. Percentage Calculator

## 5.1 Modes

### X percent of Y

```text
15% of 500 = 75
```

Formula:

```text
result = percentage / 100 × value
```

### What percentage is X of Y?

```text
75 of 500 = 15%
```

Formula:

```text
percentage = X / Y × 100
```

### Percentage increase

```text
Original = 500
New = 575
Increase = 15%
```

Formula:

```text
((new - original) / original) × 100
```

### Percentage decrease

```text
Original = 500
New = 425
Decrease = 15%
```

Formula:

```text
((original - new) / original) × 100
```

## 5.2 UI

```text
Percentage Calculator

[ X ] % of [ Y ]

[Calculate]

Result: 75

Other modes:
[Percentage of Value]
[What Percentage?]
[Increase]
[Decrease]
```

Validate numbers, empty fields and division by zero. Support decimal and large values.

---

# 6. GST Calculator

## 6.1 India-focused design

GST rates and tax policy must be configurable and versioned. Do not hard-code tax policy into the UI or calculation code.

Use a registry such as:

```json
{
  "country": "IN",
  "taxType": "GST",
  "rates": [],
  "version": 1,
  "effectiveFrom": "YYYY-MM-DD"
}
```

Production rates should be maintained from authoritative tax-policy data.

## 6.2 Modes

### Add GST

```text
Base Amount
GST Rate

GST Amount
Total Amount
```

Formula:

```text
GST = base × rate / 100
Total = base + GST
```

### Remove GST

For an inclusive amount:

```text
Base = inclusive × 100 / (100 + rate)
GST = inclusive - base
```

### CGST + SGST

For applicable intra-state calculations, allow the configured rate to be split between CGST and SGST.

### IGST

For applicable inter-state calculations, calculate IGST using the configured GST rate.

Do not infer the user's tax treatment from location alone.

## 6.3 UI

```text
GST Calculator

Amount: [ ₹ __________ ]

Mode:
(o) Add GST
( ) Remove GST

GST Rate: [ Select / Custom ]

Base       ₹10,000
CGST       ₹900
SGST       ₹900
GST        ₹1,800
Total      ₹11,800
```

Use locale-aware INR formatting and configurable rounding rules.

---

# 7. EMI Calculator

## 7.1 Inputs

- Loan amount
- Interest rate
- Tenure
- Monthly/yearly tenure

For monthly EMI:

```text
P = principal
r = monthly interest rate
n = number of monthly payments

EMI = P × r × (1+r)^n / ((1+r)^n - 1)
```

For annual percentage input:

```text
r = annualRate / 12 / 100
```

Zero-interest case:

```text
EMI = principal / number_of_payments
```

## 7.2 Output

- Monthly EMI
- Principal
- Total interest
- Total payment
- Amortization schedule

```text
Month | EMI | Principal | Interest | Balance
```

Optional principal-vs-interest visualization.

Validate positive principal/tenure and non-negative rate.

---

# 8. Discount Calculator

## 8.1 Basic calculation

```text
Original Price
Discount %

Discount Amount
Final Price
```

Formula:

```text
discount = price × rate / 100
final = price - discount
```

## 8.2 Multiple discounts

Sequential discounts must be calculated sequentially.

Example:

```text
₹10,000
20% off → ₹8,000
10% off → ₹7,200
```

Do not represent sequential discounts as a simple 30% discount.

Optional reverse calculations:

- Final price → original price
- Discount amount → discount percentage

---

# 9. Age Calculator

Inputs:

```text
Date of Birth
Calculate As Of
```

Default `Calculate As Of` to the current local date.

Output:

```text
32 years
4 months
17 days
```

Optional:

- Total months
- Total weeks
- Total days
- Next birthday
- Days until birthday

Use a timezone-aware date library and calendar-aware calculation. Do not simply subtract birth year from current year.

Document the product rule used for leap-day birthdays.

---

# 10. Date Difference

Inputs:

```text
Start Date
End Date
```

Output:

```text
2 years 3 months 12 days

Total days
Total weeks
```

Modes:

### Calendar difference

Years/months/days.

### Absolute duration

Total days between dates.

Advanced mode may include:

- Start time
- End time
- Timezone
- Hours/minutes/seconds

Test month boundaries, leap years and reversed dates.

---

# 11. Unit Converter

Build a reusable unit registry rather than independent conversion functions.

```typescript
interface UnitDefinition {
  id: string;
  category: string;
  symbol: string;
  toBase(value: number): number;
  fromBase(value: number): number;
}
```

Categories:

```text
Length
Area
Volume
Weight / Mass
Temperature
Time
Speed
Data
Pressure
Energy
Power
Frequency
Angle
Fuel Economy
```

Examples:

```text
Length: mm, cm, m, km, inch, ft, yard, mile
Mass: mg, g, kg, oz, lb, ton
Data: bit, byte, KB, MB, GB, TB
```

Temperature requires non-linear offset conversion:

```text
F = C × 9/5 + 32
C = (F - 32) × 5/9
```

UI:

```text
[ 10 ] [ Kilometers ▼ ]
          ⇅
[ 6.21371 ] [ Miles ▼ ]
[Swap]
```

Use an explicit base unit internally and avoid accumulating conversion errors.

---

# 12. Currency Converter

Currency is dynamic data and must not be implemented like a static unit conversion.

## 12.1 Provider abstraction

```typescript
interface ExchangeRateProvider {
  getRates(baseCurrency: string): Promise<ExchangeRates>;
}
```

Architecture:

```text
Currency UI
   ↓
Currency Service
   ↓
Cache
   ↓
Rate Provider
```

Example rate object:

```json
{
  "base": "USD",
  "timestamp": "2026-09-16T00:00:00Z",
  "rates": {
    "INR": 0,
    "EUR": 0,
    "GBP": 0
  },
  "provider": "configured-provider"
}
```

Values shown above are placeholders only.

## 12.2 Caching

Cache rates using Redis or equivalent.

Store:

- Base currency
- Rate set
- Provider
- Retrieved timestamp
- Expiration

Always show the rate timestamp to the user.

Handle:

- Provider failure
- Stale rates
- Unsupported currency
- Rate unavailable
- Fallback provider

Display a note that actual bank/card/payment-provider conversion can differ because of spreads and fees.

---

# 13. JSON Formatter

Features:

- Format
- Minify
- Validate
- Tree view
- Expand all
- Collapse all
- Search
- Copy
- Download
- Paste
- Upload `.json`
- Drag/drop

Use a standards-compliant JSON parser. Do not parse JSON with regular expressions.

Formatting options:

```text
Indent: 2 / 4 / Tabs
Sort keys: Off / On
```

Key sorting should be opt-in because it changes presentation/order.

For large JSON, run parsing/formatting in a Web Worker to avoid freezing the browser.

---

# 14. JSON Validator

Share the parser with the formatter.

Example response:

```json
{
  "valid": false,
  "error": {
    "message": "Unexpected token",
    "line": 4,
    "column": 12
  }
}
```

Features:

- Syntax validation
- Line/column error
- Tree preview
- Copy error
- Format valid JSON
- JSON size information

Future extension: JSON Schema validation. Do not call syntax validation JSON Schema validation unless a schema is actually supplied and evaluated.

---

# 15. Word Counter

Input methods:

- Paste
- Type
- Upload text file

Output:

```text
Words
Characters
Characters excluding spaces
Sentences
Paragraphs
Lines
Reading time
```

Use Unicode-aware word segmentation. Do not rely solely on `text.split(" ")`.

Document counting behavior for:

- Hyphenated words
- Numbers
- URLs
- Punctuation
- Multiple spaces
- CJK languages

Optional settings can control how hyphenated terms and numbers are counted.

---

# 16. Character Counter

Display:

- Characters
- Characters excluding spaces
- Characters excluding whitespace
- Unicode code points
- Lines

Use grapheme-aware counting where practical so visible user-perceived characters such as emoji sequences are handled correctly.

---

# 17. Image Resize

Workflow:

```text
Upload
 ↓
Read Dimensions
 ↓
Target Width / Height
 ↓
Preview
 ↓
Resize
 ↓
Export
```

Features:

- Width
- Height
- Lock aspect ratio
- Percentage resize
- Presets
- Custom dimensions
- DPI metadata where supported
- Quality
- Output format

Possible presets:

```text
Social
Profile
Email
Web
Print
A4
Passport / ID
Custom
```

Preset definitions should be configuration-driven and reviewed periodically.

Use suitable resampling algorithms such as:

```text
Nearest Neighbor
Bilinear
Bicubic
Lanczos
```

Use Web Workers/OffscreenCanvas where supported for large client-side operations.

---

# 18. Image Compressor

Supported initial formats:

```text
JPG
PNG
WebP
```

Features:

- Quality control
- Target file size
- Resize while compressing
- Metadata removal
- Before/after preview
- Original size
- Output size
- Percentage reduction

Formula:

```text
reduction = (original - compressed) / original × 100
```

For target-size compression, iteratively adjust quality and/or dimensions until the target is approached without producing unacceptable output.

---

# 19. JPG / PNG / WebP Converter

Workflow:

```text
Upload Images
 ↓
Choose JPG / PNG / WebP
 ↓
Quality / Options
 ↓
Convert
 ↓
Download
```

Support batch conversion.

Important behavior:

### JPG
Best suited to photographic content; does not preserve transparency.

### PNG
Supports transparency and is useful for screenshots/graphics.

### WebP
Useful for web delivery and modern image workflows.

If converting a transparent image to JPG, explicitly warn that transparency will be replaced by a background.

---

# 20. Image Processing Pipeline

Simple browser-capable operation:

```text
Browser
 ↓
Decode
 ↓
Transform
 ↓
Encode
 ↓
Download
```

Large or unsupported operation:

```text
Browser
 ↓
Upload
 ↓
Validate MIME / Magic Bytes
 ↓
Image Worker
 ↓
Decode
 ↓
Resize / Compress / Convert
 ↓
Encode
 ↓
Output Validation
 ↓
Object Storage
 ↓
Signed Download
```

---

# 21. Image Security

Protect against:

- Decompression bombs
- Malformed files
- Huge dimensions
- Excessive memory consumption
- CPU exhaustion
- Malicious SVG
- External SVG references
- Metadata leakage

Configurable limits:

```text
MAX_FILE_SIZE
MAX_PIXEL_COUNT
MAX_WIDTH
MAX_HEIGHT
MAX_PROCESSING_TIME
```

Use MIME detection and magic-byte validation instead of trusting extensions.

Sanitize or rasterize untrusted SVG when appropriate.

---

# 22. Shared File Upload

Reuse the platform uploader:

- Drag/drop
- File picker
- Paste
- Multiple files
- Upload progress
- Cancel
- Retry
- Validation
- Preview

Standard errors:

```text
UNSUPPORTED_FORMAT
FILE_TOO_LARGE
IMAGE_TOO_LARGE
CORRUPT_IMAGE
PROCESSING_FAILED
QUOTA_EXCEEDED
```

---

# 23. Common API

Base path:

```text
/api/v1
```

Calculator APIs:

```http
POST /api/v1/calculators/percentage
POST /api/v1/calculators/gst
POST /api/v1/calculators/emi
POST /api/v1/calculators/discount
POST /api/v1/calculators/age
POST /api/v1/calculators/date-difference
POST /api/v1/calculators/unit
POST /api/v1/calculators/currency
```

Text:

```http
POST /api/v1/text/json/format
POST /api/v1/text/json/validate
POST /api/v1/text/count
```

Images:

```http
POST /api/v1/images/resize
POST /api/v1/images/compress
POST /api/v1/images/convert
```

Client-only pages may initially use these functions locally and expose APIs later for paid/API customers.

---

# 24. API Response Model

Synchronous calculation:

```json
{
  "success": true,
  "result": {}
}
```

Asynchronous image processing:

```json
{
  "jobId": "job_123",
  "status": "QUEUED"
}
```

Then:

```http
GET /api/v1/jobs/{jobId}
```

---

# 25. Error Model

Use the platform-wide schema:

```json
{
  "code": "INVALID_INPUT",
  "message": "Please enter a valid number.",
  "details": {},
  "requestId": "req_123",
  "retryable": false
}
```

Common codes:

```text
INVALID_INPUT
DIVISION_BY_ZERO
INVALID_DATE
INVALID_UNIT
UNSUPPORTED_CURRENCY
RATE_UNAVAILABLE
RATE_STALE
INVALID_JSON
IMAGE_TOO_LARGE
UNSUPPORTED_IMAGE_FORMAT
CORRUPT_IMAGE
QUOTA_EXCEEDED
PROCESSING_FAILED
```

---

# 26. Entitlements

Basic calculator/text tools can be public and free.

Image/API limits should be configuration-driven:

```text
MAX_IMAGE_SIZE
MAX_IMAGE_COUNT
MAX_IMAGE_PIXELS
MAX_DAILY_CONVERSIONS
MAX_DAILY_COMPRESSIONS
MAX_DAILY_RESIZES
```

Backend enforcement is authoritative.

---

# 27. Usage Analytics

Track:

```text
tool.viewed
tool.started
tool.completed
tool.failed
tool.downloaded
tool.copied
tool.favorited
```

Properties:

```text
toolId
category
processingMode
duration
success
inputType
outputType
anonymous/user
organizationId where applicable
```

Do not send raw JSON, personal text, images, or sensitive calculation inputs to analytics.

---

# 28. SEO

Create indexable pages:

```text
/tools/percentage-calculator
/tools/gst-calculator
/tools/emi-calculator
/tools/discount-calculator
/tools/age-calculator
/tools/date-difference
/tools/unit-converter
/tools/currency-converter
/tools/json-formatter
/tools/json-validator
/tools/word-counter
/tools/character-counter
/tools/image-resizer
/tools/image-compressor
/tools/image-converter
```

Each page should contain:

- Title
- Meta description
- H1
- Tool UI
- How it works
- Examples
- FAQ
- Related tools

Avoid automatically creating large numbers of near-duplicate SEO pages.

---

# 29. Internal Linking

Configure related tools.

Examples:

```text
GST Calculator
 → Percentage Calculator
 → Discount Calculator
 → EMI Calculator

Image Compressor
 → Image Resizer
 → Image Converter
 → Image Editor

JSON Formatter
 → JSON Validator
 → Base64 Encoder
 → URL Encoder

Currency Converter
 → Unit Converter
 → Percentage Calculator
```

---

# 30. Recent Tools & Favorites

For logged-in users:

```text
recent_tool_usage
-----------------
user_id
tool_id
last_used_at
```

Favorites:

```text
user_tool_favorites
-------------------
user_id
tool_id
created_at
```

For anonymous users, local storage may be used. Do not store sensitive tool inputs.

---

# 31. Keyboard Shortcuts

Generic:

```text
Enter → Calculate / Execute
Esc → Close dialog
```

JSON:

```text
Ctrl/Cmd + Enter → Format
Ctrl/Cmd + Shift + C → Copy
Ctrl/Cmd + K → Clear
```

Image editor compatibility:

```text
Ctrl/Cmd + Z → Undo
Ctrl/Cmd + Shift + Z → Redo
Delete → Delete selection
```

Avoid conflicting with browser/system shortcuts.

---

# 32. Mobile Requirements

All pages must be mobile-first.

Calculators:

- Large inputs
- Numeric keyboard hints
- Large result cards
- Sticky calculate action where useful

JSON:

- Input and output stacked
- Horizontal scroll only inside code area
- Large-input handling

Images:

- Camera/file picker
- Touch controls
- Pinch zoom where applicable
- Preview before export

---

# 33. Accessibility

Required:

- Keyboard navigation
- Native form labels
- Visible focus
- Screen-reader support
- Accessible validation
- Proper heading hierarchy
- High contrast
- Non-color-only status indicators

Dynamic results should use appropriate live regions without excessive announcements.

---

# 34. Internationalization

Design for:

```text
English
Indian English
Hindi
Telugu
Other supported locales
```

Separate:

```text
i18n
 ├── labels
 ├── descriptions
 ├── validation
 ├── number formats
 ├── date formats
 └── currency formats
```

Use locale-aware formatting instead of string concatenation.

---

# 35. Number & Money Formatting

Calculations should operate on numeric/decimal values, not formatted strings.

Architecture:

```text
Calculation
 ↓
Numeric / Decimal Result
 ↓
Locale Formatter
 ↓
UI
```

For financial calculations:

- Prefer decimal arithmetic.
- Define rounding policy.
- Keep calculation precision separate from display precision.
- Apply currency-specific final rounding rules.

---

# 36. Shared Calculation Engine

Create a reusable package:

```text
packages/calculation-engine
├── percentage
├── gst
├── emi
├── discount
├── age
├── dateDifference
├── units
└── currency
```

Functions should be pure and deterministic except currency retrieval:

```typescript
calculatePercentageOf(value, percentage)
calculatePercentage(value, total)
calculatePercentageIncrease(original, current)
calculatePercentageDecrease(original, current)
calculateGst(amount, rate)
calculateEmi(principal, annualRate, months)
calculateDiscount(price, rate)
calculateAge(dateOfBirth, asOf)
calculateDateDifference(start, end)
convertUnit(value, from, to)
```

Currency calculation consumes a supplied rate rather than making the calculation function itself perform network access.

---

# 37. Testing — Calculators

## Percentage

Test:

- Zero
- 100
- Negative values
- Decimal values
- Large values
- Division by zero

## GST

Test:

- Zero rate
- Configured rates
- Decimal amounts
- Add GST
- Remove GST
- CGST/SGST
- IGST
- Rounding

## EMI

Test:

- Zero interest
- Normal interest
- High interest
- Short tenure
- Long tenure
- Decimal principal

## Discount

Test:

- 0%
- 100%
- Decimal discount
- Multiple sequential discounts
- Reverse calculations

## Age

Test:

- Birthday today
- Birthday tomorrow
- Birthday yesterday
- Leap-day birthday
- Timezone boundary

## Date Difference

Test:

- Same date
- Reversed dates
- Month boundary
- Year boundary
- Leap year

---

# 38. Testing — JSON

Test:

- Empty input
- Object
- Array
- Nested data
- Unicode
- Escaped characters
- Numbers
- Boolean
- Null
- Missing comma
- Missing quote
- Trailing comma
- Deep nesting
- Very large JSON
- Malformed input

Set a maximum input size to protect browser memory.

---

# 39. Testing — Text

Test:

- Empty text
- Multiple spaces
- Newlines
- Tabs
- Emoji
- CJK
- Devanagari
- Arabic
- RTL
- Hyphenated terms
- URLs
- Numbers
- Punctuation

---

# 40. Testing — Images

Test:

- JPG
- PNG
- WebP
- Transparency
- EXIF
- Large dimensions
- Small dimensions
- Corrupt image
- Large file
- High compression
- Batch conversion
- Aspect-ratio lock
- Transparent-to-JPG behavior
- Metadata removal

---

# 41. Performance Targets

Calculators:

```text
Calculation <10 ms target
UI response <100 ms target
```

JSON:

```text
Normal input → near-instant
Large input → Web Worker
```

Images:

```text
Small → browser
Large → worker/server
```

Do not freeze the main browser thread during large image or JSON processing.

---

# 42. Privacy

Client-side tools should clearly indicate when no upload is required.

For server-side image operations:

```text
Upload
 ↓
Process
 ↓
Temporary Result
 ↓
Download
 ↓
Retention Expiry
```

Do not retain images indefinitely unless the user explicitly saves them.

---

# 43. PWA / Offline Support

Strong offline candidates:

```text
Percentage
GST
EMI
Discount
Age
Date Difference
Unit Converter
JSON Formatter
JSON Validator
Word Counter
Character Counter
```

Cache:

- Tool shell
- Calculation engine
- Unit registry
- Localization
- Static assets

Currency should clearly identify stale/offline rates.

---

# 44. Shareable Results

Allow:

```text
[Copy]
[Share]
[Download PDF]
```

Do not create public result URLs by default.

If implemented:

- Explicit user action
- Random identifiers
- Expiration
- Revocation
- Access controls

---

# 45. Common UI Components

Create reusable components:

```text
ToolShell
ToolHeader
CalculatorInput
NumericInput
CurrencyInput
DateInput
SelectInput
ResultCard
CalculationBreakdown
CopyButton
ResetButton
DownloadButton
ShareButton
FileDropzone
ImagePreview
ProgressBar
ErrorBanner
RelatedTools
RecentTools
FavoriteButton
```

---

# 46. Frontend Structure

Example:

```text
src/
├── app/
├── components/
│   ├── tools/
│   ├── calculator/
│   ├── text/
│   ├── image/
│   └── shared/
├── features/
│   ├── percentage/
│   ├── gst/
│   ├── emi/
│   ├── discount/
│   ├── age/
│   ├── date-difference/
│   ├── unit-converter/
│   ├── currency/
│   ├── json/
│   ├── word-counter/
│   ├── character-counter/
│   ├── image-resize/
│   ├── image-compress/
│   └── image-convert/
├── services/
│   ├── currency/
│   ├── files/
│   └── jobs/
└── core/
    ├── calculation/
    ├── formatting/
    ├── i18n/
    └── analytics/
```

---

# 47. Backend Structure

Do not create one microservice per calculator.

```text
API
 |
 +-- Tool Service
 |    +-- Calculator Engine
 |    +-- Text Engine
 |    +-- Image Service
 |    +-- Currency Service
 |
 +-- Existing File Service
 +-- Existing Job Service
 +-- Existing Usage Service
```

Stateless calculators can initially run inside the API process. Image processing should use workers. Currency should use a dedicated provider/cache abstraction.

---

# 48. Database

Most tools do not require persistent input/result records.

Persist only when useful:

```text
Favorites
Recent tools
Saved calculations (optional)
Usage records
API usage
```

Optional:

```text
saved_calculations
------------------
id
user_id
tool_id
title
input_json
result_json
created_at
updated_at
```

Do not automatically save anonymous inputs.

Currency tables:

```text
currencies
----------
code
name
symbol
decimal_digits
enabled

exchange_rates
--------------
base_currency
rate_currency
rate
provider
retrieved_at
expires_at
```

---

# 49. Tool Search

Global search:

```text
Search tools...
```

Examples:

```text
"gst" → GST Calculator
"emi" → EMI Calculator
"json" → JSON Formatter, JSON Validator
"image" → Image Editor, Resize, Compress, Convert
"percentage" → Percentage Calculator
```

Search metadata:

```text
name
description
aliases
category
keywords
```

---

# 50. SEO-friendly Aliases

GST:

```text
GST calculator
tax calculator
GST amount
GST inclusive
GST exclusive
```

EMI:

```text
loan calculator
home loan EMI
monthly EMI
loan payment
```

Image:

```text
resize photo
resize picture
compress photo
convert image
JPG to PNG
PNG to WebP
```

Aliases should improve discovery without creating duplicate pages.

---

# 51. Analytics Dashboard

Add an Everyday Tools dashboard:

```text
Everyday Tools
├── Daily Active Tools
├── Most Used
├── Completion Rate
├── Error Rate
├── Average Duration
├── Repeat Users
├── Anonymous vs Logged-in
└── Signup Conversion
```

Funnel:

```text
Tool View
 ↓
Input Started
 ↓
Calculate / Process
 ↓
Result
 ↓
Copy / Download
 ↓
Signup
```

---

# 52. Monetization

Keep basic calculators and text tools free to maximize repeat use and organic discovery.

Potential premium capabilities:

- Saved calculation history
- PDF calculation reports
- Batch image processing
- Larger image limits
- Advanced compression
- API access
- Team workspaces
- Branded exports
- Higher currency/API quotas

Avoid restricting basic calculator functionality merely to force upgrades.

---

# 53. Recommended JIRA Structure

## EPIC — Everyday Calculator Platform

Stories:

- Tool registry
- Calculator engine
- Percentage
- GST
- EMI
- Discount
- Age
- Date Difference
- Unit Converter
- Currency Service
- Rate Provider
- Rate Cache
- Calculation tests
- Analytics

## EPIC — Text Tools

Stories:

- JSON parser
- JSON Formatter
- JSON Validator
- Word Counter
- Character Counter
- Unicode handling
- Large-input handling
- Tests

## EPIC — Image Utility Tools

Stories:

- Shared image uploader
- Image decoder
- Resize
- Compress
- JPG/PNG/WebP conversion
- Preview
- Client-side processing
- Server worker
- Batch support
- Metadata handling
- Security
- Image tests

## EPIC — Tool Discovery

Stories:

- All Tools
- Search
- Categories
- Related tools
- Recent tools
- Favorites
- Homepage quick tools
- SEO
- Analytics

---

# 54. Development Order

## Phase 1 — Shared Foundation

1. Tool registry
2. Tool shell
3. Shared form components
4. Result cards
5. Calculation engine
6. Number/date formatting
7. Analytics

## Phase 2 — Calculators

1. Percentage
2. GST
3. Discount
4. EMI
5. Age
6. Date Difference
7. Unit Converter

## Phase 3 — Text

1. JSON Formatter
2. JSON Validator
3. Word Counter
4. Character Counter

## Phase 4 — Images

1. Image uploader
2. Image preview
3. Resize
4. Compress
5. JPG/PNG/WebP conversion
6. Batch processing
7. Server fallback

## Phase 5 — Currency

1. Currency registry
2. Provider abstraction
3. Rate retrieval
4. Cache
5. Converter UI
6. Timestamp
7. Fallback/error handling

## Phase 6 — Discovery

1. All Tools
2. Search
3. Related tools
4. Favorites
5. Recent tools
6. Homepage quick tools
7. SEO
8. Analytics dashboard

---

# 55. Definition of Done

Every tool must have, where applicable:

- Responsive UI
- Desktop/mobile support
- Input validation
- Deterministic calculations
- Error handling
- Reset
- Copy
- Download
- Accessibility
- Localization
- Analytics
- SEO metadata
- Related tools
- Unit tests
- Integration tests
- Security tests for file processing
- Performance tests
- Entitlement enforcement where applicable
- API documentation where an API exists
- User documentation

---

# 56. Final Catalog

```text
CALCULATORS
├── Percentage Calculator
├── GST Calculator
├── EMI Calculator
├── Discount Calculator
├── Age Calculator
├── Date Difference
├── Unit Converter
└── Currency Converter

TEXT & DEVELOPER
├── JSON Formatter
├── JSON Validator
├── Word Counter
└── Character Counter

IMAGE
├── Image Resize
├── Image Compress
├── JPG / PNG / WebP Converter
├── Image Editor
├── Remove Background
├── Image Crop
├── Image Rotate
└── Image → PDF
```

---

# 57. Strategic Architecture Outcome

The additions should become the high-frequency acquisition and retention layer of the document platform.

```text
                 DOCUMENT PLATFORM
                        |
       +----------------+----------------+
       |                |                |
      PDF              IMAGE          EVERYDAY
       |                |              TOOLS
       |                |                |
 Edit / Convert    Edit / Resize     Calculators
 OCR / Sign        Compress          Text
 Forms             Convert           Developer
 Security          Background        Utilities
       |                |                |
       +----------------+----------------+
                        |
                 Shared Platform
                        |
       Auth / Files / Jobs / Billing / Usage
       Search / Analytics / Templates / API
```

The central design goal is **reusable engines + centralized tool metadata**, so the next set of daily utilities can be added without creating a new architecture for every tool.
