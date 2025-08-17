const validator = require('../index');

describe('validator', () => {

  const tests = [
    {
      code: 'TestSchema',
      schema: [{
        string: { type: 'string', require: true, nullable: false },
        strict_string: { type: 'string', require: true, nullable: false, strict: true },
        date_convert_to_iso_string_then_lowercase: { type: 'date', require: true, nullable: false, to: `iso_datetime,lowercase` },
        strict_object: {
          string: { type: 'string' },
        },
        set: { type: 'array', element: { type: 'string' }, check: { set: true } },
        unique_code: { type: 'array', check: { unique: 'code' }, element: { code: { type: 'string' }, age: { type: 'number' } } },
        boolean: { type: 'boolean' },
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
        },
        function: { type: 'function' },
      }],
      input: [{
        string: undefined,
        strict_string: 3,
        date_convert_to_iso_string_then_lowercase: new Date(),
        strict_object: 'string',
        set: ['1', '2', '1'],
        unique_code: [{ code: 1, age: 1 }, { code: 2 }, { code: 1, age: 2 }, { code: 1, age: 1 }],
        boolean: 'true',
        number_min_5_max_3: 4,
        function: 'string',
      }],
      expected: {
        output: [
          {
            strict_string: 3,
            date_convert_to_iso_string_then_lowercase: new Date().toISOString().toLowerCase(),
            strict_object: "string",
            string: undefined,
            set: ['1', '2', '1'],
            unique_code: [{ code: "1", age: 1 }, { code: "2", age: undefined }, { code: "1", age: 2 }, { code: "1", age: 1 }],
            boolean: true,
            number_min_5_max_3: 4,
            custom: "ARRAY>0",
            function: 'string',
          }
        ],
        errors: [
          {
            field: "[0].string",
            invalid: "require"
          },
          {
            field: "[0].strict_string",
            invalid: "type",
            expect: "string"
          },
          {
            field: "[0].strict_object",
            invalid: "type",
            expect: "object"
          },
          {
            field: "[0].set.[0]",
            invalid: "set"
          },
          {
            field: "[0].set.[2]",
            invalid: "set"
          },
          {
            invalid: "unique",
            field: "[0].unique_code.[0].code"
          },
          {
            invalid: "unique",
            field: "[0].unique_code.[2].code"
          },
          {
            invalid: "unique",
            field: "[0].unique_code.[3].code"
          },
          {
            field: "[0].number_min_5_max_3",
            invalid: "min",
            min_value: 5
          },
          {
            field: "[0].number_min_5_max_3",
            invalid: "max",
            min_value: 3
          },
          {
            field: "[0].function",
            invalid: "type",
            expect: "function"
          }
        ]
      }
    }
  ];

  before(() => {
    initTest = (test) => {
      validator.compile({ code: test.code, schema: test.schema });
    };

    tests.forEach(initTest)
  })

  it('validator.validate()', () => {
    doTest = (test) => {
      const result = validator.validate({ code: test.code, input: test.input });
      expect(result).to.deep.equal(test.expected)
    };

    tests.forEach(doTest)
  })
})