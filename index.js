const _validate = require("./src/utils/share/_validate.utils.share");

_validate.compile({
  code: "",
  schema: [{
    string: { type: 'string', require: true, nullable: false },
    strict_string: { type: 'string', require: true, nullable: false, strict: true },
    date_convert_to_iso_string_then_lowercase: { type: 'date', require: true, nullable: false, to: `iso_datetime,lowercase` },
    strict_object: {
      string: { type: 'string' },
    },
    set: { type: 'array', element: { type: 'string' }, check: { set: true } },
    unique_code: { type: 'array', check: { unique: 'code' }, element: { code: { type: 'string' }, age: { type: 'number' } } },
    boolean: { type: 'boolean', strict: false },
    number_min_5_max_3: { type: 'number', check: { min: 5, max: 3 } },
    custom: {
      type: 'string',
      default: ({info}) => {
        const { input } = info;
        if (input.length > 0 ) return 'array>0';
        return 'string' 
      },
      check: ({ info, value }) => {
        if (value > 3) return { errors: [{ invalid: 'min_3', field: info.field }] }
        return { errors: [] }
      },
      to: ({ value }) => String(value).toUpperCase(),
    }
  }],
});


const result = _validate.validate({ code: '', input: {
  string: undefined,
  strict_string: 3,
  date_convert_to_iso_string_then_lowercase: new Date(),
  strict_object: 'string',
  set: ['1', '2', '1'],
  unique_code: [{ code: 1, age: 1 }, { code: 2 }, { code: 1, age: 2 }, { code: 1, age: 1 }],
  boolean: 'true',
  number_min_5_max_3: 4,
}})

if (module && module.exports) {
  module.exports = _validate;
} else if (window) {
  di = window;
  window.validator = _validate;
}
