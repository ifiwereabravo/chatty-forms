# CHATTY Forms — Feature Tracker

## Core Form Builder
- [x] Drag-and-drop field palette (text, email, phone, textarea, select, checkbox, radio, number, date, url, hidden, file)
- [x] Visual canvas with live preview
- [x] Field properties panel (label, placeholder, required, options)
- [x] Form settings (title, submit button text, success message, email notifications)
- [x] Form save / update via REST API
- [x] Dashboard with form list
- [x] Clickable rows to open forms
- [x] Inline delete confirmation

## Frontend Rendering
- [x] `[chatty_form id="X"]` shortcode
- [x] Styled form output with validation
- [x] AJAX form submission
- [x] Success/error toast messages

## Submissions
- [x] Database storage (`chatty_form_submissions` table)
- [x] Admin submissions page
- [x] REST API submission handler

## Builder Integrations
- [x] Gutenberg block — form picker dropdown in block inserter
- [x] Divi Builder module — form selector in Divi module picker
- [ ] Elementor widget
- [ ] WPBakery shortcode element

## Advanced Form Features
- [ ] Multi-step / multi-page forms
- [ ] Conditional logic (show/hide fields based on answers)
- [ ] File upload field with drag-and-drop
- [ ] CAPTCHA / honeypot spam protection
- [x] Form templates (Contact Us, Request a Quote, Feedback, etc.)
- [x] Form duplication
- [ ] Field validation rules (min/max length, regex patterns)
- [ ] Custom CSS per form
- [ ] Form scheduling (start/end date)

## Content Gating & Lead Gen
- [ ] Social share gate — require share before content access
- [ ] Download gate — deliver file after form submission
- [ ] OAuth social login (Google, Facebook) for one-click form fill
- [ ] Progressive profiling — remember returning visitors

## Notifications & Integrations
- [ ] Email notifications to admin on submission
- [ ] Auto-responder email to submitter
- [ ] Webhook / Zapier integration
- [ ] Slack notification on submission
- [ ] Mailchimp / newsletter integration
- [ ] CRM integration (HubSpot, Salesforce)
- [ ] Google Sheets export

## Analytics & Reporting
- [ ] Submission analytics dashboard (submissions over time)
- [ ] Form conversion rate tracking
- [ ] Field-level drop-off analysis
- [x] CSV/Excel export of submissions
- [x] JSON export/import of form sets

## Visitor Intelligence
- [x] Visitor identity enrichment via `VisitorIdentity` class (chatty-core)
- [ ] Lead scoring based on form engagement
- [ ] UTM parameter capture on submissions
- [ ] Geo-location tagging

## Admin UX
- [x] Dark theme matching CHATTY design system
- [x] Branded sidebar menu icon (Concierge emblem, 20×20px)
- [ ] Form preview mode (view without saving)
- [ ] Undo/redo in editor
- [ ] Keyboard shortcuts
- [ ] Bulk actions on form list (delete, duplicate, export)

## Performance & Security
- [ ] Rate limiting on submissions
- [ ] GDPR compliance (consent checkbox, data export/delete)
- [ ] Input sanitization audit
- [ ] Lazy loading of admin assets
