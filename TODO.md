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
  - [ ] `POST /api/aliases` - Create new alias
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
  // New: generateAlias(domain) -> site-random@datavlt.io
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

## 📝 Notes

- Consider using Cloudflare Email Routing for MVP (free tier available)
- Start with simple JWT auth, add OAuth later
- Keep subaddress mode as fallback during transition
- Monitor costs closely as usage scales
- Consider open-sourcing non-sensitive parts