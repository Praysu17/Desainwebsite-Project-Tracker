# Security Specification & Threat Model

## 1. Data Invariants
1. Documents must have strictly validated IDs matching `^[a-zA-Z0-9_\-]+$` and length <= 128.
2. Invoices and Proposals can be viewed publicly by token or document ID for online client review, but only valid status updates can occur during public responses (e.g. client approving/rejecting a proposal).
3. Client PII (phone number, email, financial notes) must be guarded against unauthorized mutations.
4. Financial income and expense entries must have positive non-zero amounts and cannot be tampered with by unauthenticated actors.
5. User accounts and roles cannot be escalated arbitrarily.
6. Updates to documents cannot inject ghost fields or arbitrary payload blobs (Anti-Update-Gap).

## 2. The Dirty Dozen Payloads (Designed to Fail Validation)
1. **Ghost Field Injection**: Adding `isSuperAdmin: true` to a Client or Invoice update payload.
2. **Denial of Wallet Overload**: Creating a client with a 1.5MB notes string exceeding length bounds.
3. **Negative Amount Fraud**: Creating an Income record with `amount: -99999999`.
4. **Invalid Status Transition**: Forcing invoice status to an unlisted status `"BypassPayment"`.
5. **Path ID Poisoning**: Specifying an ID like `../../etc/passwd` or non-alphanumeric special characters.
6. **Proposal Spoofing**: Overwriting proposal `totalValue` after client already accepted.
7. **Role Escalation**: Regular user updating their own role to `'Owner/Admin'`.
8. **Malicious Payment Tampering**: Client public review endpoint attempting to mark invoice as paid without admin verification.
9. **Settings Overwrite**: Unauthenticated caller modifying agency bank accounts.
10. **Orphaned Subcollection Write**: Writing transactions pointing to non-existent schemas.
11. **Type Confusion Attack**: Sending boolean `true` for a string field like `clientName`.
12. **Array Expansion Attack**: Injecting 10,000 array items into invoice items list.
