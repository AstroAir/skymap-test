# Skymap Application Security Attack Trees

**Generated:** 2025-12-26
**Based on:** Security Vulnerability Report (llmdoc/agent/security-vulnerability-report.md)

## Executive Summary

This document presents attack tree analysis for the Skymap React + Tauri starmap application.
Attack trees systematically map attacker goals to the paths they can take to achieve them.

**Critical Findings:**
- **4 major attack scenarios** identified
- **19 unique attack paths** documented
- **Most paths are TRIVIAL to LOW difficulty** due to missing security controls
- **Highest risk:** Complete system compromise via unrestricted Tauri command access

## Attack Scenarios

## Complete System Compromise

Severity: CRITICAL

```mermaid
flowchart TD
    N0(('Complete System Compromise')
    N1(('Compromise Frontend')
    N0 --> N1
    style N2 fill:#d3f9d8,stroke:#51cf66,stroke-width:3px
    N2['XSS via innerHTML']
    N1 --> N2
    style N3 fill:#d3f9d8,stroke:#51cf66,stroke-width:3px
    N3['Supply Chain Compromise']
    N1 --> N3
    N4['Direct Backend Access']
    N0 ==> N4
    style N5 fill:#d3f9d8,stroke:#51cf66,stroke-width:3px
    N5['Exploit No Authentication']
    N4 --> N5
    style N6 fill:#d3f9d8,stroke:#51cf66,stroke-width:3px
    N6['Invoke Sensitive Commands']
    N4 --> N6
    N7(('Path Traversal Attack')
    N0 --> N7
    style N8 fill:#d3f9d8,stroke:#51cf66,stroke-width:3px
    N8['Path Traversal via open_path']
    N7 --> N8
    style N9 fill:#d3f9d8,stroke:#51cf66,stroke-width:3px
    N9['Path Traversal via import/export']
    N7 --> N9

    classDef trivial fill:#ff6b6b,stroke:#c92a2a,stroke-width:3px
    classDef low fill:#ffa06b,stroke:#e67700,stroke-width:2px
    classDef medium fill:#ffd93d,stroke:#fab005,stroke-width:2px
    classDef high fill:#6bcb77,stroke:#2f9e44,stroke-width:2px
    classDef expert fill:#4d96ff,stroke:#1971c2,stroke-width:2px
```
## Data Exfiltration

Severity: CRITICAL

```mermaid
flowchart TD
    N0(('Data Exfiltration')
    N1['Read Files Directly']
    N0 ==> N1
    style N2 fill:#ff6b6b,stroke:#c92a2a,stroke-width:3px
    N2['Find App Data Directory']
    N1 --> N2
    style N3 fill:#d3f9d8,stroke:#51cf66,stroke-width:3px
    N3['Read JSON Files']
    N1 --> N3
    N4['Extract from localStorage']
    N0 ==> N4
    style N5 fill:#d3f9d8,stroke:#51cf66,stroke-width:3px
    N5['Execute XSS or DevTools']
    N4 --> N5
    style N6 fill:#d3f9d8,stroke:#51cf66,stroke-width:3px
    N6['Read localStorage']
    N4 --> N6
    N7['SSRF to Internal Services']
    N0 ==> N7
    style N8 fill:#d3f9d8,stroke:#51cf66,stroke-width:3px
    N8['Inject Internal URLs']
    N7 --> N8
    style N9 fill:#d3f9d8,stroke:#51cf66,stroke-width:3px
    N9['Exfiltrate Responses']
    N7 --> N9

    classDef trivial fill:#ff6b6b,stroke:#c92a2a,stroke-width:3px
    classDef low fill:#ffa06b,stroke:#e67700,stroke-width:2px
    classDef medium fill:#ffd93d,stroke:#fab005,stroke-width:2px
    classDef high fill:#6bcb77,stroke:#2f9e44,stroke-width:2px
    classDef expert fill:#4d96ff,stroke:#1971c2,stroke-width:2px
```
## Denial of Service

Severity: HIGH

```mermaid
flowchart TD
    N0(('Denial of Service')
    N1(('Resource Exhaustion')
    N0 --> N1
    style N2 fill:#d3f9d8,stroke:#51cf66,stroke-width:3px
    N2['Oversized JSON Deserialization']
    N1 --> N2
    style N3 fill:#d3f9d8,stroke:#51cf66,stroke-width:3px
    N3['Cache Flooding']
    N1 --> N3
    style N4 fill:#d3f9d8,stroke:#51cf66,stroke-width:3px
    N4['Massive CSV Import']
    N1 --> N4
    style N5 fill:#d3f9d8,stroke:#51cf66,stroke-width:3px
    N5['API Abuse']
    N0 --> N5

    classDef trivial fill:#ff6b6b,stroke:#c92a2a,stroke-width:3px
    classDef low fill:#ffa06b,stroke:#e67700,stroke-width:2px
    classDef medium fill:#ffd93d,stroke:#fab005,stroke-width:2px
    classDef high fill:#6bcb77,stroke:#2f9e44,stroke-width:2px
    classDef expert fill:#4d96ff,stroke:#1971c2,stroke-width:2px
```
## Internal Network Reconnaissance

Severity: HIGH

```mermaid
flowchart TD
    N0(('Internal Network Reconnaissance')
    N1['SSRF via URL Injection']
    N0 ==> N1
    style N2 fill:#d3f9d8,stroke:#51cf66,stroke-width:3px
    N2['Enumerate Internal IPs']
    N1 --> N2
    style N3 fill:#d3f9d8,stroke:#51cf66,stroke-width:3px
    N3['Port Scan via URLs']
    N1 --> N3
    style N4 fill:#d3f9d8,stroke:#51cf66,stroke-width:3px
    N4['Access Cloud Metadata']
    N1 --> N4

    classDef trivial fill:#ff6b6b,stroke:#c92a2a,stroke-width:3px
    classDef low fill:#ffa06b,stroke:#e67700,stroke-width:2px
    classDef medium fill:#ffd93d,stroke:#fab005,stroke-width:2px
    classDef high fill:#6bcb77,stroke:#2f9e44,stroke-width:2px
    classDef expert fill:#4d96ff,stroke:#1971c2,stroke-width:2px
```

## Detailed Analysis

### 1. Complete System Compromise (CRITICAL)

**Easiest Path:** Exploit No Authentication → Invoke Sensitive Commands
- **Difficulty:** TRIVIAL
- **Cost:** FREE
- **Detection Risk:** NONE to LOW
- **Time:** ~1.5 hours

**Impact:** Full filesystem access, remote code execution, complete system control

**Root Causes:**
- All 120+ Tauri commands exposed without permission checks
- Path traversal vulnerabilities in file operations
- No authentication or authorization layer

**Recommended Mitigations:**
1. Implement authentication/authorization layer
2. Add permission checks to all Tauri commands
3. Validate and sanitize all file paths
4. Restrict command surface area
5. Implement sandboxing for sensitive operations

### 2. Data Exfiltration (CRITICAL)

**Easiest Path:** Read Files Directly
- **Difficulty:** TRIVIAL
- **Cost:** FREE
- **Detection Risk:** LOW
- **Time:** ~1 hour

**Impact:** User PII exposure, location history, equipment data, observation logs

**Root Causes:**
- Plaintext data storage (JSON files, localStorage)
- No encryption at rest
- Path traversal allows arbitrary file read
- XSS vulnerabilities enable localStorage theft

**Recommended Mitigations:**
1. Encrypt sensitive data at rest
2. Use system credential storage for secrets
3. Implement Content Security Policy
4. Validate all file paths
5. Add URL allowlist for SSRF prevention

### 3. Denial of Service (HIGH)

**Easiest Path:** Oversized JSON Deserialization
- **Difficulty:** TRIVIAL
- **Cost:** FREE
- **Detection Risk:** HIGH
- **Time:** ~30 minutes

**Impact:** Application crash, system unresponsiveness, disk exhaustion

**Root Causes:**
- No size limits on input data
- Unlimited cache growth
- No rate limiting on commands
- Unbounded CSV parsing

**Recommended Mitigations:**
1. Implement size limits on all inputs
2. Add cache size quotas with LRU eviction
3. Rate limit all Tauri commands
4. Use streaming parsers for large data
5. Add resource monitoring

### 4. Internal Network Reconnaissance (HIGH)

**Easiest Path:** SSRF via URL Injection
- **Difficulty:** LOW
- **Cost:** FREE
- **Detection Risk:** MEDIUM
- **Time:** ~4-8 hours

**Impact:** Internal network mapping, cloud metadata theft, lateral movement

**Root Causes:**
- Arbitrary URL fetching without validation
- No IP address restrictions
- Missing network egress filtering
- No protocol restrictions

**Recommended Mitigations:**
1. Implement URL allowlist validation
2. Block private IP ranges (RFC 1918)
3. Restrict to HTTPS only
4. Add network egress filtering
5. Block cloud metadata endpoints

## Prioritized Remediation Plan

### Phase 1: Critical (Immediate Action Required)

1. **Add Authentication/Authorization** (src-tauri/src/lib.rs)
   - Implement permission checks on all Tauri commands
   - Add role-based access control
   - Audit command surface area

2. **Fix Path Traversal** (app_settings.rs, storage.rs)
   - Validate and sanitize all file paths
   - Implement directory allowlist
   - Use secure file dialogs only

3. **Enable Content Security Policy** (tauri.conf.json)
   - Remove `"csp": null`
   - Implement strict CSP policy
   - Add XSS protections

4. **Encrypt Data at Rest** (storage.rs, web-storage.ts)
   - Use system credential manager
   - Encrypt JSON files
   - Minimize localStorage usage

### Phase 2: High (Within 1 Week)

5. **URL Validation** (unified_cache.rs)
   - Implement URL allowlist
   - Block internal/private IPs
   - Restrict to HTTPS only

6. **Input Size Limits** (all Tauri commands)
   - Add maximum size limits
   - Implement streaming parsers
   - Add resource quotas

7. **Rate Limiting** (lib.rs command handlers)
   - Implement rate limiting on all commands
   - Add throttling mechanisms
   - Circuit breakers for abuse

### Phase 3: Medium (Within 1 Month)

8. **Logging and Monitoring**
   - Add comprehensive audit logs
   - Security event monitoring
   - Alerting on suspicious activities

9. **XSS Prevention** (map-location-picker.tsx)
   - Remove innerHTML usage
   - Use React JSX
   - Sanitize all HTML inputs

10. **Dependency Management**
    - Implement dependency scanning
    - Create SBOM
    - Regular security updates

## Conclusion

The Skymap application has **critical security vulnerabilities** that make system compromise,
data exfiltration, and denial of service attacks trivial to execute. The primary issues are:

1. **No security boundary** between frontend and backend
2. **Missing input validation** across all attack surfaces
3. **Plaintext data storage** without encryption
4. **No authentication or authorization** on sensitive operations

**Immediate action is required** on Phase 1 items to reduce the attack surface from "trivial
exploitation" to "secured application."

## References

- Security Vulnerability Report: `llmdoc/agent/security-vulnerability-report.md`
- MITRE ATT&CK: https://attack.mitre.org/
- OWASP Top 10: https://owasp.org/www-project-top-ten/
- Tauri Security: https://tauri.app/v1/guides/security/
