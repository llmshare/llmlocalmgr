import Fastify from 'fastify';
import linkifyIt from 'linkify-it';
import { downloadFile, listFiles } from '@huggingface/hub';
import { access, mkdir } from 'fs/promises';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream';
import { promisify } from 'util';
import { dirname } from 'path';

const fastify = Fastify();
const pipelineAsync = promisify(pipeline);

const linkify = linkifyIt();
linkify.add('hf:', 'https:');

async function fetchPageAndExtractURLs() {
  const response = await fetch('https://mlc.ai/mlc-llm/docs/prebuilt_models.html');
  const text = await response.text();
  const links = linkify.match(text) || [];
  const huggingFaceURLs = links.filter(link => link.url.startsWith('https://huggingface.co')).map(link => link.url);
  return huggingFaceURLs;
}

async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch (error) {
    return false;
  }
}

function buildDataStructure(huggingFaceURLs) {
  const dataStructure = {
    models: huggingFaceURLs.map(url => ({
      url,
      name: url.split('/').pop() || '',
      modelRepoOrPath: url.split('/').slice(-2).join('/')
    })),
  };
  return dataStructure;
}

async function downloadFromHub(targetDir, modelRepoOrPath, revision) {
  const files = await listFiles({ repo: modelRepoOrPath, recursive: true, revision });
  console.log(modelRepoOrPath,files)

  await mkdir(targetDir, { recursive: true });
  try {
    for await (const file of files) {
      if (file.type === 'directory') {
        continue;
      }

      console.log(`Downloading ${modelRepoOrPath} - ${file.path}...`);
      const response = await downloadFile({ repo: modelRepoOrPath, path: file.path, revision });
      if (!response?.body) {
        throw new Error(`Error downloading ${file.path}`);
      }

      const targetFile = targetDir + '/' + file.path;
      const targetPath = dirname(targetFile);
      if (!await fileExists(targetPath)) {
        await mkdir(targetPath, { recursive: true });
      }

      const writeStream = createWriteStream(targetDir + '/' + file.path);
      await pipelineAsync(response.body, writeStream);
    }
  } catch (e) {
    console.error(e);
    throw await e;
  }
}

fastify.get('/', async (request, reply) => {
  const huggingFaceURLs = await fetchPageAndExtractURLs();
  const dataStructure = buildDataStructure(huggingFaceURLs);
  console.log(dataStructure)
  for (const model of dataStructure.models) {
    console.log("Started downloading files of ", model.url)
    await downloadFromHub(`./weights/${model.name}`, model.modelRepoOrPath);
    console.log("Finished downloading files of", model.url)
  }
  reply.send('Weights downloaded successfully');
});

fastify.listen(3000, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server listening at ${address}`);
});
