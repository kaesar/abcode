module.exports = grammar({
  name: 'abcode',

  rules: {
    source_file: $ => repeat($._statement),

    _statement: $ => choice(
      $.comment,
      $.directive_statement,
      $.assignment,
      $.function_call,
      $.string,
      $.number
    ),

    comment: $ => /#.*/,

    directive_statement: $ => seq(
      field('name', $.identifier),
      ':',
      optional($._expression)
    ),

    assignment: $ => seq(
      $.identifier,
      '=',
      $._expression
    ),

    function_call: $ => seq(
      field('name', $.identifier),
      '(',
      optional($.argument_list),
      ')'
    ),

    argument_list: $ => seq(
      $._expression,
      repeat(seq(',', $._expression))
    ),

    _expression: $ => choice(
      $.string,
      $.number,
      $.identifier,
      $.function_call
    ),

    string: $ => choice(
      seq('"', repeat(choice($.string_content, $.string_interpolation)), '"'),
      seq("'", repeat($.string_content), "'")
    ),

    string_content: $ => /[^"'\\{]+/,

    string_interpolation: $ => seq(
      '{',
      $.identifier,
      optional(seq(':', /[^}]+/)),
      '}'
    ),

    number: $ => /\d+(\.\d+)?/,

    identifier: $ => /[a-zA-Z_][a-zA-Z0-9_]*/
  }
});