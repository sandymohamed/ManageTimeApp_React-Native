// services/tokenService.ts
import * as Keychain from 'react-native-keychain';
import { logger } from '@/utils/logger';

export interface StoredTokens {
  token: string;
  refreshToken: string;
}

class TokenService {
  private readonly SERVICE_NAME = 'auth_tokens';

  async storeTokens(tokens: StoredTokens): Promise<boolean> {
    try {
      console.log('🔐 Storing tokens in Keychain...', tokens);
      
      const result = await Keychain.setGenericPassword(
        this.SERVICE_NAME,
        JSON.stringify(tokens)
      );
      
      console.log('✅ Tokens stored successfully:', result);
      return true;
    } catch (error) {
      console.log('❌ Error storing tokens:', error);
      logger.error('Token storage error:', error);
      return false;
    }
  }

  async getTokens(): Promise<StoredTokens | null> {
    try {
      console.log('🔐 Retrieving tokens from Keychain...');
      
      const credentials = await Keychain.getGenericPassword();
      
      if (credentials && credentials.password) {
        const tokens = JSON.parse(credentials.password);
        console.log('✅ Tokens retrieved:', tokens);
        return tokens;
      }
      
      console.log('❌ No tokens found in Keychain');
      return null;
    } catch (error) {
      console.log('❌ Error retrieving tokens:', error);
      logger.error('Token retrieval error:', error);
      return null;
    }
  }

  async getTokensWithRetry(maxRetries: number = 3): Promise<StoredTokens | null> {
    for (let i = 0; i < maxRetries; i++) {
      console.log(`🔐 Retrieving tokens attempt ${i + 1}/${maxRetries}...`);
      
      const tokens = await this.getTokens();
      if (tokens) {
        return tokens;
      }
      
      if (i < maxRetries - 1) {
        console.log('⏳ Waiting before retry...');
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    console.log('❌ Failed to retrieve tokens after all retries');
    return null;
  }

  async clearTokens(): Promise<boolean> {
    try {
      console.log('🔐 Clearing tokens from Keychain...');
      
      const result = await Keychain.resetGenericPassword();
      
      console.log('✅ Tokens cleared:', result);
      return result;
    } catch (error) {
      console.log('❌ Error clearing tokens:', error);
      logger.error('Token clearance error:', error);
      return false;
    }
  }

  async debugKeychain(): Promise<void> {
    try {
      console.log('🔍 Debugging Keychain...');
      
      const credentials = await Keychain.getGenericPassword();
      
      console.log('Keychain credentials:', credentials);
      
      if (credentials) {
        try {
          const parsedData = JSON.parse(credentials.password);
          console.log('Stored data:', parsedData);
          console.log('Token exists:', !!parsedData.token);
          console.log('Refresh token exists:', !!parsedData.refreshToken);
        } catch (parseError) {
          console.log('Error parsing stored data:', parseError);
        }
      } else {
        console.log('No credentials found');
      }
    } catch (error) {
      console.log('Debug error:', error);
    }
  }

  async debugTokenStorage(): Promise<void> {
    try {
      console.log('🔍 Debugging token storage...');
      
      // Check what's actually stored
      const credentials = await Keychain.getGenericPassword();
      console.log('Raw Keychain data:', credentials);
      
      // Try to get tokens using our method
      const tokens = await this.getTokens();
      console.log('Tokens via getTokens:', tokens);
      
      // Try with retry
      const tokensWithRetry = await this.getTokensWithRetry();
      console.log('Tokens via getTokensWithRetry:', tokensWithRetry);
      
    } catch (error) {
      console.log('Debug token storage error:', error);
    }
  }
}

export const tokenService = new TokenService();