import { Command, program } from 'commander';
import { downloadFromHub } from './controllers/downloadFiles.mjs';
import { buildDataStructure } from './utils/hgDataStructure.mjs';
import { fetchPageAndExtractURLs } from './utils/extractUrlsFromPage.mjs';
import { log } from './utils/logger.mjs';
import fastify from 'fastify';
import promiseLimitter from "./utils/concurrency-limit/promise-limitter.mjs"
import { config as dotenvConfig } from 'dotenv';
import { buildMLCLocalConfig } from './controllers/buildMLCLocalConfig.mjs';


dotenvConfig();
const server = fastify();
const downloadConcurrency = parseInt(process.env.MODEL_DOWNLOAD_CONCURRENCY) || 4;
const limit = promiseLimitter(downloadConcurrency);
const cli = new Command();

program
 .name('llmlocalmgr')
 .description('Manages and serves huggingface Weights on your local storage')
 .version('0.1.0');



program.command('download')
  .description('Download the currently selected set of weights')
  .action(() => {
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

  });

program.command('list')
  .description('List currently selected weights')
  .action(async () => {
    const huggingFaceURLs = await fetchPageAndExtractURLs();
    const config = buildMLCLocalConfig(huggingFaceURLs);
    config.model_list.forEach( (m) => {
      console.log(m.local_id + "," + m.model_url);
    })
  
  });

program.parse();

