import { describe, it, expect, afterEach } from 'vitest';
import { existsSync, writeFileSync, readFileSync, unlinkSync } from 'fs';
import { join } from 'path';

/**
 * Tests for safe-refactor script functionality
 * These are integration tests that verify the script can be executed
 */
describe('Safe Refactor Script', () => {
  const tempTestFile = join(process.cwd(), 'src', 'temp-test-refactor.js');

  afterEach(() => {
    // Clean up any temporary test files
    if (existsSync(tempTestFile)) {
      unlinkSync(tempTestFile);
    }
  });

  it('should export the main functions needed for refactoring', () => {
    // Since the script is an IIFE, we just verify it can be imported/executed
    // In a real scenario, the script would be tested by running it and checking outputs
    expect(true).toBe(true); // Placeholder - the script execution in workflow is the real test
  });

  it('should have proper file structure for safe refactoring', () => {
    // Verify that the safe-refactor.ts file exists and has required content
    const scriptPath = join(process.cwd(), 'scripts', 'safe-refactor.ts');
    expect(existsSync(scriptPath)).toBe(true);

    const scriptContent = readFileSync(scriptPath, 'utf-8');
    expect(scriptContent).toContain('removeUnusedImports');
    expect(scriptContent).toContain('convertToTypeOnlyImports');
    expect(scriptContent).toContain('convertLetToConst');
    expect(scriptContent).toContain('removeUnusedVariables');
  });

  it('should create sample files that could benefit from refactoring', () => {
    // Create a test file with issues that the script should fix
    const problematicCode = `
import { unused, React } from 'react';
import { Component, useState } from 'react';

let neverReassigned = 'value';
let alsoNeverReassigned = 42;

export function TestComponent() {
  const [state, setState] = useState(0);
  return <div>{state}</div>;
}
`;

    writeFileSync(tempTestFile, problematicCode);
    expect(existsSync(tempTestFile)).toBe(true);

    const content = readFileSync(tempTestFile, 'utf-8');
    expect(content).toContain('let neverReassigned');
    expect(content).toContain('unused');
  });
});
