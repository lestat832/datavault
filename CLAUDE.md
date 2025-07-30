# DataVault Architecture Decisions

This document captures key architectural decisions and implementation details for the DataVault project.

## Alias Format Specification

### Decision: 8 Characters Alphanumeric

**Format**: `[a-z0-9]{8}@datavlt.io`

**Examples**:
- `a7b3x9k2@datavlt.io`
- `p4n7m2x8@datavlt.io`
- `k9s3w6r1@datavlt.io`

### Technical Details

**Character Set**: 
- Lowercase letters: a-z (26 characters)
- Numbers: 0-9 (10 characters)
- Total: 36 possible characters per position

**Entropy**: 36^8 = 2,821,109,907,456 (2.8 trillion) possible combinations

### Rationale

1. **Security**: 2.8 trillion combinations provides excellent collision resistance
   - At 100M users with 100 aliases each = 10B aliases
   - Collision probability remains negligible

2. **Usability**: 8 characters is optimal for:
   - Easy display in UI elements
   - Fits well in email fields
   - Manageable for manual entry if needed

3. **Aesthetics**: 
   - Mixed alphanumeric looks professional
   - Avoids "spammy" appearance of pure numbers
   - No uppercase to avoid confusion (I/l/1, O/0)

4. **Performance**:
   - Shorter strings = faster database lookups
   - Efficient indexing and storage

### Implementation

```javascript
// Secure alias generation
function generateAlias() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const crypto = window.crypto || window.msCrypto;
  const array = new Uint8Array(8);
  crypto.getRandomValues(array);
  
  let alias = '';
  for (let i = 0; i < 8; i++) {
    alias += chars[array[i] % chars.length];
  }
  return alias;
}
```

### Validation Rules

1. **Collision Check**: Always verify uniqueness before assignment
2. **Blacklist**: Maintain list of inappropriate word combinations
3. **Pattern Detection**: Reject sequential patterns (e.g., "abcd1234", "aaaa1111")
4. **Reserved Aliases**: Keep system aliases (e.g., "admin", "support", "noreply")

### Database Considerations

```sql
-- Alias storage with optimized indexing
CREATE TABLE aliases (
  alias VARCHAR(8) PRIMARY KEY,
  user_id UUID NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  email_count INTEGER DEFAULT 0,
  last_used TIMESTAMP
);

CREATE INDEX idx_user_aliases ON aliases(user_id);
CREATE INDEX idx_active_aliases ON aliases(is_active);
```

### Future Migration Path

If alias format needs to change:
1. New aliases use new format
2. Old aliases continue working
3. Add `format_version` column to track
4. Gradual migration tools for users

## Domain Choice: datavlt.io

- Short and memorable
- "vault" conveys security/privacy
- .io domain is tech-friendly
- 9 characters total for full domain

## Privacy Philosophy

- No tracking of email content
- Minimal metadata collection
- User can delete all data anytime
- Aliases are completely random (no user info embedded)
- No correlation between aliases possible

## Technical Stack Decisions

### Email Infrastructure
- **MVP**: Cloudflare Email Routing (free tier)
- **Scale**: AWS SES with Lambda processing
- **Alternative**: SendGrid Inbound Parse

### Backend API
- **Language**: Node.js (JavaScript consistency with extension)
- **Framework**: Express.js (simple, well-documented)
- **Database**: PostgreSQL (ACID compliance, JSON support)
- **Auth**: JWT tokens (stateless, scalable)

### Extension Architecture
- **Manifest**: V3 (required by Chrome)
- **Storage**: Chrome Storage API with sync to backend
- **Communication**: REST API with fetch()
- **Offline**: Queue changes locally, sync when online

## Security Principles

1. **Defense in Depth**: Multiple security layers
2. **Fail Secure**: Errors should fail closed, not open
3. **Least Privilege**: Minimal permissions requested
4. **Zero Trust**: Verify everything, trust nothing
5. **Privacy by Design**: Collect minimal data

## Development Workflow

1. Feature branches off main
2. Test locally with mock email server
3. Stage on subdomain (beta.datavlt.io)
4. Progressive rollout to users
5. Monitor error rates closely

---

Last Updated: 2025-01-30