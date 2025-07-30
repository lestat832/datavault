# DataVault Domain Migration TODO

Transitioning from email subaddresses to custom domain (datavlt.io)

## 📋 Overview
- **Current**: `user+site-random@gmail.com` (subaddressing)
- **Target**: `site-random@datavlt.io` (custom domain with forwarding)
- **Timeline**: 6-8 weeks for full implementation
- **MVP Target**: 2-3 weeks

---

## 🚀 Phase 1: Infrastructure Setup (Week 1-2)

### Email Server Infrastructure
- [ ] **P0** Choose email infrastructure provider
  - [ ] Option A: AWS SES + Lambda for forwarding
  - [ ] Option B: SendGrid Inbound Parse
  - [ ] Option C: Self-hosted Postfix/Dovecot
  - [ ] Option D: Cloudflare Email Routing (simplest for MVP)
- [ ] **P0** Configure datavlt.io DNS records
  - [ ] MX records for email receiving
  - [ ] SPF record for sender authentication
  - [ ] DKIM setup for email signing
  - [ ] DMARC policy
- [ ] **P0** Set up catch-all email configuration
- [ ] **P0** Test email forwarding pipeline
- [ ] **P1** Set up email bounce handling
- [ ] **P1** Configure rate limiting for incoming emails

### Database Infrastructure
- [ ] **P0** Choose database solution (PostgreSQL recommended)
- [ ] **P0** Design schema for alias mappings
  ```sql
  - aliases table (id, alias, user_email, domain, created_at, last_used)
  - users table (id, email, verified, created_at)
  - activity_log table (id, alias_id, action, timestamp)
  ```
- [ ] **P0** Set up database hosting (AWS RDS, Supabase, etc.)
- [ ] **P1** Implement database backups
- [ ] **P2** Set up read replicas for scaling

---

## 🔧 Phase 2: API Development (Week 2-3)

### Core API
- [ ] **P0** Set up API framework (Node.js/Express or Python/FastAPI)
- [ ] **P0** Implement authentication system
  - [ ] JWT token generation
  - [ ] API key management
  - [ ] Rate limiting per user
- [ ] **P0** Create core endpoints:
  - [ ] `POST /api/auth/register` - User registration
  - [ ] `POST /api/auth/login` - User login
  - [ ] `POST /api/auth/verify-email` - Email verification
  - [ ] `POST /api/aliases` - Create new alias (fully random format)
  - [ ] `GET /api/aliases` - List user's aliases
  - [ ] `DELETE /api/aliases/:id` - Delete alias
  - [ ] `GET /api/aliases/check/:alias` - Check if alias exists
- [ ] **P1** Implement webhook endpoint for email forwarding service
- [ ] **P1** Add logging and monitoring
- [ ] **P2** Implement alias analytics endpoints

### Email Processing
- [ ] **P0** Create email forwarding handler
  - [ ] Parse incoming emails
  - [ ] Look up target email from alias
  - [ ] Forward email with proper headers
  - [ ] Handle attachments
- [ ] **P1** Implement reply functionality
  - [ ] Parse replies from user's email
  - [ ] Rewrite sender to use alias
  - [ ] Maintain conversation threading
- [ ] **P2** Add spam filtering
- [ ] **P2** Implement email activity logging

### Reply Handling (Privacy-Focused)
- [ ] **P0** Design two-way email routing system
  - [ ] Store original sender information securely
  - [ ] Generate unique reply-to addresses per conversation
  - [ ] Map reply addresses back to original senders
- [ ] **P0** Implement outbound email processing
  - [ ] Receive replies at special reply addresses
  - [ ] Strip user's real email from headers
  - [ ] Rewrite From address to use alias
  - [ ] Forward to original sender
- [ ] **P1** Maintain conversation threading
  - [ ] Preserve Message-ID headers
  - [ ] Handle In-Reply-To headers
  - [ ] Keep References header chain
- [ ] **P1** Handle edge cases
  - [ ] Bounced replies
  - [ ] Invalid reply addresses
  - [ ] Rate limiting for replies
- [ ] **P2** Reply analytics
  - [ ] Track reply usage per alias
  - [ ] Monitor conversation threads

---

## 🎨 Phase 3: Extension Modifications (Week 3-4)

### Backend Integration
- [ ] **P0** Add API client to background.js
  - [ ] Authentication flow
  - [ ] API call wrappers
  - [ ] Error handling
  - [ ] Offline queue for sync
- [ ] **P0** Update alias generation logic
  ```javascript
  // Old: generateAlias(domain) -> user+site-random@gmail.com
  // New: generateAlias() -> 12341412341234@datavlt.io (fully random)
  ```
- [ ] **P0** Modify storage structure
  - [ ] Add `authToken` field
  - [ ] Add `accountEmail` field
  - [ ] Add `syncEnabled` toggle
  - [ ] Keep local cache of aliases

### User Interface Updates
- [ ] **P0** Add login/signup flow
  - [ ] New welcome screen for first-time users
  - [ ] Login form in options page
  - [ ] Email verification flow
- [ ] **P1** Update popup UI
  - [ ] Show sync status
  - [ ] Add account info section
  - [ ] Quick toggle between local/cloud mode
- [ ] **P1** Update options page
  - [ ] Account management section
  - [ ] Sync settings
  - [ ] Import/export options
- [ ] **P2** Add onboarding tutorial

### Backward Compatibility
- [ ] **P0** Maintain dual-mode operation
  - [ ] Toggle: "Use DataVault Domain" vs "Use Subaddresses"
  - [ ] Graceful fallback if API is down
  - [ ] Clear mode indicators in UI
- [ ] **P1** Migration assistant for existing aliases
  - [ ] Export current aliases
  - [ ] Bulk import to new system
  - [ ] Verification step

---

## 🎛️ Management Features (Week 3-4)

### Alias Management
- [ ] **P0** Implement alias enable/disable functionality
  - [ ] API endpoint for toggling alias status
  - [ ] UI toggle in extension and web dashboard
  - [ ] Stop forwarding for disabled aliases
- [ ] **P0** Track alias-to-site associations
  - [ ] Store domain where alias was created
  - [ ] Display site info in management UI
  - [ ] Search aliases by site
- [ ] **P1** Bulk operations
  - [ ] Select multiple aliases
  - [ ] Bulk enable/disable
  - [ ] Bulk delete with confirmation
  - [ ] Export selected aliases
- [ ] **P1** Advanced filtering and search
  - [ ] Filter by creation date
  - [ ] Filter by usage frequency
  - [ ] Filter by enabled/disabled status
  - [ ] Full-text search across aliases

### Usage Analytics
- [ ] **P0** Basic usage statistics
  - [ ] Emails received per alias
  - [ ] Last activity timestamp
  - [ ] Creation date tracking
- [ ] **P1** Detailed analytics dashboard
  - [ ] Daily/weekly/monthly email volume
  - [ ] Most active aliases
  - [ ] Spam detection rates
  - [ ] Reply activity per alias
- [ ] **P2** Privacy-focused insights
  - [ ] Which sites send most emails
  - [ ] Email frequency patterns
  - [ ] Identify potentially compromised aliases

### Spam and Security Management
- [ ] **P0** Quick-delete aliases to block spam
  - [ ] One-click delete from extension
  - [ ] Immediate effect (stop forwarding)
  - [ ] Optional "burn notice" to sender
- [ ] **P1** Spam reporting
  - [ ] Mark emails as spam
  - [ ] Auto-disable aliases with high spam
  - [ ] Shared spam intelligence (opt-in)
- [ ] **P2** Security features
  - [ ] Detect aliases used on multiple sites
  - [ ] Alert on suspicious activity
  - [ ] Alias rotation recommendations

---

## 👥 Phase 4: User Migration (Week 4-5)

### Beta Testing
- [ ] **P0** Set up beta testing group
- [ ] **P0** Create feedback collection system
- [ ] **P0** Monitor error rates and performance
- [ ] **P1** Implement A/B testing for features

### Documentation
- [ ] **P0** Update README with new setup instructions
- [ ] **P0** Create user migration guide
- [ ] **P0** Write API documentation
- [ ] **P1** Create video tutorials
- [ ] **P1** Set up help center/FAQ

### Launch Preparation
- [ ] **P0** Set up status page for service monitoring
- [ ] **P0** Create privacy policy for email handling
- [ ] **P0** Prepare terms of service
- [ ] **P1** Set up customer support system
- [ ] **P2** Create marketing website

---

## 🔒 Phase 5: Security & Compliance (Ongoing)

### Security Measures
- [ ] **P0** Implement HTTPS everywhere
- [ ] **P0** Set up API rate limiting
- [ ] **P0** Add input validation on all endpoints
- [ ] **P0** Implement CSRF protection
- [ ] **P1** Set up security monitoring (failed logins, etc.)
- [ ] **P1** Regular security audits
- [ ] **P2** Implement 2FA for user accounts

### Privacy & Compliance
- [ ] **P0** GDPR compliance
  - [ ] Data processing agreement
  - [ ] Right to deletion implementation
  - [ ] Data export functionality
- [ ] **P1** CCPA compliance
- [ ] **P1** Email retention policies
- [ ] **P2** SOC 2 preparation

---

## 📊 Phase 6: Monitoring & Scaling (Week 5-6)

### Monitoring
- [ ] **P0** Set up application monitoring (Datadog/New Relic)
- [ ] **P0** Email delivery monitoring
- [ ] **P0** API performance tracking
- [ ] **P1** User analytics (privacy-respectful)
- [ ] **P1** Cost monitoring and alerts

### Scaling Preparation
- [ ] **P1** Load testing
- [ ] **P1** Implement caching layer (Redis)
- [ ] **P1** Set up CDN for static assets
- [ ] **P2** Prepare horizontal scaling plan
- [ ] **P2** Implement queue system for email processing

---

## 💰 Cost Estimates

### Monthly Costs (MVP)
- Email infrastructure: $50-100
- API hosting: $20-50
- Database: $20-40
- Monitoring: $0-50
- **Total**: ~$90-240/month

### One-time Costs
- Domain (datavlt.io): Already purchased ✅
- SSL certificates: Free (Let's Encrypt)
- Development time: 6-8 weeks

---

## 🎯 MVP Checklist (2-3 weeks)

### Week 1
- [ ] Email forwarding working end-to-end
- [ ] Basic API with authentication
- [ ] Database schema implemented

### Week 2
- [ ] Extension modified to use API
- [ ] User registration/login flow
- [ ] Basic alias management working

### Week 3
- [ ] Beta testing with small group
- [ ] Bug fixes and improvements
- [ ] Documentation complete

---

## ⚠️ Edge Cases & Error Handling

### User Account Edge Cases
- [ ] **P0** Handle target email changes
  - [ ] Update all alias mappings
  - [ ] Verify new email ownership
  - [ ] Queue pending emails during transition
  - [ ] Notify user of change impact
- [ ] **P0** Multiple users with same target email
  - [ ] Ensure alias uniqueness across system
  - [ ] Separate user accounts properly
  - [ ] Handle email verification conflicts
- [ ] **P1** Account deletion flow
  - [ ] What happens to active aliases?
  - [ ] Data retention policy
  - [ ] Grace period for recovery

### Email Delivery Edge Cases
- [ ] **P0** Bounce handling
  - [ ] Detect invalid target emails
  - [ ] Notify user of delivery failures
  - [ ] Automatic retry logic
  - [ ] Disable aliases after X bounces
- [ ] **P0** Email size limits
  - [ ] Handle large attachments
  - [ ] Implement size restrictions
  - [ ] User notifications for rejected emails
- [ ] **P1** Service downtime handling
  - [ ] Queue emails during outages
  - [ ] Implement fallback systems
  - [ ] Status page for users

### Alias Generation Edge Cases
- [ ] **P0** Alias collision handling
  - [ ] Ensure true randomness
  - [ ] Collision detection and retry
  - [ ] Consider increasing alias length
- [ ] **P1** Rate limiting per user
  - [ ] Prevent alias exhaustion attacks
  - [ ] Fair usage policies
  - [ ] User notifications for limits

### Security Edge Cases
- [ ] **P0** Compromised alias detection
  - [ ] Unusual activity patterns
  - [ ] Sudden spike in emails
  - [ ] Geographic anomalies
- [ ] **P1** Email spoofing prevention
  - [ ] Strict SPF/DKIM validation
  - [ ] Reject suspicious senders
  - [ ] User alerts for security issues

---

## 📝 Notes

- Consider using Cloudflare Email Routing for MVP (free tier available)
- Start with simple JWT auth, add OAuth later
- Keep subaddress mode as fallback during transition
- Monitor costs closely as usage scales
- Consider open-sourcing non-sensitive parts