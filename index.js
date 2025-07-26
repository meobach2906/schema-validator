const _validate = require('./src/utils/share/_validate.utils.share');

if (module && module.exports) {
  module.exports = _validate;
} else if (window) {
  di = window;
  window.validator = _validate;
}