/**
 * Secure Token Storage for Browser Extension
 * Uses chrome.storage.local for secure JWT storage
 */

import browser from 'webextension-polyfill';
import { TokenStorage } from '../lib/api/history';

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'jwt_access_token',
  REFRESH_TOKEN: 'jwt_refresh_token',
};

/**
 * Extension Token Storage
 * Implements secure storage using chrome.storage API
 */
export class ExtensionTokenStorage implements TokenStorage {
  /**
   * Get access token
   */
  async getAccessToken(): Promise<string | null> {
    try {
      const result = await browser.storage.local.get(STORAGE_KEYS.ACCESS_TOKEN);
      return result[STORAGE_KEYS.ACCESS_TOKEN] || null;
    } catch (error) {
      console.error('Failed to get access token:', error);
      return null;
    }
  }

  /**
   * Get refresh token
   */
  async getRefreshToken(): Promise<string | null> {
    try {
      const result = await browser.storage.local.get(STORAGE_KEYS.REFRESH_TOKEN);
      return result[STORAGE_KEYS.REFRESH_TOKEN] || null;
    } catch (error) {
      console.error('Failed to get refresh token:', error);
      return null;
    }
  }

  /**
   * Set both tokens
   */
  async setTokens(access: string, refresh: string): Promise<void> {
    try {
      await browser.storage.local.set({
        [STORAGE_KEYS.ACCESS_TOKEN]: access,
        [STORAGE_KEYS.REFRESH_TOKEN]: refresh,
      });
    } catch (error) {
      console.error('Failed to set tokens:', error);
      throw error;
    }
  }

  /**
   * Clear all tokens
   */
  async clearTokens(): Promise<void> {
    try {
      await browser.storage.local.remove([
        STORAGE_KEYS.ACCESS_TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN,
      ]);
    } catch (error) {
      console.error('Failed to clear tokens:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const tokenStorage = new ExtensionTokenStorage();
