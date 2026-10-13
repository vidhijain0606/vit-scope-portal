/**
 * Access Control Utility
 * 
 * This file handles permissions for accessing the portal.
 * Use this to implement the CSV allowlist logic in the future.
 */

// Restricted allowlist: only these faculty emails may access the portal.
// A secretary account will be added to this list later.
export const ALLOWED_EMAILS: string[] = [
    'hparveensultana@vit.ac.in',
    'rajkumars@vit.ac.in',
];

/**
 * Checks if a user is allowed to access the portal.
 * @param email User's email address
 * @returns { isAllowed: boolean, reason?: string }
 */
export const checkAccess = (email: string | undefined | null): { isAllowed: boolean, reason?: string } => {
    if (!email) return { isAllowed: false, reason: 'No email provided.' };

    const lowerEmail = email.toLowerCase();

    if (ALLOWED_EMAILS.map(e => e.toLowerCase()).includes(lowerEmail)) {
        return { isAllowed: true };
    }

    return { isAllowed: false, reason: 'Access is restricted to authorized faculty accounts.' };
};
