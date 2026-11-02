// node_modules/@angular/core/fesm2022/_not_found-chunk.mjs
var _currentInjector = void 0;
function getCurrentInjector() {
    return _currentInjector;
}
function setCurrentInjector(injector) {
    const former = _currentInjector;
    _currentInjector = injector;
    return former;
}
function inject(token, options) {
    const currentInjector = getCurrentInjector();
    if (!currentInjector) {
        throw new Error("Current injector is not set.");
    }
    if (!token.\u0275prov) {
        throw new Error("Token is not an injectable");
    }
    return currentInjector.retrieve(token, options);
}
var NOT_FOUND = /* @__PURE__ */ Symbol("NotFound");
var NotFoundError = class extends Error {
    name = "\u0275NotFound";
    constructor(message) {
        super(message);
    }
};
function isNotFound(e) {
    return e === NOT_FOUND || e?.name === "\u0275NotFound";
}
// node_modules/@angular/core/fesm2022/primitives-di.mjs
function defineInjectable(opts) {
    return {
        token: opts.token,
        providedIn: opts.providedIn || null,
        factory: opts.factory,
        value: void 0
    };
}
function registerInjectable(ctor, declaration) {
    ctor.\u0275prov = declaration;
    return ctor;
}
export { getCurrentInjector, setCurrentInjector, inject, NOT_FOUND, NotFoundError, isNotFound, defineInjectable, registerInjectable };
/*! Bundled license information:

@angular/core/fesm2022/_not_found-chunk.mjs:
@angular/core/fesm2022/primitives-di.mjs:
  (**
   * @license Angular v22.1.6
   * (c) 2010-2026 Google LLC. https://angular.dev/
   * License: MIT
   *)
*/
//# sourceMappingURL=chunk-PQCEHEVZ.js.map
