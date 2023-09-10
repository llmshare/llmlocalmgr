export function buildMLCLocalConfig(huggingFaceURLs) {
    const modelList = [];
    const modelLibMap = {};
  
    huggingFaceURLs.forEach(url => {
      const urlParts = url.split('/');
      const modelName = urlParts[urlParts.length - 1];
  
      modelList.push({
        model_url: `${process.env.HOST_URL}/${modelName}/params/`,
        local_id: modelName,
      });
  
      modelLibMap[modelName] = `${process.env.HOST_URL}/${modelName}/${modelName}-webgpu.wasm`;
    });
  
    return {
      model_list: modelList,
      model_lib_map: modelLibMap,
    };
  }