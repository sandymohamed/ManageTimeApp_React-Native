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
      const result = await Keychain.setGenericPassword(
        this.SERVICE_NAME,
        JSON.stringify(tokens)
      );
      return true;
    } catch (error) {
      return false;
    }
  }

  async getTokens(): Promise<StoredTokens | null> {
    try {

      const credentials = await Keychain.getGenericPassword();

      if (credentials && credentials.password) {
        const tokens = JSON.parse(credentials.password);
        return tokens;
      }
      return null;
    } catch (error) {
      logger.error('Token retrieval error:', error);
      return null;
    }
  }

  async getTokensWithRetry(maxRetries: number = 3): Promise<StoredTokens | null> {
    for (let i = 0; i < maxRetries; i++) {
      const tokens = await this.getTokens();
      if (tokens) {
        return tokens;
      }

      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return null;
  }

  async clearTokens(): Promise<boolean> {
    try {

      const result = await Keychain.resetGenericPassword();

      return result;
    } catch (error) {
      logger.error('Token clearance error:', error);
      return false;
    }
  }

  // async debugKeychain(): Promise<void> {
  //   try {

  //     const credentials = await Keychain.getGenericPassword();


  //     if (credentials) {
  //       try {
  //         const parsedData = JSON.parse(credentials.password);
  //       } catch (parseError) {
  //         console.log('Error parsing stored data:', parseError);
  //       }
  //     } else {
  //       console.log('No credentials found');
  //     }
  //   } catch (error) {
  //     console.log('Debug error:', error);
  //   }
  // }

  // async debugTokenStorage(): Promise<void> {
  //   try {

  //     // Check what's actually stored
  //     const credentials = await Keychain.getGenericPassword();

  //     // Try to get tokens using our method
  //     const tokens = await this.getTokens();

  //     // Try with retry
  //     const tokensWithRetry = await this.getTokensWithRetry();

  //   } catch (error) {
  //     console.log('Debug token storage error:', error);
  //   }
  // }
}

export const tokenService = new TokenService();