(() => {
  const _public = {};
  const _private = {};
  const di = {};

  const init = () => {
    const { _, _is, _ERR } = di;

    _private.type_handler = {
      'number': {
        validate: ({ info, value, schema }) => {
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
            result.errors.push({ field: info.field, invalid: 'type', expect: 'number' });
          }
          if (_is.filled_array(result.errors)) {
            result.is_valid = false;
          }
          return result;
        }
      },
      'string': {
        validate: ({ info, value, schema }) => {
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
            result.errors.push({ field: info.field, invalid: 'type', expect: 'string' });
          }
          if (_is.filled_array(result.errors)) {
            result.is_valid = false;
          }
          return result;
        }
      },
      'date': {
        validate: ({ info, value, schema }) => {
          const result = {
            original_value: value,
            value: value,
            errors: [],
            is_valid: true,
          };
          if (!schema.strict) {
            result.value = new Date(value);
          }
          if (!_is.date(result.value)) {
            result.errors.push({ field: info.field, invalid: 'type', expect: 'date' });
          }
          if (_is.filled_array(result.errors)) {
            result.is_valid = false;
          }
          return result;
        }
      },
      'boolean': {
        validate: ({ info, value, schema }) => {
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
            result.errors.push({ field: info.field, invalid: 'type', expect: 'boolean' });
          }
          if (_is.filled_array(result.errors)) {
            result.is_valid = false;
          }
          return result;
        }
      },
      'object': {
        validate: ({ info, value: object, schema, options }) => {
          const result = {
            value: object,
            errors: [],
            is_valid: true,
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
          if (_is.filled_array(result.errors)) {
            result.is_valid = false;
          }
          return result;
        }
      },
      'array': {
        validate: ({ info, value: array, schema, options }) => {
          const result = {
            value: array,
            errors: [],
            is_valid: true,
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
        check: ({ info, value, schema }) => {
          const result = {
            is_valid: true,
            errors: [],
          };
          if (!(Number(value) >= Number(schema.check.min))) {
            result.errors.push({ field: info.field, invalid: 'min', min_value: schema.check.min });
          }
          if (_is.filled_array(result.errors)) {
            result.is_valid = false;
          }
          return result;
        }
      },
      'max': {
        allow_types: ['number', 'date', 'integer'],
        check: ({ info, value, schema }) => {
          const result = {
            is_valid: true,
            errors: [],
          };
          if (!(Number(value) <= Number(schema.check.max))) {
            result.errors.push({ field: info.field, invalid: 'max', min_value: schema.check.max });
          }
          if (_is.filled_array(result.errors)) {
            result.is_valid = false;
          }
          return result;
        }
      },
      'min_length': {
        allow_types: ['string', 'array'],
        check: ({ info, value, schema }) => {
          const result = {
            is_valid: true,
            errors: [],
          };
          if (!(value.length >= Number(schema.check.min_length))) {
            result.errors.push({ field: info.field, invalid: 'min_length', min_value: schema.check.min_length });
          }
          if (_is.filled_array(result.errors)) {
            result.is_valid = false;
          }
          return result;
        }
      },
      'max_length': {
        allow_types: ['string', 'array'],
        check: ({ info, value, schema }) => {
          const result = {
            is_valid: true,
            errors: [],
          };
          if (!(value.length <= Number(schema.check.max_length))) {
            result.errors.push({ field: info.field, invalid: 'max_length', min_value: schema.check.max_length });
          }
          if (_is.filled_array(result.errors)) {
            result.is_valid = false;
          }
          return result;
        }
      },
      'set': {
        allow_types: ['array'],
        check: ({ info, value, schema }) => {
          const result = {
            is_valid: true,
            errors: [],
          };

          if (schema.check.set) {
            const { list_duplicate_index } = _private.check_duplicate({ list: value });
            
            result.errors.push(...list_duplicate_index.map(index => ({ field: `${info.field ? `${info.field}.${index}` : index}`, invalid: 'set' })));
          }

          if (_is.filled_array(result.errors)) {
            result.is_valid = false;
          }
          return result;
        }
      },
      'unique': {
        allow_types: ['array'],
        check: ({ info, value, schema }) => {
          const result = {
            is_valid: true,
            errors: [],
          };

          const list_unique = _is.array(schema.check.unique) ? schema.check.unique : [schema.check.unique];

          for (const unique of list_unique) {
            const keys = unique.split(',');

            const { list_duplicate_index } = _private.check_duplicate({ list: value, keys });
            
            result.errors.push(...list_duplicate_index.map(index => ({ field: `${info.field ? `${info.field}.${index}` : index}.${schema.check.unique}`, invalid: 'unique',  })));
          }

          if (_is.filled_array(result.errors)) {
            result.is_valid = false;
          }
          return result;
        }
      },
    };

    _private.check_duplicate = ({ list, keys }) => {
      const result = {
        list_duplicate_items: [],
        list_duplicate_index: [],
        group: {},
      };

      for (const index in list) {
        const item = list[index];

        let value = null;

        if (_is.filled_array(keys)) {
          const values = [];

          for (const key of keys) {
            values.push(item[key]);
          }
          value = values.join('-')
        } else {
          value = item;
        }
        
        result.group[value] = result.group[value] || [];

        result.group[value].push(index);

      }

      for (const key in result.group) {
        if (result.group[key].length > 1) {
          result.list_duplicate_index.push(...result.group[key]);

          for (const index of result.group[key]) {
            result.list_duplicate_items.push(list[index]);
          }
        }
      }

      return result;
    }

    _private.to_handler = {
      'trim': {
        allow_types: ['string'],
        to: ({ value }) => _.trim(value),
      },
      'to_lower': {
        allow_types: ['string'],
        to: ({ value }) => _.toLower(value),
      },
      'to_upper': {
        allow_types: ['string'],
        to: ({ value }) => _.toUpper(value),
      },
      'round': {
        allow_types: ['number'],
        to: ({ value }) => Math.round(value),
      },
      'floor': {
        allow_types: ['number'],
        to: ({ value }) => Math.floor(value),
      },
      'ceil': {
        allow_types: ['number'],
        to: ({ value }) => Math.ceil(value),
      },
      'iso_datetime': {
        allow_types: ['date'],
        to: ({ value }) => new Date(value).toISOString(),
      }
    }

    _private.is_schema = (schema) => {
      return _is.object(schema) && _is.string(schema.type);
    }

    _private.is_object_schema = (schema) => {
      return _is.object(schema) && (_is.empty(schema.type) || _is.object(schema.type));
    }

    _private.is_array_schema = (schema) => {
      return _is.array(schema);
    }

    _private.assert_schema = (schema) => {
      if (!_private.is_schema(schema) && !_private.is_object_schema(schema) && !(_private.is_array_schema(schema) && schema.length === 1)) {
        throw new Error('Invalid schema: schema not correct');
      }

      if (_private.is_schema(schema)) {

        const schema_properties = [
          'type',
          'require',
          'nullable',
          'enum',
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

              if (!check_handler.allow_types.includes('*') || !check_handler.allow_types.includes(schema.type)) {
                throw new Error(`Invalid schema property: check.${key} only allow ${check_handler.allow_types.join(', ')}`);
              }

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
  
              if (!to_handler.allow_types.includes('*') || !to_handler.allow_types.includes(schema.type)) {
                throw new Error(`Invalid schema property: to.${key} only allow ${to_handler.allow_types.join(', ')}`);
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

    _private.get_schema_type = (schema) => {
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
    }

    _private.get_object_schema_properties = (schema) => {
      return _private.is_schema(schema) ? schema.properties : schema
    }

    _private.get_array_schema_element = (schema) => {
      if (_private.is_schema(schema)) {
        return schema.element;
      }
      if (_private.is_array_schema(schema)) {
        return schema[0];
      }
      throw new Error('Invalid array schema element');
    }
  
    _private.validate = ({ input, schema, info, options }) => {
      const result = {
        value: input,
        is_valid: true,
        errors: info.errors || [],
      };

      const type =  _private.get_schema_type(schema);

      if (_private.is_schema(schema)) {
        schema.strict = options.strict || schema.strict;
      }
  
      if (schema.require && input === undefined) {
        result.errors.push({ field: info.field, invalid: 'require' });
        result.is_valid = false;
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
        result.is_valid = false;
        return result; 
      }

      if (schema.enum && !schema.enum.includes(result.value)) {
        result.errors.push({ field: info.field, invalid: 'enum', enum: schema.enum });
        result.is_valid = false;
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
  
          const type_handler_result = type_handler.validate({ info, value: result.value, schema, options });

          if (type_handler_result.is_valid) {
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
              if(!check_handler_result.is_valid) {
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
          result.is_valid = false;
          result.errors.push(...errors);
        }

      }

      return result;
    }

    _public.assert_schema = ({ schema }) => {
      _private.assert_schema(schema)
    }

    _public.validate = ({ input, schema, options = ({ is_throw_error: false, strict: false, remove_additional_field: true  }) }) => {
      const result = {
        output: input,
        errors: []
      };

      const info = {
        field: '',
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
    }

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