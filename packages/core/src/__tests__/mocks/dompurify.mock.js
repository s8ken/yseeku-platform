module.exports = {
  sanitize: (val) => val.replace(/<script>.*?<\/script>/gi, '').replace(/onerror/gi, '')
};
