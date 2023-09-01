export function buildDataStructure(huggingFaceURLs) {
  const dataStructure = {
    models: huggingFaceURLs.map(url => ({
      url,
      name: url.split('/').pop() || '',
      modelRepoOrPath: url.split('/').slice(-2).join('/')
    })),
  };
  return dataStructure;
}
