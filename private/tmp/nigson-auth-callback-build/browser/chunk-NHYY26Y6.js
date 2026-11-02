var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
    for (var prop in b ||= {})
        if (__hasOwnProp.call(b, prop))
            __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
        for (var prop of __getOwnPropSymbols(b)) {
            if (__propIsEnum.call(b, prop))
                __defNormalProp(a, prop, b[prop]);
        }
    return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
var __async = (__this, __arguments, generator) => {
    return new Promise((resolve, reject) => {
        var fulfilled = (value) => {
            try {
                step(generator.next(value));
            }
            catch (e) {
                reject(e);
            }
        };
        var rejected = (value) => {
            try {
                step(generator.throw(value));
            }
            catch (e) {
                reject(e);
            }
        };
        var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
        step((generator = generator.apply(__this, __arguments)).next());
    });
};
// node_modules/@angular/common/fesm2022/_platform_location-chunk.mjs
import * as i0 from "@angular/core";
import { InjectionToken, inject, DOCUMENT, Injectable } from "@angular/core";
var _DOM = null;
function getDOM() {
    return _DOM;
}
function setRootDomAdapter(adapter) {
    _DOM ??= adapter;
}
var DomAdapter = class {
};
var PlatformLocation = class _PlatformLocation {
    historyGo(relativePosition) {
        throw new Error(ngDevMode ? "Not implemented" : "");
    }
    static \u0275fac = function PlatformLocation_Factory(__ngFactoryType__) {
        return new (__ngFactoryType__ || _PlatformLocation)();
    };
    static \u0275prov = /* @__PURE__ */ i0.\u0275\u0275defineInjectable({
        token: _PlatformLocation,
        factory: () => (() => inject(BrowserPlatformLocation))(),
        providedIn: "platform"
    });
};
(() => {
    (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassMetadata(PlatformLocation, [{
            type: Injectable,
            args: [{
                    providedIn: "platform",
                    useFactory: () => inject(BrowserPlatformLocation)
                }]
        }], null, null);
})();
var LOCATION_INITIALIZED = new InjectionToken(typeof ngDevMode !== "undefined" && ngDevMode ? "Location Initialized" : "");
var BrowserPlatformLocation = class _BrowserPlatformLocation extends PlatformLocation {
    _location;
    _history;
    _doc = inject(DOCUMENT);
    constructor() {
        super();
        this._location = window.location;
        this._history = window.history;
    }
    getBaseHrefFromDOM() {
        return getDOM().getBaseHref(this._doc);
    }
    onPopState(fn) {
        const window2 = getDOM().getGlobalEventTarget(this._doc, "window");
        window2.addEventListener("popstate", fn, false);
        return () => window2.removeEventListener("popstate", fn);
    }
    onHashChange(fn) {
        const window2 = getDOM().getGlobalEventTarget(this._doc, "window");
        window2.addEventListener("hashchange", fn, false);
        return () => window2.removeEventListener("hashchange", fn);
    }
    get href() {
        return this._location.href;
    }
    get protocol() {
        return this._location.protocol;
    }
    get hostname() {
        return this._location.hostname;
    }
    get port() {
        return this._location.port;
    }
    get pathname() {
        return this._location.pathname;
    }
    get search() {
        return this._location.search;
    }
    get hash() {
        return this._location.hash;
    }
    set pathname(newPath) {
        this._location.pathname = newPath;
    }
    pushState(state, title, url) {
        this._history.pushState(state, title, url);
    }
    replaceState(state, title, url) {
        this._history.replaceState(state, title, url);
    }
    forward() {
        this._history.forward();
    }
    back() {
        this._history.back();
    }
    historyGo(relativePosition = 0) {
        this._history.go(relativePosition);
    }
    getState() {
        return this._history.state;
    }
    static \u0275fac = function BrowserPlatformLocation_Factory(__ngFactoryType__) {
        return new (__ngFactoryType__ || _BrowserPlatformLocation)();
    };
    static \u0275prov = /* @__PURE__ */ i0.\u0275\u0275defineInjectable({
        token: _BrowserPlatformLocation,
        factory: () => (() => new _BrowserPlatformLocation())(),
        providedIn: "platform"
    });
};
(() => {
    (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassMetadata(BrowserPlatformLocation, [{
            type: Injectable,
            args: [{
                    providedIn: "platform",
                    useFactory: () => new BrowserPlatformLocation()
                }]
        }], () => [], null);
})();
// node_modules/@angular/common/fesm2022/_xhr-chunk.mjs
import * as i02 from "@angular/core";
import { Service, Injectable as Injectable2 } from "@angular/core";
function parseCookieValue(cookieStr, name) {
    name = encodeURIComponent(name);
    for (const cookie of cookieStr.split(";")) {
        const eqIndex = cookie.indexOf("=");
        const [cookieName, cookieValue] = eqIndex == -1 ? [cookie, ""] : [cookie.slice(0, eqIndex), cookie.slice(eqIndex + 1)];
        if (cookieName.trim() !== name) {
            continue;
        }
        let value = cookieValue;
        try {
            value = decodeURIComponent(cookieValue);
        }
        catch {
        }
        if (value.length > 1 && value[0] === '"' && value[value.length - 1] === '"') {
            value = value.slice(1, -1);
        }
        return value;
    }
    return null;
}
var BrowserXhr = class _BrowserXhr {
    build() {
        return new XMLHttpRequest();
    }
    static \u0275fac = function BrowserXhr_Factory(__ngFactoryType__) {
        return new (__ngFactoryType__ || _BrowserXhr)();
    };
    static \u0275prov = /* @__PURE__ */ i02.\u0275\u0275defineService({
        token: _BrowserXhr,
        factory: _BrowserXhr.\u0275fac
    });
};
(() => {
    (typeof ngDevMode === "undefined" || ngDevMode) && i02.\u0275setClassMetadata(BrowserXhr, [{
            type: Service
        }], null, null);
})();
var XhrFactory = class _XhrFactory {
    static \u0275fac = function XhrFactory_Factory(__ngFactoryType__) {
        return new (__ngFactoryType__ || _XhrFactory)();
    };
    static \u0275prov = /* @__PURE__ */ i02.\u0275\u0275defineInjectable({
        token: _XhrFactory,
        factory: function XhrFactory_Factory(__ngFactoryType__) {
            let __ngConditionalFactory__ = null;
            if (__ngFactoryType__) {
                __ngConditionalFactory__ = new (__ngFactoryType__ || _XhrFactory)();
            }
            else {
                __ngConditionalFactory__ = i02.\u0275\u0275inject(BrowserXhr);
            }
            return __ngConditionalFactory__;
        },
        providedIn: "root"
    });
};
(() => {
    (typeof ngDevMode === "undefined" || ngDevMode) && i02.\u0275setClassMetadata(XhrFactory, [{
            type: Injectable2,
            args: [{
                    providedIn: "root",
                    useExisting: BrowserXhr
                }]
        }], null, null);
})();
export { __spreadValues, __spreadProps, __async, getDOM, setRootDomAdapter, DomAdapter, PlatformLocation, LOCATION_INITIALIZED, BrowserPlatformLocation, parseCookieValue, XhrFactory };
/*! Bundled license information:

@angular/common/fesm2022/_platform_location-chunk.mjs:
@angular/common/fesm2022/_xhr-chunk.mjs:
  (**
   * @license Angular v22.1.6
   * (c) 2010-2026 Google LLC. https://angular.dev/
   * License: MIT
   *)
*/
//# sourceMappingURL=chunk-NHYY26Y6.js.map
