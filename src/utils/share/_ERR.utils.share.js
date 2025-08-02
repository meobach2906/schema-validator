'use strict';

(() => {

  class ERR extends Error {
    static CODE = 'ERR'
    constructor(props) {
      super();
      this.reactions = ['FIX_DATA'];
      if (props) {
        Object.assign(this, props)
      }
    }
  }

  class ERR_VALIDATION_FAILED extends Error {
    static CODE = 'ERR_VALIDATION_FAILED'
    constructor({ errors }) {
      super();
      this.code = ERR_VALIDATION_FAILED.CODE;
      this.errors = errors;
      this.reactions = ['FIX_DATA'];
    }
  }
  
  const _ERR = {
    ERR,
    ERR_VALIDATION_FAILED,
  };

  if (module && module.exports) {
    module.exports = _ERR;
  } else if (window) {
    _di = window;
    window._ERR = _ERR;
  }
})();