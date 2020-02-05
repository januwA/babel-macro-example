- [@babel/types](https://babeljs.io/docs/en/babel-types)
- [astexplorer](https://astexplorer.net/)

## use `preval.macro`

input:
```js
import preval from "preval.macro";
const x = preval`module.exports = 1`;
```

output: 
```js
var x = 1;
```

## use `codegen.macro`

input:
```js
import codegen from "codegen.macro";

codegen.require("./imports.macro");
codegen.require("./exports.macro");
```

```js
// exports.macro.js

const arr = ["a", "b", "c"];

function t(l) {
  return `export const ${l} =  ${JSON.stringify(l)};`;
}
module.exports = arr.map(t).join("\r\n");
```

```js
// imports.macro.js

var arr = ["zh", "en", "ar"];
function t(l) {
  return "import \"i18n/".concat(l, ".js\"");
}
module.exports = arr.map(t).join("\r\n");
```

output: 
```js
exports.c = exports.b = exports.a = void 0;

require("i18n/zh.js");
require("i18n/en.js");
require("i18n/ar.js");

var a = "a";
exports.a = a;
var b = "b";
exports.b = b;
var c = "c";
exports.c = c;
```

## 创建自己的`macro` (1)
```js
// index.js

import hello, { goodbye as googbye, name } from "./my.macro";

console.log(hello, googbye);

alert(googbye, hello);

function getSomeGreetings() {
  return [googbye, hello];
}

console.log(name);
alert(name);
const newName = name;
```

```js
// my.macro.js

const { createMacro } = require("babel-plugin-macros");

module.exports = createMacro(function myMacro({ references, state, babel }) {
  // state是您传递给访问者的第二个参数
  // 普通的babel插件。 babel是babel-plugin-macros模块。
  // 对在references中找到的AST路径进行任何操作
  const { default: hello = [], goodbye = [], name = [] } = references;

  hello.forEach(path => {
    path.replaceWith(babel.types.stringLiteral("hello world"));
  });

  goodbye.forEach(path => {
    path.replaceWith(babel.types.stringLiteral("goodbye friend"));
  });

  name.forEach((path, index) => {
    // console.log(path.type);
    path.replaceWith(babel.types.stringLiteral(`Ajanuw [${index}]`));
  });
});
```

```js
// output

"use strict";

console.log("hello world", "goodbye friend");
alert("goodbye friend", "hello world");

function getSomeGreetings() {
  return ["goodbye friend", "hello world"];
}

console.log("Ajanuw [0]");
alert("Ajanuw [1]");
var newName = "Ajanuw [2]";
```

## 实现 `a = [1..10]`

input:
```js
import a from "./my.macro";

const x = [1, 2, a`3..1`, 4, 5, a`a..c`];
```

```js
// my.macro.js

const { createMacro } = require("babel-plugin-macros");

module.exports = createMacro(function myMacro({ references, state, babel }) {
  const { types: t } = babel;
  // state是您传递给访问者的第二个参数
  // 普通的babel插件。 babel是babel-plugin-macros模块。
  // 对在references中找到的AST路径进行任何操作

  references.default.forEach(path => {
    if (path.parentPath.type === "TaggedTemplateExpression") {
      const quasiPath = path.parentPath.get("quasi");
      const value = quasiPath.node.quasis[0].value.raw;
      if (value) {
        const valueArray = value
          .toString()
          .split("..")
          .map(e => e.trim());
        let start = valueArray[0],
          end = valueArray[1];

        const result = [];
        let isNotNumber = /[a-zA-Z]/.test(start) && /[a-zA-Z]/.test(end);

        start = toNumber(start);
        end = toNumber(end);

        if (start < end) {
          for (let i = start; i <= end; i++) {
            result.push(isNotNumber ? String.fromCodePoint(i) : i);
          }
        } else {
          for (let i = start; i >= end; i--) {
            result.push(isNotNumber ? String.fromCodePoint(i) : i);
          }
        }

        path.parentPath.replaceWith(
          t.SpreadElement(
            t.ArrayExpression(
              result.map(el =>
                isNotNumber ? t.StringLiteral(el) : t.NumericLiteral(el)
              )
            )
          )
        );
      }
    }
  });
});

function toNumber(v /*string*/) {
  if (/[a-zA-Z]/.test(v)) {
    return v.codePointAt(0);
  }
  return Number(v);
}
```

output: 
```js
var x = [1, 2].concat([3, 2, 1], [4, 5], ["a", "b", "c"]);
```
