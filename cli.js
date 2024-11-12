#!/usr/bin/env node
import { program } from "commander";
import { sync } from "glob";
import { extname, resolve, basename as _basename, dirname, relative } from "path";
import { readFile, mkdir, writeFile as _writeFile } from "fs/promises";
import { EOL } from "os";
import { readQsp, readQsps, writeQsp, writeQsps } from "@qsp/converters";
import { TextDecoder } from "util";
import languageEncoding from "detect-file-encoding-and-language";

program.name("qsp-cli").description("CLI tools for QSP").version("1.0.0");

program
  .argument("<input-files>", "File(s) to convert - supports glob patterns")
  .option("--directory <output-directory>", "Path to save the converted file")
  .option("--unicode", "Save qsps files in utf16 encoding compatible with old txt2gam");

program.parse();

const { unicode, directory: outputDirectory } = program.opts();

const files = program.args.reduce(
  (acc, pattern) => [...acc, ...sync(pattern, { nodir: true })],
  [],
);

if (!files.length) {
  console.log("No matching files found");
  process.exit(1);
}

for (const file of new Set(files)) {
  converFile(file, outputDirectory, unicode);
}

function converFile(filePath, outputDirectory, unicode) {
  const ext = extname(filePath).toLowerCase();
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
  const content = await readFile(resolve(filePath));
  const locations = readQsp(content.buffer);
  let converted = writeQsps(locations, EOL);
  if (unicode) {
    const utf16buffer = Buffer.from(`\ufeff${converted}`, "utf16le");
    converted = new Uint8Array(utf16buffer);
  }

  const outPath = await writeFile(filePath, outputDirectory, ".qsps", converted);

  console.log(`Finished converting ${filePath} -> ${outPath}`);
}

async function convertQspsFile(filePath, outputDirectory) {
  let { encoding } = await languageEncoding(filePath);
  const data = await readFile(resolve(filePath));
  if (!encoding) {
    encoding = data[1] === 0 ? "utf-16le" : "utf-8";
  }
  const decoder = new TextDecoder(encoding || "utf-8");
  const content = decoder.decode(data);
  const locations = readQsps(content);
  const converted = writeQsp(locations);

  const outPath = await writeFile(filePath, outputDirectory, ".qsp", new Uint8Array(converted));

  console.log(`Finished converting ${filePath} -> ${outPath}`);
}

async function writeFile(filePath, outputDirectory, outExtension, content) {
  const ext = extname(filePath);
  const basename = _basename(filePath, ext);
  const directory = dirname(filePath);
  const targetDirectory = outputDirectory ? resolve(outputDirectory, directory) : directory;
  const outPath = resolve(targetDirectory, basename + outExtension);

  await mkdir(targetDirectory, { recursive: true });
  await _writeFile(outPath, content);

  return `${outputDirectory ? outputDirectory + "/" : ""}${
    outputDirectory ? relative(resolve(outputDirectory), targetDirectory) : directory
  }/${basename}${outExtension}`;
}
