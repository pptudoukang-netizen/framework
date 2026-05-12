#!/usr/bin/env node

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const PROJECT_MANIFEST = 'project.manifest';
const VERSION_MANIFEST = 'version.manifest';

const DEFAULT_EXCLUDE_PATTERNS = [
  PROJECT_MANIFEST,
  VERSION_MANIFEST,
  `**/${PROJECT_MANIFEST}`,
  `**/${VERSION_MANIFEST}`,
  '*.manifest.tmp',
  '**/*.manifest.tmp',
  '*.meta',
  '**/*.meta',
  '.DS_Store',
  '**/.DS_Store',
  'Thumbs.db',
  '**/Thumbs.db',
];

function main() {
  try {
    const args = parseArgs(process.argv.slice(2));
    if (args.help) {
      printHelp();
      return;
    }

    const configPath = resolveProjectPath(args.config || 'tools/hotupdate/hotupdate.config.json');
    const config = loadConfig(configPath);
    const selectedTargets = selectTargets(config.targets, args.target);

    for (const target of selectedTargets) {
      const result = generateTargetManifest(target, args.version);
      console.log(
        `[hotupdate] ${result.name}: ${result.assetCount} assets, ${result.totalSize} bytes -> ${result.outputDir}`,
      );
    }
  } catch (error) {
    console.error(`[hotupdate] ${error.message}`);
    process.exit(1);
  }
}

function parseArgs(argv) {
  const args = {};

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === '--help' || arg === '-h') {
      args.help = true;
      continue;
    }

    if (arg === '--config' || arg === '-c') {
      args.config = readArgValue(argv, i, arg);
      i += 1;
      continue;
    }

    if (arg === '--target' || arg === '-t') {
      args.target = readArgValue(argv, i, arg);
      i += 1;
      continue;
    }

    if (arg === '--version' || arg === '-v') {
      args.version = readArgValue(argv, i, arg);
      i += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return args;
}

function readArgValue(argv, index, name) {
  const value = argv[index + 1];
  if (!value || value.startsWith('-')) {
    throw new Error(`${name} requires a value.`);
  }

  return value;
}

function printHelp() {
  console.log(`Usage:
  node tools/hotupdate/generate-manifest.js --config tools/hotupdate/hotupdate.config.json

Options:
  -c, --config <path>    Manifest generation config. Defaults to tools/hotupdate/hotupdate.config.json
  -t, --target <names>   Optional target name list, separated by comma. Example: full,shell
  -v, --version <ver>    Optional version override for selected targets.
  -h, --help             Show this help.
`);
}

function resolveProjectPath(inputPath) {
  if (typeof inputPath !== 'string' || inputPath.trim().length === 0) {
    throw new Error('Path value is required.');
  }

  return path.resolve(process.cwd(), inputPath);
}

function loadConfig(configPath) {
  assertFileExists(configPath, 'Config file does not exist');

  const raw = fs.readFileSync(configPath, 'utf8');
  let config;
  try {
    config = JSON.parse(raw);
  } catch (error) {
    throw new Error(`Invalid JSON config '${configPath}': ${error.message}`);
  }

  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    throw new Error('Hot update config root must be an object.');
  }

  if (!Array.isArray(config.targets) || config.targets.length === 0) {
    throw new Error('Hot update config requires a non-empty targets array.');
  }

  validateDuplicateTargets(config.targets);
  return config;
}

function validateDuplicateTargets(targets) {
  const names = new Set();
  for (const target of targets) {
    const name = assertNonEmptyString(target && target.name, 'target.name is required.');
    if (names.has(name)) {
      throw new Error(`Duplicate manifest target name: ${name}`);
    }
    names.add(name);
  }
}

function selectTargets(targets, targetNames) {
  if (!targetNames) {
    return targets;
  }

  const requestedNames = targetNames
    .split(',')
    .map((name) => name.trim())
    .filter((name) => name.length > 0);

  if (requestedNames.length === 0) {
    throw new Error('--target requires at least one target name.');
  }

  const targetMap = new Map(targets.map((target) => [target.name, target]));
  return requestedNames.map((name) => {
    const target = targetMap.get(name);
    if (!target) {
      throw new Error(`Manifest target '${name}' is not defined in config.`);
    }
    return target;
  });
}

function generateTargetManifest(target, versionOverride) {
  const normalized = normalizeTarget(target, versionOverride);
  const matchers = buildMatchers(normalized);
  const files = collectAssetFiles(normalized.sourceDir, matchers);

  if (files.length === 0) {
    throw new Error(`Target '${normalized.name}' matched no files in '${normalized.sourceDir}'.`);
  }

  const assets = {};
  let totalSize = 0;

  for (const file of files) {
    const stat = fs.statSync(file.absolutePath);
    const md5 = createFileMd5(file.absolutePath);
    assets[file.relativePath] = {
      size: stat.size,
      md5,
    };
    totalSize += stat.size;
  }

  const baseManifest = {
    packageUrl: normalized.packageUrl,
    remoteVersionUrl: normalized.remoteVersionUrl,
    remoteManifestUrl: normalized.remoteManifestUrl,
    version: normalized.version,
  };

  const projectManifest = {
    ...baseManifest,
    assets,
    searchPaths: normalized.searchPaths,
  };

  ensureDirectory(normalized.outputDir);
  writeJson(path.join(normalized.outputDir, PROJECT_MANIFEST), projectManifest);
  writeJson(path.join(normalized.outputDir, VERSION_MANIFEST), baseManifest);

  return {
    name: normalized.name,
    assetCount: files.length,
    totalSize,
    outputDir: normalized.outputDir,
  };
}

function normalizeTarget(target, versionOverride) {
  if (!target || typeof target !== 'object' || Array.isArray(target)) {
    throw new Error('Each manifest target must be an object.');
  }

  const name = assertNonEmptyString(target.name, 'target.name is required.');
  const version = assertNonEmptyString(versionOverride || target.version, `${name}.version is required.`);
  const sourceDir = resolveProjectPath(assertNonEmptyString(target.sourceDir, `${name}.sourceDir is required.`));
  const outputDir = resolveProjectPath(assertNonEmptyString(target.outputDir, `${name}.outputDir is required.`));
  const packageUrl = assertHttpUrl(assertNonEmptyString(target.packageUrl, `${name}.packageUrl is required.`), `${name}.packageUrl`);
  const remoteVersionUrl = assertHttpUrl(
    assertNonEmptyString(target.remoteVersionUrl, `${name}.remoteVersionUrl is required.`),
    `${name}.remoteVersionUrl`,
  );
  const remoteManifestUrl = assertHttpUrl(
    assertNonEmptyString(target.remoteManifestUrl, `${name}.remoteManifestUrl is required.`),
    `${name}.remoteManifestUrl`,
  );

  if (!packageUrl.endsWith('/')) {
    throw new Error(`${name}.packageUrl must end with '/'.`);
  }

  assertDirectoryExists(sourceDir, `${name}.sourceDir does not exist or is not a directory`);

  return {
    name,
    version,
    sourceDir,
    outputDir,
    packageUrl,
    remoteVersionUrl,
    remoteManifestUrl,
    searchPaths: normalizeStringArray(target.searchPaths, `${name}.searchPaths`),
    include: normalizeStringArray(target.include, `${name}.include`),
    exclude: normalizeStringArray(target.exclude, `${name}.exclude`),
  };
}

function assertNonEmptyString(value, message) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(message);
  }

  return value.trim();
}

function assertHttpUrl(value, fieldName) {
  let parsed;
  try {
    parsed = new URL(value);
  } catch (error) {
    throw new Error(`${fieldName} must be a valid URL.`);
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(`${fieldName} must use http or https.`);
  }

  return value;
}

function normalizeStringArray(value, fieldName) {
  if (value === undefined) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw new Error(`${fieldName} must be an array when provided.`);
  }

  return value.map((item, index) =>
    assertNonEmptyString(item, `${fieldName}[${index}] must be a non-empty string.`),
  );
}

function assertFileExists(filePath, message) {
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    throw new Error(`${message}: ${filePath}`);
  }
}

function assertDirectoryExists(dirPath, message) {
  if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) {
    throw new Error(`${message}: ${dirPath}`);
  }
}

function ensureDirectory(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function buildMatchers(target) {
  const include = target.include.map(globToRegExp);
  const exclude = [...DEFAULT_EXCLUDE_PATTERNS, ...target.exclude].map(globToRegExp);

  return {
    include,
    exclude,
  };
}

function collectAssetFiles(sourceDir, matchers) {
  const results = [];
  walkDirectory(sourceDir, (absolutePath) => {
    const relativePath = toManifestPath(path.relative(sourceDir, absolutePath));
    if (!shouldInclude(relativePath, matchers)) {
      return;
    }

    results.push({
      absolutePath,
      relativePath,
    });
  });

  results.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
  return results;
}

function walkDirectory(dirPath, onFile) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  entries.sort((a, b) => a.name.localeCompare(b.name));

  for (const entry of entries) {
    const absolutePath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      walkDirectory(absolutePath, onFile);
      continue;
    }

    if (entry.isFile()) {
      onFile(absolutePath);
    }
  }
}

function shouldInclude(relativePath, matchers) {
  if (matchers.include.length > 0 && !matchers.include.some((matcher) => matcher.test(relativePath))) {
    return false;
  }

  return !matchers.exclude.some((matcher) => matcher.test(relativePath));
}

function globToRegExp(pattern) {
  const normalized = toManifestPath(pattern);
  let regex = '^';

  for (let i = 0; i < normalized.length; i += 1) {
    const char = normalized[i];

    if (char === '*') {
      if (normalized[i + 1] === '*') {
        if (normalized[i + 2] === '/') {
          regex += '(?:.*/)?';
          i += 2;
        } else {
          regex += '.*';
          i += 1;
        }
      } else {
        regex += '[^/]*';
      }
      continue;
    }

    if (char === '?') {
      regex += '[^/]';
      continue;
    }

    regex += escapeRegExp(char);
  }

  regex += '$';
  return new RegExp(regex);
}

function escapeRegExp(char) {
  return char.replace(/[|\\{}()[\]^$+?.]/g, '\\$&');
}

function createFileMd5(filePath) {
  const hash = crypto.createHash('md5');
  hash.update(fs.readFileSync(filePath));
  return hash.digest('hex');
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function toManifestPath(value) {
  return value.split(path.sep).join('/').replace(/\\/g, '/');
}

main();
