// Additional Handlebars helpers.
// Note: `isAnd` and `isOr` support both block form
// (`{{#isAnd a b}}...{{/isAnd}}`) and inline/subexpression form
// (`{{isAnd a b}}`, `{{#if (isAnd a b)}}`).

function hasBlockOptions(options) {
  return options && typeof options.fn === "function" && typeof options.inverse === "function";
}

export const handlebarsHelper = function () {
  Handlebars.registerHelper("isAnd", function (cond1, cond2, options) {
    const result = Boolean(cond1 && cond2);
    if (!hasBlockOptions(options)) return result;
    return result ? options.fn(this) : options.inverse(this);
  });

  Handlebars.registerHelper("isOr", function (cond1, cond2, options) {
    const result = Boolean(cond1 || cond2);
    if (!hasBlockOptions(options)) return result;
    return result ? options.fn(this) : options.inverse(this);
  });

  Handlebars.registerHelper("concat", function () {
    let outStr = "";
    for (const arg of arguments) {
      if (typeof arg !== "object") outStr += arg;
    }
    return outStr;
  });

  Handlebars.registerHelper("toLowerCase", function (str) {
    return String(str ?? "").toLowerCase();
  });

  Handlebars.registerHelper("loop", function (from, to, inc, block) {
    let output = "";
    for (let i = from; i <= to; i += inc) {
      output += block.fn(i);
    }
    return output;
  });

  Handlebars.registerHelper("counter", function (index) {
    return Number(index ?? 0) + 1;
  });
};
