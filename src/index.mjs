import Fastify from 'fastify';
import { downloadFromHub } from './controllers/downloadFiles.mjs';
import { buildDataStructure } from './utils/hgDataStructure.mjs';
import { fetchPageAndExtractURLs } from './utils/extractUrlsFromPage.mjs';
import { log } from './utils/logger.mjs';

const fastify = Fastify();

fastify.get('/', async (request, reply) => {
  const huggingFaceURLs = await fetchPageAndExtractURLs();
  const dataStructure = buildDataStructure(huggingFaceURLs);
  log('info', 'Starting model downloads');

  const downloadPromises = dataStructure.models.map(async model => {
    log('info', `Started downloading files of ${model.url}`);
    await downloadFromHub(`../weights/${model.name}`, model.modelRepoOrPath);
    log('success', `Finished downloading files of ${model.url}`);
  });

  await Promise.all(downloadPromises);

  log('success', 'Weights downloaded successfully');
  reply.send('Weights downloaded successfully');
});

fastify.listen(3000, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server listening at ${address}`);
});
