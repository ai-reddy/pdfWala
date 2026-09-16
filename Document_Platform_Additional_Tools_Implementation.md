# Document & PDF Platform — Additional Tools Implementation Specification

**Version:** 1.0  
**Date:** 2026-09-16  
**Scope:** Implementation-ready specification for adding Resume/CV PDF Builder, Image Editor, Image Background Removal, Barcode/QR scanning and generation, PDF barcode/QR tools, and Product/Shipping Label generators.

---

## 1. Added Product Scope

Add these tools to the existing platform:

### Career
- Resume/CV PDF Builder

### Image Tools
- Image Editor
- Remove Image Background

### Barcode & QR
- Barcode Scanner
- QR Code Scanner
- Barcode → PDF
- QR → PDF
- Add Barcode to PDF
- Add QR Code to PDF
- Batch Barcode Generator
- Batch QR Generator

### Label Tools
- Product Label Generator
- Shipping Label Generator

The tools must reuse the existing authentication, organization/RBAC, file, storage, job/queue, entitlement, billing, usage, audit, API, and observability infrastructure.

---

# 2. Recommended Website Categories

## PDF Tools

Existing PDF tools plus:

- Add Barcode to PDF
- Add QR Code to PDF
- Barcode → PDF
- QR → PDF

## Image Tools

- Image Editor
- Image Compressor
- Image Resizer
- Image Cropper
- Image Converter
- Image Rotator
- Image Flipper
- Image Upscaler
- Remove Image Background
- Image → PDF
- Image → Text
- Screenshot → PDF
- Screenshot → Text

## Barcode & QR Tools

- Barcode Scanner
- QR Code Scanner
- Barcode Generator
- QR Code Generator
- Batch Barcode Generator
- Batch QR Generator
- Barcode → PDF
- QR → PDF
- Barcode → Text
- QR → Text

## Label Tools

- Product Label Generator
- Shipping Label Generator
- Barcode Label Generator
- QR Label Generator
- Custom Label Designer

## Career Tools

- Resume/CV PDF Builder
- Resume Templates
- ATS Check
- Cover Letter Builder

---

# 3. Shared Architecture

Do not create one backend service per button.

Use reusable bounded contexts:

```text
Web / Mobile / Desktop
        |
    API Gateway
        |
+-------+----------+-----------+------------+
|                  |           |            |
Document        Image       Code         Template
Services        Services    Services      Services
|                  |           |            |
+------------------+-----------+------------+
                   |
             Job Orchestrator
                   |
             Queue / Event Bus
                   |
       +-----------+------------+
       |           |            |
    PDF Worker  Image Worker  Code/Label Workers
                   |
             Object Storage
                   |
        Usage / Audit / Billing
```

---

# 4. Visual Editing Engine

Build one reusable canvas/editor engine for:

- PDF Editor
- Image Editor
- Product Label Designer
- Shipping Label Designer
- Resume Builder

Core capabilities:

```text
Canvas
Selection
Layers
Objects
Transform
Alignment
Snapping
Undo / Redo
Clipboard
Keyboard shortcuts
Serialization
Preview
Export
```

Supported object types:

```text
TEXT
IMAGE
SHAPE
LINE
ARROW
BARCODE
QR
LOGO
SIGNATURE
FORM_FIELD
```

Use a serializable command model.

Example:

```json
{
  "command": "ADD_QR",
  "objectId": "obj_123",
  "properties": {
    "payload": "https://example.com",
    "x": 100,
    "y": 200,
    "width": 120,
    "height": 120
  }
}
```

Common commands:

```text
ADD_TEXT
EDIT_TEXT
MOVE_OBJECT
RESIZE_OBJECT
ROTATE_OBJECT
DELETE_OBJECT
DUPLICATE_OBJECT
ADD_IMAGE
EDIT_IMAGE
ADD_SHAPE
EDIT_SHAPE
ADD_BARCODE
EDIT_BARCODE
ADD_QR
EDIT_QR
CHANGE_LAYER_ORDER
LOCK_OBJECT
HIDE_OBJECT
```

Use optimistic concurrency:

```http
POST /api/v1/visual-documents/{id}/versions
```

```json
{
  "baseVersion": 7,
  "commands": []
}
```

Return `409 DOCUMENT_VERSION_CONFLICT` if the base version is stale.

---

# 5. Resume/CV PDF Builder

## 5.1 User Flow

```text
Choose Template
      ↓
Personal Information
      ↓
Summary
      ↓
Experience
      ↓
Education
      ↓
Skills
      ↓
Projects
      ↓
Certifications
      ↓
Languages
      ↓
Custom Sections
      ↓
Preview
      ↓
ATS Check
      ↓
Export PDF
```

## 5.2 Resume Data Model

```json
{
  "personal": {
    "fullName": "",
    "headline": "",
    "email": "",
    "phone": "",
    "location": "",
    "website": "",
    "linkedin": ""
  },
  "summary": "",
  "experience": [],
  "education": [],
  "skills": [],
  "projects": [],
  "certifications": [],
  "languages": [],
  "customSections": []
}
```

Experience:

```json
{
  "company": "",
  "position": "",
  "location": "",
  "startDate": "",
  "endDate": "",
  "current": false,
  "description": "",
  "achievements": []
}
```

## 5.3 Features

- Template selection
- Drag/drop sections
- Add/remove/reorder sections
- Multiple jobs
- Multiple education entries
- Skills
- Skill proficiency
- Projects
- Certifications
- Languages
- Profile image
- Custom sections
- Typography controls
- Spacing
- Margins
- Page size
- One-page optimization
- Autosave
- Version history
- Duplicate resume
- PDF preview
- PDF export

## 5.4 Templates

Initial groups:

**ATS**
- Classic
- Modern
- Compact
- Executive

**Professional**
- Corporate
- Technical
- Consultant
- Executive

**Creative**
- Minimal
- Modern
- Designer
- Portfolio

Templates should be configuration-driven, not hard-coded into individual screens.

## 5.5 ATS Check

Implement deterministic checks:

- Extractable text
- Standard headings
- Excessive graphics
- Text embedded in images
- Unsupported fonts
- Tiny fonts
- Excessive tables
- Missing contact information
- Excessive columns
- Header/footer content
- Page count
- Unicode issues

Example:

```json
{
  "score": 86,
  "issues": [
    {
      "severity": "warning",
      "code": "TOO_MANY_COLUMNS",
      "message": "The selected template uses multiple columns."
    }
  ]
}
```

Do not represent the score as a guarantee of compatibility with a particular employer's ATS.

## 5.6 APIs

```http
POST   /api/v1/resumes
GET    /api/v1/resumes/{resumeId}
PATCH  /api/v1/resumes/{resumeId}
DELETE /api/v1/resumes/{resumeId}

GET    /api/v1/resume-templates
POST   /api/v1/resumes/{resumeId}/render
POST   /api/v1/resumes/{resumeId}/export
POST   /api/v1/resumes/{resumeId}/ats-check
POST   /api/v1/resumes/{resumeId}/duplicate
GET    /api/v1/resumes/{resumeId}/versions
```

---

# 6. Image Editor

## 6.1 Supported Inputs

Initially:

```text
JPG / JPEG
PNG
WEBP
GIF
BMP
TIFF
SVG
HEIC
```

Normalize unsupported working formats into an internal representation.

## 6.2 UI

```text
+--------------------------------------------------+
| File | Edit | Image | Layer | View | Export      |
+------------+--------------------------+------------+
| Toolbar    |                          | Properties |
|            |         Canvas           |            |
| Select     |                          | Position   |
| Crop       |                          | Size       |
| Resize     |                          | Rotation   |
| Text       |                          | Opacity    |
| Image      |                          | Filters    |
| Shapes     |                          |            |
| Draw       |                          |            |
+------------+--------------------------+------------+
```

## 6.3 Transform

- Crop
- Resize
- Rotate 90°
- Arbitrary rotation
- Flip horizontal
- Flip vertical
- Straighten
- Perspective transform

## 6.4 Adjustments

- Brightness
- Contrast
- Saturation
- Exposure
- Gamma
- Hue
- Temperature
- Sharpness
- Blur
- Grayscale
- Invert

## 6.5 Drawing

- Pen
- Highlighter
- Eraser
- Line
- Arrow
- Rectangle
- Circle
- Polygon

## 6.6 Text

- Font
- Size
- Bold
- Italic
- Alignment
- Color
- Opacity
- Letter spacing
- Line spacing
- Rotation

## 6.7 Layers

- Add
- Delete
- Duplicate
- Rename
- Move
- Lock
- Hide
- Opacity
- Bring forward
- Send backward

## 6.8 Export

```text
PNG
JPG
WEBP
PDF
```

Options:

- Quality
- Resolution
- DPI
- Background
- Transparency
- Metadata removal

---

# 7. Remove Image Background

## Workflow

```text
Upload
  ↓
Subject Detection
  ↓
Foreground Mask
  ↓
Mask Refinement
  ↓
Preview
  ↓
Transparent / New Background
  ↓
Export
```

Features:

- Automatic removal
- Transparent PNG
- Solid-color replacement
- Image-background replacement
- Edge refinement
- Feathering
- Manual erase
- Manual restore
- Brush size
- Zoom
- Before/after preview

API:

```http
POST /api/v1/ai/remove-background
GET  /api/v1/jobs/{jobId}
GET  /api/v1/jobs/{jobId}/result
```

Example:

```json
{
  "fileId": "file_123",
  "output": "png",
  "transparent": true,
  "edgeRefinement": true
}
```

Use isolated CPU/GPU workers with:

- Maximum file size
- Maximum pixel count
- Memory limit
- Timeout
- Concurrency limit

---

# 8. Barcode Scanner

## 8.1 Purpose

Decode barcodes from camera frames or uploaded images.

Common initial symbologies:

```text
CODE_128
CODE_39
CODE_93
EAN_8
EAN_13
UPC_A
UPC_E
ITF
ITF_14
CODABAR
DATA_MATRIX
PDF417 (where supported)
```

Expose actual support from a capability registry.

## 8.2 Inputs

```text
Camera
Image Upload
Paste Image
Batch Images
```

## 8.3 Processing

```text
Frame/Image
    ↓
Preprocess
    ↓
Detect
    ↓
Decode
    ↓
Validate
    ↓
Return Result
```

## 8.4 Features

- Camera scanning
- Image scanning
- Multiple codes per image
- Batch scanning
- Scan history
- Copy result
- Export CSV
- Export TXT
- Generate scan report PDF
- Code type
- Raw payload
- Bounding box
- Timestamp

Result:

```json
{
  "type": "EAN_13",
  "value": "8901234567890",
  "format": "EAN_13",
  "confidence": 0.98,
  "boundingBox": {
    "x": 100,
    "y": 200,
    "width": 300,
    "height": 120
  }
}
```

APIs:

```http
POST /api/v1/barcodes/scan
POST /api/v1/barcodes/scan/batch
GET  /api/v1/barcodes/scans/{scanId}
GET  /api/v1/barcodes/scans/{scanId}/results
```

---

# 9. QR Code Scanner

## 9.1 Supported Payload Types

- Plain text
- URL
- Email
- Phone
- SMS
- Wi-Fi
- vCard/contact
- Calendar data
- Geographic data
- Custom payload

## 9.2 UI

```text
+-----------------------------+
|         QR Scanner          |
|                             |
|      +---------------+      |
|      |    Camera     |      |
|      |               |      |
|      +---------------+      |
|                             |
|       Upload Image          |
+-----------------------------+
```

Result should display:

```text
Type: URL
Value: https://example.com

[Copy] [Open] [Create PDF]
```

Do not automatically navigate to decoded URLs.

Treat URL schemes and payloads as untrusted.

---

# 10. Barcode → PDF

Support two modes.

### Decode to PDF

```text
Barcode Image
 → Decode
 → Structured Results
 → PDF
```

### Generate to PDF

```text
Barcode Data
 → Barcode Renderer
 → PDF Layout
```

Options:

- A4
- Letter
- Custom size
- Portrait/landscape
- Margins
- Rows
- Columns
- Code size
- Human-readable text
- Caption
- Title
- Footer
- Page numbers

API:

```http
POST /api/v1/barcodes/to-pdf
```

Example:

```json
{
  "items": [
    {
      "format": "CODE_128",
      "value": "ABC123"
    }
  ],
  "layout": {
    "pageSize": "A4",
    "columns": 3,
    "rows": 8
  }
}
```

---

# 11. QR → PDF

Workflow:

```text
QR Data / QR Image
      ↓
Decode or Generate
      ↓
Layout Engine
      ↓
PDF
```

Support:

- Multiple QR codes
- Captions
- Descriptions
- Titles
- Logo
- Page size
- Margins
- Grid
- Label layouts

API:

```http
POST /api/v1/qr/to-pdf
```

---

# 12. Add Barcode to PDF

Workflow:

```text
Upload PDF
   ↓
PDF Editor
   ↓
Barcode Tool
   ↓
Choose Symbology
   ↓
Enter Value
   ↓
Generate
   ↓
Move / Resize / Rotate
   ↓
Save
```

Barcode object:

```json
{
  "type": "barcode",
  "format": "CODE_128",
  "value": "ABC123",
  "page": 2,
  "x": 120,
  "y": 340,
  "width": 240,
  "height": 80,
  "rotation": 0,
  "showText": true
}
```

Editor commands:

```text
ADD_BARCODE
EDIT_BARCODE
MOVE_BARCODE
RESIZE_BARCODE
ROTATE_BARCODE
DELETE_BARCODE
DUPLICATE_BARCODE
```

APIs:

```http
POST   /api/v1/documents/{documentId}/barcodes
PATCH  /api/v1/documents/{documentId}/barcodes/{barcodeId}
DELETE /api/v1/documents/{documentId}/barcodes/{barcodeId}
POST   /api/v1/documents/{documentId}/edits
```

Coordinate convention:

```text
UI origin: top-left
Internal PDF coordinates: bottom-left
Canonical unit: points
```

---

# 13. Add QR Code to PDF

Use the same PDF editor integration.

Commands:

```text
ADD_QR
EDIT_QR
MOVE_QR
RESIZE_QR
ROTATE_QR
DELETE_QR
DUPLICATE_QR
```

Object:

```json
{
  "type": "qr",
  "payload": "https://example.com",
  "page": 1,
  "x": 100,
  "y": 150,
  "width": 100,
  "height": 100,
  "errorCorrection": "M"
}
```

---

# 14. Batch Barcode Generator

## Inputs

```text
CSV
XLSX
JSON
Manual Rows
```

Example:

```csv
sku,name,barcode
10001,Product A,8901234567890
10002,Product B,8901234567891
10003,Product C,8901234567892
```

Workflow:

```text
Upload
 ↓
Map Columns
 ↓
Select Symbology
 ↓
Validate
 ↓
Preview
 ↓
Generate
 ↓
ZIP / PDF / Individual Files
```

Validate:

- Required value
- Length
- Character set
- Check digit
- Duplicate values
- Unsupported symbology
- Invalid values

Row-level error:

```json
{
  "row": 17,
  "column": "barcode",
  "code": "INVALID_EAN13",
  "message": "Invalid EAN-13 value."
}
```

Outputs:

- ZIP of PNG/SVG
- Combined PDF
- Individual files
- CSV containing result references

---

# 15. Batch QR Generator

Input:

```csv
name,payload
Google,https://google.com
Product A,PRODUCT:10001
Support,support@example.com
```

Options:

- Error correction
- Size
- Margin
- Logo
- Caption
- Label
- PNG/SVG
- PDF
- ZIP

Use the same batch processing engine as barcode generation.

---

# 16. Shared Batch Engine

Architecture:

```text
Batch Job
 ├── Input
 ├── Column Mapping
 ├── Validation
 ├── Items
 ├── Renderer Config
 ├── Output Config
 └── Package Result
```

Processing:

```text
Batch
 ├─ Row 1 → Renderer
 ├─ Row 2 → Renderer
 ├─ Row 3 → Renderer
 └─ ...
       ↓
Package Results
```

Use chunking and controlled concurrency.

Support:

- Partial success
- Retry failed rows
- Download errors
- ZIP packaging
- Combined PDF

---

# 17. Product Label Generator

## 17.1 Purpose

Create printable product labels containing product information and machine-readable codes.

## 17.2 Fields

- Product name
- SKU
- Product ID
- Price
- Currency
- Brand
- Variant
- Size
- Color
- Batch number
- Lot number
- Manufacturing date
- Expiry date
- Country of origin
- Website
- Contact
- Barcode
- QR code
- Logo
- Custom text

## 17.3 Designer

```text
+--------------------------------------------+
| Product Label Designer                     |
+-------------+------------------------------+
| Elements    |        Label Canvas          |
|             |                              |
| Text        |  PRODUCT NAME                |
| Image       |  SKU: 12345                  |
| Barcode     |  ₹999                         |
| QR          |  ||||||||||                  |
| Shape       |  [ QR ]                      |
| Logo        |                              |
+-------------+------------------------------+
```

## 17.4 Label Dimensions

Support:

- Width
- Height
- mm
- cm
- inch
- points
- rows
- columns
- margins
- gaps
- sheet labels
- roll labels

Canonical internal unit: points.

## 17.5 Export

```text
PDF
PNG
SVG
```

Print layouts:

- A4
- Letter
- Custom sheets
- Roll dimensions
- Multiple labels/page
- Optional bleed/cut settings

APIs:

```http
POST /api/v1/labels/product
POST /api/v1/labels/product/render
POST /api/v1/labels/product/export
GET  /api/v1/label-templates/product
```

---

# 18. Shipping Label Generator

## Data Model

```json
{
  "sender": {
    "name": "",
    "company": "",
    "address1": "",
    "address2": "",
    "city": "",
    "state": "",
    "postalCode": "",
    "country": "",
    "phone": ""
  },
  "recipient": {
    "name": "",
    "company": "",
    "address1": "",
    "address2": "",
    "city": "",
    "state": "",
    "postalCode": "",
    "country": "",
    "phone": ""
  },
  "package": {
    "weight": 0,
    "weightUnit": "kg",
    "length": 0,
    "width": 0,
    "height": 0,
    "reference": ""
  },
  "tracking": {
    "number": ""
  }
}
```

Features:

- Sender
- Recipient
- Return address
- Tracking number
- Barcode
- QR
- Order number
- Package number
- Weight
- Dimensions
- Delivery instructions
- Logo
- Custom fields
- Multiple packages
- Batch generation
- PDF/PNG export
- Template saving

### Scope boundary

Initially this is a **printable label generator**.

Do not represent the generated label as carrier-valid or as an actual shipping service label unless a real carrier integration has been implemented.

Future shipping integrations belong in the Integration bounded context.

---

# 19. Template Engine

Use a common template format for resumes and labels.

Example:

```json
{
  "id": "template_product_label_001",
  "type": "PRODUCT_LABEL",
  "version": 1,
  "page": {
    "width": 300,
    "height": 200,
    "unit": "mm"
  },
  "objects": [
    {
      "type": "TEXT",
      "binding": "product.name",
      "x": 10,
      "y": 10
    },
    {
      "type": "BARCODE",
      "binding": "product.sku",
      "x": 10,
      "y": 100
    }
  ]
}
```

Data bindings:

```text
{{product.name}}
{{product.sku}}
{{product.price}}
{{product.barcode}}
{{product.qr}}
{{shipping.recipient.name}}
{{shipping.tracking.number}}
```

Batch mapping:

```text
CSV column → template variable
```

---

# 20. Database Changes

## resumes

```text
id
organization_id
owner_id
template_id
title
data_json
status
created_at
updated_at
```

## resume_versions

```text
id
resume_id
version
data_json
created_by
created_at
```

## visual_documents

```text
id
organization_id
owner_id
type
width
height
unit
background
canvas_json
version
created_at
updated_at
```

## visual_objects

```text
id
visual_document_id
object_type
properties_json
z_index
locked
hidden
created_at
updated_at
```

Use serialized project state where appropriate; normalize objects only when querying them independently is required.

## barcodes

```text
id
organization_id
owner_id
format
value_hash
encrypted_value
metadata_json
created_at
```

## qr_codes

```text
id
organization_id
owner_id
payload_hash
encrypted_payload
format
error_correction
metadata_json
created_at
```

## batches

```text
id
organization_id
owner_id
type
input_file_id
configuration_json
total_items
processed_items
failed_items
status
created_at
completed_at
```

## batch_items

```text
id
batch_id
row_number
input_json
validation_status
error_json
output_file_id
status
```

## label_templates

```text
id
organization_id
type
name
version
template_json
is_public
created_by
created_at
updated_at
```

---

# 21. API Structure

```text
/api/v1/resumes/*
/api/v1/images/*
/api/v1/ai/remove-background
/api/v1/barcodes/*
/api/v1/qr/*
/api/v1/labels/*
/api/v1/batches/*
/api/v1/visual-documents/*
```

Generation APIs:

```http
POST /api/v1/barcodes/generate
POST /api/v1/qr/generate
```

Barcode example:

```json
{
  "format": "CODE_128",
  "value": "ABC123",
  "output": "png",
  "width": 800,
  "height": 300,
  "showText": true
}
```

QR example:

```json
{
  "payload": "https://example.com",
  "format": "png",
  "size": 800,
  "errorCorrection": "M",
  "margin": 4
}
```

Batch:

```http
POST /api/v1/batches
GET  /api/v1/batches/{batchId}
POST /api/v1/batches/{batchId}/cancel
GET  /api/v1/batches/{batchId}/results
GET  /api/v1/batches/{batchId}/errors
```

---

# 22. Job Types

Add:

```text
RESUME_RENDER
RESUME_EXPORT
RESUME_ATS_CHECK

IMAGE_PROCESS
IMAGE_REMOVE_BACKGROUND
IMAGE_EXPORT

BARCODE_SCAN
BARCODE_GENERATE
BARCODE_TO_PDF
BARCODE_BATCH_GENERATE

QR_SCAN
QR_GENERATE
QR_TO_PDF
QR_BATCH_GENERATE

PDF_ADD_BARCODE
PDF_ADD_QR

PRODUCT_LABEL_RENDER
PRODUCT_LABEL_EXPORT
SHIPPING_LABEL_RENDER
SHIPPING_LABEL_EXPORT

BATCH_PACKAGE
```

---

# 23. Events

```text
resume.created
resume.updated
resume.exported

image.uploaded
image.processed
image.background_removed

barcode.scanned
barcode.generated
barcode.batch.completed

qr.scanned
qr.generated
qr.batch.completed

label.created
label.rendered
label.exported

batch.created
batch.started
batch.progress
batch.completed
batch.failed
```

Standard event envelope:

```json
{
  "eventId": "evt_123",
  "eventType": "barcode.generated",
  "version": 1,
  "timestamp": "2026-09-16T00:00:00Z",
  "organizationId": "org_123",
  "actorId": "user_123",
  "resourceId": "barcode_123",
  "payload": {}
}
```

---

# 24. Entitlements

Never hard-code limits in the frontend.

Feature keys:

```text
FEATURE_RESUME_BUILDER
FEATURE_IMAGE_EDITOR
FEATURE_BACKGROUND_REMOVAL
FEATURE_BARCODE_SCANNER
FEATURE_QR_SCANNER
FEATURE_BARCODE_GENERATOR
FEATURE_QR_GENERATOR
FEATURE_BARCODE_PDF
FEATURE_QR_PDF
FEATURE_PDF_BARCODE
FEATURE_PDF_QR
FEATURE_BATCH_BARCODE
FEATURE_BATCH_QR
FEATURE_PRODUCT_LABEL
FEATURE_SHIPPING_LABEL
```

Limit keys:

```text
MAX_BATCH_ITEMS
MAX_IMAGE_PIXELS
MAX_IMAGE_SIZE
MAX_RESUME_COUNT
MAX_LABEL_TEMPLATES
MAX_CODES_PER_JOB
MAX_DAILY_SCAN_COUNT
MAX_DAILY_GENERATION_COUNT
MAX_CONCURRENT_BATCH_JOBS
```

Frontend may display limits, but backend enforcement is authoritative.

---

# 25. Usage Metering

Track usage at operation/job level:

```text
BARCODE_SCAN
QR_SCAN
BARCODE_GENERATION
QR_GENERATION
BARCODE_BATCH_ITEM
QR_BATCH_ITEM
PDF_BARCODE_PLACEMENT
PDF_QR_PLACEMENT
IMAGE_BACKGROUND_REMOVAL
IMAGE_EDITOR_EXPORT
RESUME_EXPORT
LABEL_EXPORT
```

Example:

```json
{
  "organizationId": "org_123",
  "userId": "user_123",
  "operation": "BARCODE_BATCH_ITEM",
  "quantity": 1000,
  "jobId": "job_123",
  "timestamp": "2026-09-16T00:00:00Z"
}
```

---

# 26. Security

## QR

Treat all decoded QR payloads as untrusted.

Block/warn on dangerous schemes:

```text
javascript:
data:
file:
intent:
unknown custom schemes
```

Do not auto-open URLs.

## Image

Sandbox image processing.

Protect against:

- Decompression bombs
- Malformed files
- Excessive dimensions
- Excessive memory
- Processing timeouts
- Malicious SVG
- External SVG references
- Embedded active content

Sanitize or rasterize untrusted SVG where appropriate.

## PDF

For PDF barcode/QR operations:

- Validate PDF structure
- Respect encryption/password requirements
- Validate page count
- Validate coordinates
- Sanitize output
- Reopen output for verification

---

# 27. Barcode Validation Registry

Implement a centralized `BarcodeSymbologyRegistry`.

Example:

```json
{
  "type": "EAN_13",
  "minLength": 13,
  "maxLength": 13,
  "charset": "DIGITS",
  "checkDigit": true
}
```

The registry owns:

- Allowed characters
- Length
- Check digit rules
- Encoding requirements
- Renderer availability
- Scanner availability

---

# 28. QR Validation

Validate:

- Payload size
- Encoding
- Error correction
- QR version
- Character set

Default to automatic version selection.

---

# 29. Print Quality

Expose:

- DPI
- Physical dimensions
- Quiet zone
- Contrast
- Error correction
- Print size

Warn users if they configure dimensions that may make codes difficult to scan.

For critical business workflows, provide an optional verification step by rendering the generated output and decoding it again.

---

# 30. Printing and Measurement

Canonical internal unit:

```text
points
```

Conversions:

```text
1 inch = 72 pt
1 inch = 25.4 mm
1 cm = 10 mm
```

Frontend may display:

```text
mm
cm
inch
px
pt
```

Backend normalizes dimensions.

---

# 31. Accessibility

All new screens must support:

- Keyboard navigation
- Screen-reader labels
- Visible focus
- High contrast
- Zoom
- Tooltips
- Accessible validation messages
- Non-color-only status indicators

Canvas editors must provide keyboard alternatives for major actions.

---

# 32. Internationalization

Support:

- Unicode
- RTL
- Devanagari
- CJK
- Arabic
- Hebrew
- European languages

Resume and label templates must not assume Latin-only content.

---

# 33. Performance Targets

## Interactive editors

```text
Normal pointer interaction: <100 ms
Toolbar action: <100 ms
Undo/redo: <100 ms for normal projects
Smooth zoom/pan
```

## Scanning

Use device camera capabilities for near-real-time scanning where available.

## Generation

Small barcode/QR operations may be synchronous/near-synchronous.

Large batches must be asynchronous.

Background removal for larger images should be asynchronous.

---

# 34. Worker Pools

Recommended logical pools:

```text
PDF_WORKER
IMAGE_WORKER
AI_IMAGE_WORKER
BARCODE_WORKER
QR_WORKER
LABEL_WORKER
BATCH_WORKER
RENDER_WORKER
```

They may initially share infrastructure; split deployments only when workload characteristics require it.

---

# 35. Queue Design

Topics/queues:

```text
jobs.image
jobs.barcode
jobs.qr
jobs.resume
jobs.label
jobs.batch
```

Use:

- Idempotency keys
- Controlled concurrency
- Per-user limits
- Per-organization limits
- Global limits
- Priority queues

---

# 36. Idempotency

Support:

```http
Idempotency-Key: <unique-key>
```

Required for important generation operations, especially:

- Batch generation
- PDF generation
- Label generation
- Resume export

Retries must not create duplicate outputs.

---

# 37. Retry Strategy

Retry transient failures:

```text
Storage timeout
Worker unavailable
Temporary queue failure
Temporary dependency failure
```

Do not retry deterministic failures:

```text
Invalid barcode
Invalid QR payload
Corrupt image
Invalid CSV
Invalid PDF
Unsupported format
Quota exceeded
```

Use exponential backoff.

---

# 38. Frontend Routes

Add:

```text
/resume-builder
/resume-builder/:id

/image-editor
/image-editor/:id

/remove-background

/barcode-scanner
/qr-scanner

/barcode-generator
/qr-generator

/barcode-to-pdf
/qr-to-pdf

/pdf/add-barcode
/pdf/add-qr

/batch-barcode-generator
/batch-qr-generator

/product-label-generator
/shipping-label-generator
```

---

# 39. Common UI States

Every tool should handle:

```text
EMPTY
SELECTING_FILE
UPLOADING
VALIDATING
QUEUED
PROCESSING
PROGRESS
SUCCESS
PARTIAL_SUCCESS
FAILED
CANCELLED
EXPIRED
QUOTA_EXCEEDED
UNSUPPORTED_FORMAT
CORRUPT_INPUT
```

Batch UX:

```text
Upload
 ↓
Preview
 ↓
Column Mapping
 ↓
Validation
 ↓
Errors
 ↓
Generation
 ↓
Progress
 ↓
Results
```

Example:

```text
Processed: 7,420 / 10,000
Successful: 7,390
Failed: 30

[Download Results]
[Download Errors]
[Retry Failed]
```

---

# 40. File Retention

Generated files should follow existing retention rules:

```text
Temporary processing
      ↓
Result storage
      ↓
Download
      ↓
Retention period
      ↓
Automatic deletion
```

Saved projects/resumes/templates follow persistent workspace retention.

Use signed URLs for downloads.

---

# 41. Audit

Record:

```text
resume.created
resume.exported
image.processed
background.removed
barcode.scanned
barcode.generated
qr.scanned
qr.generated
pdf.barcode.added
pdf.qr.added
batch.created
batch.completed
label.created
label.exported
```

Do not put raw sensitive payloads into audit logs unnecessarily.

---

# 42. Testing

## Unit

Test:

- Barcode validation
- Check digits
- QR validation
- Dimension conversion
- Template bindings
- CSV mapping
- Resume schema
- Label schema
- Editor commands
- Coordinate conversion

## Integration

Test:

```text
Upload → Scan
Upload → Background Removal
CSV → Batch Barcode
CSV → Batch QR
Resume → PDF
Label → PDF
PDF → Add Barcode
PDF → Add QR
```

## E2E

Test:

- Upload
- Editor interactions
- Save
- Export
- Download
- Retry
- Cancel
- Quota exceeded
- Invalid input
- Concurrent editing

---

# 43. Barcode Test Corpus

Include:

- Every supported symbology
- Valid/invalid values
- Check-digit failures
- Low resolution
- Rotation
- Skew
- Blur
- Low contrast
- Multiple codes
- Cropped codes
- Very small codes
- Very large codes

# 44. QR Test Corpus

Include:

- URL
- Text
- Unicode
- Wi-Fi
- vCard
- Email
- Phone
- Long payload
- Error-correction levels
- Low resolution
- Rotation
- Perspective
- Multiple QR codes

# 45. Image Test Corpus

Include:

- Small images
- Large images
- High-resolution photos
- Transparent PNG
- JPEG with EXIF
- TIFF
- WEBP
- HEIC
- SVG
- CMYK
- Corrupt images
- Decompression bombs
- Extremely wide/tall images

# 46. Resume Test Corpus

Include:

- One-page resume
- Multi-page CV
- Long descriptions
- Unicode names
- RTL content
- Missing fields
- Many skills
- Many certifications
- Long company names
- Long URLs
- Profile image
- PDF text extraction

# 47. Label Test Corpus

Include:

- Small labels
- Large labels
- Multiple labels/page
- Roll labels
- A4
- Letter
- Long product names
- Unicode
- Barcode
- QR
- Logos
- Batch labels
- Empty optional fields

---

# 48. PDF Verification Pipeline

After generating PDF containing barcode/QR:

```text
Generate PDF
   ↓
Reopen PDF
   ↓
Verify page count
   ↓
Render pages
   ↓
Run barcode/QR decoder
   ↓
Compare decoded value
   ↓
Mark result valid
```

This should be an automated integration test.

---

# 49. Observability

Metrics:

```text
resume_render_duration
resume_export_duration
image_processing_duration
background_removal_duration
barcode_scan_duration
qr_scan_duration
barcode_generation_duration
qr_generation_duration
batch_processing_duration
label_render_duration
pdf_barcode_duration
pdf_qr_duration
```

Business metrics:

```text
resume_exports
image_edits
background_removals
barcode_scans
qr_scans
barcode_generations
qr_generations
batch_items_processed
product_labels_created
shipping_labels_created
```

Trace:

```text
requestId
traceId
organizationId
userId
jobId
resourceId
```

---

# 50. JIRA Epics

## EPIC 16 — Resume Builder

- Resume schema
- Templates
- Editor
- Sections
- Template customization
- PDF renderer
- ATS checker
- Versioning
- Export
- API
- E2E

## EPIC 17 — Image Editor

- Upload
- Canvas
- Crop
- Resize
- Rotate
- Flip
- Text
- Shapes
- Drawing
- Layers
- Filters
- Adjustments
- Undo/redo
- Export
- Security
- E2E

## EPIC 18 — Image Background Removal

- Upload
- Segmentation
- Mask refinement
- Transparent output
- Background replacement
- Manual refinement
- Worker
- Entitlement
- Metering
- Security tests

## EPIC 19 — Barcode Platform

- Symbology registry
- Validator
- Generator
- Scanner
- Scan history
- Batch engine
- CSV/XLSX mapping
- Barcode PDF
- PDF placement
- API
- Usage
- E2E

## EPIC 20 — QR Platform

- Generator
- Scanner
- Payload parser
- URL safety
- QR → PDF
- PDF placement
- Batch QR
- API
- Usage
- E2E

## EPIC 21 — Label Platform

- Template engine
- Label designer
- Product labels
- Shipping labels
- Barcode bindings
- QR bindings
- Batch labels
- Print layouts
- PDF renderer
- PNG/SVG renderer
- Template management
- API
- E2E

---

# 51. Development Order

## Phase 1 — Shared foundation

1. Visual editing engine
2. Template engine
3. Barcode/QR registry
4. Batch engine
5. Rendering pipeline
6. Entitlement integration
7. Usage metering

## Phase 2 — High-value tools

1. Barcode Generator
2. QR Generator
3. Barcode Scanner
4. QR Scanner
5. Image Editor
6. Remove Background

## Phase 3 — PDF integration

1. Add Barcode to PDF
2. Add QR Code to PDF
3. Barcode → PDF
4. QR → PDF

## Phase 4 — Batch

1. Batch Barcode Generator
2. Batch QR Generator
3. Batch PDF generation
4. ZIP output
5. Retry failed rows

## Phase 5 — Labels

1. Product Label Generator
2. Shipping Label Generator
3. Templates
4. Barcode/QR bindings
5. Batch labels

## Phase 6 — Resume

1. Resume schema
2. Templates
3. Editor
4. PDF renderer
5. ATS checks
6. Versioning
7. Export

---

# 52. Definition of Done

A feature is complete only when all applicable items exist:

- Frontend UI
- Responsive design
- API
- Authentication
- Authorization
- Entitlement checks
- Usage metering
- Input validation
- Worker/job processing
- Progress
- Cancellation where applicable
- Retry
- Error handling
- Audit
- Metrics
- Logging
- Security tests
- Unit tests
- Integration tests
- E2E tests
- Accessibility
- Internationalization
- API documentation
- User documentation

---

# 53. Final Tool Catalog

```text
PDF
├── Merge
├── Split
├── Organize
├── Edit
├── Compress
├── Convert
├── OCR
├── Repair
├── Protect
├── Unlock
├── Redact
├── Compare
├── Flatten
├── Forms
├── Sign
├── Watermark
├── Page Numbers
├── Metadata
├── Add Barcode
├── Add QR
├── Barcode → PDF
└── QR → PDF

IMAGE
├── Image Editor
├── Compress
├── Resize
├── Crop
├── Convert
├── Rotate
├── Flip
├── Upscale
├── Remove Background
├── Image → PDF
└── Image → Text

BARCODE & QR
├── Barcode Scanner
├── QR Code Scanner
├── Barcode Generator
├── QR Generator
├── Batch Barcode Generator
├── Batch QR Generator
├── Barcode → PDF
├── QR → PDF
└── Scan History

LABELS
├── Product Label Generator
├── Shipping Label Generator
├── Barcode Label Generator
├── QR Label Generator
└── Custom Label Designer

CAREER
├── Resume/CV PDF Builder
├── Resume Templates
├── ATS Check
└── Cover Letter Builder
```

---

# 54. Strategic Outcome

The implementation should be centered on three reusable engines:

```text
                 DOCUMENT ENGINE
              PDF / Office / OCR
                       |
                       v
              VISUAL EDITOR ENGINE
       Canvas / Objects / Layers / Templates
                       |
        +--------------+--------------+
        |              |              |
    PDF Editor    Image Editor    Label Designer
                       |
                       v
                  CODE ENGINE
             Barcode / QR / Scan
```

This creates strong reuse:

- Barcode and QR objects work inside PDF Editor and Label Designer.
- The canvas engine powers Image Editor, labels and parts of Resume Builder.
- The template engine powers resumes and labels.
- The batch engine handles barcodes, QR codes and labels.
- The PDF renderer exports resumes, labels and code sheets.
- The existing job/queue infrastructure handles large batches and AI image processing.
- Existing entitlement, usage, audit and storage services control the new capabilities.

The result is a unified document/productivity platform rather than a set of unrelated utilities.
