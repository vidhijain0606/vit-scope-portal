/**
 * Access Control Utility
 * 
 * This file handles permissions for accessing the portal.
 * Use this to implement the CSV allowlist logic in the future.
 */

// 1. Domain Restriction
export const ALLOWED_DOMAINS = ['vit.ac.in'];

// 2. Allowlist (Placeholder for CSV feature) & Test Accounts
export const ALLOWED_EMAILS: string[] = [
    'vidhiprashant.j2023@vitstudent.ac.in',
    'VIDHIJ0606@GMAIL.COM', // Note: Case sensitive check might fail, so we should lowercase in logic
];

/**
 * Checks if a user is allowed to access the portal.
 * @param email User's email address
 * @returns { isAllowed: boolean, reason?: string }
 */
export const checkAccess = (email: string | undefined | null): { isAllowed: boolean, reason?: string } => {
    if (!email) return { isAllowed: false, reason: 'No email provided.' };

    const lowerEmail = email.toLowerCase();

    // 0. Check Specific Allowlist First (Bypass domain check)
    if (ALLOWED_EMAILS.map(e => e.toLowerCase()).includes(lowerEmail)) {
        return { isAllowed: true };
    }

    // 1. Check Domain (DISABLED as per request)
    // const domain = lowerEmail.split('@')[1];
    // if (!ALLOWED_DOMAINS.includes(domain)) {
    //     return { isAllowed: false, reason: 'Only vit.ac.in emails are allowed.' };
    // }

    return { isAllowed: true };

    return { isAllowed: true };
};
