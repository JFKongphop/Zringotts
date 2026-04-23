/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "vendor-chunks/symbol-observable";
exports.ids = ["vendor-chunks/symbol-observable"];
exports.modules = {

/***/ "(ssr)/./node_modules/symbol-observable/lib/ponyfill.js":
/*!********************************************************!*\
  !*** ./node_modules/symbol-observable/lib/ponyfill.js ***!
  \********************************************************/
/***/ ((__unused_webpack_module, exports) => {

"use strict";
eval("\n\nObject.defineProperty(exports, \"__esModule\", ({\n\tvalue: true\n}));\nexports[\"default\"] = symbolObservablePonyfill;\nfunction symbolObservablePonyfill(root) {\n\tvar result;\n\tvar _Symbol = root.Symbol;\n\n\tif (typeof _Symbol === 'function') {\n\t\tif (_Symbol.observable) {\n\t\t\tresult = _Symbol.observable;\n\t\t} else {\n\n\t\t\t// This just needs to be something that won't trample other user's Symbol.for use\n\t\t\t// It also will guide people to the source of their issues, if this is problematic.\n\t\t\t// META: It's a resource locator!\n\t\t\tresult = _Symbol['for']('https://github.com/benlesh/symbol-observable');\n\t\t\ttry {\n\t\t\t\t_Symbol.observable = result;\n\t\t\t} catch (err) {\n\t\t\t\t// Do nothing. In some environments, users have frozen `Symbol` for security reasons,\n\t\t\t\t// if it is frozen assigning to it will throw. In this case, we don't care, because\n\t\t\t\t// they will need to use the returned value from the ponyfill.\n\t\t\t}\n\t\t}\n\t} else {\n\t\tresult = '@@observable';\n\t}\n\n\treturn result;\n};//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHNzcikvLi9ub2RlX21vZHVsZXMvc3ltYm9sLW9ic2VydmFibGUvbGliL3BvbnlmaWxsLmpzIiwibWFwcGluZ3MiOiJBQUFhOztBQUViLDhDQUE2QztBQUM3QztBQUNBLENBQUMsRUFBQztBQUNGLGtCQUFrQjtBQUNsQjtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsSUFBSTs7QUFFSjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBOztBQUVBO0FBQ0EiLCJzb3VyY2VzIjpbIi9Vc2Vycy9rb25ncGhvcGtpbmdwZXQvRG9jdW1lbnRzL0dpdGh1Yi9acmluZ290dHMvZnJvbnRlbmQvbm9kZV9tb2R1bGVzL3N5bWJvbC1vYnNlcnZhYmxlL2xpYi9wb255ZmlsbC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuXHR2YWx1ZTogdHJ1ZVxufSk7XG5leHBvcnRzWydkZWZhdWx0J10gPSBzeW1ib2xPYnNlcnZhYmxlUG9ueWZpbGw7XG5mdW5jdGlvbiBzeW1ib2xPYnNlcnZhYmxlUG9ueWZpbGwocm9vdCkge1xuXHR2YXIgcmVzdWx0O1xuXHR2YXIgX1N5bWJvbCA9IHJvb3QuU3ltYm9sO1xuXG5cdGlmICh0eXBlb2YgX1N5bWJvbCA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdGlmIChfU3ltYm9sLm9ic2VydmFibGUpIHtcblx0XHRcdHJlc3VsdCA9IF9TeW1ib2wub2JzZXJ2YWJsZTtcblx0XHR9IGVsc2Uge1xuXG5cdFx0XHQvLyBUaGlzIGp1c3QgbmVlZHMgdG8gYmUgc29tZXRoaW5nIHRoYXQgd29uJ3QgdHJhbXBsZSBvdGhlciB1c2VyJ3MgU3ltYm9sLmZvciB1c2Vcblx0XHRcdC8vIEl0IGFsc28gd2lsbCBndWlkZSBwZW9wbGUgdG8gdGhlIHNvdXJjZSBvZiB0aGVpciBpc3N1ZXMsIGlmIHRoaXMgaXMgcHJvYmxlbWF0aWMuXG5cdFx0XHQvLyBNRVRBOiBJdCdzIGEgcmVzb3VyY2UgbG9jYXRvciFcblx0XHRcdHJlc3VsdCA9IF9TeW1ib2xbJ2ZvciddKCdodHRwczovL2dpdGh1Yi5jb20vYmVubGVzaC9zeW1ib2wtb2JzZXJ2YWJsZScpO1xuXHRcdFx0dHJ5IHtcblx0XHRcdFx0X1N5bWJvbC5vYnNlcnZhYmxlID0gcmVzdWx0O1xuXHRcdFx0fSBjYXRjaCAoZXJyKSB7XG5cdFx0XHRcdC8vIERvIG5vdGhpbmcuIEluIHNvbWUgZW52aXJvbm1lbnRzLCB1c2VycyBoYXZlIGZyb3plbiBgU3ltYm9sYCBmb3Igc2VjdXJpdHkgcmVhc29ucyxcblx0XHRcdFx0Ly8gaWYgaXQgaXMgZnJvemVuIGFzc2lnbmluZyB0byBpdCB3aWxsIHRocm93LiBJbiB0aGlzIGNhc2UsIHdlIGRvbid0IGNhcmUsIGJlY2F1c2Vcblx0XHRcdFx0Ly8gdGhleSB3aWxsIG5lZWQgdG8gdXNlIHRoZSByZXR1cm5lZCB2YWx1ZSBmcm9tIHRoZSBwb255ZmlsbC5cblx0XHRcdH1cblx0XHR9XG5cdH0gZWxzZSB7XG5cdFx0cmVzdWx0ID0gJ0BAb2JzZXJ2YWJsZSc7XG5cdH1cblxuXHRyZXR1cm4gcmVzdWx0O1xufTsiXSwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbMF0sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(ssr)/./node_modules/symbol-observable/lib/ponyfill.js\n");

/***/ }),

/***/ "(ssr)/./node_modules/symbol-observable/ponyfill.js":
/*!****************************************************!*\
  !*** ./node_modules/symbol-observable/ponyfill.js ***!
  \****************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

eval("module.exports = __webpack_require__(/*! ./lib/ponyfill */ \"(ssr)/./node_modules/symbol-observable/lib/ponyfill.js\");\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHNzcikvLi9ub2RlX21vZHVsZXMvc3ltYm9sLW9ic2VydmFibGUvcG9ueWZpbGwuanMiLCJtYXBwaW5ncyI6IkFBQUEsb0hBQTBDIiwic291cmNlcyI6WyIvVXNlcnMva29uZ3Bob3BraW5ncGV0L0RvY3VtZW50cy9HaXRodWIvWnJpbmdvdHRzL2Zyb250ZW5kL25vZGVfbW9kdWxlcy9zeW1ib2wtb2JzZXJ2YWJsZS9wb255ZmlsbC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vbGliL3BvbnlmaWxsJyk7XG4iXSwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbMF0sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(ssr)/./node_modules/symbol-observable/ponyfill.js\n");

/***/ })

};
;