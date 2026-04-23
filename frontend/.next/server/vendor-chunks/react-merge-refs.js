"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "vendor-chunks/react-merge-refs";
exports.ids = ["vendor-chunks/react-merge-refs"];
exports.modules = {

/***/ "(ssr)/./node_modules/react-merge-refs/dist/index.js":
/*!*****************************************************!*\
  !*** ./node_modules/react-merge-refs/dist/index.js ***!
  \*****************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   assignRef: () => (/* binding */ assignRef),\n/* harmony export */   mergeRefs: () => (/* binding */ mergeRefs),\n/* harmony export */   useMergeRefs: () => (/* binding */ useMergeRefs)\n/* harmony export */ });\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ \"(ssr)/./node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js\");\n// src/index.ts\n\n\n// src/mergeRefsReact16.ts\nfunction mergeRefsReact16(refs) {\n  return (value) => {\n    for (const ref of refs) assignRef(ref, value);\n  };\n}\n\n// src/mergeRefsReact19.ts\nfunction mergeRefsReact19(refs) {\n  return (value) => {\n    const cleanups = [];\n    for (const ref of refs) {\n      const cleanup = assignRef(ref, value);\n      const isCleanup = typeof cleanup === \"function\";\n      cleanups.push(isCleanup ? cleanup : () => assignRef(ref, null));\n    }\n    return () => {\n      for (const cleanup of cleanups) cleanup();\n    };\n  };\n}\n\n// src/index.ts\nfunction assignRef(ref, value) {\n  if (typeof ref === \"function\") {\n    return ref(value);\n  } else if (ref) {\n    ref.current = value;\n  }\n}\nvar mergeRefs = parseInt(react__WEBPACK_IMPORTED_MODULE_0__.version.split(\".\")[0], 10) >= 19 ? mergeRefsReact19 : mergeRefsReact16;\nfunction useMergeRefs(refs) {\n  return (0,react__WEBPACK_IMPORTED_MODULE_0__.useMemo)(() => mergeRefs(refs), refs);\n}\n\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHNzcikvLi9ub2RlX21vZHVsZXMvcmVhY3QtbWVyZ2UtcmVmcy9kaXN0L2luZGV4LmpzIiwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFBQTtBQUN5Qzs7QUFFekM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJO0FBQ0o7QUFDQTtBQUNBO0FBQ0EseUJBQXlCLDBDQUFPO0FBQ2hDO0FBQ0EsU0FBUyw4Q0FBTztBQUNoQjtBQUtFIiwic291cmNlcyI6WyIvVXNlcnMva29uZ3Bob3BraW5ncGV0L0RvY3VtZW50cy9HaXRodWIvWnJpbmdvdHRzL2Zyb250ZW5kL25vZGVfbW9kdWxlcy9yZWFjdC1tZXJnZS1yZWZzL2Rpc3QvaW5kZXguanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gc3JjL2luZGV4LnRzXG5pbXBvcnQgeyB1c2VNZW1vLCB2ZXJzaW9uIH0gZnJvbSBcInJlYWN0XCI7XG5cbi8vIHNyYy9tZXJnZVJlZnNSZWFjdDE2LnRzXG5mdW5jdGlvbiBtZXJnZVJlZnNSZWFjdDE2KHJlZnMpIHtcbiAgcmV0dXJuICh2YWx1ZSkgPT4ge1xuICAgIGZvciAoY29uc3QgcmVmIG9mIHJlZnMpIGFzc2lnblJlZihyZWYsIHZhbHVlKTtcbiAgfTtcbn1cblxuLy8gc3JjL21lcmdlUmVmc1JlYWN0MTkudHNcbmZ1bmN0aW9uIG1lcmdlUmVmc1JlYWN0MTkocmVmcykge1xuICByZXR1cm4gKHZhbHVlKSA9PiB7XG4gICAgY29uc3QgY2xlYW51cHMgPSBbXTtcbiAgICBmb3IgKGNvbnN0IHJlZiBvZiByZWZzKSB7XG4gICAgICBjb25zdCBjbGVhbnVwID0gYXNzaWduUmVmKHJlZiwgdmFsdWUpO1xuICAgICAgY29uc3QgaXNDbGVhbnVwID0gdHlwZW9mIGNsZWFudXAgPT09IFwiZnVuY3Rpb25cIjtcbiAgICAgIGNsZWFudXBzLnB1c2goaXNDbGVhbnVwID8gY2xlYW51cCA6ICgpID0+IGFzc2lnblJlZihyZWYsIG51bGwpKTtcbiAgICB9XG4gICAgcmV0dXJuICgpID0+IHtcbiAgICAgIGZvciAoY29uc3QgY2xlYW51cCBvZiBjbGVhbnVwcykgY2xlYW51cCgpO1xuICAgIH07XG4gIH07XG59XG5cbi8vIHNyYy9pbmRleC50c1xuZnVuY3Rpb24gYXNzaWduUmVmKHJlZiwgdmFsdWUpIHtcbiAgaWYgKHR5cGVvZiByZWYgPT09IFwiZnVuY3Rpb25cIikge1xuICAgIHJldHVybiByZWYodmFsdWUpO1xuICB9IGVsc2UgaWYgKHJlZikge1xuICAgIHJlZi5jdXJyZW50ID0gdmFsdWU7XG4gIH1cbn1cbnZhciBtZXJnZVJlZnMgPSBwYXJzZUludCh2ZXJzaW9uLnNwbGl0KFwiLlwiKVswXSwgMTApID49IDE5ID8gbWVyZ2VSZWZzUmVhY3QxOSA6IG1lcmdlUmVmc1JlYWN0MTY7XG5mdW5jdGlvbiB1c2VNZXJnZVJlZnMocmVmcykge1xuICByZXR1cm4gdXNlTWVtbygoKSA9PiBtZXJnZVJlZnMocmVmcyksIHJlZnMpO1xufVxuZXhwb3J0IHtcbiAgYXNzaWduUmVmLFxuICBtZXJnZVJlZnMsXG4gIHVzZU1lcmdlUmVmc1xufTtcbiJdLCJuYW1lcyI6W10sImlnbm9yZUxpc3QiOlswXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(ssr)/./node_modules/react-merge-refs/dist/index.js\n");

/***/ })

};
;