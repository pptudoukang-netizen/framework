const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const childProcess = require('child_process');

const projectRoot = path.resolve(__dirname, '..', '..');
const protoRoot = path.join(projectRoot, 'assets', 'scripts', 'core', 'network', 'examples', 'proto');
const outputRoot = path.join(projectRoot, 'assets', 'scripts', 'core', 'network', 'examples', 'generated');
const protoc = path.join(projectRoot, 'node_modules', '.bin', process.platform === 'win32' ? 'protoc.cmd' : 'protoc');
const tsProtoPlugin = path.join(projectRoot, 'node_modules', '.bin', process.platform === 'win32' ? 'protoc-gen-ts_proto.cmd' : 'protoc-gen-ts_proto');

function collectProtoFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const result = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      result.push(...collectProtoFiles(fullPath));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith('.proto')) {
      result.push(fullPath);
    }
  }

  return result;
}

function assertFileExists(filePath, label) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`${label} not found: ${filePath}. Run npm install first.`);
  }
}

function createUuid() {
  const bytes = crypto.randomBytes(16);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = bytes.toString('hex');
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20),
  ].join('-');
}

function ensureTypeScriptMeta(filePath) {
  const metaPath = `${filePath}.meta`;
  if (fs.existsSync(metaPath)) {
    return;
  }

  const meta = {
    ver: '4.0.24',
    importer: 'typescript',
    imported: true,
    uuid: createUuid(),
    files: [],
    subMetas: {},
    userData: {},
  };

  fs.writeFileSync(metaPath, `${JSON.stringify(meta, null, 2)}\n`);
}

assertFileExists(protoc, '@protobuf-ts/protoc');
assertFileExists(tsProtoPlugin, 'ts-proto plugin');

const protoFiles = collectProtoFiles(protoRoot);
if (protoFiles.length === 0) {
  throw new Error(`No .proto files found under ${protoRoot}.`);
}

fs.mkdirSync(outputRoot, { recursive: true });

const args = [
  `--plugin=protoc-gen-ts_proto=${tsProtoPlugin}`,
  `--ts_proto_out=${outputRoot}`,
  `--proto_path=${protoRoot}`,
  '--ts_proto_opt=forceLong=number,useExactTypes=false,outputJsonMethods=false,outputClientImpl=false,esModuleInterop=false',
  ...protoFiles,
];

childProcess.execFileSync(protoc, args, {
  cwd: projectRoot,
  stdio: 'inherit',
});

const generatedFiles = fs.readdirSync(outputRoot)
  .filter((fileName) => fileName.endsWith('.ts'))
  .map((fileName) => path.join(outputRoot, fileName));

for (const generatedFile of generatedFiles) {
  ensureTypeScriptMeta(generatedFile);
}

console.log(`Generated ${generatedFiles.length} proto TypeScript file(s) under ${outputRoot}.`);
