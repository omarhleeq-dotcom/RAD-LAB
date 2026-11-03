import ts from 'typescript';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, relative } from 'node:path';

// Follow the complete import graph of pure evaluation/scoring and domain modules.
// Existing TSX presentation components in evaluation are consumers, never pure roots.
export function layerViolations(root = process.cwd()) {
  const config = ts.readConfigFile(resolve(root, 'tsconfig.json'), ts.sys.readFile);
  if (config.error) throw Error('unreadable tsconfig');
  const options = ts.parseJsonConfigFileContent(config.config, ts.sys, root).options;
  const walk = dir => readdirSync(resolve(root, dir), { withFileTypes: true }).flatMap(e =>
    e.isDirectory() ? walk(`${dir}/${e.name}`) : [`${dir}/${e.name}`]);
  const roots = ['src/domain', 'src/features/evaluation', 'src/features/scoring'].flatMap(walk)
    .filter(p => /\.tsx?$/.test(p) && !/\.(test|spec|d)\.tsx?$/.test(p))
    .filter(p => !['src/features/evaluation/ResultPanel.tsx', 'src/features/evaluation/ResultImage.tsx', 'src/features/evaluation/ResultDisclosure.tsx'].includes(p));
  const violations = new Set();
  for (const entry of roots) {
    const seen = new Set();
    const visit = file => {
      if (seen.has(file)) return;
      seen.add(file);
      const name = relative(root, file).replaceAll('\\', '/');
      if (entry.startsWith('src/domain/') && !name.startsWith('src/domain/')) {
        violations.add(`${entry} -> ${name}: domain imports higher layer`);
        return;
      }
      if (/\.[jt]sx$/.test(name) || /\/stores?\//.test(name)) {
        violations.add(`${entry} -> ${name}`);
        return;
      }
      const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
      const inspect = node => {
        let specifier;
        if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) specifier = node.moduleSpecifier;
        if (ts.isCallExpression(node) && (node.expression.kind === ts.SyntaxKind.ImportKeyword || node.expression.getText(source) === 'require')) specifier = node.arguments[0];
        if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument)) specifier = node.argument.literal;
        if (specifier) {
          if (!ts.isStringLiteralLike(specifier)) violations.add(`${entry} -> ${name}: dynamic module`);
          else {
            const id = specifier.text;
            if (/^(react|react-dom|next|zustand)(\/|$)/.test(id)) violations.add(`${entry} -> ${name}: ${id}`);
            const target = ts.resolveModuleName(id, file, options, ts.sys).resolvedModule;
            if (target && !target.isExternalLibraryImport) visit(target.resolvedFileName);
          }
        }
        if (ts.isIdentifier(node) && /^(window|document|HTMLCanvasElement|CanvasRenderingContext2D|OffscreenCanvas)$/.test(node.text)) {
          violations.add(`${entry} -> ${name}: ${node.text}`);
        }
        ts.forEachChild(node, inspect);
      };
      inspect(source);
    };
    visit(resolve(root, entry));
  }
  return [...violations].sort();
}
