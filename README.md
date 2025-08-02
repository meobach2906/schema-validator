This is the library to validate by schema

Schema
  + Schema define structure of validated value

  + To validate by schema, must first compile schema

  + Compile:
    1. Validate schema
    2. Compile to function to validate.

    * compile once and reuse

    ```
      const validator = require('schema-validator');

      validator.compile({
        code:  <code>, // each schema have different code
        schema: <schema>
      })

      validator.validate({
        code: <code>, // schema's code
        input: <input>,
        options: {
          strict: <boolean>, // if true: strict validate; else: base on schema strict
          remove_additional_field: <boolean> // default false. if true: remove filled if object that not define in schema
        }
      })
    ```

    + strict validate:
      1. convert value to type need check
      2. check type converted value
      3. assign converted value to input

  + 2 type schema:

    - Implicit schema: object exclude 'type' key word or array
      + object exclude 'type': object schema.

      + array: array schema.

    - Explicit schema: object include type key word

      ```
        { type: 'object', properties: { // explicit schema for object
          // schema of object
        }}
      ```

      + Explicit schema allow properties:

        + type:
          + field type

          + can accept multiple type, separate by ,ß

          + list default type:
            + number
            + string
            + boolean
            + date
            + array
            + object
              + if strict validate: if input object contain field not in define in schema, raise error

          + add custom type
            ```
              validator.schema.type.add({ key: 'integer', handler: {
                convert: ({ info, value, schema }) => value, // convert when strict = false
                check: ({ info, value, schema }) => Number.isInteger(value), // check
              }});

              // or
              
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
              // info: { field }
              // value: field's value
            ```

        + require: <boolean>
          + default: false

          + if true: if field'value missing or undefined, raise error

        + nullable:
          + default: false

          + if true: default null

          + if false: if field's value = null, raise error

        + enum: <array>
          + if provide: field's value must in <array>

        + default: <default>
          + default: undefine

          + if provide value: default value for field
          ```
            {
              type: 'boolean',
              default: true,
            }
          ```

          + can access function: invoke function and assign result to field
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

        + strict: <boolean>
          + default: false
          + if true: strict validate

        + properties:
          + must provide if type = 'object'
          + schema for object

          ```
            {
              type: 'object',
              properties: {
                // ...object schema
              }
            }
          ```

        + element:
          + must provide if type = 'array'
          + schema for element in array

          ```
            {
              type: 'array',
              element: {
                // ...element schema
              }
            }
          ```

        + check:
          + use to extra validate field beside type validate
          + can be object, which key is check:
            + list default check:
              + min
              + max
              + min_length
              + max_length
              + set
              + unique

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

            + add custom check:
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

          + can be function
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

        + to:
          + use to convert or format

          + can be list separate by ','. Will be execute in order
            + list default:
              + trim
              + lowercase
              + uppercase
              + round
              + floor
              + ceil
              + iso_datetime

              ```
                {
                  type: 'date',
                  to: 'iso_datetime,trim'
                }
              ```

              + add custom
              ```
               validator.schema.to.add({ key: 'iso_datetime', handler: {
                  to: ({ value }) => new Date(value).toISOString(),
                }});
              ```

          + can be function
            ```
              {
                type: 'number',
                to: ({ value }) => String(value).toUpperCase()
              }
            ```
