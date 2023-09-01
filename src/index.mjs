import { downloadFromHub } from './controllers/downloadFiles.mjs';
import { buildDataStructure } from './utils/hgDataStructure.mjs';
import { fetchPageAndExtractURLs } from './utils/extractUrlsFromPage.mjs';
import { log } from './utils/logger.mjs';
import fastify from 'fastify';
import promiseLimitter from "./utils/concurrency-limit/promise-limitter.mjs"
import { config as dotenvConfig } from 'dotenv';

dotenvConfig();
const server = fastify();
console.log(process.env.MODEL_DOWNLOAD_CONCURRENCY)
const downloadConcurrency = parseInt(process.env.MODEL_DOWNLOAD_CONCURRENCY) || 3;
const limit = promiseLimitter(downloadConcurrency);

server.get('/', async (request, reply) => {
  try {
    const huggingFaceURLs = await fetchPageAndExtractURLs();
    const dataStructure = buildDataStructure(huggingFaceURLs);
    log('info', 'Starting model downloads');

    const downloadPromises = dataStructure.models.map(model => {
      return limit(() => {
        log('info', `Started downloading files of ${model.url}`);
        return downloadFromHub(`./weights/${model.name}`, model.modelRepoOrPath)
          .then(() => {
            log('success', `Finished downloading files of ${model.url}`);
          })
          .catch(() => {
            log('error', `Error downloading files of ${model.url}`);
          });
      });
    });

    const results = await Promise.allSettled(downloadPromises);
    const failedDownloads = results.filter(result => result.status === 'rejected');

    if (failedDownloads.length > 0) {
      log('error', `${failedDownloads.length} model(s) failed to download.`);
      reply.send(`${failedDownloads.length} model(s) failed to download.`);
    } else {
      log('success', 'Weights downloaded successfully');
      reply.send('Weights downloaded successfully');
    }
  } catch (error) {
    log('error', 'An error occurred');
    reply.send('An error occurred');
  }
});

server.listen({ port: 8080 }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }

  console.log(`Server listening at ${address}`);
});

