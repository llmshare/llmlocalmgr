import { downloadFile, listFiles } from '@huggingface/hub';
import { dirname } from 'path';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream';
import { access, mkdir } from 'fs/promises';
import { promisify } from 'util';
import { log } from '../utils/logger.mjs';
const pipelineAsync = promisify(pipeline);

async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch (error) {
    return false;
  }
}

export async function downloadFromHub(targetDir, modelRepoOrPath, revision) {
  const files = listFiles({ repo: modelRepoOrPath, recursive: true, revision });

  await mkdir(targetDir, { recursive: true });
  try {
    for await (const file of files) {
      if (file.type === 'directory') {
        continue;
      }

      const response = await downloadFile({ repo: modelRepoOrPath, path: file.path, revision });
      log('info', `Downloaded ${modelRepoOrPath} --> ${file.path}...`);

      if (!response?.body) {
        throw new Error(`Error downloading ${file.path}`);
      }

      const targetFile = `${targetDir}/${file.path}`;
      const targetPath = dirname(targetFile);
      if (!await fileExists(targetPath)) {
        await mkdir(targetPath, { recursive: true });
      } else {
        log('success', `Already Downloaded ${modelRepoOrPath} --> ${file.path}...`);
      }

      const writeStream = createWriteStream(targetFile);
      await pipelineAsync(response.body, writeStream);
    }
  } catch (e) {
    console.error(e);
    throw await e;
  }
}


