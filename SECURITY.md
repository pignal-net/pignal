# Security Policy

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Use GitHub's private vulnerability reporting:

**[Report a vulnerability](https://github.com/pignal-net/pignal/security/advisories/new)**

## Supported Versions

Only the latest release is supported with security updates.

## Scope

### In scope

- Authentication bypass (token auth, session cookies)
- Token or secret leakage
- Injection vulnerabilities (SQL injection, XSS, command injection)
- Server-side request forgery (SSRF)
- Authorization flaws (permission bypass)

### Out of scope

- Self-hosted misconfiguration (weak tokens, open endpoints)
- Denial of service on personal instances
- Issues in dependencies (report upstream)
- Social engineering

## Response

We aim to acknowledge reports within 48 hours and provide a fix timeline within 7 days.
