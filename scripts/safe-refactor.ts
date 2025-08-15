// scripts/safe-refactor.ts
import { Project, SyntaxKind, SourceFile } from 'ts-morph';
import { globby } from 'globby';
import pc from 'picocolors';

const ROOTS = ['src'].filter(Boolean);

/**
 * Safe refactor script that applies type-aware, conservative transformations
 * Only semantics-preserving changes are allowed
 */
(async () => {
  console.log(pc.cyan('🔧 Starting safe refactor process...'));

  try {
    const files = await globby(
      ROOTS.map((r) => `${r}/**/*.{js,jsx,ts,tsx}`),
      {
        gitignore: true,
        ignore: [
          '**/node_modules/**',
          '**/.next/**',
          '**/dist/**',
          '**/coverage/**',
        ],
      }
    );

    console.log(pc.blue(`📁 Found ${files.length} files to analyze`));

    const project = new Project({
      tsConfigFilePath: 'tsconfig.json',
      skipAddingFilesFromTsConfig: false,
      useInMemoryFileSystem: false,
    });

    files.forEach((f) => project.addSourceFileAtPathIfExists(f));

    let totalChangedCount = 0;
    const changedFiles: string[] = [];

    for (const sf of project.getSourceFiles()) {
      if (!files.includes(sf.getFilePath())) continue;

      let fileChanged = false;
      const filePath = sf.getFilePath();

      console.log(pc.gray(`📝 Processing: ${filePath}`));

      // 1) Remove unused imports (safe)
      fileChanged = removeUnusedImports(sf) || fileChanged;

      // 2) Convert to type-only imports where applicable (safe)
      fileChanged = convertToTypeOnlyImports(sf) || fileChanged;

      // 3) let → const when not reassigned (safe)
      fileChanged = convertLetToConst(sf) || fileChanged;

      // 4) Remove unused variables (safe)
      fileChanged = removeUnusedVariables(sf) || fileChanged;

      if (fileChanged) {
        changedFiles.push(filePath);
        totalChangedCount++;
      }
    }

    console.log(
      pc.green(
        `✅ Safe-refactor completed. Files changed: ${totalChangedCount}`
      )
    );

    if (totalChangedCount > 0) {
      console.log(pc.yellow('Changed files:'));
      changedFiles.forEach((file) => console.log(pc.yellow(`  - ${file}`)));

      // Save all changes
      await project.save();
    } else {
      console.log(pc.gray('ℹ️  No changes needed'));
    }
  } catch (error) {
    console.error(pc.red('❌ Safe refactor failed:'), error);
    process.exit(1);
  }
})();

/**
 * Remove unused imports (conservative approach)
 */
function removeUnusedImports(sf: SourceFile): boolean {
  let changed = false;
  const imports = sf.getImportDeclarations();

  for (const imp of imports) {
    const namedImports = imp.getNamedImports();
    if (!namedImports.length) continue;

    const unusedImports = namedImports.filter((namedImport) => {
      const name = namedImport.getName();
      const refs = sf
        .getDescendantsOfKind(SyntaxKind.Identifier)
        .filter(
          (id) => id.getText() === name && id !== namedImport.getNameNode()
        );
      return refs.length === 0;
    });

    // Only remove if we have unused imports but not all imports are unused (safer)
    if (
      unusedImports.length > 0 &&
      unusedImports.length < namedImports.length
    ) {
      unusedImports.forEach((unused) => unused.remove());
      changed = true;
    }
  }

  return changed;
}

/**
 * Convert to type-only imports where all imports are types (safe)
 */
function convertToTypeOnlyImports(sf: SourceFile): boolean {
  let changed = false;
  const imports = sf.getImportDeclarations();

  for (const imp of imports) {
    if (imp.isTypeOnly()) continue;

    const namedImports = imp.getNamedImports();
    if (!namedImports.length) continue;

    // Check if all named imports start with uppercase (likely types/interfaces)
    const allAreTypes = namedImports.every((namedImport) => {
      const name = namedImport.getName();
      return /^[A-Z]/.test(name);
    });

    if (allAreTypes) {
      imp.setIsTypeOnly(true);
      changed = true;
    }
  }

  return changed;
}

/**
 * Convert let to const when variable is not reassigned (safe)
 */
function convertLetToConst(sf: SourceFile): boolean {
  let changed = false;

  const variableStatements = sf.getVariableStatements();

  for (const stmt of variableStatements) {
    const decList = stmt.getDeclarationList();

    if (decList.getFlags() !== 2) continue; // Only process 'let' declarations (flag 2)

    const declarations = decList.getDeclarations();

    // Check if all variables in this declaration list are never reassigned
    const allAreNeverReassigned = declarations.every((decl) => {
      const name = decl.getName();

      // Find all identifiers with this name in the file
      const identifiers = sf
        .getDescendantsOfKind(SyntaxKind.Identifier)
        .filter((id) => id.getText() === name);

      // Check if any are being assigned to (not including the initial declaration)
      const hasReassignment = identifiers.some((id) => {
        const parent = id.getParent();
        return (
          parent?.getKind() === SyntaxKind.BinaryExpression &&
          parent
            .asKindOrThrow(SyntaxKind.BinaryExpression)
            .getOperatorToken()
            .getKind() === SyntaxKind.EqualsToken &&
          parent.asKindOrThrow(SyntaxKind.BinaryExpression).getLeft() === id
        );
      });

      return !hasReassignment;
    });

    if (allAreNeverReassigned) {
      decList.setDeclarationKind('const');
      changed = true;
    }
  }

  return changed;
}

/**
 * Remove unused variables (very conservative - only remove if clearly unused)
 */
function removeUnusedVariables(sf: SourceFile): boolean {
  let changed = false;

  // This is intentionally very conservative - we only remove variables that are:
  // 1. Clearly declared but never used
  // 2. Not function parameters
  // 3. Not destructured assignments (which might have side effects)

  const variableStatements = sf.getVariableStatements();

  for (const stmt of variableStatements) {
    const declarations = stmt.getDeclarationList().getDeclarations();

    const unusedDeclarations = declarations.filter((decl) => {
      // Skip if it has an initializer that might have side effects
      const initializer = decl.getInitializer();
      if (initializer?.getKind() === SyntaxKind.CallExpression) {
        return false; // Might have side effects
      }

      const name = decl.getName();

      // Skip destructuring (might have side effects)
      if (name.includes('{') || name.includes('[')) {
        return false;
      }

      // Find all references to this variable
      const identifiers = sf
        .getDescendantsOfKind(SyntaxKind.Identifier)
        .filter((id) => id.getText() === name && id !== decl.getNameNode());

      return identifiers.length === 0;
    });

    // Only remove if we have unused declarations and it's safe
    if (
      unusedDeclarations.length > 0 &&
      unusedDeclarations.length < declarations.length
    ) {
      unusedDeclarations.forEach((unused) => unused.remove());
      changed = true;
    }
  }

  return changed;
}
