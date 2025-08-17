'use strict';

(() => {
  const _public = {};
  const di = {};

  const init = () => {
    const { _, _is, _ERR } = di;

    const compiled_schema = {};

    function escapeString(str) {
      return str
        .replace(/\\/g, '\\\\')   // escape backslash
        .replace(/"/g, '\\"')     // escape double quote
        .replace(/'/g, "\\'")     // escape single quote
        .replace(/\n/g, '\\n')    // escape newline
        .replace(/\r/g, '\\r')    // escape carriage return
        .replace(/\t/g, '\\t');   // escape tab
    }

    const _private = {
      schema: {
        type: {},
        check: {},
        to: {},
      },
      compiler: {
        type: {
          'object': ({ info, general, schema }) => {
            const type =  _private.get_schema_type(schema);
  
            const types = type.includes(',') ? type.split(',') : [type];
  
            if (!types.includes('object')) {
              return ``;
            }
  
            const properties_schema = _private.get_object_schema_properties(schema);
            return `
              ${
                Object.keys(properties_schema).map(property => {
                  const property_schema = properties_schema[property];
  
                  general.counter += 1;
  
                  return _private.compile({ parent_info: info, schema: { field: property, schema: property_schema }, general }).compiled
                }).join('\n')
              }
            `;
          },
          'array': ({ info, general, schema }) => {
            const { field, counter, variable, error_variable, schema_variable } = info;
  
            const type =  _private.get_schema_type(schema);
  
            const types = type.includes(',') ? type.split(',') : [type];
  
            if (!types.includes('array')) {
              return ``;
            }
  
            const element_schema = _private.get_array_schema_element(schema);
  
            general.counter += 1;
            return `
              for (const index_${counter} in ${variable}) {
                ${
                  _private.compile({ parent_info: info, schema: { field: '[]', schema: element_schema }, general }).compiled
                }
              }
            `
          },
          'other': ({ info, schema }) => {
            const { field, counter, variable, error_variable, schema_variable } = info;
    
            const type =  _private.get_schema_type(schema);
  
            const types = type.includes(',') ? type.split(',') : [type];
  
            return `
              let result_${counter} = {
                matched_type: null,
                errors: [],
              };
  
              ${ types.map(type => {
                return `
                  if (!result_${counter}.matched_type) {
                    const result_${type}_${counter} = validator.schema.type.handle({ key: '${type}' })({ info: { field: '${field}' }, value: ${variable}, schema: ${schema_variable}, strict: options && options.strict ? options.strict : ${schema_variable}.strict });
                    if (!_is.filled_array(result_${type}_${counter}.errors)) {
                      result_${counter}.matched_type = '${type}';
                      ${variable} = result_${type}_${counter}.value;
                    } else {
                      result_${counter}.errors.push(...result_${type}_${counter}.errors);
                    }
                  }
                `;
              }) }
  
              if (!result_${counter}.matched_type) {
                ${error_variable}.push(...result_${counter}.errors);
              }
            `
          }
        },
        properties: {
          'require': ({ info }) => {
            const { field, variable, error_variable, schema_variable } = info;
            return `
              if (${schema_variable}.require && ${variable} === undefined) {
                ${error_variable}.push({ field: '${field}', invalid: 'require' });
              }
            `;
          },
          'default': ({ info, general, schema }) => {
            const { variable, schema_variable, parent_info = {} } = info;
  
            const { variable: parent_variable } = parent_info;
  
            return `
              if (${schema_variable}.default != undefined) {
                if (${variable} === undefined) {
                  if (_is.function(${schema_variable}.default)) {
                    ${variable} = ${schema_variable}.default({ info: { input: input, root: ${ parent_variable || 'input' } } });
                  } else {
                    ${variable} = ${schema_variable}.default
                  }
                }
              }
            `;
          },
          'nullable': ({ info }) => {
            const { field, variable, error_variable, schema_variable } = info;
            return `
              if (${variable} === undefined) {
                if (${schema_variable}.nullable) {
                  ${variable} = null;
                }
              }
              if (${variable} === null) {
                if (!${schema_variable}.nullable) {
                  ${error_variable}.push({ field: '${field}', invalid: 'not nullable' });
                }
              }
            `;
          },
          'enum': ({ info }) => {
            const { field, variable, error_variable, schema_variable } = info;
            return `
              if (${schema_variable}.enum && !${schema_variable}.enum.includes(${variable})) {
                ${error_variable}.includes({ field: '${field}', invalid: 'enum', enum: ${schema_variable}.enum });
              }
            `;
          },
          'check': ({ info, schema }) => {
            const { field, counter, variable, error_variable, schema_variable, parent_info } = info;
  
            const { variable: parent_variable } = parent_info;

            if (!schema.check) {
              return '';
            }
  
  
            if (_is.function(schema.check)) {
              return `
                const result_check_${counter} = ${schema_variable}.check({ info: { field: '${field}', input: input, root: ${ parent_variable || 'input' }, value: ${variable}, schema: ${schema_variable} } });
                ${error_variable}.push(...result_check_${counter}.errors);
              `;
            } else {
              return Object.keys(schema.check).map(check => {
                return `
                  const result_check_${check}_${counter} = validator.schema.check.handle({ key: '${check}' })({ info: { field: '${field}', input: input, root: ${ parent_variable || 'input' } }, value: ${variable}, schema: ${schema_variable} });
                  ${error_variable}.push(...result_check_${check}_${counter}.errors);
                `
              }).join('\n')
            }
          },
          'to': ({ info, schema }) => {
            const { field, variable, error_variable, schema_variable } = info;

            if (!schema.to) {
              return '';
            }
  
            if (_is.function(schema.to)) {
              return `${variable} = ${schema_variable}.to({ value: ${variable} })`;
            } else {
              const to = _is.filled_string(schema.to) ? schema.to.split(',') : schema.to;
              return to.map(key => {
                return `${variable} = validator.schema.to.handle({ key: '${key}' })({ value: ${variable} });`
              }).join('\n')
            }
          }
        },
      },
      is_schema: (schema) => {
        return _is.object(schema) && _is.string(schema.type);
      },
      is_object_schema: (schema) => {
        return _is.object(schema) && (_is.empty(schema.type) || _is.object(schema.type));
      },
      is_array_schema: (schema) => {
        return _is.array(schema);
      },
      assert_schema: ({ schema }) => {
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
  
          if (multiple_types.find(type => !_private.schema.type[type])) {
            throw new Error(`Invalid schema type: ${schema.type} not define`);
          }
  
          if (!_is.empty(schema.require) && !_is.boolean(schema.require)) {
            throw new Error(`Invalid schema property: require must be boolean`);
          }
  
          if (!_is.empty(schema.nullable) && !_is.boolean(schema.nullable)) {
            throw new Error(`Invalid schema property: nullable must be boolean`);
          }
  
          if (!_is.empty(schema.enum) && !_is.filled_array(schema.enum)) {
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
                const check = _private.schema.check[key];
  
                if (!check) {
                  throw new Error(`Invalid schema property: check.${key} not define`);
                }
  
                // if (!check.allow_types.includes('*') || !check.allow_types.includes(schema.type)) {
                //   throw new Error(`Invalid schema property: check.${key} only allow ${check.allow_types.join(', ')}`);
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
                const schema_to = _private.schema.to[key];
    
                if (!schema_to) {
                  throw new Error(`Invalid schema property: to.${key} not define`);
                }
    
                // if (!schema_to.allow_types.includes('*') || !schema_to.allow_types.includes(schema.type)) {
                //   throw new Error(`Invalid schema property: to.${key} only allow ${schema_to.allow_types.join(', ')}`);
                // }
              }
            }
          }
  
          return;
        }
  
        for (const key in schema) {
          _private.assert_schema({ schema: schema[key] });
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
      compile: ({ parent_info = {}, schema: { field, schema }, general = { counter: 0 } }) => {
        const result = {
          compiled: ``,
        };
  
        const { field: parent_field, variable: parent_variable, error_variable: parent_error_variable, counter: parent_counter  } = parent_info;
  
        const init = _is.empty(parent_variable);

        let current_reference = null;

        if (init) {
          current_reference = 'input';
        } else {
          if (field === '[]') {
            current_reference = `${parent_variable}[index_${parent_counter}]`
          } else {
            current_reference = `${parent_variable}.${field}`
          }
        }
  
        const { counter } = general;
  
        const info = {
          field: parent_field ? `${parent_field}.${field}` : (field || ''),
          counter: counter,
          variable: `var_${counter}`,
          error_variable: `error_${counter}`,
          schema_variable: `schema_${counter}`,
          parent_info: parent_info,
        };

        if (field === '[]') {
          info.field = `${parent_field ? `${parent_field}.` : ''}[' + index_${parent_counter} + ']`
        }
  
        const properties_schema = _private.get_object_schema_properties(schema);
  
        result.compiled = `
          ${ init ? `const result = { errors: [], output: input };` : '' }
          ${ init ? `const { _is, validator, _ } = di;` : '' }
          const schema_${counter} = validator.json_string_to_schema({ json: '${escapeString(_public.schema_to_json_string({ schema }))}' });
          const error_${counter} = [];
          let var_${counter} = ${ current_reference };
          ${ _private.compiler.properties['require']({ info }) }
          if (!_is.filled_array(error_${counter})) {
            ${ _private.compiler.properties['default']({ info }) }
            ${ _private.compiler.properties['nullable']({ info }) }
            if (!_is.filled_array(error_${counter})) {
              ${ _private.compiler.properties['enum']({ info }) }
              if (!_is.filled_array(error_${counter})) {
                if (!_is.empty(var_${counter})) {
                  ${ _private.compiler.type['other']({ info, schema }) }
                  if (result_${counter}.matched_type === 'object') {
                    ${ _private.compiler.type['object']({ info, general, schema }) }
                      if (options && options.remove_additional_field) {
                        ${ properties_schema ? `var_${counter} = _.pick(var_${counter}, ['${ Object.keys(properties_schema).join("','") }'])` : '' }
                      }
                  }
                  if (result_${counter}.matched_type === 'array') {
                    ${ _private.compiler.type['array']({ info, general, schema }) }
                  }
  
                  if (!_is.filled_array(error_${counter})) {
                    ${ _private.compiler.properties['check']({ info, schema }) }
                  }
  
                  if (!_is.filled_array(error_${counter})) {
                    ${ _private.compiler.properties['to']({ info, schema }) }
                  }
                }
              }
            }
          }
          ${ init ? 'result.output' : `${current_reference}` } = var_${counter};
          ${ init ? `result.errors.push(...error_${counter});` : `${parent_error_variable}.push(...error_${counter})` }
          ${ init ? 'return result' : '' }
        `;
  
        return result;
      }
    };

    const _public = {
      schema: {
        type: {
          add: ({ key, handler, raw }) => {

            if (_private.schema.type[key]) {
              console.log(`[WARNING] overwrite ${key} schema type`);
            }

            if (raw && !_is.function(raw)) {
              throw new Error(`If provide raw, it must be function`);
            }

            if (raw) {
              _private.schema.type[key]  = {
                handle: raw
              };
              return;
            }
      
            if (!_is.function(handler.check)) {
              throw new Error(`Invalid check function: require & must provide function`);
            }

            if (handler.convert && !_is.function(handler.convert)) {
              throw new Error(`Invalid convert function: must provide function`);
            }
      
            const { convert, check } = handler;

            _private.schema.type[key] = {
              handle: ({ info, value, schema, strict }) => {
                const result = {
                  value: value,
                  errors: [],
                };
        
                if (!strict) {
                  result.value = _is.function(convert) ? convert({ info, value: result.value, schema }) : result.value;
                }
        
                if (!check({ info, value: result.value, schema })) {
                  result.errors.push({ field: info.field, invalid: 'type', expect: key });
                }
        
                return result;
              }
            }
          },
          handle: ({ key }) => {
            return _private.schema.type[key].handle;
          },
        },
        check: {
          add: ({ key, handler, raw }) => {
            if (_private.schema.check[key]) {
              console.log(`[WARNING] overwrite ${key} check`);
            }

            if (raw && !_is.function(raw)) {
              throw new Error(`If provide raw, it must be function`);
            }

            if (raw) {
              _private.schema.check[key]  = {
                handle: raw
              };
              return;
            }
      
            if (!_is.function(handler.check)) {
              throw new Error(`Invalid check function: should be provide function`);
            }
      
            if (!_is.function(handler.make_error)) {
              throw new Error(`Invalid make_error function: should be provide function`);
            }
      
            const { check, make_error } = handler;
      
            _private.schema.check[key] = {
              handle: ({ info, value, schema }) => {
                const result = {
                  errors: [],
                };
        
                if (!check({ info, value, schema })) {
                  result.errors.push(make_error({ info, value, schema }));
                }
        
                return result;
              }
            } 
          },
          handle: ({ key }) => {
            return _private.schema.check[key].handle;
          },
        },
        to: {
          add: ({ key, handler, raw }) => {
            if (_private.schema.to[key]) {
              console.log(`[WARNING] overwrite ${key} to`);
            }

            if (raw && !_is.function(raw)) {
              throw new Error(`If provide raw, it must be function`);
            }

            if (raw) {
              _private.schema.to[key]  = {
                handle: raw
              };
              return;
            }
      
            if (!_is.function(handler.to)) {
              throw new Error(`Invalid to function: should be provide function`);
            }
      
            const { to } = handler;
      
            _private.schema.to[key] = {
              handle: ({ info, value, schema }) => {
                return to({ info, value, schema });
              }
            } 
          },
          handle: ({ key }) => {
            return _private.schema.to[key].handle;
          },
        }
      },
      schema_to_json_string: ({ schema }) => {
        if (!_private.is_schema(schema)) {
          return JSON.stringify({});
        }
        return JSON.stringify(schema, (key, value) => {
          if (['element', 'properties'].includes(key)) {
            return undefined;
          }
          if (typeof value === 'function') {
            return value.toString();
          }
          return value;
        });
      },
      json_string_to_schema: ({ json }) => {
        return JSON.parse(json, (key, value) => {
          if (typeof value === 'string' && (value.startsWith('function') || (value.startsWith('(')))) {
            try {
              return eval(`(${value})`);
            } catch (error) {}
          }
          return value;
        });
      },
      compile: ({ code, schema, options }) => {
        if (compiled_schema[code]) {
          throw new Error(`Schema code ${code} already exists`);
        }
        _private.assert_schema({ schema });
        compiled_schema[code] = schema;
        const { compiled } = _private.compile({ schema: { field: null, schema: compiled_schema[code] } });
  
        const _di = {
          _,
          _is,
          validator: _public,
        }
  
        compiled_schema[code] = {
          code,
          compiled,
          validate: new Function('di', `return ({ input, options }) => {
            ${compiled}  
          }`)(_di)
        };
      },
      validate: ({ code, input, options }) => {
        if (!compiled_schema[code]) {
          throw new Error(`Schema code ${code} not compiled`);
        }
        return compiled_schema[code].validate({ input, options });
      },
      assert_validate: ({ code, input, options }) => {
        const { output, errors } = _public.validate({ code, input, options });
        if (_is.filled_array(errors)) {
          throw new _ERR.ERR_VALIDATION_FAILED({ errors });
        }
        return output;
      },
    };

    _public.schema.type.add({ key: 'number', handler: {
      convert: ({ info, value, schema }) => Number(value),
      check: ({ info, value, schema }) => _is.number(value),
    }});

    _public.schema.type.add({ key: 'string', handler: {
      convert: ({ info, value, schema }) => _.toString(value),
      check: ({ info, value, schema }) => _is.string(value),
    }});

    _public.schema.type.add({ key: 'boolean', handler: {
      convert: ({ info, value, schema }) => value === true || value === 'true' ? true : (value === false || value === 'false' ? false : value),
      check: ({ info, value, schema }) => _is.boolean(value),
    }});

    _public.schema.type.add({ key: 'date', handler: {
      convert: ({ info, value, schema }) => new Date(value),
      check: ({ info, value, schema }) => _is.date(value),
    }});

    _public.schema.type.add({ key: 'array', handler: {
      convert: ({ info, value, schema }) => value,
      check: ({ info, value, schema }) => _is.array(value),
    }});

    _public.schema.type.add({ key: 'integer', handler: {
      convert: ({ value }) => Number(value),
      check: ({ value }) => _is.integer(value),
    }})
    
    _public.schema.type.add({ key: 'function', handler: {
      convert: ({ value }) => value,
      check: ({ value }) => _is.function(value),
    }})
    
    _public.schema.type.add({ key: 'async_function', handler: {
      convert: ({ value }) => value,
      check: ({ value }) => _is.async_function(value),
    }})
    
    _public.schema.type.add({ key: 'object', raw: ({ info, value: object, schema, strict }) => {
      const result = {
        value: object,
        errors: [],
      };
      if (!_is.object(object)) {
        result.errors.push({ field: info.field, invalid: 'type', expect: 'object' });
      }
      if (!_is.filled_array(result.errors)) {
        const property_schema = _private.get_object_schema_properties(schema);

        if (strict) {
          for (const key in object) {
            if (!property_schema[key]) {
              result.errors.push({ field: `${info.field ? `${info.field}.${key}` : key}`, invalid: 'not_specific' });
            }
          }
        }
      }
      return result;
    }});

    _public.schema.check.add({ key: 'min', handler: {
      check: ({ info, value, schema }) => (Number(value) >= Number(schema.check.min)),
      make_error: ({ info, value, schema }) => ({ field: info.field, invalid: 'min', min_value: schema.check.min })
    }});

    _public.schema.check.add({ key: 'max', handler: {
      check: ({ info, value, schema }) => (Number(value) <= Number(schema.check.max)),
      make_error: ({ info, value, schema }) => ({ field: info.field, invalid: 'max', min_value: schema.check.max })
    }});

    _public.schema.check.add({ key: 'min_length', handler: {
      check: ({ info, value, schema }) => (value.length >= Number(schema.check.min_length)),
      make_error: ({ info, value, schema }) => ({ field: info.field, invalid: 'min_length', min_value: schema.check.min_length })
    }});

    _public.schema.check.add({ key: 'max_length', handler: {
      check: ({ info, value, schema }) => (value.length <= Number(schema.check.max_length)),
      make_error: ({ info, value, schema }) => ({ field: info.field, invalid: 'max_length', min_value: schema.check.max_length })
    }});

    _public.schema.check.add({ key: 'set', raw: ({ info, value: array, schema }) => {
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
        
        result.errors.push(...list_duplicate_index.map(index => ({ field: `${info.field ? `${info.field}.[${index}]` : `[${index}]`}`, invalid: 'set' })));
      }

      return result;
    }});

    _public.schema.check.add({ key: 'unique', raw: ({ info, value: array, schema }) => {
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
        
        result.errors.push(...list_duplicate_index.map(index => ({ field: `${info.field ? `${info.field}.[${index}]` : `[${index}]`}.${unique_key}`, invalid: 'unique',  })));
      }

      return result;
    }});

    _public.schema.to.add({ key: 'trim', handler: {
      to: ({ value }) => _.trim(value)
    }});

    _public.schema.to.add({ key: 'lowercase', handler: {
      to: ({ value }) => _.toLower(value),
    }});

    _public.schema.to.add({ key: 'uppercase', handler: {
      to: ({ value }) => _.toUpper(value),
    }});

    _public.schema.to.add({ key: 'round', handler: {
      to: ({ value }) => Math.round(value),
    }});

    _public.schema.to.add({ key: 'floor', handler: {
      to: ({ value }) => Math.floor(value),
    }});

    _public.schema.to.add({ key: 'ceil', handler: {
      to: ({ value }) => Math.ceil(value),
    }});

    _public.schema.to.add({ key: 'iso_datetime', handler: {
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