// Simple test to verify Jest is working
describe('Basic Test Suite', () => {
  it('should run basic tests', () => {
    expect(1 + 1).toBe(2)
  })

  it('should handle strings', () => {
    expect('hello world').toContain('world')
  })

  it('should work with arrays', () => {
    const fruits = ['apple', 'banana', 'orange']
    expect(fruits).toHaveLength(3)
    expect(fruits).toContain('banana')
  })

  it('should handle async operations', async () => {
    const asyncFunction = async () => {
      return Promise.resolve('success')
    }

    const result = await asyncFunction()
    expect(result).toBe('success')
  })
})