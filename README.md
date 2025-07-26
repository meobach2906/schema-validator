Library to validate by schema

Default schema properties

```
  {
    type: '<number|string|boolean|date|object|array>',
    strict: <boolean>, // default: false. if false => convert to schema type; else not convert
    require: <boolean>, // default: false. if false => if value = undefined or missing => invalidate
    nullable: <boolean>, // default: false. if false => if value = null => invalidate; else true => if value = undefined or missing => assign null
    enum: <array>, // value must in array
    default: <value|function>, // if specific function, execute function, result assign to property
    check: <object|function>, // if object => object's property is defined check property; if function, execute function, return { errors: [] },
    to: <array|function>, // if function, execute function, result is assign property value
  }

  // if strict and type is object, is any field not specific in object schema => invalid
```

Custom type check

```
  validator.type_handler.add({
    key: 'new_type',
    check_function: ({ info, value, schema }) => {
      return {
        value, errors: []
      };
    }
  })
```

Default check

```
  check: {
    min: <min>,
    max: <max>,
    min_length: <min_length>,
    max_length: <max_length>,
    unique: [<key>, ...], // each key => check unique
    set: <boolean>, // true => array is set
  }
```

Custom check

```
  validator.check_handler.add({
    key: 'new_check',
    check_function: ({ info, value, schema }) => {
      return {
        errors: []
      };
    }
  })
```

Default to

```
  // to execute in order in array
  {
    to: [
      'iso_datetime', // to ISO date time string
      'lowercase',
      'uppercase',
      'trim',
      'round',
      'ceil',
      'floor'
    ]
  }
```

Custom to handler

```
  validator.to_handler.add({
    key: 'new_to',
    to_handler: {
      to: ({ info, value, schema }) => {
        return value;
      }
    }
  })
```

Object schema

```
// implicit object schema

const schema = {
  type: 'object',
  properties: {
    // object properties
  }
}

// explicit object schema

const schema = {
  // object properties
}

```

Array schema

```
// implicit array schema

const schema = {
  type: 'array',
  element: {
    // element schema
  }
}

// explicit array schema

const schema = [{
  // element schema
}]

```

```
const validator = require('meobach-validator-lib');
validator.init_schema({
  code: 'SCHEMA_CODE',
  schema: {
    type: 'array', // array
    require: true, // require: if value = undefined => error
    nullable: false, // not nullable: if value = null => error. if nullable = true: if value = undefined => default null
    check: { unique: ['_id'] }, // element in array unique by _id key. unique: [...list_key] // unique by each key in list key
    element: { // element schema
      type: 'object',
      properties: {
        // object schema
        _id: { type: 'string', require: true, nullable: false, check: { max_length: 100 } }, // check max length
        age: { type: 'number', default: 18, check: { min: 18, max: 100 } },
        created_at: { type: 'date', to: 'iso_datetime' }
      }
    }
  }
})

validator.validate({
  code: 'SCHEMA_CODE',
  input: [{
    _id: 'caemowirf',
    age: 18,
    created_at: new Date()
  }]
})
```