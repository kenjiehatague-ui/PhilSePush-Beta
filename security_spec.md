# Security Specification & Threat Model (PhilSePush)

## Data Invariants
1. Outage Reports must have a valid `reporterId`, accurate geographical metadata (`barangay`, `cityMunicipality`), and cannot be arbitrarily marked `verified` by standard citizen users.
2. Verification and Official Updates are reserved for authorized roles (`verification_team`, `admin`, `utility_provider`, `lgu`).
3. Outage state transitions (`Investigating` -> `Repairing` -> `Restoring` -> `Restored`) must be guarded and verified.
4. User PII (such as full phone number and email) can only be accessed by the user themselves or authenticated verifiers/admins during triage.
5. Community updates cannot impersonate other users or modify existing records arbitrarily.

## The Dirty Dozen Attack Payloads & Mitigation

1. **Unverified Self-Promotion Attack**: Citizen submits report with `verificationStatus: 'verified'` directly.
   - *Mitigation*: Creation rule enforces `verificationStatus == 'pending'` and prevents unverified self-approval.
2. **Ghost Report Spoofing**: Submitting report with missing location or invalid coordinates.
   - *Mitigation*: Strict schema boundary and length validation on all geographical fields.
3. **Outage Elevation Attack**: Non-admin attempts to close or mark an active outage as `Restored`.
   - *Mitigation*: Status mutations strictly restricted to `isAdmin()`, verifiers, or authenticated utility handlers.
4. **Community Update Impersonation**: Attacker attempts to post an update under someone else's UID.
   - *Mitigation*: Identity check enforces `incoming().userId == request.auth.uid` if `userId` is present.
5. **PII Scraping via User Profile**: Unauthenticated attacker attempts to list all private phone numbers.
   - *Mitigation*: Profile reads and notifications are owner-only (`request.auth.uid == userId`) or admin.
6. **Denial-of-Wallet Long String Injection**: Submitting 2MB payloads in `additionalNotes`.
   - *Mitigation*: Strict `.size() <= 500` length restrictions on notes and messages.
7. **Schedule Modification Tampering**: Citizen attempts to alter scheduled grid maintenance timelines.
   - *Mitigation*: Scheduled outages write permissions restricted to utility and admin roles.
8. **Malicious Notification Push**: User attempts to inject fake urgent warning alerts into another user's inbox.
   - *Mitigation*: Notifications creation restricted to system processes or authenticated verifiers dispatching alerts.
9. **Official Update Forgery**: Submitting official bulletin without utility/LGU credentials.
   - *Mitigation*: `official_updates` creation validated against verified role.
10. **Area Jurisdiction Mutation**: Attacker attempts to reassign franchise utility providers.
    - *Mitigation*: Area configurations are read-only for public and restricted to admins for writes.
11. **Excessive Me-Too Increment Attack**: Scripting multiple confirmation increments.
    - *Mitigation*: Validated counter increment bounds and unique client confirmations.
12. **Orphaned Report Write**: Submitting reports linked to non-existent areas or malformed identifiers.
    - *Mitigation*: `isValidId()` regex and boundary enforcement on all entity IDs.
