# Security Policy

## Reporting Security Vulnerabilities

If you discover a security vulnerability in this project, please report it by emailing the maintainers directly. **Do not** create a public GitHub issue for security vulnerabilities.

## Secure Configuration Guidelines

### Environment Variables

**NEVER** commit the following files to version control:
- `.env` files
- `config.yaml` with real credentials
- Any files containing API keys, tokens, or passwords

### Required Security Measures

1. **API Keys & Tokens**
   - Store all secrets in environment variables
   - Use `.env.example` as a template (no real values)
   - Rotate API keys regularly
   - Use separate keys for development and production

2. **Database Security**
   - Use strong passwords (minimum 12 characters, mixed case, numbers, symbols)
   - Change default SQL Server password immediately
   - Enable SSL/TLS for database connections in production
   - Implement IP whitelisting for database access
   - Regular database backups with encryption

3. **Authentication**
   - Use strong `NEXTAUTH_SECRET` (generate with `openssl rand -base64 32`)
   - Implement rate limiting on authentication endpoints
   - Enable 2FA for admin accounts (recommended)
   - Regularly review user access permissions

4. **Production Deployment**
   - Use HTTPS only (no HTTP)
   - Enable CORS only for trusted domains
   - Implement API rate limiting
   - Use environment-specific configurations
   - Enable application logging and monitoring
   - Regular security audits

### Secure Development Practices

1. **Before Committing Code**
   ```bash
   # Check for accidentally staged secrets
   git diff --cached
   
   # Use git-secrets or similar tools
   git secrets --scan
   ```

2. **Code Review Checklist**
   - [ ] No hardcoded credentials
   - [ ] All secrets use environment variables
   - [ ] Sensitive files in `.gitignore`
   - [ ] Updated `.env.example` if new vars added
   - [ ] No sensitive data in logs

3. **Dependency Security**
   ```bash
   # Check for known vulnerabilities (Python)
   pip install safety
   safety check
   
   # Check for known vulnerabilities (Node.js)
   npm audit
   npm audit fix
   ```

### Google Ads API Security

- Keep Developer Token confidential
- OAuth refresh tokens should be encrypted at rest
- Regularly rotate OAuth tokens
- Use service accounts for production
- Implement proper scoping for API access
- Monitor API usage for anomalies

### File Permissions

Ensure sensitive files have restricted permissions:

```bash
# Linux/Mac
chmod 600 .env
chmod 600 config.yaml

# Windows PowerShell
icacls .env /inheritance:r /grant:r "$($env:USERNAME):(R,W)"
```

### Environment Separation

Maintain separate configurations for:
- **Development**: Local testing with test data
- **Staging**: Pre-production environment
- **Production**: Live environment with real data

Never use production credentials in development.

## Security Checklist for Deployment

### Pre-Deployment
- [ ] All secrets moved to environment variables
- [ ] Strong passwords for all services
- [ ] HTTPS enabled
- [ ] CORS configured for production domains only
- [ ] Rate limiting enabled
- [ ] Database backup strategy implemented
- [ ] Monitoring and alerting configured
- [ ] Security headers configured
- [ ] SQL injection prevention verified
- [ ] XSS protection enabled

### Post-Deployment
- [ ] Regular security updates applied
- [ ] Log monitoring active
- [ ] Backup restoration tested
- [ ] Incident response plan ready
- [ ] Regular security audits scheduled

## Known Security Considerations

1. **SQL Server Default Password**: The default Docker Compose password (`YourStrong@Passw0rd`) should be changed immediately in production.

2. **Admin Email Hardcoding**: Admin emails are configured via environment variables. Ensure `ADMIN_EMAILS` is properly set.

3. **API Rate Limiting**: Consider implementing rate limiting for production to prevent abuse.

4. **Cache Sensitivity**: Simulation cache may contain business-sensitive data. Secure the cache directory appropriately.

## Security Updates

This project uses the following security-conscious dependencies:

### Backend (Python)
- FastAPI with Pydantic for request validation
- SQLAlchemy with parameterized queries
- PyODBC for secure database connections
- Google Ads API SDK (official)

### Frontend (Next.js)
- NextAuth.js for authentication
- Built-in CSRF protection
- XSS protection via React
- Secure cookie handling

## Contact

For security concerns, contact the project maintainers directly.

---

**Remember**: Security is everyone's responsibility. Always follow secure coding practices and report any concerns immediately.

