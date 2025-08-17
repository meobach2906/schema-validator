This is the library to validate value by schema

1. Schema
  + Schema define structure of validated value

    + To validate by schema, must first compile schema

    + Compile:
      1. Validate schema syntax
      2. Compile to create function that use to validate schema.

        * Each schema compiled once and reuse

      ```
        const validator = require('schema-validator');

        // compile schema
        validator.compile({
          code:  <code>, // each schema have different code
          schema: <schema>
        })

        validator.validate({
          code: <code>, // schema's code
          input: <input>,
          options: <options>
        })
      ```

      + <options>:
        + <options>.strict: default: true
          + true: strict validate, overwrite schema strict

        + <options>.remove_additional_field: default: false
          + true: remove object.field that not specific in schema

    + Non-strict validate:
      1. Convert value to field's schema type
      2. Validate type by using converted value
      3. Assign converted value to input
      => Convert value before validate type

    + Strict validate: not convert value before validate type

  + 2 type schema:

    - Implicit schema:
      + Object exclude 'type': object schema.

      + Array: array schema.

      ```
        schema: [
          {
            _id: { type: 'string }
          }
        ]

        // => schema: array contain object element which have _id string property
      ```

    - Explicit schema: object include 'type'

      ```
        schema: { type: 'object', properties: {
          // schema of object
        }}
      ```

      + Explicit schema allow properties:

        + 'type':
          + Field type

          + Can accept multiple type which separate by ','. ex: type: 'string,number'

          + List default type:
            + 'number'
            + 'string'
            + 'boolean'
            + 'date'
            + 'array'
            + 'integer'
            + 'function'
            + 'async_function'
            + 'object'
              + if strict validate: if input object contain field not in define in schema, raise error

          + Add custom type
            ```
              validator.schema.type.add({ key: 'integer', handler: {
                convert: ({ info, value, schema }) => value, // convert when strict = false
                check: ({ info, value, schema }) => Number.isInteger(value), // check
              }});

              // OR raw
              
              validator.schema.type.add({ key: 'integer', raw: ({ info, value, schema, strict }) => {
                const result = {
                  value: value,
                  errors: [],
                };
                if (strict) {
                  result.value = Math.round(result.value)
                }
                if (!Number.isInteger(value)) {
                  result.errors.push({ invalid: 'type', expect: 'integer', field: info.field })
                }
                return result;
              }});

              // schema: field's schema
              // info: info.field:
              // value: field's value
            ```

        + 'require': <boolean>: default: false
          + true: if field's value missing or undefined => invalid

        + 'nullable': <boolean>: default: false
          + true: default null
          + false: if field's value == null => invalid

        + 'enum': <array>
          + Field's value must in <array>

        + 'default': <default_value>: default: undefine

          + If provide value: assign default value for field
          ```
            {
              type: 'boolean',
              default: true,
            }
          ```

          + Can specific function: invoke function and assign result to field
          ```
            {
              type: 'number',
              default: ({ info }) => {

                // info.input: input value

                // info.root: parent object contain field

                return <default>
              }
            }
          ```

        + 'strict': <boolean>: default: false
          + true: strict validate

        + 'properties':
          + Schema for object
          + Must provide if 'type' = 'object'

          ```
            {
              type: 'object',
              properties: {
                // ...object schema
              }
            }
          ```

        + 'element':
          + Schema for element in array
          + Must provide if type = 'array'

          ```
            {
              type: 'array',
              element: {
                // ...element schema
              }
            }
          ```

        + 'check':
          + Use to extra validate field beside type validate
          + Can be object, which key is check:
            + List default check:
              + 'min': <number>
              + 'max': <number>
              + 'min_length': <number>
              + 'max_length': <number>
              + 'set': <boolean>
                + true: each element in array must unique
              + 'unique': <field>
                + <field>: element's field in array must unique

              ```
                // example
                {
                  type: 'number',
                  check: {
                    min: <number>,
                    max: <number>
                  }
                }

                {
                  type: 'array',
                  check: {
                    unique: 'unique_key'
                  },
                  element: {
                    ...
                  }
                }

                
              ```

            + Add custom check:
            ```
              validator.schema.check.add({ key: 'max_length', handler: {
                check: ({ info, value, schema }) => true,
                make_error: ({ info, value, schema }) => ({ field: info.field, invalid: '', check: schema.check })
              }});

              validator.schema.check.add({ key: 'set', raw: ({ info, value: array, schema }) => {
                return {
                  errors: [], // not empty => error
                };
              }});
            ```

          + Can be function
          ```
            {
              type: 'number',
              check: ({ info, value, schema }) => {
                // info.field

                // info.input: input value

                // info.root: parent object contain field

                return { errors: [] } // if error is not empty => fail
              }
            }
          ```

        + 'to':
          + Use to convert or format

          + Can be list separate by ','. Will be execute in order
            + List default:
              + 'trim'
              + 'lowercase'
              + 'uppercase'
              + 'round'
              + 'floor'
              + 'ceil'
              + 'iso_datetime'

              ```
                {
                  type: 'date',
                  to: 'iso_datetime,trim'
                }
              ```

              + Add custom
              ```
               validator.schema.to.add({ key: 'iso_datetime', handler: {
                  to: ({ value }) => new Date(value).toISOString(), // assign result to field
                }});
              ```

          + Can be function
            ```
              {
                type: 'number',
                to: ({ value }) => String(value).toUpperCase(), // assign result to field
              }
            ```
