// Helper to check if we're on the client side
const isClient = typeof window !== 'undefined';

interface UserProfile {
    firstName: string;
    lastName: string;
    schoolIdNumber: string;
    email: string;
    role?: string;
}

class UserProfileService {
    private static instance: UserProfileService;
    private readonly STORAGE_KEY = 'userProfile';

    private constructor() { }

    static getInstance(): UserProfileService {
        if (!UserProfileService.instance) {
            UserProfileService.instance = new UserProfileService();
        }
        return UserProfileService.instance;
    }

    /**
     * Sanitize user profile data by removing unnecessary characters and URL encoding
     */
    private sanitizeProfile(profile: UserProfile): UserProfile {
        const sanitizeString = (str: string | undefined): string => {
            if (!str) return '';
            try {
                // Decode URL encoding first (handles %20, %40, etc.)
                let cleaned = decodeURIComponent(str);
                // Remove any remaining % characters that aren't part of valid encoding
                cleaned = cleaned.replace(/%/g, '');
                // Remove other problematic characters but keep alphanumeric, spaces, dots, hyphens, underscores, @
                // This preserves normal names, emails, and IDs
                cleaned = cleaned.replace(/[^\w\s.\-@]/g, '');
                // Trim whitespace
                return cleaned.trim();
            } catch (error) {
                // If decodeURIComponent fails, just remove % and clean
                let cleaned = str.replace(/%/g, '');
                cleaned = cleaned.replace(/[^\w\s.\-@]/g, '');
                return cleaned.trim();
            }
        };

        return {
            firstName: sanitizeString(profile.firstName),
            lastName: sanitizeString(profile.lastName),
            schoolIdNumber: sanitizeString(profile.schoolIdNumber),
            email: sanitizeString(profile.email),
            role: sanitizeString(profile.role),
        };
    }

    /**
     * Get user profile from sessionStorage
     */
    getUserProfile(): UserProfile | null {
        if (!isClient) return null;

        try {
            const profileData = sessionStorage.getItem(this.STORAGE_KEY);
            if (!profileData) return null;

            const profile = JSON.parse(profileData) as UserProfile;
            return profile;
        } catch (error) {
            console.error('Failed to parse user profile from sessionStorage:', error);
            return null;
        }
    }

    /**
     * Set user profile in sessionStorage (with sanitization)
     */
    setUserProfile(profile: UserProfile): void {
        if (!isClient) return;

        try {
            // Sanitize the profile before saving
            const sanitizedProfile = this.sanitizeProfile(profile);
            sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(sanitizedProfile));
        } catch (error) {
            console.error('Failed to save user profile to sessionStorage:', error);
        }
    }

    /**
     * Update user profile (merge with existing)
     */
    updateUserProfile(updates: Partial<UserProfile>): void {
        if (!isClient) return;

        const existing = this.getUserProfile();
        if (existing) {
            this.setUserProfile({ ...existing, ...updates });
        } else {
            // If no existing profile, create new one (though this shouldn't happen)
            this.setUserProfile(updates as UserProfile);
        }
    }

    /**
     * Remove user profile from sessionStorage
     */
    removeUserProfile(): void {
        if (isClient) {
            sessionStorage.removeItem(this.STORAGE_KEY);
        }
    }

    /**
     * Check if user profile exists in sessionStorage
     */
    hasUserProfile(): boolean {
        return this.getUserProfile() !== null;
    }
}

export default UserProfileService.getInstance();
