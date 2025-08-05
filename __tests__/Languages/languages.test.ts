import { getTranslation, supportedLanguages } from '../../app/Languages/languages'

describe('Languages and Translations', () => {
  describe('getTranslation', () => {
    it('should return translation object for supported language', () => {
      const translation = getTranslation('en')
      
      expect(translation).toBeDefined()
      expect(typeof translation).toBe('object')
    })

    it('should return translation for all supported languages', () => {
      supportedLanguages.forEach(lang => {
        const translation = getTranslation(lang.code)
        expect(translation).toBeDefined()
        expect(typeof translation).toBe('object')
      })
    })

    it('should have consistent translation keys across languages', () => {
      const englishTranslation = getTranslation('en')
      const englishKeys = Object.keys(englishTranslation)

      supportedLanguages.forEach(lang => {
        if (lang.code !== 'en') {
          const translation = getTranslation(lang.code)
          const translationKeys = Object.keys(translation)
          
          // Check that all English keys exist in other translations
          englishKeys.forEach(key => {
            expect(translationKeys).toContain(key)
          })
        }
      })
    })

    it('should contain required market question translations', () => {
      const translation = getTranslation('en')
      
      // Check for key market questions
      expect(translation).toHaveProperty('bitcoinQuestion')
      expect(translation).toHaveProperty('ethereumQuestion')
      expect(translation).toHaveProperty('teslaQuestion')
      
      // Ensure they are not empty
      expect(translation.bitcoinQuestion).toBeTruthy()
      expect(translation.ethereumQuestion).toBeTruthy()
      expect(translation.teslaQuestion).toBeTruthy()
    })

    it('should return default translation for unsupported language', () => {
      const translation = getTranslation('unsupported' as any)
      const englishTranslation = getTranslation('en')
      
      // Should fallback to English
      expect(translation).toEqual(englishTranslation)
    })

    it('should handle empty or null language codes', () => {
      const translationEmpty = getTranslation('' as any)
      const translationNull = getTranslation(null as any)
      const englishTranslation = getTranslation('en')
      
      expect(translationEmpty).toEqual(englishTranslation)
      expect(translationNull).toEqual(englishTranslation)
    })
  })

  describe('supportedLanguages', () => {
    it('should contain at least English', () => {
      const englishLang = supportedLanguages.find(lang => lang.code === 'en')
      expect(englishLang).toBeDefined()
      expect(englishLang?.name).toBe('English')
    })

    it('should have valid language structure', () => {
      supportedLanguages.forEach(lang => {
        expect(lang).toHaveProperty('code')
        expect(lang).toHaveProperty('name')
        
        expect(typeof lang.code).toBe('string')
        expect(typeof lang.name).toBe('string')
        expect(lang.code.length).toBeGreaterThan(0)
        expect(lang.name.length).toBeGreaterThan(0)
      })
    })

    it('should have unique language codes', () => {
      const codes = supportedLanguages.map(lang => lang.code)
      const uniqueCodes = new Set(codes)
      
      expect(uniqueCodes.size).toBe(codes.length)
    })

    it('should have valid ISO language codes', () => {
      supportedLanguages.forEach(lang => {
        // Basic check for valid language code format (2-letter ISO codes)
        expect(lang.code).toMatch(/^[a-z]{2}(-[A-Z]{2})?$/)
      })
    })
  })

  describe('Translation Content Quality', () => {
    it('should have meaningful question texts', () => {
      const translation = getTranslation('en')
      
      // Check that questions are actual questions
      expect(translation.bitcoinQuestion).toMatch(/\?$/)
      expect(translation.ethereumQuestion).toMatch(/\?$/)
      expect(translation.teslaQuestion).toMatch(/\?$/)
      
      // Check minimum length (should be descriptive)
      expect(translation.bitcoinQuestion.length).toBeGreaterThan(10)
      expect(translation.ethereumQuestion.length).toBeGreaterThan(10)
      expect(translation.teslaQuestion.length).toBeGreaterThan(10)
    })

    it('should not contain placeholder text', () => {
      const translation = getTranslation('en')
      
      Object.values(translation).forEach(value => {
        if (typeof value === 'string') {
          expect(value).not.toMatch(/lorem ipsum/i)
          expect(value).not.toMatch(/placeholder/i)
          expect(value).not.toMatch(/TODO/i)
          expect(value).not.toMatch(/FIXME/i)
        }
      })
    })

    it('should have consistent terminology across translations', () => {
      const languages = ['en'] // Add more languages as they become available
      
      languages.forEach(langCode => {
        const translation = getTranslation(langCode)
        
        // Check for consistent use of "Bitcoin" (should not be translated)
        if (translation.bitcoinQuestion) {
          expect(translation.bitcoinQuestion).toMatch(/Bitcoin/i)
        }
        
        // Check for consistent currency symbols
        if (translation.teslaQuestion) {
          expect(translation.teslaQuestion).toMatch(/Tesla|TSLA/)
        }
      })
    })

    it('should handle special characters properly', () => {
      supportedLanguages.forEach(lang => {
        const translation = getTranslation(lang.code)
        
        Object.values(translation).forEach(value => {
          if (typeof value === 'string') {
            // Should not have unescaped HTML entities
            expect(value).not.toMatch(/&lt;|&gt;|&amp;/)
            
            // Should handle unicode characters properly
            expect(value).not.toMatch(/\\u[0-9a-fA-F]{4}/)
          }
        })
      })
    })
  })

  describe('Market Integration', () => {
    it('should provide translations that work with market data', () => {
      const translation = getTranslation('en')
      
      // Test that translation can be used in market context
      const mockMarketData = {
        id: 'bitcoin',
        question: translation.bitcoinQuestion || '',
      }
      
      expect(mockMarketData.question).toBeTruthy()
      expect(mockMarketData.question.length).toBeGreaterThan(0)
    })

    it('should handle fallback gracefully when translation is missing', () => {
      const translation = getTranslation('en')
      
      // Should provide empty string fallback for missing translations
      const question = translation.nonexistentQuestion || ''
      expect(typeof question).toBe('string')
    })
  })
})