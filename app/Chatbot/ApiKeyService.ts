// ApiKeyService.ts
// Service for securely handling API keys

class ApiKeyService {
  private openAiKey: string | null = null;
  private isValidated: boolean = false;
  
  /**
   * Set the OpenAI API key
   * @param key The API key to store
   */
  setOpenAiKey(key: string): void {
    // In a production environment, this should be stored securely
    // For now, we'll just store it in memory
    this.openAiKey = key;
    this.isValidated = false;
    
    // Remove the key from localStorage if it was stored there
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem('openai_api_key');
    }
  }
  
  /**
   * Get the OpenAI API key
   * @returns The stored API key or null if not set
   */
  getOpenAiKey(): string | null {
    return this.openAiKey;
  }
  
  /**
   * Check if the OpenAI API key is set
   * @returns True if the key is set, false otherwise
   */
  hasOpenAiKey(): boolean {
    return !!this.openAiKey;
  }
  
  /**
   * Validate the OpenAI API key by making a test request
   * @returns Promise resolving to true if valid, false otherwise
   */
  async validateApiKey(): Promise<boolean> {
    if (!this.openAiKey) return false;
    if (this.isValidated) return true;
    
    try {
      // Make a minimal API call to validate the key
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.openAiKey}`
        }
      });
      
      if (response.ok) {
        this.isValidated = true;
        return true;
      } else {
        console.error(`API key validation failed: ${response.status}`);
        return false;
      }
    } catch (error) {
      console.error('Error validating API key:', error);
      return false;
    }
  }
  
  /**
   * Get a validated API key, attempting validation if needed
   * @returns Promise resolving to the API key if valid, null otherwise
   */
  async getValidatedKey(): Promise<string | null> {
    if (!this.openAiKey) return null;
    
    if (!this.isValidated) {
      const isValid = await this.validateApiKey();
      if (!isValid) return null;
    }
    
    return this.openAiKey;
  }
  
  /**
   * Mask an API key for display
   * @param key The API key to mask
   * @returns A masked version of the key (e.g., "sk-****-****-****-ABCD")
   */
  maskApiKey(key: string): string {
    if (!key) return '';
    
    // For OpenAI keys that start with "sk-"
    if (key.startsWith('sk-')) {
      const lastFour = key.slice(-4);
      return `sk-****-****-****-${lastFour}`;
    }
    
    // Generic masking for other keys
    if (key.length > 8) {
      const firstFour = key.slice(0, 4);
      const lastFour = key.slice(-4);
      return `${firstFour}${'*'.repeat(key.length - 8)}${lastFour}`;
    }
    
    // If key is too short, just return all asterisks
    return '*'.repeat(key.length);
  }
}

export default new ApiKeyService();
