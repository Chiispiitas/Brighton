# Administrator access-code reveal

Historical originals are recovered from local chat records and verified against existing code hashes before import. Only issued IDs that still exist are recovered; deleted entries are never recreated. Claims, expiry, learner profiles and progress remain unchanged.

Private HzThrottle code-vault records use AES-256-GCM with random IVs and the issued-code ID as authenticated associated data. The encryption key is a separate private code-vault-config record backed up with the database. This protects against accidental disclosure of an individual issued-code export; it does not protect against a full database administrator who can read both ciphertext and the key. No vault material is in frontend bundles or the repository.

Admin-only revealCode returns one original on explicit request, after session/role checks, with no-store headers and a metadata-only audit event. Lists/exports contain availability and hints only. The UI reveals into a readonly field, offers Ocultar, and clears it after30 seconds or navigation/logout. recoverCode verifies the original matches the selected existing ID. New keys are vaulted; unknown legacy originals can be captured on a subsequent valid redemption without changing access or blocking login on vault failure.

Recovery originals and credentials remain in private local files outside the repository. Synthetic tests cover authentication, encryption, no raw values in lists/audit, hash verification and preservation of issued records.

Inline reveal refinement: Revelar replaces the masked hint in that table row with the original, without copying it to list state or export data. The same button becomes Ocultar. The30-second timeout and navigation refresh remove the visible original. A delayed API response cannot populate a detached row.
