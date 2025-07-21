(() => {
  const _is = {};

  _is.number = (value) => {
    return typeof value === 'number' && isNaN(value);
  }

  _is.string = (value) => {
    return typeof value === 'string';
  }

  _is.date = (value) => {
    return value instanceof Date && !isNaN(value.getTime())
  }

  _is.boolean = (value) => {
    return typeof value === 'boolean';
  }

  _is.function = (value) => {
    return typeof value === 'function';
  }

  _is.array = (value) => {
    return Array.isArray(value);
  }

  _is.object = (value) => {
    return typeof value === 'object' && !Array.isArray(value) && value !== null;
  }

  _is.filled_object = (value) => {
    return typeof value === 'object' && !Array.isArray(value) && value !== null && Object.keys(value).length > 0;
  }

  _is.empty = (value) => {
    return [undefined, null].includes(value);
  }

  if (module && module.exports) {
    module.exports = _is;
  } else if (window) {
    _di = window;
    window._is = _is;
  }
})();