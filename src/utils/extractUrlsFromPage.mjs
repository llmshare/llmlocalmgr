import linkify from "./linkify.mjs";

export async function fetchPageAndExtractURLs() {
  const response = await fetch('https://mlc.ai/mlc-llm/docs/prebuilt_models.html');
  const text = await response.text();
  const links = linkify.match(text) || [];
  const huggingFaceURLs = links.filter(link => link.url.startsWith('https://huggingface.co')).map(link => link.url);
  return huggingFaceURLs;
}
