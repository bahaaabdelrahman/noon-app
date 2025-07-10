// Simple test to verify Jest configuration
describe('Jest Configuration', () => {
  it('should run tests successfully', () => {
    expect(1 + 1).toBe(2);
  });

  it('should have access to environment variables', () => {
    expect(process.env.NODE_ENV).toBe('test');
  });
});
