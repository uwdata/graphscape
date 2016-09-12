(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.cp = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

},{}],2:[function(require,module,exports){
function toMap(list) {
  var map = {}, i, n;
  for (i=0, n=list.length; i<n; ++i) map[list[i]] = 1;
  return map;
}

function keys(object) {
  var list = [], k;
  for (k in object) list.push(k);
  return list;
}

module.exports = function(opt) {
  opt = opt || {};
  var constants = opt.constants || require('./constants'),
      functions = (opt.functions || require('./functions'))(codegen),
      functionDefs = opt.functionDefs ? opt.functionDefs(codegen) : {},
      idWhiteList = opt.idWhiteList ? toMap(opt.idWhiteList) : null,
      idBlackList = opt.idBlackList ? toMap(opt.idBlackList) : null,
      memberDepth = 0,
      FIELD_VAR = opt.fieldVar || 'datum',
      GLOBAL_VAR = opt.globalVar || 'signals',
      globals = {},
      fields = {},
      dataSources = {};

  function codegen_wrap(ast) {
    var retval = {
      code: codegen(ast),
      globals: keys(globals),
      fields: keys(fields),
      dataSources: keys(dataSources),
      defs: functionDefs
    };
    globals = {};
    fields = {};
    dataSources = {};
    return retval;
  }

  /* istanbul ignore next */
  var lookupGlobal = typeof GLOBAL_VAR === 'function' ? GLOBAL_VAR :
    function (id) {
      return GLOBAL_VAR + '["' + id + '"]';
    };

  function codegen(ast) {
    if (typeof ast === 'string') return ast;
    var generator = CODEGEN_TYPES[ast.type];
    if (generator == null) {
      throw new Error('Unsupported type: ' + ast.type);
    }
    return generator(ast);
  }

  var CODEGEN_TYPES = {
    'Literal': function(n) {
        return n.raw;
      },
    'Identifier': function(n) {
        var id = n.name;
        if (memberDepth > 0) {
          return id;
        }
        if (constants.hasOwnProperty(id)) {
          return constants[id];
        }
        if (idWhiteList) {
          if (idWhiteList.hasOwnProperty(id)) {
            return id;
          } else {
            globals[id] = 1;
            return lookupGlobal(id);
          }
        }
        if (idBlackList && idBlackList.hasOwnProperty(id)) {
          throw new Error('Illegal identifier: ' + id);
        }
        return id;
      },
    'Program': function(n) {
        return n.body.map(codegen).join('\n');
      },
    'MemberExpression': function(n) {
        var d = !n.computed;
        var o = codegen(n.object);
        if (d) memberDepth += 1;
        var p = codegen(n.property);
        if (o === FIELD_VAR) { fields[p] = 1; } // HACKish...
        if (d) memberDepth -= 1;
        return o + (d ? '.'+p : '['+p+']');
      },
    'CallExpression': function(n) {
        if (n.callee.type !== 'Identifier') {
          throw new Error('Illegal callee type: ' + n.callee.type);
        }
        var callee = n.callee.name;
        var args = n.arguments;
        var fn = functions.hasOwnProperty(callee) && functions[callee];
        if (!fn) throw new Error('Unrecognized function: ' + callee);
        return fn instanceof Function ?
          fn(args, globals, fields, dataSources) :
          fn + '(' + args.map(codegen).join(',') + ')';
      },
    'ArrayExpression': function(n) {
        return '[' + n.elements.map(codegen).join(',') + ']';
      },
    'BinaryExpression': function(n) {
        return '(' + codegen(n.left) + n.operator + codegen(n.right) + ')';
      },
    'UnaryExpression': function(n) {
        return '(' + n.operator + codegen(n.argument) + ')';
      },
    'ConditionalExpression': function(n) {
        return '(' + codegen(n.test) +
          '?' + codegen(n.consequent) +
          ':' + codegen(n.alternate) +
          ')';
      },
    'LogicalExpression': function(n) {
        return '(' + codegen(n.left) + n.operator + codegen(n.right) + ')';
      },
    'ObjectExpression': function(n) {
        return '{' + n.properties.map(codegen).join(',') + '}';
      },
    'Property': function(n) {
        memberDepth += 1;
        var k = codegen(n.key);
        memberDepth -= 1;
        return k + ':' + codegen(n.value);
      },
    'ExpressionStatement': function(n) {
        return codegen(n.expression);
      }
  };

  codegen_wrap.functions = functions;
  codegen_wrap.functionDefs = functionDefs;
  codegen_wrap.constants = constants;
  return codegen_wrap;
};

},{"./constants":3,"./functions":4}],3:[function(require,module,exports){
module.exports = {
  'NaN':     'NaN',
  'E':       'Math.E',
  'LN2':     'Math.LN2',
  'LN10':    'Math.LN10',
  'LOG2E':   'Math.LOG2E',
  'LOG10E':  'Math.LOG10E',
  'PI':      'Math.PI',
  'SQRT1_2': 'Math.SQRT1_2',
  'SQRT2':   'Math.SQRT2'
};
},{}],4:[function(require,module,exports){
module.exports = function(codegen) {

  function fncall(name, args, cast, type) {
    var obj = codegen(args[0]);
    if (cast) {
      obj = cast + '(' + obj + ')';
      if (cast.lastIndexOf('new ', 0) === 0) obj = '(' + obj + ')';
    }
    return obj + '.' + name + (type < 0 ? '' : type === 0 ?
      '()' :
      '(' + args.slice(1).map(codegen).join(',') + ')');
  }

  function fn(name, cast, type) {
    return function(args) {
      return fncall(name, args, cast, type);
    };
  }

  var DATE = 'new Date',
      STRING = 'String',
      REGEXP = 'RegExp';

  return {
    // MATH functions
    'isNaN':    'isNaN',
    'isFinite': 'isFinite',
    'abs':      'Math.abs',
    'acos':     'Math.acos',
    'asin':     'Math.asin',
    'atan':     'Math.atan',
    'atan2':    'Math.atan2',
    'ceil':     'Math.ceil',
    'cos':      'Math.cos',
    'exp':      'Math.exp',
    'floor':    'Math.floor',
    'log':      'Math.log',
    'max':      'Math.max',
    'min':      'Math.min',
    'pow':      'Math.pow',
    'random':   'Math.random',
    'round':    'Math.round',
    'sin':      'Math.sin',
    'sqrt':     'Math.sqrt',
    'tan':      'Math.tan',

    'clamp': function(args) {
      if (args.length < 3)
        throw new Error('Missing arguments to clamp function.');
      if (args.length > 3)
        throw new Error('Too many arguments to clamp function.');
      var a = args.map(codegen);
      return 'Math.max('+a[1]+', Math.min('+a[2]+','+a[0]+'))';
    },

    // DATE functions
    'now':             'Date.now',
    'utc':             'Date.UTC',
    'datetime':        DATE,
    'date':            fn('getDate', DATE, 0),
    'day':             fn('getDay', DATE, 0),
    'year':            fn('getFullYear', DATE, 0),
    'month':           fn('getMonth', DATE, 0),
    'hours':           fn('getHours', DATE, 0),
    'minutes':         fn('getMinutes', DATE, 0),
    'seconds':         fn('getSeconds', DATE, 0),
    'milliseconds':    fn('getMilliseconds', DATE, 0),
    'time':            fn('getTime', DATE, 0),
    'timezoneoffset':  fn('getTimezoneOffset', DATE, 0),
    'utcdate':         fn('getUTCDate', DATE, 0),
    'utcday':          fn('getUTCDay', DATE, 0),
    'utcyear':         fn('getUTCFullYear', DATE, 0),
    'utcmonth':        fn('getUTCMonth', DATE, 0),
    'utchours':        fn('getUTCHours', DATE, 0),
    'utcminutes':      fn('getUTCMinutes', DATE, 0),
    'utcseconds':      fn('getUTCSeconds', DATE, 0),
    'utcmilliseconds': fn('getUTCMilliseconds', DATE, 0),

    // shared sequence functions
    'length':      fn('length', null, -1),
    'indexof':     fn('indexOf', null),
    'lastindexof': fn('lastIndexOf', null),

    // STRING functions
    'parseFloat':  'parseFloat',
    'parseInt':    'parseInt',
    'upper':       fn('toUpperCase', STRING, 0),
    'lower':       fn('toLowerCase', STRING, 0),
    'slice':       fn('slice', STRING),
    'substring':   fn('substring', STRING),
    'replace':     fn('replace', STRING),

    // REGEXP functions
    'regexp':  REGEXP,
    'test':    fn('test', REGEXP),

    // Control Flow functions
    'if': function(args) {
        if (args.length < 3)
          throw new Error('Missing arguments to if function.');
        if (args.length > 3)
          throw new Error('Too many arguments to if function.');
        var a = args.map(codegen);
        return a[0]+'?'+a[1]+':'+a[2];
      }
  };
};

},{}],5:[function(require,module,exports){
var parser = require('./parser'),
    codegen = require('./codegen');

var expr = module.exports = {
  parse: function(input, opt) {
      return parser.parse('('+input+')', opt);
    },
  code: function(opt) {
      return codegen(opt);
    },
  compiler: function(args, opt) {
      args = args.slice();
      var generator = codegen(opt),
          len = args.length,
          compile = function(str) {
            var value = generator(expr.parse(str));
            args[len] = '"use strict"; return (' + value.code + ');';
            var fn = Function.apply(null, args);
            value.fn = (args.length > 8) ?
              function() { return fn.apply(value, arguments); } :
              function(a, b, c, d, e, f, g) {
                return fn.call(value, a, b, c, d, e, f, g);
              }; // call often faster than apply, use if args low enough
            return value;
          };
      compile.codegen = generator;
      return compile;
    },
  functions: require('./functions'),
  constants: require('./constants')
};
},{"./codegen":2,"./constants":3,"./functions":4,"./parser":6}],6:[function(require,module,exports){
/*
  The following expression parser is based on Esprima (http://esprima.org/).
  Original header comment and license for Esprima is included here:

  Copyright (C) 2013 Ariya Hidayat <ariya.hidayat@gmail.com>
  Copyright (C) 2013 Thaddee Tyl <thaddee.tyl@gmail.com>
  Copyright (C) 2013 Mathias Bynens <mathias@qiwi.be>
  Copyright (C) 2012 Ariya Hidayat <ariya.hidayat@gmail.com>
  Copyright (C) 2012 Mathias Bynens <mathias@qiwi.be>
  Copyright (C) 2012 Joost-Wim Boekesteijn <joost-wim@boekesteijn.nl>
  Copyright (C) 2012 Kris Kowal <kris.kowal@cixar.com>
  Copyright (C) 2012 Yusuke Suzuki <utatane.tea@gmail.com>
  Copyright (C) 2012 Arpad Borsos <arpad.borsos@googlemail.com>
  Copyright (C) 2011 Ariya Hidayat <ariya.hidayat@gmail.com>

  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
  ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
  DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
  ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
  THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/
/* istanbul ignore next */
module.exports = (function() {
  'use strict';

  var Token,
      TokenName,
      Syntax,
      PropertyKind,
      Messages,
      Regex,
      source,
      strict,
      index,
      lineNumber,
      lineStart,
      length,
      lookahead,
      state,
      extra;

  Token = {
      BooleanLiteral: 1,
      EOF: 2,
      Identifier: 3,
      Keyword: 4,
      NullLiteral: 5,
      NumericLiteral: 6,
      Punctuator: 7,
      StringLiteral: 8,
      RegularExpression: 9
  };

  TokenName = {};
  TokenName[Token.BooleanLiteral] = 'Boolean';
  TokenName[Token.EOF] = '<end>';
  TokenName[Token.Identifier] = 'Identifier';
  TokenName[Token.Keyword] = 'Keyword';
  TokenName[Token.NullLiteral] = 'Null';
  TokenName[Token.NumericLiteral] = 'Numeric';
  TokenName[Token.Punctuator] = 'Punctuator';
  TokenName[Token.StringLiteral] = 'String';
  TokenName[Token.RegularExpression] = 'RegularExpression';

  Syntax = {
      AssignmentExpression: 'AssignmentExpression',
      ArrayExpression: 'ArrayExpression',
      BinaryExpression: 'BinaryExpression',
      CallExpression: 'CallExpression',
      ConditionalExpression: 'ConditionalExpression',
      ExpressionStatement: 'ExpressionStatement',
      Identifier: 'Identifier',
      Literal: 'Literal',
      LogicalExpression: 'LogicalExpression',
      MemberExpression: 'MemberExpression',
      ObjectExpression: 'ObjectExpression',
      Program: 'Program',
      Property: 'Property',
      UnaryExpression: 'UnaryExpression'
  };

  PropertyKind = {
      Data: 1,
      Get: 2,
      Set: 4
  };

  // Error messages should be identical to V8.
  Messages = {
      UnexpectedToken:  'Unexpected token %0',
      UnexpectedNumber:  'Unexpected number',
      UnexpectedString:  'Unexpected string',
      UnexpectedIdentifier:  'Unexpected identifier',
      UnexpectedReserved:  'Unexpected reserved word',
      UnexpectedEOS:  'Unexpected end of input',
      NewlineAfterThrow:  'Illegal newline after throw',
      InvalidRegExp: 'Invalid regular expression',
      UnterminatedRegExp:  'Invalid regular expression: missing /',
      InvalidLHSInAssignment:  'Invalid left-hand side in assignment',
      InvalidLHSInForIn:  'Invalid left-hand side in for-in',
      MultipleDefaultsInSwitch: 'More than one default clause in switch statement',
      NoCatchOrFinally:  'Missing catch or finally after try',
      UnknownLabel: 'Undefined label \'%0\'',
      Redeclaration: '%0 \'%1\' has already been declared',
      IllegalContinue: 'Illegal continue statement',
      IllegalBreak: 'Illegal break statement',
      IllegalReturn: 'Illegal return statement',
      StrictModeWith:  'Strict mode code may not include a with statement',
      StrictCatchVariable:  'Catch variable may not be eval or arguments in strict mode',
      StrictVarName:  'Variable name may not be eval or arguments in strict mode',
      StrictParamName:  'Parameter name eval or arguments is not allowed in strict mode',
      StrictParamDupe: 'Strict mode function may not have duplicate parameter names',
      StrictFunctionName:  'Function name may not be eval or arguments in strict mode',
      StrictOctalLiteral:  'Octal literals are not allowed in strict mode.',
      StrictDelete:  'Delete of an unqualified identifier in strict mode.',
      StrictDuplicateProperty:  'Duplicate data property in object literal not allowed in strict mode',
      AccessorDataProperty:  'Object literal may not have data and accessor property with the same name',
      AccessorGetSet:  'Object literal may not have multiple get/set accessors with the same name',
      StrictLHSAssignment:  'Assignment to eval or arguments is not allowed in strict mode',
      StrictLHSPostfix:  'Postfix increment/decrement may not have eval or arguments operand in strict mode',
      StrictLHSPrefix:  'Prefix increment/decrement may not have eval or arguments operand in strict mode',
      StrictReservedWord:  'Use of future reserved word in strict mode'
  };

  // See also tools/generate-unicode-regex.py.
  Regex = {
      NonAsciiIdentifierStart: new RegExp('[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u08A0-\u08B2\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58\u0C59\u0C60\u0C61\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D60\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1877\u1880-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19C1-\u19C7\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2E2F\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303C\u3041-\u3096\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA69D\uA6A0-\uA6EF\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA7AD\uA7B0\uA7B1\uA7F7-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uA9E0-\uA9E4\uA9E6-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB5F\uAB64\uAB65\uABC0-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]'),
      NonAsciiIdentifierPart: new RegExp('[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0300-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u0483-\u0487\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u05D0-\u05EA\u05F0-\u05F2\u0610-\u061A\u0620-\u0669\u066E-\u06D3\u06D5-\u06DC\u06DF-\u06E8\u06EA-\u06FC\u06FF\u0710-\u074A\u074D-\u07B1\u07C0-\u07F5\u07FA\u0800-\u082D\u0840-\u085B\u08A0-\u08B2\u08E4-\u0963\u0966-\u096F\u0971-\u0983\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BC-\u09C4\u09C7\u09C8\u09CB-\u09CE\u09D7\u09DC\u09DD\u09DF-\u09E3\u09E6-\u09F1\u0A01-\u0A03\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A59-\u0A5C\u0A5E\u0A66-\u0A75\u0A81-\u0A83\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABC-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AD0\u0AE0-\u0AE3\u0AE6-\u0AEF\u0B01-\u0B03\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3C-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B5C\u0B5D\u0B5F-\u0B63\u0B66-\u0B6F\u0B71\u0B82\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD0\u0BD7\u0BE6-\u0BEF\u0C00-\u0C03\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C58\u0C59\u0C60-\u0C63\u0C66-\u0C6F\u0C81-\u0C83\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBC-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CDE\u0CE0-\u0CE3\u0CE6-\u0CEF\u0CF1\u0CF2\u0D01-\u0D03\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D-\u0D44\u0D46-\u0D48\u0D4A-\u0D4E\u0D57\u0D60-\u0D63\u0D66-\u0D6F\u0D7A-\u0D7F\u0D82\u0D83\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DE6-\u0DEF\u0DF2\u0DF3\u0E01-\u0E3A\u0E40-\u0E4E\u0E50-\u0E59\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB9\u0EBB-\u0EBD\u0EC0-\u0EC4\u0EC6\u0EC8-\u0ECD\u0ED0-\u0ED9\u0EDC-\u0EDF\u0F00\u0F18\u0F19\u0F20-\u0F29\u0F35\u0F37\u0F39\u0F3E-\u0F47\u0F49-\u0F6C\u0F71-\u0F84\u0F86-\u0F97\u0F99-\u0FBC\u0FC6\u1000-\u1049\u1050-\u109D\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u135D-\u135F\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1714\u1720-\u1734\u1740-\u1753\u1760-\u176C\u176E-\u1770\u1772\u1773\u1780-\u17D3\u17D7\u17DC\u17DD\u17E0-\u17E9\u180B-\u180D\u1810-\u1819\u1820-\u1877\u1880-\u18AA\u18B0-\u18F5\u1900-\u191E\u1920-\u192B\u1930-\u193B\u1946-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u19D0-\u19D9\u1A00-\u1A1B\u1A20-\u1A5E\u1A60-\u1A7C\u1A7F-\u1A89\u1A90-\u1A99\u1AA7\u1AB0-\u1ABD\u1B00-\u1B4B\u1B50-\u1B59\u1B6B-\u1B73\u1B80-\u1BF3\u1C00-\u1C37\u1C40-\u1C49\u1C4D-\u1C7D\u1CD0-\u1CD2\u1CD4-\u1CF6\u1CF8\u1CF9\u1D00-\u1DF5\u1DFC-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u200C\u200D\u203F\u2040\u2054\u2071\u207F\u2090-\u209C\u20D0-\u20DC\u20E1\u20E5-\u20F0\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D7F-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2DE0-\u2DFF\u2E2F\u3005-\u3007\u3021-\u302F\u3031-\u3035\u3038-\u303C\u3041-\u3096\u3099\u309A\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA62B\uA640-\uA66F\uA674-\uA67D\uA67F-\uA69D\uA69F-\uA6F1\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA7AD\uA7B0\uA7B1\uA7F7-\uA827\uA840-\uA873\uA880-\uA8C4\uA8D0-\uA8D9\uA8E0-\uA8F7\uA8FB\uA900-\uA92D\uA930-\uA953\uA960-\uA97C\uA980-\uA9C0\uA9CF-\uA9D9\uA9E0-\uA9FE\uAA00-\uAA36\uAA40-\uAA4D\uAA50-\uAA59\uAA60-\uAA76\uAA7A-\uAAC2\uAADB-\uAADD\uAAE0-\uAAEF\uAAF2-\uAAF6\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB5F\uAB64\uAB65\uABC0-\uABEA\uABEC\uABED\uABF0-\uABF9\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE00-\uFE0F\uFE20-\uFE2D\uFE33\uFE34\uFE4D-\uFE4F\uFE70-\uFE74\uFE76-\uFEFC\uFF10-\uFF19\uFF21-\uFF3A\uFF3F\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]')
  };

  // Ensure the condition is true, otherwise throw an error.
  // This is only to have a better contract semantic, i.e. another safety net
  // to catch a logic error. The condition shall be fulfilled in normal case.
  // Do NOT use this to enforce a certain condition on any user input.

  function assert(condition, message) {
      if (!condition) {
          throw new Error('ASSERT: ' + message);
      }
  }

  function isDecimalDigit(ch) {
      return (ch >= 0x30 && ch <= 0x39);   // 0..9
  }

  function isHexDigit(ch) {
      return '0123456789abcdefABCDEF'.indexOf(ch) >= 0;
  }

  function isOctalDigit(ch) {
      return '01234567'.indexOf(ch) >= 0;
  }

  // 7.2 White Space

  function isWhiteSpace(ch) {
      return (ch === 0x20) || (ch === 0x09) || (ch === 0x0B) || (ch === 0x0C) || (ch === 0xA0) ||
          (ch >= 0x1680 && [0x1680, 0x180E, 0x2000, 0x2001, 0x2002, 0x2003, 0x2004, 0x2005, 0x2006, 0x2007, 0x2008, 0x2009, 0x200A, 0x202F, 0x205F, 0x3000, 0xFEFF].indexOf(ch) >= 0);
  }

  // 7.3 Line Terminators

  function isLineTerminator(ch) {
      return (ch === 0x0A) || (ch === 0x0D) || (ch === 0x2028) || (ch === 0x2029);
  }

  // 7.6 Identifier Names and Identifiers

  function isIdentifierStart(ch) {
      return (ch === 0x24) || (ch === 0x5F) ||  // $ (dollar) and _ (underscore)
          (ch >= 0x41 && ch <= 0x5A) ||         // A..Z
          (ch >= 0x61 && ch <= 0x7A) ||         // a..z
          (ch === 0x5C) ||                      // \ (backslash)
          ((ch >= 0x80) && Regex.NonAsciiIdentifierStart.test(String.fromCharCode(ch)));
  }

  function isIdentifierPart(ch) {
      return (ch === 0x24) || (ch === 0x5F) ||  // $ (dollar) and _ (underscore)
          (ch >= 0x41 && ch <= 0x5A) ||         // A..Z
          (ch >= 0x61 && ch <= 0x7A) ||         // a..z
          (ch >= 0x30 && ch <= 0x39) ||         // 0..9
          (ch === 0x5C) ||                      // \ (backslash)
          ((ch >= 0x80) && Regex.NonAsciiIdentifierPart.test(String.fromCharCode(ch)));
  }

  // 7.6.1.2 Future Reserved Words

  function isFutureReservedWord(id) {
      switch (id) {
      case 'class':
      case 'enum':
      case 'export':
      case 'extends':
      case 'import':
      case 'super':
          return true;
      default:
          return false;
      }
  }

  function isStrictModeReservedWord(id) {
      switch (id) {
      case 'implements':
      case 'interface':
      case 'package':
      case 'private':
      case 'protected':
      case 'public':
      case 'static':
      case 'yield':
      case 'let':
          return true;
      default:
          return false;
      }
  }

  // 7.6.1.1 Keywords

  function isKeyword(id) {
      if (strict && isStrictModeReservedWord(id)) {
          return true;
      }

      // 'const' is specialized as Keyword in V8.
      // 'yield' and 'let' are for compatiblity with SpiderMonkey and ES.next.
      // Some others are from future reserved words.

      switch (id.length) {
      case 2:
          return (id === 'if') || (id === 'in') || (id === 'do');
      case 3:
          return (id === 'var') || (id === 'for') || (id === 'new') ||
              (id === 'try') || (id === 'let');
      case 4:
          return (id === 'this') || (id === 'else') || (id === 'case') ||
              (id === 'void') || (id === 'with') || (id === 'enum');
      case 5:
          return (id === 'while') || (id === 'break') || (id === 'catch') ||
              (id === 'throw') || (id === 'const') || (id === 'yield') ||
              (id === 'class') || (id === 'super');
      case 6:
          return (id === 'return') || (id === 'typeof') || (id === 'delete') ||
              (id === 'switch') || (id === 'export') || (id === 'import');
      case 7:
          return (id === 'default') || (id === 'finally') || (id === 'extends');
      case 8:
          return (id === 'function') || (id === 'continue') || (id === 'debugger');
      case 10:
          return (id === 'instanceof');
      default:
          return false;
      }
  }

  function skipComment() {
      var ch, start;

      start = (index === 0);
      while (index < length) {
          ch = source.charCodeAt(index);

          if (isWhiteSpace(ch)) {
              ++index;
          } else if (isLineTerminator(ch)) {
              ++index;
              if (ch === 0x0D && source.charCodeAt(index) === 0x0A) {
                  ++index;
              }
              ++lineNumber;
              lineStart = index;
              start = true;
          } else {
              break;
          }
      }
  }

  function scanHexEscape(prefix) {
      var i, len, ch, code = 0;

      len = (prefix === 'u') ? 4 : 2;
      for (i = 0; i < len; ++i) {
          if (index < length && isHexDigit(source[index])) {
              ch = source[index++];
              code = code * 16 + '0123456789abcdef'.indexOf(ch.toLowerCase());
          } else {
              return '';
          }
      }
      return String.fromCharCode(code);
  }

  function scanUnicodeCodePointEscape() {
      var ch, code, cu1, cu2;

      ch = source[index];
      code = 0;

      // At least, one hex digit is required.
      if (ch === '}') {
          throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
      }

      while (index < length) {
          ch = source[index++];
          if (!isHexDigit(ch)) {
              break;
          }
          code = code * 16 + '0123456789abcdef'.indexOf(ch.toLowerCase());
      }

      if (code > 0x10FFFF || ch !== '}') {
          throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
      }

      // UTF-16 Encoding
      if (code <= 0xFFFF) {
          return String.fromCharCode(code);
      }
      cu1 = ((code - 0x10000) >> 10) + 0xD800;
      cu2 = ((code - 0x10000) & 1023) + 0xDC00;
      return String.fromCharCode(cu1, cu2);
  }

  function getEscapedIdentifier() {
      var ch, id;

      ch = source.charCodeAt(index++);
      id = String.fromCharCode(ch);

      // '\u' (U+005C, U+0075) denotes an escaped character.
      if (ch === 0x5C) {
          if (source.charCodeAt(index) !== 0x75) {
              throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
          }
          ++index;
          ch = scanHexEscape('u');
          if (!ch || ch === '\\' || !isIdentifierStart(ch.charCodeAt(0))) {
              throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
          }
          id = ch;
      }

      while (index < length) {
          ch = source.charCodeAt(index);
          if (!isIdentifierPart(ch)) {
              break;
          }
          ++index;
          id += String.fromCharCode(ch);

          // '\u' (U+005C, U+0075) denotes an escaped character.
          if (ch === 0x5C) {
              id = id.substr(0, id.length - 1);
              if (source.charCodeAt(index) !== 0x75) {
                  throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
              }
              ++index;
              ch = scanHexEscape('u');
              if (!ch || ch === '\\' || !isIdentifierPart(ch.charCodeAt(0))) {
                  throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
              }
              id += ch;
          }
      }

      return id;
  }

  function getIdentifier() {
      var start, ch;

      start = index++;
      while (index < length) {
          ch = source.charCodeAt(index);
          if (ch === 0x5C) {
              // Blackslash (U+005C) marks Unicode escape sequence.
              index = start;
              return getEscapedIdentifier();
          }
          if (isIdentifierPart(ch)) {
              ++index;
          } else {
              break;
          }
      }

      return source.slice(start, index);
  }

  function scanIdentifier() {
      var start, id, type;

      start = index;

      // Backslash (U+005C) starts an escaped character.
      id = (source.charCodeAt(index) === 0x5C) ? getEscapedIdentifier() : getIdentifier();

      // There is no keyword or literal with only one character.
      // Thus, it must be an identifier.
      if (id.length === 1) {
          type = Token.Identifier;
      } else if (isKeyword(id)) {
          type = Token.Keyword;
      } else if (id === 'null') {
          type = Token.NullLiteral;
      } else if (id === 'true' || id === 'false') {
          type = Token.BooleanLiteral;
      } else {
          type = Token.Identifier;
      }

      return {
          type: type,
          value: id,
          lineNumber: lineNumber,
          lineStart: lineStart,
          start: start,
          end: index
      };
  }

  // 7.7 Punctuators

  function scanPunctuator() {
      var start = index,
          code = source.charCodeAt(index),
          code2,
          ch1 = source[index],
          ch2,
          ch3,
          ch4;

      switch (code) {

      // Check for most common single-character punctuators.
      case 0x2E:  // . dot
      case 0x28:  // ( open bracket
      case 0x29:  // ) close bracket
      case 0x3B:  // ; semicolon
      case 0x2C:  // , comma
      case 0x7B:  // { open curly brace
      case 0x7D:  // } close curly brace
      case 0x5B:  // [
      case 0x5D:  // ]
      case 0x3A:  // :
      case 0x3F:  // ?
      case 0x7E:  // ~
          ++index;
          if (extra.tokenize) {
              if (code === 0x28) {
                  extra.openParenToken = extra.tokens.length;
              } else if (code === 0x7B) {
                  extra.openCurlyToken = extra.tokens.length;
              }
          }
          return {
              type: Token.Punctuator,
              value: String.fromCharCode(code),
              lineNumber: lineNumber,
              lineStart: lineStart,
              start: start,
              end: index
          };

      default:
          code2 = source.charCodeAt(index + 1);

          // '=' (U+003D) marks an assignment or comparison operator.
          if (code2 === 0x3D) {
              switch (code) {
              case 0x2B:  // +
              case 0x2D:  // -
              case 0x2F:  // /
              case 0x3C:  // <
              case 0x3E:  // >
              case 0x5E:  // ^
              case 0x7C:  // |
              case 0x25:  // %
              case 0x26:  // &
              case 0x2A:  // *
                  index += 2;
                  return {
                      type: Token.Punctuator,
                      value: String.fromCharCode(code) + String.fromCharCode(code2),
                      lineNumber: lineNumber,
                      lineStart: lineStart,
                      start: start,
                      end: index
                  };

              case 0x21: // !
              case 0x3D: // =
                  index += 2;

                  // !== and ===
                  if (source.charCodeAt(index) === 0x3D) {
                      ++index;
                  }
                  return {
                      type: Token.Punctuator,
                      value: source.slice(start, index),
                      lineNumber: lineNumber,
                      lineStart: lineStart,
                      start: start,
                      end: index
                  };
              }
          }
      }

      // 4-character punctuator: >>>=

      ch4 = source.substr(index, 4);

      if (ch4 === '>>>=') {
          index += 4;
          return {
              type: Token.Punctuator,
              value: ch4,
              lineNumber: lineNumber,
              lineStart: lineStart,
              start: start,
              end: index
          };
      }

      // 3-character punctuators: === !== >>> <<= >>=

      ch3 = ch4.substr(0, 3);

      if (ch3 === '>>>' || ch3 === '<<=' || ch3 === '>>=') {
          index += 3;
          return {
              type: Token.Punctuator,
              value: ch3,
              lineNumber: lineNumber,
              lineStart: lineStart,
              start: start,
              end: index
          };
      }

      // Other 2-character punctuators: ++ -- << >> && ||
      ch2 = ch3.substr(0, 2);

      if ((ch1 === ch2[1] && ('+-<>&|'.indexOf(ch1) >= 0)) || ch2 === '=>') {
          index += 2;
          return {
              type: Token.Punctuator,
              value: ch2,
              lineNumber: lineNumber,
              lineStart: lineStart,
              start: start,
              end: index
          };
      }

      // 1-character punctuators: < > = ! + - * % & | ^ /

      if ('<>=!+-*%&|^/'.indexOf(ch1) >= 0) {
          ++index;
          return {
              type: Token.Punctuator,
              value: ch1,
              lineNumber: lineNumber,
              lineStart: lineStart,
              start: start,
              end: index
          };
      }

      throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
  }

  // 7.8.3 Numeric Literals

  function scanHexLiteral(start) {
      var number = '';

      while (index < length) {
          if (!isHexDigit(source[index])) {
              break;
          }
          number += source[index++];
      }

      if (number.length === 0) {
          throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
      }

      if (isIdentifierStart(source.charCodeAt(index))) {
          throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
      }

      return {
          type: Token.NumericLiteral,
          value: parseInt('0x' + number, 16),
          lineNumber: lineNumber,
          lineStart: lineStart,
          start: start,
          end: index
      };
  }

  function scanOctalLiteral(start) {
      var number = '0' + source[index++];
      while (index < length) {
          if (!isOctalDigit(source[index])) {
              break;
          }
          number += source[index++];
      }

      if (isIdentifierStart(source.charCodeAt(index)) || isDecimalDigit(source.charCodeAt(index))) {
          throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
      }

      return {
          type: Token.NumericLiteral,
          value: parseInt(number, 8),
          octal: true,
          lineNumber: lineNumber,
          lineStart: lineStart,
          start: start,
          end: index
      };
  }

  function scanNumericLiteral() {
      var number, start, ch;

      ch = source[index];
      assert(isDecimalDigit(ch.charCodeAt(0)) || (ch === '.'),
          'Numeric literal must start with a decimal digit or a decimal point');

      start = index;
      number = '';
      if (ch !== '.') {
          number = source[index++];
          ch = source[index];

          // Hex number starts with '0x'.
          // Octal number starts with '0'.
          if (number === '0') {
              if (ch === 'x' || ch === 'X') {
                  ++index;
                  return scanHexLiteral(start);
              }
              if (isOctalDigit(ch)) {
                  return scanOctalLiteral(start);
              }

              // decimal number starts with '0' such as '09' is illegal.
              if (ch && isDecimalDigit(ch.charCodeAt(0))) {
                  throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
              }
          }

          while (isDecimalDigit(source.charCodeAt(index))) {
              number += source[index++];
          }
          ch = source[index];
      }

      if (ch === '.') {
          number += source[index++];
          while (isDecimalDigit(source.charCodeAt(index))) {
              number += source[index++];
          }
          ch = source[index];
      }

      if (ch === 'e' || ch === 'E') {
          number += source[index++];

          ch = source[index];
          if (ch === '+' || ch === '-') {
              number += source[index++];
          }
          if (isDecimalDigit(source.charCodeAt(index))) {
              while (isDecimalDigit(source.charCodeAt(index))) {
                  number += source[index++];
              }
          } else {
              throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
          }
      }

      if (isIdentifierStart(source.charCodeAt(index))) {
          throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
      }

      return {
          type: Token.NumericLiteral,
          value: parseFloat(number),
          lineNumber: lineNumber,
          lineStart: lineStart,
          start: start,
          end: index
      };
  }

  // 7.8.4 String Literals

  function scanStringLiteral() {
      var str = '', quote, start, ch, code, unescaped, restore, octal = false, startLineNumber, startLineStart;
      startLineNumber = lineNumber;
      startLineStart = lineStart;

      quote = source[index];
      assert((quote === '\'' || quote === '"'),
          'String literal must starts with a quote');

      start = index;
      ++index;

      while (index < length) {
          ch = source[index++];

          if (ch === quote) {
              quote = '';
              break;
          } else if (ch === '\\') {
              ch = source[index++];
              if (!ch || !isLineTerminator(ch.charCodeAt(0))) {
                  switch (ch) {
                  case 'u':
                  case 'x':
                      if (source[index] === '{') {
                          ++index;
                          str += scanUnicodeCodePointEscape();
                      } else {
                          restore = index;
                          unescaped = scanHexEscape(ch);
                          if (unescaped) {
                              str += unescaped;
                          } else {
                              index = restore;
                              str += ch;
                          }
                      }
                      break;
                  case 'n':
                      str += '\n';
                      break;
                  case 'r':
                      str += '\r';
                      break;
                  case 't':
                      str += '\t';
                      break;
                  case 'b':
                      str += '\b';
                      break;
                  case 'f':
                      str += '\f';
                      break;
                  case 'v':
                      str += '\x0B';
                      break;

                  default:
                      if (isOctalDigit(ch)) {
                          code = '01234567'.indexOf(ch);

                          // \0 is not octal escape sequence
                          if (code !== 0) {
                              octal = true;
                          }

                          if (index < length && isOctalDigit(source[index])) {
                              octal = true;
                              code = code * 8 + '01234567'.indexOf(source[index++]);

                              // 3 digits are only allowed when string starts
                              // with 0, 1, 2, 3
                              if ('0123'.indexOf(ch) >= 0 &&
                                      index < length &&
                                      isOctalDigit(source[index])) {
                                  code = code * 8 + '01234567'.indexOf(source[index++]);
                              }
                          }
                          str += String.fromCharCode(code);
                      } else {
                          str += ch;
                      }
                      break;
                  }
              } else {
                  ++lineNumber;
                  if (ch ===  '\r' && source[index] === '\n') {
                      ++index;
                  }
                  lineStart = index;
              }
          } else if (isLineTerminator(ch.charCodeAt(0))) {
              break;
          } else {
              str += ch;
          }
      }

      if (quote !== '') {
          throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
      }

      return {
          type: Token.StringLiteral,
          value: str,
          octal: octal,
          startLineNumber: startLineNumber,
          startLineStart: startLineStart,
          lineNumber: lineNumber,
          lineStart: lineStart,
          start: start,
          end: index
      };
  }

  function testRegExp(pattern, flags) {
      var tmp = pattern,
          value;

      if (flags.indexOf('u') >= 0) {
          // Replace each astral symbol and every Unicode code point
          // escape sequence with a single ASCII symbol to avoid throwing on
          // regular expressions that are only valid in combination with the
          // `/u` flag.
          // Note: replacing with the ASCII symbol `x` might cause false
          // negatives in unlikely scenarios. For example, `[\u{61}-b]` is a
          // perfectly valid pattern that is equivalent to `[a-b]`, but it
          // would be replaced by `[x-b]` which throws an error.
          tmp = tmp
              .replace(/\\u\{([0-9a-fA-F]+)\}/g, function ($0, $1) {
                  if (parseInt($1, 16) <= 0x10FFFF) {
                      return 'x';
                  }
                  throwError({}, Messages.InvalidRegExp);
              })
              .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, 'x');
      }

      // First, detect invalid regular expressions.
      try {
          value = new RegExp(tmp);
      } catch (e) {
          throwError({}, Messages.InvalidRegExp);
      }

      // Return a regular expression object for this pattern-flag pair, or
      // `null` in case the current environment doesn't support the flags it
      // uses.
      try {
          return new RegExp(pattern, flags);
      } catch (exception) {
          return null;
      }
  }

  function scanRegExpBody() {
      var ch, str, classMarker, terminated, body;

      ch = source[index];
      assert(ch === '/', 'Regular expression literal must start with a slash');
      str = source[index++];

      classMarker = false;
      terminated = false;
      while (index < length) {
          ch = source[index++];
          str += ch;
          if (ch === '\\') {
              ch = source[index++];
              // ECMA-262 7.8.5
              if (isLineTerminator(ch.charCodeAt(0))) {
                  throwError({}, Messages.UnterminatedRegExp);
              }
              str += ch;
          } else if (isLineTerminator(ch.charCodeAt(0))) {
              throwError({}, Messages.UnterminatedRegExp);
          } else if (classMarker) {
              if (ch === ']') {
                  classMarker = false;
              }
          } else {
              if (ch === '/') {
                  terminated = true;
                  break;
              } else if (ch === '[') {
                  classMarker = true;
              }
          }
      }

      if (!terminated) {
          throwError({}, Messages.UnterminatedRegExp);
      }

      // Exclude leading and trailing slash.
      body = str.substr(1, str.length - 2);
      return {
          value: body,
          literal: str
      };
  }

  function scanRegExpFlags() {
      var ch, str, flags, restore;

      str = '';
      flags = '';
      while (index < length) {
          ch = source[index];
          if (!isIdentifierPart(ch.charCodeAt(0))) {
              break;
          }

          ++index;
          if (ch === '\\' && index < length) {
              ch = source[index];
              if (ch === 'u') {
                  ++index;
                  restore = index;
                  ch = scanHexEscape('u');
                  if (ch) {
                      flags += ch;
                      for (str += '\\u'; restore < index; ++restore) {
                          str += source[restore];
                      }
                  } else {
                      index = restore;
                      flags += 'u';
                      str += '\\u';
                  }
                  throwErrorTolerant({}, Messages.UnexpectedToken, 'ILLEGAL');
              } else {
                  str += '\\';
                  throwErrorTolerant({}, Messages.UnexpectedToken, 'ILLEGAL');
              }
          } else {
              flags += ch;
              str += ch;
          }
      }

      return {
          value: flags,
          literal: str
      };
  }

  function scanRegExp() {
      var start, body, flags, value;

      lookahead = null;
      skipComment();
      start = index;

      body = scanRegExpBody();
      flags = scanRegExpFlags();
      value = testRegExp(body.value, flags.value);

      if (extra.tokenize) {
          return {
              type: Token.RegularExpression,
              value: value,
              regex: {
                  pattern: body.value,
                  flags: flags.value
              },
              lineNumber: lineNumber,
              lineStart: lineStart,
              start: start,
              end: index
          };
      }

      return {
          literal: body.literal + flags.literal,
          value: value,
          regex: {
              pattern: body.value,
              flags: flags.value
          },
          start: start,
          end: index
      };
  }

  function collectRegex() {
      var pos, loc, regex, token;

      skipComment();

      pos = index;
      loc = {
          start: {
              line: lineNumber,
              column: index - lineStart
          }
      };

      regex = scanRegExp();

      loc.end = {
          line: lineNumber,
          column: index - lineStart
      };

      if (!extra.tokenize) {
          // Pop the previous token, which is likely '/' or '/='
          if (extra.tokens.length > 0) {
              token = extra.tokens[extra.tokens.length - 1];
              if (token.range[0] === pos && token.type === 'Punctuator') {
                  if (token.value === '/' || token.value === '/=') {
                      extra.tokens.pop();
                  }
              }
          }

          extra.tokens.push({
              type: 'RegularExpression',
              value: regex.literal,
              regex: regex.regex,
              range: [pos, index],
              loc: loc
          });
      }

      return regex;
  }

  function isIdentifierName(token) {
      return token.type === Token.Identifier ||
          token.type === Token.Keyword ||
          token.type === Token.BooleanLiteral ||
          token.type === Token.NullLiteral;
  }

  function advanceSlash() {
      var prevToken,
          checkToken;
      // Using the following algorithm:
      // https://github.com/mozilla/sweet.js/wiki/design
      prevToken = extra.tokens[extra.tokens.length - 1];
      if (!prevToken) {
          // Nothing before that: it cannot be a division.
          return collectRegex();
      }
      if (prevToken.type === 'Punctuator') {
          if (prevToken.value === ']') {
              return scanPunctuator();
          }
          if (prevToken.value === ')') {
              checkToken = extra.tokens[extra.openParenToken - 1];
              if (checkToken &&
                      checkToken.type === 'Keyword' &&
                      (checkToken.value === 'if' ||
                       checkToken.value === 'while' ||
                       checkToken.value === 'for' ||
                       checkToken.value === 'with')) {
                  return collectRegex();
              }
              return scanPunctuator();
          }
          if (prevToken.value === '}') {
              // Dividing a function by anything makes little sense,
              // but we have to check for that.
              if (extra.tokens[extra.openCurlyToken - 3] &&
                      extra.tokens[extra.openCurlyToken - 3].type === 'Keyword') {
                  // Anonymous function.
                  checkToken = extra.tokens[extra.openCurlyToken - 4];
                  if (!checkToken) {
                      return scanPunctuator();
                  }
              } else if (extra.tokens[extra.openCurlyToken - 4] &&
                      extra.tokens[extra.openCurlyToken - 4].type === 'Keyword') {
                  // Named function.
                  checkToken = extra.tokens[extra.openCurlyToken - 5];
                  if (!checkToken) {
                      return collectRegex();
                  }
              } else {
                  return scanPunctuator();
              }
              return scanPunctuator();
          }
          return collectRegex();
      }
      if (prevToken.type === 'Keyword' && prevToken.value !== 'this') {
          return collectRegex();
      }
      return scanPunctuator();
  }

  function advance() {
      var ch;

      skipComment();

      if (index >= length) {
          return {
              type: Token.EOF,
              lineNumber: lineNumber,
              lineStart: lineStart,
              start: index,
              end: index
          };
      }

      ch = source.charCodeAt(index);

      if (isIdentifierStart(ch)) {
          return scanIdentifier();
      }

      // Very common: ( and ) and ;
      if (ch === 0x28 || ch === 0x29 || ch === 0x3B) {
          return scanPunctuator();
      }

      // String literal starts with single quote (U+0027) or double quote (U+0022).
      if (ch === 0x27 || ch === 0x22) {
          return scanStringLiteral();
      }


      // Dot (.) U+002E can also start a floating-point number, hence the need
      // to check the next character.
      if (ch === 0x2E) {
          if (isDecimalDigit(source.charCodeAt(index + 1))) {
              return scanNumericLiteral();
          }
          return scanPunctuator();
      }

      if (isDecimalDigit(ch)) {
          return scanNumericLiteral();
      }

      // Slash (/) U+002F can also start a regex.
      if (extra.tokenize && ch === 0x2F) {
          return advanceSlash();
      }

      return scanPunctuator();
  }

  function collectToken() {
      var loc, token, value, entry;

      skipComment();
      loc = {
          start: {
              line: lineNumber,
              column: index - lineStart
          }
      };

      token = advance();
      loc.end = {
          line: lineNumber,
          column: index - lineStart
      };

      if (token.type !== Token.EOF) {
          value = source.slice(token.start, token.end);
          entry = {
              type: TokenName[token.type],
              value: value,
              range: [token.start, token.end],
              loc: loc
          };
          if (token.regex) {
              entry.regex = {
                  pattern: token.regex.pattern,
                  flags: token.regex.flags
              };
          }
          extra.tokens.push(entry);
      }

      return token;
  }

  function lex() {
      var token;

      token = lookahead;
      index = token.end;
      lineNumber = token.lineNumber;
      lineStart = token.lineStart;

      lookahead = (typeof extra.tokens !== 'undefined') ? collectToken() : advance();

      index = token.end;
      lineNumber = token.lineNumber;
      lineStart = token.lineStart;

      return token;
  }

  function peek() {
      var pos, line, start;

      pos = index;
      line = lineNumber;
      start = lineStart;
      lookahead = (typeof extra.tokens !== 'undefined') ? collectToken() : advance();
      index = pos;
      lineNumber = line;
      lineStart = start;
  }

  function Position() {
      this.line = lineNumber;
      this.column = index - lineStart;
  }

  function SourceLocation() {
      this.start = new Position();
      this.end = null;
  }

  function WrappingSourceLocation(startToken) {
      if (startToken.type === Token.StringLiteral) {
          this.start = {
              line: startToken.startLineNumber,
              column: startToken.start - startToken.startLineStart
          };
      } else {
          this.start = {
              line: startToken.lineNumber,
              column: startToken.start - startToken.lineStart
          };
      }
      this.end = null;
  }

  function Node() {
      // Skip comment.
      index = lookahead.start;
      if (lookahead.type === Token.StringLiteral) {
          lineNumber = lookahead.startLineNumber;
          lineStart = lookahead.startLineStart;
      } else {
          lineNumber = lookahead.lineNumber;
          lineStart = lookahead.lineStart;
      }
      if (extra.range) {
          this.range = [index, 0];
      }
      if (extra.loc) {
          this.loc = new SourceLocation();
      }
  }

  function WrappingNode(startToken) {
      if (extra.range) {
          this.range = [startToken.start, 0];
      }
      if (extra.loc) {
          this.loc = new WrappingSourceLocation(startToken);
      }
  }

  WrappingNode.prototype = Node.prototype = {

      finish: function () {
          if (extra.range) {
              this.range[1] = index;
          }
          if (extra.loc) {
              this.loc.end = new Position();
              if (extra.source) {
                  this.loc.source = extra.source;
              }
          }
      },

      finishArrayExpression: function (elements) {
          this.type = Syntax.ArrayExpression;
          this.elements = elements;
          this.finish();
          return this;
      },

      finishAssignmentExpression: function (operator, left, right) {
          this.type = Syntax.AssignmentExpression;
          this.operator = operator;
          this.left = left;
          this.right = right;
          this.finish();
          return this;
      },

      finishBinaryExpression: function (operator, left, right) {
          this.type = (operator === '||' || operator === '&&') ? Syntax.LogicalExpression : Syntax.BinaryExpression;
          this.operator = operator;
          this.left = left;
          this.right = right;
          this.finish();
          return this;
      },

      finishCallExpression: function (callee, args) {
          this.type = Syntax.CallExpression;
          this.callee = callee;
          this.arguments = args;
          this.finish();
          return this;
      },

      finishConditionalExpression: function (test, consequent, alternate) {
          this.type = Syntax.ConditionalExpression;
          this.test = test;
          this.consequent = consequent;
          this.alternate = alternate;
          this.finish();
          return this;
      },

      finishExpressionStatement: function (expression) {
          this.type = Syntax.ExpressionStatement;
          this.expression = expression;
          this.finish();
          return this;
      },

      finishIdentifier: function (name) {
          this.type = Syntax.Identifier;
          this.name = name;
          this.finish();
          return this;
      },

      finishLiteral: function (token) {
          this.type = Syntax.Literal;
          this.value = token.value;
          this.raw = source.slice(token.start, token.end);
          if (token.regex) {
              if (this.raw == '//') {
                this.raw = '/(?:)/';
              }
              this.regex = token.regex;
          }
          this.finish();
          return this;
      },

      finishMemberExpression: function (accessor, object, property) {
          this.type = Syntax.MemberExpression;
          this.computed = accessor === '[';
          this.object = object;
          this.property = property;
          this.finish();
          return this;
      },

      finishObjectExpression: function (properties) {
          this.type = Syntax.ObjectExpression;
          this.properties = properties;
          this.finish();
          return this;
      },

      finishProgram: function (body) {
          this.type = Syntax.Program;
          this.body = body;
          this.finish();
          return this;
      },

      finishProperty: function (kind, key, value) {
          this.type = Syntax.Property;
          this.key = key;
          this.value = value;
          this.kind = kind;
          this.finish();
          return this;
      },

      finishUnaryExpression: function (operator, argument) {
          this.type = Syntax.UnaryExpression;
          this.operator = operator;
          this.argument = argument;
          this.prefix = true;
          this.finish();
          return this;
      }
  };

  // Return true if there is a line terminator before the next token.

  function peekLineTerminator() {
      var pos, line, start, found;

      pos = index;
      line = lineNumber;
      start = lineStart;
      skipComment();
      found = lineNumber !== line;
      index = pos;
      lineNumber = line;
      lineStart = start;

      return found;
  }

  // Throw an exception

  function throwError(token, messageFormat) {
      var error,
          args = Array.prototype.slice.call(arguments, 2),
          msg = messageFormat.replace(
              /%(\d)/g,
              function (whole, index) {
                  assert(index < args.length, 'Message reference must be in range');
                  return args[index];
              }
          );

      if (typeof token.lineNumber === 'number') {
          error = new Error('Line ' + token.lineNumber + ': ' + msg);
          error.index = token.start;
          error.lineNumber = token.lineNumber;
          error.column = token.start - lineStart + 1;
      } else {
          error = new Error('Line ' + lineNumber + ': ' + msg);
          error.index = index;
          error.lineNumber = lineNumber;
          error.column = index - lineStart + 1;
      }

      error.description = msg;
      throw error;
  }

  function throwErrorTolerant() {
      try {
          throwError.apply(null, arguments);
      } catch (e) {
          if (extra.errors) {
              extra.errors.push(e);
          } else {
              throw e;
          }
      }
  }


  // Throw an exception because of the token.

  function throwUnexpected(token) {
      if (token.type === Token.EOF) {
          throwError(token, Messages.UnexpectedEOS);
      }

      if (token.type === Token.NumericLiteral) {
          throwError(token, Messages.UnexpectedNumber);
      }

      if (token.type === Token.StringLiteral) {
          throwError(token, Messages.UnexpectedString);
      }

      if (token.type === Token.Identifier) {
          throwError(token, Messages.UnexpectedIdentifier);
      }

      if (token.type === Token.Keyword) {
          if (isFutureReservedWord(token.value)) {
              throwError(token, Messages.UnexpectedReserved);
          } else if (strict && isStrictModeReservedWord(token.value)) {
              throwErrorTolerant(token, Messages.StrictReservedWord);
              return;
          }
          throwError(token, Messages.UnexpectedToken, token.value);
      }

      // BooleanLiteral, NullLiteral, or Punctuator.
      throwError(token, Messages.UnexpectedToken, token.value);
  }

  // Expect the next token to match the specified punctuator.
  // If not, an exception will be thrown.

  function expect(value) {
      var token = lex();
      if (token.type !== Token.Punctuator || token.value !== value) {
          throwUnexpected(token);
      }
  }

  /**
   * @name expectTolerant
   * @description Quietly expect the given token value when in tolerant mode, otherwise delegates
   * to <code>expect(value)</code>
   * @param {String} value The value we are expecting the lookahead token to have
   * @since 2.0
   */
  function expectTolerant(value) {
      if (extra.errors) {
          var token = lookahead;
          if (token.type !== Token.Punctuator && token.value !== value) {
              throwErrorTolerant(token, Messages.UnexpectedToken, token.value);
          } else {
              lex();
          }
      } else {
          expect(value);
      }
  }

  // Return true if the next token matches the specified punctuator.

  function match(value) {
      return lookahead.type === Token.Punctuator && lookahead.value === value;
  }

  // Return true if the next token matches the specified keyword

  function matchKeyword(keyword) {
      return lookahead.type === Token.Keyword && lookahead.value === keyword;
  }

  function consumeSemicolon() {
      var line;

      // Catch the very common case first: immediately a semicolon (U+003B).
      if (source.charCodeAt(index) === 0x3B || match(';')) {
          lex();
          return;
      }

      line = lineNumber;
      skipComment();
      if (lineNumber !== line) {
          return;
      }

      if (lookahead.type !== Token.EOF && !match('}')) {
          throwUnexpected(lookahead);
      }
  }

  // 11.1.4 Array Initialiser

  function parseArrayInitialiser() {
      var elements = [], node = new Node();

      expect('[');

      while (!match(']')) {
          if (match(',')) {
              lex();
              elements.push(null);
          } else {
              elements.push(parseAssignmentExpression());

              if (!match(']')) {
                  expect(',');
              }
          }
      }

      lex();

      return node.finishArrayExpression(elements);
  }

  // 11.1.5 Object Initialiser

  function parseObjectPropertyKey() {
      var token, node = new Node();

      token = lex();

      // Note: This function is called only from parseObjectProperty(), where
      // EOF and Punctuator tokens are already filtered out.

      if (token.type === Token.StringLiteral || token.type === Token.NumericLiteral) {
          if (strict && token.octal) {
              throwErrorTolerant(token, Messages.StrictOctalLiteral);
          }
          return node.finishLiteral(token);
      }

      return node.finishIdentifier(token.value);
  }

  function parseObjectProperty() {
      var token, key, id, value, node = new Node();

      token = lookahead;

      if (token.type === Token.Identifier) {
          id = parseObjectPropertyKey();
          expect(':');
          value = parseAssignmentExpression();
          return node.finishProperty('init', id, value);
      }
      if (token.type === Token.EOF || token.type === Token.Punctuator) {
          throwUnexpected(token);
      } else {
          key = parseObjectPropertyKey();
          expect(':');
          value = parseAssignmentExpression();
          return node.finishProperty('init', key, value);
      }
  }

  function parseObjectInitialiser() {
      var properties = [], property, name, key, kind, map = {}, toString = String, node = new Node();

      expect('{');

      while (!match('}')) {
          property = parseObjectProperty();

          if (property.key.type === Syntax.Identifier) {
              name = property.key.name;
          } else {
              name = toString(property.key.value);
          }
          kind = (property.kind === 'init') ? PropertyKind.Data : (property.kind === 'get') ? PropertyKind.Get : PropertyKind.Set;

          key = '$' + name;
          if (Object.prototype.hasOwnProperty.call(map, key)) {
              if (map[key] === PropertyKind.Data) {
                  if (strict && kind === PropertyKind.Data) {
                      throwErrorTolerant({}, Messages.StrictDuplicateProperty);
                  } else if (kind !== PropertyKind.Data) {
                      throwErrorTolerant({}, Messages.AccessorDataProperty);
                  }
              } else {
                  if (kind === PropertyKind.Data) {
                      throwErrorTolerant({}, Messages.AccessorDataProperty);
                  } else if (map[key] & kind) {
                      throwErrorTolerant({}, Messages.AccessorGetSet);
                  }
              }
              map[key] |= kind;
          } else {
              map[key] = kind;
          }

          properties.push(property);

          if (!match('}')) {
              expectTolerant(',');
          }
      }

      expect('}');

      return node.finishObjectExpression(properties);
  }

  // 11.1.6 The Grouping Operator

  function parseGroupExpression() {
      var expr;

      expect('(');

      ++state.parenthesisCount;

      expr = parseExpression();

      expect(')');

      return expr;
  }


  // 11.1 Primary Expressions

  var legalKeywords = {"if":1, "this":1};

  function parsePrimaryExpression() {
      var type, token, expr, node;

      if (match('(')) {
          return parseGroupExpression();
      }

      if (match('[')) {
          return parseArrayInitialiser();
      }

      if (match('{')) {
          return parseObjectInitialiser();
      }

      type = lookahead.type;
      node = new Node();

      if (type === Token.Identifier || legalKeywords[lookahead.value]) {
          expr = node.finishIdentifier(lex().value);
      } else if (type === Token.StringLiteral || type === Token.NumericLiteral) {
          if (strict && lookahead.octal) {
              throwErrorTolerant(lookahead, Messages.StrictOctalLiteral);
          }
          expr = node.finishLiteral(lex());
      } else if (type === Token.Keyword) {
          throw new Error("Disabled.");
      } else if (type === Token.BooleanLiteral) {
          token = lex();
          token.value = (token.value === 'true');
          expr = node.finishLiteral(token);
      } else if (type === Token.NullLiteral) {
          token = lex();
          token.value = null;
          expr = node.finishLiteral(token);
      } else if (match('/') || match('/=')) {
          if (typeof extra.tokens !== 'undefined') {
              expr = node.finishLiteral(collectRegex());
          } else {
              expr = node.finishLiteral(scanRegExp());
          }
          peek();
      } else {
          throwUnexpected(lex());
      }

      return expr;
  }

  // 11.2 Left-Hand-Side Expressions

  function parseArguments() {
      var args = [];

      expect('(');

      if (!match(')')) {
          while (index < length) {
              args.push(parseAssignmentExpression());
              if (match(')')) {
                  break;
              }
              expectTolerant(',');
          }
      }

      expect(')');

      return args;
  }

  function parseNonComputedProperty() {
      var token, node = new Node();

      token = lex();

      if (!isIdentifierName(token)) {
          throwUnexpected(token);
      }

      return node.finishIdentifier(token.value);
  }

  function parseNonComputedMember() {
      expect('.');

      return parseNonComputedProperty();
  }

  function parseComputedMember() {
      var expr;

      expect('[');

      expr = parseExpression();

      expect(']');

      return expr;
  }

  function parseLeftHandSideExpressionAllowCall() {
      var expr, args, property, startToken, previousAllowIn = state.allowIn;

      startToken = lookahead;
      state.allowIn = true;
      expr = parsePrimaryExpression();

      for (;;) {
          if (match('.')) {
              property = parseNonComputedMember();
              expr = new WrappingNode(startToken).finishMemberExpression('.', expr, property);
          } else if (match('(')) {
              args = parseArguments();
              expr = new WrappingNode(startToken).finishCallExpression(expr, args);
          } else if (match('[')) {
              property = parseComputedMember();
              expr = new WrappingNode(startToken).finishMemberExpression('[', expr, property);
          } else {
              break;
          }
      }
      state.allowIn = previousAllowIn;

      return expr;
  }

  // 11.3 Postfix Expressions

  function parsePostfixExpression() {
      var expr = parseLeftHandSideExpressionAllowCall();

      if (lookahead.type === Token.Punctuator) {
          if ((match('++') || match('--')) && !peekLineTerminator()) {
              throw new Error("Disabled.");
          }
      }

      return expr;
  }

  // 11.4 Unary Operators

  function parseUnaryExpression() {
      var token, expr, startToken;

      if (lookahead.type !== Token.Punctuator && lookahead.type !== Token.Keyword) {
          expr = parsePostfixExpression();
      } else if (match('++') || match('--')) {
          throw new Error("Disabled.");
      } else if (match('+') || match('-') || match('~') || match('!')) {
          startToken = lookahead;
          token = lex();
          expr = parseUnaryExpression();
          expr = new WrappingNode(startToken).finishUnaryExpression(token.value, expr);
      } else if (matchKeyword('delete') || matchKeyword('void') || matchKeyword('typeof')) {
          throw new Error("Disabled.");
      } else {
          expr = parsePostfixExpression();
      }

      return expr;
  }

  function binaryPrecedence(token, allowIn) {
      var prec = 0;

      if (token.type !== Token.Punctuator && token.type !== Token.Keyword) {
          return 0;
      }

      switch (token.value) {
      case '||':
          prec = 1;
          break;

      case '&&':
          prec = 2;
          break;

      case '|':
          prec = 3;
          break;

      case '^':
          prec = 4;
          break;

      case '&':
          prec = 5;
          break;

      case '==':
      case '!=':
      case '===':
      case '!==':
          prec = 6;
          break;

      case '<':
      case '>':
      case '<=':
      case '>=':
      case 'instanceof':
          prec = 7;
          break;

      case 'in':
          prec = allowIn ? 7 : 0;
          break;

      case '<<':
      case '>>':
      case '>>>':
          prec = 8;
          break;

      case '+':
      case '-':
          prec = 9;
          break;

      case '*':
      case '/':
      case '%':
          prec = 11;
          break;

      default:
          break;
      }

      return prec;
  }

  // 11.5 Multiplicative Operators
  // 11.6 Additive Operators
  // 11.7 Bitwise Shift Operators
  // 11.8 Relational Operators
  // 11.9 Equality Operators
  // 11.10 Binary Bitwise Operators
  // 11.11 Binary Logical Operators

  function parseBinaryExpression() {
      var marker, markers, expr, token, prec, stack, right, operator, left, i;

      marker = lookahead;
      left = parseUnaryExpression();

      token = lookahead;
      prec = binaryPrecedence(token, state.allowIn);
      if (prec === 0) {
          return left;
      }
      token.prec = prec;
      lex();

      markers = [marker, lookahead];
      right = parseUnaryExpression();

      stack = [left, token, right];

      while ((prec = binaryPrecedence(lookahead, state.allowIn)) > 0) {

          // Reduce: make a binary expression from the three topmost entries.
          while ((stack.length > 2) && (prec <= stack[stack.length - 2].prec)) {
              right = stack.pop();
              operator = stack.pop().value;
              left = stack.pop();
              markers.pop();
              expr = new WrappingNode(markers[markers.length - 1]).finishBinaryExpression(operator, left, right);
              stack.push(expr);
          }

          // Shift.
          token = lex();
          token.prec = prec;
          stack.push(token);
          markers.push(lookahead);
          expr = parseUnaryExpression();
          stack.push(expr);
      }

      // Final reduce to clean-up the stack.
      i = stack.length - 1;
      expr = stack[i];
      markers.pop();
      while (i > 1) {
          expr = new WrappingNode(markers.pop()).finishBinaryExpression(stack[i - 1].value, stack[i - 2], expr);
          i -= 2;
      }

      return expr;
  }

  // 11.12 Conditional Operator

  function parseConditionalExpression() {
      var expr, previousAllowIn, consequent, alternate, startToken;

      startToken = lookahead;

      expr = parseBinaryExpression();

      if (match('?')) {
          lex();
          previousAllowIn = state.allowIn;
          state.allowIn = true;
          consequent = parseAssignmentExpression();
          state.allowIn = previousAllowIn;
          expect(':');
          alternate = parseAssignmentExpression();

          expr = new WrappingNode(startToken).finishConditionalExpression(expr, consequent, alternate);
      }

      return expr;
  }

  // 11.13 Assignment Operators

  function parseAssignmentExpression() {
      var oldParenthesisCount, token, expr, startToken;

      oldParenthesisCount = state.parenthesisCount;

      startToken = lookahead;
      token = lookahead;

      expr = parseConditionalExpression();

      return expr;
  }

  // 11.14 Comma Operator

  function parseExpression() {
      var expr = parseAssignmentExpression();

      if (match(',')) {
          throw new Error("Disabled."); // no sequence expressions
      }

      return expr;
  }

  // 12.4 Expression Statement

  function parseExpressionStatement(node) {
      var expr = parseExpression();
      consumeSemicolon();
      return node.finishExpressionStatement(expr);
  }

  // 12 Statements

  function parseStatement() {
      var type = lookahead.type,
          expr,
          node;

      if (type === Token.EOF) {
          throwUnexpected(lookahead);
      }

      if (type === Token.Punctuator && lookahead.value === '{') {
          throw new Error("Disabled."); // block statement
      }

      node = new Node();

      if (type === Token.Punctuator) {
          switch (lookahead.value) {
          case ';':
              throw new Error("Disabled."); // empty statement
          case '(':
              return parseExpressionStatement(node);
          default:
              break;
          }
      } else if (type === Token.Keyword) {
          throw new Error("Disabled."); // keyword
      }

      expr = parseExpression();
      consumeSemicolon();
      return node.finishExpressionStatement(expr);
  }

  // 14 Program

  function parseSourceElement() {
      if (lookahead.type === Token.Keyword) {
          switch (lookahead.value) {
          case 'const':
          case 'let':
              throw new Error("Disabled.");
          case 'function':
              throw new Error("Disabled.");
          default:
              return parseStatement();
          }
      }

      if (lookahead.type !== Token.EOF) {
          return parseStatement();
      }
  }

  function parseSourceElements() {
      var sourceElement, sourceElements = [], token, directive, firstRestricted;

      while (index < length) {
          token = lookahead;
          if (token.type !== Token.StringLiteral) {
              break;
          }

          sourceElement = parseSourceElement();
          sourceElements.push(sourceElement);
          if (sourceElement.expression.type !== Syntax.Literal) {
              // this is not directive
              break;
          }
          directive = source.slice(token.start + 1, token.end - 1);
          if (directive === 'use strict') {
              strict = true;
              if (firstRestricted) {
                  throwErrorTolerant(firstRestricted, Messages.StrictOctalLiteral);
              }
          } else {
              if (!firstRestricted && token.octal) {
                  firstRestricted = token;
              }
          }
      }

      while (index < length) {
          sourceElement = parseSourceElement();
          if (typeof sourceElement === 'undefined') {
              break;
          }
          sourceElements.push(sourceElement);
      }
      return sourceElements;
  }

  function parseProgram() {
      var body, node;

      skipComment();
      peek();
      node = new Node();
      strict = true; // assume strict

      body = parseSourceElements();
      return node.finishProgram(body);
  }

  function filterTokenLocation() {
      var i, entry, token, tokens = [];

      for (i = 0; i < extra.tokens.length; ++i) {
          entry = extra.tokens[i];
          token = {
              type: entry.type,
              value: entry.value
          };
          if (entry.regex) {
              token.regex = {
                  pattern: entry.regex.pattern,
                  flags: entry.regex.flags
              };
          }
          if (extra.range) {
              token.range = entry.range;
          }
          if (extra.loc) {
              token.loc = entry.loc;
          }
          tokens.push(token);
      }

      extra.tokens = tokens;
  }

  function tokenize(code, options) {
      var toString,
          tokens;

      toString = String;
      if (typeof code !== 'string' && !(code instanceof String)) {
          code = toString(code);
      }

      source = code;
      index = 0;
      lineNumber = (source.length > 0) ? 1 : 0;
      lineStart = 0;
      length = source.length;
      lookahead = null;
      state = {
          allowIn: true,
          labelSet: {},
          inFunctionBody: false,
          inIteration: false,
          inSwitch: false,
          lastCommentStart: -1
      };

      extra = {};

      // Options matching.
      options = options || {};

      // Of course we collect tokens here.
      options.tokens = true;
      extra.tokens = [];
      extra.tokenize = true;
      // The following two fields are necessary to compute the Regex tokens.
      extra.openParenToken = -1;
      extra.openCurlyToken = -1;

      extra.range = (typeof options.range === 'boolean') && options.range;
      extra.loc = (typeof options.loc === 'boolean') && options.loc;

      if (typeof options.tolerant === 'boolean' && options.tolerant) {
          extra.errors = [];
      }

      try {
          peek();
          if (lookahead.type === Token.EOF) {
              return extra.tokens;
          }

          lex();
          while (lookahead.type !== Token.EOF) {
              try {
                  lex();
              } catch (lexError) {
                  if (extra.errors) {
                      extra.errors.push(lexError);
                      // We have to break on the first error
                      // to avoid infinite loops.
                      break;
                  } else {
                      throw lexError;
                  }
              }
          }

          filterTokenLocation();
          tokens = extra.tokens;
          if (typeof extra.errors !== 'undefined') {
              tokens.errors = extra.errors;
          }
      } catch (e) {
          throw e;
      } finally {
          extra = {};
      }
      return tokens;
  }

  function parse(code, options) {
      var program, toString;

      toString = String;
      if (typeof code !== 'string' && !(code instanceof String)) {
          code = toString(code);
      }

      source = code;
      index = 0;
      lineNumber = (source.length > 0) ? 1 : 0;
      lineStart = 0;
      length = source.length;
      lookahead = null;
      state = {
          allowIn: true,
          labelSet: {},
          parenthesisCount: 0,
          inFunctionBody: false,
          inIteration: false,
          inSwitch: false,
          lastCommentStart: -1
      };

      extra = {};
      if (typeof options !== 'undefined') {
          extra.range = (typeof options.range === 'boolean') && options.range;
          extra.loc = (typeof options.loc === 'boolean') && options.loc;

          if (extra.loc && options.source !== null && options.source !== undefined) {
              extra.source = toString(options.source);
          }

          if (typeof options.tokens === 'boolean' && options.tokens) {
              extra.tokens = [];
          }
          if (typeof options.tolerant === 'boolean' && options.tolerant) {
              extra.errors = [];
          }
      }

      try {
          program = parseProgram();
          if (typeof extra.tokens !== 'undefined') {
              filterTokenLocation();
              program.tokens = extra.tokens;
          }
          if (typeof extra.errors !== 'undefined') {
              program.errors = extra.errors;
          }
      } catch (e) {
          throw e;
      } finally {
          extra = {};
      }

      return program;
  }

  return {
    tokenize: tokenize,
    parse: parse
  };

})();
},{}],7:[function(require,module,exports){
"use strict";
var channel_1 = require('vega-lite/src/channel');
var mark_1 = require('vega-lite/src/mark');
exports.DEFAULT_PROJECTION_OPT = {
    omitDotPlot: false,
    maxCardinalityForAutoAddOrdinal: 50,
    alwaysAddHistogram: true,
    maxAdditionalVariables: 1
};
(function (TableType) {
    TableType[TableType["BOTH"] = 'both'] = "BOTH";
    TableType[TableType["AGGREGATED"] = 'aggregated'] = "AGGREGATED";
    TableType[TableType["DISAGGREGATED"] = 'disaggregated'] = "DISAGGREGATED";
})(exports.TableType || (exports.TableType = {}));
var TableType = exports.TableType;
(function (QuantitativeDimensionType) {
    QuantitativeDimensionType[QuantitativeDimensionType["AUTO"] = 'auto'] = "AUTO";
    QuantitativeDimensionType[QuantitativeDimensionType["BIN"] = 'bin'] = "BIN";
    QuantitativeDimensionType[QuantitativeDimensionType["CAST"] = 'cast'] = "CAST";
    QuantitativeDimensionType[QuantitativeDimensionType["NONE"] = 'none'] = "NONE";
})(exports.QuantitativeDimensionType || (exports.QuantitativeDimensionType = {}));
var QuantitativeDimensionType = exports.QuantitativeDimensionType;
exports.DEFAULT_AGGREGATION_OPTIONS = {
    tableTypes: TableType.BOTH,
    genDimQ: QuantitativeDimensionType.AUTO,
    minCardinalityForBin: 20,
    omitDotPlot: false,
    omitMeasureOnly: false,
    omitDimensionOnly: true,
    addCountForDimensionOnly: true,
    aggrList: [undefined, 'mean'],
    timeUnitList: ['year'],
    consistentAutoQ: true
};
exports.DEFAULT_SCALE_OPTION = {
    rescaleQuantitative: [undefined]
};
;
exports.DEFAULT_SPEC_OPTION = {
    markList: [mark_1.Mark.POINT, mark_1.Mark.BAR, mark_1.Mark.LINE, mark_1.Mark.AREA, mark_1.Mark.TEXT, mark_1.Mark.TICK],
    channelList: [channel_1.X, channel_1.Y, channel_1.ROW, channel_1.COLUMN, channel_1.SIZE, channel_1.COLOR, channel_1.TEXT, channel_1.DETAIL],
    alwaysGenerateTableAsHeatmap: true,
    maxGoodCardinalityForFacets: 5,
    maxCardinalityForFacets: 20,
    maxGoodCardinalityForColor: 7,
    maxCardinalityForColor: 20,
    maxCardinalityForShape: 6,
    omitDotPlot: false,
    omitDotPlotWithExtraEncoding: true,
    omitDotPlotWithFacet: true,
    omitDotPlotWithOnlyCount: false,
    omitMultipleNonPositionalChannels: true,
    omitNonTextAggrWithAllDimsOnFacets: true,
    omitRawWithXYBothDimension: true,
    omitShapeWithBin: true,
    omitShapeWithTimeDimension: true,
    omitSizeOnBar: true,
    omitLengthForLogScale: true,
    omitStackedAverage: true,
    omitTranspose: true,
};

},{"vega-lite/src/channel":31,"vega-lite/src/mark":36}],8:[function(require,module,exports){
"use strict";
var cpConsts = require('./consts');
var cpGen = require('./gen/gen');
var cpRank = require('./rank/rank');
var cpUtil = require('./util');
var cpTrans = require('./trans/trans');
exports.consts = cpConsts;
exports.gen = cpGen;
exports.rank = cpRank;
exports.util = cpUtil;
exports.trans = cpTrans;
exports.auto = '-, sum';
exports.version = '0.7.1';

},{"./consts":7,"./gen/gen":11,"./rank/rank":15,"./trans/trans":19,"./util":20}],9:[function(require,module,exports){
'use strict';
var vlFieldDef = require('vega-lite/src/fielddef');
var vlShorthand = require('vega-lite/src/shorthand');
var type_1 = require('vega-lite/src/type');
var aggregate_1 = require('vega-lite/src/aggregate');
var util = require('../util');
var consts_1 = require('../consts');
var AUTO = '*';
function genAggregates(output, fieldDefs, stats, opt) {
    if (opt === void 0) { opt = {}; }
    opt = util.extend({}, consts_1.DEFAULT_AGGREGATION_OPTIONS, opt);
    var tf = new Array(fieldDefs.length);
    var hasNorO = util.any(fieldDefs, function (f) {
        return f.type === type_1.Type.NOMINAL || f.type === type_1.Type.ORDINAL;
    });
    function emit(fieldSet) {
        fieldSet = util.duplicate(fieldSet);
        fieldSet.key = fieldSet.map(function (fieldDef) {
            return vlShorthand.shortenFieldDef(fieldDef);
        }).join(vlShorthand.DELIM);
        output.push(fieldSet);
    }
    function checkAndPush() {
        if (opt.omitMeasureOnly || opt.omitDimensionOnly) {
            var hasMeasure = false, hasDimension = false, hasRaw = false;
            tf.forEach(function (f) {
                if (vlFieldDef.isDimension(f)) {
                    hasDimension = true;
                }
                else {
                    hasMeasure = true;
                    if (!f.aggregate) {
                        hasRaw = true;
                    }
                }
            });
            if (!hasDimension && !hasRaw && opt.omitMeasureOnly) {
                return;
            }
            if (!hasMeasure) {
                if (opt.addCountForDimensionOnly) {
                    tf.push(vlFieldDef.count());
                    emit(tf);
                    tf.pop();
                }
                if (opt.omitDimensionOnly) {
                    return;
                }
            }
        }
        if (opt.omitDotPlot && tf.length === 1) {
            return;
        }
        emit(tf);
    }
    function assignAggrQ(i, hasAggr, autoMode, a) {
        var canHaveAggr = hasAggr === true || hasAggr === null, cantHaveAggr = hasAggr === false || hasAggr === null;
        if (a) {
            if (canHaveAggr) {
                tf[i].aggregate = a;
                assignField(i + 1, true, autoMode);
                delete tf[i].aggregate;
            }
        }
        else {
            if (cantHaveAggr) {
                assignField(i + 1, false, autoMode);
            }
        }
    }
    function assignBinQ(i, hasAggr, autoMode) {
        tf[i].bin = true;
        assignField(i + 1, hasAggr, autoMode);
        delete tf[i].bin;
    }
    function assignQ(i, hasAggr, autoMode) {
        var f = fieldDefs[i], canHaveAggr = hasAggr === true || hasAggr === null;
        tf[i] = { field: f.field, type: f.type };
        if (f.aggregate === aggregate_1.AggregateOp.COUNT) {
            if (canHaveAggr) {
                tf[i].aggregate = f.aggregate;
                assignField(i + 1, true, autoMode);
            }
        }
        else if (f._aggregate) {
            assignAggrQ(i, hasAggr, autoMode, f._aggregate);
        }
        else if (f._raw) {
            assignAggrQ(i, hasAggr, autoMode, undefined);
        }
        else if (f._bin) {
            assignBinQ(i, hasAggr, autoMode);
        }
        else {
            opt.aggrList.forEach(function (a) {
                if (!opt.consistentAutoQ || autoMode === AUTO || autoMode === a) {
                    assignAggrQ(i, hasAggr, a, a);
                }
            });
            if ((!opt.consistentAutoQ || util.isin(autoMode, [AUTO, 'bin', 'cast', 'autocast'])) && !hasNorO) {
                var highCardinality = vlFieldDef.cardinality(f, stats) > opt.minCardinalityForBin;
                var isAuto = opt.genDimQ === consts_1.QuantitativeDimensionType.AUTO, genBin = opt.genDimQ === consts_1.QuantitativeDimensionType.BIN || (isAuto && highCardinality), genCast = opt.genDimQ === consts_1.QuantitativeDimensionType.CAST || (isAuto && !highCardinality);
                if (genBin && util.isin(autoMode, [AUTO, 'bin', 'autocast'])) {
                    assignBinQ(i, hasAggr, isAuto ? 'autocast' : 'bin');
                }
                if (genCast && util.isin(autoMode, [AUTO, 'cast', 'autocast'])) {
                    tf[i].type = type_1.Type.ORDINAL;
                    assignField(i + 1, hasAggr, isAuto ? 'autocast' : 'cast');
                    tf[i].type = type_1.Type.QUANTITATIVE;
                }
            }
        }
    }
    function assignTimeUnitT(i, hasAggr, autoMode, timeUnit) {
        tf[i].timeUnit = timeUnit;
        assignField(i + 1, hasAggr, autoMode);
        delete tf[i].timeUnit;
    }
    function assignT(i, hasAggr, autoMode) {
        var f = fieldDefs[i];
        tf[i] = { field: f.field, type: f.type };
        if (f._timeUnit) {
            assignTimeUnitT(i, hasAggr, autoMode, f._timeUnit);
        }
        else {
            opt.timeUnitList.forEach(function (timeUnit) {
                if (timeUnit === undefined) {
                    if (!hasAggr) {
                        assignField(i + 1, false, autoMode);
                    }
                }
                else {
                    assignTimeUnitT(i, hasAggr, autoMode, timeUnit);
                }
            });
        }
    }
    function assignField(i, hasAggr, autoMode) {
        if (i === fieldDefs.length) {
            checkAndPush();
            return;
        }
        var f = fieldDefs[i];
        switch (f.type) {
            case type_1.Type.QUANTITATIVE:
                assignQ(i, hasAggr, autoMode);
                break;
            case type_1.Type.TEMPORAL:
                assignT(i, hasAggr, autoMode);
                break;
            case type_1.Type.ORDINAL:
            case type_1.Type.NOMINAL:
            default:
                tf[i] = f;
                assignField(i + 1, hasAggr, autoMode);
                break;
        }
    }
    var hasAggr = opt.tableTypes === consts_1.TableType.AGGREGATED ? true :
        opt.tableTypes === consts_1.TableType.DISAGGREGATED ? false : null;
    assignField(0, hasAggr, AUTO);
    return output;
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = genAggregates;

},{"../consts":7,"../util":20,"vega-lite/src/aggregate":30,"vega-lite/src/fielddef":34,"vega-lite/src/shorthand":38,"vega-lite/src/type":40}],10:[function(require,module,exports){
"use strict";
var fielddef_1 = require('vega-lite/src/fielddef');
var encoding_1 = require('vega-lite/src/encoding');
var util_1 = require('../util');
var marks_1 = require('./marks');
var consts_1 = require('../consts');
var aggregate_1 = require('vega-lite/src/aggregate');
var channel_1 = require('vega-lite/src/channel');
var type_1 = require('vega-lite/src/type');
function genEncodings(encodings, fieldDefs, stats, opt) {
    if (opt === void 0) { opt = consts_1.DEFAULT_SPEC_OPTION; }
    var tmpEncoding = {};
    function assignField(i) {
        if (i === fieldDefs.length) {
            if (rule.encoding(tmpEncoding, stats, opt)) {
                encodings.push(util_1.duplicate(tmpEncoding));
            }
            return;
        }
        var fieldDef = fieldDefs[i];
        for (var j in opt.channelList) {
            var channel = opt.channelList[j], isDim = fielddef_1.isDimension(fieldDef);
            var supportedRole = channel_1.getSupportedRole(channel);
            if (!(channel in tmpEncoding) &&
                ((isDim && supportedRole.dimension) || (!isDim && supportedRole.measure)) &&
                rule.channel[channel](tmpEncoding, fieldDef, stats, opt)) {
                tmpEncoding[channel] = fieldDef;
                assignField(i + 1);
                delete tmpEncoding[channel];
            }
        }
    }
    assignField(0);
    return encodings;
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = genEncodings;
var rule;
(function (rule) {
    var channel;
    (function (channel) {
        channel.x = noRule;
        channel.y = noRule;
        channel.text = noRule;
        channel.detail = noRule;
        channel.size = retinalEncRules;
        channel.row = noRule;
        channel.column = noRule;
        function color(encoding, fieldDef, stats, opt) {
            if (!retinalEncRules(encoding, fieldDef, stats, opt)) {
                return false;
            }
            return fielddef_1.isMeasure(fieldDef) ||
                fielddef_1.cardinality(fieldDef, stats) <= opt.maxCardinalityForColor;
        }
        channel.color = color;
        function shape(encoding, fieldDef, stats, opt) {
            if (!retinalEncRules(encoding, fieldDef, stats, opt)) {
                return false;
            }
            if (opt.omitShapeWithBin && fieldDef.bin && fieldDef.type === type_1.Type.QUANTITATIVE) {
                return false;
            }
            if (opt.omitShapeWithTimeDimension && fieldDef.timeUnit && fieldDef.type === type_1.Type.TEMPORAL) {
                return false;
            }
            return fielddef_1.cardinality(fieldDef, stats) <= opt.maxCardinalityForShape;
        }
        channel.shape = shape;
        function noRule() { return true; }
        function retinalEncRules(encoding, fieldDef, stats, opt) {
            if (opt.omitMultipleNonPositionalChannels) {
                if (encoding.color || encoding.size || encoding.shape) {
                    return false;
                }
            }
            return true;
        }
    })(channel = rule.channel || (rule.channel = {}));
    function dotPlotRules(encoding, stats, opt) {
        if (opt.omitDotPlot) {
            return false;
        }
        if (opt.omitTranspose && encoding.y) {
            return false;
        }
        if (opt.omitDotPlotWithFacet && (encoding.row || encoding.column)) {
            return false;
        }
        if (opt.omitDotPlotWithExtraEncoding && util_1.keys(encoding).length > 1) {
            return false;
        }
        if (opt.omitDotPlotWithOnlyCount) {
            if (encoding.x && encoding.x.aggregate === aggregate_1.AggregateOp.COUNT && !encoding.y) {
                return false;
            }
            if (encoding.y && encoding.y.aggregate === aggregate_1.AggregateOp.COUNT && !encoding.x) {
                return false;
            }
        }
        return true;
    }
    function isAggrWithAllDimOnFacets(encoding) {
        var hasAggr = false, hasOtherO = false;
        for (var c in encoding) {
            var channel_2 = c;
            var fieldDef = encoding[channel_2];
            if (fieldDef.aggregate) {
                hasAggr = true;
            }
            if (fielddef_1.isDimension(fieldDef) && (channel_2 !== channel_1.ROW && channel_2 !== channel_1.COLUMN)) {
                hasOtherO = true;
            }
            if (hasAggr && hasOtherO) {
                break;
            }
        }
        return hasAggr && !hasOtherO;
    }
    ;
    function xyPlotRules(encoding, stats, opt) {
        if (encoding.row || encoding.column) {
            if (opt.omitNonTextAggrWithAllDimsOnFacets) {
                if (isAggrWithAllDimOnFacets(encoding)) {
                    return false;
                }
            }
        }
        var isDimX = fielddef_1.isDimension(encoding.x), isDimY = fielddef_1.isDimension(encoding.y);
        if (opt.omitRawWithXYBothDimension && isDimX && isDimY && !encoding_1.isAggregate(encoding)) {
            return false;
        }
        if (opt.omitTranspose) {
            if (isDimX !== isDimY) {
                if ((encoding.y.type === type_1.Type.NOMINAL || encoding.y.type === type_1.Type.ORDINAL) && fielddef_1.isMeasure(encoding.x)) {
                    return true;
                }
                if (!isDimY && isDimX && !(encoding.x.type === type_1.Type.NOMINAL || encoding.x.type === type_1.Type.ORDINAL)) {
                    return true;
                }
                return false;
            }
            else if (encoding.y.type === type_1.Type.TEMPORAL || encoding.x.type === type_1.Type.TEMPORAL) {
                if (encoding.y.type === type_1.Type.TEMPORAL && encoding.x.type !== type_1.Type.TEMPORAL) {
                    return false;
                }
            }
            else {
                if (encoding.x.field > encoding.y.field) {
                    return false;
                }
            }
        }
        return true;
    }
    function encoding(encoding, stats, opt) {
        if (encoding.text) {
            return marks_1.rule.text(encoding, stats, opt);
        }
        var hasX = !!encoding.x, hasY = !!encoding.y;
        if (hasX !== hasY) {
            return dotPlotRules(encoding, stats, opt);
        }
        else if (hasX && hasY) {
            return xyPlotRules(encoding, stats, opt);
        }
        return false;
    }
    rule.encoding = encoding;
})(rule || (rule = {}));

},{"../consts":7,"../util":20,"./marks":12,"vega-lite/src/aggregate":30,"vega-lite/src/channel":31,"vega-lite/src/encoding":33,"vega-lite/src/fielddef":34,"vega-lite/src/type":40}],11:[function(require,module,exports){
'use strict';
var aggregates_1 = require('./aggregates');
var projections_1 = require('./projections');
var projections_2 = require('./projections');
var specs_1 = require('./specs');
var encodings_1 = require('./encodings');
var marks_1 = require('./marks');
exports.aggregates = aggregates_1.default;
exports.projections = projections_1.default;
exports.projections.key = projections_2.key;
exports.specs = specs_1.default;
exports.encodings = encodings_1.default;
exports.marks = marks_1.default;

},{"./aggregates":9,"./encodings":10,"./marks":12,"./projections":13,"./specs":14}],12:[function(require,module,exports){
"use strict";
var encoding_1 = require('vega-lite/src/encoding');
var fielddef_1 = require('vega-lite/src/fielddef');
var validate_1 = require('vega-lite/src/validate');
var type_1 = require('vega-lite/src/type');
var scale_1 = require('vega-lite/src/scale');
var aggregate_1 = require('vega-lite/src/aggregate');
var util = require('../util');
function genMarks(encoding, stats, opt) {
    return opt.markList.filter(function (mark) {
        var noVlError = validate_1.getEncodingMappingError({
            mark: mark,
            encoding: encoding
        }) === null;
        return noVlError && rule[mark](encoding, stats, opt);
    });
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = genMarks;
var rule;
(function (rule) {
    function facetRule(fieldDef, stats, opt) {
        return fielddef_1.cardinality(fieldDef, stats) <= opt.maxCardinalityForFacets;
    }
    function facetsRule(encoding, stats, opt) {
        if (encoding.row && !facetRule(encoding.row, stats, opt))
            return false;
        if (encoding.column && !facetRule(encoding.column, stats, opt))
            return false;
        return true;
    }
    function point(encoding, stats, opt) {
        if (!facetsRule(encoding, stats, opt))
            return false;
        if (encoding.x && encoding.y) {
            var xIsDim = fielddef_1.isDimension(encoding.x), yIsDim = fielddef_1.isDimension(encoding.y);
            if (xIsDim && yIsDim) {
                if (encoding.shape) {
                    return false;
                }
                if (encoding.color && fielddef_1.isDimension(encoding.color)) {
                    return false;
                }
            }
        }
        else {
            if (opt.omitDotPlot)
                return false;
            if (opt.omitTranspose && encoding.y)
                return false;
            if (opt.omitDotPlotWithExtraEncoding && util.keys(encoding).length > 1)
                return false;
        }
        return true;
    }
    rule.point = point;
    function tick(encoding, stats, opt) {
        if (encoding.x || encoding.y) {
            if (encoding_1.isAggregate(encoding))
                return false;
            var xIsDim = fielddef_1.isDimension(encoding.x), yIsDim = fielddef_1.isDimension(encoding.y);
            return (!xIsDim && (!encoding.y || yIsDim)) ||
                (!yIsDim && (!encoding.x || xIsDim));
        }
        return false;
    }
    rule.tick = tick;
    function bar(encoding, stats, opt) {
        if (!facetsRule(encoding, stats, opt))
            return false;
        if (!encoding.x && !encoding.y)
            return false;
        if (opt.omitSizeOnBar && encoding.size !== undefined)
            return false;
        if (opt.omitLengthForLogScale) {
            if (encoding.x && encoding.x.scale && encoding.x.scale.type === scale_1.ScaleType.LOG)
                return false;
            if (encoding.y && encoding.y.scale && encoding.y.scale.type === scale_1.ScaleType.LOG)
                return false;
        }
        var aggEitherXorY = (!encoding.x || encoding.x.aggregate === undefined) !==
            (!encoding.y || encoding.y.aggregate === undefined);
        if (aggEitherXorY) {
            var eitherXorYisDimOrNull = (!encoding.x || fielddef_1.isDimension(encoding.x)) !==
                (!encoding.y || fielddef_1.isDimension(encoding.y));
            if (eitherXorYisDimOrNull) {
                var aggregate;
                if (encoding.x) {
                    aggregate = encoding.x.aggregate;
                }
                else {
                    aggregate = encoding.y.aggregate;
                }
                return !(opt.omitStackedAverage && aggregate === aggregate_1.AggregateOp.MEAN && encoding.color);
            }
        }
        return false;
    }
    rule.bar = bar;
    function line(encoding, stats, opt) {
        if (!facetsRule(encoding, stats, opt))
            return false;
        return encoding.x.type === type_1.Type.TEMPORAL && !!encoding.x.timeUnit &&
            encoding.y.type === type_1.Type.QUANTITATIVE && !!encoding.y.aggregate;
    }
    rule.line = line;
    function area(encoding, stats, opt) {
        if (!facetsRule(encoding, stats, opt))
            return false;
        if (!line(encoding, stats, opt))
            return false;
        if (opt.omitLengthForLogScale) {
            if (encoding.x && encoding.x.scale && encoding.x.scale.type === scale_1.ScaleType.LOG)
                return false;
            if (encoding.y && encoding.y.scale && encoding.y.scale.type === scale_1.ScaleType.LOG)
                return false;
        }
        return !(opt.omitStackedAverage && encoding.y.aggregate === aggregate_1.AggregateOp.MEAN && encoding.color);
    }
    rule.area = area;
    function text(encoding, stats, opt) {
        return (encoding.row || encoding.column) && encoding.text && encoding.text.aggregate && !encoding.x && !encoding.y && !encoding.size &&
            (!opt.alwaysGenerateTableAsHeatmap || !encoding.color);
    }
    rule.text = text;
})(rule = exports.rule || (exports.rule = {}));

},{"../util":20,"vega-lite/src/aggregate":30,"vega-lite/src/encoding":33,"vega-lite/src/fielddef":34,"vega-lite/src/scale":37,"vega-lite/src/type":40,"vega-lite/src/validate":42}],13:[function(require,module,exports){
"use strict";
var vlFieldDef = require('vega-lite/src/fielddef');
var util = require('../util');
var consts_1 = require('../consts');
var type_1 = require('vega-lite/src/type');
var isDimension = vlFieldDef.isDimension;
function projections(fieldDefs, stats, opt) {
    if (opt === void 0) { opt = {}; }
    opt = util.extend({}, consts_1.DEFAULT_PROJECTION_OPT, opt);
    var selected = [], fieldsToAdd = [], fieldSets = [];
    var hasSelectedDimension = false, hasSelectedMeasure = false;
    var indices = {};
    fieldDefs.forEach(function (fieldDef, index) {
        indices[fieldDef.field] = index;
        if (fieldDef.selected) {
            selected.push(fieldDef);
            if (isDimension(fieldDef) ||
                (fieldDef.type === type_1.TEMPORAL)) {
                hasSelectedDimension = true;
            }
            else {
                hasSelectedMeasure = true;
            }
        }
        else if (fieldDef.selected !== false && !vlFieldDef.isCount(fieldDef)) {
            if (vlFieldDef.isDimension(fieldDef) &&
                !opt.maxCardinalityForAutoAddOrdinal &&
                vlFieldDef.cardinality(fieldDef, stats, 15) > opt.maxCardinalityForAutoAddOrdinal) {
                return;
            }
            fieldsToAdd.push(fieldDef);
        }
    });
    fieldsToAdd.sort(compareFieldsToAdd(hasSelectedDimension, hasSelectedMeasure, indices));
    var setsToAdd = util.chooseKorLess(fieldsToAdd, opt.maxAdditionalVariables);
    setsToAdd.forEach(function (setToAdd) {
        var fieldSet = selected.concat(setToAdd);
        if (fieldSet.length > 0) {
            if (opt.omitDotPlot && fieldSet.length === 1) {
                return;
            }
            fieldSets.push(fieldSet);
        }
    });
    fieldSets.forEach(function (fieldSet) {
        fieldSet.key = key(fieldSet);
    });
    return fieldSets;
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = projections;
var typeIsMeasureScore = {
    nominal: 0,
    ordinal: 0,
    temporal: 2,
    quantitative: 3
};
function compareFieldsToAdd(hasSelectedDimension, hasSelectedMeasure, indices) {
    return function (a, b) {
        if (a.type !== b.type) {
            if (!hasSelectedDimension) {
                return typeIsMeasureScore[a.type] - typeIsMeasureScore[b.type];
            }
            else {
                return typeIsMeasureScore[b.type] - typeIsMeasureScore[a.type];
            }
        }
        return indices[a.field] - indices[b.field];
    };
}
function key(projection) {
    return projection.map(function (fieldDef) {
        return vlFieldDef.isCount(fieldDef) ? 'count' : fieldDef.field;
    }).join(',');
}
exports.key = key;
;

},{"../consts":7,"../util":20,"vega-lite/src/fielddef":34,"vega-lite/src/type":40}],14:[function(require,module,exports){
'use strict';
var vlFieldDef = require('vega-lite/src/fielddef');
var util = require('../util');
var consts_1 = require('../consts');
var encodings_1 = require('./encodings');
var marks_1 = require('./marks');
var rank = require('../rank/rank');
var shorthand_1 = require('vega-lite/src/shorthand');
function genSpecsFromFieldDefs(output, fieldDefs, stats, opt, nested) {
    if (opt === void 0) { opt = {}; }
    opt = util.extend({}, consts_1.DEFAULT_SPEC_OPTION, opt);
    var encodings = encodings_1.default([], fieldDefs, stats, opt);
    if (nested) {
        return encodings.reduce(function (dict, encoding) {
            var encodingShorthand = shorthand_1.shortenEncoding(encoding);
            dict[encodingShorthand] = genSpecsFromEncodings([], encoding, stats, opt);
            return dict;
        }, {});
    }
    else {
        return encodings.reduce(function (list, encoding) {
            return genSpecsFromEncodings(list, encoding, stats, opt);
        }, output);
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = genSpecsFromFieldDefs;
function genSpecsFromEncodings(output, encoding, stats, opt) {
    marks_1.default(encoding, stats, opt)
        .forEach(function (mark) {
        var spec = util.duplicate({
            encoding: encoding,
            config: opt.config
        });
        spec.mark = mark;
        spec.data = opt.data;
        spec = finalTouch(spec, stats, opt);
        var score = rank.encoding(spec, stats, opt);
        spec._info = score;
        output.push(spec);
    });
    return output;
}
function finalTouch(spec, stats, opt) {
    if (spec.mark === 'text' && opt.alwaysGenerateTableAsHeatmap) {
        spec.encoding.color = spec.encoding.text;
    }
    var encoding = spec.encoding;
    ['x', 'y'].forEach(function (channel) {
        var fieldDef = encoding[channel];
        if (fieldDef && vlFieldDef.isMeasure(fieldDef) && !vlFieldDef.isCount(fieldDef)) {
            var stat = stats[fieldDef.field];
            if (stat && stat.stdev / stat.mean < 0.01) {
                fieldDef.scale = { zero: false };
            }
        }
    });
    return spec;
}

},{"../consts":7,"../rank/rank":15,"../util":20,"./encodings":10,"./marks":12,"vega-lite/src/fielddef":34,"vega-lite/src/shorthand":38}],15:[function(require,module,exports){
"use strict";
var rankEncodings_1 = require('./rankEncodings');
exports.encoding = rankEncodings_1.default;

},{"./rankEncodings":16}],16:[function(require,module,exports){
'use strict';
var vlEncoding = require('vega-lite/src/encoding');
var vlFieldDef = require('vega-lite/src/fielddef');
var vlChannel = require('vega-lite/src/channel');
var isDimension = vlFieldDef.isDimension;
var util = require('../util');
var vlShorthand = require('vega-lite/src/shorthand');
var type_1 = require('vega-lite/src/type');
var mark_1 = require('vega-lite/src/mark');
var UNUSED_POSITION = 0.5;
var MARK_SCORE = {
    line: 0.99,
    area: 0.98,
    bar: 0.97,
    tick: 0.96,
    point: 0.95,
    circle: 0.94,
    square: 0.94,
    text: 0.8
};
var D = {}, M = {}, BAD = 0.1, TERRIBLE = 0.01;
D.minor = 0.01;
D.pos = 1;
D.Y_T = 0.8;
D.facet_text = 1;
D.facet_good = 0.675;
D.facet_ok = 0.55;
D.facet_bad = 0.4;
D.color_good = 0.7;
D.color_ok = 0.65;
D.color_bad = 0.3;
D.color_stack = 0.6;
D.shape = 0.6;
D.detail = 0.5;
D.bad = BAD;
D.terrible = TERRIBLE;
M.pos = 1;
M.size = 0.6;
M.color = 0.5;
M.text = 0.4;
M.bad = BAD;
M.terrible = TERRIBLE;
exports.dimensionScore = function (fieldDef, channel, mark, stats, opt) {
    var cardinality = vlFieldDef.cardinality(fieldDef, stats);
    switch (channel) {
        case vlChannel.X:
            if (fieldDef.type === type_1.Type.NOMINAL || fieldDef.type === type_1.Type.ORDINAL) {
                return D.pos - D.minor;
            }
            return D.pos;
        case vlChannel.Y:
            if (fieldDef.type === type_1.Type.NOMINAL || fieldDef.type === type_1.Type.ORDINAL) {
                return D.pos - D.minor;
            }
            if (fieldDef.type === type_1.Type.TEMPORAL) {
                return D.Y_T;
            }
            return D.pos - D.minor;
        case vlChannel.COLUMN:
            if (mark === 'text')
                return D.facet_text;
            return cardinality <= opt.maxGoodCardinalityForFacets ? D.facet_good :
                cardinality <= opt.maxCardinalityForFacets ? D.facet_ok : D.facet_bad;
        case vlChannel.ROW:
            if (mark === 'text')
                return D.facet_text;
            return (cardinality <= opt.maxGoodCardinalityForFacets ? D.facet_good :
                cardinality <= opt.maxCardinalityForFacets ? D.facet_ok : D.facet_bad) - D.minor;
        case vlChannel.COLOR:
            var hasOrder = (fieldDef.bin && fieldDef.type === type_1.Type.QUANTITATIVE) || (fieldDef.timeUnit && fieldDef.type === type_1.Type.TEMPORAL);
            var isStacked = mark === mark_1.Mark.BAR || mark === mark_1.Mark.AREA;
            if (hasOrder)
                return D.color_bad;
            if (isStacked)
                return D.color_stack;
            return cardinality <= opt.maxGoodCardinalityForColor ? D.color_good : cardinality <= opt.maxCardinalityForColor ? D.color_ok : D.color_bad;
        case vlChannel.SHAPE:
            return cardinality <= opt.maxCardinalityForShape ? D.shape : TERRIBLE;
        case vlChannel.DETAIL:
            return D.detail;
    }
    return TERRIBLE;
};
exports.dimensionScore.consts = D;
exports.measureScore = function (fieldDef, channel, mark, stats, opt) {
    switch (channel) {
        case vlChannel.X: return M.pos;
        case vlChannel.Y: return M.pos;
        case vlChannel.SIZE:
            if (mark === mark_1.Mark.BAR || mark === mark_1.Mark.TEXT || mark === mark_1.Mark.LINE) {
                return BAD;
            }
            return M.size;
        case vlChannel.COLOR: return M.color;
        case vlChannel.TEXT: return M.text;
    }
    return BAD;
};
exports.measureScore.consts = M;
function rankEncodings(spec, stats, opt, selected) {
    var features = [], channels = util.keys(spec.encoding), mark = spec.mark, encoding = spec.encoding;
    var encodingMappingByField = vlEncoding.reduce(spec.encoding, function (o, fieldDef, channel) {
        var key = vlShorthand.shortenFieldDef(fieldDef);
        var mappings = o[key] = o[key] || [];
        mappings.push({ channel: channel, fieldDef: fieldDef });
        return o;
    }, {});
    util.forEach(encodingMappingByField, function (mappings) {
        var reasons = mappings.map(function (m) {
            return m.channel + vlShorthand.ASSIGN + vlShorthand.shortenFieldDef(m.fieldDef) +
                ' ' + (selected && selected[m.fieldDef.field] ? '[x]' : '[ ]');
        }), scores = mappings.map(function (m) {
            var roleScore = vlFieldDef.isDimension(m.fieldDef) ?
                exports.dimensionScore : exports.measureScore;
            var score = roleScore(m.fieldDef, m.channel, spec.mark, stats, opt);
            return !selected || selected[m.fieldDef.field] ? score : Math.pow(score, 0.125);
        });
        features.push({
            reason: reasons.join(' | '),
            score: Math.max.apply(null, scores)
        });
    });
    if (mark === 'text') {
    }
    else {
        if (encoding.x && encoding.y) {
            if (isDimension(encoding.x) !== isDimension(encoding.y)) {
                features.push({
                    reason: 'OxQ plot',
                    score: 0.8
                });
            }
        }
    }
    if (channels.length > 1 && mark !== mark_1.Mark.TEXT) {
        if ((!encoding.x || !encoding.y) && !encoding.geo && !encoding.text) {
            features.push({
                reason: 'unused position',
                score: UNUSED_POSITION
            });
        }
    }
    features.push({
        reason: 'mark=' + mark,
        score: MARK_SCORE[mark]
    });
    return {
        score: features.reduce(function (p, f) {
            return p * f.score;
        }, 1),
        features: features
    };
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = rankEncodings;

},{"../util":20,"vega-lite/src/channel":31,"vega-lite/src/encoding":33,"vega-lite/src/fielddef":34,"vega-lite/src/mark":36,"vega-lite/src/shorthand":38,"vega-lite/src/type":40}],17:[function(require,module,exports){
"use strict";
exports.DEFAULT_MARKTYPE_TRANSITIONS = {
    AREA_BAR: { name: 'AREA_BAR', cost: 1 },
    AREA_LINE: { name: 'AREA_LINE', cost: 1 },
    AREA_POINT: { name: 'AREA_POINT', cost: 1 },
    AREA_TEXT: { name: 'AREA_TEXT', cost: 1 },
    AREA_TICK: { name: 'AREA_TICK', cost: 1 },
    BAR_LINE: { name: 'BAR_LINE', cost: 1 },
    BAR_POINT: { name: 'BAR_POINT', cost: 1 },
    BAR_TEXT: { name: 'BAR_TEXT', cost: 1 },
    BAR_TICK: { name: 'BAR_TICK', cost: 1 },
    LINE_POINT: { name: 'LINE_POINT', cost: 1 },
    LINE_TEXT: { name: 'LINE_TEXT', cost: 1 },
    LINE_TICK: { name: 'LINE_TICK', cost: 1 },
    POINT_TEXT: { name: 'POINT_TEXT', cost: 1 },
    POINT_TICK: { name: 'POINT_TICK', cost: 1 },
    TEXT_TICK: { name: 'TEXT_TICK', cost: 1 }
};
exports.DEFAULT_MARKTYPE_TRANSITION_LIST = [
    "AREA_BAR",
    "AREA_LINE",
    "AREA_POINT",
    "AREA_TEXT",
    "AREA_TICK",
    "BAR_LINE",
    "BAR_POINT",
    "BAR_TEXT",
    "BAR_TICK",
    "LINE_POINT",
    "LINE_TEXT",
    "LINE_TICK",
    "POINT_TEXT",
    "POINT_TICK",
    "TEXT_TICK"];
exports.DEFAULT_TRANSFORM_TRANSITIONS = {
    SCALE: { name: 'SCALE', cost: 1 },
    SORT: { name: 'SORT', cost: 1 },
    BIN: { name: 'BIN', cost: 1 },
    AGGREGATE: { name: 'AGGREGATE', cost: 1 },
    SETTYPE: { name: 'SETTYPE', cost: 1 },
    ADD_FILTER: { name: 'ADD_FILTER', cost: 1 },
    REMOVE_FILTER: { name: 'REMOVE_FILTER', cost: 1 },
    MODIFY_FILTER: { name: 'MODIFY_FILTER', cost: 1 }
};
exports.DEFAULT_TRANSFORM_TRANSITION_LIST = [
    "SCALE",
    "SORT",
    "BIN",
    "AGGREGATE",
    "SETTYPE",
    "ADD_FILTER",
    "REMOVE_FILTER",
    "MODIFY_FILTER"
];
exports.CHANNELS_WITH_TRANSITION_ORDER = [
    "x", "y", "color", "shape", "size", "row", "column", "text"
];
exports.DEFAULT_ENCODING_TRANSITIONS = {
    ADD_X: { name: 'ADD_X', cost: 1 },
    ADD_Y: { name: 'ADD_Y', cost: 1 },
    ADD_COLOR: { name: 'ADD_COLOR', cost: 1 },
    ADD_SHAPE: { name: 'ADD_SHAPE', cost: 1 },
    ADD_SIZE: { name: 'ADD_SIZE', cost: 1 },
    ADD_ROW: { name: 'ADD_ROW', cost: 1 },
    ADD_COLUMN: { name: 'ADD_COLUMN', cost: 1 },
    ADD_X_COUNT: { name: 'ADD_X_COUNT', cost: 1 },
    ADD_Y_COUNT: { name: 'ADD_Y_COUNT', cost: 1 },
    ADD_COLOR_COUNT: { name: 'ADD_COLOR_COUNT', cost: 1 },
    ADD_SHAPE_COUNT: { name: 'ADD_SHAPE_COUNT', cost: 1 },
    ADD_SIZE_COUNT: { name: 'ADD_SIZE_COUNT', cost: 1 },
    ADD_ROW_COUNT: { name: 'ADD_ROW_COUNT', cost: 1 },
    ADD_COLUMN_COUNT: { name: 'ADD_COLUMN_COUNT', cost: 1 },
    REMOVE_X_COUNT: { name: 'REMOVE_X_COUNT', cost: 1 },
    REMOVE_Y_COUNT: { name: 'REMOVE_Y_COUNT', cost: 1 },
    REMOVE_COLOR_COUNT: { name: 'REMOVE_COLOR_COUNT', cost: 1 },
    REMOVE_SHAPE_COUNT: { name: 'REMOVE_SHAPE_COUNT', cost: 1 },
    REMOVE_SIZE_COUNT: { name: 'REMOVE_SIZE_COUNT', cost: 1 },
    REMOVE_ROW_COUNT: { name: 'REMOVE_ROW_COUNT', cost: 1 },
    REMOVE_COLUMN_COUNT: { name: 'REMOVE_COLUMN_COUNT', cost: 1 },
    REMOVE_X: { name: 'REMOVE_X', cost: 1 },
    REMOVE_Y: { name: 'REMOVE_Y', cost: 1 },
    REMOVE_COLOR: { name: 'REMOVE_COLOR', cost: 1 },
    REMOVE_SHAPE: { name: 'REMOVE_SHAPE', cost: 1 },
    REMOVE_SIZE: { name: 'REMOVE_SIZE', cost: 1 },
    REMOVE_ROW: { name: 'REMOVE_ROW', cost: 1 },
    REMOVE_COLUMN: { name: 'REMOVE_COLUMN', cost: 1 },
    MODIFY_X: { name: 'MODIFY_X', cost: 1 },
    MODIFY_Y: { name: 'MODIFY_Y', cost: 1 },
    MODIFY_COLOR: { name: 'MODIFY_COLOR', cost: 1 },
    MODIFY_SHAPE: { name: 'MODIFY_SHAPE', cost: 1 },
    MODIFY_SIZE: { name: 'MODIFY_SIZE', cost: 1 },
    MODIFY_ROW: { name: 'MODIFY_ROW', cost: 1 },
    MODIFY_COLUMN: { name: 'MODIFY_COLUMN', cost: 1 },
    MODIFY_X_ADD_COUNT: { name: 'MODIFY_X_ADD_COUNT', cost: 1 },
    MODIFY_Y_ADD_COUNT: { name: 'MODIFY_Y_ADD_COUNT', cost: 1 },
    MODIFY_COLOR_ADD_COUNT: { name: 'MODIFY_COLOR_ADD_COUNT', cost: 1 },
    MODIFY_SHAPE_ADD_COUNT: { name: 'MODIFY_SHAPE_ADD_COUNT', cost: 1 },
    MODIFY_SIZE_ADD_COUNT: { name: 'MODIFY_SIZE_ADD_COUNT', cost: 1 },
    MODIFY_ROW_ADD_COUNT: { name: 'MODIFY_ROW_ADD_COUNT', cost: 1 },
    MODIFY_COLUMN_ADD_COUNT: { name: 'MODIFY_COLUMN_ADD_COUNT', cost: 1 },
    MODIFY_X_REMOVE_COUNT: { name: 'MODIFY_X_REMOVE_COUNT', cost: 1 },
    MODIFY_Y_REMOVE_COUNT: { name: 'MODIFY_Y_REMOVE_COUNT', cost: 1 },
    MODIFY_COLOR_REMOVE_COUNT: { name: 'MODIFY_COLOR_REMOVE_COUNT', cost: 1 },
    MODIFY_SHAPE_REMOVE_COUNT: { name: 'MODIFY_SHAPE_REMOVE_COUNT', cost: 1 },
    MODIFY_SIZE_REMOVE_COUNT: { name: 'MODIFY_SIZE_REMOVE_COUNT', cost: 1 },
    MODIFY_ROW_REMOVE_COUNT: { name: 'MODIFY_ROW_REMOVE_COUNT', cost: 1 },
    MODIFY_COLUMN_REMOVE_COUNT: { name: 'MODIFY_COLUMN_REMOVE_COUNT', cost: 1 },
    MOVE_X_COLUMN: { name: 'MOVE_X_COLUMN', cost: 1 },
    MOVE_X_ROW: { name: 'MOVE_X_ROW', cost: 1 },
    MOVE_X_SIZE: { name: 'MOVE_X_SIZE', cost: 1 },
    MOVE_X_SHAPE: { name: 'MOVE_X_SHAPE', cost: 1 },
    MOVE_X_COLOR: { name: 'MOVE_X_COLOR', cost: 1 },
    MOVE_X_Y: { name: 'MOVE_X_Y', cost: 1 },
    MOVE_Y_COLUMN: { name: 'MOVE_Y_COLUMN', cost: 1 },
    MOVE_Y_ROW: { name: 'MOVE_Y_ROW', cost: 1 },
    MOVE_Y_SIZE: { name: 'MOVE_Y_SIZE', cost: 1 },
    MOVE_Y_SHAPE: { name: 'MOVE_Y_SHAPE', cost: 1 },
    MOVE_Y_COLOR: { name: 'MOVE_Y_COLOR', cost: 1 },
    MOVE_Y_X: { name: 'MOVE_Y_X', cost: 1 },
    MOVE_COLOR_COLUMN: { name: 'MOVE_COLOR_COLUMN', cost: 1 },
    MOVE_COLOR_ROW: { name: 'MOVE_COLOR_ROW', cost: 1 },
    MOVE_COLOR_SIZE: { name: 'MOVE_COLOR_SIZE', cost: 1 },
    MOVE_COLOR_SHAPE: { name: 'MOVE_COLOR_SHAPE', cost: 1 },
    MOVE_COLOR_Y: { name: 'MOVE_COLOR_Y', cost: 1 },
    MOVE_COLOR_X: { name: 'MOVE_COLOR_X', cost: 1 },
    MOVE_SHAPE_COLUMN: { name: 'MOVE_SHAPE_COLUMN', cost: 1 },
    MOVE_SHAPE_ROW: { name: 'MOVE_SHAPE_ROW', cost: 1 },
    MOVE_SHAPE_SIZE: { name: 'MOVE_SHAPE_SIZE', cost: 1 },
    MOVE_SHAPE_COLOR: { name: 'MOVE_SHAPE_COLOR', cost: 1 },
    MOVE_SHAPE_Y: { name: 'MOVE_SHAPE_Y', cost: 1 },
    MOVE_SHAPE_X: { name: 'MOVE_SHAPE_X', cost: 1 },
    MOVE_SIZE_COLUMN: { name: 'MOVE_SIZE_COLUMN', cost: 1 },
    MOVE_SIZE_ROW: { name: 'MOVE_SIZE_ROW', cost: 1 },
    MOVE_SIZE_SHAPE: { name: 'MOVE_SIZE_SHAPE', cost: 1 },
    MOVE_SIZE_COLOR: { name: 'MOVE_SIZE_COLOR', cost: 1 },
    MOVE_SIZE_Y: { name: 'MOVE_SIZE_Y', cost: 1 },
    MOVE_SIZE_X: { name: 'MOVE_SIZE_X', cost: 1 },
    MOVE_ROW_COLUMN: { name: 'MOVE_ROW_COLUMN', cost: 1 },
    MOVE_ROW_SIZE: { name: 'MOVE_ROW_SIZE', cost: 1 },
    MOVE_ROW_SHAPE: { name: 'MOVE_ROW_SHAPE', cost: 1 },
    MOVE_ROW_COLOR: { name: 'MOVE_ROW_COLOR', cost: 1 },
    MOVE_ROW_Y: { name: 'MOVE_ROW_Y', cost: 1 },
    MOVE_ROW_X: { name: 'MOVE_ROW_X', cost: 1 },
    MOVE_COLUMN_ROW: { name: 'MOVE_COLUMN_ROW', cost: 1 },
    MOVE_COLUMN_SIZE: { name: 'MOVE_COLUMN_SIZE', cost: 1 },
    MOVE_COLUMN_SHAPE: { name: 'MOVE_COLUMN_SHAPE', cost: 1 },
    MOVE_COLUMN_COLOR: { name: 'MOVE_COLUMN_COLOR', cost: 1 },
    MOVE_COLUMN_Y: { name: 'MOVE_COLUMN_Y', cost: 1 },
    MOVE_COLUMN_X: { name: 'MOVE_COLUMN_X', cost: 1 },
    SWAP_X_Y: { name: 'SWAP_X_Y', cost: 1 },
    SWAP_ROW_COLUMN: { name: 'SWAP_ROW_COLUMN', cost: 1 },
    ceiling: { cost: 4, alternatingCost: 3 }
};
exports.TRANSITIONS = { marktypeTransitions: exports.DEFAULT_MARKTYPE_TRANSITIONS, transformTransitions: exports.DEFAULT_TRANSFORM_TRANSITIONS, encodingTransitions: exports.DEFAULT_ENCODING_TRANSITIONS };
exports.DEFAULT_TRANSITIONS = {
    "marktypeTransitions": {
        "AREA_BAR": { "name": "AREA_BAR", "cost": 0.03 },
        "AREA_LINE": { "name": "AREA_LINE", "cost": 0.02 },
        "AREA_POINT": { "name": "AREA_POINT", "cost": 0.04 },
        "AREA_TEXT": { "name": "AREA_TEXT", "cost": 0.08 },
        "AREA_TICK": { "name": "AREA_TICK", "cost": 0.04 },
        "BAR_LINE": { "name": "BAR_LINE", "cost": 0.04 },
        "BAR_POINT": { "name": "BAR_POINT", "cost": 0.02 },
        "BAR_TEXT": { "name": "BAR_TEXT", "cost": 0.07 },
        "BAR_TICK": { "name": "BAR_TICK", "cost": 0.02 },
        "LINE_POINT": { "name": "LINE_POINT", "cost": 0.03 },
        "LINE_TEXT": { "name": "LINE_TEXT", "cost": 0.06 },
        "LINE_TICK": { "name": "LINE_TICK", "cost": 0.03 },
        "POINT_TEXT": { "name": "POINT_TEXT", "cost": 0.05 },
        "POINT_TICK": { "name": "POINT_TICK", "cost": 0.01 },
        "TEXT_TICK": { "name": "TEXT_TICK", "cost": 0.05 } },
    "transformTransitions": {
        "SETTYPE": { "name": 'SETTYPE', "cost": 1 },
        "SCALE": { "name": "SCALE", "cost": 0.6 },
        "SORT": { "name": "SORT", "cost": 0.61 },
        "BIN": { "name": "BIN", "cost": 0.62 },
        "AGGREGATE": { "name": "AGGREGATE", "cost": 0.63 },
        "ADD_FILTER": { "name": "ADD_FILTER", "cost": 0.65 },
        "REMOVE_FILTER": { "name": "REMOVE_FILTER", "cost": 0.65 },
        "MODIFY_FILTER": { "name": "MODIFY_FILTER", "cost": 0.64 } },
    "encodingTransitions": {
        "ADD_X": { "name": "ADD_X", "cost": 4.59 },
        "ADD_Y": { "name": "ADD_Y", "cost": 4.59 },
        "ADD_COLOR": { "name": "ADD_COLOR", "cost": 4.51 },
        "ADD_SHAPE": { "name": "ADD_SHAPE", "cost": 4.55 },
        "ADD_SIZE": { "name": "ADD_SIZE", "cost": 4.53 },
        "ADD_ROW": { "name": "ADD_ROW", "cost": 4.57 },
        "ADD_COLUMN": { "name": "ADD_COLUMN", "cost": 4.57 },
        "ADD_X_COUNT": { "name": "ADD_X_COUNT", "cost": 4.58 },
        "ADD_Y_COUNT": { "name": "ADD_Y_COUNT", "cost": 4.58 },
        "ADD_COLOR_COUNT": { "name": "ADD_COLOR_COUNT", "cost": 4.5 },
        "ADD_SHAPE_COUNT": { "name": "ADD_SHAPE_COUNT", "cost": 4.54 },
        "ADD_SIZE_COUNT": { "name": "ADD_SIZE_COUNT", "cost": 4.52 },
        "ADD_ROW_COUNT": { "name": "ADD_ROW_COUNT", "cost": 4.56 },
        "ADD_COLUMN_COUNT": { "name": "ADD_COLUMN_COUNT", "cost": 4.56 },
        "REMOVE_X_COUNT": { "name": "REMOVE_X_COUNT", "cost": 4.58 },
        "REMOVE_Y_COUNT": { "name": "REMOVE_Y_COUNT", "cost": 4.58 },
        "REMOVE_COLOR_COUNT": { "name": "REMOVE_COLOR_COUNT", "cost": 4.5 },
        "REMOVE_SHAPE_COUNT": { "name": "REMOVE_SHAPE_COUNT", "cost": 4.54 },
        "REMOVE_SIZE_COUNT": { "name": "REMOVE_SIZE_COUNT", "cost": 4.52 },
        "REMOVE_ROW_COUNT": { "name": "REMOVE_ROW_COUNT", "cost": 4.56 },
        "REMOVE_COLUMN_COUNT": { "name": "REMOVE_COLUMN_COUNT", "cost": 4.56 },
        "REMOVE_X": { "name": "REMOVE_X", "cost": 4.59 },
        "REMOVE_Y": { "name": "REMOVE_Y", "cost": 4.59 },
        "REMOVE_COLOR": { "name": "REMOVE_COLOR", "cost": 4.51 },
        "REMOVE_SHAPE": { "name": "REMOVE_SHAPE", "cost": 4.55 },
        "REMOVE_SIZE": { "name": "REMOVE_SIZE", "cost": 4.53 },
        "REMOVE_ROW": { "name": "REMOVE_ROW", "cost": 4.57 },
        "REMOVE_COLUMN": { "name": "REMOVE_COLUMN", "cost": 4.57 },
        "MODIFY_X": { "name": "MODIFY_X", "cost": 4.74 },
        "MODIFY_Y": { "name": "MODIFY_Y", "cost": 4.74 },
        "MODIFY_COLOR": { "name": "MODIFY_COLOR", "cost": 4.68 },
        "MODIFY_SHAPE": { "name": "MODIFY_SHAPE", "cost": 4.62 },
        "MODIFY_SIZE": { "name": "MODIFY_SIZE", "cost": 4.65 },
        "MODIFY_ROW": { "name": "MODIFY_ROW", "cost": 4.71 },
        "MODIFY_COLUMN": { "name": "MODIFY_COLUMN", "cost": 4.71 },
        "MODIFY_X_ADD_COUNT": { "name": "MODIFY_X_ADD_COUNT", "cost": 4.72 },
        "MODIFY_Y_ADD_COUNT": { "name": "MODIFY_Y_ADD_COUNT", "cost": 4.72 },
        "MODIFY_COLOR_ADD_COUNT": { "name": "MODIFY_COLOR_ADD_COUNT", "cost": 4.66 },
        "MODIFY_SHAPE_ADD_COUNT": { "name": "MODIFY_SHAPE_ADD_COUNT", "cost": 4.6 },
        "MODIFY_SIZE_ADD_COUNT": { "name": "MODIFY_SIZE_ADD_COUNT", "cost": 4.63 },
        "MODIFY_ROW_ADD_COUNT": { "name": "MODIFY_ROW_ADD_COUNT", "cost": 4.69 },
        "MODIFY_COLUMN_ADD_COUNT": { "name": "MODIFY_COLUMN_ADD_COUNT", "cost": 4.69 },
        "MODIFY_X_REMOVE_COUNT": { "name": "MODIFY_X_REMOVE_COUNT", "cost": 4.73 },
        "MODIFY_Y_REMOVE_COUNT": { "name": "MODIFY_Y_REMOVE_COUNT", "cost": 4.73 },
        "MODIFY_COLOR_REMOVE_COUNT": { "name": "MODIFY_COLOR_REMOVE_COUNT", "cost": 4.67 },
        "MODIFY_SHAPE_REMOVE_COUNT": { "name": "MODIFY_SHAPE_REMOVE_COUNT", "cost": 4.61 },
        "MODIFY_SIZE_REMOVE_COUNT": { "name": "MODIFY_SIZE_REMOVE_COUNT", "cost": 4.64 },
        "MODIFY_ROW_REMOVE_COUNT": { "name": "MODIFY_ROW_REMOVE_COUNT", "cost": 4.7 },
        "MODIFY_COLUMN_REMOVE_COUNT": { "name": "MODIFY_COLUMN_REMOVE_COUNT", "cost": 4.7 },
        "MOVE_X_COLUMN": { "name": "MOVE_X_COLUMN", "cost": 4.45 },
        "MOVE_X_ROW": { "name": "MOVE_X_ROW", "cost": 4.43 },
        "MOVE_X_SIZE": { "name": "MOVE_X_SIZE", "cost": 4.47 },
        "MOVE_X_SHAPE": { "name": "MOVE_X_SHAPE", "cost": 4.48 },
        "MOVE_X_COLOR": { "name": "MOVE_X_COLOR", "cost": 4.46 },
        "MOVE_X_Y": { "name": "MOVE_X_Y", "cost": 4.44 },
        "MOVE_Y_COLUMN": { "name": "MOVE_Y_COLUMN", "cost": 4.43 },
        "MOVE_Y_ROW": { "name": "MOVE_Y_ROW", "cost": 4.45 },
        "MOVE_Y_SIZE": { "name": "MOVE_Y_SIZE", "cost": 4.47 },
        "MOVE_Y_SHAPE": { "name": "MOVE_Y_SHAPE", "cost": 4.48 },
        "MOVE_Y_COLOR": { "name": "MOVE_Y_COLOR", "cost": 4.46 },
        "MOVE_Y_X": { "name": "MOVE_Y_X", "cost": 4.44 },
        "MOVE_COLOR_COLUMN": { "name": "MOVE_COLOR_COLUMN", "cost": 4.47 },
        "MOVE_COLOR_ROW": { "name": "MOVE_COLOR_ROW", "cost": 4.47 },
        "MOVE_COLOR_SIZE": { "name": "MOVE_COLOR_SIZE", "cost": 4.43 },
        "MOVE_COLOR_SHAPE": { "name": "MOVE_COLOR_SHAPE", "cost": 4.43 },
        "MOVE_COLOR_Y": { "name": "MOVE_COLOR_Y", "cost": 4.46 },
        "MOVE_COLOR_X": { "name": "MOVE_COLOR_X", "cost": 4.46 },
        "MOVE_SHAPE_COLUMN": { "name": "MOVE_SHAPE_COLUMN", "cost": 4.49 },
        "MOVE_SHAPE_ROW": { "name": "MOVE_SHAPE_ROW", "cost": 4.49 },
        "MOVE_SHAPE_SIZE": { "name": "MOVE_SHAPE_SIZE", "cost": 4.43 },
        "MOVE_SHAPE_COLOR": { "name": "MOVE_SHAPE_COLOR", "cost": 4.43 },
        "MOVE_SHAPE_Y": { "name": "MOVE_SHAPE_Y", "cost": 4.48 },
        "MOVE_SHAPE_X": { "name": "MOVE_SHAPE_X", "cost": 4.48 },
        "MOVE_SIZE_COLUMN": { "name": "MOVE_SIZE_COLUMN", "cost": 4.48 },
        "MOVE_SIZE_ROW": { "name": "MOVE_SIZE_ROW", "cost": 4.48 },
        "MOVE_SIZE_SHAPE": { "name": "MOVE_SIZE_SHAPE", "cost": 4.43 },
        "MOVE_SIZE_COLOR": { "name": "MOVE_SIZE_COLOR", "cost": 4.43 },
        "MOVE_SIZE_Y": { "name": "MOVE_SIZE_Y", "cost": 4.47 },
        "MOVE_SIZE_X": { "name": "MOVE_SIZE_X", "cost": 4.47 },
        "MOVE_ROW_COLUMN": { "name": "MOVE_ROW_COLUMN", "cost": 4.44 },
        "MOVE_ROW_SIZE": { "name": "MOVE_ROW_SIZE", "cost": 4.48 },
        "MOVE_ROW_SHAPE": { "name": "MOVE_ROW_SHAPE", "cost": 4.49 },
        "MOVE_ROW_COLOR": { "name": "MOVE_ROW_COLOR", "cost": 4.47 },
        "MOVE_ROW_Y": { "name": "MOVE_ROW_Y", "cost": 4.45 },
        "MOVE_ROW_X": { "name": "MOVE_ROW_X", "cost": 4.43 },
        "MOVE_COLUMN_ROW": { "name": "MOVE_COLUMN_ROW", "cost": 4.44 },
        "MOVE_COLUMN_SIZE": { "name": "MOVE_COLUMN_SIZE", "cost": 4.48 },
        "MOVE_COLUMN_SHAPE": { "name": "MOVE_COLUMN_SHAPE", "cost": 4.49 },
        "MOVE_COLUMN_COLOR": { "name": "MOVE_COLUMN_COLOR", "cost": 4.47 },
        "MOVE_COLUMN_Y": { "name": "MOVE_COLUMN_Y", "cost": 4.43 },
        "MOVE_COLUMN_X": { "name": "MOVE_COLUMN_X", "cost": 4.45 },
        "SWAP_X_Y": { "name": "SWAP_X_Y", "cost": 4.42 },
        "SWAP_ROW_COLUMN": { "name": "SWAP_ROW_COLUMN", "cost": 4.41 },
        "ceiling": { "cost": 14.22, "alternatingCost": 18.96 } } };

},{}],18:[function(require,module,exports){
"use strict";
var util = require('../util');
var def = require('./def');
function neighbors(spec, additionalFields, additionalChannels, importedEncodingTransitions) {
    var neighbors = [];
    var encodingTransitions = importedEncodingTransitions || def.DEFAULT_ENCODING_TRANSITIONS;
    var inChannels = util.keys(spec.encoding);
    var exChannels = additionalChannels;
    inChannels.forEach(function (channel) {
        var newNeighbor = util.duplicate(spec);
        var transitionType = "REMOVE_" + channel.toUpperCase();
        transitionType += (spec.encoding[channel].field === "*") ? "_COUNT" : "";
        var transition = util.duplicate(encodingTransitions[transitionType]);
        var newAdditionalFields = util.duplicate(additionalFields);
        if (util.find(newAdditionalFields, util.rawEqual, newNeighbor.encoding[channel]) === -1) {
            newAdditionalFields.push(newNeighbor.encoding[channel]);
        }
        var newAdditionalChannels = util.duplicate(additionalChannels);
        transition.detail = { "field": newNeighbor.encoding[channel].field, "channel": channel };
        newAdditionalChannels.push(channel);
        delete newNeighbor.encoding[channel];
        if (validate(newNeighbor)) {
            newNeighbor.transition = transition;
            newNeighbor.additionalFields = newAdditionalFields;
            newNeighbor.additionalChannels = newAdditionalChannels;
            neighbors.push(newNeighbor);
        }
        ;
        additionalFields.forEach(function (field, index) {
            newNeighbor = util.duplicate(spec);
            transitionType = "MODIFY_" + channel.toUpperCase();
            if (spec.encoding[channel].field === "*" && field.field !== "*") {
                transitionType += "_REMOVE_COUNT";
            }
            else if (spec.encoding[channel].field !== "*" && field.field === "*") {
                transitionType += "_ADD_COUNT";
            }
            transition = util.duplicate(encodingTransitions[transitionType]);
            newAdditionalFields = util.duplicate(additionalFields);
            newAdditionalFields.splice(index, 1);
            if (util.find(newAdditionalFields, util.rawEqual, newNeighbor.encoding[channel]) === -1) {
                newAdditionalFields.push(newNeighbor.encoding[channel]);
            }
            newAdditionalChannels = util.duplicate(additionalChannels);
            newNeighbor.encoding[channel] = field;
            transition.detail = { "field": [spec.encoding[channel].field, field.field].join(','), "channel": channel };
            if (validate(newNeighbor)) {
                newNeighbor.transition = transition;
                newNeighbor.additionalFields = newAdditionalFields;
                newNeighbor.additionalChannels = newAdditionalChannels;
                neighbors.push(newNeighbor);
            }
            ;
        });
        inChannels.forEach(function (anotherChannel) {
            if (anotherChannel === channel
                || (["x", "y"].indexOf(channel) < 0 || ["x", "y"].indexOf(anotherChannel) < 0)) {
                return;
            }
            newNeighbor = util.duplicate(spec);
            transition = util.duplicate(encodingTransitions["SWAP_X_Y"]);
            newAdditionalFields = util.duplicate(additionalFields);
            newAdditionalChannels = util.duplicate(additionalChannels);
            var tempChannel = util.duplicate(newNeighbor.encoding[channel]);
            newNeighbor.encoding[channel] = newNeighbor.encoding[anotherChannel];
            newNeighbor.encoding[anotherChannel] = tempChannel;
            transition.detail = { "field": [spec.encoding["x"].field, spec.encoding["y"].field].join(','), "channel": "x,y" };
            if (validate(newNeighbor)) {
                newNeighbor.transition = transition;
                newNeighbor.additionalFields = newAdditionalFields;
                newNeighbor.additionalChannels = newAdditionalChannels;
                neighbors.push(newNeighbor);
            }
            ;
        });
        exChannels.forEach(function (exChannel, index) {
            newNeighbor = util.duplicate(spec);
            var newNeighborChannels = (channel + "_" + exChannel).toUpperCase();
            transition = util.duplicate(encodingTransitions["MOVE_" + newNeighborChannels]);
            newAdditionalFields = util.duplicate(additionalFields);
            newAdditionalChannels = util.duplicate(additionalChannels);
            newAdditionalChannels.splice(index, 1);
            newAdditionalChannels.push(channel);
            newNeighbor.encoding[exChannel] = util.duplicate(newNeighbor.encoding[channel]);
            delete newNeighbor.encoding[channel];
            transition.detail = { "field": spec.encoding[channel].field, "channel": [channel, exChannel].join(',') };
            if (validate(newNeighbor)) {
                newNeighbor.transition = transition;
                newNeighbor.additionalFields = newAdditionalFields;
                newNeighbor.additionalChannels = newAdditionalChannels;
                neighbors.push(newNeighbor);
            }
            ;
        });
    });
    exChannels.forEach(function (channel, chIndex) {
        additionalFields.forEach(function (field, index) {
            var newNeighbor = util.duplicate(spec);
            var transitionType = "ADD_" + channel.toUpperCase();
            transitionType += (field.field === "*") ? "_COUNT" : "";
            var transition = util.duplicate(encodingTransitions[transitionType]);
            var newAdditionalFields = util.duplicate(additionalFields);
            var newAdditionalChannels = util.duplicate(additionalChannels);
            newAdditionalFields.splice(index, 1);
            newNeighbor.encoding[channel] = field;
            newAdditionalChannels.splice(chIndex, 1);
            transition.detail = { "field": field.field, "channel": channel };
            if (validate(newNeighbor)) {
                newNeighbor.transition = transition;
                newNeighbor.additionalFields = newAdditionalFields;
                newNeighbor.additionalChannels = newAdditionalChannels;
                neighbors.push(newNeighbor);
            }
            ;
        });
    });
    for (var i = 0; i < neighbors.length; i += 1) {
        for (var j = i + 1; j < neighbors.length; j += 1) {
            if (sameEncoding(neighbors[i].encoding, neighbors[j].encoding)) {
                neighbors.splice(j, 1);
                j -= 1;
            }
        }
    }
    return neighbors;
}
exports.neighbors = neighbors;
function validate(spec) {
    return true;
}
function sameEncoding(a, b) {
    var aKeys = util.keys(a);
    var bKeys = util.keys(b);
    if (aKeys.length !== bKeys.length) {
        return false;
    }
    var allKeys = util.union(aKeys, bKeys);
    for (var i = 0; i < allKeys.length; i += 1) {
        var key = allKeys[i];
        if (!(a[key] && b[key])) {
            return false;
        }
        if (a[key].field !== b[key].field) {
            return false;
        }
    }
    return true;
}
exports.sameEncoding = sameEncoding;

},{"../util":20,"./def":17}],19:[function(require,module,exports){
"use strict";
var filter_1 = require('vega-lite/src/filter');
var type_1 = require('vega-lite/src/type');
var channel_1 = require('vega-lite/src/channel');
var expr = require('vega-expression');
var util = require('../util');
var def = require('./def');
var nb = require('./neighbor');
function transitionSet(s, d, importedTransitionCosts, transOptions) {
    var importedMarktypeTransitions = importedTransitionCosts ? importedTransitionCosts.marktypeTransitions : def.DEFAULT_MARKTYPE_TRANSITIONS;
    var importedTransformTransitions = importedTransitionCosts ? importedTransitionCosts.transformTransitions : def.DEFAULT_TRANSFORM_TRANSITIONS;
    var importedEncodingTransitions = importedTransitionCosts ? importedTransitionCosts.encodingTransitions : def.DEFAULT_ENCODING_TRANSITIONS;
    var transitions = {
        marktype: marktypeTransitionSet(s, d, importedMarktypeTransitions),
        transform: transformTransitionSet(s, d, importedTransformTransitions, transOptions),
        encoding: encodingTransitionSet(s, d, importedEncodingTransitions)
    };
    var cost = 0;
    cost = transitions.encoding.reduce(function (prev, transition) {
        if (transition.name.indexOf('_COUNT') >= 0) {
            var channel_2 = transition.name.replace(/COUNT/g, '').replace(/ADD/g, '').replace(/REMOVE/g, '').replace(/MODIFY/g, '').replace(/_/g, '').toLowerCase();
            var aggTr = transitions.transform.filter(function (tr) { return tr.name === "AGGREGATE"; })[0];
            if (aggTr && aggTr.detail.length === 1 && aggTr.detail.filter(function (dt) { return dt.channel.toLowerCase() === channel_2; }).length) {
                aggTr.cost = 0;
            }
            var binTr = transitions.transform.filter(function (tr) { return tr.name === "BIN"; })[0];
            if (binTr && binTr.detail.filter(function (dt) {
                if (dt.type === "added") {
                    return d.encoding[dt.channel].type === type_1.Type.QUANTITATIVE;
                }
                else {
                    return s.encoding[dt.channel].type === type_1.Type.QUANTITATIVE;
                }
            }).length > 0) {
                binTr.cost = 0;
            }
        }
        prev += transition.cost;
        return prev;
    }, cost);
    cost = transitions.marktype.reduce(function (prev, transition) {
        prev += transition.cost;
        return prev;
    }, cost);
    cost = transitions.transform.reduce(function (prev, transition) {
        prev += transition.cost;
        return prev;
    }, cost);
    transitions["cost"] = cost;
    return transitions;
}
exports.transitionSet = transitionSet;
function marktypeTransitionSet(s, d, importedMarktypeTransitions) {
    var transSet = [];
    var marktypeTransitions = importedMarktypeTransitions || def.DEFAULT_MARKTYPE_TRANSITIONS;
    var newTr;
    if (s.mark === d.mark) {
        return transSet;
    }
    else {
        var trName = [s.mark.toUpperCase(), d.mark.toUpperCase()].sort().join("_");
        if (marktypeTransitions[trName]) {
            newTr = util.duplicate(marktypeTransitions[trName]);
            newTr.detail = { "from": s.mark.toUpperCase(), "to": d.mark.toUpperCase() };
            transSet.push(newTr);
        }
    }
    return transSet;
}
exports.marktypeTransitionSet = marktypeTransitionSet;
function transformTransitionSet(s, d, importedTransformTransitions, transOptions) {
    var transformTransitions = importedTransformTransitions || def.DEFAULT_TRANSFORM_TRANSITIONS;
    var transSet = [];
    channel_1.CHANNELS.forEach(function (channel) {
        ["SCALE", "SORT", "AGGREGATE", "BIN", "SETTYPE"].map(function (transformType) {
            var trans;
            var already;
            if (transformType === "SETTYPE" && transformTransitions[transformType]) {
                trans = transformSettype(s, d, channel, transformTransitions);
            }
            else {
                if (transformTransitions[transformType]) {
                    trans = transformBasic(s, d, channel, transformType, transformTransitions, transOptions);
                }
            }
            if (trans) {
                already = util.find(transSet, function (tr) { return tr.name; }, trans);
                if (already >= 0) {
                    transSet[already].detail.push(util.duplicate(trans.detail));
                }
                else {
                    trans.detail = [util.duplicate(trans.detail)];
                    transSet.push(trans);
                }
            }
        });
    });
    var filterTransitions = {
        "MODIFY_FILTER": transformTransitions["MODIFY_FILTER"],
        "ADD_FILTER": transformTransitions["ADD_FILTER"],
        "REMOVE_FILTER": transformTransitions["REMOVE_FILTER"]
    };
    transSet = transSet.concat(filterTransitionSet(s, d, filterTransitions));
    return transSet;
}
exports.transformTransitionSet = transformTransitionSet;
function transformBasic(s, d, channel, transform, transformTransitions, transOptions) {
    var sHas = false;
    var dHas = false;
    var transistion;
    var sTransform, dTransform;
    if (s.encoding[channel] && s.encoding[channel][transform.toLowerCase()]) {
        sHas = true;
        sTransform = s.encoding[channel][transform.toLowerCase()];
    }
    if (d.encoding[channel] && d.encoding[channel][transform.toLowerCase()]) {
        dHas = true;
        dTransform = d.encoding[channel][transform.toLowerCase()];
    }
    if (transOptions && transOptions.omitIncludeRawDomain && transform === "SCALE") {
        if (sTransform && sTransform.includeRawDomain) {
            delete sTransform.includeRawDomain;
            if (Object.keys(sTransform).length === 0 && JSON.stringify(sTransform) === JSON.stringify({})) {
                sHas = false;
            }
        }
        if (dTransform && dTransform.includeRawDomain) {
            delete dTransform.includeRawDomain;
            if (Object.keys(dTransform).length === 0 && JSON.stringify(dTransform) === JSON.stringify({})) {
                dHas = false;
            }
        }
    }
    if (sHas && dHas && (!util.rawEqual(sTransform, dTransform))) {
        transistion = util.duplicate(transformTransitions[transform]);
        transistion.detail = { "type": "modified", "channel": channel };
        return transistion;
    }
    else if (sHas && !dHas) {
        transistion = util.duplicate(transformTransitions[transform]);
        transistion.detail = { "type": "removed", "channel": channel };
        return transistion;
    }
    else if (!sHas && dHas) {
        transistion = util.duplicate(transformTransitions[transform]);
        transistion.detail = { "type": "added", "channel": channel };
        return transistion;
    }
}
exports.transformBasic = transformBasic;
function filterTransitionSet(s, d, filterTransitions) {
    var sFilters = [], dFilters = [];
    var transitions = [];
    if (s.transform && s.transform.filter) {
        sFilters = filters(s.transform.filter);
    }
    if (d.transform && d.transform.filter) {
        dFilters = filters(d.transform.filter);
    }
    var dOnly = util.arrayDiff(dFilters, sFilters);
    var sOnly = util.arrayDiff(sFilters, dFilters);
    if (sFilters.length === 0 && dFilters.length === 0) {
        return transitions;
    }
    var isFind = false;
    for (var i = 0; i < dOnly.length; i++) {
        for (var j = 0; j < sOnly.length; j++) {
            if (util.rawEqual(dOnly[i].field, sOnly[j].field)) {
                var newTr = util.duplicate(filterTransitions["MODIFY_FILTER"]);
                newTr.detail = { field: sOnly[j].field };
                if (sOnly[j].op !== dOnly[j].op) {
                    newTr.detail.op = sOnly[j].op + ', ' + dOnly[j].op;
                }
                if (sOnly[j].value !== dOnly[j].value) {
                    newTr.detail.value = sOnly[j].value + ', ' + dOnly[j].value;
                }
                transitions.push(newTr);
                dOnly.splice(i, 1);
                sOnly.splice(j, 1);
                isFind = true;
                break;
            }
        }
        if (isFind) {
            isFind = false;
            i--;
            continue;
        }
    }
    for (var i = 0; i < dOnly.length; i++) {
        var newTr = util.duplicate(filterTransitions["ADD_FILTER"]);
        newTr.detail = util.duplicate(dOnly[i]);
        transitions.push(newTr);
    }
    for (var i = 0; i < sOnly.length; i++) {
        var newTr = util.duplicate(filterTransitions["REMOVE_FILTER"]);
        newTr.detail = util.duplicate(sOnly[i]);
        transitions.push(newTr);
    }
    return transitions;
}
exports.filterTransitionSet = filterTransitionSet;
function filters(filterExpression) {
    var filters = [];
    if (util.isArray(filterExpression)) {
        filterExpression.map(function (filter) {
            if (util.isString(filter)) {
                filters = filters.concat(stringFilter(filter));
            }
            else if (filter_1.isRangeFilter(filter)) {
                filters.push({ "field": filter.field, "op": 'range', "value": JSON.stringify(filter.range) });
            }
            else if (filter_1.isInFilter(filter)) {
                filters.push({ "field": filter.field, "op": 'in', "value": JSON.stringify(filter.in) });
            }
            else if (filter_1.isEqualFilter(filter)) {
                filters.push({ "field": filter.field, "op": 'equal', "value": filter.equal.toString() });
            }
            else {
                console.log("WARN: cannot parse filters.");
            }
        });
    }
    else {
        var filter = filterExpression;
        if (util.isString(filter)) {
            filters = filters.concat(stringFilter(filter));
        }
        else if (filter_1.isRangeFilter(filter)) {
            filters.push({ "field": filter.field, "op": 'range', "value": JSON.stringify(filter.range) });
        }
        else if (filter_1.isInFilter(filter)) {
            filters.push({ "field": filter.field, "op": 'in', "value": JSON.stringify(filter.in) });
        }
        else if (filter_1.isEqualFilter(filter)) {
            filters.push({ "field": filter.field, "op": 'equal', "value": filter.equal.toString() });
        }
        else {
            console.log("WARN: cannot parse filters.");
        }
    }
    return filters;
    function stringFilter(expression) {
        var parser = expr["parse"];
        var expressionTree = parser(expression);
        return binaryExprsFromExprTree(expressionTree.body[0].expression, [], 0).map(function (bExpr) {
            return { "field": bExpr.left.property.name, "op": bExpr.operator, "value": bExpr.right.raw };
        });
        function binaryExprsFromExprTree(tree, arr, depth) {
            if (tree.operator === '||' || tree.operator === '&&') {
                arr = binaryExprsFromExprTree(tree.left, arr, depth + 1);
                arr = binaryExprsFromExprTree(tree.right, arr, depth + 1);
            }
            else if (['==', '===', '!==', '!=', '<', '<=', '>', '>='].indexOf(tree.operator) >= 0) {
                tree.depth = depth;
                arr.push(tree);
            }
            return arr;
        }
    }
}
exports.filters = filters;
function transformSettype(s, d, channel, transformTransitions) {
    var transistion;
    if (s.encoding[channel] && d.encoding[channel]
        && (d.encoding[channel]["field"] === s.encoding[channel]["field"])
        && (d.encoding[channel]["type"] !== s.encoding[channel]["type"])) {
        transistion = util.duplicate(transformTransitions["SETTYPE"]);
        transistion.detail = {
            "type": s.encoding[channel]["type"] + "_" + d.encoding[channel]["type"],
            "channel": channel
        };
        return transistion;
    }
}
exports.transformSettype = transformSettype;
function encodingTransitionSet(s, d, importedEncodingTransitions) {
    if (nb.sameEncoding(s.encoding, d.encoding)) {
        return [];
    }
    var sChannels = util.keys(s.encoding);
    var sFields = sChannels.map(function (key) {
        return s.encoding[key];
    });
    var dChannels = util.keys(d.encoding);
    var dFields = dChannels.map(function (key) {
        return d.encoding[key];
    });
    var additionalFields = util.unionObjectArray(dFields, sFields, function (field) { return field.field + "_" + field.type; });
    var additionalChannels = util.arrayDiff(dChannels, sChannels);
    var u;
    function nearestNode(nodes) {
        var minD = Infinity;
        var argMinD = -1;
        nodes.forEach(function (node, index) {
            if (node.distance < minD) {
                minD = node.distance;
                argMinD = index;
            }
        });
        return nodes.splice(argMinD, 1)[0];
    }
    var nodes = nb.neighbors(s, additionalFields, additionalChannels, importedEncodingTransitions)
        .map(function (neighbor) {
        neighbor.distance = neighbor.transition.cost,
            neighbor.prev = [s];
        return neighbor;
    });
    s.distance = 0;
    s.prev = [];
    var doneNodes = [s];
    while (nodes.length > 0) {
        u = nearestNode(nodes);
        if (nb.sameEncoding(u.encoding, d.encoding)) {
            break;
        }
        if (u.distance >= importedEncodingTransitions.ceiling.cost) {
            return [{ name: 'OVER_THE_CEILING', cost: importedEncodingTransitions.ceiling.alternatingCost }];
        }
        var newNodes = nb.neighbors(u, u.additionalFields, u.additionalChannels, importedEncodingTransitions);
        newNodes.forEach(function (newNode) {
            var node;
            for (var i = 0; i < doneNodes.length; i += 1) {
                if (nb.sameEncoding(doneNodes[i].encoding, newNode.encoding)) {
                    return;
                }
            }
            for (var i = 0; i < nodes.length; i += 1) {
                if (nb.sameEncoding(nodes[i].encoding, newNode.encoding)) {
                    node = nodes[i];
                    break;
                }
            }
            if (node) {
                if (node.distance > u.distance + newNode.transition.cost) {
                    node.distance = u.distance + newNode.transition.cost;
                    node.transition = newNode.transition;
                    node.prev = u.prev.concat([u]);
                }
            }
            else {
                newNode.distance = u.distance + newNode.transition.cost;
                newNode.prev = u.prev.concat([u]);
                nodes.push(newNode);
            }
        });
        doneNodes.push(u);
    }
    if (!nb.sameEncoding(u.encoding, d.encoding) && nodes.length === 0) {
        return [{ name: "UNREACHABLE", cost: 999 }];
    }
    var result = u.prev.map(function (node) {
        return node.transition;
    }).filter(function (transition) { return transition; });
    result.push(u.transition);
    return result;
}
exports.encodingTransitionSet = encodingTransitionSet;

},{"../util":20,"./def":17,"./neighbor":18,"vega-expression":5,"vega-lite/src/channel":31,"vega-lite/src/filter":35,"vega-lite/src/type":40}],20:[function(require,module,exports){
"use strict";
exports.isArray = Array.isArray || function (obj) {
    return {}.toString.call(obj) === '[object Array]';
};
function isString(item) {
    return typeof item === 'string' || item instanceof String;
}
exports.isString = isString;
function isin(item, array) {
    return array.indexOf(item) !== -1;
}
exports.isin = isin;
;
function json(s, sp) {
    return JSON.stringify(s, null, sp);
}
exports.json = json;
;
function keys(obj) {
    var k = [], x;
    for (x in obj) {
        k.push(x);
    }
    return k;
}
exports.keys = keys;
;
function duplicate(obj) {
    return JSON.parse(JSON.stringify(obj));
}
exports.duplicate = duplicate;
;
function forEach(obj, f, thisArg) {
    if (obj.forEach) {
        obj.forEach.call(thisArg, f);
    }
    else {
        for (var k in obj) {
            f.call(thisArg, obj[k], k, obj);
        }
    }
}
exports.forEach = forEach;
;
function any(arr, f) {
    var i = 0, k;
    for (k in arr) {
        if (f(arr[k], k, i++)) {
            return true;
        }
    }
    return false;
}
exports.any = any;
;
function nestedMap(collection, f, level, filter) {
    return level === 0 ?
        collection.map(f) :
        collection.map(function (v) {
            var r = nestedMap(v, f, level - 1);
            return filter ? r.filter(nonEmpty) : r;
        });
}
exports.nestedMap = nestedMap;
;
function nestedReduce(collection, f, level, filter) {
    return level === 0 ?
        collection.reduce(f, []) :
        collection.map(function (v) {
            var r = nestedReduce(v, f, level - 1);
            return filter ? r.filter(nonEmpty) : r;
        });
}
exports.nestedReduce = nestedReduce;
;
function nonEmpty(grp) {
    return !exports.isArray(grp) || grp.length > 0;
}
exports.nonEmpty = nonEmpty;
;
function traverse(node, arr) {
    if (node.value !== undefined) {
        arr.push(node.value);
    }
    else {
        if (node.left) {
            traverse(node.left, arr);
        }
        if (node.right) {
            traverse(node.right, arr);
        }
    }
    return arr;
}
exports.traverse = traverse;
;
function extend(obj, b) {
    var rest = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        rest[_i - 2] = arguments[_i];
    }
    for (var x, name, i = 1, len = arguments.length; i < len; ++i) {
        x = arguments[i];
        for (name in x) {
            obj[name] = x[name];
        }
    }
    return obj;
}
exports.extend = extend;
;
function union(a, b) {
    var o = {};
    a.forEach(function (x) { o[x] = true; });
    b.forEach(function (x) { o[x] = true; });
    return keys(o);
}
exports.union = union;
;
var gen;
(function (gen) {
    function getOpt(opt) {
        return (opt ? keys(opt) : []).reduce(function (c, k) {
            c[k] = opt[k];
            return c;
        }, Object.create({}));
    }
    gen.getOpt = getOpt;
    ;
})(gen = exports.gen || (exports.gen = {}));
function powerset(list) {
    var ps = [
        []
    ];
    for (var i = 0; i < list.length; i++) {
        for (var j = 0, len = ps.length; j < len; j++) {
            ps.push(ps[j].concat(list[i]));
        }
    }
    return ps;
}
exports.powerset = powerset;
;
function chooseKorLess(list, k) {
    var subset = [[]];
    for (var i = 0; i < list.length; i++) {
        for (var j = 0, len = subset.length; j < len; j++) {
            var sub = subset[j].concat(list[i]);
            if (sub.length <= k) {
                subset.push(sub);
            }
        }
    }
    return subset;
}
exports.chooseKorLess = chooseKorLess;
;
function chooseK(list, k) {
    var subset = [[]];
    var kArray = [];
    for (var i = 0; i < list.length; i++) {
        for (var j = 0, len = subset.length; j < len; j++) {
            var sub = subset[j].concat(list[i]);
            if (sub.length < k) {
                subset.push(sub);
            }
            else if (sub.length === k) {
                kArray.push(sub);
            }
        }
    }
    return kArray;
}
exports.chooseK = chooseK;
;
function cross(a, b) {
    var x = [];
    for (var i = 0; i < a.length; i++) {
        for (var j = 0; j < b.length; j++) {
            x.push(a[i].concat(b[j]));
        }
    }
    return x;
}
exports.cross = cross;
;
function find(array, f, obj) {
    for (var i = 0; i < array.length; i += 1) {
        if (f(obj) === f(array[i])) {
            return i;
        }
    }
    return -1;
}
exports.find = find;
function rawEqual(a, b) {
    return JSON.stringify(a) === JSON.stringify(b);
}
exports.rawEqual = rawEqual;
function arrayDiff(a, b, f) {
    return a.filter(function (x) {
        if (!f) {
            return find(b, JSON.stringify, x) < 0;
        }
        else
            return find(b, f, x) < 0;
    });
}
exports.arrayDiff = arrayDiff;
function unionObjectArray(a, b, f) {
    return arrayDiff(a, b, f).concat(b);
}
exports.unionObjectArray = unionObjectArray;

},{}],21:[function(require,module,exports){
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define('d3-time', ['exports'], factory) :
  factory((global.d3_time = {}));
}(this, function (exports) { 'use strict';

  var t0 = new Date;
  var t1 = new Date;
  function newInterval(floori, offseti, count, field) {

    function interval(date) {
      return floori(date = new Date(+date)), date;
    }

    interval.floor = interval;

    interval.round = function(date) {
      var d0 = new Date(+date),
          d1 = new Date(date - 1);
      floori(d0), floori(d1), offseti(d1, 1);
      return date - d0 < d1 - date ? d0 : d1;
    };

    interval.ceil = function(date) {
      return floori(date = new Date(date - 1)), offseti(date, 1), date;
    };

    interval.offset = function(date, step) {
      return offseti(date = new Date(+date), step == null ? 1 : Math.floor(step)), date;
    };

    interval.range = function(start, stop, step) {
      var range = [];
      start = new Date(start - 1);
      stop = new Date(+stop);
      step = step == null ? 1 : Math.floor(step);
      if (!(start < stop) || !(step > 0)) return range; // also handles Invalid Date
      offseti(start, 1), floori(start);
      if (start < stop) range.push(new Date(+start));
      while (offseti(start, step), floori(start), start < stop) range.push(new Date(+start));
      return range;
    };

    interval.filter = function(test) {
      return newInterval(function(date) {
        while (floori(date), !test(date)) date.setTime(date - 1);
      }, function(date, step) {
        while (--step >= 0) while (offseti(date, 1), !test(date));
      });
    };

    if (count) {
      interval.count = function(start, end) {
        t0.setTime(+start), t1.setTime(+end);
        floori(t0), floori(t1);
        return Math.floor(count(t0, t1));
      };

      interval.every = function(step) {
        step = Math.floor(step);
        return !isFinite(step) || !(step > 0) ? null
            : !(step > 1) ? interval
            : interval.filter(field
                ? function(d) { return field(d) % step === 0; }
                : function(d) { return interval.count(0, d) % step === 0; });
      };
    }

    return interval;
  };

  var millisecond = newInterval(function() {
    // noop
  }, function(date, step) {
    date.setTime(+date + step);
  }, function(start, end) {
    return end - start;
  });

  // An optimized implementation for this simple case.
  millisecond.every = function(k) {
    k = Math.floor(k);
    if (!isFinite(k) || !(k > 0)) return null;
    if (!(k > 1)) return millisecond;
    return newInterval(function(date) {
      date.setTime(Math.floor(date / k) * k);
    }, function(date, step) {
      date.setTime(+date + step * k);
    }, function(start, end) {
      return (end - start) / k;
    });
  };

  var second = newInterval(function(date) {
    date.setMilliseconds(0);
  }, function(date, step) {
    date.setTime(+date + step * 1e3);
  }, function(start, end) {
    return (end - start) / 1e3;
  }, function(date) {
    return date.getSeconds();
  });

  var minute = newInterval(function(date) {
    date.setSeconds(0, 0);
  }, function(date, step) {
    date.setTime(+date + step * 6e4);
  }, function(start, end) {
    return (end - start) / 6e4;
  }, function(date) {
    return date.getMinutes();
  });

  var hour = newInterval(function(date) {
    date.setMinutes(0, 0, 0);
  }, function(date, step) {
    date.setTime(+date + step * 36e5);
  }, function(start, end) {
    return (end - start) / 36e5;
  }, function(date) {
    return date.getHours();
  });

  var day = newInterval(function(date) {
    date.setHours(0, 0, 0, 0);
  }, function(date, step) {
    date.setDate(date.getDate() + step);
  }, function(start, end) {
    return (end - start - (end.getTimezoneOffset() - start.getTimezoneOffset()) * 6e4) / 864e5;
  }, function(date) {
    return date.getDate() - 1;
  });

  function weekday(i) {
    return newInterval(function(date) {
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - (date.getDay() + 7 - i) % 7);
    }, function(date, step) {
      date.setDate(date.getDate() + step * 7);
    }, function(start, end) {
      return (end - start - (end.getTimezoneOffset() - start.getTimezoneOffset()) * 6e4) / 6048e5;
    });
  }

  var sunday = weekday(0);
  var monday = weekday(1);
  var tuesday = weekday(2);
  var wednesday = weekday(3);
  var thursday = weekday(4);
  var friday = weekday(5);
  var saturday = weekday(6);

  var month = newInterval(function(date) {
    date.setHours(0, 0, 0, 0);
    date.setDate(1);
  }, function(date, step) {
    date.setMonth(date.getMonth() + step);
  }, function(start, end) {
    return end.getMonth() - start.getMonth() + (end.getFullYear() - start.getFullYear()) * 12;
  }, function(date) {
    return date.getMonth();
  });

  var year = newInterval(function(date) {
    date.setHours(0, 0, 0, 0);
    date.setMonth(0, 1);
  }, function(date, step) {
    date.setFullYear(date.getFullYear() + step);
  }, function(start, end) {
    return end.getFullYear() - start.getFullYear();
  }, function(date) {
    return date.getFullYear();
  });

  var utcSecond = newInterval(function(date) {
    date.setUTCMilliseconds(0);
  }, function(date, step) {
    date.setTime(+date + step * 1e3);
  }, function(start, end) {
    return (end - start) / 1e3;
  }, function(date) {
    return date.getUTCSeconds();
  });

  var utcMinute = newInterval(function(date) {
    date.setUTCSeconds(0, 0);
  }, function(date, step) {
    date.setTime(+date + step * 6e4);
  }, function(start, end) {
    return (end - start) / 6e4;
  }, function(date) {
    return date.getUTCMinutes();
  });

  var utcHour = newInterval(function(date) {
    date.setUTCMinutes(0, 0, 0);
  }, function(date, step) {
    date.setTime(+date + step * 36e5);
  }, function(start, end) {
    return (end - start) / 36e5;
  }, function(date) {
    return date.getUTCHours();
  });

  var utcDay = newInterval(function(date) {
    date.setUTCHours(0, 0, 0, 0);
  }, function(date, step) {
    date.setUTCDate(date.getUTCDate() + step);
  }, function(start, end) {
    return (end - start) / 864e5;
  }, function(date) {
    return date.getUTCDate() - 1;
  });

  function utcWeekday(i) {
    return newInterval(function(date) {
      date.setUTCHours(0, 0, 0, 0);
      date.setUTCDate(date.getUTCDate() - (date.getUTCDay() + 7 - i) % 7);
    }, function(date, step) {
      date.setUTCDate(date.getUTCDate() + step * 7);
    }, function(start, end) {
      return (end - start) / 6048e5;
    });
  }

  var utcSunday = utcWeekday(0);
  var utcMonday = utcWeekday(1);
  var utcTuesday = utcWeekday(2);
  var utcWednesday = utcWeekday(3);
  var utcThursday = utcWeekday(4);
  var utcFriday = utcWeekday(5);
  var utcSaturday = utcWeekday(6);

  var utcMonth = newInterval(function(date) {
    date.setUTCHours(0, 0, 0, 0);
    date.setUTCDate(1);
  }, function(date, step) {
    date.setUTCMonth(date.getUTCMonth() + step);
  }, function(start, end) {
    return end.getUTCMonth() - start.getUTCMonth() + (end.getUTCFullYear() - start.getUTCFullYear()) * 12;
  }, function(date) {
    return date.getUTCMonth();
  });

  var utcYear = newInterval(function(date) {
    date.setUTCHours(0, 0, 0, 0);
    date.setUTCMonth(0, 1);
  }, function(date, step) {
    date.setUTCFullYear(date.getUTCFullYear() + step);
  }, function(start, end) {
    return end.getUTCFullYear() - start.getUTCFullYear();
  }, function(date) {
    return date.getUTCFullYear();
  });

  var milliseconds = millisecond.range;
  var seconds = second.range;
  var minutes = minute.range;
  var hours = hour.range;
  var days = day.range;
  var sundays = sunday.range;
  var mondays = monday.range;
  var tuesdays = tuesday.range;
  var wednesdays = wednesday.range;
  var thursdays = thursday.range;
  var fridays = friday.range;
  var saturdays = saturday.range;
  var weeks = sunday.range;
  var months = month.range;
  var years = year.range;

  var utcMillisecond = millisecond;
  var utcMilliseconds = milliseconds;
  var utcSeconds = utcSecond.range;
  var utcMinutes = utcMinute.range;
  var utcHours = utcHour.range;
  var utcDays = utcDay.range;
  var utcSundays = utcSunday.range;
  var utcMondays = utcMonday.range;
  var utcTuesdays = utcTuesday.range;
  var utcWednesdays = utcWednesday.range;
  var utcThursdays = utcThursday.range;
  var utcFridays = utcFriday.range;
  var utcSaturdays = utcSaturday.range;
  var utcWeeks = utcSunday.range;
  var utcMonths = utcMonth.range;
  var utcYears = utcYear.range;

  var version = "0.1.1";

  exports.version = version;
  exports.milliseconds = milliseconds;
  exports.seconds = seconds;
  exports.minutes = minutes;
  exports.hours = hours;
  exports.days = days;
  exports.sundays = sundays;
  exports.mondays = mondays;
  exports.tuesdays = tuesdays;
  exports.wednesdays = wednesdays;
  exports.thursdays = thursdays;
  exports.fridays = fridays;
  exports.saturdays = saturdays;
  exports.weeks = weeks;
  exports.months = months;
  exports.years = years;
  exports.utcMillisecond = utcMillisecond;
  exports.utcMilliseconds = utcMilliseconds;
  exports.utcSeconds = utcSeconds;
  exports.utcMinutes = utcMinutes;
  exports.utcHours = utcHours;
  exports.utcDays = utcDays;
  exports.utcSundays = utcSundays;
  exports.utcMondays = utcMondays;
  exports.utcTuesdays = utcTuesdays;
  exports.utcWednesdays = utcWednesdays;
  exports.utcThursdays = utcThursdays;
  exports.utcFridays = utcFridays;
  exports.utcSaturdays = utcSaturdays;
  exports.utcWeeks = utcWeeks;
  exports.utcMonths = utcMonths;
  exports.utcYears = utcYears;
  exports.millisecond = millisecond;
  exports.second = second;
  exports.minute = minute;
  exports.hour = hour;
  exports.day = day;
  exports.sunday = sunday;
  exports.monday = monday;
  exports.tuesday = tuesday;
  exports.wednesday = wednesday;
  exports.thursday = thursday;
  exports.friday = friday;
  exports.saturday = saturday;
  exports.week = sunday;
  exports.month = month;
  exports.year = year;
  exports.utcSecond = utcSecond;
  exports.utcMinute = utcMinute;
  exports.utcHour = utcHour;
  exports.utcDay = utcDay;
  exports.utcSunday = utcSunday;
  exports.utcMonday = utcMonday;
  exports.utcTuesday = utcTuesday;
  exports.utcWednesday = utcWednesday;
  exports.utcThursday = utcThursday;
  exports.utcFriday = utcFriday;
  exports.utcSaturday = utcSaturday;
  exports.utcWeek = utcSunday;
  exports.utcMonth = utcMonth;
  exports.utcYear = utcYear;
  exports.interval = newInterval;

}));
},{}],22:[function(require,module,exports){
var util = require('../util'),
    time = require('../time'),
    EPSILON = 1e-15;

function bins(opt) {
  if (!opt) { throw Error("Missing binning options."); }

  // determine range
  var maxb = opt.maxbins || 15,
      base = opt.base || 10,
      logb = Math.log(base),
      div = opt.div || [5, 2],
      min = opt.min,
      max = opt.max,
      span = max - min,
      step, level, minstep, precision, v, i, eps;

  if (opt.step) {
    // if step size is explicitly given, use that
    step = opt.step;
  } else if (opt.steps) {
    // if provided, limit choice to acceptable step sizes
    step = opt.steps[Math.min(
      opt.steps.length - 1,
      bisect(opt.steps, span/maxb, 0, opt.steps.length)
    )];
  } else {
    // else use span to determine step size
    level = Math.ceil(Math.log(maxb) / logb);
    minstep = opt.minstep || 0;
    step = Math.max(
      minstep,
      Math.pow(base, Math.round(Math.log(span) / logb) - level)
    );

    // increase step size if too many bins
    while (Math.ceil(span/step) > maxb) { step *= base; }

    // decrease step size if allowed
    for (i=0; i<div.length; ++i) {
      v = step / div[i];
      if (v >= minstep && span / v <= maxb) step = v;
    }
  }

  // update precision, min and max
  v = Math.log(step);
  precision = v >= 0 ? 0 : ~~(-v / logb) + 1;
  eps = Math.pow(base, -precision - 1);
  min = Math.min(min, Math.floor(min / step + eps) * step);
  max = Math.ceil(max / step) * step;

  return {
    start: min,
    stop:  max,
    step:  step,
    unit:  {precision: precision},
    value: value,
    index: index
  };
}

function bisect(a, x, lo, hi) {
  while (lo < hi) {
    var mid = lo + hi >>> 1;
    if (util.cmp(a[mid], x) < 0) { lo = mid + 1; }
    else { hi = mid; }
  }
  return lo;
}

function value(v) {
  return this.step * Math.floor(v / this.step + EPSILON);
}

function index(v) {
  return Math.floor((v - this.start) / this.step + EPSILON);
}

function date_value(v) {
  return this.unit.date(value.call(this, v));
}

function date_index(v) {
  return index.call(this, this.unit.unit(v));
}

bins.date = function(opt) {
  if (!opt) { throw Error("Missing date binning options."); }

  // find time step, then bin
  var units = opt.utc ? time.utc : time,
      dmin = opt.min,
      dmax = opt.max,
      maxb = opt.maxbins || 20,
      minb = opt.minbins || 4,
      span = (+dmax) - (+dmin),
      unit = opt.unit ? units[opt.unit] : units.find(span, minb, maxb),
      spec = bins({
        min:     unit.min != null ? unit.min : unit.unit(dmin),
        max:     unit.max != null ? unit.max : unit.unit(dmax),
        maxbins: maxb,
        minstep: unit.minstep,
        steps:   unit.step
      });

  spec.unit = unit;
  spec.index = date_index;
  if (!opt.raw) spec.value = date_value;
  return spec;
};

module.exports = bins;

},{"../time":24,"../util":25}],23:[function(require,module,exports){
var util = require('./util'),
    gen = module.exports;

gen.repeat = function(val, n) {
  var a = Array(n), i;
  for (i=0; i<n; ++i) a[i] = val;
  return a;
};

gen.zeros = function(n) {
  return gen.repeat(0, n);
};

gen.range = function(start, stop, step) {
  if (arguments.length < 3) {
    step = 1;
    if (arguments.length < 2) {
      stop = start;
      start = 0;
    }
  }
  if ((stop - start) / step == Infinity) throw new Error('Infinite range');
  var range = [], i = -1, j;
  if (step < 0) while ((j = start + step * ++i) > stop) range.push(j);
  else while ((j = start + step * ++i) < stop) range.push(j);
  return range;
};

gen.random = {};

gen.random.uniform = function(min, max) {
  if (max === undefined) {
    max = min === undefined ? 1 : min;
    min = 0;
  }
  var d = max - min;
  var f = function() {
    return min + d * Math.random();
  };
  f.samples = function(n) {
    return gen.zeros(n).map(f);
  };
  f.pdf = function(x) {
    return (x >= min && x <= max) ? 1/d : 0;
  };
  f.cdf = function(x) {
    return x < min ? 0 : x > max ? 1 : (x - min) / d;
  };
  f.icdf = function(p) {
    return (p >= 0 && p <= 1) ? min + p*d : NaN;
  };
  return f;
};

gen.random.integer = function(a, b) {
  if (b === undefined) {
    b = a;
    a = 0;
  }
  var d = b - a;
  var f = function() {
    return a + Math.floor(d * Math.random());
  };
  f.samples = function(n) {
    return gen.zeros(n).map(f);
  };
  f.pdf = function(x) {
    return (x === Math.floor(x) && x >= a && x < b) ? 1/d : 0;
  };
  f.cdf = function(x) {
    var v = Math.floor(x);
    return v < a ? 0 : v >= b ? 1 : (v - a + 1) / d;
  };
  f.icdf = function(p) {
    return (p >= 0 && p <= 1) ? a - 1 + Math.floor(p*d) : NaN;
  };
  return f;
};

gen.random.normal = function(mean, stdev) {
  mean = mean || 0;
  stdev = stdev || 1;
  var next;
  var f = function() {
    var x = 0, y = 0, rds, c;
    if (next !== undefined) {
      x = next;
      next = undefined;
      return x;
    }
    do {
      x = Math.random()*2-1;
      y = Math.random()*2-1;
      rds = x*x + y*y;
    } while (rds === 0 || rds > 1);
    c = Math.sqrt(-2*Math.log(rds)/rds); // Box-Muller transform
    next = mean + y*c*stdev;
    return mean + x*c*stdev;
  };
  f.samples = function(n) {
    return gen.zeros(n).map(f);
  };
  f.pdf = function(x) {
    var exp = Math.exp(Math.pow(x-mean, 2) / (-2 * Math.pow(stdev, 2)));
    return (1 / (stdev * Math.sqrt(2*Math.PI))) * exp;
  };
  f.cdf = function(x) {
    // Approximation from West (2009)
    // Better Approximations to Cumulative Normal Functions
    var cd,
        z = (x - mean) / stdev,
        Z = Math.abs(z);
    if (Z > 37) {
      cd = 0;
    } else {
      var sum, exp = Math.exp(-Z*Z/2);
      if (Z < 7.07106781186547) {
        sum = 3.52624965998911e-02 * Z + 0.700383064443688;
        sum = sum * Z + 6.37396220353165;
        sum = sum * Z + 33.912866078383;
        sum = sum * Z + 112.079291497871;
        sum = sum * Z + 221.213596169931;
        sum = sum * Z + 220.206867912376;
        cd = exp * sum;
        sum = 8.83883476483184e-02 * Z + 1.75566716318264;
        sum = sum * Z + 16.064177579207;
        sum = sum * Z + 86.7807322029461;
        sum = sum * Z + 296.564248779674;
        sum = sum * Z + 637.333633378831;
        sum = sum * Z + 793.826512519948;
        sum = sum * Z + 440.413735824752;
        cd = cd / sum;
      } else {
        sum = Z + 0.65;
        sum = Z + 4 / sum;
        sum = Z + 3 / sum;
        sum = Z + 2 / sum;
        sum = Z + 1 / sum;
        cd = exp / sum / 2.506628274631;
      }
    }
    return z > 0 ? 1 - cd : cd;
  };
  f.icdf = function(p) {
    // Approximation of Probit function using inverse error function.
    if (p <= 0 || p >= 1) return NaN;
    var x = 2*p - 1,
        v = (8 * (Math.PI - 3)) / (3 * Math.PI * (4-Math.PI)),
        a = (2 / (Math.PI*v)) + (Math.log(1 - Math.pow(x,2)) / 2),
        b = Math.log(1 - (x*x)) / v,
        s = (x > 0 ? 1 : -1) * Math.sqrt(Math.sqrt((a*a) - b) - a);
    return mean + stdev * Math.SQRT2 * s;
  };
  return f;
};

gen.random.bootstrap = function(domain, smooth) {
  // Generates a bootstrap sample from a set of observations.
  // Smooth bootstrapping adds random zero-centered noise to the samples.
  var val = domain.filter(util.isValid),
      len = val.length,
      err = smooth ? gen.random.normal(0, smooth) : null;
  var f = function() {
    return val[~~(Math.random()*len)] + (err ? err() : 0);
  };
  f.samples = function(n) {
    return gen.zeros(n).map(f);
  };
  return f;
};
},{"./util":25}],24:[function(require,module,exports){
var d3_time = require('d3-time');

var tempDate = new Date(),
    baseDate = new Date(0, 0, 1).setFullYear(0), // Jan 1, 0 AD
    utcBaseDate = new Date(Date.UTC(0, 0, 1)).setUTCFullYear(0);

function date(d) {
  return (tempDate.setTime(+d), tempDate);
}

// create a time unit entry
function entry(type, date, unit, step, min, max) {
  var e = {
    type: type,
    date: date,
    unit: unit
  };
  if (step) {
    e.step = step;
  } else {
    e.minstep = 1;
  }
  if (min != null) e.min = min;
  if (max != null) e.max = max;
  return e;
}

function create(type, unit, base, step, min, max) {
  return entry(type,
    function(d) { return unit.offset(base, d); },
    function(d) { return unit.count(base, d); },
    step, min, max);
}

var locale = [
  create('second', d3_time.second, baseDate),
  create('minute', d3_time.minute, baseDate),
  create('hour',   d3_time.hour,   baseDate),
  create('day',    d3_time.day,    baseDate, [1, 7]),
  create('month',  d3_time.month,  baseDate, [1, 3, 6]),
  create('year',   d3_time.year,   baseDate),

  // periodic units
  entry('seconds',
    function(d) { return new Date(1970, 0, 1, 0, 0, d); },
    function(d) { return date(d).getSeconds(); },
    null, 0, 59
  ),
  entry('minutes',
    function(d) { return new Date(1970, 0, 1, 0, d); },
    function(d) { return date(d).getMinutes(); },
    null, 0, 59
  ),
  entry('hours',
    function(d) { return new Date(1970, 0, 1, d); },
    function(d) { return date(d).getHours(); },
    null, 0, 23
  ),
  entry('weekdays',
    function(d) { return new Date(1970, 0, 4+d); },
    function(d) { return date(d).getDay(); },
    [1], 0, 6
  ),
  entry('dates',
    function(d) { return new Date(1970, 0, d); },
    function(d) { return date(d).getDate(); },
    [1], 1, 31
  ),
  entry('months',
    function(d) { return new Date(1970, d % 12, 1); },
    function(d) { return date(d).getMonth(); },
    [1], 0, 11
  )
];

var utc = [
  create('second', d3_time.utcSecond, utcBaseDate),
  create('minute', d3_time.utcMinute, utcBaseDate),
  create('hour',   d3_time.utcHour,   utcBaseDate),
  create('day',    d3_time.utcDay,    utcBaseDate, [1, 7]),
  create('month',  d3_time.utcMonth,  utcBaseDate, [1, 3, 6]),
  create('year',   d3_time.utcYear,   utcBaseDate),

  // periodic units
  entry('seconds',
    function(d) { return new Date(Date.UTC(1970, 0, 1, 0, 0, d)); },
    function(d) { return date(d).getUTCSeconds(); },
    null, 0, 59
  ),
  entry('minutes',
    function(d) { return new Date(Date.UTC(1970, 0, 1, 0, d)); },
    function(d) { return date(d).getUTCMinutes(); },
    null, 0, 59
  ),
  entry('hours',
    function(d) { return new Date(Date.UTC(1970, 0, 1, d)); },
    function(d) { return date(d).getUTCHours(); },
    null, 0, 23
  ),
  entry('weekdays',
    function(d) { return new Date(Date.UTC(1970, 0, 4+d)); },
    function(d) { return date(d).getUTCDay(); },
    [1], 0, 6
  ),
  entry('dates',
    function(d) { return new Date(Date.UTC(1970, 0, d)); },
    function(d) { return date(d).getUTCDate(); },
    [1], 1, 31
  ),
  entry('months',
    function(d) { return new Date(Date.UTC(1970, d % 12, 1)); },
    function(d) { return date(d).getUTCMonth(); },
    [1], 0, 11
  )
];

var STEPS = [
  [31536e6, 5],  // 1-year
  [7776e6, 4],   // 3-month
  [2592e6, 4],   // 1-month
  [12096e5, 3],  // 2-week
  [6048e5, 3],   // 1-week
  [1728e5, 3],   // 2-day
  [864e5, 3],    // 1-day
  [432e5, 2],    // 12-hour
  [216e5, 2],    // 6-hour
  [108e5, 2],    // 3-hour
  [36e5, 2],     // 1-hour
  [18e5, 1],     // 30-minute
  [9e5, 1],      // 15-minute
  [3e5, 1],      // 5-minute
  [6e4, 1],      // 1-minute
  [3e4, 0],      // 30-second
  [15e3, 0],     // 15-second
  [5e3, 0],      // 5-second
  [1e3, 0]       // 1-second
];

function find(units, span, minb, maxb) {
  var step = STEPS[0], i, n, bins;

  for (i=1, n=STEPS.length; i<n; ++i) {
    step = STEPS[i];
    if (span > step[0]) {
      bins = span / step[0];
      if (bins > maxb) {
        return units[STEPS[i-1][1]];
      }
      if (bins >= minb) {
        return units[step[1]];
      }
    }
  }
  return units[STEPS[n-1][1]];
}

function toUnitMap(units) {
  var map = {}, i, n;
  for (i=0, n=units.length; i<n; ++i) {
    map[units[i].type] = units[i];
  }
  map.find = function(span, minb, maxb) {
    return find(units, span, minb, maxb);
  };
  return map;
}

module.exports = toUnitMap(locale);
module.exports.utc = toUnitMap(utc);
},{"d3-time":21}],25:[function(require,module,exports){
(function (Buffer){
var u = module.exports;

// utility functions

var FNAME = '__name__';

u.namedfunc = function(name, f) { return (f[FNAME] = name, f); };

u.name = function(f) { return f==null ? null : f[FNAME]; };

u.identity = function(x) { return x; };

u.true = u.namedfunc('true', function() { return true; });

u.false = u.namedfunc('false', function() { return false; });

u.duplicate = function(obj) {
  return JSON.parse(JSON.stringify(obj));
};

u.equal = function(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
};

u.extend = function(obj) {
  for (var x, name, i=1, len=arguments.length; i<len; ++i) {
    x = arguments[i];
    for (name in x) { obj[name] = x[name]; }
  }
  return obj;
};

u.length = function(x) {
  return x != null && x.length != null ? x.length : null;
};

u.keys = function(x) {
  var keys = [], k;
  for (k in x) keys.push(k);
  return keys;
};

u.vals = function(x) {
  var vals = [], k;
  for (k in x) vals.push(x[k]);
  return vals;
};

u.toMap = function(list, f) {
  return (f = u.$(f)) ?
    list.reduce(function(obj, x) { return (obj[f(x)] = 1, obj); }, {}) :
    list.reduce(function(obj, x) { return (obj[x] = 1, obj); }, {});
};

u.keystr = function(values) {
  // use to ensure consistent key generation across modules
  var n = values.length;
  if (!n) return '';
  for (var s=String(values[0]), i=1; i<n; ++i) {
    s += '|' + String(values[i]);
  }
  return s;
};

// type checking functions

var toString = Object.prototype.toString;

u.isObject = function(obj) {
  return obj === Object(obj);
};

u.isFunction = function(obj) {
  return toString.call(obj) === '[object Function]';
};

u.isString = function(obj) {
  return typeof value === 'string' || toString.call(obj) === '[object String]';
};

u.isArray = Array.isArray || function(obj) {
  return toString.call(obj) === '[object Array]';
};

u.isNumber = function(obj) {
  return typeof obj === 'number' || toString.call(obj) === '[object Number]';
};

u.isBoolean = function(obj) {
  return obj === true || obj === false || toString.call(obj) == '[object Boolean]';
};

u.isDate = function(obj) {
  return toString.call(obj) === '[object Date]';
};

u.isValid = function(obj) {
  return obj != null && obj === obj;
};

u.isBuffer = (typeof Buffer === 'function' && Buffer.isBuffer) || u.false;

// type coercion functions

u.number = function(s) {
  return s == null || s === '' ? null : +s;
};

u.boolean = function(s) {
  return s == null || s === '' ? null : s==='false' ? false : !!s;
};

// parse a date with optional d3.time-format format
u.date = function(s, format) {
  var d = format ? format : Date;
  return s == null || s === '' ? null : d.parse(s);
};

u.array = function(x) {
  return x != null ? (u.isArray(x) ? x : [x]) : [];
};

u.str = function(x) {
  return u.isArray(x) ? '[' + x.map(u.str) + ']'
    : u.isObject(x) || u.isString(x) ?
      // Output valid JSON and JS source strings.
      // See http://timelessrepo.com/json-isnt-a-javascript-subset
      JSON.stringify(x).replace('\u2028','\\u2028').replace('\u2029', '\\u2029')
    : x;
};

// data access functions

var field_re = /\[(.*?)\]|[^.\[]+/g;

u.field = function(f) {
  return String(f).match(field_re).map(function(d) {
    return d[0] !== '[' ? d :
      d[1] !== "'" && d[1] !== '"' ? d.slice(1, -1) :
      d.slice(2, -2).replace(/\\(["'])/g, '$1');
  });
};

u.accessor = function(f) {
  /* jshint evil: true */
  return f==null || u.isFunction(f) ? f :
    u.namedfunc(f, Function('x', 'return x[' + u.field(f).map(u.str).join('][') + '];'));
};

// short-cut for accessor
u.$ = u.accessor;

u.mutator = function(f) {
  var s;
  return u.isString(f) && (s=u.field(f)).length > 1 ?
    function(x, v) {
      for (var i=0; i<s.length-1; ++i) x = x[s[i]];
      x[s[i]] = v;
    } :
    function(x, v) { x[f] = v; };
};


u.$func = function(name, op) {
  return function(f) {
    f = u.$(f) || u.identity;
    var n = name + (u.name(f) ? '_'+u.name(f) : '');
    return u.namedfunc(n, function(d) { return op(f(d)); });
  };
};

u.$valid  = u.$func('valid', u.isValid);
u.$length = u.$func('length', u.length);

u.$in = function(f, values) {
  f = u.$(f);
  var map = u.isArray(values) ? u.toMap(values) : values;
  return function(d) { return !!map[f(d)]; };
};

// comparison / sorting functions

u.comparator = function(sort) {
  var sign = [];
  if (sort === undefined) sort = [];
  sort = u.array(sort).map(function(f) {
    var s = 1;
    if      (f[0] === '-') { s = -1; f = f.slice(1); }
    else if (f[0] === '+') { s = +1; f = f.slice(1); }
    sign.push(s);
    return u.accessor(f);
  });
  return function(a, b) {
    var i, n, f, c;
    for (i=0, n=sort.length; i<n; ++i) {
      f = sort[i];
      c = u.cmp(f(a), f(b));
      if (c) return c * sign[i];
    }
    return 0;
  };
};

u.cmp = function(a, b) {
  return (a < b || a == null) && b != null ? -1 :
    (a > b || b == null) && a != null ? 1 :
    ((b = b instanceof Date ? +b : b),
     (a = a instanceof Date ? +a : a)) !== a && b === b ? -1 :
    b !== b && a === a ? 1 : 0;
};

u.numcmp = function(a, b) { return a - b; };

u.stablesort = function(array, sortBy, keyFn) {
  var indices = array.reduce(function(idx, v, i) {
    return (idx[keyFn(v)] = i, idx);
  }, {});

  array.sort(function(a, b) {
    var sa = sortBy(a),
        sb = sortBy(b);
    return sa < sb ? -1 : sa > sb ? 1
         : (indices[keyFn(a)] - indices[keyFn(b)]);
  });

  return array;
};

// permutes an array using a Knuth shuffle
u.permute = function(a) {
  var m = a.length,
      swap,
      i;

  while (m) {
    i = Math.floor(Math.random() * m--);
    swap = a[m];
    a[m] = a[i];
    a[i] = swap;
  }
};

// string functions

u.pad = function(s, length, pos, padchar) {
  padchar = padchar || " ";
  var d = length - s.length;
  if (d <= 0) return s;
  switch (pos) {
    case 'left':
      return strrep(d, padchar) + s;
    case 'middle':
    case 'center':
      return strrep(Math.floor(d/2), padchar) +
         s + strrep(Math.ceil(d/2), padchar);
    default:
      return s + strrep(d, padchar);
  }
};

function strrep(n, str) {
  var s = "", i;
  for (i=0; i<n; ++i) s += str;
  return s;
}

u.truncate = function(s, length, pos, word, ellipsis) {
  var len = s.length;
  if (len <= length) return s;
  ellipsis = ellipsis !== undefined ? String(ellipsis) : '\u2026';
  var l = Math.max(0, length - ellipsis.length);

  switch (pos) {
    case 'left':
      return ellipsis + (word ? truncateOnWord(s,l,1) : s.slice(len-l));
    case 'middle':
    case 'center':
      var l1 = Math.ceil(l/2), l2 = Math.floor(l/2);
      return (word ? truncateOnWord(s,l1) : s.slice(0,l1)) +
        ellipsis + (word ? truncateOnWord(s,l2,1) : s.slice(len-l2));
    default:
      return (word ? truncateOnWord(s,l) : s.slice(0,l)) + ellipsis;
  }
};

function truncateOnWord(s, len, rev) {
  var cnt = 0, tok = s.split(truncate_word_re);
  if (rev) {
    s = (tok = tok.reverse())
      .filter(function(w) { cnt += w.length; return cnt <= len; })
      .reverse();
  } else {
    s = tok.filter(function(w) { cnt += w.length; return cnt <= len; });
  }
  return s.length ? s.join('').trim() : tok[0].slice(0, len);
}

var truncate_word_re = /([\u0009\u000A\u000B\u000C\u000D\u0020\u00A0\u1680\u180E\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u2028\u2029\u3000\uFEFF])/;

}).call(this,require("buffer").Buffer)

},{"buffer":1}],26:[function(require,module,exports){
var json = typeof JSON !== 'undefined' ? JSON : require('jsonify');

module.exports = function (obj, opts) {
    if (!opts) opts = {};
    if (typeof opts === 'function') opts = { cmp: opts };
    var space = opts.space || '';
    if (typeof space === 'number') space = Array(space+1).join(' ');
    var cycles = (typeof opts.cycles === 'boolean') ? opts.cycles : false;
    var replacer = opts.replacer || function(key, value) { return value; };

    var cmp = opts.cmp && (function (f) {
        return function (node) {
            return function (a, b) {
                var aobj = { key: a, value: node[a] };
                var bobj = { key: b, value: node[b] };
                return f(aobj, bobj);
            };
        };
    })(opts.cmp);

    var seen = [];
    return (function stringify (parent, key, node, level) {
        var indent = space ? ('\n' + new Array(level + 1).join(space)) : '';
        var colonSeparator = space ? ': ' : ':';

        if (node && node.toJSON && typeof node.toJSON === 'function') {
            node = node.toJSON();
        }

        node = replacer.call(parent, key, node);

        if (node === undefined) {
            return;
        }
        if (typeof node !== 'object' || node === null) {
            return json.stringify(node);
        }
        if (isArray(node)) {
            var out = [];
            for (var i = 0; i < node.length; i++) {
                var item = stringify(node, i, node[i], level+1) || json.stringify(null);
                out.push(indent + space + item);
            }
            return '[' + out.join(',') + indent + ']';
        }
        else {
            if (seen.indexOf(node) !== -1) {
                if (cycles) return json.stringify('__cycle__');
                throw new TypeError('Converting circular structure to JSON');
            }
            else seen.push(node);

            var keys = objectKeys(node).sort(cmp && cmp(node));
            var out = [];
            for (var i = 0; i < keys.length; i++) {
                var key = keys[i];
                var value = stringify(node, key, node[key], level+1);

                if(!value) continue;

                var keyValue = json.stringify(key)
                    + colonSeparator
                    + value;
                ;
                out.push(indent + space + keyValue);
            }
            seen.splice(seen.indexOf(node), 1);
            return '{' + out.join(',') + indent + '}';
        }
    })({ '': obj }, '', obj, 0);
};

var isArray = Array.isArray || function (x) {
    return {}.toString.call(x) === '[object Array]';
};

var objectKeys = Object.keys || function (obj) {
    var has = Object.prototype.hasOwnProperty || function () { return true };
    var keys = [];
    for (var key in obj) {
        if (has.call(obj, key)) keys.push(key);
    }
    return keys;
};

},{"jsonify":27}],27:[function(require,module,exports){
exports.parse = require('./lib/parse');
exports.stringify = require('./lib/stringify');

},{"./lib/parse":28,"./lib/stringify":29}],28:[function(require,module,exports){
var at, // The index of the current character
    ch, // The current character
    escapee = {
        '"':  '"',
        '\\': '\\',
        '/':  '/',
        b:    '\b',
        f:    '\f',
        n:    '\n',
        r:    '\r',
        t:    '\t'
    },
    text,

    error = function (m) {
        // Call error when something is wrong.
        throw {
            name:    'SyntaxError',
            message: m,
            at:      at,
            text:    text
        };
    },
    
    next = function (c) {
        // If a c parameter is provided, verify that it matches the current character.
        if (c && c !== ch) {
            error("Expected '" + c + "' instead of '" + ch + "'");
        }
        
        // Get the next character. When there are no more characters,
        // return the empty string.
        
        ch = text.charAt(at);
        at += 1;
        return ch;
    },
    
    number = function () {
        // Parse a number value.
        var number,
            string = '';
        
        if (ch === '-') {
            string = '-';
            next('-');
        }
        while (ch >= '0' && ch <= '9') {
            string += ch;
            next();
        }
        if (ch === '.') {
            string += '.';
            while (next() && ch >= '0' && ch <= '9') {
                string += ch;
            }
        }
        if (ch === 'e' || ch === 'E') {
            string += ch;
            next();
            if (ch === '-' || ch === '+') {
                string += ch;
                next();
            }
            while (ch >= '0' && ch <= '9') {
                string += ch;
                next();
            }
        }
        number = +string;
        if (!isFinite(number)) {
            error("Bad number");
        } else {
            return number;
        }
    },
    
    string = function () {
        // Parse a string value.
        var hex,
            i,
            string = '',
            uffff;
        
        // When parsing for string values, we must look for " and \ characters.
        if (ch === '"') {
            while (next()) {
                if (ch === '"') {
                    next();
                    return string;
                } else if (ch === '\\') {
                    next();
                    if (ch === 'u') {
                        uffff = 0;
                        for (i = 0; i < 4; i += 1) {
                            hex = parseInt(next(), 16);
                            if (!isFinite(hex)) {
                                break;
                            }
                            uffff = uffff * 16 + hex;
                        }
                        string += String.fromCharCode(uffff);
                    } else if (typeof escapee[ch] === 'string') {
                        string += escapee[ch];
                    } else {
                        break;
                    }
                } else {
                    string += ch;
                }
            }
        }
        error("Bad string");
    },

    white = function () {

// Skip whitespace.

        while (ch && ch <= ' ') {
            next();
        }
    },

    word = function () {

// true, false, or null.

        switch (ch) {
        case 't':
            next('t');
            next('r');
            next('u');
            next('e');
            return true;
        case 'f':
            next('f');
            next('a');
            next('l');
            next('s');
            next('e');
            return false;
        case 'n':
            next('n');
            next('u');
            next('l');
            next('l');
            return null;
        }
        error("Unexpected '" + ch + "'");
    },

    value,  // Place holder for the value function.

    array = function () {

// Parse an array value.

        var array = [];

        if (ch === '[') {
            next('[');
            white();
            if (ch === ']') {
                next(']');
                return array;   // empty array
            }
            while (ch) {
                array.push(value());
                white();
                if (ch === ']') {
                    next(']');
                    return array;
                }
                next(',');
                white();
            }
        }
        error("Bad array");
    },

    object = function () {

// Parse an object value.

        var key,
            object = {};

        if (ch === '{') {
            next('{');
            white();
            if (ch === '}') {
                next('}');
                return object;   // empty object
            }
            while (ch) {
                key = string();
                white();
                next(':');
                if (Object.hasOwnProperty.call(object, key)) {
                    error('Duplicate key "' + key + '"');
                }
                object[key] = value();
                white();
                if (ch === '}') {
                    next('}');
                    return object;
                }
                next(',');
                white();
            }
        }
        error("Bad object");
    };

value = function () {

// Parse a JSON value. It could be an object, an array, a string, a number,
// or a word.

    white();
    switch (ch) {
    case '{':
        return object();
    case '[':
        return array();
    case '"':
        return string();
    case '-':
        return number();
    default:
        return ch >= '0' && ch <= '9' ? number() : word();
    }
};

// Return the json_parse function. It will have access to all of the above
// functions and variables.

module.exports = function (source, reviver) {
    var result;
    
    text = source;
    at = 0;
    ch = ' ';
    result = value();
    white();
    if (ch) {
        error("Syntax error");
    }

    // If there is a reviver function, we recursively walk the new structure,
    // passing each name/value pair to the reviver function for possible
    // transformation, starting with a temporary root object that holds the result
    // in an empty key. If there is not a reviver function, we simply return the
    // result.

    return typeof reviver === 'function' ? (function walk(holder, key) {
        var k, v, value = holder[key];
        if (value && typeof value === 'object') {
            for (k in value) {
                if (Object.prototype.hasOwnProperty.call(value, k)) {
                    v = walk(value, k);
                    if (v !== undefined) {
                        value[k] = v;
                    } else {
                        delete value[k];
                    }
                }
            }
        }
        return reviver.call(holder, key, value);
    }({'': result}, '')) : result;
};

},{}],29:[function(require,module,exports){
var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
    escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
    gap,
    indent,
    meta = {    // table of character substitutions
        '\b': '\\b',
        '\t': '\\t',
        '\n': '\\n',
        '\f': '\\f',
        '\r': '\\r',
        '"' : '\\"',
        '\\': '\\\\'
    },
    rep;

function quote(string) {
    // If the string contains no control characters, no quote characters, and no
    // backslash characters, then we can safely slap some quotes around it.
    // Otherwise we must also replace the offending characters with safe escape
    // sequences.
    
    escapable.lastIndex = 0;
    return escapable.test(string) ? '"' + string.replace(escapable, function (a) {
        var c = meta[a];
        return typeof c === 'string' ? c :
            '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
    }) + '"' : '"' + string + '"';
}

function str(key, holder) {
    // Produce a string from holder[key].
    var i,          // The loop counter.
        k,          // The member key.
        v,          // The member value.
        length,
        mind = gap,
        partial,
        value = holder[key];
    
    // If the value has a toJSON method, call it to obtain a replacement value.
    if (value && typeof value === 'object' &&
            typeof value.toJSON === 'function') {
        value = value.toJSON(key);
    }
    
    // If we were called with a replacer function, then call the replacer to
    // obtain a replacement value.
    if (typeof rep === 'function') {
        value = rep.call(holder, key, value);
    }
    
    // What happens next depends on the value's type.
    switch (typeof value) {
        case 'string':
            return quote(value);
        
        case 'number':
            // JSON numbers must be finite. Encode non-finite numbers as null.
            return isFinite(value) ? String(value) : 'null';
        
        case 'boolean':
        case 'null':
            // If the value is a boolean or null, convert it to a string. Note:
            // typeof null does not produce 'null'. The case is included here in
            // the remote chance that this gets fixed someday.
            return String(value);
            
        case 'object':
            if (!value) return 'null';
            gap += indent;
            partial = [];
            
            // Array.isArray
            if (Object.prototype.toString.apply(value) === '[object Array]') {
                length = value.length;
                for (i = 0; i < length; i += 1) {
                    partial[i] = str(i, value) || 'null';
                }
                
                // Join all of the elements together, separated with commas, and
                // wrap them in brackets.
                v = partial.length === 0 ? '[]' : gap ?
                    '[\n' + gap + partial.join(',\n' + gap) + '\n' + mind + ']' :
                    '[' + partial.join(',') + ']';
                gap = mind;
                return v;
            }
            
            // If the replacer is an array, use it to select the members to be
            // stringified.
            if (rep && typeof rep === 'object') {
                length = rep.length;
                for (i = 0; i < length; i += 1) {
                    k = rep[i];
                    if (typeof k === 'string') {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            }
            else {
                // Otherwise, iterate through all of the keys in the object.
                for (k in value) {
                    if (Object.prototype.hasOwnProperty.call(value, k)) {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            }
            
        // Join all of the member texts together, separated with commas,
        // and wrap them in braces.

        v = partial.length === 0 ? '{}' : gap ?
            '{\n' + gap + partial.join(',\n' + gap) + '\n' + mind + '}' :
            '{' + partial.join(',') + '}';
        gap = mind;
        return v;
    }
}

module.exports = function (value, replacer, space) {
    var i;
    gap = '';
    indent = '';
    
    // If the space parameter is a number, make an indent string containing that
    // many spaces.
    if (typeof space === 'number') {
        for (i = 0; i < space; i += 1) {
            indent += ' ';
        }
    }
    // If the space parameter is a string, it will be used as the indent string.
    else if (typeof space === 'string') {
        indent = space;
    }

    // If there is a replacer, it must be a function or an array.
    // Otherwise, throw an error.
    rep = replacer;
    if (replacer && typeof replacer !== 'function'
    && (typeof replacer !== 'object' || typeof replacer.length !== 'number')) {
        throw new Error('JSON.stringify');
    }
    
    // Make a fake root object containing our value under the key of ''.
    // Return the result of stringifying the value.
    return str('', {'': value});
};

},{}],30:[function(require,module,exports){
"use strict";
(function (AggregateOp) {
    AggregateOp[AggregateOp["VALUES"] = 'values'] = "VALUES";
    AggregateOp[AggregateOp["COUNT"] = 'count'] = "COUNT";
    AggregateOp[AggregateOp["VALID"] = 'valid'] = "VALID";
    AggregateOp[AggregateOp["MISSING"] = 'missing'] = "MISSING";
    AggregateOp[AggregateOp["DISTINCT"] = 'distinct'] = "DISTINCT";
    AggregateOp[AggregateOp["SUM"] = 'sum'] = "SUM";
    AggregateOp[AggregateOp["MEAN"] = 'mean'] = "MEAN";
    AggregateOp[AggregateOp["AVERAGE"] = 'average'] = "AVERAGE";
    AggregateOp[AggregateOp["VARIANCE"] = 'variance'] = "VARIANCE";
    AggregateOp[AggregateOp["VARIANCEP"] = 'variancep'] = "VARIANCEP";
    AggregateOp[AggregateOp["STDEV"] = 'stdev'] = "STDEV";
    AggregateOp[AggregateOp["STDEVP"] = 'stdevp'] = "STDEVP";
    AggregateOp[AggregateOp["MEDIAN"] = 'median'] = "MEDIAN";
    AggregateOp[AggregateOp["Q1"] = 'q1'] = "Q1";
    AggregateOp[AggregateOp["Q3"] = 'q3'] = "Q3";
    AggregateOp[AggregateOp["MODESKEW"] = 'modeskew'] = "MODESKEW";
    AggregateOp[AggregateOp["MIN"] = 'min'] = "MIN";
    AggregateOp[AggregateOp["MAX"] = 'max'] = "MAX";
    AggregateOp[AggregateOp["ARGMIN"] = 'argmin'] = "ARGMIN";
    AggregateOp[AggregateOp["ARGMAX"] = 'argmax'] = "ARGMAX";
})(exports.AggregateOp || (exports.AggregateOp = {}));
var AggregateOp = exports.AggregateOp;
exports.AGGREGATE_OPS = [
    AggregateOp.VALUES,
    AggregateOp.COUNT,
    AggregateOp.VALID,
    AggregateOp.MISSING,
    AggregateOp.DISTINCT,
    AggregateOp.SUM,
    AggregateOp.MEAN,
    AggregateOp.AVERAGE,
    AggregateOp.VARIANCE,
    AggregateOp.VARIANCEP,
    AggregateOp.STDEV,
    AggregateOp.STDEVP,
    AggregateOp.MEDIAN,
    AggregateOp.Q1,
    AggregateOp.Q3,
    AggregateOp.MODESKEW,
    AggregateOp.MIN,
    AggregateOp.MAX,
    AggregateOp.ARGMIN,
    AggregateOp.ARGMAX,
];
exports.SUM_OPS = [
    AggregateOp.COUNT,
    AggregateOp.SUM,
    AggregateOp.DISTINCT
];
exports.SHARED_DOMAIN_OPS = [
    AggregateOp.MEAN,
    AggregateOp.AVERAGE,
    AggregateOp.STDEV,
    AggregateOp.STDEVP,
    AggregateOp.MEDIAN,
    AggregateOp.Q1,
    AggregateOp.Q3,
    AggregateOp.MIN,
    AggregateOp.MAX,
];

},{}],31:[function(require,module,exports){
"use strict";
var util_1 = require('./util');
(function (Channel) {
    Channel[Channel["X"] = 'x'] = "X";
    Channel[Channel["Y"] = 'y'] = "Y";
    Channel[Channel["X2"] = 'x2'] = "X2";
    Channel[Channel["Y2"] = 'y2'] = "Y2";
    Channel[Channel["ROW"] = 'row'] = "ROW";
    Channel[Channel["COLUMN"] = 'column'] = "COLUMN";
    Channel[Channel["SHAPE"] = 'shape'] = "SHAPE";
    Channel[Channel["SIZE"] = 'size'] = "SIZE";
    Channel[Channel["COLOR"] = 'color'] = "COLOR";
    Channel[Channel["TEXT"] = 'text'] = "TEXT";
    Channel[Channel["DETAIL"] = 'detail'] = "DETAIL";
    Channel[Channel["LABEL"] = 'label'] = "LABEL";
    Channel[Channel["PATH"] = 'path'] = "PATH";
    Channel[Channel["ORDER"] = 'order'] = "ORDER";
    Channel[Channel["OPACITY"] = 'opacity'] = "OPACITY";
})(exports.Channel || (exports.Channel = {}));
var Channel = exports.Channel;
exports.X = Channel.X;
exports.Y = Channel.Y;
exports.X2 = Channel.X2;
exports.Y2 = Channel.Y2;
exports.ROW = Channel.ROW;
exports.COLUMN = Channel.COLUMN;
exports.SHAPE = Channel.SHAPE;
exports.SIZE = Channel.SIZE;
exports.COLOR = Channel.COLOR;
exports.TEXT = Channel.TEXT;
exports.DETAIL = Channel.DETAIL;
exports.LABEL = Channel.LABEL;
exports.PATH = Channel.PATH;
exports.ORDER = Channel.ORDER;
exports.OPACITY = Channel.OPACITY;
exports.CHANNELS = [exports.X, exports.Y, exports.X2, exports.Y2, exports.ROW, exports.COLUMN, exports.SIZE, exports.SHAPE, exports.COLOR, exports.PATH, exports.ORDER, exports.OPACITY, exports.TEXT, exports.DETAIL, exports.LABEL];
exports.UNIT_CHANNELS = util_1.without(exports.CHANNELS, [exports.ROW, exports.COLUMN]);
exports.UNIT_SCALE_CHANNELS = util_1.without(exports.UNIT_CHANNELS, [exports.PATH, exports.ORDER, exports.DETAIL, exports.TEXT, exports.LABEL, exports.X2, exports.Y2]);
exports.NONSPATIAL_CHANNELS = util_1.without(exports.UNIT_CHANNELS, [exports.X, exports.Y, exports.X2, exports.Y2]);
exports.NONSPATIAL_SCALE_CHANNELS = util_1.without(exports.UNIT_SCALE_CHANNELS, [exports.X, exports.Y, exports.X2, exports.Y2]);
exports.STACK_GROUP_CHANNELS = [exports.COLOR, exports.DETAIL, exports.ORDER, exports.OPACITY, exports.SIZE];
;
function supportMark(channel, mark) {
    return !!getSupportedMark(channel)[mark];
}
exports.supportMark = supportMark;
function getSupportedMark(channel) {
    switch (channel) {
        case exports.X:
        case exports.Y:
        case exports.COLOR:
        case exports.DETAIL:
        case exports.ORDER:
        case exports.OPACITY:
        case exports.ROW:
        case exports.COLUMN:
            return {
                point: true, tick: true, rule: true, circle: true, square: true,
                bar: true, line: true, area: true, text: true
            };
        case exports.X2:
        case exports.Y2:
            return {
                rule: true, bar: true, area: true
            };
        case exports.SIZE:
            return {
                point: true, tick: true, rule: true, circle: true, square: true,
                bar: true, text: true
            };
        case exports.SHAPE:
            return { point: true };
        case exports.TEXT:
            return { text: true };
        case exports.PATH:
            return { line: true };
    }
    return {};
}
exports.getSupportedMark = getSupportedMark;
;
function getSupportedRole(channel) {
    switch (channel) {
        case exports.X:
        case exports.Y:
        case exports.COLOR:
        case exports.OPACITY:
        case exports.LABEL:
        case exports.DETAIL:
            return {
                measure: true,
                dimension: true
            };
        case exports.ROW:
        case exports.COLUMN:
        case exports.SHAPE:
            return {
                measure: false,
                dimension: true
            };
        case exports.X2:
        case exports.Y2:
        case exports.SIZE:
        case exports.TEXT:
            return {
                measure: true,
                dimension: false
            };
        case exports.PATH:
            return {
                measure: false,
                dimension: true
            };
    }
    throw new Error('Invalid encoding channel' + channel);
}
exports.getSupportedRole = getSupportedRole;
function hasScale(channel) {
    return !util_1.contains([exports.DETAIL, exports.PATH, exports.TEXT, exports.LABEL, exports.ORDER], channel);
}
exports.hasScale = hasScale;

},{"./util":41}],32:[function(require,module,exports){
"use strict";
var util_1 = require('./util');
function isDateTime(o) {
    return !!o.year || !!o.quarter || !!o.month || !!o.date || !!o.day ||
        !!o.hours || !!o.minutes || !!o.seconds || !!o.milliseconds;
}
exports.isDateTime = isDateTime;
exports.MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
exports.SHORT_MONTHS = exports.MONTHS.map(function (m) { return m.substr(0, 3); });
exports.DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
exports.SHORT_DAYS = exports.DAYS.map(function (d) { return d.substr(0, 3); });
function normalizeQuarter(q) {
    if (util_1.isNumber(q)) {
        return (q - 1) + '';
    }
    else {
        console.warn('Potentially invalid quarter', q);
        return q;
    }
}
function normalizeMonth(m) {
    if (util_1.isNumber(m)) {
        return (m - 1) + '';
    }
    else {
        var lowerM = m.toLowerCase();
        var monthIndex = exports.MONTHS.indexOf(lowerM);
        if (monthIndex !== -1) {
            return monthIndex + '';
        }
        var shortM = lowerM.substr(0, 3);
        var shortMonthIndex = exports.SHORT_MONTHS.indexOf(shortM);
        if (shortMonthIndex !== -1) {
            return shortMonthIndex + '';
        }
        console.warn('Potentially invalid month', m);
        return m;
    }
}
function normalizeDay(d) {
    if (util_1.isNumber(d)) {
        return (d % 7) + '';
    }
    else {
        var lowerD = d.toLowerCase();
        var dayIndex = exports.DAYS.indexOf(lowerD);
        if (dayIndex !== -1) {
            return dayIndex + '';
        }
        var shortD = lowerD.substr(0, 3);
        var shortDayIndex = exports.SHORT_DAYS.indexOf(shortD);
        if (shortDayIndex !== -1) {
            return shortDayIndex + '';
        }
        console.warn('Potentially invalid day', d);
        return d;
    }
}
function dateTimeExpr(d, normalize) {
    if (normalize === void 0) { normalize = false; }
    var units = [];
    if (normalize && d.day !== undefined) {
        for (var _i = 0, _a = ['year', 'quarter', 'month', 'date']; _i < _a.length; _i++) {
            var unit = _a[_i];
            if (d[unit] !== undefined) {
                console.warn('Dropping day from datetime', JSON.stringify(d), 'as day cannot be combined with', unit);
                d = util_1.duplicate(d);
                delete d.day;
                break;
            }
        }
    }
    if (d.year !== undefined) {
        units.push(d.year);
    }
    else if (d.day !== undefined) {
        units.push(2006);
    }
    else {
        units.push(0);
    }
    if (d.month !== undefined) {
        var month = normalize ? normalizeMonth(d.month) : d.month;
        units.push(month);
    }
    else if (d.quarter !== undefined) {
        var quarter = normalize ? normalizeQuarter(d.quarter) : d.quarter;
        units.push(quarter + '*3');
    }
    else {
        units.push(0);
    }
    if (d.date !== undefined) {
        units.push(d.date);
    }
    else if (d.day !== undefined) {
        var day = normalize ? normalizeDay(d.day) : d.day;
        units.push(day + '+1');
    }
    else {
        units.push(1);
    }
    for (var _b = 0, _c = ['hours', 'minutes', 'seconds', 'milliseconds']; _b < _c.length; _b++) {
        var timeUnit = _c[_b];
        if (d[timeUnit] !== undefined) {
            units.push(d[timeUnit]);
        }
        else {
            units.push(0);
        }
    }
    return 'datetime(' + units.join(', ') + ')';
}
exports.dateTimeExpr = dateTimeExpr;

},{"./util":41}],33:[function(require,module,exports){
"use strict";
var channel_1 = require('./channel');
var util_1 = require('./util');
function countRetinal(encoding) {
    var count = 0;
    if (encoding.color) {
        count++;
    }
    if (encoding.opacity) {
        count++;
    }
    if (encoding.size) {
        count++;
    }
    if (encoding.shape) {
        count++;
    }
    return count;
}
exports.countRetinal = countRetinal;
function channels(encoding) {
    return channel_1.CHANNELS.filter(function (channel) {
        return has(encoding, channel);
    });
}
exports.channels = channels;
function has(encoding, channel) {
    var channelEncoding = encoding && encoding[channel];
    return channelEncoding && (channelEncoding.field !== undefined ||
        (util_1.isArray(channelEncoding) && channelEncoding.length > 0));
}
exports.has = has;
function isAggregate(encoding) {
    return util_1.some(channel_1.CHANNELS, function (channel) {
        if (has(encoding, channel) && encoding[channel].aggregate) {
            return true;
        }
        return false;
    });
}
exports.isAggregate = isAggregate;
function isRanged(encoding) {
    return encoding && ((!!encoding.x && !!encoding.x2) || (!!encoding.y && !!encoding.y2));
}
exports.isRanged = isRanged;
function fieldDefs(encoding) {
    var arr = [];
    channel_1.CHANNELS.forEach(function (channel) {
        if (has(encoding, channel)) {
            if (util_1.isArray(encoding[channel])) {
                encoding[channel].forEach(function (fieldDef) {
                    arr.push(fieldDef);
                });
            }
            else {
                arr.push(encoding[channel]);
            }
        }
    });
    return arr;
}
exports.fieldDefs = fieldDefs;
;
function forEach(encoding, f, thisArg) {
    channelMappingForEach(channel_1.CHANNELS, encoding, f, thisArg);
}
exports.forEach = forEach;
function channelMappingForEach(channels, mapping, f, thisArg) {
    var i = 0;
    channels.forEach(function (channel) {
        if (has(mapping, channel)) {
            if (util_1.isArray(mapping[channel])) {
                mapping[channel].forEach(function (fieldDef) {
                    f.call(thisArg, fieldDef, channel, i++);
                });
            }
            else {
                f.call(thisArg, mapping[channel], channel, i++);
            }
        }
    });
}
exports.channelMappingForEach = channelMappingForEach;
function map(encoding, f, thisArg) {
    return channelMappingMap(channel_1.CHANNELS, encoding, f, thisArg);
}
exports.map = map;
function channelMappingMap(channels, mapping, f, thisArg) {
    var arr = [];
    channels.forEach(function (channel) {
        if (has(mapping, channel)) {
            if (util_1.isArray(mapping[channel])) {
                mapping[channel].forEach(function (fieldDef) {
                    arr.push(f.call(thisArg, fieldDef, channel));
                });
            }
            else {
                arr.push(f.call(thisArg, mapping[channel], channel));
            }
        }
    });
    return arr;
}
exports.channelMappingMap = channelMappingMap;
function reduce(encoding, f, init, thisArg) {
    return channelMappingReduce(channel_1.CHANNELS, encoding, f, init, thisArg);
}
exports.reduce = reduce;
function channelMappingReduce(channels, mapping, f, init, thisArg) {
    var r = init;
    channel_1.CHANNELS.forEach(function (channel) {
        if (has(mapping, channel)) {
            if (util_1.isArray(mapping[channel])) {
                mapping[channel].forEach(function (fieldDef) {
                    r = f.call(thisArg, r, fieldDef, channel);
                });
            }
            else {
                r = f.call(thisArg, r, mapping[channel], channel);
            }
        }
    });
    return r;
}
exports.channelMappingReduce = channelMappingReduce;

},{"./channel":31,"./util":41}],34:[function(require,module,exports){
"use strict";
var aggregate_1 = require('./aggregate');
var scale_1 = require('./scale');
var timeunit_1 = require('./timeunit');
var type_1 = require('./type');
var util_1 = require('./util');
exports.aggregate = {
    type: 'string',
    enum: aggregate_1.AGGREGATE_OPS,
    supportedEnums: {
        quantitative: aggregate_1.AGGREGATE_OPS,
        ordinal: ['median', 'min', 'max'],
        nominal: [],
        temporal: ['mean', 'median', 'min', 'max'],
        '': ['count']
    },
    supportedTypes: util_1.toMap([type_1.QUANTITATIVE, type_1.NOMINAL, type_1.ORDINAL, type_1.TEMPORAL, ''])
};
function field(fieldDef, opt) {
    if (opt === void 0) { opt = {}; }
    var prefix = (opt.datum ? 'datum.' : '') + (opt.prefn || '');
    var suffix = opt.suffix || '';
    var field = fieldDef.field;
    if (isCount(fieldDef)) {
        return prefix + 'count' + suffix;
    }
    else if (opt.fn) {
        return prefix + opt.fn + '_' + field + suffix;
    }
    else if (!opt.nofn && fieldDef.bin) {
        var binSuffix = opt.binSuffix || (opt.scaleType === scale_1.ScaleType.ORDINAL ?
            '_range' :
            '_start');
        return prefix + 'bin_' + field + binSuffix;
    }
    else if (!opt.nofn && !opt.noAggregate && fieldDef.aggregate) {
        return prefix + fieldDef.aggregate + '_' + field + suffix;
    }
    else if (!opt.nofn && fieldDef.timeUnit) {
        return prefix + fieldDef.timeUnit + '_' + field + suffix;
    }
    else {
        return prefix + field;
    }
}
exports.field = field;
function _isFieldDimension(fieldDef) {
    return util_1.contains([type_1.NOMINAL, type_1.ORDINAL], fieldDef.type) || !!fieldDef.bin ||
        (fieldDef.type === type_1.TEMPORAL && !!fieldDef.timeUnit);
}
function isDimension(fieldDef) {
    return fieldDef && fieldDef.field && _isFieldDimension(fieldDef);
}
exports.isDimension = isDimension;
function isMeasure(fieldDef) {
    return fieldDef && fieldDef.field && !_isFieldDimension(fieldDef);
}
exports.isMeasure = isMeasure;
function count() {
    return { field: '*', aggregate: aggregate_1.AggregateOp.COUNT, type: type_1.QUANTITATIVE };
}
exports.count = count;
function isCount(fieldDef) {
    return fieldDef.aggregate === aggregate_1.AggregateOp.COUNT;
}
exports.isCount = isCount;
function cardinality(fieldDef, stats, filterNull) {
    if (filterNull === void 0) { filterNull = {}; }
    var stat = stats[fieldDef.field], type = fieldDef.type;
    if (fieldDef.bin) {
        var bin_1 = fieldDef.bin;
        var maxbins = (typeof bin_1 === 'boolean') ? undefined : bin_1.maxbins;
        if (maxbins === undefined) {
            maxbins = 10;
        }
        var bins = util_1.getbins(stat, maxbins);
        return (bins.stop - bins.start) / bins.step;
    }
    if (type === type_1.TEMPORAL) {
        var timeUnit = fieldDef.timeUnit;
        switch (timeUnit) {
            case timeunit_1.TimeUnit.SECONDS: return 60;
            case timeunit_1.TimeUnit.MINUTES: return 60;
            case timeunit_1.TimeUnit.HOURS: return 24;
            case timeunit_1.TimeUnit.DAY: return 7;
            case timeunit_1.TimeUnit.DATE: return 31;
            case timeunit_1.TimeUnit.MONTH: return 12;
            case timeunit_1.TimeUnit.QUARTER: return 4;
            case timeunit_1.TimeUnit.YEAR:
                var yearstat = stats['year_' + fieldDef.field];
                if (!yearstat) {
                    return null;
                }
                return yearstat.distinct -
                    (stat.missing > 0 && filterNull[type] ? 1 : 0);
        }
    }
    if (fieldDef.aggregate) {
        return 1;
    }
    return stat.distinct -
        (stat.missing > 0 && filterNull[type] ? 1 : 0);
}
exports.cardinality = cardinality;
function title(fieldDef, config) {
    if (fieldDef.title != null) {
        return fieldDef.title;
    }
    if (isCount(fieldDef)) {
        return config.countTitle;
    }
    var fn = fieldDef.aggregate || fieldDef.timeUnit || (fieldDef.bin && 'bin');
    if (fn) {
        return fn.toString().toUpperCase() + '(' + fieldDef.field + ')';
    }
    else {
        return fieldDef.field;
    }
}
exports.title = title;

},{"./aggregate":30,"./scale":37,"./timeunit":39,"./type":40,"./util":41}],35:[function(require,module,exports){
"use strict";
var util_1 = require('./util');
function isEqualFilter(filter) {
    return filter && !!filter.field && filter.equal !== undefined;
}
exports.isEqualFilter = isEqualFilter;
function isRangeFilter(filter) {
    if (filter && !!filter.field) {
        if (util_1.isArray(filter.range) && filter.range.length === 2) {
            return true;
        }
    }
    return false;
}
exports.isRangeFilter = isRangeFilter;
function isInFilter(filter) {
    return filter && !!filter.field && util_1.isArray(filter.in);
}
exports.isInFilter = isInFilter;

},{"./util":41}],36:[function(require,module,exports){
"use strict";
(function (Mark) {
    Mark[Mark["AREA"] = 'area'] = "AREA";
    Mark[Mark["BAR"] = 'bar'] = "BAR";
    Mark[Mark["LINE"] = 'line'] = "LINE";
    Mark[Mark["POINT"] = 'point'] = "POINT";
    Mark[Mark["TEXT"] = 'text'] = "TEXT";
    Mark[Mark["TICK"] = 'tick'] = "TICK";
    Mark[Mark["RULE"] = 'rule'] = "RULE";
    Mark[Mark["CIRCLE"] = 'circle'] = "CIRCLE";
    Mark[Mark["SQUARE"] = 'square'] = "SQUARE";
    Mark[Mark["ERRORBAR"] = 'errorBar'] = "ERRORBAR";
})(exports.Mark || (exports.Mark = {}));
var Mark = exports.Mark;
exports.AREA = Mark.AREA;
exports.BAR = Mark.BAR;
exports.LINE = Mark.LINE;
exports.POINT = Mark.POINT;
exports.TEXT = Mark.TEXT;
exports.TICK = Mark.TICK;
exports.RULE = Mark.RULE;
exports.CIRCLE = Mark.CIRCLE;
exports.SQUARE = Mark.SQUARE;
exports.ERRORBAR = Mark.ERRORBAR;
exports.PRIMITIVE_MARKS = [exports.AREA, exports.BAR, exports.LINE, exports.POINT, exports.TEXT, exports.TICK, exports.RULE, exports.CIRCLE, exports.SQUARE];

},{}],37:[function(require,module,exports){
"use strict";
(function (ScaleType) {
    ScaleType[ScaleType["LINEAR"] = 'linear'] = "LINEAR";
    ScaleType[ScaleType["LOG"] = 'log'] = "LOG";
    ScaleType[ScaleType["POW"] = 'pow'] = "POW";
    ScaleType[ScaleType["SQRT"] = 'sqrt'] = "SQRT";
    ScaleType[ScaleType["QUANTILE"] = 'quantile'] = "QUANTILE";
    ScaleType[ScaleType["QUANTIZE"] = 'quantize'] = "QUANTIZE";
    ScaleType[ScaleType["ORDINAL"] = 'ordinal'] = "ORDINAL";
    ScaleType[ScaleType["TIME"] = 'time'] = "TIME";
    ScaleType[ScaleType["UTC"] = 'utc'] = "UTC";
})(exports.ScaleType || (exports.ScaleType = {}));
var ScaleType = exports.ScaleType;
(function (NiceTime) {
    NiceTime[NiceTime["SECOND"] = 'second'] = "SECOND";
    NiceTime[NiceTime["MINUTE"] = 'minute'] = "MINUTE";
    NiceTime[NiceTime["HOUR"] = 'hour'] = "HOUR";
    NiceTime[NiceTime["DAY"] = 'day'] = "DAY";
    NiceTime[NiceTime["WEEK"] = 'week'] = "WEEK";
    NiceTime[NiceTime["MONTH"] = 'month'] = "MONTH";
    NiceTime[NiceTime["YEAR"] = 'year'] = "YEAR";
})(exports.NiceTime || (exports.NiceTime = {}));
var NiceTime = exports.NiceTime;
exports.defaultScaleConfig = {
    round: true,
    textBandWidth: 90,
    bandSize: 21,
    padding: 1,
    useRawDomain: false,
    opacity: [0.3, 0.8],
    nominalColorRange: 'category10',
    sequentialColorRange: ['#AFC6A3', '#09622A'],
    shapeRange: 'shapes',
    fontSizeRange: [8, 40],
    ruleSizeRange: [1, 5],
    tickSizeRange: [1, 20]
};
exports.defaultFacetScaleConfig = {
    round: true,
    padding: 16
};

},{}],38:[function(require,module,exports){
"use strict";
var aggregate_1 = require('./aggregate');
var timeunit_1 = require('./timeunit');
var type_1 = require('./type');
var vlEncoding = require('./encoding');
var mark_1 = require('./mark');
exports.DELIM = '|';
exports.ASSIGN = '=';
exports.TYPE = ',';
exports.FUNC = '_';
function shorten(spec) {
    return 'mark' + exports.ASSIGN + spec.mark +
        exports.DELIM + shortenEncoding(spec.encoding);
}
exports.shorten = shorten;
function parse(shorthand, data, config) {
    var split = shorthand.split(exports.DELIM), mark = split.shift().split(exports.ASSIGN)[1].trim(), encoding = parseEncoding(split.join(exports.DELIM));
    var spec = {
        mark: mark_1.Mark[mark],
        encoding: encoding
    };
    if (data !== undefined) {
        spec.data = data;
    }
    if (config !== undefined) {
        spec.config = config;
    }
    return spec;
}
exports.parse = parse;
function shortenEncoding(encoding) {
    return vlEncoding.map(encoding, function (fieldDef, channel) {
        return channel + exports.ASSIGN + shortenFieldDef(fieldDef);
    }).join(exports.DELIM);
}
exports.shortenEncoding = shortenEncoding;
function parseEncoding(encodingShorthand) {
    return encodingShorthand.split(exports.DELIM).reduce(function (m, e) {
        var split = e.split(exports.ASSIGN), enctype = split[0].trim(), fieldDefShorthand = split[1];
        m[enctype] = parseFieldDef(fieldDefShorthand);
        return m;
    }, {});
}
exports.parseEncoding = parseEncoding;
function shortenFieldDef(fieldDef) {
    return (fieldDef.aggregate ? fieldDef.aggregate + exports.FUNC : '') +
        (fieldDef.timeUnit ? fieldDef.timeUnit + exports.FUNC : '') +
        (fieldDef.bin ? 'bin' + exports.FUNC : '') +
        (fieldDef.field || '') + exports.TYPE + type_1.SHORT_TYPE[fieldDef.type];
}
exports.shortenFieldDef = shortenFieldDef;
function shortenFieldDefs(fieldDefs, delim) {
    if (delim === void 0) { delim = exports.DELIM; }
    return fieldDefs.map(shortenFieldDef).join(delim);
}
exports.shortenFieldDefs = shortenFieldDefs;
function parseFieldDef(fieldDefShorthand) {
    var split = fieldDefShorthand.split(exports.TYPE);
    var fieldDef = {
        field: split[0].trim(),
        type: type_1.TYPE_FROM_SHORT_TYPE[split[1].trim()]
    };
    for (var i = 0; i < aggregate_1.AGGREGATE_OPS.length; i++) {
        var a = aggregate_1.AGGREGATE_OPS[i];
        if (fieldDef.field.indexOf(a + '_') === 0) {
            fieldDef.field = fieldDef.field.substr(a.toString().length + 1);
            if (a === aggregate_1.AggregateOp.COUNT && fieldDef.field.length === 0) {
                fieldDef.field = '*';
            }
            fieldDef.aggregate = a;
            break;
        }
    }
    for (var i = 0; i < timeunit_1.TIMEUNITS.length; i++) {
        var tu = timeunit_1.TIMEUNITS[i];
        if (fieldDef.field && fieldDef.field.indexOf(tu + '_') === 0) {
            fieldDef.field = fieldDef.field.substr(fieldDef.field.length + 1);
            fieldDef.timeUnit = tu;
            break;
        }
    }
    if (fieldDef.field && fieldDef.field.indexOf('bin_') === 0) {
        fieldDef.field = fieldDef.field.substr(4);
        fieldDef.bin = true;
    }
    return fieldDef;
}
exports.parseFieldDef = parseFieldDef;

},{"./aggregate":30,"./encoding":33,"./mark":36,"./timeunit":39,"./type":40}],39:[function(require,module,exports){
"use strict";
var channel_1 = require('./channel');
var datetime_1 = require('./datetime');
var scale_1 = require('./scale');
var util_1 = require('./util');
(function (TimeUnit) {
    TimeUnit[TimeUnit["YEAR"] = 'year'] = "YEAR";
    TimeUnit[TimeUnit["MONTH"] = 'month'] = "MONTH";
    TimeUnit[TimeUnit["DAY"] = 'day'] = "DAY";
    TimeUnit[TimeUnit["DATE"] = 'date'] = "DATE";
    TimeUnit[TimeUnit["HOURS"] = 'hours'] = "HOURS";
    TimeUnit[TimeUnit["MINUTES"] = 'minutes'] = "MINUTES";
    TimeUnit[TimeUnit["SECONDS"] = 'seconds'] = "SECONDS";
    TimeUnit[TimeUnit["MILLISECONDS"] = 'milliseconds'] = "MILLISECONDS";
    TimeUnit[TimeUnit["YEARMONTH"] = 'yearmonth'] = "YEARMONTH";
    TimeUnit[TimeUnit["YEARMONTHDATE"] = 'yearmonthdate'] = "YEARMONTHDATE";
    TimeUnit[TimeUnit["YEARMONTHDATEHOURS"] = 'yearmonthdatehours'] = "YEARMONTHDATEHOURS";
    TimeUnit[TimeUnit["YEARMONTHDATEHOURSMINUTES"] = 'yearmonthdatehoursminutes'] = "YEARMONTHDATEHOURSMINUTES";
    TimeUnit[TimeUnit["YEARMONTHDATEHOURSMINUTESSECONDS"] = 'yearmonthdatehoursminutesseconds'] = "YEARMONTHDATEHOURSMINUTESSECONDS";
    TimeUnit[TimeUnit["HOURSMINUTES"] = 'hoursminutes'] = "HOURSMINUTES";
    TimeUnit[TimeUnit["HOURSMINUTESSECONDS"] = 'hoursminutesseconds'] = "HOURSMINUTESSECONDS";
    TimeUnit[TimeUnit["MINUTESSECONDS"] = 'minutesseconds'] = "MINUTESSECONDS";
    TimeUnit[TimeUnit["SECONDSMILLISECONDS"] = 'secondsmilliseconds'] = "SECONDSMILLISECONDS";
    TimeUnit[TimeUnit["QUARTER"] = 'quarter'] = "QUARTER";
    TimeUnit[TimeUnit["YEARQUARTER"] = 'yearquarter'] = "YEARQUARTER";
    TimeUnit[TimeUnit["QUARTERMONTH"] = 'quartermonth'] = "QUARTERMONTH";
    TimeUnit[TimeUnit["YEARQUARTERMONTH"] = 'yearquartermonth'] = "YEARQUARTERMONTH";
})(exports.TimeUnit || (exports.TimeUnit = {}));
var TimeUnit = exports.TimeUnit;
exports.SINGLE_TIMEUNITS = [
    TimeUnit.YEAR,
    TimeUnit.QUARTER,
    TimeUnit.MONTH,
    TimeUnit.DAY,
    TimeUnit.DATE,
    TimeUnit.HOURS,
    TimeUnit.MINUTES,
    TimeUnit.SECONDS,
    TimeUnit.MILLISECONDS,
];
var SINGLE_TIMEUNIT_INDEX = exports.SINGLE_TIMEUNITS.reduce(function (d, timeUnit) {
    d[timeUnit] = true;
    return d;
}, {});
function isSingleTimeUnit(timeUnit) {
    return !!SINGLE_TIMEUNIT_INDEX[timeUnit];
}
exports.isSingleTimeUnit = isSingleTimeUnit;
exports.MULTI_TIMEUNITS = [
    TimeUnit.YEARQUARTER,
    TimeUnit.YEARQUARTERMONTH,
    TimeUnit.YEARMONTH,
    TimeUnit.YEARMONTHDATE,
    TimeUnit.YEARMONTHDATEHOURS,
    TimeUnit.YEARMONTHDATEHOURSMINUTES,
    TimeUnit.YEARMONTHDATEHOURSMINUTESSECONDS,
    TimeUnit.QUARTERMONTH,
    TimeUnit.HOURSMINUTES,
    TimeUnit.HOURSMINUTESSECONDS,
    TimeUnit.MINUTESSECONDS,
    TimeUnit.SECONDSMILLISECONDS,
];
var MULTI_TIMEUNIT_INDEX = exports.MULTI_TIMEUNITS.reduce(function (d, timeUnit) {
    d[timeUnit] = true;
    return d;
}, {});
function isMultiTimeUnit(timeUnit) {
    return !!MULTI_TIMEUNIT_INDEX[timeUnit];
}
exports.isMultiTimeUnit = isMultiTimeUnit;
exports.TIMEUNITS = exports.SINGLE_TIMEUNITS.concat(exports.MULTI_TIMEUNITS);
function containsTimeUnit(fullTimeUnit, timeUnit) {
    var fullTimeUnitStr = fullTimeUnit.toString();
    var timeUnitStr = timeUnit.toString();
    var index = fullTimeUnitStr.indexOf(timeUnitStr);
    return index > -1 &&
        (timeUnit !== TimeUnit.SECONDS ||
            index === 0 ||
            fullTimeUnitStr.charAt(index - 1) !== 'i');
}
exports.containsTimeUnit = containsTimeUnit;
function defaultScaleType(timeUnit) {
    switch (timeUnit) {
        case TimeUnit.HOURS:
        case TimeUnit.DAY:
        case TimeUnit.MONTH:
        case TimeUnit.QUARTER:
            return scale_1.ScaleType.ORDINAL;
    }
    return scale_1.ScaleType.TIME;
}
exports.defaultScaleType = defaultScaleType;
function fieldExpr(fullTimeUnit, field) {
    var fieldRef = 'datum.' + field;
    function func(timeUnit) {
        if (timeUnit === TimeUnit.QUARTER) {
            return 'floor(month(' + fieldRef + ')' + '/3)';
        }
        else {
            return timeUnit + '(' + fieldRef + ')';
        }
    }
    var d = exports.SINGLE_TIMEUNITS.reduce(function (_d, tu) {
        if (containsTimeUnit(fullTimeUnit, tu)) {
            _d[tu] = func(tu);
        }
        return _d;
    }, {});
    if (d.day && util_1.keys(d).length > 1) {
        console.warn('Time unit "' + fullTimeUnit + '" is not supported. We are replacing it with ', (fullTimeUnit + '').replace('day', 'date') + '.');
        delete d.day;
        d.date = func(TimeUnit.DATE);
    }
    return datetime_1.dateTimeExpr(d);
}
exports.fieldExpr = fieldExpr;
function rawDomain(timeUnit, channel) {
    if (util_1.contains([channel_1.ROW, channel_1.COLUMN, channel_1.SHAPE, channel_1.COLOR], channel)) {
        return null;
    }
    switch (timeUnit) {
        case TimeUnit.SECONDS:
            return util_1.range(0, 60);
        case TimeUnit.MINUTES:
            return util_1.range(0, 60);
        case TimeUnit.HOURS:
            return util_1.range(0, 24);
        case TimeUnit.DAY:
            return util_1.range(0, 7);
        case TimeUnit.DATE:
            return util_1.range(1, 32);
        case TimeUnit.MONTH:
            return util_1.range(0, 12);
        case TimeUnit.QUARTER:
            return [0, 3, 6, 9];
    }
    return null;
}
exports.rawDomain = rawDomain;
function smallestUnit(timeUnit) {
    if (!timeUnit) {
        return undefined;
    }
    if (containsTimeUnit(timeUnit, TimeUnit.SECONDS)) {
        return 'second';
    }
    if (containsTimeUnit(timeUnit, TimeUnit.MINUTES)) {
        return 'minute';
    }
    if (containsTimeUnit(timeUnit, TimeUnit.HOURS)) {
        return 'hour';
    }
    if (containsTimeUnit(timeUnit, TimeUnit.DAY) ||
        containsTimeUnit(timeUnit, TimeUnit.DATE)) {
        return 'day';
    }
    if (containsTimeUnit(timeUnit, TimeUnit.MONTH)) {
        return 'month';
    }
    if (containsTimeUnit(timeUnit, TimeUnit.YEAR)) {
        return 'year';
    }
    return undefined;
}
exports.smallestUnit = smallestUnit;
function template(timeUnit, field, shortTimeLabels) {
    if (!timeUnit) {
        return undefined;
    }
    var dateComponents = [];
    if (containsTimeUnit(timeUnit, TimeUnit.YEAR)) {
        dateComponents.push(shortTimeLabels ? '%y' : '%Y');
    }
    if (containsTimeUnit(timeUnit, TimeUnit.QUARTER)) {
        dateComponents.push('\'}}Q{{' + field + ' | quarter}}{{' + field + ' | time:\'');
    }
    if (containsTimeUnit(timeUnit, TimeUnit.MONTH)) {
        dateComponents.push(shortTimeLabels ? '%b' : '%B');
    }
    if (containsTimeUnit(timeUnit, TimeUnit.DAY)) {
        dateComponents.push(shortTimeLabels ? '%a' : '%A');
    }
    else if (containsTimeUnit(timeUnit, TimeUnit.DATE)) {
        dateComponents.push('%d');
    }
    var timeComponents = [];
    if (containsTimeUnit(timeUnit, TimeUnit.HOURS)) {
        timeComponents.push('%H');
    }
    if (containsTimeUnit(timeUnit, TimeUnit.MINUTES)) {
        timeComponents.push('%M');
    }
    if (containsTimeUnit(timeUnit, TimeUnit.SECONDS)) {
        timeComponents.push('%S');
    }
    if (containsTimeUnit(timeUnit, TimeUnit.MILLISECONDS)) {
        timeComponents.push('%L');
    }
    var out = [];
    if (dateComponents.length > 0) {
        out.push(dateComponents.join('-'));
    }
    if (timeComponents.length > 0) {
        out.push(timeComponents.join(':'));
    }
    if (out.length > 0) {
        var template_1 = '{{' + field + ' | time:\'' + out.join(' ') + '\'}}';
        return template_1.replace(new RegExp('{{' + field + ' \\| time:\'\'}}', 'g'), '');
    }
    else {
        return undefined;
    }
}
exports.template = template;

},{"./channel":31,"./datetime":32,"./scale":37,"./util":41}],40:[function(require,module,exports){
"use strict";
(function (Type) {
    Type[Type["QUANTITATIVE"] = 'quantitative'] = "QUANTITATIVE";
    Type[Type["ORDINAL"] = 'ordinal'] = "ORDINAL";
    Type[Type["TEMPORAL"] = 'temporal'] = "TEMPORAL";
    Type[Type["NOMINAL"] = 'nominal'] = "NOMINAL";
})(exports.Type || (exports.Type = {}));
var Type = exports.Type;
exports.QUANTITATIVE = Type.QUANTITATIVE;
exports.ORDINAL = Type.ORDINAL;
exports.TEMPORAL = Type.TEMPORAL;
exports.NOMINAL = Type.NOMINAL;
exports.SHORT_TYPE = {
    quantitative: 'Q',
    temporal: 'T',
    nominal: 'N',
    ordinal: 'O'
};
exports.TYPE_FROM_SHORT_TYPE = {
    Q: exports.QUANTITATIVE,
    T: exports.TEMPORAL,
    O: exports.ORDINAL,
    N: exports.NOMINAL
};
function getFullName(type) {
    var typeString = type;
    return exports.TYPE_FROM_SHORT_TYPE[typeString.toUpperCase()] ||
        typeString.toLowerCase();
}
exports.getFullName = getFullName;

},{}],41:[function(require,module,exports){
"use strict";
var stringify = require('json-stable-stringify');
var util_1 = require('datalib/src/util');
exports.keys = util_1.keys;
exports.extend = util_1.extend;
exports.duplicate = util_1.duplicate;
exports.isArray = util_1.isArray;
exports.vals = util_1.vals;
exports.truncate = util_1.truncate;
exports.toMap = util_1.toMap;
exports.isObject = util_1.isObject;
exports.isString = util_1.isString;
exports.isNumber = util_1.isNumber;
exports.isBoolean = util_1.isBoolean;
var util_2 = require('datalib/src/util');
var generate_1 = require('datalib/src/generate');
exports.range = generate_1.range;
var util_3 = require('datalib/src/util');
function pick(obj, props) {
    var copy = {};
    props.forEach(function (prop) {
        if (obj.hasOwnProperty(prop)) {
            copy[prop] = obj[prop];
        }
    });
    return copy;
}
exports.pick = pick;
function omit(obj, props) {
    var copy = util_2.duplicate(obj);
    props.forEach(function (prop) {
        delete copy[prop];
    });
    return copy;
}
exports.omit = omit;
function hash(a) {
    if (util_3.isString(a) || util_3.isNumber(a) || util_3.isBoolean(a)) {
        return String(a);
    }
    return stringify(a);
}
exports.hash = hash;
function contains(array, item) {
    return array.indexOf(item) > -1;
}
exports.contains = contains;
function without(array, excludedItems) {
    return array.filter(function (item) {
        return !contains(excludedItems, item);
    });
}
exports.without = without;
function union(array, other) {
    return array.concat(without(other, array));
}
exports.union = union;
function forEach(obj, f, thisArg) {
    if (obj.forEach) {
        obj.forEach.call(thisArg, f);
    }
    else {
        for (var k in obj) {
            if (obj.hasOwnProperty(k)) {
                f.call(thisArg, obj[k], k, obj);
            }
        }
    }
}
exports.forEach = forEach;
function reduce(obj, f, init, thisArg) {
    if (obj.reduce) {
        return obj.reduce.call(thisArg, f, init);
    }
    else {
        for (var k in obj) {
            if (obj.hasOwnProperty(k)) {
                init = f.call(thisArg, init, obj[k], k, obj);
            }
        }
        return init;
    }
}
exports.reduce = reduce;
function map(obj, f, thisArg) {
    if (obj.map) {
        return obj.map.call(thisArg, f);
    }
    else {
        var output = [];
        for (var k in obj) {
            if (obj.hasOwnProperty(k)) {
                output.push(f.call(thisArg, obj[k], k, obj));
            }
        }
        return output;
    }
}
exports.map = map;
function some(arr, f) {
    var i = 0;
    for (var k = 0; k < arr.length; k++) {
        if (f(arr[k], k, i++)) {
            return true;
        }
    }
    return false;
}
exports.some = some;
function every(arr, f) {
    var i = 0;
    for (var k = 0; k < arr.length; k++) {
        if (!f(arr[k], k, i++)) {
            return false;
        }
    }
    return true;
}
exports.every = every;
function flatten(arrays) {
    return [].concat.apply([], arrays);
}
exports.flatten = flatten;
function mergeDeep(dest) {
    var src = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        src[_i - 1] = arguments[_i];
    }
    for (var i = 0; i < src.length; i++) {
        dest = deepMerge_(dest, src[i]);
    }
    return dest;
}
exports.mergeDeep = mergeDeep;
;
function deepMerge_(dest, src) {
    if (typeof src !== 'object' || src === null) {
        return dest;
    }
    for (var p in src) {
        if (!src.hasOwnProperty(p)) {
            continue;
        }
        if (src[p] === undefined) {
            continue;
        }
        if (typeof src[p] !== 'object' || src[p] === null) {
            dest[p] = src[p];
        }
        else if (typeof dest[p] !== 'object' || dest[p] === null) {
            dest[p] = mergeDeep(src[p].constructor === Array ? [] : {}, src[p]);
        }
        else {
            mergeDeep(dest[p], src[p]);
        }
    }
    return dest;
}
var dlBin = require('datalib/src/bins/bins');
function getbins(stats, maxbins) {
    return dlBin({
        min: stats.min,
        max: stats.max,
        maxbins: maxbins
    });
}
exports.getbins = getbins;
function unique(values, f) {
    var results = [];
    var u = {}, v, i, n;
    for (i = 0, n = values.length; i < n; ++i) {
        v = f ? f(values[i]) : values[i];
        if (v in u) {
            continue;
        }
        u[v] = 1;
        results.push(values[i]);
    }
    return results;
}
exports.unique = unique;
;
function warning(message) {
    console.warn('[VL Warning]', message);
}
exports.warning = warning;
function error(message) {
    console.error('[VL Error]', message);
}
exports.error = error;
function differ(dict, other) {
    for (var key in dict) {
        if (dict.hasOwnProperty(key)) {
            if (other[key] && dict[key] && other[key] !== dict[key]) {
                return true;
            }
        }
    }
    return false;
}
exports.differ = differ;

},{"datalib/src/bins/bins":22,"datalib/src/generate":23,"datalib/src/util":25,"json-stable-stringify":26}],42:[function(require,module,exports){
"use strict";
var util_1 = require('./util');
var mark_1 = require('./mark');
exports.DEFAULT_REQUIRED_CHANNEL_MAP = {
    text: ['text'],
    line: ['x', 'y'],
    area: ['x', 'y']
};
exports.DEFAULT_SUPPORTED_CHANNEL_TYPE = {
    bar: util_1.toMap(['row', 'column', 'x', 'y', 'size', 'color', 'detail']),
    line: util_1.toMap(['row', 'column', 'x', 'y', 'color', 'detail']),
    area: util_1.toMap(['row', 'column', 'x', 'y', 'color', 'detail']),
    tick: util_1.toMap(['row', 'column', 'x', 'y', 'color', 'detail']),
    circle: util_1.toMap(['row', 'column', 'x', 'y', 'color', 'size', 'detail']),
    square: util_1.toMap(['row', 'column', 'x', 'y', 'color', 'size', 'detail']),
    point: util_1.toMap(['row', 'column', 'x', 'y', 'color', 'size', 'detail', 'shape']),
    text: util_1.toMap(['row', 'column', 'size', 'color', 'text'])
};
function getEncodingMappingError(spec, requiredChannelMap, supportedChannelMap) {
    if (requiredChannelMap === void 0) { requiredChannelMap = exports.DEFAULT_REQUIRED_CHANNEL_MAP; }
    if (supportedChannelMap === void 0) { supportedChannelMap = exports.DEFAULT_SUPPORTED_CHANNEL_TYPE; }
    var mark = spec.mark;
    var encoding = spec.encoding;
    var requiredChannels = requiredChannelMap[mark];
    var supportedChannels = supportedChannelMap[mark];
    for (var i in requiredChannels) {
        if (!(requiredChannels[i] in encoding)) {
            return 'Missing encoding channel \"' + requiredChannels[i] +
                '\" for mark \"' + mark + '\"';
        }
    }
    for (var channel in encoding) {
        if (!supportedChannels[channel]) {
            return 'Encoding channel \"' + channel +
                '\" is not supported by mark type \"' + mark + '\"';
        }
    }
    if (mark === mark_1.BAR && !encoding.x && !encoding.y) {
        return 'Missing both x and y for bar';
    }
    return null;
}
exports.getEncodingMappingError = getEncodingMappingError;

},{"./mark":36,"./util":41}]},{},[8])(8)
});
//# sourceMappingURL=compass.js.map
