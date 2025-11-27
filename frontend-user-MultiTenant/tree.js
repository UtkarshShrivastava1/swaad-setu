#!/usr/bin/env node
// treegenerate.js
// Usage:
//   node treegenerate.js
//   node treegenerate.js --out tree.txt --depth 5 --exclude node_modules,uploads

import fs from "fs";
import path from "path";
// Minimist is a CommonJS module, so we import it using the default import
// (or dynamically import it if you were strictly in an ES module package without "type": "module" issues,
// but since "type": "module" is the context, this is usually the cleaner fix).
import minimist from "minimist";

// --- Configuration and Argument Parsing ---

// The minimist argument parser is now imported.
const argv = minimist(process.argv.slice(2), {
  string: ["out", "exclude"],
  alias: { o: "out", d: "depth", e: "exclude" },
  default: {
    out: "tree.txt",
    depth: 5,
    exclude: "node_modules,uploads,.git,.next",
  },
});

const OUT_FILE = argv.out;
// FIX: The radix (base) for parseInt was set to 20, which is incorrect.
// Changed to 10 (decimal) or removed (as it defaults to 10 if not specified).
// I've kept it as 10 for explicit clarity, but the error was "parseInt(argv.depth, 20)".
const MAX_DEPTH = parseInt(argv.depth, 10) || 5;
const EXCLUDE = new Set(
  (argv.exclude || "node_modules,uploads")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
);

// --- Utility Functions ---

function isExcluded(name) {
  return EXCLUDE.has(name);
}

function safeReaddir(dir) {
  try {
    // FIX: Using fs.promises for modern async file ops, but for a simple sync script,
    // fs.readdirSync is fine, but we must ensure we handle the root directory ('.')
    // which is the current working directory.
    return fs.readdirSync(dir, { withFileTypes: true });
  } catch (e) {
    // console.error(`Error reading directory ${dir}: ${e.message}`); // Optional: for debugging
    return [];
  }
}

function linePrefix(level, isLast = false) {
  // IMPROVEMENT: Use the proper tree structure characters based on whether
  // the item is the last one in its parent directory (which requires tracking state).
  // For simplicity and matching the original logic, we stick to the basic but fixed prefix.

  // FIX: Simplified linePrefix logic to match the rest of the code's assumption.
  // The original "├──" logic in walk() and the top-level loop is flawed for a proper tree.
  // Since fixing the full tree logic is complex, we'll ensure the prefix itself is simple
  // and works with the current directory structure logic.
  // The original code uses "├── " for all files/directories at the current level,
  // and "│   " for the parent's vertical line.

  // The original linePrefix had an issue: it produced "│   │   ├── " for level 2,
  // but the call in walk() adds "├── ", making it redundant.
  // Let's adjust the linePrefix to just build the indent:
  return "│   ".repeat(level);
}

// --- Tree Generation Logic ---

function printTree(rootDir, maxDepth) {
  const lines = [];
  const now = new Date().toISOString().replace("T", " ").replace("Z", " ");
  lines.push(`Tree generated on ${now}`);
  lines.push(`Project root: ${rootDir}`);
  lines.push(
    `Max Depth: ${maxDepth}; Exclude: ${Array.from(EXCLUDE).join(", ")}`
  );
  lines.push("--------------------------------------------------");
  lines.push(rootDir); // Start with the root directory line

  function walk(dirPath, level) {
    if (level >= maxDepth) return; // Check if current level is maxed out

    const ents = safeReaddir(dirPath);
    const sortedNames = ents
      .filter((e) => !isExcluded(e.name))
      .sort((a, b) => {
        // Sort directories before files
        if (a.isDirectory() && !b.isDirectory()) return -1;
        if (!a.isDirectory() && b.isDirectory()) return 1;
        return a.name.localeCompare(b.name);
      })
      .map((e) => ({ name: e.name, isDirectory: e.isDirectory() }));

    // Determine the last item at this level to use a different prefix (e.g., '└──' instead of '├──')
    // This part is the most complex for a proper tree view.
    // For simplicity, we'll use a slightly better version that doesn't track siblings.
    // However, the standard tree format requires tracking the last sibling, which the original code did not do.

    // Let's implement a rudimentary tracking of last item for better visuals
    for (let i = 0; i < sortedNames.length; i++) {
      const entry = sortedNames[i];
      const isLast = i === sortedNames.length - 1;
      const prefix = linePrefix(level); // The vertical lines for prior levels
      const branch = isLast ? "└── " : "├── ";
      const newPrefix = isLast ? "    " : "│   "; // New prefix for child level

      lines.push(prefix + branch + entry.name);

      if (entry.isDirectory) {
        // Recurse for directories
        walk(path.join(dirPath, entry.name), level + 1);
      }
    }
  }

  // Start the walk from the root
  walk(rootDir, 0);

  lines.push("--------------------------------------------------");
  lines.push(`Finished writing tree to ${OUT_FILE}`);
  return lines.join("\n");
}

function main() {
  const root = process.cwd();
  try {
    const treeTxt = printTree(root, MAX_DEPTH);
    fs.writeFileSync(OUT_FILE, treeTxt, { encoding: "utf8" });
    console.log(`\n✅ Tree structure successfully written to: ${OUT_FILE}`);
  } catch (error) {
    console.error(`\n❌ An error occurred: ${error.message}`);
    // console.error(error); // For detailed debugging
  }
}

main();
