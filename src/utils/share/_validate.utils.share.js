(() => {
  const _public = {};
  const di = {};

  const init = () => {
    const { _, _is, _ERR } = di;

    const _private = {
      schema: {},
      type_handler: {},
      check_handler: {},
      to_handler: {},
      is_schema: (schema) => {
        return _is.object(schema) && _is.string(schema.type);
      },
      is_object_schema: (schema) => {
        return _is.object(schema) && (_is.empty(schema.type) || _is.object(schema.type));
      },
      is_array_schema: (schema) => {
        return _is.array(schema);
      },
      assert_schema: (schema) => {
        if (!_private.is_schema(schema) && !_private.is_object_schema(schema) && !(_private.is_array_schema(schema) && schema.length === 1)) {
          throw new Error('Invalid schema: schema not correct');
        }
  
        if (_private.is_schema(schema)) {
  
          const schema_properties = [
            'type',
            'require',
            'nullable',
            'enum',
            'default',
            'strict',
            'properties',
            'element',
            'check',
            'to'
          ];
  
          for (const property in schema) {
            if (!schema_properties.includes(property)) {
              throw new Error(`Invalid schema property: ${property}`);
            }
          }
  
          const is_multiple_type = schema.type.includes(',');
          const multiple_types = is_multiple_type ? schema.type.split(',') : [schema.type];
  
          if (multiple_types.find(type => !_private.type_handler[type])) {
            throw new Error(`Invalid schema type: ${schema.type} not define`);
          }
  
          if (!_is.empty(schema.require) && !_is.boolean(schema.require)) {
            throw new Error(`Invalid schema property: require must be boolean`);
          }
  
          if (!_is.empty(schema.nullable) && !_is.boolean(schema.nullable)) {
            throw new Error(`Invalid schema property: nullable must be boolean`);
          }
  
          if (!_is.empty(schema.enum) && _is.filled_array(schema.enum)) {
            throw new Error(`Invalid schema property: enum must be array`);
          }
  
          if (multiple_types.includes('object')) {
            if (_is.empty(schema.properties)) {
              throw new Error(`Invalid schema property: object type must have properties property`);
            }
          }
  
          if (!_is.empty(schema.properties) && !_is.filled_object(schema.properties)) {
            throw new Error(`Invalid schema property: properties must be object`);
          }
  
          if (_is.filled_object(schema.properties)) {
            if (!multiple_types.includes('object')) {
              throw new Error(`Invalid schema property: properties must be in object type`);
            }
  
            if (_private.is_schema(schema.properties)) {
              throw new Error(`Invalid schema property: properties can not be primitive value`);
            }
          }
  
          if (multiple_types.includes('array')) {
            if (_is.empty(schema.element)) {
              throw new Error(`Invalid schema property: array type must have element property`);
            }
          }
  
          if (!_is.empty(schema.element) && !_is.filled_object(schema.element)) {
            throw new Error(`Invalid schema property: element must be object`);
          }
  
          if (_is.filled_object(schema.element)) {
            if (!multiple_types.includes('array')) {
              throw new Error(`Invalid schema property: element must be in array type`);
            }
          }
  
          if (!_is.empty(schema.check)) {
            if (!_is.function(schema.check) && !_is.filled_object(schema.check)) {
              throw new Error(`Invalid schema property: check must be function of object`);
            }
  
            if (is_multiple_type) {
              throw new Error(`Invalid schema property: can not check field multiple type`);
            }
  
            if (_is.filled_object(schema.check)) {
              for (const key in schema.check) {
                const check_handler = _private.check_handler[key];
  
                if (!check_handler) {
                  throw new Error(`Invalid schema property: check.${key} not define`);
                }
  
                // if (!check_handler.allow_types.includes('*') || !check_handler.allow_types.includes(schema.type)) {
                //   throw new Error(`Invalid schema property: check.${key} only allow ${check_handler.allow_types.join(', ')}`);
                // }
  
              }
            }
          }
  
          if (!_is.empty(schema.to)) {
            if (!_is.filled_string(schema.to) && !_is.filled_array(schema.to) && !_is.function(schema.to)) {
              throw new Error(`Invalid schema property: check must be filled string or array`);
            }
  
            if (is_multiple_type) {
              throw new Error(`Invalid schema property: can not to field multiple type`);
            }
  
            if (!_is.function(schema.to)) {
              const to = _is.filled_string(schema.to) ? schema.to.split(',') : schema.to;
  
              for (const key of to) {
                const to_handler = _private.to_handler[key];
    
                if (!to_handler) {
                  throw new Error(`Invalid schema property: to.${key} not define`);
                }
    
                // if (!to_handler.allow_types.includes('*') || !to_handler.allow_types.includes(schema.type)) {
                //   throw new Error(`Invalid schema property: to.${key} only allow ${to_handler.allow_types.join(', ')}`);
                // }
              }
            }
          }
  
          return;
        }
  
        for (const key in schema) {
          _private.assert_schema(schema[key]);
        }
      },
      get_schema_type: (schema) => {
        let type = null;
  
        if (_private.is_schema(schema)) {
          type = schema.type;
        }
  
        if (_private.is_object_schema(schema)) {
          type = 'object';
        }
  
        if (_private.is_array_schema(schema)) {
          type = 'array';
        }
  
        return type;
      },
      get_object_schema_properties: (schema) => {
        return _private.is_schema(schema) ? schema.properties : schema
      },
      get_array_schema_element: (schema) => {
        if (_private.is_schema(schema)) {
          return schema.element;
        }
        if (_private.is_array_schema(schema)) {
          return schema[0];
        }
        throw new Error('Invalid array schema element');
      },
      validate: ({ input, schema, info, options }) => {
        const result = {
          value: input,
          errors: info.errors || [],
        };
  
        const type =  _private.get_schema_type(schema);
  
        if (_private.is_schema(schema)) {
          schema.strict = options.strict || schema.strict;
        }
    
        if (schema.require && input === undefined) {
          result.errors.push({ field: info.field, invalid: 'require' });
          return result;
        }
    
        if (result.value === undefined) {
          if (schema.default != undefined) {
            if (_is.function(schema.default)) {
              result.value = schema.default({ info });
            } else {
              result.value = schema.default;
            }
          } else if (schema.nullable) {
            result.value = null;
          }
        }
  
        if (result.value === null && !schema.nullable) {
          result.errors.push({ field: info.field, invalid: 'not nullable' });
          return result; 
        }
  
        if (schema.enum && !schema.enum.includes(result.value)) {
          result.errors.push({ field: info.field, invalid: 'enum', enum: schema.enum });
          return result; 
        }
    
        if (!_is.empty(result.value)) {
  
          const errors = [];
          const is_multiple_type = type.includes(',');
          const multiple_types = is_multiple_type ? type.split(',') : [type];
  
          let matched_type  = null;
  
          const type_handler_errors = [];
          for (const type of multiple_types) {
            const type_handler = _private.type_handler[type];
    
            const type_handler_result = type_handler.check({ info, value: result.value, schema, options });
  
            if (!_is.filled_array(type_handler_result.errors)) {
              matched_type  = type;
              result.value = type_handler_result.value;
              break;
            } else {
              type_handler_errors.push(...type_handler_result.errors);
            }
    
          }
  
          if (!matched_type) {
            errors.push(...type_handler_errors);
          }
  
          if (!_is.filled_array(errors) && schema.check) {
            if (_is.function(schema.check)) {
              const check_result = schema.check({ info, value: result.value, schema }) || { errors: [] };
              errors.push(...check_result.errors);
            } else {
              for (const check in schema.check) {
                const check_handler = _private.check_handler[check];
                const check_handler_result = check_handler.check({ info, value: result.value, schema }) || { errors: [] };
                if(_is.filled_array(check_handler_result.errors)) {
                  errors.push(...check_handler_result.errors);
                }
              }
            }
          }
  
          if (!_is.filled_array(errors) && schema.to) {
            if (_is.function(schema.to)) {
              result.value = schema.to({ value: result.value });
            } else {
              const to = _is.filled_string(schema.to) ? schema.to.split(',') : schema.to;
  
              for (const key of to) {
                const to_handler = _private.to_handler[key];
                result.value = to_handler.to({ value: result.value });
              }
            }
          }
  
          if (_is.filled_array(errors)) {
            result.errors.push(...errors);
          }
  
        }
  
        return result;
      }
    };

    const _public = {
      type_handler: {
        add: ({ key, type_handler, check_function }) => {

          if (_private.type_handler[key]) {
            console.log(`[WARNING] overwrite ${key} type handler`);
          }
    
          if (_is.function(check_function)) {
            _private.type_handler[key] = {
              check: check_function,
            }
            return;
          }
    
          if (!_is.function(type_handler.check)) {
            throw new Error(`Invalid check function: should be provide function`);
          }
    
          _private.type_handler[key] = {
            check: ({ info, value, schema }) => {
              const result = {
                value: value,
                errors: [],
              };
      
              info = { ...info, original_value: value };
      
              if (!schema.strict) {
                result.value = _is.function(type_handler.convert) ? type_handler.convert({ info, value: result.value, schema }) : result.value;
              }
      
              if (!type_handler.check({ info, value: result.value, schema })) {
                result.errors.push({ field: info.field, invalid: 'type', expect: key });
              }
      
              return result;
            }
          }
        }
      },
      check_handler: {
        add: ({ key, check_handler, check_function }) => {
          if (_private.check_handler[key]) {
            console.log(`[WARNING] overwrite ${key} type handler`);
          }
    
          if (_is.function(check_function)) {
            _private.check_handler[key] = {
              check: check_function
            }
            return;
          }
    
          if (!_is.function(check_handler.check)) {
            throw new Error(`Invalid check function: should be provide function`);
          }
    
          if (!_is.function(check_handler.make_error)) {
            throw new Error(`Invalid make_error function: should be provide function`);
          }
    
          const { check, make_error } = check_handler;
    
          _private.check_handler[key] = {
            check: ({ info, value, schema }) => {
              const result = {
                errors: [],
              };
      
              info = { ...info, original_value: value };
      
              if (!check({ info, value, schema })) {
                result.errors.push(make_error({ info, value, schema }));
              }
      
              return result;
            }
          } 
        }
      },
      to_handler: {
        add: ({ key, to_handler }) => {
          if (_private.to_handler[key]) {
            console.log(`[WARNING] overwrite ${key} to handler`);
          }
    
          if (!_is.function(to_handler.to)) {
            throw new Error(`Invalid to function: should be provide function`);
          }
    
          const { to } = to_handler;
    
          _private.to_handler[key] = {
            to: ({ info, value, schema }) => {
              return to({ info, value, schema });
            }
          } 
        }    
      },
      init_schema: ({ code, schema }) => {
        if (_private.schema[code]) {
          throw new Error(`Schema code ${code} already exists`);
        }
        _private.assert_schema(schema);
        _private.schema[code] = schema;
      },
      validate: ({ input, code, options = ({ is_throw_error: false, strict: false, remove_additional_field: true  }) }) => {
        const result = {
          output: input,
          errors: []
        };

        if (!_private.schema[code]) {
          throw new Error(`Schema code ${code} not exists`);
        }

        const schema = _private.schema[code];
  
        const info = {
          field: null,
          input: input,
          root: input,
        };
  
        const validate_result = _private.validate({ input, schema, info, options });
  
        result.errors = validate_result.errors;
        result.output = validate_result.value;
  
        if (options.is_throw_error) {
          if (_is.filled_array(result.errors)) {
            throw new _ERR.ERR_VALIDATION_FAILED({ errors: result.errors })
          }
        }
  
        return result;
      },
    };

    _public.type_handler.add({ key: 'number', type_handler: {
      convert: ({ info, value, schema }) => Number(value),
      check: ({ info, value, schema }) => _is.number(value),
    }});

    _public.type_handler.add({ key: 'string', type_handler: {
      convert: ({ info, value, schema }) => _.toString(value),
      check: ({ info, value, schema }) => _is.string(value),
    }})

    _public.type_handler.add({ key: 'boolean', type_handler: {
      convert: ({ info, value, schema }) => value === true || value === 'true' ? true : (value === false || value === 'false' ? false : value),
      check: ({ info, value, schema }) => _is.boolean(value),
    }})

    _public.type_handler.add({ key: 'date', type_handler: {
      convert: ({ info, value, schema }) => new Date(value),
      check: ({ info, value, schema }) => _is.date(value),
    }})
    
    _public.type_handler.add({ key: 'object', check_function: ({ info, value: object, schema, options }) => {
      const result = {
        value: object,
        errors: [],
      };
      if (!_is.object(object)) {
        result.errors.push({ field: info.field, invalid: 'type', expect: 'object' });
      }
      if (!_is.filled_array(result.errors)) {
        const property_schema = _private.get_object_schema_properties(schema);

        if (schema.strict) {
          for (const key in object) {
            if (!property_schema[key]) {
              result.errors.push({ field: `${info.field ? `${info.field}.${key}` : key}`, invalid: 'not_specific' });
            }
          }
        }

        for (const key in property_schema) {
          const property_info = {
            field: `${info.field ? `${info.field}.${key}` : key}`,
            key: key,
            root: result.value,
            input: info.input,
            errors: result.errors,
          };
          const validate_result = _private.validate({ info: property_info, input: result.value[key], schema: property_schema[key], options });
          result.value[key] = validate_result.value;
        }
        if (options.remove_additional_field) {
          result.value = _.pick(result.value, Object.keys(property_schema));
        }
      }
      return result;
    }})

    _public.type_handler.add({ key: 'array', check_function: ({ info, value: array, schema, options }) => {
      const result = {
        value: array,
        errors: [],
      };
      if (!_is.array(array)) {
        result.errors.push({ field: info.field, invalid: 'type', expect: 'array' });
      }
      if (!_is.filled_array(result.errors)) {
        const element_schema = _private.get_array_schema_element(schema);
        for (const index in result.value) {

          const element_info = {
            field: `${info.field ? `${info.field}.${index}` : index}`,
            index: index,
            root: result.value,
            input: info.input,
            errors: result.errors,
          };

          const validate_result = _private.validate({ info: element_info, input: result.value[index], schema: element_schema, options });
          result.value[index] = validate_result.value;
        }
      }
      return result;
    }})

    _public.check_handler.add({ key: 'min', check_handler: {
      check: ({ info, value, schema }) => (Number(value) >= Number(schema.check.min)),
      make_error: ({ info, value, schema }) => ({ field: info.field, invalid: 'min', min_value: schema.check.min })
    }});

    _public.check_handler.add({ key: 'max', check_handler: {
      check: ({ info, value, schema }) => (Number(value) <= Number(schema.check.max)),
      make_error: ({ info, value, schema }) => ({ field: info.field, invalid: 'max', min_value: schema.check.max })
    }})

    _public.check_handler.add({ key: 'min_length', check_handler: {
      check: ({ info, value, schema }) => (value.length >= Number(schema.check.min_length)),
      make_error: ({ info, value, schema }) => ({ field: info.field, invalid: 'min_length', min_value: schema.check.min_length })
    }})

    _public.check_handler.add({ key: 'max_length', check_handler: {
      check: ({ info, value, schema }) => (value.length <= Number(schema.check.max_length)),
      make_error: ({ info, value, schema }) => ({ field: info.field, invalid: 'max_length', min_value: schema.check.max_length })
    }})

    _public.check_handler.add({ key: 'set', check_function: ({ info, value: array, schema }) => {
      const result = {
        errors: [],
      };

      if (schema.check.set) {

        const group = {};

        const list_duplicate_index = [];

        for (const index in array) {
          const element = array[index];

          group[element] = group[element] || [];

          group[element].push(index);
        }

        for (const key in group) {
          if (group[key].length > 1) {
            list_duplicate_index.push(...group[key]);
          }
        }
        
        result.errors.push(...list_duplicate_index.map(index => ({ field: `${info.field ? `${info.field}.${index}` : index}`, invalid: 'set' })));
      }

      return result;
    }})

    _public.check_handler.add({ key: 'unique', check_function: ({ info, value: array, schema }) => {
      const result = {
        errors: [],
      };

      const list_unique_key = _is.array(schema.check.unique) ? schema.check.unique : [schema.check.unique];

      for (const unique_key of list_unique_key) {

        const group = {};

        const list_duplicate_index = [];

        for (const index in array) {
          const element = array[index];

          const value = element[unique_key];

          group[value] = group[value] || [];

          group[value].push(index);
        }

        for (const key in group) {
          if (group[key].length > 1) {
            list_duplicate_index.push(...group[key]);
          }
        }
        
        result.errors.push(...list_duplicate_index.map(index => ({ field: `${info.field ? `${info.field}.${index}` : index}.${unique_key}`, invalid: 'unique',  })));
      }

      return result;
    }})

    _public.to_handler.add({ key: 'trim', to_handler: {
      to: ({ value }) => _.trim(value)
    }});

    _public.to_handler.add({ key: 'lowercase', to_handler: {
      to: ({ value }) => _.toLower(value),
    }});

    _public.to_handler.add({ key: 'uppercase', to_handler: {
      to: ({ value }) => _.toUpper(value),
    }});

    _public.to_handler.add({ key: 'round', to_handler: {
      to: ({ value }) => Math.round(value),
    }});

    _public.to_handler.add({ key: 'floor', to_handler: {
      to: ({ value }) => Math.floor(value),
    }});

    _public.to_handler.add({ key: 'ceil', to_handler: {
      to: ({ value }) => Math.ceil(value),
    }});

    _public.to_handler.add({ key: 'iso_datetime', to_handler: {
      to: ({ value }) => new Date(value).toISOString(),
    }});

    return _public;
  }
  if (module && module.exports) {
    di._ = require('lodash');
    di._is = require('./_is.utils.share');
    di._ERR = require('./_ERR.utils.share');
    module.exports = init();
  } else if (window) {
    di = window;
    window._validate = _public;
  }
})();