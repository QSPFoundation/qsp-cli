/* eslint-disable no-process-exit */
const { program } = require("commander");
const glob = require("glob");
const path = require("path");
const fs = require("fs/promises");
const os = require("os");
const { readQsp, readQsps, writeQsp, writeQsps } = require("@qsp/converters");
const { TextDecoder } = require("util");
const languageEncoding = require("detect-file-encoding-and-language");

program.name("qsp-cli").description("CLI tools for QSP").version("1.0.0");

program
  .argument("<input-file>", "File to convert")
  .argument("[output-directory]", "Path to save the converter file")
  .option("--unicode");

program.parse();

const [inputArg, outputDirectory] = program.args;
const { unicode } = program.opts();

const files = glob.sync(inputArg, { nodir: true });

if (!files.length) {
  console.log("No matching files found");
  process.exit(1);
}

for (const file of files) {
  converFile(file, outputDirectory, unicode);
}

function converFile(filePath, outputDirectory, unicode) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".qsp":
    case ".gam":
      return convertQspFile(filePath, outputDirectory, unicode);
    case ".qsps":
    case ".qsp-txt":
    case ".txt-qsp":
      return convertQspsFile(filePath, outputDirectory);
  }

  console.log(`Unknown file format: ${ext}`);
  process.exit(1);
}

async function convertQspFile(filePath, outputDirectory, unicode) {
  const content = await fs.readFile(path.resolve(filePath));
  const locations = readQsp(content.buffer);
  let converted = writeQsps(locations, os.EOL);
  if (unicode) {
    const utf16buffer = Buffer.from(`\ufeff${converted}`, 'utf16le');
    converted = new Uint8Array(utf16buffer);
  }

  const outPath = await writeFile(filePath, outputDirectory, ".qsps", converted);

  console.log(`Finished convertting ${filePath} -> ${outPath}`);
}

async function convertQspsFile(filePath, outputDirectory) {
  const { encoding } = await languageEncoding(filePath);
  const data = await fs.readFile(path.resolve(filePath));
  const decoder = new TextDecoder(encoding);
  const content = decoder.decode(data);
  const locations = readQsps(content);
  const converted = writeQsp(locations);

  const outPath = await writeFile(filePath, outputDirectory, ".qsp", new Uint8Array(converted));

  console.log(`Finished convertting ${filePath} -> ${outPath}`);
}

async function writeFile(filePath, outputDirectory, outExtension, content) {
  const ext = path.extname(filePath);
  const basename = path.basename(filePath, ext);
  const directory = path.dirname(filePath);
  const targetDirectory = path.resolve(outputDirectory || directory);
  const outPath = path.resolve(targetDirectory, basename + outExtension);

  await fs.mkdir(targetDirectory, { recursive: true });
  await fs.writeFile(outPath, content);

  return `${outputDirectory || directory}/${basename}${outExtension}`;
}
