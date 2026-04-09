import {
  CompressPDFJob,
  CompressPDFParams,
  CompressPDFResult,
  CompressionLevel,
  MimeType,
  PDFServices,
  SDKError,
  ServiceApiError,
  ServiceUsageError,
  ServicePrincipalCredentials,
} from "@adobe/pdfservices-node-sdk";
import { createReadStream, createWriteStream, existsSync } from "node:fs";
import { readdir, rename, rm } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { pipeline } from "node:stream/promises";

const CLIENT_ID = process.env.PDF_SERVICES_CLIENT_ID;
const CLIENT_SECRET = process.env.PDF_SERVICES_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  throw new Error(
    "Set PDF_SERVICES_CLIENT_ID and PDF_SERVICES_CLIENT_SECRET environment variables.",
  );
}

async function compressPDF(
  pdfServices: PDFServices,
  inputPath: string,
  outputPath: string,
): Promise<void> {
  const readStream = createReadStream(inputPath);
  const inputAsset = await pdfServices.upload({
    readStream,
    mimeType: MimeType.PDF,
  });

  const params = new CompressPDFParams({
    compressionLevel: CompressionLevel.MEDIUM,
  });
  const job = new CompressPDFJob({ inputAsset, params });
  const pollingURL = await pdfServices.submit({ job });

  const jobResult = await pdfServices.getJobResult({
    pollingURL,
    resultType: CompressPDFResult,
  });

  const resultAsset = jobResult.result?.asset;
  if (!resultAsset) {
    throw new Error("No result asset in the job response.");
  }

  const streamAsset = await pdfServices.getContent({ asset: resultAsset });
  await pipeline(streamAsset.readStream, createWriteStream(outputPath));
}

try {
  const credentials = new ServicePrincipalCredentials({
    clientId: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
  });

  const pdfServices = new PDFServices({ credentials });
  const desktopDir = join(homedir(), "Desktop");

  if (!existsSync(desktopDir)) {
    throw new Error(`Desktop directory not found at ${desktopDir}`);
  }

  const files = await readdir(desktopDir);
  const pdfFiles = files.filter(
    (f) => f.toLowerCase().endsWith(".pdf") && !f.startsWith("."),
  );

  if (pdfFiles.length === 0) {
    console.log(`No PDF files found on ${desktopDir}.`);
  } else {
    console.log(
      `Found ${pdfFiles.length} PDF file(s) on ${desktopDir}. Starting compression...`,
    );

    for (const file of pdfFiles) {
      const filePath = join(desktopDir, file);
      const tempOutputPath = join(desktopDir, `.${file}.tmp`);

      console.log(`Compressing: ${filePath}`);
      try {
        await compressPDF(pdfServices, filePath, tempOutputPath);
        await rename(tempOutputPath, filePath);
        console.log(`Successfully compressed and overwritten: ${filePath}`);
      } catch (err) {
        console.error(
          `Failed to compress ${file}:`,
          err instanceof Error ? err.message : err,
        );
        if (existsSync(tempOutputPath)) {
          await rm(tempOutputPath);
        }
      }
    }
  }
} catch (err) {
  if (err instanceof SDKError || err instanceof ServiceUsageError) {
    console.error("SDK error:", err.message);
  } else if (err instanceof ServiceApiError) {
    console.error("API error:", err.message, err.statusCode);
  } else {
    console.error("Error:", err instanceof Error ? err.message : err);
  }
  process.exit(1);
}
