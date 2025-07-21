(() => {
  const _public = {};
  const _private = {};
  const di = {};

  const init = () => {
    const { _is, _ERR } = di;

    _private.schema = {};

    _private.type_handler = {
      'number': {
        validate: ({ value, schema }) => {
          const result = {
            original_value: value,
            value: value,
            errors: [],
            is_valid: true,
          };
          if (!schema.strict) {
            result.value = Number(value);
          }
          if (!_is.number(result.value)) {
            result.errors.push({ field, invalid: 'type', expect: 'number' });
          }
          if (_is.filled_array(result.errors)) {
            result.is_valid = false;
          }
          return result;
        }
      },
      'string': {
        validate: ({ value, schema }) => {
          const result = {
            original_value: value,
            value: value,
            errors: [],
            is_valid: true,
          };
          if (!schema.strict) {
            result.value = _.toString(value);
          }
          if (!_is.string(result.value)) {
            result.errors.push({ field, invalid: 'type', expect: 'string' });
          }
          if (_is.filled_array(result.errors)) {
            result.is_valid = false;
          }
          return result;
        }
      },
      'date': {
        validate: ({ value, schema }) => {
          const result = {
            original_value: value,
            value: value,
            errors: [],
            is_valid: true,
          };
          if (!schema.strict) {
            result.value = Date(value);
          }
          if (!_is.date(result.value)) {
            result.errors.push({ field, invalid: 'type', expect: 'date' });
          }
          if (_is.filled_array(result.errors)) {
            result.is_valid = false;
          }
          return result;
        }
      },
      'boolean': {
        validate: ({ value, schema }) => {
          const result = {
            original_value: value,
            value: value,
            errors: [],
            is_valid: true,
          };
          if (!schema.strict) {
            result.value = value === true || value === 'true' ? true : (value === false || value === 'false' ? false : value);
          }
          if (!_is.boolean(result.value)) {
            result.errors.push({ field, invalid: 'type', expect: 'boolean' });
          }
          if (_is.filled_array(result.errors)) {
            result.is_valid = false;
          }
          return result;
        }
      },
      'object': {
        make_error: ({ field, value, schema }) => {
          return { field, invalid: 'type', expect: 'object' }
        },
        validate: ({ value: object, schema }) => {
          const result = {
            value: object,
            errors: [],
            is_valid: true,
          };
          if (!_is.object(object)) {
            result.errors.push({ field, invalid: 'type', expect: 'object' });
          } else {
            if (schema.strict) {
              for (const key in object) {
                if (!schema[key]) {
                  result.errors.push({ field :`${field ? `${field}.${key}` : key}`, invalid: 'not_specific' });
                }
              }
            }
          }
          if (_is.filled_array(result.errors)) {
            result.is_valid = false;
          }
          return result;
        }
      },
      'array': {
        make_error: ({ field, value, schema }) => {
          return { field, invalid: 'type', expect: 'array' }
        },
        validate: ({ value: array, schema }) => {
          const result = {
            value: array,
            errors: [],
            is_valid: true,
          };
          if (!_is.array(array)) {
            result.errors.push({ field, invalid: 'type', expect: 'array' });
          }
          if (_is.filled_array(result.errors)) {
            result.is_valid = false;
          }
          return result;
        }
      }
    };

    _private.check_handler = {
      'min': {
        allow_types: ['number', 'date', 'integer'],
        make_error: ({ field, schema }) => {
          return { field, invalid: 'min', min_value: schema.check.min };
        },
        check: ({ value, schema }) => {
          return Number(value) >= Number(schema.check.min)
        }
      },
      'min': {
        allow_types: ['number', 'date', 'integer'],
        make_error: ({ field, schema }) => {
          return { field, invalid: 'max', max_value: schema.check.max };
        },
        check: ({ value, schema }) => {
          return Number(value) <= Number(schema.check.max)
        }
      },
      'min_length': {
        allow_types: ['string', 'array'],
        make_error: ({ field, schema }) => {
          return { field, invalid: 'min_length', min_value: schema.check.min_length };
        },
        check: ({ value, schema }) => {
          return value.length >= Number(schema.check.min_length);
        }
      },
      'max_length': {
        allow_types: ['string', 'array'],
        make_error: ({ field, schema }) => {
          return { field, invalid: 'max_length', min_value: schema.check.max_length };
        },
        check: ({ value, schema }) => {
          return value.length <= Number(schema.check.max_length);
        }
      },
    };


    _private.is_schema = (schema) => {
      return _is.object(schema) && typeof schema.type === 'string';
    }

    _private.assert_schema = (schema) => {
      if (_is.array(schema)) {
        if (schema.length > 1) {
          throw new Error('Invalid schema');
        }
      } else {
        if (!_is.filled_object(schema)) {
          throw new Error('Invalid schema');
        }
      }
      if (_private.is_schema(schema)) {

        const schema_properties = [
          'type',
          'require',
          'nullable',
          'strict',
          'check',
        ];

        const is_multi_type_field = schema.type.includes(',');
        const types = is_multi_type_field ? schema.type.split(',') : [schema.type]
        if (types.contain(type => !_private.type_handler[type])) {
          throw new Error('Invalid type');
        }

        for (const property of schema) {
          if (!schema_properties.includes(property)) {
            throw new Error('Invalid property');
          }
        }

        if (_is.filled_object(schema.properties)) {
          if (!schema.type.includes('object')) {
            throw new Error('Properties must in object type');
          }

          if (_private.is_schema(schema.properties)) {
            throw new Error('Properties can not contain type');
          }
        }

        if (!_is.empty(schema.check)) {
          if (!_is.function(schema.check) && !_is.filled_object(schema.check)) {
            throw new Error('Invalid check');
          }

          if (is_multi_type_field) {
            throw new Error('Invalid cannot check multi type');
          }

          if (_is.filled_object(schema.check)) {
            for (const key of schema.check) {
              const check_handler = _private.check_handler[key];

              if (!check_handler) {
                throw new Error('Invalid check');
              }

              if (!check_handler.includes(schema.type)) {
                throw new Error('Invalid check allow type');
              }

            }
          }
        }

        return;
      }
      for (const key in schema) {
        _private.assert_schema(schema[key]);
      }
    }
  
    _private.validate = ({ field = '', value, schema, errors, root, options }) => {

      let type = schema.type;

      if (!_private.is_schema(schema)) {
        if (_is.array(schema)) {
          type = 'array';
        }
        if (_is.object(schema)) {
          type = 'object';
        }
      } else {
        schema.strict = options.strict || schema.strict;
      }
  
      if (schema.require && value === undefined) {
        errors.push({ field, invalid: 'require' });
        return value;
      }
  
      if (value === undefined) {
        if (schema.default != undefined) {
          if (typeof schema.default === 'function') {
            value = schema.default(value);
          } else {
            value = schema.default;
          }
        } else if (schema.nullable) {
          value = null;
        }
      }

      if (value === null && !schema.nullable) {
        errors.push({ field, invalid: 'not nullable' });
        return value;
      }
  
      if (!_is.empty(value)) {

        const is_multi_type_field = type.includes(',');
        const multi_type = is_multi_type_field ? type.split(',') : [type];

        let match_type = null;

        for (const type of multi_type) {
          const type_handler = _private.type_handler[schema.type];
  
          const result = type_handler.validate({ field, value, schema });

          if (!result.is_valid) {
            errors.push(...result.errors);
          }

          if (result.is_valid) {
            match_type = type;
            value = result.value;
            break;
          }
  
        }

        if (!match_type) {
          errors.push({
            invalid: 'type',
            expect: multi_type,
          });
        }

        type = match_type;

        if (type === 'object') {
          const property_schema = _private.is_schema(schema) ? schema.properties : schema;
          for (const key in schema) {
            value[key] = _private.validate({ field: `${field}.${key}`, value: value[key], schema: property_schema, errors, root });
          }
          if (options.remove_additional_field) {
            value = _.pick(value, Object.keys(schema));
          }
        }

        if (type === 'array') {
          let element_schema = null;
          if (Array.isArray(schema)) {
            element_schema = schema[0];
          }
          if (_is.object(schema)) {
            element_schema = schema.element;
          }

          for (const index in value) {
            const element = value[index];
            value[index] = _private.validate({ field: `${field}.${index}`, value: element, schema: element_schema, errors, root });
          }
        }

        if (schema.check) {
          if (typeof schema.check === 'function') {
            const result = schema.check({ value, schema, root });
            errors.push(...result.errors);
          } else {
            for (const check in schema.check) {
              const check_handler = _private.check_handler[check];
              if (check_handler.allow_types.includes('*') || check_handler.allow_types.includes(type)) {
                const check_value = schema.check[check];
                if(!check_handler.check({ value: check_value, schema })) {
                  errors.push(check_handler.make_error({ field, schema }));
                }
              }
            }
          }
        }
      }

      return value;
    }

    _public.add_type_handler = ({ type, validate }) => {
      if (!_is.string(type)) {
        throw new Error('Invalid type');
      }

      if (_is.empty(validate)) {
        throw new Error('Invalid validate');
      }

      if (!_is.function(validate)) {
        throw new Error('Require validate');
      }

      _private.type_handler[type] = {
        ..._private.type_handler[type],
        validate,
      }
    }

    _public.add_check_handler = ({ name, allow_types, make_error, check }) => {
      if (!_is.string(name)) {
        throw new Error('Invalid type');
      }

      if (_is.empty(allow_types)) {
        allow_types = ['*']
      }

      if (!_is.array(allow_types)) {
        throw new Error('Invalid allow type');
      }

      if (_is.empty(make_error)) {
        make_error = () => {
          return { invalid: 'type', custom: true, type }
        };
      }

      if (!_is.function(make_error)) {
        throw new Error('Invalid make error');
      }

      if (_is.empty(check)) {
        throw new Error('Require validate');
      }

      if (!_is.function(check)) {
        throw new Error('Invalid validate');
      }

      _private.check_handler[name] = {
        ..._private.check_handler[name],
        allow_types,
        make_error,
        check,
      }
    }

    _public.assert_schema = ({ code, schema }) => {
      if (!_is.string(code)) {
        throw new Error('Invalid code');
      }

      if (_private.schema[code]) {
        throw new Error('Code exist');
      }

      _private.assert_schema(schema);

      _private.schema[code] = schema;
    }

    _public.validate = ({ code, value, schema, options = ({ is_throw_error: false, strict: false, remove_additional_field: true  }) }) => {
      const result = {
        output: value,
        errors: []
      };
      if (!_private.schema[code]) {
        _public.assert_schema({ code, schema })
      }

      result.output = _private.validate({ field: code, value, schema, errors: result.errors, root, options });

      if (options.is_throw_error) {
        throw new _ERR.ERR_VALIDATION_FAILED({ errors: result.errors })
      }

      return result;
    }

    return _public;
  }
  if (module && module.exports) {
    di._is = require('./_is.utils.share');
    di._ERR = require('./_ERR.utils.share');
    module.exports = init();
  } else if (window) {
    di = window;
    window._public = _public;
  }
})();