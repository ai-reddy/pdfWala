# PDF Document Platform — Complete FRD & Implementation Specification
## iLovePDF + Sejda-inspired Feature Superset

**Version:** 1.1  
**Purpose:** Production implementation baseline for a cloud-native PDF/document platform.  
**Reference scope:** Current public capabilities of iLovePDF and Sejda, plus the platform architecture, APIs, data model, events, workflows, security, and enterprise requirements defined below.

> **Important product decision:** Sejda's PDF Editor capabilities are included as functional requirements, while the number of PDFs/files that can be edited simultaneously is controlled by our own subscription/entitlement system. The editor itself must not hard-code a Sejda-style file-count limitation.

---

# 1. Executive Scope

The platform is a full document-processing and document-intelligence SaaS product.

## 1.1 Functional domains

1. Authentication and identity
2. Organizations, teams and RBAC
3. File upload and document management
4. PDF viewing
5. PDF organization
6. PDF editing
7. PDF conversion
8. PDF optimization
9. OCR
10. PDF security
11. Redaction
12. PDF comparison
13. PDF forms
14. Electronic signatures
15. AI document intelligence
16. Image AI
17. Workflow automation
18. Cloud integrations
19. REST API
20. Webhooks
21. Billing and entitlements
22. Usage metering
23. Enterprise administration
24. Audit and observability
25. Web, mobile and desktop experiences

---

# 2. Complete Feature Inventory

## 2.1 Organization

- Merge PDF
- Alternate/Mix PDFs
- Split by pages
- Split by page ranges
- Split by bookmarks
- Split by file size
- Split by text occurrence
- Split two-page-layout scans in half
- Smart Split
- Extract pages
- Delete pages
- Reorder pages
- Duplicate pages
- Insert pages
- Rotate pages
- Copy PDF
- Scan to PDF

## 2.2 Optimization

- Compress PDF
- Compression presets
- Custom compression
- Repair PDF
- OCR
- PDF/A conversion
- Remove annotations
- Flatten PDF/forms

## 2.3 Conversion

### To PDF

- JPG → PDF
- PNG → PDF
- TIFF → PDF
- Office → PDF
- Word → PDF
- Excel → PDF
- PowerPoint → PDF
- HTML → PDF

### From PDF

- PDF → Word
- PDF → Excel
- PDF → CSV
- PDF → PowerPoint
- PDF → JPG
- PDF → PNG
- PDF → TIFF
- PDF → Text
- PDF → Markdown
- PDF → PDF/A

### OCR-assisted

- Scanned PDF → searchable PDF
- Scanned PDF → Word
- Scanned PDF → Excel
- Scanned PDF → text

## 2.4 PDF Editor — Sejda capability superset

### Text

- Add text
- Edit existing PDF text
- Move text
- Resize text
- Change font family
- Change font size
- Bold
- Italic
- Text color
- Text alignment
- Text opacity
- Find
- Find and replace
- Repeated text
- Copy/paste
- Undo/redo

### Images

- Add image
- Move image
- Resize image
- Rotate image
- Replace image where supported
- Image opacity
- Image layering/order
- Image duplication

### Links

- Add URL link
- Edit existing hyperlink
- Link to page in same PDF
- Move/resize link region

### Annotation

- Highlight
- Strikethrough
- Underline
- Freehand highlight
- Comments/notes
- Annotation removal
- Batch remove annotations

### Shapes

- Rectangle
- Ellipse
- Line
- Arrow
- Border
- Fill
- Opacity
- Resize
- Move
- Rotate

### Whiteout

- Whiteout selected page region
- Whiteout repeated regions
- Explicitly distinguish whiteout from secure redaction

### Forms

- Fill existing fields
- Create text fields
- Create multiline fields
- Create dropdowns
- Create checkboxes
- Create radio choices
- Default field values
- Field names
- Required fields
- Field editing
- Read-only/editable field controls

### Signatures

- Type signature
- Draw signature
- Upload signature image
- Camera signature capture
- Save signature
- Place signature
- Resize signature
- Move signature

### Pages inside editor

- Insert page
- Delete page
- Reorder page
- Rotate page
- Duplicate page

### Attachments

- Add attachment
- Update attachment
- Download attachment

### Editor utility

- Zoom
- Pan
- Page navigation
- Page thumbnails
- Multi-object selection
- Move multiple objects
- Delete multiple objects
- Object selection
- Apply/save changes

## 2.5 Security

- Protect PDF
- Password protection
- Permission restrictions
- Unlock PDF
- Encrypt PDF
- Remove restrictions where authorized
- Redact PDF
- PII detection
- Metadata sanitization
- Flatten PDF

## 2.6 PDF comparison

- Visual comparison
- Text comparison
- Semantic comparison
- Added text
- Removed text
- Modified text
- Moved content
- Added pages
- Removed pages
- Difference report

## 2.7 Forms

- Detect existing fields
- Create fillable forms
- Text
- Multiline text
- Dropdown
- Checkbox
- Radio
- Date
- Signature
- Required
- Validation
- Default value
- Field naming
- Read-only
- Flatten forms

## 2.8 Signatures

- Self-sign
- Type/draw/upload signature
- Signature request
- Multiple signers
- Sequential signing
- Parallel signing
- Signature fields
- Initials
- Date
- Text fields
- Checkbox
- Authentication
- Expiration
- Reminders
- Audit trail
- Evidence package
- Signed document custody

## 2.9 AI

- Summarize PDF
- Key points
- Action items
- Risk extraction
- Translate PDF
- Preserve layout
- Data extraction
- Schema-driven extraction
- JSON output
- XML output
- CSV output
- Excel output
- Smart Split
- Form detection
- PDF → Markdown
- Image upscaling
- Background removal

## 2.10 Workflow

- Workflow builder
- Drag/drop nodes
- Chained operations
- Conditional branching
- Webhooks
- Email actions
- Save workflow
- Publish workflow
- Workflow versions
- Workflow templates
- Workflow execution history
- Scheduled workflows
- API-triggered workflows

## 2.11 Platform

- Web
- Mobile
- Desktop
- Offline desktop processing
- Google Drive
- Dropbox
- OneDrive
- REST API
- Webhooks
- Zapier
- Make
- Power Automate
- n8n
- Teams
- SSO
- MFA
- Regional processing
- Custom branding
- Enterprise administration

---

# 3. Product Entitlement Model

File-count limitations must be configurable.

Example:

```text
FREE
  editor.max_input_pdfs = 1

PREMIUM
  editor.max_input_pdfs = 10

BUSINESS
  editor.max_input_pdfs = 50

ENTERPRISE
  editor.max_input_pdfs = configurable
```

The editor must consume the entitlement:

```text
FEATURE_PDF_EDITOR
FEATURE_PDF_EDITOR_MULTI_FILE
MAX_EDITOR_INPUT_FILES
MAX_EDITOR_PAGES
MAX_EDITOR_FILE_SIZE
```

Never hard-code limits inside the editor.

---

# 4. Screen Inventory

## Public

- Home
- All Tools
- Pricing
- Login
- Signup
- Password Reset
- Terms
- Privacy
- Help

## Common Processing

- Upload
- File Queue
- Processing
- Result
- Error
- History

## PDF Editor

- Editor Workspace
- Page Navigator
- Text Tool
- Image Tool
- Link Tool
- Forms Tool
- Annotation Tool
- Shape Tool
- Signature Tool
- Whiteout Tool
- Find/Replace
- Attachments
- Save/Apply

## Organization

- Merge
- Split
- Alternate/Mix
- Organize
- Extract
- Delete
- Rotate
- Copy
- Scan

## Conversion

- PDF → Word
- PDF → Excel
- PDF → PowerPoint
- PDF → Image
- PDF → Text
- PDF → Markdown
- Office → PDF
- Image → PDF
- HTML → PDF
- PDF/A

## Security

- Protect
- Unlock
- Redact
- Compare
- Flatten
- Remove Annotations

## AI

- Summarize
- Translate
- Extract
- Smart Split
- Forms Detection
- Image AI

## Signature

- Self Sign
- Signature Request
- Signer View
- Audit Trail
- Completed Documents

## Workspace

- Recent
- Files
- Shared
- Starred
- Workflows
- Signatures

## Administration

- Members
- Roles
- Permissions
- Branding
- Integrations
- Usage
- Billing
- Audit
- Jobs
- Workers
- System Health

---

# 5. PDF EDITOR — DETAILED UX SPECIFICATION

## 5.1 Layout

```text
┌─────────────────────────────────────────────────────────────┐
│ Logo | File | Undo | Redo | Zoom | Save | Download         │
├─────────────┬───────────────────────────────┬───────────────┤
│             │                               │               │
│ TOOLBAR     │          PDF CANVAS           │ PROPERTIES    │
│             │                               │               │
│ Select      │       ┌───────────────┐       │ Text          │
│ Text        │       │               │       │ Font          │
│ Image       │       │    Page 1     │       │ Size          │
│ Link        │       │               │       │ Color         │
│ Forms       │       └───────────────┘       │ Position      │
│ Annotate    │                               │               │
│ Shape       │       ┌───────────────┐       │ Opacity       │
│ Whiteout    │       │    Page 2     │       │               │
│ Signature   │       └───────────────┘       │               │
│ Attachment  │                               │               │
└─────────────┴───────────────────────────────┴───────────────┘
```

## 5.2 Editor initialization

1. Authenticate user.
2. Load entitlement.
3. Validate selected file count.
4. Upload/import files.
5. Validate PDFs.
6. Generate document model.
7. Generate thumbnails.
8. Open editor.

## 5.3 Multi-PDF editing

The platform must support multiple input PDFs according to entitlement.

The user may:

- open multiple PDFs
- switch documents
- copy pages between documents
- copy objects where technically supported
- insert pages from another PDF
- reorder pages
- merge edited documents

If the subscription permits one PDF only, the UI must clearly display the limit before upload.

---

# 6. EDITOR COMMAND MODEL

Every editor operation is represented as a command.

Example:

```json
{
  "commandId": "cmd_123",
  "type": "ADD_TEXT",
  "documentId": "doc_1",
  "page": 3,
  "payload": {
    "x": 100,
    "y": 220,
    "text": "Approved",
    "fontFamily": "Arial",
    "fontSize": 12,
    "color": "#000000"
  }
}
```

Commands:

```text
ADD_TEXT
EDIT_TEXT
MOVE_TEXT
DELETE_TEXT
ADD_IMAGE
MOVE_IMAGE
RESIZE_IMAGE
ROTATE_IMAGE
ADD_LINK
EDIT_LINK
DELETE_LINK
ADD_SHAPE
EDIT_SHAPE
DELETE_SHAPE
HIGHLIGHT
STRIKETHROUGH
UNDERLINE
WHITEOUT
ADD_FORM_FIELD
EDIT_FORM_FIELD
DELETE_FORM_FIELD
ADD_SIGNATURE
DELETE_SIGNATURE
INSERT_PAGE
DELETE_PAGE
MOVE_PAGE
ROTATE_PAGE
ADD_ATTACHMENT
DELETE_ATTACHMENT
```

This enables:

- undo
- redo
- history
- collaboration later
- command validation
- deterministic save

---

# 7. EDITOR SAVE MODEL

The client sends a command batch:

```http
POST /v1/documents/{documentId}/edits
```

```json
{
  "baseVersion": 12,
  "commands": [
    {
      "type": "EDIT_TEXT",
      "page": 1,
      "objectId": "obj_1",
      "payload": {
        "text": "Updated value"
      }
    }
  ]
}
```

Response:

```json
{
  "documentId": "doc_1",
  "version": 13,
  "jobId": "job_100"
}
```

If `baseVersion` is stale:

```text
409 DOCUMENT_VERSION_CONFLICT
```

---

# 8. API CONTRACT

Base:

```text
/api/v1
```

## Authentication

```http
POST /auth/login
POST /auth/signup
POST /auth/refresh
POST /auth/logout
POST /auth/mfa/verify
```

## Files

```http
POST   /files
GET    /files/{id}
DELETE /files/{id}
GET    /files/{id}/download
POST   /files/{id}/copy
```

## Documents

```http
GET  /documents/{id}
GET  /documents/{id}/pages
POST /documents/{id}/edits
POST /documents/{id}/versions
GET  /documents/{id}/versions
```

## Jobs

```http
POST /jobs
GET  /jobs/{id}
POST /jobs/{id}/cancel
GET  /jobs/{id}/result
```

## Organization

```http
GET  /organizations
POST /organizations
GET  /organizations/{id}
PATCH /organizations/{id}
```

## Members

```http
GET    /organizations/{id}/members
POST   /organizations/{id}/members
PATCH  /organizations/{id}/members/{memberId}
DELETE /organizations/{id}/members/{memberId}
```

## Workflows

```http
GET  /workflows
POST /workflows
GET  /workflows/{id}
PATCH /workflows/{id}
POST /workflows/{id}/publish
POST /workflows/{id}/execute
GET  /workflows/{id}/runs
```

## Signatures

```http
POST /signature-requests
GET  /signature-requests/{id}
POST /signature-requests/{id}/send
POST /signature-requests/{id}/cancel
GET  /signature-requests/{id}/audit
```

## AI

```http
POST /ai/summarize
POST /ai/translate
POST /ai/extract
POST /ai/smart-split
POST /ai/detect-forms
POST /ai/markdown
POST /ai/upscale
POST /ai/remove-background
```

---

# 9. TOOL-SPECIFIC APIs

```http
POST /jobs/merge
POST /jobs/alternate
POST /jobs/split
POST /jobs/smart-split
POST /jobs/extract-pages
POST /jobs/delete-pages
POST /jobs/organize
POST /jobs/rotate
POST /jobs/compress
POST /jobs/repair
POST /jobs/ocr
POST /jobs/convert
POST /jobs/pdf-a
POST /jobs/watermark
POST /jobs/page-numbers
POST /jobs/crop
POST /jobs/protect
POST /jobs/unlock
POST /jobs/redact
POST /jobs/compare
POST /jobs/remove-annotations
POST /jobs/flatten
POST /jobs/scan
```

---

# 10. STANDARD JOB REQUEST

```json
{
  "operation": "PDF_COMPRESS",
  "inputFiles": ["file_1"],
  "options": {
    "compression": "BALANCED"
  },
  "callback": {
    "webhookId": "wh_1"
  }
}
```

Standard response:

```json
{
  "jobId": "job_100",
  "status": "QUEUED",
  "createdAt": "2026-09-15T10:00:00Z"
}
```

---

# 11. ERROR CONTRACT

```json
{
  "error": {
    "code": "PLAN_LIMIT_EXCEEDED",
    "message": "Your plan allows 1 PDF in the editor.",
    "details": {
      "feature": "PDF_EDITOR",
      "limit": 1,
      "requested": 3
    },
    "requestId": "req_123",
    "retryable": false
  }
}
```

Standard codes:

```text
INVALID_REQUEST
UNAUTHORIZED
FORBIDDEN
NOT_FOUND
CONFLICT
FILE_TOO_LARGE
FILE_COUNT_EXCEEDED
PAGE_LIMIT_EXCEEDED
PLAN_LIMIT_EXCEEDED
UNSUPPORTED_FILE_TYPE
PDF_CORRUPTED
PDF_PASSWORD_REQUIRED
INVALID_PASSWORD
MALWARE_DETECTED
UNSUPPORTED_PDF_FEATURE
DOCUMENT_VERSION_CONFLICT
JOB_NOT_FOUND
JOB_CANCELLED
PROCESSING_FAILED
PROCESSING_TIMEOUT
OCR_FAILED
CONVERSION_FAILED
AI_QUOTA_EXCEEDED
STORAGE_ERROR
WEBHOOK_FAILED
```

---

# 12. POSTGRESQL ERD

```text
users
  │
  ├── organization_members
  │          │
  │          └── organizations
  │
  ├── files
  │      │
  │      └── documents
  │             │
  │             └── document_versions
  │
  └── audit_events

organizations
  │
  ├── memberships
  ├── roles
  ├── permissions
  ├── files
  ├── jobs
  ├── workflows
  ├── subscriptions
  ├── usage_records
  ├── api_keys
  └── integrations

jobs
  │
  └── job_events

workflows
  │
  └── workflow_runs

signature_requests
  │
  ├── signers
  ├── signature_fields
  └── signature_audit_events
```

---

# 13. DATABASE TABLES

## users

```sql
id UUID PRIMARY KEY
email VARCHAR(320) UNIQUE NOT NULL
password_hash TEXT
first_name VARCHAR(100)
last_name VARCHAR(100)
status VARCHAR(30)
mfa_enabled BOOLEAN
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

## organizations

```sql
id UUID PRIMARY KEY
name VARCHAR(255)
plan_id UUID
region VARCHAR(30)
status VARCHAR(30)
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

## organization_members

```sql
id UUID PRIMARY KEY
organization_id UUID
user_id UUID
role_id UUID
status VARCHAR(30)
created_at TIMESTAMPTZ
UNIQUE(organization_id,user_id)
```

## files

```sql
id UUID PRIMARY KEY
organization_id UUID
owner_id UUID
storage_key TEXT
original_name TEXT
mime_type VARCHAR(255)
size_bytes BIGINT
sha256 CHAR(64)
page_count INTEGER
encrypted BOOLEAN
password_protected BOOLEAN
status VARCHAR(30)
created_at TIMESTAMPTZ
expires_at TIMESTAMPTZ
```

## documents

```sql
id UUID PRIMARY KEY
file_id UUID
document_type VARCHAR(50)
language VARCHAR(20)
ocr_status VARCHAR(30)
metadata JSONB
created_at TIMESTAMPTZ
```

## document_versions

```sql
id UUID PRIMARY KEY
document_id UUID
version INTEGER
storage_key TEXT
created_by UUID
created_at TIMESTAMPTZ
UNIQUE(document_id,version)
```

## jobs

```sql
id UUID PRIMARY KEY
organization_id UUID
user_id UUID
type VARCHAR(100)
status VARCHAR(30)
priority VARCHAR(30)
progress NUMERIC(5,2)
input JSONB
output JSONB
error_code VARCHAR(100)
error_message TEXT
created_at TIMESTAMPTZ
started_at TIMESTAMPTZ
completed_at TIMESTAMPTZ
expires_at TIMESTAMPTZ
```

## job_events

```sql
id UUID PRIMARY KEY
job_id UUID
event_type VARCHAR(100)
progress NUMERIC(5,2)
message TEXT
metadata JSONB
created_at TIMESTAMPTZ
```

---

# 14. EDITOR-SPECIFIC DATABASE MODEL

## editor_sessions

```sql
id UUID PRIMARY KEY
document_id UUID
user_id UUID
base_version INTEGER
status VARCHAR(30)
created_at TIMESTAMPTZ
last_activity_at TIMESTAMPTZ
```

## editor_commands

```sql
id UUID PRIMARY KEY
session_id UUID
sequence_number INTEGER
command_type VARCHAR(100)
payload JSONB
created_at TIMESTAMPTZ
```

## editor_objects

Optional persisted object model:

```sql
id UUID PRIMARY KEY
document_id UUID
page_number INTEGER
object_type VARCHAR(50)
object_key VARCHAR(255)
properties JSONB
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

---

# 15. FORM DATABASE

## form_fields

```sql
id UUID PRIMARY KEY
document_id UUID
page_number INTEGER
field_type VARCHAR(50)
field_name VARCHAR(255)
x NUMERIC
y NUMERIC
width NUMERIC
height NUMERIC
required BOOLEAN
default_value TEXT
properties JSONB
created_at TIMESTAMPTZ
```

---

# 16. SIGNATURE DATABASE

## signature_requests

```sql
id UUID PRIMARY KEY
organization_id UUID
document_id UUID
created_by UUID
status VARCHAR(30)
expires_at TIMESTAMPTZ
created_at TIMESTAMPTZ
completed_at TIMESTAMPTZ
```

## signers

```sql
id UUID PRIMARY KEY
request_id UUID
name VARCHAR(255)
email VARCHAR(320)
sign_order INTEGER
status VARCHAR(30)
authentication_method VARCHAR(50)
signed_at TIMESTAMPTZ
```

## signature_fields

```sql
id UUID PRIMARY KEY
signer_id UUID
page_number INTEGER
x NUMERIC
y NUMERIC
width NUMERIC
height NUMERIC
field_type VARCHAR(50)
value TEXT
```

---

# 17. BILLING / ENTITLEMENTS

## plans

```sql
id UUID PRIMARY KEY
code VARCHAR(50) UNIQUE
name VARCHAR(100)
status VARCHAR(30)
```

## entitlements

```sql
id UUID PRIMARY KEY
plan_id UUID
feature_code VARCHAR(100)
limit_type VARCHAR(50)
limit_value BIGINT
```

Examples:

```text
PDF_EDITOR_ENABLED
PDF_EDITOR_MAX_INPUT_FILES
PDF_EDITOR_MAX_PAGES
PDF_EDITOR_MAX_FILE_SIZE
OCR_ENABLED
OCR_MONTHLY_PAGES
AI_ENABLED
AI_MONTHLY_CREDITS
API_MONTHLY_REQUESTS
STORAGE_BYTES
WORKFLOW_RUNS
SIGNATURE_REQUESTS
```

---

# 18. USAGE

## usage_records

```sql
id UUID PRIMARY KEY
organization_id UUID
user_id UUID
feature_code VARCHAR(100)
quantity BIGINT
unit VARCHAR(50)
job_id UUID
created_at TIMESTAMPTZ
```

Usage must be calculated independently from UI.

---

# 19. SERVICE ARCHITECTURE

```text
                         CLIENTS
                            │
             ┌──────────────┼───────────────┐
             │              │               │
            Web           Mobile         Desktop
             │              │               │
             └──────────────┼───────────────┘
                            │
                       API Gateway
                            │
       ┌────────────────────┼────────────────────┐
       │                    │                    │
 Identity              File Service          Job Service
       │                    │                    │
 Organization          Object Storage       Scheduler
       │                                         │
 Billing                                      Kafka
       │                                         │
       └────────────────────┬────────────────────┘
                            │
              ┌─────────────┼──────────────┐
              │             │              │
          PDF Workers    OCR Workers    AI Workers
              │             │              │
          Conversion     Rendering      AI Gateway
              │             │              │
              └─────────────┼──────────────┘
                            │
                      Result Storage
                            │
                  Webhooks / Notifications
```

---

# 20. BOUNDED CONTEXTS

1. Identity
2. Organization
3. Billing
4. Files
5. Jobs
6. PDF Processing
7. Conversion
8. OCR
9. AI
10. Forms
11. Signature
12. Workflow
13. Integration
14. Notification
15. Audit

Avoid one microservice per button.

---

# 21. KAFKA TOPICS

```text
file.uploaded
file.validated
file.quarantined

job.created
job.started
job.progress
job.completed
job.failed
job.cancelled

document.version.created

workflow.started
workflow.node.started
workflow.node.completed
workflow.completed
workflow.failed

signature.created
signature.sent
signature.viewed
signature.signed
signature.completed

billing.usage.recorded

quota.exceeded

audit.created
```

---

# 22. EVENT ENVELOPE

```json
{
  "eventId":"uuid",
  "eventType":"job.completed",
  "version":1,
  "timestamp":"2026-09-15T10:00:00Z",
  "organizationId":"org_1",
  "actorId":"user_1",
  "resourceId":"job_1",
  "payload":{}
}
```

Events must be:

- immutable
- versioned
- idempotently consumable
- traceable

---

# 23. SERVICE-TO-SERVICE CONTRACT

## Job → Entitlement

```http
POST /internal/entitlements/check
```

```json
{
  "organizationId":"org_1",
  "feature":"PDF_EDITOR",
  "requestedUnits":3
}
```

Response:

```json
{
  "allowed":true,
  "limit":10,
  "used":2,
  "remaining":8
}
```

---

# 24. JOB WORKER CONTRACT

```json
{
  "jobId":"job_100",
  "operation":"PDF_EDITOR_SAVE",
  "inputFiles":["file_1"],
  "options":{},
  "traceId":"trace_1"
}
```

Worker result:

```json
{
  "jobId":"job_100",
  "status":"COMPLETED",
  "outputFiles":["file_2"],
  "metrics":{
    "durationMs":4250,
    "inputBytes":5000000,
    "outputBytes":5100000
  }
}
```

---

# 25. PROCESSING PIPELINE

```text
UPLOAD
  ↓
QUARANTINE
  ↓
MIME/MAGIC BYTE VALIDATION
  ↓
MALWARE SCAN
  ↓
PDF VALIDATION
  ↓
METADATA EXTRACTION
  ↓
OBJECT STORAGE
  ↓
JOB CREATION
  ↓
ENTITLEMENT CHECK
  ↓
QUEUE
  ↓
WORKER
  ↓
OUTPUT VALIDATION
  ↓
RESULT STORAGE
  ↓
EVENT
  ↓
DOWNLOAD/WEBHOOK
  ↓
RETENTION EXPIRY
```

---

# 26. SECURITY

Mandatory:

- TLS
- encryption at rest
- tenant isolation
- RBAC
- MFA
- SSO
- API scopes
- signed URLs
- malware scanning
- rate limiting
- audit logs
- secret management
- sandboxed processing

---

# 27. DANGEROUS DOCUMENT PROCESSING

Sandbox:

- Office rendering
- HTML rendering
- PDF JavaScript
- embedded attachments
- external resource loading

Controls:

- restricted network
- read-only filesystem
- CPU limits
- memory limits
- execution timeout
- seccomp/container isolation

---

# 28. HTML → PDF SECURITY

Prevent SSRF:

```text
URL
 ↓
Validate
 ↓
DNS resolve
 ↓
Reject private IP
 ↓
Validate redirects
 ↓
Restricted renderer
```

Block:

- localhost
- private IPs
- cloud metadata endpoints
- internal service addresses

---

# 29. REDACTION SECURITY

Whiteout is NOT redaction.

## Whiteout

Visually covers content.

## Secure Redaction

Permanently removes content.

Redaction validation must verify:

- text extraction cannot recover content
- search cannot recover content
- copy/paste cannot recover content
- hidden OCR text removed
- alternate content streams removed
- metadata handled according to policy

---

# 30. SEJDA EDITOR EDGE CASES TO IMPLEMENT

The editor must explicitly account for:

- missing embedded fonts
- unsupported font styles
- missing Unicode characters
- scanned PDF text editing limitations
- complex scripts
- RTL text
- rotated pages
- unsupported form fields
- XFA forms
- unsupported PDF features
- overlapping objects
- images partially hidden by other objects
- large/small text
- read-only form fields
- malformed form fields
- documents containing errors
- attachments
- camera signature permission
- unsupported embedded content

Where editing existing scan text is unavailable, the UI must explain that adding text/images/annotations may still be possible.

---

# 31. EDITOR ACCESSIBILITY

Support:

- keyboard navigation
- keyboard shortcuts
- screen-reader labels
- high contrast
- focus management
- accessible dialogs
- accessible tooltips
- reduced motion

---

# 32. EDITOR PERFORMANCE

Target:

- Virtualized thumbnails
- Lazy page rendering
- Progressive rendering
- Web workers
- Offscreen canvas where applicable
- Incremental object loading
- Debounced save
- Command batching

For large documents, do not render all pages simultaneously.

---

# 33. UNDO/REDO

Use command stack:

```text
Command
 ↓
Execute
 ↓
Undo Stack

Undo
 ↓
Redo Stack
```

New command after undo clears the redo branch unless collaborative history is later introduced.

---

# 34. DOCUMENT VERSIONING

Every saved editor result creates:

```text
Version 1
Version 2
Version 3
...
```

Original upload must remain immutable.

---

# 35. API IDEMPOTENCY

All file creation and job creation endpoints must accept:

```http
Idempotency-Key: UUID
```

Repeated requests with the same key return the original result.

---

# 36. WEBHOOK CONTRACT

```json
{
  "eventId":"evt_123",
  "eventType":"job.completed",
  "timestamp":"2026-09-15T10:00:00Z",
  "data":{
    "jobId":"job_1",
    "status":"COMPLETED",
    "resultUrl":"signed-url"
  }
}
```

Security:

```text
X-Signature
X-Timestamp
X-Event-ID
```

Use HMAC signing and replay protection.

---

# 37. RETENTION

Different document classes can have different policies.

```text
Temporary processing
→ short TTL

Authenticated history
→ subscription policy

Enterprise
→ organization policy

Signed documents
→ legal retention policy
```

Deletion must cover:

- object storage
- thumbnails
- OCR data
- extracted text
- AI caches
- indexes
- temporary files
- CDN objects where applicable

---

# 38. QA STRATEGY

## Unit

- Commands
- Entitlements
- Job transitions
- Validators
- Authorization

## Integration

- PostgreSQL
- Kafka
- Redis
- Object storage
- Worker
- Cloud providers

## E2E

Every tool must have:

```text
Upload
→ Process
→ Result
→ Download
```

## Security

- IDOR
- SSRF
- XSS
- malicious PDFs
- ZIP bombs
- path traversal
- tenant isolation
- privilege escalation
- API abuse

---

# 39. PDF TEST CORPUS

Maintain at least:

- native PDFs
- scanned PDFs
- password PDFs
- malformed PDFs
- large PDFs
- forms
- XFA forms
- invoices
- contracts
- tables
- multilingual PDFs
- CJK
- RTL
- Devanagari
- embedded fonts
- missing fonts
- annotations
- attachments
- JavaScript-containing PDFs
- rotated pages
- mixed page sizes

Every release runs regression processing against this corpus.

---

# 40. PERFORMANCE

Targets:

| Operation | Target |
|---|---|
| Metadata API | P95 < 500ms |
| Job creation | < 1 sec |
| Small PDF | < 10 sec target |
| Large PDF | Async |
| UI interaction | < 100ms target |
| Thumbnail | Progressive |
| Upload | Resumable |
| Download | Signed URL |

---

# 41. OBSERVABILITY

Metrics:

- API latency
- Job duration
- Queue latency
- Worker utilization
- Failure rate
- OCR latency
- Conversion latency
- AI latency
- Storage consumption
- API usage
- AI credit consumption

Tracing:

```text
requestId
traceId
jobId
workflowRunId
organizationId
```

---

# 42. JIRA EPICS

## EPIC-01 Identity

Stories:

- Signup
- Login
- OAuth
- MFA
- Password reset
- Sessions
- SSO

## EPIC-02 Organization

Stories:

- Create organization
- Invite member
- Roles
- Permissions
- Teams
- Branding

## EPIC-03 File Platform

Stories:

- Upload
- Multipart upload
- Cloud import
- Validation
- Malware scan
- Download
- Expiration

## EPIC-04 Job Platform

Stories:

- Job creation
- Queue
- Progress
- Retry
- Cancellation
- Idempotency
- Webhooks

## EPIC-05 PDF Organization

Stories:

- Merge
- Alternate
- Split
- Smart split
- Extract
- Delete
- Organize
- Rotate
- Copy
- Scan

## EPIC-06 PDF Editor

Stories:

- Viewer
- Text editing
- Text insertion
- Image insertion
- Links
- Shapes
- Annotation
- Whiteout
- Find/replace
- Forms
- Signature
- Attachments
- Page operations
- Undo/redo
- Versioning
- Multi-PDF editing

## EPIC-07 Conversion

Stories:

- Office → PDF
- PDF → Word
- PDF → Excel
- PDF → PPT
- PDF → JPG
- PDF → Text
- PDF → Markdown
- Image → PDF
- HTML → PDF
- PDF/A

## EPIC-08 Optimization

Stories:

- Compress
- Repair
- OCR
- Remove annotations
- Flatten

## EPIC-09 Security

Stories:

- Protect
- Unlock
- Redact
- Compare

## EPIC-10 Forms

Stories:

- Detect
- Create
- Fill
- Validate
- Flatten

## EPIC-11 Signature

Stories:

- Self sign
- Request
- Multiple signers
- Signing order
- Reminder
- Audit
- Evidence

## EPIC-12 AI

Stories:

- Summarize
- Translate
- Extract
- Smart Split
- Markdown
- Form detection
- Upscale
- Background removal

## EPIC-13 Workflow

Stories:

- Builder
- Nodes
- Conditions
- Execution
- Versioning
- Templates
- Schedule
- Webhooks

## EPIC-14 Integrations

Stories:

- Google Drive
- Dropbox
- OneDrive
- Zapier
- Make
- Power Automate
- n8n

## EPIC-15 Enterprise

Stories:

- SSO
- MFA policies
- Regional processing
- Retention
- Audit
- API administration
- Usage reporting

---

# 43. SAMPLE JIRA STORY

## PDF Editor — Edit Existing Text

**Story**

As a user, I want to select existing PDF text and edit it.

### Acceptance Criteria

1. User selects Text tool.
2. Existing editable text is selectable.
3. Text can be changed.
4. Font family can be changed where technically supported.
5. Font size can be changed.
6. Bold/italic can be changed where supported.
7. Color can be changed.
8. Position can be changed.
9. Undo restores previous value.
10. Redo reapplies change.
11. Unsupported fonts produce a clear warning.
12. Missing glyphs produce a clear warning.
13. Saved document contains the new text.
14. Original document remains unchanged.
15. Audit event is generated for authenticated users.

---

# 44. SAMPLE JIRA STORY

## PDF Editor — Add Image

Acceptance Criteria:

1. User selects Image.
2. User uploads supported image.
3. Image appears on selected page.
4. Image can be moved.
5. Image can be resized.
6. Image can be rotated.
7. Image can be deleted.
8. Image can be duplicated.
9. Undo/redo works.
10. Result renders correctly in PDF.

---

# 45. SAMPLE JIRA STORY

## PDF Editor — Find and Replace

Acceptance Criteria:

1. User enters search text.
2. All occurrences are detected.
3. Results display page numbers.
4. User can navigate occurrences.
5. User can replace one.
6. User can replace all.
7. Original formatting is preserved where possible.
8. Unsupported text returns a clear message.
9. Undo restores all replacements.

---

# 46. SAMPLE JIRA STORY

## PDF Editor — Multi-PDF Limit

Acceptance Criteria:

1. System reads `PDF_EDITOR_MAX_INPUT_FILES`.
2. User can select multiple PDFs.
3. If within limit, upload proceeds.
4. If over limit, upload is blocked.
5. Error includes current limit.
6. Upgrade option is displayed where applicable.
7. Backend independently validates the limit.
8. API cannot bypass the limit.
9. Enterprise configuration can override the limit.
10. Limit is not hard-coded in frontend.

---

# 47. SAMPLE JIRA STORY

## Secure Redaction

Acceptance Criteria:

1. User selects text/region.
2. Redaction preview displayed.
3. User confirms.
4. Original content removed.
5. OCR layer removed.
6. Hidden content removed.
7. Output is validated.
8. Search cannot find redacted text.
9. Copy cannot recover redacted text.
10. Audit event generated.

---

# 48. DEFINITION OF DONE

No feature is considered complete unless it includes:

- UI
- UX states
- API
- validation
- authorization
- entitlement
- persistence
- job processing
- queue integration
- worker
- progress
- retry
- cancellation where applicable
- error codes
- audit
- metrics
- security tests
- unit tests
- integration tests
- E2E tests
- documentation
- OpenAPI definition

---

# 49. FINAL ARCHITECTURE

```text
                         PDF PLATFORM

                             USER
                              │
                ┌─────────────┼─────────────┐
                │             │             │
               WEB          MOBILE       DESKTOP
                │             │             │
                └─────────────┼─────────────┘
                              │
                         API GATEWAY
                              │
       ┌──────────────────────┼─────────────────────┐
       │                      │                     │
   IDENTITY                FILES                  JOBS
       │                      │                     │
 ORGANIZATION            STORAGE               SCHEDULER
       │                                            │
   BILLING                                         KAFKA
       │                                            │
       └──────────────────────┬─────────────────────┘
                              │
              ┌───────────────┼────────────────┐
              │               │                │
          PDF ENGINE       OCR ENGINE       AI ENGINE
              │               │                │
          CONVERSION       RENDERING       AI GATEWAY
              │               │                │
              └───────────────┼────────────────┘
                              │
                       RESULT STORAGE
                              │
                    ┌─────────┴──────────┐
                    │                    │
                WEBHOOKS             WORKFLOWS
                    │                    │
                    └─────────┬──────────┘
                              │
                         SIGNATURES
                              │
                           AUDIT
```

---

# 50. Product-Level Design Rule

The system must never think:

> "We are building a Merge PDF page."

It must think:

> "We are building a document operation that happens to have a Merge UI."

Therefore:

```text
UI
 ↓
API
 ↓
Job
 ↓
Operation
 ↓
Engine
 ↓
Result
```

must remain the canonical architecture.

This allows the same operation to be invoked from:

- Web
- Mobile
- Desktop
- REST API
- Workflow
- Zapier
- Make
- Power Automate
- n8n
- Enterprise systems

without duplicating document-processing logic.

---

# 51. Source Capability Notes

The Sejda-derived editor scope specifically includes existing-text editing, text insertion, image insertion and manipulation, links and hyperlink editing, form filling/creation, annotations, whiteout, shapes, find-and-replace, signatures, page insertion/deletion/rotation, attachments and related editor behavior. Sejda's public documentation also describes offline Desktop editing and notes limitations around scanned-document text editing, unsupported fonts/scripts, XFA and other unsupported PDF features. These behaviors are incorporated above as explicit requirements/edge cases rather than silently assuming every PDF is fully editable.

The current Sejda editor also distinguishes whiteout from true redaction: whiteout hides content but does not securely remove the underlying text/images. The platform therefore keeps **Whiteout** and **Secure Redaction** as separate operations.

---

# 52. Implementation Starting Point

The first implementation sprint should **not** start with all 50+ tools.

Build the platform kernel first:

```text
1. Identity
2. Organization/RBAC
3. Entitlements
4. File Service
5. Object Storage
6. Job Service
7. Kafka
8. Worker Runtime
9. PDF Engine abstraction
10. Viewer
11. Common Upload UI
12. Common Processing UI
13. Common Result UI
```

Then implement:

```text
Merge
Split
Compress
Rotate
Organize
PDF Editor
```

The Sejda-style editor should be treated as a major product module rather than a simple "Edit PDF" button because it has its own document model, command model, versioning, page operations, object manipulation, forms, annotations, links, signatures and multi-file entitlement rules.

