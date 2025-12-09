import { storage } from './storage';
import { clearUserProfileState } from '@/src/features/users/hooks/useUserProfile';
import { authAPI } from '@/src/features/auth/api/auth_api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

/**
 * Comprehensive logout function that:
 * 1. Clears global profile state
 * 2. Calls backend logout (if available)
 * 3. Clears all local storage
 * 4. Navigates to login
 */
export const performLogout = async (showError = false): Promise<void> => {
    try {
        console.log("🧹 [LOGOUT] Starting comprehensive logout...");

        // Step 1: Clear global profile state immediately
        clearUserProfileState();

        // Step 2: Attempt backend logout (optional, don't fail if it errors)
        try {
            await authAPI.logout();
            console.log("✅ [LOGOUT] Backend session invalidated");
        } catch (error) {
            console.warn("⚠️ [LOGOUT] Backend logout failed (continuing with local cleanup):", error);
        }

        // Step 3: Clear all user data from storage
        await storage.clearAllUserData();

        // Step 4: Additional safety - explicitly remove auth-related items
        await Promise.all([
            AsyncStorage.removeItem("authToken"),
            AsyncStorage.removeItem("pendingOAuthToken"),
            AsyncStorage.removeItem("oauthUserData"),
        ]);

        console.log("✅ [LOGOUT] All data cleared successfully");

        // Step 5: Navigate to login
        router.replace("/auth/login" as never);

        // Small delay to ensure state is cleared
        await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
        console.error("❌ [LOGOUT] Error during logout:", error);

        // Even if cleanup fails, still clear state and navigate
        clearUserProfileState();
        router.replace("/auth/login" as never);

        if (showError) {
            throw error;
        }
    }
};

