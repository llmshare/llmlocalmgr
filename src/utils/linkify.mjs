import linkifyIt from 'linkify-it';

const linkify = linkifyIt();
linkify.add('hf:', 'https:');
export default linkify
