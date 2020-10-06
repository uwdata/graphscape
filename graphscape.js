(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('d3')) :
  typeof define === 'function' && define.amd ? define(['exports', 'd3'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.graphscape = {}, global.d3));
}(this, (function (exports, d3) { 'use strict';

  function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

  var d3__default = /*#__PURE__*/_interopDefaultLegacy(d3);

  function accessor(fn, fields, name) {
    fn.fields = fields || [];
    fn.fname = name;
    return fn;
  }

  function getter(path) {
    return path.length === 1 ? get1(path[0]) : getN(path);
  }

  const get1 = field => function (obj) {
    return obj[field];
  };

  const getN = path => {
    const len = path.length;
    return function (obj) {
      for (let i = 0; i < len; ++i) {
        obj = obj[path[i]];
      }

      return obj;
    };
  };

  function error(message) {
    throw Error(message);
  }

  function splitAccessPath(p) {
    const path = [],
          n = p.length;
    let q = null,
        b = 0,
        s = '',
        i,
        j,
        c;
    p = p + '';

    function push() {
      path.push(s + p.substring(i, j));
      s = '';
      i = j + 1;
    }

    for (i = j = 0; j < n; ++j) {
      c = p[j];

      if (c === '\\') {
        s += p.substring(i, j);
        s += p.substring(++j, ++j);
        i = j;
      } else if (c === q) {
        push();
        q = null;
        b = -1;
      } else if (q) {
        continue;
      } else if (i === b && c === '"') {
        i = j + 1;
        q = c;
      } else if (i === b && c === "'") {
        i = j + 1;
        q = c;
      } else if (c === '.' && !b) {
        if (j > i) {
          push();
        } else {
          i = j + 1;
        }
      } else if (c === '[') {
        if (j > i) push();
        b = i = j + 1;
      } else if (c === ']') {
        if (!b) error('Access path missing open bracket: ' + p);
        if (b > 0) push();
        b = 0;
        i = j + 1;
      }
    }

    if (b) error('Access path missing closing bracket: ' + p);
    if (q) error('Access path missing closing quote: ' + p);

    if (j > i) {
      j++;
      push();
    }

    return path;
  }

  function field(field, name, opt) {
    const path = splitAccessPath(field);
    field = path.length === 1 ? path[0] : field;
    return accessor((opt && opt.get || getter)(path), [field], name || field);
  }

  const id = field('id');
  const identity = accessor(_ => _, [], 'identity');
  const zero = accessor(() => 0, [], 'zero');
  const one = accessor(() => 1, [], 'one');
  const truthy = accessor(() => true, [], 'true');
  const falsy = accessor(() => false, [], 'false');

  function isFunction(_) {
    return typeof _ === 'function';
  }

  const hop = Object.prototype.hasOwnProperty;

  function has(object, property) {
    return hop.call(object, property);
  }

  function isString(_) {
    return typeof _ === 'string';
  }

  function toSet(_) {
    const s = {},
          n = _.length;

    for (let i = 0; i < n; ++i) s[_[i]] = true;

    return s;
  }

  const RawCode = 'RawCode';
  const Literal = 'Literal';
  const Property = 'Property';
  const Identifier = 'Identifier';
  const ArrayExpression = 'ArrayExpression';
  const BinaryExpression = 'BinaryExpression';
  const CallExpression = 'CallExpression';
  const ConditionalExpression = 'ConditionalExpression';
  const LogicalExpression = 'LogicalExpression';
  const MemberExpression = 'MemberExpression';
  const ObjectExpression = 'ObjectExpression';
  const UnaryExpression = 'UnaryExpression';

  function ASTNode(type) {
    this.type = type;
  }

  ASTNode.prototype.visit = function (visitor) {
    let c, i, n;
    if (visitor(this)) return 1;

    for (c = children(this), i = 0, n = c.length; i < n; ++i) {
      if (c[i].visit(visitor)) return 1;
    }
  };

  function children(node) {
    switch (node.type) {
      case ArrayExpression:
        return node.elements;

      case BinaryExpression:
      case LogicalExpression:
        return [node.left, node.right];

      case CallExpression:
        return [node.callee].concat(node.arguments);

      case ConditionalExpression:
        return [node.test, node.consequent, node.alternate];

      case MemberExpression:
        return [node.object, node.property];

      case ObjectExpression:
        return node.properties;

      case Property:
        return [node.key, node.value];

      case UnaryExpression:
        return [node.argument];

      case Identifier:
      case Literal:
      case RawCode:
      default:
        return [];
    }
  }
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


  var TokenName, source, index, length, lookahead;
  var TokenBooleanLiteral = 1,
      TokenEOF = 2,
      TokenIdentifier = 3,
      TokenKeyword = 4,
      TokenNullLiteral = 5,
      TokenNumericLiteral = 6,
      TokenPunctuator = 7,
      TokenStringLiteral = 8,
      TokenRegularExpression = 9;
  TokenName = {};
  TokenName[TokenBooleanLiteral] = 'Boolean';
  TokenName[TokenEOF] = '<end>';
  TokenName[TokenIdentifier] = 'Identifier';
  TokenName[TokenKeyword] = 'Keyword';
  TokenName[TokenNullLiteral] = 'Null';
  TokenName[TokenNumericLiteral] = 'Numeric';
  TokenName[TokenPunctuator] = 'Punctuator';
  TokenName[TokenStringLiteral] = 'String';
  TokenName[TokenRegularExpression] = 'RegularExpression';
  var SyntaxArrayExpression = 'ArrayExpression',
      SyntaxBinaryExpression = 'BinaryExpression',
      SyntaxCallExpression = 'CallExpression',
      SyntaxConditionalExpression = 'ConditionalExpression',
      SyntaxIdentifier = 'Identifier',
      SyntaxLiteral = 'Literal',
      SyntaxLogicalExpression = 'LogicalExpression',
      SyntaxMemberExpression = 'MemberExpression',
      SyntaxObjectExpression = 'ObjectExpression',
      SyntaxProperty = 'Property',
      SyntaxUnaryExpression = 'UnaryExpression'; // Error messages should be identical to V8.

  var MessageUnexpectedToken = 'Unexpected token %0',
      MessageUnexpectedNumber = 'Unexpected number',
      MessageUnexpectedString = 'Unexpected string',
      MessageUnexpectedIdentifier = 'Unexpected identifier',
      MessageUnexpectedReserved = 'Unexpected reserved word',
      MessageUnexpectedEOS = 'Unexpected end of input',
      MessageInvalidRegExp = 'Invalid regular expression',
      MessageUnterminatedRegExp = 'Invalid regular expression: missing /',
      MessageStrictOctalLiteral = 'Octal literals are not allowed in strict mode.',
      MessageStrictDuplicateProperty = 'Duplicate data property in object literal not allowed in strict mode';
  var ILLEGAL = 'ILLEGAL',
      DISABLED = 'Disabled.'; // See also tools/generate-unicode-regex.py.

  var RegexNonAsciiIdentifierStart = new RegExp('[\\xAA\\xB5\\xBA\\xC0-\\xD6\\xD8-\\xF6\\xF8-\\u02C1\\u02C6-\\u02D1\\u02E0-\\u02E4\\u02EC\\u02EE\\u0370-\\u0374\\u0376\\u0377\\u037A-\\u037D\\u037F\\u0386\\u0388-\\u038A\\u038C\\u038E-\\u03A1\\u03A3-\\u03F5\\u03F7-\\u0481\\u048A-\\u052F\\u0531-\\u0556\\u0559\\u0561-\\u0587\\u05D0-\\u05EA\\u05F0-\\u05F2\\u0620-\\u064A\\u066E\\u066F\\u0671-\\u06D3\\u06D5\\u06E5\\u06E6\\u06EE\\u06EF\\u06FA-\\u06FC\\u06FF\\u0710\\u0712-\\u072F\\u074D-\\u07A5\\u07B1\\u07CA-\\u07EA\\u07F4\\u07F5\\u07FA\\u0800-\\u0815\\u081A\\u0824\\u0828\\u0840-\\u0858\\u08A0-\\u08B2\\u0904-\\u0939\\u093D\\u0950\\u0958-\\u0961\\u0971-\\u0980\\u0985-\\u098C\\u098F\\u0990\\u0993-\\u09A8\\u09AA-\\u09B0\\u09B2\\u09B6-\\u09B9\\u09BD\\u09CE\\u09DC\\u09DD\\u09DF-\\u09E1\\u09F0\\u09F1\\u0A05-\\u0A0A\\u0A0F\\u0A10\\u0A13-\\u0A28\\u0A2A-\\u0A30\\u0A32\\u0A33\\u0A35\\u0A36\\u0A38\\u0A39\\u0A59-\\u0A5C\\u0A5E\\u0A72-\\u0A74\\u0A85-\\u0A8D\\u0A8F-\\u0A91\\u0A93-\\u0AA8\\u0AAA-\\u0AB0\\u0AB2\\u0AB3\\u0AB5-\\u0AB9\\u0ABD\\u0AD0\\u0AE0\\u0AE1\\u0B05-\\u0B0C\\u0B0F\\u0B10\\u0B13-\\u0B28\\u0B2A-\\u0B30\\u0B32\\u0B33\\u0B35-\\u0B39\\u0B3D\\u0B5C\\u0B5D\\u0B5F-\\u0B61\\u0B71\\u0B83\\u0B85-\\u0B8A\\u0B8E-\\u0B90\\u0B92-\\u0B95\\u0B99\\u0B9A\\u0B9C\\u0B9E\\u0B9F\\u0BA3\\u0BA4\\u0BA8-\\u0BAA\\u0BAE-\\u0BB9\\u0BD0\\u0C05-\\u0C0C\\u0C0E-\\u0C10\\u0C12-\\u0C28\\u0C2A-\\u0C39\\u0C3D\\u0C58\\u0C59\\u0C60\\u0C61\\u0C85-\\u0C8C\\u0C8E-\\u0C90\\u0C92-\\u0CA8\\u0CAA-\\u0CB3\\u0CB5-\\u0CB9\\u0CBD\\u0CDE\\u0CE0\\u0CE1\\u0CF1\\u0CF2\\u0D05-\\u0D0C\\u0D0E-\\u0D10\\u0D12-\\u0D3A\\u0D3D\\u0D4E\\u0D60\\u0D61\\u0D7A-\\u0D7F\\u0D85-\\u0D96\\u0D9A-\\u0DB1\\u0DB3-\\u0DBB\\u0DBD\\u0DC0-\\u0DC6\\u0E01-\\u0E30\\u0E32\\u0E33\\u0E40-\\u0E46\\u0E81\\u0E82\\u0E84\\u0E87\\u0E88\\u0E8A\\u0E8D\\u0E94-\\u0E97\\u0E99-\\u0E9F\\u0EA1-\\u0EA3\\u0EA5\\u0EA7\\u0EAA\\u0EAB\\u0EAD-\\u0EB0\\u0EB2\\u0EB3\\u0EBD\\u0EC0-\\u0EC4\\u0EC6\\u0EDC-\\u0EDF\\u0F00\\u0F40-\\u0F47\\u0F49-\\u0F6C\\u0F88-\\u0F8C\\u1000-\\u102A\\u103F\\u1050-\\u1055\\u105A-\\u105D\\u1061\\u1065\\u1066\\u106E-\\u1070\\u1075-\\u1081\\u108E\\u10A0-\\u10C5\\u10C7\\u10CD\\u10D0-\\u10FA\\u10FC-\\u1248\\u124A-\\u124D\\u1250-\\u1256\\u1258\\u125A-\\u125D\\u1260-\\u1288\\u128A-\\u128D\\u1290-\\u12B0\\u12B2-\\u12B5\\u12B8-\\u12BE\\u12C0\\u12C2-\\u12C5\\u12C8-\\u12D6\\u12D8-\\u1310\\u1312-\\u1315\\u1318-\\u135A\\u1380-\\u138F\\u13A0-\\u13F4\\u1401-\\u166C\\u166F-\\u167F\\u1681-\\u169A\\u16A0-\\u16EA\\u16EE-\\u16F8\\u1700-\\u170C\\u170E-\\u1711\\u1720-\\u1731\\u1740-\\u1751\\u1760-\\u176C\\u176E-\\u1770\\u1780-\\u17B3\\u17D7\\u17DC\\u1820-\\u1877\\u1880-\\u18A8\\u18AA\\u18B0-\\u18F5\\u1900-\\u191E\\u1950-\\u196D\\u1970-\\u1974\\u1980-\\u19AB\\u19C1-\\u19C7\\u1A00-\\u1A16\\u1A20-\\u1A54\\u1AA7\\u1B05-\\u1B33\\u1B45-\\u1B4B\\u1B83-\\u1BA0\\u1BAE\\u1BAF\\u1BBA-\\u1BE5\\u1C00-\\u1C23\\u1C4D-\\u1C4F\\u1C5A-\\u1C7D\\u1CE9-\\u1CEC\\u1CEE-\\u1CF1\\u1CF5\\u1CF6\\u1D00-\\u1DBF\\u1E00-\\u1F15\\u1F18-\\u1F1D\\u1F20-\\u1F45\\u1F48-\\u1F4D\\u1F50-\\u1F57\\u1F59\\u1F5B\\u1F5D\\u1F5F-\\u1F7D\\u1F80-\\u1FB4\\u1FB6-\\u1FBC\\u1FBE\\u1FC2-\\u1FC4\\u1FC6-\\u1FCC\\u1FD0-\\u1FD3\\u1FD6-\\u1FDB\\u1FE0-\\u1FEC\\u1FF2-\\u1FF4\\u1FF6-\\u1FFC\\u2071\\u207F\\u2090-\\u209C\\u2102\\u2107\\u210A-\\u2113\\u2115\\u2119-\\u211D\\u2124\\u2126\\u2128\\u212A-\\u212D\\u212F-\\u2139\\u213C-\\u213F\\u2145-\\u2149\\u214E\\u2160-\\u2188\\u2C00-\\u2C2E\\u2C30-\\u2C5E\\u2C60-\\u2CE4\\u2CEB-\\u2CEE\\u2CF2\\u2CF3\\u2D00-\\u2D25\\u2D27\\u2D2D\\u2D30-\\u2D67\\u2D6F\\u2D80-\\u2D96\\u2DA0-\\u2DA6\\u2DA8-\\u2DAE\\u2DB0-\\u2DB6\\u2DB8-\\u2DBE\\u2DC0-\\u2DC6\\u2DC8-\\u2DCE\\u2DD0-\\u2DD6\\u2DD8-\\u2DDE\\u2E2F\\u3005-\\u3007\\u3021-\\u3029\\u3031-\\u3035\\u3038-\\u303C\\u3041-\\u3096\\u309D-\\u309F\\u30A1-\\u30FA\\u30FC-\\u30FF\\u3105-\\u312D\\u3131-\\u318E\\u31A0-\\u31BA\\u31F0-\\u31FF\\u3400-\\u4DB5\\u4E00-\\u9FCC\\uA000-\\uA48C\\uA4D0-\\uA4FD\\uA500-\\uA60C\\uA610-\\uA61F\\uA62A\\uA62B\\uA640-\\uA66E\\uA67F-\\uA69D\\uA6A0-\\uA6EF\\uA717-\\uA71F\\uA722-\\uA788\\uA78B-\\uA78E\\uA790-\\uA7AD\\uA7B0\\uA7B1\\uA7F7-\\uA801\\uA803-\\uA805\\uA807-\\uA80A\\uA80C-\\uA822\\uA840-\\uA873\\uA882-\\uA8B3\\uA8F2-\\uA8F7\\uA8FB\\uA90A-\\uA925\\uA930-\\uA946\\uA960-\\uA97C\\uA984-\\uA9B2\\uA9CF\\uA9E0-\\uA9E4\\uA9E6-\\uA9EF\\uA9FA-\\uA9FE\\uAA00-\\uAA28\\uAA40-\\uAA42\\uAA44-\\uAA4B\\uAA60-\\uAA76\\uAA7A\\uAA7E-\\uAAAF\\uAAB1\\uAAB5\\uAAB6\\uAAB9-\\uAABD\\uAAC0\\uAAC2\\uAADB-\\uAADD\\uAAE0-\\uAAEA\\uAAF2-\\uAAF4\\uAB01-\\uAB06\\uAB09-\\uAB0E\\uAB11-\\uAB16\\uAB20-\\uAB26\\uAB28-\\uAB2E\\uAB30-\\uAB5A\\uAB5C-\\uAB5F\\uAB64\\uAB65\\uABC0-\\uABE2\\uAC00-\\uD7A3\\uD7B0-\\uD7C6\\uD7CB-\\uD7FB\\uF900-\\uFA6D\\uFA70-\\uFAD9\\uFB00-\\uFB06\\uFB13-\\uFB17\\uFB1D\\uFB1F-\\uFB28\\uFB2A-\\uFB36\\uFB38-\\uFB3C\\uFB3E\\uFB40\\uFB41\\uFB43\\uFB44\\uFB46-\\uFBB1\\uFBD3-\\uFD3D\\uFD50-\\uFD8F\\uFD92-\\uFDC7\\uFDF0-\\uFDFB\\uFE70-\\uFE74\\uFE76-\\uFEFC\\uFF21-\\uFF3A\\uFF41-\\uFF5A\\uFF66-\\uFFBE\\uFFC2-\\uFFC7\\uFFCA-\\uFFCF\\uFFD2-\\uFFD7\\uFFDA-\\uFFDC]'),
      // eslint-disable-next-line no-misleading-character-class
  RegexNonAsciiIdentifierPart = new RegExp('[\\xAA\\xB5\\xBA\\xC0-\\xD6\\xD8-\\xF6\\xF8-\\u02C1\\u02C6-\\u02D1\\u02E0-\\u02E4\\u02EC\\u02EE\\u0300-\\u0374\\u0376\\u0377\\u037A-\\u037D\\u037F\\u0386\\u0388-\\u038A\\u038C\\u038E-\\u03A1\\u03A3-\\u03F5\\u03F7-\\u0481\\u0483-\\u0487\\u048A-\\u052F\\u0531-\\u0556\\u0559\\u0561-\\u0587\\u0591-\\u05BD\\u05BF\\u05C1\\u05C2\\u05C4\\u05C5\\u05C7\\u05D0-\\u05EA\\u05F0-\\u05F2\\u0610-\\u061A\\u0620-\\u0669\\u066E-\\u06D3\\u06D5-\\u06DC\\u06DF-\\u06E8\\u06EA-\\u06FC\\u06FF\\u0710-\\u074A\\u074D-\\u07B1\\u07C0-\\u07F5\\u07FA\\u0800-\\u082D\\u0840-\\u085B\\u08A0-\\u08B2\\u08E4-\\u0963\\u0966-\\u096F\\u0971-\\u0983\\u0985-\\u098C\\u098F\\u0990\\u0993-\\u09A8\\u09AA-\\u09B0\\u09B2\\u09B6-\\u09B9\\u09BC-\\u09C4\\u09C7\\u09C8\\u09CB-\\u09CE\\u09D7\\u09DC\\u09DD\\u09DF-\\u09E3\\u09E6-\\u09F1\\u0A01-\\u0A03\\u0A05-\\u0A0A\\u0A0F\\u0A10\\u0A13-\\u0A28\\u0A2A-\\u0A30\\u0A32\\u0A33\\u0A35\\u0A36\\u0A38\\u0A39\\u0A3C\\u0A3E-\\u0A42\\u0A47\\u0A48\\u0A4B-\\u0A4D\\u0A51\\u0A59-\\u0A5C\\u0A5E\\u0A66-\\u0A75\\u0A81-\\u0A83\\u0A85-\\u0A8D\\u0A8F-\\u0A91\\u0A93-\\u0AA8\\u0AAA-\\u0AB0\\u0AB2\\u0AB3\\u0AB5-\\u0AB9\\u0ABC-\\u0AC5\\u0AC7-\\u0AC9\\u0ACB-\\u0ACD\\u0AD0\\u0AE0-\\u0AE3\\u0AE6-\\u0AEF\\u0B01-\\u0B03\\u0B05-\\u0B0C\\u0B0F\\u0B10\\u0B13-\\u0B28\\u0B2A-\\u0B30\\u0B32\\u0B33\\u0B35-\\u0B39\\u0B3C-\\u0B44\\u0B47\\u0B48\\u0B4B-\\u0B4D\\u0B56\\u0B57\\u0B5C\\u0B5D\\u0B5F-\\u0B63\\u0B66-\\u0B6F\\u0B71\\u0B82\\u0B83\\u0B85-\\u0B8A\\u0B8E-\\u0B90\\u0B92-\\u0B95\\u0B99\\u0B9A\\u0B9C\\u0B9E\\u0B9F\\u0BA3\\u0BA4\\u0BA8-\\u0BAA\\u0BAE-\\u0BB9\\u0BBE-\\u0BC2\\u0BC6-\\u0BC8\\u0BCA-\\u0BCD\\u0BD0\\u0BD7\\u0BE6-\\u0BEF\\u0C00-\\u0C03\\u0C05-\\u0C0C\\u0C0E-\\u0C10\\u0C12-\\u0C28\\u0C2A-\\u0C39\\u0C3D-\\u0C44\\u0C46-\\u0C48\\u0C4A-\\u0C4D\\u0C55\\u0C56\\u0C58\\u0C59\\u0C60-\\u0C63\\u0C66-\\u0C6F\\u0C81-\\u0C83\\u0C85-\\u0C8C\\u0C8E-\\u0C90\\u0C92-\\u0CA8\\u0CAA-\\u0CB3\\u0CB5-\\u0CB9\\u0CBC-\\u0CC4\\u0CC6-\\u0CC8\\u0CCA-\\u0CCD\\u0CD5\\u0CD6\\u0CDE\\u0CE0-\\u0CE3\\u0CE6-\\u0CEF\\u0CF1\\u0CF2\\u0D01-\\u0D03\\u0D05-\\u0D0C\\u0D0E-\\u0D10\\u0D12-\\u0D3A\\u0D3D-\\u0D44\\u0D46-\\u0D48\\u0D4A-\\u0D4E\\u0D57\\u0D60-\\u0D63\\u0D66-\\u0D6F\\u0D7A-\\u0D7F\\u0D82\\u0D83\\u0D85-\\u0D96\\u0D9A-\\u0DB1\\u0DB3-\\u0DBB\\u0DBD\\u0DC0-\\u0DC6\\u0DCA\\u0DCF-\\u0DD4\\u0DD6\\u0DD8-\\u0DDF\\u0DE6-\\u0DEF\\u0DF2\\u0DF3\\u0E01-\\u0E3A\\u0E40-\\u0E4E\\u0E50-\\u0E59\\u0E81\\u0E82\\u0E84\\u0E87\\u0E88\\u0E8A\\u0E8D\\u0E94-\\u0E97\\u0E99-\\u0E9F\\u0EA1-\\u0EA3\\u0EA5\\u0EA7\\u0EAA\\u0EAB\\u0EAD-\\u0EB9\\u0EBB-\\u0EBD\\u0EC0-\\u0EC4\\u0EC6\\u0EC8-\\u0ECD\\u0ED0-\\u0ED9\\u0EDC-\\u0EDF\\u0F00\\u0F18\\u0F19\\u0F20-\\u0F29\\u0F35\\u0F37\\u0F39\\u0F3E-\\u0F47\\u0F49-\\u0F6C\\u0F71-\\u0F84\\u0F86-\\u0F97\\u0F99-\\u0FBC\\u0FC6\\u1000-\\u1049\\u1050-\\u109D\\u10A0-\\u10C5\\u10C7\\u10CD\\u10D0-\\u10FA\\u10FC-\\u1248\\u124A-\\u124D\\u1250-\\u1256\\u1258\\u125A-\\u125D\\u1260-\\u1288\\u128A-\\u128D\\u1290-\\u12B0\\u12B2-\\u12B5\\u12B8-\\u12BE\\u12C0\\u12C2-\\u12C5\\u12C8-\\u12D6\\u12D8-\\u1310\\u1312-\\u1315\\u1318-\\u135A\\u135D-\\u135F\\u1380-\\u138F\\u13A0-\\u13F4\\u1401-\\u166C\\u166F-\\u167F\\u1681-\\u169A\\u16A0-\\u16EA\\u16EE-\\u16F8\\u1700-\\u170C\\u170E-\\u1714\\u1720-\\u1734\\u1740-\\u1753\\u1760-\\u176C\\u176E-\\u1770\\u1772\\u1773\\u1780-\\u17D3\\u17D7\\u17DC\\u17DD\\u17E0-\\u17E9\\u180B-\\u180D\\u1810-\\u1819\\u1820-\\u1877\\u1880-\\u18AA\\u18B0-\\u18F5\\u1900-\\u191E\\u1920-\\u192B\\u1930-\\u193B\\u1946-\\u196D\\u1970-\\u1974\\u1980-\\u19AB\\u19B0-\\u19C9\\u19D0-\\u19D9\\u1A00-\\u1A1B\\u1A20-\\u1A5E\\u1A60-\\u1A7C\\u1A7F-\\u1A89\\u1A90-\\u1A99\\u1AA7\\u1AB0-\\u1ABD\\u1B00-\\u1B4B\\u1B50-\\u1B59\\u1B6B-\\u1B73\\u1B80-\\u1BF3\\u1C00-\\u1C37\\u1C40-\\u1C49\\u1C4D-\\u1C7D\\u1CD0-\\u1CD2\\u1CD4-\\u1CF6\\u1CF8\\u1CF9\\u1D00-\\u1DF5\\u1DFC-\\u1F15\\u1F18-\\u1F1D\\u1F20-\\u1F45\\u1F48-\\u1F4D\\u1F50-\\u1F57\\u1F59\\u1F5B\\u1F5D\\u1F5F-\\u1F7D\\u1F80-\\u1FB4\\u1FB6-\\u1FBC\\u1FBE\\u1FC2-\\u1FC4\\u1FC6-\\u1FCC\\u1FD0-\\u1FD3\\u1FD6-\\u1FDB\\u1FE0-\\u1FEC\\u1FF2-\\u1FF4\\u1FF6-\\u1FFC\\u200C\\u200D\\u203F\\u2040\\u2054\\u2071\\u207F\\u2090-\\u209C\\u20D0-\\u20DC\\u20E1\\u20E5-\\u20F0\\u2102\\u2107\\u210A-\\u2113\\u2115\\u2119-\\u211D\\u2124\\u2126\\u2128\\u212A-\\u212D\\u212F-\\u2139\\u213C-\\u213F\\u2145-\\u2149\\u214E\\u2160-\\u2188\\u2C00-\\u2C2E\\u2C30-\\u2C5E\\u2C60-\\u2CE4\\u2CEB-\\u2CF3\\u2D00-\\u2D25\\u2D27\\u2D2D\\u2D30-\\u2D67\\u2D6F\\u2D7F-\\u2D96\\u2DA0-\\u2DA6\\u2DA8-\\u2DAE\\u2DB0-\\u2DB6\\u2DB8-\\u2DBE\\u2DC0-\\u2DC6\\u2DC8-\\u2DCE\\u2DD0-\\u2DD6\\u2DD8-\\u2DDE\\u2DE0-\\u2DFF\\u2E2F\\u3005-\\u3007\\u3021-\\u302F\\u3031-\\u3035\\u3038-\\u303C\\u3041-\\u3096\\u3099\\u309A\\u309D-\\u309F\\u30A1-\\u30FA\\u30FC-\\u30FF\\u3105-\\u312D\\u3131-\\u318E\\u31A0-\\u31BA\\u31F0-\\u31FF\\u3400-\\u4DB5\\u4E00-\\u9FCC\\uA000-\\uA48C\\uA4D0-\\uA4FD\\uA500-\\uA60C\\uA610-\\uA62B\\uA640-\\uA66F\\uA674-\\uA67D\\uA67F-\\uA69D\\uA69F-\\uA6F1\\uA717-\\uA71F\\uA722-\\uA788\\uA78B-\\uA78E\\uA790-\\uA7AD\\uA7B0\\uA7B1\\uA7F7-\\uA827\\uA840-\\uA873\\uA880-\\uA8C4\\uA8D0-\\uA8D9\\uA8E0-\\uA8F7\\uA8FB\\uA900-\\uA92D\\uA930-\\uA953\\uA960-\\uA97C\\uA980-\\uA9C0\\uA9CF-\\uA9D9\\uA9E0-\\uA9FE\\uAA00-\\uAA36\\uAA40-\\uAA4D\\uAA50-\\uAA59\\uAA60-\\uAA76\\uAA7A-\\uAAC2\\uAADB-\\uAADD\\uAAE0-\\uAAEF\\uAAF2-\\uAAF6\\uAB01-\\uAB06\\uAB09-\\uAB0E\\uAB11-\\uAB16\\uAB20-\\uAB26\\uAB28-\\uAB2E\\uAB30-\\uAB5A\\uAB5C-\\uAB5F\\uAB64\\uAB65\\uABC0-\\uABEA\\uABEC\\uABED\\uABF0-\\uABF9\\uAC00-\\uD7A3\\uD7B0-\\uD7C6\\uD7CB-\\uD7FB\\uF900-\\uFA6D\\uFA70-\\uFAD9\\uFB00-\\uFB06\\uFB13-\\uFB17\\uFB1D-\\uFB28\\uFB2A-\\uFB36\\uFB38-\\uFB3C\\uFB3E\\uFB40\\uFB41\\uFB43\\uFB44\\uFB46-\\uFBB1\\uFBD3-\\uFD3D\\uFD50-\\uFD8F\\uFD92-\\uFDC7\\uFDF0-\\uFDFB\\uFE00-\\uFE0F\\uFE20-\\uFE2D\\uFE33\\uFE34\\uFE4D-\\uFE4F\\uFE70-\\uFE74\\uFE76-\\uFEFC\\uFF10-\\uFF19\\uFF21-\\uFF3A\\uFF3F\\uFF41-\\uFF5A\\uFF66-\\uFFBE\\uFFC2-\\uFFC7\\uFFCA-\\uFFCF\\uFFD2-\\uFFD7\\uFFDA-\\uFFDC]'); // Ensure the condition is true, otherwise throw an error.
  // This is only to have a better contract semantic, i.e. another safety net
  // to catch a logic error. The condition shall be fulfilled in normal case.
  // Do NOT use this to enforce a certain condition on any user input.

  function assert(condition, message) {
    /* istanbul ignore next */
    if (!condition) {
      throw new Error('ASSERT: ' + message);
    }
  }

  function isDecimalDigit(ch) {
    return ch >= 0x30 && ch <= 0x39; // 0..9
  }

  function isHexDigit(ch) {
    return '0123456789abcdefABCDEF'.indexOf(ch) >= 0;
  }

  function isOctalDigit(ch) {
    return '01234567'.indexOf(ch) >= 0;
  } // 7.2 White Space


  function isWhiteSpace(ch) {
    return ch === 0x20 || ch === 0x09 || ch === 0x0B || ch === 0x0C || ch === 0xA0 || ch >= 0x1680 && [0x1680, 0x180E, 0x2000, 0x2001, 0x2002, 0x2003, 0x2004, 0x2005, 0x2006, 0x2007, 0x2008, 0x2009, 0x200A, 0x202F, 0x205F, 0x3000, 0xFEFF].indexOf(ch) >= 0;
  } // 7.3 Line Terminators


  function isLineTerminator(ch) {
    return ch === 0x0A || ch === 0x0D || ch === 0x2028 || ch === 0x2029;
  } // 7.6 Identifier Names and Identifiers


  function isIdentifierStart(ch) {
    return ch === 0x24 || ch === 0x5F || // $ (dollar) and _ (underscore)
    ch >= 0x41 && ch <= 0x5A || // A..Z
    ch >= 0x61 && ch <= 0x7A || // a..z
    ch === 0x5C || // \ (backslash)
    ch >= 0x80 && RegexNonAsciiIdentifierStart.test(String.fromCharCode(ch));
  }

  function isIdentifierPart(ch) {
    return ch === 0x24 || ch === 0x5F || // $ (dollar) and _ (underscore)
    ch >= 0x41 && ch <= 0x5A || // A..Z
    ch >= 0x61 && ch <= 0x7A || // a..z
    ch >= 0x30 && ch <= 0x39 || // 0..9
    ch === 0x5C || // \ (backslash)
    ch >= 0x80 && RegexNonAsciiIdentifierPart.test(String.fromCharCode(ch));
  } // 7.6.1.1 Keywords


  const keywords = {
    'if': 1,
    'in': 1,
    'do': 1,
    'var': 1,
    'for': 1,
    'new': 1,
    'try': 1,
    'let': 1,
    'this': 1,
    'else': 1,
    'case': 1,
    'void': 1,
    'with': 1,
    'enum': 1,
    'while': 1,
    'break': 1,
    'catch': 1,
    'throw': 1,
    'const': 1,
    'yield': 1,
    'class': 1,
    'super': 1,
    'return': 1,
    'typeof': 1,
    'delete': 1,
    'switch': 1,
    'export': 1,
    'import': 1,
    'public': 1,
    'static': 1,
    'default': 1,
    'finally': 1,
    'extends': 1,
    'package': 1,
    'private': 1,
    'function': 1,
    'continue': 1,
    'debugger': 1,
    'interface': 1,
    'protected': 1,
    'instanceof': 1,
    'implements': 1
  };

  function skipComment() {
    while (index < length) {
      const ch = source.charCodeAt(index);

      if (isWhiteSpace(ch) || isLineTerminator(ch)) {
        ++index;
      } else {
        break;
      }
    }
  }

  function scanHexEscape(prefix) {
    var i,
        len,
        ch,
        code = 0;
    len = prefix === 'u' ? 4 : 2;

    for (i = 0; i < len; ++i) {
      if (index < length && isHexDigit(source[index])) {
        ch = source[index++];
        code = code * 16 + '0123456789abcdef'.indexOf(ch.toLowerCase());
      } else {
        throwError({}, MessageUnexpectedToken, ILLEGAL);
      }
    }

    return String.fromCharCode(code);
  }

  function scanUnicodeCodePointEscape() {
    var ch, code, cu1, cu2;
    ch = source[index];
    code = 0; // At least, one hex digit is required.

    if (ch === '}') {
      throwError({}, MessageUnexpectedToken, ILLEGAL);
    }

    while (index < length) {
      ch = source[index++];

      if (!isHexDigit(ch)) {
        break;
      }

      code = code * 16 + '0123456789abcdef'.indexOf(ch.toLowerCase());
    }

    if (code > 0x10FFFF || ch !== '}') {
      throwError({}, MessageUnexpectedToken, ILLEGAL);
    } // UTF-16 Encoding


    if (code <= 0xFFFF) {
      return String.fromCharCode(code);
    }

    cu1 = (code - 0x10000 >> 10) + 0xD800;
    cu2 = (code - 0x10000 & 1023) + 0xDC00;
    return String.fromCharCode(cu1, cu2);
  }

  function getEscapedIdentifier() {
    var ch, id;
    ch = source.charCodeAt(index++);
    id = String.fromCharCode(ch); // '\u' (U+005C, U+0075) denotes an escaped character.

    if (ch === 0x5C) {
      if (source.charCodeAt(index) !== 0x75) {
        throwError({}, MessageUnexpectedToken, ILLEGAL);
      }

      ++index;
      ch = scanHexEscape('u');

      if (!ch || ch === '\\' || !isIdentifierStart(ch.charCodeAt(0))) {
        throwError({}, MessageUnexpectedToken, ILLEGAL);
      }

      id = ch;
    }

    while (index < length) {
      ch = source.charCodeAt(index);

      if (!isIdentifierPart(ch)) {
        break;
      }

      ++index;
      id += String.fromCharCode(ch); // '\u' (U+005C, U+0075) denotes an escaped character.

      if (ch === 0x5C) {
        id = id.substr(0, id.length - 1);

        if (source.charCodeAt(index) !== 0x75) {
          throwError({}, MessageUnexpectedToken, ILLEGAL);
        }

        ++index;
        ch = scanHexEscape('u');

        if (!ch || ch === '\\' || !isIdentifierPart(ch.charCodeAt(0))) {
          throwError({}, MessageUnexpectedToken, ILLEGAL);
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
    start = index; // Backslash (U+005C) starts an escaped character.

    id = source.charCodeAt(index) === 0x5C ? getEscapedIdentifier() : getIdentifier(); // There is no keyword or literal with only one character.
    // Thus, it must be an identifier.

    if (id.length === 1) {
      type = TokenIdentifier;
    } else if (keywords.hasOwnProperty(id)) {
      // eslint-disable-line no-prototype-builtins
      type = TokenKeyword;
    } else if (id === 'null') {
      type = TokenNullLiteral;
    } else if (id === 'true' || id === 'false') {
      type = TokenBooleanLiteral;
    } else {
      type = TokenIdentifier;
    }

    return {
      type: type,
      value: id,
      start: start,
      end: index
    };
  } // 7.7 Punctuators


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
      case 0x2E: // . dot

      case 0x28: // ( open bracket

      case 0x29: // ) close bracket

      case 0x3B: // ; semicolon

      case 0x2C: // , comma

      case 0x7B: // { open curly brace

      case 0x7D: // } close curly brace

      case 0x5B: // [

      case 0x5D: // ]

      case 0x3A: // :

      case 0x3F: // ?

      case 0x7E:
        // ~
        ++index;
        return {
          type: TokenPunctuator,
          value: String.fromCharCode(code),
          start: start,
          end: index
        };

      default:
        code2 = source.charCodeAt(index + 1); // '=' (U+003D) marks an assignment or comparison operator.

        if (code2 === 0x3D) {
          switch (code) {
            case 0x2B: // +

            case 0x2D: // -

            case 0x2F: // /

            case 0x3C: // <

            case 0x3E: // >

            case 0x5E: // ^

            case 0x7C: // |

            case 0x25: // %

            case 0x26: // &

            case 0x2A:
              // *
              index += 2;
              return {
                type: TokenPunctuator,
                value: String.fromCharCode(code) + String.fromCharCode(code2),
                start: start,
                end: index
              };

            case 0x21: // !

            case 0x3D:
              // =
              index += 2; // !== and ===

              if (source.charCodeAt(index) === 0x3D) {
                ++index;
              }

              return {
                type: TokenPunctuator,
                value: source.slice(start, index),
                start: start,
                end: index
              };
          }
        }

    } // 4-character punctuator: >>>=


    ch4 = source.substr(index, 4);

    if (ch4 === '>>>=') {
      index += 4;
      return {
        type: TokenPunctuator,
        value: ch4,
        start: start,
        end: index
      };
    } // 3-character punctuators: === !== >>> <<= >>=


    ch3 = ch4.substr(0, 3);

    if (ch3 === '>>>' || ch3 === '<<=' || ch3 === '>>=') {
      index += 3;
      return {
        type: TokenPunctuator,
        value: ch3,
        start: start,
        end: index
      };
    } // Other 2-character punctuators: ++ -- << >> && ||


    ch2 = ch3.substr(0, 2);

    if (ch1 === ch2[1] && '+-<>&|'.indexOf(ch1) >= 0 || ch2 === '=>') {
      index += 2;
      return {
        type: TokenPunctuator,
        value: ch2,
        start: start,
        end: index
      };
    } // 1-character punctuators: < > = ! + - * % & | ^ /


    if ('<>=!+-*%&|^/'.indexOf(ch1) >= 0) {
      ++index;
      return {
        type: TokenPunctuator,
        value: ch1,
        start: start,
        end: index
      };
    }

    throwError({}, MessageUnexpectedToken, ILLEGAL);
  } // 7.8.3 Numeric Literals


  function scanHexLiteral(start) {
    let number = '';

    while (index < length) {
      if (!isHexDigit(source[index])) {
        break;
      }

      number += source[index++];
    }

    if (number.length === 0) {
      throwError({}, MessageUnexpectedToken, ILLEGAL);
    }

    if (isIdentifierStart(source.charCodeAt(index))) {
      throwError({}, MessageUnexpectedToken, ILLEGAL);
    }

    return {
      type: TokenNumericLiteral,
      value: parseInt('0x' + number, 16),
      start: start,
      end: index
    };
  }

  function scanOctalLiteral(start) {
    let number = '0' + source[index++];

    while (index < length) {
      if (!isOctalDigit(source[index])) {
        break;
      }

      number += source[index++];
    }

    if (isIdentifierStart(source.charCodeAt(index)) || isDecimalDigit(source.charCodeAt(index))) {
      throwError({}, MessageUnexpectedToken, ILLEGAL);
    }

    return {
      type: TokenNumericLiteral,
      value: parseInt(number, 8),
      octal: true,
      start: start,
      end: index
    };
  }

  function scanNumericLiteral() {
    var number, start, ch;
    ch = source[index];
    assert(isDecimalDigit(ch.charCodeAt(0)) || ch === '.', 'Numeric literal must start with a decimal digit or a decimal point');
    start = index;
    number = '';

    if (ch !== '.') {
      number = source[index++];
      ch = source[index]; // Hex number starts with '0x'.
      // Octal number starts with '0'.

      if (number === '0') {
        if (ch === 'x' || ch === 'X') {
          ++index;
          return scanHexLiteral(start);
        }

        if (isOctalDigit(ch)) {
          return scanOctalLiteral(start);
        } // decimal number starts with '0' such as '09' is illegal.


        if (ch && isDecimalDigit(ch.charCodeAt(0))) {
          throwError({}, MessageUnexpectedToken, ILLEGAL);
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
        throwError({}, MessageUnexpectedToken, ILLEGAL);
      }
    }

    if (isIdentifierStart(source.charCodeAt(index))) {
      throwError({}, MessageUnexpectedToken, ILLEGAL);
    }

    return {
      type: TokenNumericLiteral,
      value: parseFloat(number),
      start: start,
      end: index
    };
  } // 7.8.4 String Literals


  function scanStringLiteral() {
    var str = '',
        quote,
        start,
        ch,
        code,
        octal = false;
    quote = source[index];
    assert(quote === '\'' || quote === '"', 'String literal must starts with a quote');
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
                str += scanHexEscape(ch);
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
                code = '01234567'.indexOf(ch); // \0 is not octal escape sequence

                if (code !== 0) {
                  octal = true;
                }

                if (index < length && isOctalDigit(source[index])) {
                  octal = true;
                  code = code * 8 + '01234567'.indexOf(source[index++]); // 3 digits are only allowed when string starts
                  // with 0, 1, 2, 3

                  if ('0123'.indexOf(ch) >= 0 && index < length && isOctalDigit(source[index])) {
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
          if (ch === '\r' && source[index] === '\n') {
            ++index;
          }
        }
      } else if (isLineTerminator(ch.charCodeAt(0))) {
        break;
      } else {
        str += ch;
      }
    }

    if (quote !== '') {
      throwError({}, MessageUnexpectedToken, ILLEGAL);
    }

    return {
      type: TokenStringLiteral,
      value: str,
      octal: octal,
      start: start,
      end: index
    };
  }

  function testRegExp(pattern, flags) {
    let tmp = pattern;

    if (flags.indexOf('u') >= 0) {
      // Replace each astral symbol and every Unicode code point
      // escape sequence with a single ASCII symbol to avoid throwing on
      // regular expressions that are only valid in combination with the
      // `/u` flag.
      // Note: replacing with the ASCII symbol `x` might cause false
      // negatives in unlikely scenarios. For example, `[\u{61}-b]` is a
      // perfectly valid pattern that is equivalent to `[a-b]`, but it
      // would be replaced by `[x-b]` which throws an error.
      tmp = tmp.replace(/\\u\{([0-9a-fA-F]+)\}/g, ($0, $1) => {
        if (parseInt($1, 16) <= 0x10FFFF) {
          return 'x';
        }

        throwError({}, MessageInvalidRegExp);
      }).replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, 'x');
    } // First, detect invalid regular expressions.


    try {
      new RegExp(tmp);
    } catch (e) {
      throwError({}, MessageInvalidRegExp);
    } // Return a regular expression object for this pattern-flag pair, or
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
        ch = source[index++]; // ECMA-262 7.8.5

        if (isLineTerminator(ch.charCodeAt(0))) {
          throwError({}, MessageUnterminatedRegExp);
        }

        str += ch;
      } else if (isLineTerminator(ch.charCodeAt(0))) {
        throwError({}, MessageUnterminatedRegExp);
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
      throwError({}, MessageUnterminatedRegExp);
    } // Exclude leading and trailing slash.


    body = str.substr(1, str.length - 2);
    return {
      value: body,
      literal: str
    };
  }

  function scanRegExpFlags() {
    var ch, str, flags;
    str = '';
    flags = '';

    while (index < length) {
      ch = source[index];

      if (!isIdentifierPart(ch.charCodeAt(0))) {
        break;
      }

      ++index;

      if (ch === '\\' && index < length) {
        throwError({}, MessageUnexpectedToken, ILLEGAL);
      } else {
        flags += ch;
        str += ch;
      }
    }

    if (flags.search(/[^gimuy]/g) >= 0) {
      throwError({}, MessageInvalidRegExp, flags);
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

  function isIdentifierName(token) {
    return token.type === TokenIdentifier || token.type === TokenKeyword || token.type === TokenBooleanLiteral || token.type === TokenNullLiteral;
  }

  function advance() {
    skipComment();

    if (index >= length) {
      return {
        type: TokenEOF,
        start: index,
        end: index
      };
    }

    const ch = source.charCodeAt(index);

    if (isIdentifierStart(ch)) {
      return scanIdentifier();
    } // Very common: ( and ) and ;


    if (ch === 0x28 || ch === 0x29 || ch === 0x3B) {
      return scanPunctuator();
    } // String literal starts with single quote (U+0027) or double quote (U+0022).


    if (ch === 0x27 || ch === 0x22) {
      return scanStringLiteral();
    } // Dot (.) U+002E can also start a floating-point number, hence the need
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

    return scanPunctuator();
  }

  function lex() {
    const token = lookahead;
    index = token.end;
    lookahead = advance();
    index = token.end;
    return token;
  }

  function peek() {
    const pos = index;
    lookahead = advance();
    index = pos;
  }

  function finishArrayExpression(elements) {
    const node = new ASTNode(SyntaxArrayExpression);
    node.elements = elements;
    return node;
  }

  function finishBinaryExpression(operator, left, right) {
    const node = new ASTNode(operator === '||' || operator === '&&' ? SyntaxLogicalExpression : SyntaxBinaryExpression);
    node.operator = operator;
    node.left = left;
    node.right = right;
    return node;
  }

  function finishCallExpression(callee, args) {
    const node = new ASTNode(SyntaxCallExpression);
    node.callee = callee;
    node.arguments = args;
    return node;
  }

  function finishConditionalExpression(test, consequent, alternate) {
    const node = new ASTNode(SyntaxConditionalExpression);
    node.test = test;
    node.consequent = consequent;
    node.alternate = alternate;
    return node;
  }

  function finishIdentifier(name) {
    const node = new ASTNode(SyntaxIdentifier);
    node.name = name;
    return node;
  }

  function finishLiteral(token) {
    const node = new ASTNode(SyntaxLiteral);
    node.value = token.value;
    node.raw = source.slice(token.start, token.end);

    if (token.regex) {
      if (node.raw === '//') {
        node.raw = '/(?:)/';
      }

      node.regex = token.regex;
    }

    return node;
  }

  function finishMemberExpression(accessor, object, property) {
    const node = new ASTNode(SyntaxMemberExpression);
    node.computed = accessor === '[';
    node.object = object;
    node.property = property;
    if (!node.computed) property.member = true;
    return node;
  }

  function finishObjectExpression(properties) {
    const node = new ASTNode(SyntaxObjectExpression);
    node.properties = properties;
    return node;
  }

  function finishProperty(kind, key, value) {
    const node = new ASTNode(SyntaxProperty);
    node.key = key;
    node.value = value;
    node.kind = kind;
    return node;
  }

  function finishUnaryExpression(operator, argument) {
    const node = new ASTNode(SyntaxUnaryExpression);
    node.operator = operator;
    node.argument = argument;
    node.prefix = true;
    return node;
  } // Throw an exception


  function throwError(token, messageFormat) {
    var error,
        args = Array.prototype.slice.call(arguments, 2),
        msg = messageFormat.replace(/%(\d)/g, (whole, index) => {
      assert(index < args.length, 'Message reference must be in range');
      return args[index];
    });
    error = new Error(msg);
    error.index = index;
    error.description = msg;
    throw error;
  } // Throw an exception because of the token.


  function throwUnexpected(token) {
    if (token.type === TokenEOF) {
      throwError(token, MessageUnexpectedEOS);
    }

    if (token.type === TokenNumericLiteral) {
      throwError(token, MessageUnexpectedNumber);
    }

    if (token.type === TokenStringLiteral) {
      throwError(token, MessageUnexpectedString);
    }

    if (token.type === TokenIdentifier) {
      throwError(token, MessageUnexpectedIdentifier);
    }

    if (token.type === TokenKeyword) {
      throwError(token, MessageUnexpectedReserved);
    } // BooleanLiteral, NullLiteral, or Punctuator.


    throwError(token, MessageUnexpectedToken, token.value);
  } // Expect the next token to match the specified punctuator.
  // If not, an exception will be thrown.


  function expect(value) {
    const token = lex();

    if (token.type !== TokenPunctuator || token.value !== value) {
      throwUnexpected(token);
    }
  } // Return true if the next token matches the specified punctuator.


  function match(value) {
    return lookahead.type === TokenPunctuator && lookahead.value === value;
  } // Return true if the next token matches the specified keyword


  function matchKeyword(keyword) {
    return lookahead.type === TokenKeyword && lookahead.value === keyword;
  } // 11.1.4 Array Initialiser


  function parseArrayInitialiser() {
    const elements = [];
    index = lookahead.start;
    expect('[');

    while (!match(']')) {
      if (match(',')) {
        lex();
        elements.push(null);
      } else {
        elements.push(parseConditionalExpression());

        if (!match(']')) {
          expect(',');
        }
      }
    }

    lex();
    return finishArrayExpression(elements);
  } // 11.1.5 Object Initialiser


  function parseObjectPropertyKey() {
    index = lookahead.start;
    const token = lex(); // Note: This function is called only from parseObjectProperty(), where
    // EOF and Punctuator tokens are already filtered out.

    if (token.type === TokenStringLiteral || token.type === TokenNumericLiteral) {
      if (token.octal) {
        throwError(token, MessageStrictOctalLiteral);
      }

      return finishLiteral(token);
    }

    return finishIdentifier(token.value);
  }

  function parseObjectProperty() {
    var token, key, id, value;
    index = lookahead.start;
    token = lookahead;

    if (token.type === TokenIdentifier) {
      id = parseObjectPropertyKey();
      expect(':');
      value = parseConditionalExpression();
      return finishProperty('init', id, value);
    }

    if (token.type === TokenEOF || token.type === TokenPunctuator) {
      throwUnexpected(token);
    } else {
      key = parseObjectPropertyKey();
      expect(':');
      value = parseConditionalExpression();
      return finishProperty('init', key, value);
    }
  }

  function parseObjectInitialiser() {
    var properties = [],
        property,
        name,
        key,
        map = {},
        toString = String;
    index = lookahead.start;
    expect('{');

    while (!match('}')) {
      property = parseObjectProperty();

      if (property.key.type === SyntaxIdentifier) {
        name = property.key.name;
      } else {
        name = toString(property.key.value);
      }

      key = '$' + name;

      if (Object.prototype.hasOwnProperty.call(map, key)) {
        throwError({}, MessageStrictDuplicateProperty);
      } else {
        map[key] = true;
      }

      properties.push(property);

      if (!match('}')) {
        expect(',');
      }
    }

    expect('}');
    return finishObjectExpression(properties);
  } // 11.1.6 The Grouping Operator


  function parseGroupExpression() {
    expect('(');
    const expr = parseExpression();
    expect(')');
    return expr;
  } // 11.1 Primary Expressions


  const legalKeywords = {
    'if': 1
  };

  function parsePrimaryExpression() {
    var type, token, expr;

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
    index = lookahead.start;

    if (type === TokenIdentifier || legalKeywords[lookahead.value]) {
      expr = finishIdentifier(lex().value);
    } else if (type === TokenStringLiteral || type === TokenNumericLiteral) {
      if (lookahead.octal) {
        throwError(lookahead, MessageStrictOctalLiteral);
      }

      expr = finishLiteral(lex());
    } else if (type === TokenKeyword) {
      throw new Error(DISABLED);
    } else if (type === TokenBooleanLiteral) {
      token = lex();
      token.value = token.value === 'true';
      expr = finishLiteral(token);
    } else if (type === TokenNullLiteral) {
      token = lex();
      token.value = null;
      expr = finishLiteral(token);
    } else if (match('/') || match('/=')) {
      expr = finishLiteral(scanRegExp());
      peek();
    } else {
      throwUnexpected(lex());
    }

    return expr;
  } // 11.2 Left-Hand-Side Expressions


  function parseArguments() {
    const args = [];
    expect('(');

    if (!match(')')) {
      while (index < length) {
        args.push(parseConditionalExpression());

        if (match(')')) {
          break;
        }

        expect(',');
      }
    }

    expect(')');
    return args;
  }

  function parseNonComputedProperty() {
    index = lookahead.start;
    const token = lex();

    if (!isIdentifierName(token)) {
      throwUnexpected(token);
    }

    return finishIdentifier(token.value);
  }

  function parseNonComputedMember() {
    expect('.');
    return parseNonComputedProperty();
  }

  function parseComputedMember() {
    expect('[');
    const expr = parseExpression();
    expect(']');
    return expr;
  }

  function parseLeftHandSideExpressionAllowCall() {
    var expr, args, property;
    expr = parsePrimaryExpression();

    for (;;) {
      if (match('.')) {
        property = parseNonComputedMember();
        expr = finishMemberExpression('.', expr, property);
      } else if (match('(')) {
        args = parseArguments();
        expr = finishCallExpression(expr, args);
      } else if (match('[')) {
        property = parseComputedMember();
        expr = finishMemberExpression('[', expr, property);
      } else {
        break;
      }
    }

    return expr;
  } // 11.3 Postfix Expressions


  function parsePostfixExpression() {
    const expr = parseLeftHandSideExpressionAllowCall();

    if (lookahead.type === TokenPunctuator) {
      if (match('++') || match('--')) {
        throw new Error(DISABLED);
      }
    }

    return expr;
  } // 11.4 Unary Operators


  function parseUnaryExpression() {
    var token, expr;

    if (lookahead.type !== TokenPunctuator && lookahead.type !== TokenKeyword) {
      expr = parsePostfixExpression();
    } else if (match('++') || match('--')) {
      throw new Error(DISABLED);
    } else if (match('+') || match('-') || match('~') || match('!')) {
      token = lex();
      expr = parseUnaryExpression();
      expr = finishUnaryExpression(token.value, expr);
    } else if (matchKeyword('delete') || matchKeyword('void') || matchKeyword('typeof')) {
      throw new Error(DISABLED);
    } else {
      expr = parsePostfixExpression();
    }

    return expr;
  }

  function binaryPrecedence(token) {
    let prec = 0;

    if (token.type !== TokenPunctuator && token.type !== TokenKeyword) {
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
      case 'in':
        prec = 7;
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
    }

    return prec;
  } // 11.5 Multiplicative Operators
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
    prec = binaryPrecedence(token);

    if (prec === 0) {
      return left;
    }

    token.prec = prec;
    lex();
    markers = [marker, lookahead];
    right = parseUnaryExpression();
    stack = [left, token, right];

    while ((prec = binaryPrecedence(lookahead)) > 0) {
      // Reduce: make a binary expression from the three topmost entries.
      while (stack.length > 2 && prec <= stack[stack.length - 2].prec) {
        right = stack.pop();
        operator = stack.pop().value;
        left = stack.pop();
        markers.pop();
        expr = finishBinaryExpression(operator, left, right);
        stack.push(expr);
      } // Shift.


      token = lex();
      token.prec = prec;
      stack.push(token);
      markers.push(lookahead);
      expr = parseUnaryExpression();
      stack.push(expr);
    } // Final reduce to clean-up the stack.


    i = stack.length - 1;
    expr = stack[i];
    markers.pop();

    while (i > 1) {
      markers.pop();
      expr = finishBinaryExpression(stack[i - 1].value, stack[i - 2], expr);
      i -= 2;
    }

    return expr;
  } // 11.12 Conditional Operator


  function parseConditionalExpression() {
    var expr, consequent, alternate;
    expr = parseBinaryExpression();

    if (match('?')) {
      lex();
      consequent = parseConditionalExpression();
      expect(':');
      alternate = parseConditionalExpression();
      expr = finishConditionalExpression(expr, consequent, alternate);
    }

    return expr;
  } // 11.14 Comma Operator


  function parseExpression() {
    const expr = parseConditionalExpression();

    if (match(',')) {
      throw new Error(DISABLED); // no sequence expressions
    }

    return expr;
  }

  function parser(code) {
    source = code;
    index = 0;
    length = source.length;
    lookahead = null;
    peek();
    const expr = parseExpression();

    if (lookahead.type !== TokenEOF) {
      throw new Error('Unexpect token after expression.');
    }

    return expr;
  }

  var Constants = {
    NaN: 'NaN',
    E: 'Math.E',
    LN2: 'Math.LN2',
    LN10: 'Math.LN10',
    LOG2E: 'Math.LOG2E',
    LOG10E: 'Math.LOG10E',
    PI: 'Math.PI',
    SQRT1_2: 'Math.SQRT1_2',
    SQRT2: 'Math.SQRT2',
    MIN_VALUE: 'Number.MIN_VALUE',
    MAX_VALUE: 'Number.MAX_VALUE'
  };

  function Functions(codegen) {
    function fncall(name, args, cast, type) {
      let obj = codegen(args[0]);

      if (cast) {
        obj = cast + '(' + obj + ')';
        if (cast.lastIndexOf('new ', 0) === 0) obj = '(' + obj + ')';
      }

      return obj + '.' + name + (type < 0 ? '' : type === 0 ? '()' : '(' + args.slice(1).map(codegen).join(',') + ')');
    }

    function fn(name, cast, type) {
      return args => fncall(name, args, cast, type);
    }

    const DATE = 'new Date',
          STRING = 'String',
          REGEXP = 'RegExp';
    return {
      // MATH functions
      isNaN: 'Number.isNaN',
      isFinite: 'Number.isFinite',
      abs: 'Math.abs',
      acos: 'Math.acos',
      asin: 'Math.asin',
      atan: 'Math.atan',
      atan2: 'Math.atan2',
      ceil: 'Math.ceil',
      cos: 'Math.cos',
      exp: 'Math.exp',
      floor: 'Math.floor',
      log: 'Math.log',
      max: 'Math.max',
      min: 'Math.min',
      pow: 'Math.pow',
      random: 'Math.random',
      round: 'Math.round',
      sin: 'Math.sin',
      sqrt: 'Math.sqrt',
      tan: 'Math.tan',
      clamp: function (args) {
        if (args.length < 3) error('Missing arguments to clamp function.');
        if (args.length > 3) error('Too many arguments to clamp function.');
        const a = args.map(codegen);
        return 'Math.max(' + a[1] + ', Math.min(' + a[2] + ',' + a[0] + '))';
      },
      // DATE functions
      now: 'Date.now',
      utc: 'Date.UTC',
      datetime: DATE,
      date: fn('getDate', DATE, 0),
      day: fn('getDay', DATE, 0),
      year: fn('getFullYear', DATE, 0),
      month: fn('getMonth', DATE, 0),
      hours: fn('getHours', DATE, 0),
      minutes: fn('getMinutes', DATE, 0),
      seconds: fn('getSeconds', DATE, 0),
      milliseconds: fn('getMilliseconds', DATE, 0),
      time: fn('getTime', DATE, 0),
      timezoneoffset: fn('getTimezoneOffset', DATE, 0),
      utcdate: fn('getUTCDate', DATE, 0),
      utcday: fn('getUTCDay', DATE, 0),
      utcyear: fn('getUTCFullYear', DATE, 0),
      utcmonth: fn('getUTCMonth', DATE, 0),
      utchours: fn('getUTCHours', DATE, 0),
      utcminutes: fn('getUTCMinutes', DATE, 0),
      utcseconds: fn('getUTCSeconds', DATE, 0),
      utcmilliseconds: fn('getUTCMilliseconds', DATE, 0),
      // sequence functions
      length: fn('length', null, -1),
      join: fn('join', null),
      indexof: fn('indexOf', null),
      lastindexof: fn('lastIndexOf', null),
      slice: fn('slice', null),
      reverse: function (args) {
        return '(' + codegen(args[0]) + ').slice().reverse()';
      },
      // STRING functions
      parseFloat: 'parseFloat',
      parseInt: 'parseInt',
      upper: fn('toUpperCase', STRING, 0),
      lower: fn('toLowerCase', STRING, 0),
      substring: fn('substring', STRING),
      split: fn('split', STRING),
      replace: fn('replace', STRING),
      trim: fn('trim', STRING, 0),
      // REGEXP functions
      regexp: REGEXP,
      test: fn('test', REGEXP),
      // Control Flow functions
      if: function (args) {
        if (args.length < 3) error('Missing arguments to if function.');
        if (args.length > 3) error('Too many arguments to if function.');
        const a = args.map(codegen);
        return '(' + a[0] + '?' + a[1] + ':' + a[2] + ')';
      }
    };
  }

  function stripQuotes(s) {
    const n = s && s.length - 1;
    return n && (s[0] === '"' && s[n] === '"' || s[0] === '\'' && s[n] === '\'') ? s.slice(1, -1) : s;
  }

  function codegen(opt) {
    opt = opt || {};
    const allowed = opt.allowed ? toSet(opt.allowed) : {},
          forbidden = opt.forbidden ? toSet(opt.forbidden) : {},
          constants = opt.constants || Constants,
          functions = (opt.functions || Functions)(visit),
          globalvar = opt.globalvar,
          fieldvar = opt.fieldvar,
          outputGlobal = isFunction(globalvar) ? globalvar : id => "".concat(globalvar, "[\"").concat(id, "\"]");
    let globals = {},
        fields = {},
        memberDepth = 0;

    function visit(ast) {
      if (isString(ast)) return ast;
      const generator = Generators[ast.type];
      if (generator == null) error('Unsupported type: ' + ast.type);
      return generator(ast);
    }

    const Generators = {
      Literal: n => n.raw,
      Identifier: n => {
        const id = n.name;

        if (memberDepth > 0) {
          return id;
        } else if (has(forbidden, id)) {
          return error('Illegal identifier: ' + id);
        } else if (has(constants, id)) {
          return constants[id];
        } else if (has(allowed, id)) {
          return id;
        } else {
          globals[id] = 1;
          return outputGlobal(id);
        }
      },
      MemberExpression: n => {
        const d = !n.computed,
              o = visit(n.object);
        if (d) memberDepth += 1;
        const p = visit(n.property);

        if (o === fieldvar) {
          // strip quotes to sanitize field name (#1653)
          fields[stripQuotes(p)] = 1;
        }

        if (d) memberDepth -= 1;
        return o + (d ? '.' + p : '[' + p + ']');
      },
      CallExpression: n => {
        if (n.callee.type !== 'Identifier') {
          error('Illegal callee type: ' + n.callee.type);
        }

        const callee = n.callee.name,
              args = n.arguments,
              fn = has(functions, callee) && functions[callee];
        if (!fn) error('Unrecognized function: ' + callee);
        return isFunction(fn) ? fn(args) : fn + '(' + args.map(visit).join(',') + ')';
      },
      ArrayExpression: n => '[' + n.elements.map(visit).join(',') + ']',
      BinaryExpression: n => '(' + visit(n.left) + n.operator + visit(n.right) + ')',
      UnaryExpression: n => '(' + n.operator + visit(n.argument) + ')',
      ConditionalExpression: n => '(' + visit(n.test) + '?' + visit(n.consequent) + ':' + visit(n.alternate) + ')',
      LogicalExpression: n => '(' + visit(n.left) + n.operator + visit(n.right) + ')',
      ObjectExpression: n => '{' + n.properties.map(visit).join(',') + '}',
      Property: n => {
        memberDepth += 1;
        const k = visit(n.key);
        memberDepth -= 1;
        return k + ':' + visit(n.value);
      }
    };

    function codegen(ast) {
      const result = {
        code: visit(ast),
        globals: Object.keys(globals),
        fields: Object.keys(fields)
      };
      globals = {};
      fields = {};
      return result;
    }

    codegen.functions = functions;
    codegen.constants = constants;
    return codegen;
  }

  var vegaExpression_module = /*#__PURE__*/Object.freeze({
    __proto__: null,
    ASTNode: ASTNode,
    ArrayExpression: ArrayExpression,
    BinaryExpression: BinaryExpression,
    CallExpression: CallExpression,
    ConditionalExpression: ConditionalExpression,
    Identifier: Identifier,
    Literal: Literal,
    LogicalExpression: LogicalExpression,
    MemberExpression: MemberExpression,
    ObjectExpression: ObjectExpression,
    Property: Property,
    RawCode: RawCode,
    UnaryExpression: UnaryExpression,
    codegen: codegen,
    constants: Constants,
    functions: Functions,
    parse: parser
  });

  var TYPES = {
    QUANTITATIVE: 'quantitative',
    ORDINAL: 'ordinal',
    TEMPORAL: 'temporal',
    NOMINAL: 'nominal',
    GEOJSON: 'geojson'
  };
  var CHANNELS = ["x", "y", "color", "shape", "size", "text", "row", "column"];
  var OPS = ["equal", "lt", "lte", "gt", "gte", "range", "oneOf", "valid"];
  var LOGIC_OPS = ["and", "or", "not"];
  var constants = {
    TYPES: TYPES,
    CHANNELS: CHANNELS,
    OPS: OPS,
    LOGIC_OPS: LOGIC_OPS
  };

  function createCommonjsModule(fn, basedir, module) {
  	return module = {
  		path: basedir,
  		exports: {},
  		require: function (path, base) {
  			return commonjsRequire(path, (base === undefined || base === null) ? module.path : base);
  		}
  	}, fn(module, module.exports), module.exports;
  }

  function getAugmentedNamespace(n) {
  	if (n.__esModule) return n;
  	var a = Object.defineProperty({}, '__esModule', {value: true});
  	Object.keys(n).forEach(function (k) {
  		var d = Object.getOwnPropertyDescriptor(n, k);
  		Object.defineProperty(a, k, d.get ? d : {
  			enumerable: true,
  			get: function () {
  				return n[k];
  			}
  		});
  	});
  	return a;
  }

  function commonjsRequire () {
  	throw new Error('Dynamic requires are not currently supported by @rollup/plugin-commonjs');
  }

  var util = createCommonjsModule(function (module, exports) {

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

    function json(s, sp) {
      return JSON.stringify(s, null, sp);
    }

    exports.json = json;

    function keys(obj) {
      var k = [],
          x;

      for (x in obj) {
        k.push(x);
      }

      return k;
    }

    exports.keys = keys;

    function duplicate(obj) {
      return JSON.parse(JSON.stringify(obj));
    }

    exports.duplicate = duplicate;

    function forEach(obj, f, thisArg) {
      if (obj.forEach) {
        obj.forEach.call(thisArg, f);
      } else {
        for (var k in obj) {
          f.call(thisArg, obj[k], k, obj);
        }
      }
    }

    exports.forEach = forEach;

    function any(arr, f) {
      var i = 0,
          k;

      for (k in arr) {
        if (f(arr[k], k, i++)) {
          return true;
        }
      }

      return false;
    }

    exports.any = any;

    function nestedMap(collection, f, level, filter) {
      return level === 0 ? collection.map(f) : collection.map(function (v) {
        var r = nestedMap(v, f, level - 1);
        return filter ? r.filter(nonEmpty) : r;
      });
    }

    exports.nestedMap = nestedMap;

    function nestedReduce(collection, f, level, filter) {
      return level === 0 ? collection.reduce(f, []) : collection.map(function (v) {
        var r = nestedReduce(v, f, level - 1);
        return filter ? r.filter(nonEmpty) : r;
      });
    }

    exports.nestedReduce = nestedReduce;

    function nonEmpty(grp) {
      return !exports.isArray(grp) || grp.length > 0;
    }

    exports.nonEmpty = nonEmpty;

    function traverse(node, arr) {
      if (node.value !== undefined) {
        arr.push(node.value);
      } else {
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

    function union(a, b) {
      var o = {};
      a.forEach(function (x) {
        o[x] = true;
      });
      b.forEach(function (x) {
        o[x] = true;
      });
      return keys(o);
    }

    exports.union = union;
    var gen;

    (function (gen) {
      function getOpt(opt) {
        return (opt ? keys(opt) : []).reduce(function (c, k) {
          c[k] = opt[k];
          return c;
        }, Object.create({}));
      }

      gen.getOpt = getOpt;
    })(gen = exports.gen || (exports.gen = {}));

    function powerset(list) {
      var ps = [[]];

      for (var i = 0; i < list.length; i++) {
        for (var j = 0, len = ps.length; j < len; j++) {
          ps.push(ps[j].concat(list[i]));
        }
      }

      return ps;
    }

    exports.powerset = powerset;

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

    function chooseK(list, k) {
      var subset = [[]];
      var kArray = [];

      for (var i = 0; i < list.length; i++) {
        for (var j = 0, len = subset.length; j < len; j++) {
          var sub = subset[j].concat(list[i]);

          if (sub.length < k) {
            subset.push(sub);
          } else if (sub.length === k) {
            kArray.push(sub);
          }
        }
      }

      return kArray;
    }

    exports.chooseK = chooseK;

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
          return b.findIndex(y => deepEqual(x, y)) < 0;
        } else return find(b, f, x) < 0;
      });
    }

    exports.arrayDiff = arrayDiff;

    function unionObjectArray(a, b, f) {
      return arrayDiff(a, b, f).concat(b);
    }

    exports.unionObjectArray = unionObjectArray;

    function deepEqual(obj1, obj2) {
      if (obj1 === obj2) {
        return true;
      }

      if (isDate(obj1) && isDate(obj2)) {
        return Number(obj1) === Number(obj2);
      }

      if (typeof obj1 === "object" && obj1 !== undefined && typeof obj2 === "object" && obj2 !== undefined) {
        const props1 = Object.keys(obj1);
        const props2 = Object.keys(obj2);

        if (props1.length !== props2.length) {
          return false;
        }

        for (let i = 0; i < props1.length; i++) {
          const prop = props1[i];

          if (!Object.prototype.hasOwnProperty.call(obj2, prop) || !deepEqual(obj1[prop], obj2[prop])) {
            return false;
          }
        }

        return true;
      }

      return false;
    }

    exports.deepEqual = deepEqual;

    function isDate(o) {
      return o !== undefined && typeof o.getMonth === "function";
    }
  });

  var DEFAULT_EDIT_OPS = {
    "markEditOps": {
      "AREA_BAR": {
        "name": "AREA_BAR",
        "cost": 0.03
      },
      "AREA_LINE": {
        "name": "AREA_LINE",
        "cost": 0.02
      },
      "AREA_POINT": {
        "name": "AREA_POINT",
        "cost": 0.04
      },
      "AREA_TEXT": {
        "name": "AREA_TEXT",
        "cost": 0.08
      },
      "AREA_TICK": {
        "name": "AREA_TICK",
        "cost": 0.04
      },
      "BAR_LINE": {
        "name": "BAR_LINE",
        "cost": 0.04
      },
      "BAR_POINT": {
        "name": "BAR_POINT",
        "cost": 0.02
      },
      "BAR_TEXT": {
        "name": "BAR_TEXT",
        "cost": 0.06
      },
      "BAR_TICK": {
        "name": "BAR_TICK",
        "cost": 0.02
      },
      "LINE_POINT": {
        "name": "LINE_POINT",
        "cost": 0.03
      },
      "LINE_TEXT": {
        "name": "LINE_TEXT",
        "cost": 0.07
      },
      "LINE_TICK": {
        "name": "LINE_TICK",
        "cost": 0.03
      },
      "POINT_TEXT": {
        "name": "POINT_TEXT",
        "cost": 0.05
      },
      "POINT_TICK": {
        "name": "POINT_TICK",
        "cost": 0.01
      },
      "TEXT_TICK": {
        "name": "TEXT_TICK",
        "cost": 0.05
      }
    },
    "transformEditOps": {
      "SCALE": {
        "name": "SCALE",
        "cost": 0.6
      },
      "SORT": {
        "name": "SORT",
        "cost": 0.61
      },
      "BIN": {
        "name": "BIN",
        "cost": 0.62
      },
      "AGGREGATE": {
        "name": "AGGREGATE",
        "cost": 0.63
      },
      "ADD_FILTER": {
        "name": "ADD_FILTER",
        "cost": 0.65
      },
      "REMOVE_FILTER": {
        "name": "REMOVE_FILTER",
        "cost": 0.65
      },
      "MODIFY_FILTER": {
        "name": "MODIFY_FILTER",
        "cost": 0.64
      }
    },
    "encodingEditOps": {
      "ADD_X": {
        "name": "ADD_X",
        "cost": 4.59
      },
      "ADD_Y": {
        "name": "ADD_Y",
        "cost": 4.59
      },
      "ADD_COLOR": {
        "name": "ADD_COLOR",
        "cost": 4.55
      },
      "ADD_SHAPE": {
        "name": "ADD_SHAPE",
        "cost": 4.51
      },
      "ADD_SIZE": {
        "name": "ADD_SIZE",
        "cost": 4.53
      },
      "ADD_ROW": {
        "name": "ADD_ROW",
        "cost": 4.57
      },
      "ADD_COLUMN": {
        "name": "ADD_COLUMN",
        "cost": 4.57
      },
      "ADD_TEXT": {
        "name": "ADD_TEXT",
        "cost": 4.49
      },
      "ADD_X_COUNT": {
        "name": "ADD_X_COUNT",
        "cost": 4.58
      },
      "ADD_Y_COUNT": {
        "name": "ADD_Y_COUNT",
        "cost": 4.58
      },
      "ADD_COLOR_COUNT": {
        "name": "ADD_COLOR_COUNT",
        "cost": 4.54
      },
      "ADD_SHAPE_COUNT": {
        "name": "ADD_SHAPE_COUNT",
        "cost": 4.5
      },
      "ADD_SIZE_COUNT": {
        "name": "ADD_SIZE_COUNT",
        "cost": 4.52
      },
      "ADD_ROW_COUNT": {
        "name": "ADD_ROW_COUNT",
        "cost": 4.56
      },
      "ADD_COLUMN_COUNT": {
        "name": "ADD_COLUMN_COUNT",
        "cost": 4.56
      },
      "ADD_TEXT_COUNT": {
        "name": "ADD_TEXT_COUNT",
        "cost": 4.48
      },
      "REMOVE_X_COUNT": {
        "name": "REMOVE_X_COUNT",
        "cost": 4.58
      },
      "REMOVE_Y_COUNT": {
        "name": "REMOVE_Y_COUNT",
        "cost": 4.58
      },
      "REMOVE_COLOR_COUNT": {
        "name": "REMOVE_COLOR_COUNT",
        "cost": 4.54
      },
      "REMOVE_SHAPE_COUNT": {
        "name": "REMOVE_SHAPE_COUNT",
        "cost": 4.5
      },
      "REMOVE_SIZE_COUNT": {
        "name": "REMOVE_SIZE_COUNT",
        "cost": 4.52
      },
      "REMOVE_ROW_COUNT": {
        "name": "REMOVE_ROW_COUNT",
        "cost": 4.56
      },
      "REMOVE_COLUMN_COUNT": {
        "name": "REMOVE_COLUMN_COUNT",
        "cost": 4.56
      },
      "REMOVE_TEXT_COUNT": {
        "name": "REMOVE_TEXT_COUNT",
        "cost": 4.48
      },
      "REMOVE_X": {
        "name": "REMOVE_X",
        "cost": 4.59
      },
      "REMOVE_Y": {
        "name": "REMOVE_Y",
        "cost": 4.59
      },
      "REMOVE_COLOR": {
        "name": "REMOVE_COLOR",
        "cost": 4.55
      },
      "REMOVE_SHAPE": {
        "name": "REMOVE_SHAPE",
        "cost": 4.51
      },
      "REMOVE_SIZE": {
        "name": "REMOVE_SIZE",
        "cost": 4.53
      },
      "REMOVE_ROW": {
        "name": "REMOVE_ROW",
        "cost": 4.57
      },
      "REMOVE_COLUMN": {
        "name": "REMOVE_COLUMN",
        "cost": 4.57
      },
      "REMOVE_TEXT": {
        "name": "REMOVE_TEXT",
        "cost": 4.49
      },
      "MODIFY_X": {
        "name": "MODIFY_X",
        "cost": 4.71
      },
      "MODIFY_Y": {
        "name": "MODIFY_Y",
        "cost": 4.71
      },
      "MODIFY_COLOR": {
        "name": "MODIFY_COLOR",
        "cost": 4.67
      },
      "MODIFY_SHAPE": {
        "name": "MODIFY_SHAPE",
        "cost": 4.63
      },
      "MODIFY_SIZE": {
        "name": "MODIFY_SIZE",
        "cost": 4.65
      },
      "MODIFY_ROW": {
        "name": "MODIFY_ROW",
        "cost": 4.69
      },
      "MODIFY_COLUMN": {
        "name": "MODIFY_COLUMN",
        "cost": 4.69
      },
      "MODIFY_TEXT": {
        "name": "MODIFY_TEXT",
        "cost": 4.61
      },
      "MODIFY_X_ADD_COUNT": {
        "name": "MODIFY_X_ADD_COUNT",
        "cost": 4.7
      },
      "MODIFY_Y_ADD_COUNT": {
        "name": "MODIFY_Y_ADD_COUNT",
        "cost": 4.7
      },
      "MODIFY_COLOR_ADD_COUNT": {
        "name": "MODIFY_COLOR_ADD_COUNT",
        "cost": 4.66
      },
      "MODIFY_SHAPE_ADD_COUNT": {
        "name": "MODIFY_SHAPE_ADD_COUNT",
        "cost": 4.62
      },
      "MODIFY_SIZE_ADD_COUNT": {
        "name": "MODIFY_SIZE_ADD_COUNT",
        "cost": 4.64
      },
      "MODIFY_ROW_ADD_COUNT": {
        "name": "MODIFY_ROW_ADD_COUNT",
        "cost": 4.68
      },
      "MODIFY_COLUMN_ADD_COUNT": {
        "name": "MODIFY_COLUMN_ADD_COUNT",
        "cost": 4.68
      },
      "MODIFY_TEXT_ADD_COUNT": {
        "name": "MODIFY_TEXT_ADD_COUNT",
        "cost": 4.6
      },
      "MODIFY_X_REMOVE_COUNT": {
        "name": "MODIFY_X_REMOVE_COUNT",
        "cost": 4.7
      },
      "MODIFY_Y_REMOVE_COUNT": {
        "name": "MODIFY_Y_REMOVE_COUNT",
        "cost": 4.7
      },
      "MODIFY_COLOR_REMOVE_COUNT": {
        "name": "MODIFY_COLOR_REMOVE_COUNT",
        "cost": 4.66
      },
      "MODIFY_SHAPE_REMOVE_COUNT": {
        "name": "MODIFY_SHAPE_REMOVE_COUNT",
        "cost": 4.62
      },
      "MODIFY_SIZE_REMOVE_COUNT": {
        "name": "MODIFY_SIZE_REMOVE_COUNT",
        "cost": 4.64
      },
      "MODIFY_ROW_REMOVE_COUNT": {
        "name": "MODIFY_ROW_REMOVE_COUNT",
        "cost": 4.68
      },
      "MODIFY_COLUMN_REMOVE_COUNT": {
        "name": "MODIFY_COLUMN_REMOVE_COUNT",
        "cost": 4.68
      },
      "MODIFY_TEXT_REMOVE_COUNT": {
        "name": "MODIFY_TEXT_REMOVE_COUNT",
        "cost": 4.6
      },
      "MOVE_X_ROW": {
        "name": "MOVE_X_ROW",
        "cost": 4.45
      },
      "MOVE_X_COLUMN": {
        "name": "MOVE_X_COLUMN",
        "cost": 4.43
      },
      "MOVE_X_SIZE": {
        "name": "MOVE_X_SIZE",
        "cost": 4.46
      },
      "MOVE_X_SHAPE": {
        "name": "MOVE_X_SHAPE",
        "cost": 4.46
      },
      "MOVE_X_COLOR": {
        "name": "MOVE_X_COLOR",
        "cost": 4.46
      },
      "MOVE_X_Y": {
        "name": "MOVE_X_Y",
        "cost": 4.44
      },
      "MOVE_X_TEXT": {
        "name": "MOVE_X_TEXT",
        "cost": 4.46
      },
      "MOVE_Y_ROW": {
        "name": "MOVE_Y_ROW",
        "cost": 4.43
      },
      "MOVE_Y_COLUMN": {
        "name": "MOVE_Y_COLUMN",
        "cost": 4.45
      },
      "MOVE_Y_SIZE": {
        "name": "MOVE_Y_SIZE",
        "cost": 4.46
      },
      "MOVE_Y_SHAPE": {
        "name": "MOVE_Y_SHAPE",
        "cost": 4.46
      },
      "MOVE_Y_COLOR": {
        "name": "MOVE_Y_COLOR",
        "cost": 4.46
      },
      "MOVE_Y_X": {
        "name": "MOVE_Y_X",
        "cost": 4.44
      },
      "MOVE_Y_TEXT": {
        "name": "MOVE_Y_TEXT",
        "cost": 4.46
      },
      "MOVE_COLOR_ROW": {
        "name": "MOVE_COLOR_ROW",
        "cost": 4.47
      },
      "MOVE_COLOR_COLUMN": {
        "name": "MOVE_COLOR_COLUMN",
        "cost": 4.47
      },
      "MOVE_COLOR_SIZE": {
        "name": "MOVE_COLOR_SIZE",
        "cost": 4.43
      },
      "MOVE_COLOR_SHAPE": {
        "name": "MOVE_COLOR_SHAPE",
        "cost": 4.43
      },
      "MOVE_COLOR_Y": {
        "name": "MOVE_COLOR_Y",
        "cost": 4.46
      },
      "MOVE_COLOR_X": {
        "name": "MOVE_COLOR_X",
        "cost": 4.46
      },
      "MOVE_COLOR_TEXT": {
        "name": "MOVE_COLOR_TEXT",
        "cost": 4.43
      },
      "MOVE_SHAPE_ROW": {
        "name": "MOVE_SHAPE_ROW",
        "cost": 4.47
      },
      "MOVE_SHAPE_COLUMN": {
        "name": "MOVE_SHAPE_COLUMN",
        "cost": 4.47
      },
      "MOVE_SHAPE_SIZE": {
        "name": "MOVE_SHAPE_SIZE",
        "cost": 4.43
      },
      "MOVE_SHAPE_COLOR": {
        "name": "MOVE_SHAPE_COLOR",
        "cost": 4.43
      },
      "MOVE_SHAPE_Y": {
        "name": "MOVE_SHAPE_Y",
        "cost": 4.46
      },
      "MOVE_SHAPE_X": {
        "name": "MOVE_SHAPE_X",
        "cost": 4.46
      },
      "MOVE_SHAPE_TEXT": {
        "name": "MOVE_SHAPE_TEXT",
        "cost": 4.43
      },
      "MOVE_SIZE_ROW": {
        "name": "MOVE_SIZE_ROW",
        "cost": 4.47
      },
      "MOVE_SIZE_COLUMN": {
        "name": "MOVE_SIZE_COLUMN",
        "cost": 4.47
      },
      "MOVE_SIZE_SHAPE": {
        "name": "MOVE_SIZE_SHAPE",
        "cost": 4.43
      },
      "MOVE_SIZE_COLOR": {
        "name": "MOVE_SIZE_COLOR",
        "cost": 4.43
      },
      "MOVE_SIZE_Y": {
        "name": "MOVE_SIZE_Y",
        "cost": 4.46
      },
      "MOVE_SIZE_X": {
        "name": "MOVE_SIZE_X",
        "cost": 4.46
      },
      "MOVE_SIZE_TEXT": {
        "name": "MOVE_SIZE_TEXT",
        "cost": 4.43
      },
      "MOVE_TEXT_ROW": {
        "name": "MOVE_TEXT_ROW",
        "cost": 4.47
      },
      "MOVE_TEXT_COLUMN": {
        "name": "MOVE_TEXT_COLUMN",
        "cost": 4.47
      },
      "MOVE_TEXT_SHAPE": {
        "name": "MOVE_TEXT_SHAPE",
        "cost": 4.43
      },
      "MOVE_TEXT_COLOR": {
        "name": "MOVE_TEXT_COLOR",
        "cost": 4.43
      },
      "MOVE_TEXT_Y": {
        "name": "MOVE_TEXT_Y",
        "cost": 4.46
      },
      "MOVE_TEXT_X": {
        "name": "MOVE_TEXT_X",
        "cost": 4.46
      },
      "MOVE_TEXT_SIZE": {
        "name": "MOVE_TEXT_SIZE",
        "cost": 4.43
      },
      "MOVE_COLUMN_ROW": {
        "name": "MOVE_COLUMN_ROW",
        "cost": 4.44
      },
      "MOVE_COLUMN_SIZE": {
        "name": "MOVE_COLUMN_SIZE",
        "cost": 4.47
      },
      "MOVE_COLUMN_SHAPE": {
        "name": "MOVE_COLUMN_SHAPE",
        "cost": 4.47
      },
      "MOVE_COLUMN_COLOR": {
        "name": "MOVE_COLUMN_COLOR",
        "cost": 4.47
      },
      "MOVE_COLUMN_Y": {
        "name": "MOVE_COLUMN_Y",
        "cost": 4.45
      },
      "MOVE_COLUMN_X": {
        "name": "MOVE_COLUMN_X",
        "cost": 4.43
      },
      "MOVE_COLUMN_TEXT": {
        "name": "MOVE_COLUMN_TEXT",
        "cost": 4.47
      },
      "MOVE_ROW_COLUMN": {
        "name": "MOVE_ROW_COLUMN",
        "cost": 4.44
      },
      "MOVE_ROW_SIZE": {
        "name": "MOVE_ROW_SIZE",
        "cost": 4.47
      },
      "MOVE_ROW_SHAPE": {
        "name": "MOVE_ROW_SHAPE",
        "cost": 4.47
      },
      "MOVE_ROW_COLOR": {
        "name": "MOVE_ROW_COLOR",
        "cost": 4.47
      },
      "MOVE_ROW_Y": {
        "name": "MOVE_ROW_Y",
        "cost": 4.43
      },
      "MOVE_ROW_X": {
        "name": "MOVE_ROW_X",
        "cost": 4.45
      },
      "MOVE_ROW_TEXT": {
        "name": "MOVE_ROW_TEXT",
        "cost": 4.47
      },
      "SWAP_X_Y": {
        "name": "SWAP_X_Y",
        "cost": 4.42
      },
      "SWAP_ROW_COLUMN": {
        "name": "SWAP_ROW_COLUMN",
        "cost": 4.41
      },
      "ceiling": {
        "cost": 47.1,
        "alternatingCost": 51.81
      }
    }
  };
  var editOpSet = {
    DEFAULT_EDIT_OPS: DEFAULT_EDIT_OPS
  };

  function neighbors(spec, additionalFields, additionalChannels, importedEncodingEditOps) {
    var neighbors = [];
    var encodingEditOps = importedEncodingEditOps || editOpSet.DEFAULT_ENCODING_EDIT_OPS;
    var inChannels = util.keys(spec.encoding);
    var exChannels = additionalChannels;
    inChannels.forEach(function (channel) {
      var newNeighbor = util.duplicate(spec);
      var editOpType = "REMOVE_" + channel.toUpperCase();
      editOpType += spec.encoding[channel].field === "*" ? "_COUNT" : "";
      var editOp = util.duplicate(encodingEditOps[editOpType]);
      var newAdditionalFields = util.duplicate(additionalFields);

      if (util.find(newAdditionalFields, util.rawEqual, newNeighbor.encoding[channel]) === -1) {
        newAdditionalFields.push(newNeighbor.encoding[channel]);
      }

      var newAdditionalChannels = util.duplicate(additionalChannels);
      editOp.detail = {
        "before": {
          "field": newNeighbor.encoding[channel].field,
          channel
        },
        "after": undefined
      };
      newAdditionalChannels.push(channel);
      delete newNeighbor.encoding[channel];

      {
        newNeighbor.editOp = editOp;
        newNeighbor.additionalFields = newAdditionalFields;
        newNeighbor.additionalChannels = newAdditionalChannels;
        neighbors.push(newNeighbor);
      }
      additionalFields.forEach(function (field, index) {
        if (field.field !== spec.encoding[channel].field) {
          newNeighbor = util.duplicate(spec);
          editOpType = "MODIFY_" + channel.toUpperCase();

          if (spec.encoding[channel].field === "*" && field.field !== "*") {
            editOpType += "_REMOVE_COUNT";
          } else if (spec.encoding[channel].field !== "*" && field.field === "*") {
            editOpType += "_ADD_COUNT";
          }

          editOp = util.duplicate(encodingEditOps[editOpType]);
          newAdditionalFields = util.duplicate(additionalFields);
          newAdditionalFields.splice(index, 1);

          if (util.find(newAdditionalFields, util.rawEqual, newNeighbor.encoding[channel]) === -1) {
            newAdditionalFields.push(newNeighbor.encoding[channel]);
          }

          newAdditionalChannels = util.duplicate(additionalChannels);
          newNeighbor.encoding[channel] = field;
          editOp.detail = {
            "before": {
              "field": spec.encoding[channel].field
            },
            "after": {
              "field": field.field
            }
          };

          {
            newNeighbor.editOp = editOp;
            newNeighbor.additionalFields = newAdditionalFields;
            newNeighbor.additionalChannels = newAdditionalChannels;
            neighbors.push(newNeighbor);
          }
        }
      });
      inChannels.forEach(function (anotherChannel) {
        if (anotherChannel === channel || ["x", "y"].indexOf(channel) < 0 || ["x", "y"].indexOf(anotherChannel) < 0) {
          return;
        }

        newNeighbor = util.duplicate(spec);
        editOp = util.duplicate(encodingEditOps["SWAP_X_Y"]);
        newAdditionalFields = util.duplicate(additionalFields);
        newAdditionalChannels = util.duplicate(additionalChannels);
        var tempChannel = util.duplicate(newNeighbor.encoding[channel]);
        newNeighbor.encoding[channel] = newNeighbor.encoding[anotherChannel];
        newNeighbor.encoding[anotherChannel] = tempChannel;
        editOp.detail = {
          "before": {
            "field": spec.encoding["x"].field,
            "channel": "x"
          },
          "after": {
            "field": spec.encoding["y"].field,
            "channel": "y"
          }
        };

        {
          newNeighbor.editOp = editOp;
          newNeighbor.additionalFields = newAdditionalFields;
          newNeighbor.additionalChannels = newAdditionalChannels;
          neighbors.push(newNeighbor);
        }
      });
      exChannels.forEach(function (exChannel, index) {
        newNeighbor = util.duplicate(spec);
        var newNeighborChannels = (channel + "_" + exChannel).toUpperCase();
        editOp = util.duplicate(encodingEditOps["MOVE_" + newNeighborChannels]);
        newAdditionalFields = util.duplicate(additionalFields);
        newAdditionalChannels = util.duplicate(additionalChannels);
        newAdditionalChannels.splice(index, 1);
        newAdditionalChannels.push(channel);
        newNeighbor.encoding[exChannel] = util.duplicate(newNeighbor.encoding[channel]);
        delete newNeighbor.encoding[channel];
        editOp.detail = {
          "before": {
            channel
          },
          "after": {
            "channel": exChannel
          }
        };

        {
          newNeighbor.editOp = editOp;
          newNeighbor.additionalFields = newAdditionalFields;
          newNeighbor.additionalChannels = newAdditionalChannels;
          neighbors.push(newNeighbor);
        }
      });
    });
    exChannels.forEach(function (channel, chIndex) {
      additionalFields.forEach(function (field, index) {
        var newNeighbor = util.duplicate(spec);
        var editOpType = "ADD_" + channel.toUpperCase();
        editOpType += field.field === "*" ? "_COUNT" : "";
        var editOp = util.duplicate(encodingEditOps[editOpType]);
        var newAdditionalFields = util.duplicate(additionalFields);
        var newAdditionalChannels = util.duplicate(additionalChannels);
        newAdditionalFields.splice(index, 1);
        newNeighbor.encoding[channel] = field;
        newAdditionalChannels.splice(chIndex, 1);
        editOp.detail = {
          "before": undefined,
          "after": {
            "field": field.field,
            channel
          }
        };

        {
          newNeighbor.editOp = editOp;
          newNeighbor.additionalFields = newAdditionalFields;
          newNeighbor.additionalChannels = newAdditionalChannels;
          neighbors.push(newNeighbor);
        }
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

  var neighbors_1 = neighbors;

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

  var sameEncoding_1 = sameEncoding;
  var neighbor = {
    neighbors: neighbors_1,
    sameEncoding: sameEncoding_1
  };

  var expr = /*@__PURE__*/getAugmentedNamespace(vegaExpression_module);

  const {
    TYPES: TYPES$1,
    CHANNELS: CHANNELS$1,
    OPS: OPS$1,
    LOGIC_OPS: LOGIC_OPS$1
  } = constants;
  const DEFAULT_EDIT_OPS$1 = editOpSet.DEFAULT_EDIT_OPS;

  function transition(s, d, importedTransitionCosts, transOptions) {
    var importedMarkEditOps = importedTransitionCosts ? importedTransitionCosts.markEditOps : DEFAULT_EDIT_OPS$1["markEditOps"];
    var importedTransformEditOps = importedTransitionCosts ? importedTransitionCosts.transformEditOps : DEFAULT_EDIT_OPS$1["transformEditOps"];
    var importedEncodingEditOps = importedTransitionCosts ? importedTransitionCosts.encodingEditOps : DEFAULT_EDIT_OPS$1["encodingEditOps"];
    var trans = {
      mark: markEditOps(s, d, importedMarkEditOps).map(eo => {
        return { ...eo,
          type: "mark"
        };
      }),
      transform: transformEditOps(s, d, importedTransformEditOps, transOptions).map(eo => {
        return { ...eo,
          type: "transform"
        };
      }),
      encoding: encodingEditOps(s, d, importedEncodingEditOps).map(eo => {
        return { ...eo,
          type: "encoding"
        };
      })
    };
    var cost = 0;
    cost = trans.encoding.reduce(function (prev, editOp) {
      if (editOp.name.indexOf('_COUNT') >= 0) {
        var channel = editOp.name.replace(/COUNT/g, '').replace(/ADD/g, '').replace(/REMOVE/g, '').replace(/MODIFY/g, '').replace(/_/g, '').toLowerCase();
        var aggEditOp = trans.transform.filter(function (editOp) {
          return editOp.name === "AGGREGATE";
        })[0];

        if (aggEditOp && aggEditOp.detail.length === 1 && aggEditOp.detail.filter(function (dt) {
          return dt.channel.toLowerCase() === channel;
        }).length) {
          aggEditOp.cost = 0;
        }

        var binEditOp = trans.transform.filter(function (editOp) {
          return editOp.name === "BIN";
        })[0];

        if (binEditOp && binEditOp.detail.filter(function (dt) {
          if (dt.how === "added") {
            return d.encoding[dt.channel].type === TYPES$1.QUANTITATIVE;
          } else {
            return s.encoding[dt.channel].type === TYPES$1.QUANTITATIVE;
          }
        }).length > 0) {
          binEditOp.cost = 0;
        }
      }

      prev += editOp.cost;
      return prev;
    }, cost);
    cost = trans.mark.reduce(function (prev, editOp) {
      prev += editOp.cost;
      return prev;
    }, cost);
    cost = trans.transform.reduce(function (prev, editOp) {
      prev += editOp.cost;
      return prev;
    }, cost);
    return { ...trans,
      cost
    };
  }

  var transition_1 = transition;

  function markEditOps(s, d, importedMarkEditOps) {
    var editOps = [];
    var markEditOps = importedMarkEditOps || DEFAULT_EDIT_OPS$1["markEditOps"];
    var newEditOp;

    if (s.mark === d.mark) {
      return editOps;
    } else {
      var editOpName = [s.mark.toUpperCase(), d.mark.toUpperCase()].sort().join("_");

      if (markEditOps[editOpName]) {
        newEditOp = util.duplicate(markEditOps[editOpName]);
        newEditOp.detail = {
          "before": s.mark.toUpperCase(),
          "after": d.mark.toUpperCase()
        };
        editOps.push(newEditOp);
      }
    }

    return editOps;
  }

  var markEditOps_1 = markEditOps;

  function transformEditOps(s, d, importedTransformEditOps, transOptions) {
    var transformEditOps = importedTransformEditOps || DEFAULT_EDIT_OPS$1["transformEditOps"];
    var editOps = [];
    CHANNELS$1.forEach(function (channel) {
      ["SCALE", "SORT", "AGGREGATE", "BIN", "SETTYPE"].map(function (transformType) {
        let editOp;

        if (transformType === "SETTYPE" && transformEditOps[transformType]) {
          editOp = transformSettype(s, d, channel, transformEditOps);
        } else if (transformEditOps[transformType]) {
          editOp = transformBasic(s, d, channel, transformType, transformEditOps, transOptions);
        }

        if (editOp) {
          let found = editOps.find(eo => eo.name === editOp.name);

          if (found) {
            found.detail.push(editOp.detail);
          } else {
            editOp.detail = [editOp.detail];
            editOps.push(editOp);
          }
        }
      });
    });
    var importedFilterEditOps = {
      "MODIFY_FILTER": transformEditOps["MODIFY_FILTER"],
      "ADD_FILTER": transformEditOps["ADD_FILTER"],
      "REMOVE_FILTER": transformEditOps["REMOVE_FILTER"]
    };
    editOps = editOps.concat(filterEditOps(s, d, importedFilterEditOps));
    return editOps;
  }

  var transformEditOps_1 = transformEditOps;

  function transformBasic(s, d, channel, transform, transformEditOps, transOptions) {
    var sHas = false;
    var dHas = false;
    var editOp;
    var sEditOp, dEditOp;

    if (s.encoding[channel] && s.encoding[channel][transform.toLowerCase()]) {
      sHas = true;
      sEditOp = s.encoding[channel][transform.toLowerCase()];
    }

    if (d.encoding[channel] && d.encoding[channel][transform.toLowerCase()]) {
      dHas = true;
      dEditOp = d.encoding[channel][transform.toLowerCase()];
    }

    if (transOptions && transOptions.omitIncludeRawDomain && transform === "SCALE") {
      if (sEditOp && sEditOp.domain && dEditOp.domain === "unaggregated") {
        delete sEditOp.domain;

        if (Object.keys(sEditOp).length === 0) {
          sHas = false;
        }
      }

      if (dEditOp && dEditOp.domain && dEditOp.domain === "unaggregated") {
        delete dEditOp.domain;

        if (Object.keys(dEditOp).length === 0) {
          dHas = false;
        }
      }
    }

    if (sHas && dHas && !util.rawEqual(sEditOp, dEditOp)) {
      editOp = util.duplicate(transformEditOps[transform]);
      editOp.detail = {
        "how": "modified",
        "channel": channel
      };
      return editOp;
    } else if (sHas && !dHas) {
      editOp = util.duplicate(transformEditOps[transform]);
      editOp.detail = {
        "how": "removed",
        "channel": channel
      };
      return editOp;
    } else if (!sHas && dHas) {
      editOp = util.duplicate(transformEditOps[transform]);
      editOp.detail = {
        "how": "added",
        "channel": channel
      };
      return editOp;
    }
  }

  var transformBasic_1 = transformBasic;

  function filterEditOps(s, d, importedFilterEditOps) {
    var sFilters = [],
        dFilters = [];
    var editOps = [];

    if (s.transform) {
      sFilters = getFilters(s.transform.filter(trsfm => trsfm.filter).map(trsfm => trsfm.filter));
    }

    if (d.transform) {
      dFilters = getFilters(d.transform.filter(trsfm => trsfm.filter).map(trsfm => trsfm.filter));
    }

    if (sFilters.length === 0 && dFilters.length === 0) {
      return editOps;
    }

    var dOnly = util.arrayDiff(dFilters, sFilters);
    var sOnly = util.arrayDiff(sFilters, dFilters);
    var isFind = false;

    for (var i = 0; i < dOnly.length; i++) {
      for (var j = 0; j < sOnly.length; j++) {
        if (dOnly[i].id === sOnly[j].id) {
          var newEditOp = util.duplicate(importedFilterEditOps["MODIFY_FILTER"]);
          newEditOp.detail = {
            "what": [],
            "id": sOnly[j].id,
            "before": [],
            "after": [],
            "sFilter": sOnly[j],
            "eFilter": dOnly[i]
          };

          if (!util.deepEqual(sOnly[j].op, dOnly[i].op)) {
            newEditOp.detail.what.push("op");
            newEditOp.detail.before.push(sOnly[j].op);
            newEditOp.detail.after.push(dOnly[i].op);
          }

          if (!util.deepEqual(sOnly[j].value, dOnly[i].value)) {
            newEditOp.detail.what.push("value");
            newEditOp.detail.before.push(sOnly[j].value);
            newEditOp.detail.after.push(dOnly[i].value);
          }

          editOps.push(newEditOp);
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
      var newEditOp = util.duplicate(importedFilterEditOps["ADD_FILTER"]);
      newEditOp.detail = newEditOp.detail = {
        "id": dOnly[i].id,
        "what": ["field", "op", "value"],
        "before": [undefined, undefined, undefined],
        "after": [dOnly[i].field, dOnly[i].op, dOnly[i].value],
        "eFilter": dOnly[i],
        "sFilter": undefined
      };
      editOps.push(newEditOp);
    }

    for (var i = 0; i < sOnly.length; i++) {
      var newEditOp = util.duplicate(importedFilterEditOps["REMOVE_FILTER"]);
      newEditOp.detail = newEditOp.detail = {
        "id": sOnly[i].id,
        "what": ["field", "op", "value"],
        "before": [sOnly[i].field, sOnly[i].op, sOnly[i].value],
        "after": [undefined, undefined, undefined],
        "sFilter": sOnly[i],
        "eFilter": undefined
      };
      editOps.push(newEditOp);
    }

    return editOps;
  }

  var filterEditOps_1 = filterEditOps;

  function getFilters(filterExpression) {
    let filters;

    if (util.isArray(filterExpression)) {
      filters = filterExpression.reduce((acc, expression) => {
        return acc.concat(parsePredicateFilter(expression));
      }, []);
    } else {
      filters = parsePredicateFilter(filterExpression);
    }

    filters = d3__default['default'].groups(filters, filter => filter.id).map(group => {
      return {
        id: group[0],
        field: group[1].map(filter => filter.field),
        op: group[1].map(filter => filter.op),
        value: group[1].map(filter => filter.value)
      };
    });
    return filters;
  }

  var getFilters_1 = getFilters;

  function parsePredicateFilter(expression) {
    let parsed = [];

    if (util.isString(expression)) {
      parsed = parsed.concat(stringFilter(expression));
    } else {
      LOGIC_OPS$1.filter(logicOp => expression.hasOwnProperty(logicOp)).forEach(logicOp => {
        let subParsed;

        if (util.isArray(expression[logicOp])) {
          subParsed = expression[logicOp].reduce((subParsed, expr) => {
            return subParsed.concat(parsePredicateFilter(expr));
          }, []);
        } else {
          subParsed = parsePredicateFilter(expression[logicOp]);
        }

        let id = subParsed.map(f => f.id).join("_");
        parsed.push({
          "id": "".concat(logicOp, ">[").concat(id, "]"),
          "op": logicOp,
          "value": subParsed
        });
      });
      OPS$1.filter(op => expression.hasOwnProperty(op)).forEach(op => {
        parsed.push({
          "id": expression.field,
          "field": expression.field,
          "op": op,
          "value": JSON.stringify(expression[op])
        });
      });
    }

    if (parsed.length === 0) {
      console.log("WARN: cannot parse filters.");
    }

    return parsed;
  }

  var parsePredicateFilter_1 = parsePredicateFilter;

  function stringFilter(expression) {
    var parser = expr["parse"];
    var expressionTree = parser(expression);
    return binaryExprsFromExprTree(expressionTree, [], 0).map(function (bExpr) {
      return {
        "id": bExpr.left.property.name,
        "field": bExpr.left.property.name,
        "op": bExpr.operator,
        "value": bExpr.right.raw
      };
    });

    function binaryExprsFromExprTree(tree, arr, depth) {
      if (tree.operator === '||' || tree.operator === '&&') {
        arr = binaryExprsFromExprTree(tree.left, arr, depth + 1);
        arr = binaryExprsFromExprTree(tree.right, arr, depth + 1);
      } else if (['==', '===', '!==', '!=', '<', '<=', '>', '>='].indexOf(tree.operator) >= 0) {
        tree.depth = depth;
        arr.push(tree);
      }

      return arr;
    }
  }

  function transformSettype(s, d, channel, transformEditOps) {
    var editOp;

    if (s.encoding[channel] && d.encoding[channel] && d.encoding[channel]["field"] === s.encoding[channel]["field"] && d.encoding[channel]["type"] !== s.encoding[channel]["type"]) {
      editOp = util.duplicate(transformEditOps["SETTYPE"]);
      editOp.detail = {
        "before": s.encoding[channel]["type"],
        "after": d.encoding[channel]["type"],
        "channel": channel
      };
      return editOp;
    }
  }

  var transformSettype_1 = transformSettype;

  function encodingEditOps(s, d, importedEncodingEditOps) {
    if (neighbor.sameEncoding(s.encoding, d.encoding)) {
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
    var additionalFields = util.unionObjectArray(dFields, sFields, function (field) {
      return field.field + "_" + field.type;
    });
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

    var nodes = neighbor.neighbors(s, additionalFields, additionalChannels, importedEncodingEditOps).map(function (neighbor) {
      neighbor.distance = neighbor.editOp.cost, neighbor.prev = [s];
      return neighbor;
    });
    s.distance = 0;
    s.prev = [];
    var doneNodes = [s];

    while (nodes.length > 0) {
      u = nearestNode(nodes);

      if (neighbor.sameEncoding(u.encoding, d.encoding)) {
        break;
      }

      if (u.distance >= importedEncodingEditOps.ceiling.cost) {
        return [{
          name: 'OVER_THE_CEILING',
          cost: importedEncodingEditOps.ceiling.alternatingCost
        }];
      }

      var newNodes = neighbor.neighbors(u, additionalFields, u.additionalChannels, importedEncodingEditOps);
      newNodes.forEach(function (newNode) {
        var node;

        for (var i = 0; i < doneNodes.length; i += 1) {
          if (neighbor.sameEncoding(doneNodes[i].encoding, newNode.encoding)) {
            return;
          }
        }

        for (var i = 0; i < nodes.length; i += 1) {
          if (neighbor.sameEncoding(nodes[i].encoding, newNode.encoding)) {
            node = nodes[i];
            break;
          }
        }

        if (node) {
          if (node.distance > u.distance + newNode.editOp.cost) {
            node.distance = u.distance + newNode.editOp.cost;
            node.editOp = newNode.editOp;
            node.prev = u.prev.concat([u]);
          }
        } else {
          newNode.distance = u.distance + newNode.editOp.cost;
          newNode.prev = u.prev.concat([u]);
          nodes.push(newNode);
        }
      });
      doneNodes.push(u);
    }

    if (!neighbor.sameEncoding(u.encoding, d.encoding) && nodes.length === 0) {
      return [{
        name: "UNREACHABLE",
        cost: 999
      }];
    }

    var result = [].concat(u.prev.map(function (node) {
      return node.editOp;
    }).filter(function (editOp) {
      return editOp;
    }));
    result.push(u.editOp);
    return result;
  }

  var encodingEditOps_1 = encodingEditOps;
  var trans = {
    transition: transition_1,
    markEditOps: markEditOps_1,
    transformEditOps: transformEditOps_1,
    transformBasic: transformBasic_1,
    filterEditOps: filterEditOps_1,
    getFilters: getFilters_1,
    parsePredicateFilter: parsePredicateFilter_1,
    transformSettype: transformSettype_1,
    encodingEditOps: encodingEditOps_1
  };

  function TSP(matrix, value, fixFirst) {
    var head, sequences;

    function enumSequences(arr) {
      var out = [];

      if (arr.length === 1) {
        out.push(arr);
        return out;
      } else {
        for (var i = 0; i < arr.length; i++) {
          var arrTemp = JSON.parse(JSON.stringify(arr));
          var head = arrTemp.splice(i, 1);
          enumSequences(arrTemp).map(function (seq) {
            out.push(head.concat(seq));
          });
        }

        return out;
      }
    }

    var sequence = matrix[0].map(function (elem, i) {
      return i;
    });

    if (!isNaN(fixFirst)) {
      head = sequence.splice(fixFirst, 1);
      sequences = enumSequences(sequence).map(function (elem) {
        return head.concat(elem);
      });
    } else {
      sequences = enumSequences(sequence);
    }

    var minDistance = Infinity;
    var distance = 0;
    var out = [];
    var all = [];

    for (var i = 0; i < sequences.length; i++) {
      if (i * 100 / sequences.length % 10 === 0) ;

      for (var j = 0; j < sequences[i].length - 1; j++) {
        distance += matrix[sequences[i][j]][sequences[i][j + 1]][value];
      }

      distance = Math.round(distance * 10000) / 10000;
      all.push({
        sequence: sequences[i],
        distance: distance
      });

      if (distance <= minDistance) {
        if (distance === minDistance) {
          out.push({
            sequence: sequences[i],
            distance: minDistance
          });
        } else {
          out = [];
          out.push({
            sequence: sequences[i],
            distance: distance
          });
        }
        minDistance = distance; // console.log(i,minDistance);
      }

      distance = 0;
    }

    return {
      out: out,
      all: all
    };
  } // var matrix = JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
  // var fixFirst = Number(process.argv[3]);
  // console.log(TSP(matrix,"rank",fixFirst));


  var TSP_1 = {
    TSP: TSP
  };

  function scoreSimple(coverage, patternLength, inputLength) {
    var w_c = 1,
        w_l = 0;
    return (coverage * w_c + patternLength / inputLength * w_l) / (w_c + w_l);
  }

  function PatternOptimizer(inputArray, uniqTransitionSets) {
    var Optimized = [],
        maxScore = 0; // var inputDistance = distance(inputArray, uniqTransitionSets);

    for (var l = 1; l <= inputArray.length; l++) {
      for (var i = 0; i < inputArray.length - l + 1; i++) {
        var appear = [i];

        for (var j = 0; j < inputArray.length - l + 1; j++) {
          if (i !== j && isSameSub(inputArray, i, i + (l - 1), j)) {
            appear.push(j);
          }
        }

        var overlap = false;

        for (var k = 0; k < appear.length - 1; k++) {
          if (appear[k + 1] - appear[k] < l) {
            overlap = true;
            break;
          } // if(period !== 0 && period !== appear[k+1] - appear[k]){
          //   rythmic = false;
          //   break;
          // }
          // period = appear[k+1] - appear[k];

        } // if (appear.length > 1 && !overlap && rythmic ){


        if (appear.length > 1 && !overlap) {
          var newPattern = dup(inputArray).splice(i, l);
          var RPcoverage = coverage(inputArray, l, appear);

          if (!Optimized.find(function (rp) {
            return s(rp.pattern) === s(newPattern);
          })) {
            newPattern = {
              'pattern': newPattern,
              'appear': appear,
              'coverage': RPcoverage
            };
            newPattern.patternScore = scoreSimple(newPattern.coverage, l, inputArray.length);

            if (newPattern.patternScore > maxScore) {
              maxScore = newPattern.patternScore;
              Optimized = [newPattern];
            } else if (newPattern.patternScore === maxScore) {
              Optimized.push(newPattern);
            }
          }
        }
      }
    }

    return Optimized;
  }

  function coverage(array, Patternlength, appear) {
    var s,
        coverage = 0;

    for (var i = 0; i < appear.length - 1; i++) {
      s = i;

      while (appear[i] + Patternlength > appear[i + 1]) {
        i++;
      }

      coverage += appear[i] + Patternlength - appear[s];
    }

    if (i === appear.length - 1) {
      coverage += Patternlength;
    }
    return coverage / array.length;
  }

  function isSameSub(array, i1, f1, i2, f2) {
    for (var i = 0; i < f1 - i1 + 1; i++) {
      if (array[i1 + i] !== array[i2 + i]) {
        return false;
      }
    }

    return true;
  }

  function s(a) {
    return JSON.stringify(a);
  }

  function dup(a) {
    return JSON.parse(s(a));
  } // console.log(PatternOptimizer("231111".split(''),[1,1,1,1]));
  // console.log(coverage("sdsdxxxasdsdsdaasdsdsdsdsdsdsdsd".split(''), 2, [ 0, 2, 8, 10, 12, 16, 18, 20, 22, 24, 26, 28, 30 ]))


  var PatternOptimizer_1 = {
    PatternOptimizer: PatternOptimizer
  };

  function TieBreaker(result, transitionSetsFromEmptyVis) {
    var filterState = {};
    var filterScore = [];
    var filterSequenceCost = 0;

    for (var i = 0; i < result.charts.length; i++) {
      let spec = result.charts[i];

      if (spec.transform) {
        let filters = spec.transform.filter(trsfm => trsfm.filter).map(trsfm => trsfm.filter);

        for (var j = 0; j < filters.length; j++) {
          let filter = filters[j];

          if (filter.hasOwnProperty("field") && filter.hasOwnProperty("equal")) {
            if (filterState[filter.field]) {
              filterState[filter.field].push(filter.equal);
            } else {
              filterState[filter.field] = [filter.equal];
              filterScore.push({
                "field": filter.field,
                "score": 0
              });
            }
          }
        }
      }
    }

    for (var i = 0; i < filterScore.length; i++) {
      for (var j = 1; j < filterState[filterScore[i].field].length; j++) {
        if (filterState[filterScore[i].field][j - 1] < filterState[filterScore[i].field][j]) {
          filterScore[i].score += 1;
        } else if (filterState[filterScore[i].field][j - 1] > filterState[filterScore[i].field][j]) {
          filterScore[i].score -= 1;
        }
      }

      filterSequenceCost += Math.abs(filterScore[i].score + 0.1) / (filterState[filterScore[i].field].length - 1 + 0.1);
    }

    filterSequenceCost = filterScore.length > 0 ? 1 - filterSequenceCost / filterScore.length : 0;
    return {
      'tiebreakCost': filterSequenceCost,
      'reasons': filterScore
    };
  }

  var TieBreaker_1 = {
    TieBreaker: TieBreaker
  };

  function sequence(specs, options, editOpSet$1, callback) {
    if (!editOpSet$1) {
      editOpSet$1 = editOpSet.DEFAULT_EDIT_OPS;
    }

    function distanceWithPattern(dist, globalWeightingTerm, filterCost) {
      return (dist + filterCost / 1000) * globalWeightingTerm;
    }

    var transitionSetsFromEmptyVis = getTransitionSetsFromSpec({
      "mark": "null",
      "encoding": {}
    }, specs, editOpSet$1);

    if (!options.fixFirst) {
      var startingSpec = {
        "mark": "null",
        "encoding": {}
      };
      specs = [startingSpec].concat(specs);
    }

    var transitions = getTransitionSets(specs, editOpSet$1);
    transitions = extendTransitionSets(transitions);
    var TSPResult = TSP_1.TSP(transitions, "cost", options.fixFirst === true ? 0 : undefined);
    var TSPResultAll = TSPResult.all.filter(function (seqWithDist) {
      return seqWithDist.sequence[0] === 0;
    }).map(function (tspR) {
      var sequence = tspR.sequence;
      var transitionSet = [];

      for (var i = 0; i < sequence.length - 1; i++) {
        transitionSet.push(transitions[sequence[i]][sequence[i + 1]]);
      }
      var pattern = transitionSet.map(function (r) {
        return r.id;
      });
      var POResult = PatternOptimizer_1.PatternOptimizer(pattern, transitions.uniq);
      var result = {
        "sequence": sequence,
        "transitions": transitionSet,
        "sumOfTransitionCosts": tspR.distance,
        "patterns": POResult,
        "globalWeightingTerm": !!POResult[0] ? 1 - POResult[0].patternScore : 1,
        "charts": sequence.map(function (index) {
          return specs[index];
        })
      };
      var tbResult = TieBreaker_1.TieBreaker(result, transitionSetsFromEmptyVis);
      result.filterSequenceCost = tbResult.tiebreakCost;
      result.filterSequenceCostReasons = tbResult.reasons;
      result.sequenceCost = distanceWithPattern(result.sumOfTransitionCosts, result.globalWeightingTerm, tbResult.tiebreakCost);
      return result;
    }).sort(function (a, b) {
      if (a.sequenceCost > b.sequenceCost) {
        return 1;
      }

      if (a.sequenceCost < b.sequenceCost) {
        return -1;
      } else {
        return a.sequence.join(',') > b.sequence.join(',') ? 1 : -1;
      }
    });
    var minSequenceCost = TSPResultAll[0].sequenceCost;

    for (var i = 0; i < TSPResultAll.length; i++) {
      if (TSPResultAll[i].sequenceCost === minSequenceCost) {
        TSPResultAll[i].isOptimum = true;
      } else {
        break;
      }
    }

    var returnValue = TSPResultAll;

    if (callback) {
      callback(returnValue);
    }

    return returnValue;
  }

  function getTransitionSetsFromSpec(spec, specs, editOpSet) {
    var transitions = [];

    for (var i = 0; i < specs.length; i++) {
      transitions.push(trans.transition(specs[i], spec, editOpSet, {
        omitIncludeRawDomin: true
      }));
    }

    return transitions;
  }

  function getTransitionSets(specs, editOpSet) {
    var transitions = [];

    for (var i = 0; i < specs.length; i++) {
      transitions.push([]);

      for (var j = 0; j < specs.length; j++) {
        transitions[i].push(trans.transition(specs[i], specs[j], editOpSet, {
          omitIncludeRawDomin: true
        }));
      }
    }

    return transitions;
  }

  function extendTransitionSets(transitions) {
    var uniqTransitionSets = [];
    var flatCosts = transitions.reduce(function (prev, curr) {
      for (var i = 0; i < curr.length; i++) {
        prev.push(curr[i].cost);
        var transitionSetSH = transitionShorthand(curr[i]);
        var index = uniqTransitionSets.map(function (tr) {
          return tr.shorthand;
        }).indexOf(transitionSetSH);

        if (index === -1) {
          curr[i]["id"] = uniqTransitionSets.push({
            tr: curr[i],
            shorthand: transitionSetSH
          }) - 1;
        } else {
          curr[i]["id"] = index;
        }
      }
      return prev;
    }, []);
    var uniqueCosts = [...new Set(flatCosts)].map(function (val) {
      return Number(val);
    }).sort(function (a, b) {
      return a - b;
    });
    var rank = d3__default['default'].scaleOrdinal().domain(uniqueCosts).range([0, uniqueCosts.length]);

    for (var i = 0; i < transitions.length; i++) {
      for (var j = 0; j < transitions[i].length; j++) {
        transitions[i][j]["start"] = i;
        transitions[i][j]["destination"] = j;
        transitions[i][j]["rank"] = Math.floor(rank(transitions[i][j].cost));
      }
    }

    transitions.uniq = uniqTransitionSets;
    return transitions;
  }

  function transitionShorthand(transition) {
    return transition.mark.concat(transition.transform).concat(transition.encoding).map(function (tr) {
      if (tr.detail) {
        if (tr.name === "MODIFY_FILTER") {
          return tr.name + '(' + JSON.stringify(tr.detail.id) + ')';
        }

        return tr.name + '(' + JSON.stringify(tr.detail) + ')';
      }

      return tr.name;
    }).sort().join('|');
  }

  var sequence_2 = sequence;
  var sequence_1 = {
    sequence: sequence_2
  };

  var sequence$1 = sequence_1.sequence;
  var transition$1 = trans.transition;
  var src = {
    sequence: sequence$1,
    transition: transition$1
  };

  exports.default = src;
  exports.sequence = sequence$1;
  exports.transition = transition$1;

  Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=graphscape.js.map
