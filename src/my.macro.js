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
