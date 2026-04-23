"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "vendor-chunks/globalthis";
exports.ids = ["vendor-chunks/globalthis"];
exports.modules = {

/***/ "(ssr)/./node_modules/globalthis/implementation.js":
/*!***************************************************!*\
  !*** ./node_modules/globalthis/implementation.js ***!
  \***************************************************/
/***/ ((module) => {

eval("\n\nmodule.exports = global;\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHNzcikvLi9ub2RlX21vZHVsZXMvZ2xvYmFsdGhpcy9pbXBsZW1lbnRhdGlvbi5qcyIsIm1hcHBpbmdzIjoiQUFBYTs7QUFFYiIsInNvdXJjZXMiOlsiL1VzZXJzL2tvbmdwaG9wa2luZ3BldC9Eb2N1bWVudHMvR2l0aHViL1pyaW5nb3R0cy9mcm9udGVuZC9ub2RlX21vZHVsZXMvZ2xvYmFsdGhpcy9pbXBsZW1lbnRhdGlvbi5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gZ2xvYmFsO1xuIl0sIm5hbWVzIjpbXSwiaWdub3JlTGlzdCI6WzBdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(ssr)/./node_modules/globalthis/implementation.js\n");

/***/ }),

/***/ "(ssr)/./node_modules/globalthis/index.js":
/*!******************************************!*\
  !*** ./node_modules/globalthis/index.js ***!
  \******************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

eval("\n\nvar defineProperties = __webpack_require__(/*! define-properties */ \"(ssr)/./node_modules/define-properties/index.js\");\n\nvar implementation = __webpack_require__(/*! ./implementation */ \"(ssr)/./node_modules/globalthis/implementation.js\");\nvar getPolyfill = __webpack_require__(/*! ./polyfill */ \"(ssr)/./node_modules/globalthis/polyfill.js\");\nvar shim = __webpack_require__(/*! ./shim */ \"(ssr)/./node_modules/globalthis/shim.js\");\n\nvar polyfill = getPolyfill();\n\nvar getGlobal = function () { return polyfill; };\n\ndefineProperties(getGlobal, {\n\tgetPolyfill: getPolyfill,\n\timplementation: implementation,\n\tshim: shim\n});\n\nmodule.exports = getGlobal;\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHNzcikvLi9ub2RlX21vZHVsZXMvZ2xvYmFsdGhpcy9pbmRleC5qcyIsIm1hcHBpbmdzIjoiQUFBYTs7QUFFYix1QkFBdUIsbUJBQU8sQ0FBQywwRUFBbUI7O0FBRWxELHFCQUFxQixtQkFBTyxDQUFDLDJFQUFrQjtBQUMvQyxrQkFBa0IsbUJBQU8sQ0FBQywrREFBWTtBQUN0QyxXQUFXLG1CQUFPLENBQUMsdURBQVE7O0FBRTNCOztBQUVBLDhCQUE4Qjs7QUFFOUI7QUFDQTtBQUNBO0FBQ0E7QUFDQSxDQUFDOztBQUVEIiwic291cmNlcyI6WyIvVXNlcnMva29uZ3Bob3BraW5ncGV0L0RvY3VtZW50cy9HaXRodWIvWnJpbmdvdHRzL2Zyb250ZW5kL25vZGVfbW9kdWxlcy9nbG9iYWx0aGlzL2luZGV4LmpzIl0sInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxudmFyIGRlZmluZVByb3BlcnRpZXMgPSByZXF1aXJlKCdkZWZpbmUtcHJvcGVydGllcycpO1xuXG52YXIgaW1wbGVtZW50YXRpb24gPSByZXF1aXJlKCcuL2ltcGxlbWVudGF0aW9uJyk7XG52YXIgZ2V0UG9seWZpbGwgPSByZXF1aXJlKCcuL3BvbHlmaWxsJyk7XG52YXIgc2hpbSA9IHJlcXVpcmUoJy4vc2hpbScpO1xuXG52YXIgcG9seWZpbGwgPSBnZXRQb2x5ZmlsbCgpO1xuXG52YXIgZ2V0R2xvYmFsID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gcG9seWZpbGw7IH07XG5cbmRlZmluZVByb3BlcnRpZXMoZ2V0R2xvYmFsLCB7XG5cdGdldFBvbHlmaWxsOiBnZXRQb2x5ZmlsbCxcblx0aW1wbGVtZW50YXRpb246IGltcGxlbWVudGF0aW9uLFxuXHRzaGltOiBzaGltXG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBnZXRHbG9iYWw7XG4iXSwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbMF0sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(ssr)/./node_modules/globalthis/index.js\n");

/***/ }),

/***/ "(ssr)/./node_modules/globalthis/polyfill.js":
/*!*********************************************!*\
  !*** ./node_modules/globalthis/polyfill.js ***!
  \*********************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

eval("\n\nvar implementation = __webpack_require__(/*! ./implementation */ \"(ssr)/./node_modules/globalthis/implementation.js\");\n\nmodule.exports = function getPolyfill() {\n\tif (typeof global !== 'object' || !global || global.Math !== Math || global.Array !== Array) {\n\t\treturn implementation;\n\t}\n\treturn global;\n};\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHNzcikvLi9ub2RlX21vZHVsZXMvZ2xvYmFsdGhpcy9wb2x5ZmlsbC5qcyIsIm1hcHBpbmdzIjoiQUFBYTs7QUFFYixxQkFBcUIsbUJBQU8sQ0FBQywyRUFBa0I7O0FBRS9DO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXMiOlsiL1VzZXJzL2tvbmdwaG9wa2luZ3BldC9Eb2N1bWVudHMvR2l0aHViL1pyaW5nb3R0cy9mcm9udGVuZC9ub2RlX21vZHVsZXMvZ2xvYmFsdGhpcy9wb2x5ZmlsbC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cbnZhciBpbXBsZW1lbnRhdGlvbiA9IHJlcXVpcmUoJy4vaW1wbGVtZW50YXRpb24nKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBnZXRQb2x5ZmlsbCgpIHtcblx0aWYgKHR5cGVvZiBnbG9iYWwgIT09ICdvYmplY3QnIHx8ICFnbG9iYWwgfHwgZ2xvYmFsLk1hdGggIT09IE1hdGggfHwgZ2xvYmFsLkFycmF5ICE9PSBBcnJheSkge1xuXHRcdHJldHVybiBpbXBsZW1lbnRhdGlvbjtcblx0fVxuXHRyZXR1cm4gZ2xvYmFsO1xufTtcbiJdLCJuYW1lcyI6W10sImlnbm9yZUxpc3QiOlswXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(ssr)/./node_modules/globalthis/polyfill.js\n");

/***/ }),

/***/ "(ssr)/./node_modules/globalthis/shim.js":
/*!*****************************************!*\
  !*** ./node_modules/globalthis/shim.js ***!
  \*****************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

eval("\n\nvar define = __webpack_require__(/*! define-properties */ \"(ssr)/./node_modules/define-properties/index.js\");\nvar gOPD = __webpack_require__(/*! gopd */ \"(ssr)/./node_modules/gopd/index.js\");\nvar getPolyfill = __webpack_require__(/*! ./polyfill */ \"(ssr)/./node_modules/globalthis/polyfill.js\");\n\nmodule.exports = function shimGlobal() {\n\tvar polyfill = getPolyfill();\n\tif (define.supportsDescriptors) {\n\t\tvar descriptor = gOPD(polyfill, 'globalThis');\n\t\tif (\n\t\t\t!descriptor\n\t\t\t|| (\n\t\t\t\tdescriptor.configurable\n\t\t\t\t&& (descriptor.enumerable || !descriptor.writable || globalThis !== polyfill)\n\t\t\t)\n\t\t) {\n\t\t\tObject.defineProperty(polyfill, 'globalThis', {\n\t\t\t\tconfigurable: true,\n\t\t\t\tenumerable: false,\n\t\t\t\tvalue: polyfill,\n\t\t\t\twritable: true\n\t\t\t});\n\t\t}\n\t} else if (typeof globalThis !== 'object' || globalThis !== polyfill) {\n\t\tpolyfill.globalThis = polyfill;\n\t}\n\treturn polyfill;\n};\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHNzcikvLi9ub2RlX21vZHVsZXMvZ2xvYmFsdGhpcy9zaGltLmpzIiwibWFwcGluZ3MiOiJBQUFhOztBQUViLGFBQWEsbUJBQU8sQ0FBQywwRUFBbUI7QUFDeEMsV0FBVyxtQkFBTyxDQUFDLGdEQUFNO0FBQ3pCLGtCQUFrQixtQkFBTyxDQUFDLCtEQUFZOztBQUV0QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUk7QUFDSjtBQUNBLEdBQUc7QUFDSDtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXMiOlsiL1VzZXJzL2tvbmdwaG9wa2luZ3BldC9Eb2N1bWVudHMvR2l0aHViL1pyaW5nb3R0cy9mcm9udGVuZC9ub2RlX21vZHVsZXMvZ2xvYmFsdGhpcy9zaGltLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxudmFyIGRlZmluZSA9IHJlcXVpcmUoJ2RlZmluZS1wcm9wZXJ0aWVzJyk7XG52YXIgZ09QRCA9IHJlcXVpcmUoJ2dvcGQnKTtcbnZhciBnZXRQb2x5ZmlsbCA9IHJlcXVpcmUoJy4vcG9seWZpbGwnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBzaGltR2xvYmFsKCkge1xuXHR2YXIgcG9seWZpbGwgPSBnZXRQb2x5ZmlsbCgpO1xuXHRpZiAoZGVmaW5lLnN1cHBvcnRzRGVzY3JpcHRvcnMpIHtcblx0XHR2YXIgZGVzY3JpcHRvciA9IGdPUEQocG9seWZpbGwsICdnbG9iYWxUaGlzJyk7XG5cdFx0aWYgKFxuXHRcdFx0IWRlc2NyaXB0b3Jcblx0XHRcdHx8IChcblx0XHRcdFx0ZGVzY3JpcHRvci5jb25maWd1cmFibGVcblx0XHRcdFx0JiYgKGRlc2NyaXB0b3IuZW51bWVyYWJsZSB8fCAhZGVzY3JpcHRvci53cml0YWJsZSB8fCBnbG9iYWxUaGlzICE9PSBwb2x5ZmlsbClcblx0XHRcdClcblx0XHQpIHtcblx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShwb2x5ZmlsbCwgJ2dsb2JhbFRoaXMnLCB7XG5cdFx0XHRcdGNvbmZpZ3VyYWJsZTogdHJ1ZSxcblx0XHRcdFx0ZW51bWVyYWJsZTogZmFsc2UsXG5cdFx0XHRcdHZhbHVlOiBwb2x5ZmlsbCxcblx0XHRcdFx0d3JpdGFibGU6IHRydWVcblx0XHRcdH0pO1xuXHRcdH1cblx0fSBlbHNlIGlmICh0eXBlb2YgZ2xvYmFsVGhpcyAhPT0gJ29iamVjdCcgfHwgZ2xvYmFsVGhpcyAhPT0gcG9seWZpbGwpIHtcblx0XHRwb2x5ZmlsbC5nbG9iYWxUaGlzID0gcG9seWZpbGw7XG5cdH1cblx0cmV0dXJuIHBvbHlmaWxsO1xufTtcbiJdLCJuYW1lcyI6W10sImlnbm9yZUxpc3QiOlswXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(ssr)/./node_modules/globalthis/shim.js\n");

/***/ })

};
;