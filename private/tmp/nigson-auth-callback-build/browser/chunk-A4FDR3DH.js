import { __spreadProps, __spreadValues } from "@nf-internal/chunk-FMGVFGPW";
// node_modules/@angular/core/fesm2022/_effect-chunk.mjs
var activeConsumer = null;
var inNotificationPhase = false;
var epoch = 1;
var postProducerCreatedFn = null;
var SIGNAL = /* @__PURE__ */ Symbol("SIGNAL");
function setActiveConsumer(consumer) {
    const prev = activeConsumer;
    activeConsumer = consumer;
    return prev;
}
function getActiveConsumer() {
    return activeConsumer;
}
function isInNotificationPhase() {
    return inNotificationPhase;
}
function isReactive(value) {
    return value[SIGNAL] !== void 0;
}
var REACTIVE_NODE = {
    version: 0,
    lastCleanEpoch: 0,
    dirty: false,
    producers: void 0,
    producersTail: void 0,
    consumers: void 0,
    consumersTail: void 0,
    recomputing: false,
    consumerAllowSignalWrites: false,
    consumerIsAlwaysLive: false,
    kind: "unknown",
    producerMustRecompute: () => false,
    producerRecomputeValue: () => {
    },
    consumerMarkedDirty: () => {
    },
    consumerOnSignalRead: () => {
    }
};
function producerAccessed(node) {
    if (inNotificationPhase) {
        throw new Error(typeof ngDevMode !== "undefined" && ngDevMode ? `Assertion error: signal read during notification phase` : "");
    }
    if (activeConsumer === null) {
        return;
    }
    activeConsumer.consumerOnSignalRead(node);
    const prevProducerLink = activeConsumer.producersTail;
    if (prevProducerLink !== void 0 && prevProducerLink.producer === node) {
        return;
    }
    let nextProducerLink = void 0;
    const isRecomputing = activeConsumer.recomputing;
    if (isRecomputing) {
        nextProducerLink = prevProducerLink !== void 0 ? prevProducerLink.nextProducer : activeConsumer.producers;
        if (nextProducerLink !== void 0 && nextProducerLink.producer === node) {
            activeConsumer.producersTail = nextProducerLink;
            nextProducerLink.lastReadVersion = node.version;
            nextProducerLink.knownValidAtEpoch = epoch;
            return;
        }
    }
    const prevConsumerLink = node.consumersTail;
    if (prevConsumerLink !== void 0 && prevConsumerLink.consumer === activeConsumer && (!isRecomputing || prevConsumerLink.knownValidAtEpoch === epoch)) {
        return;
    }
    const isLive = consumerIsLive(activeConsumer);
    const newLink = {
        producer: node,
        consumer: activeConsumer,
        nextProducer: nextProducerLink,
        prevConsumer: void 0,
        knownValidAtEpoch: epoch,
        lastReadVersion: node.version,
        nextConsumer: void 0
    };
    activeConsumer.producersTail = newLink;
    if (prevProducerLink !== void 0) {
        prevProducerLink.nextProducer = newLink;
    }
    else {
        activeConsumer.producers = newLink;
    }
    if (isLive) {
        producerAddLiveConsumer(node, newLink);
    }
}
function producerIncrementEpoch() {
    epoch++;
}
function producerUpdateValueVersion(node) {
    if (consumerIsLive(node) && !node.dirty) {
        return;
    }
    if (!node.dirty && node.lastCleanEpoch === epoch) {
        return;
    }
    if (!node.producerMustRecompute(node) && !consumerPollProducersForChange(node)) {
        producerMarkClean(node);
        return;
    }
    node.producerRecomputeValue(node);
    producerMarkClean(node);
}
function producerNotifyConsumers(node) {
    if (node.consumers === void 0) {
        return;
    }
    const prev = inNotificationPhase;
    inNotificationPhase = true;
    try {
        for (let link = node.consumers; link !== void 0; link = link.nextConsumer) {
            const consumer = link.consumer;
            if (!consumer.dirty) {
                consumerMarkDirty(consumer);
            }
        }
    }
    finally {
        inNotificationPhase = prev;
    }
}
function producerUpdatesAllowed() {
    return activeConsumer?.consumerAllowSignalWrites !== false;
}
function consumerMarkDirty(node) {
    node.dirty = true;
    producerNotifyConsumers(node);
    node.consumerMarkedDirty?.(node);
}
function producerMarkClean(node) {
    node.dirty = false;
    node.lastCleanEpoch = epoch;
}
function consumerBeforeComputation(node) {
    if (node)
        resetConsumerBeforeComputation(node);
    return setActiveConsumer(node);
}
function resetConsumerBeforeComputation(node) {
    if (node.producersTail?.knownValidAtEpoch === epoch) {
        let producer = node.producers;
        while (producer !== void 0) {
            producer.knownValidAtEpoch = null;
            producer = producer.nextProducer;
        }
    }
    node.producersTail = void 0;
    node.recomputing = true;
}
function consumerAfterComputation(node, prevConsumer) {
    setActiveConsumer(prevConsumer);
    if (node)
        finalizeConsumerAfterComputation(node);
}
function finalizeConsumerAfterComputation(node) {
    node.recomputing = false;
    const producersTail = node.producersTail;
    let toRemove = producersTail !== void 0 ? producersTail.nextProducer : node.producers;
    if (toRemove !== void 0) {
        if (consumerIsLive(node)) {
            do {
                toRemove = producerRemoveLiveConsumerLink(toRemove);
            } while (toRemove !== void 0);
        }
        if (producersTail !== void 0) {
            producersTail.nextProducer = void 0;
        }
        else {
            node.producers = void 0;
        }
    }
}
function consumerPollProducersForChange(node) {
    for (let link = node.producers; link !== void 0; link = link.nextProducer) {
        const producer = link.producer;
        const seenVersion = link.lastReadVersion;
        if (seenVersion !== producer.version) {
            return true;
        }
        producerUpdateValueVersion(producer);
        if (seenVersion !== producer.version) {
            return true;
        }
    }
    return false;
}
function consumerDestroy(node) {
    if (consumerIsLive(node)) {
        let link = node.producers;
        while (link !== void 0) {
            link = producerRemoveLiveConsumerLink(link);
        }
    }
    node.producers = void 0;
    node.producersTail = void 0;
    node.consumers = void 0;
    node.consumersTail = void 0;
}
function producerAddLiveConsumer(node, link) {
    const consumersTail = node.consumersTail;
    const wasLive = consumerIsLive(node);
    if (consumersTail !== void 0) {
        link.nextConsumer = consumersTail.nextConsumer;
        consumersTail.nextConsumer = link;
    }
    else {
        link.nextConsumer = void 0;
        node.consumers = link;
    }
    link.prevConsumer = consumersTail;
    node.consumersTail = link;
    if (!wasLive) {
        for (let link2 = node.producers; link2 !== void 0; link2 = link2.nextProducer) {
            producerAddLiveConsumer(link2.producer, link2);
        }
    }
}
function producerRemoveLiveConsumerLink(link) {
    const producer = link.producer;
    const nextProducer = link.nextProducer;
    const nextConsumer = link.nextConsumer;
    const prevConsumer = link.prevConsumer;
    link.nextConsumer = void 0;
    link.prevConsumer = void 0;
    if (nextConsumer !== void 0) {
        nextConsumer.prevConsumer = prevConsumer;
    }
    else {
        producer.consumersTail = prevConsumer;
    }
    if (prevConsumer !== void 0) {
        prevConsumer.nextConsumer = nextConsumer;
    }
    else {
        producer.consumers = nextConsumer;
        if (!consumerIsLive(producer)) {
            let producerLink = producer.producers;
            while (producerLink !== void 0) {
                producerLink = producerRemoveLiveConsumerLink(producerLink);
            }
        }
    }
    return nextProducer;
}
function consumerIsLive(node) {
    return node.consumerIsAlwaysLive || node.consumers !== void 0;
}
function runPostProducerCreatedFn(node) {
    postProducerCreatedFn?.(node);
}
function setPostProducerCreatedFn(fn) {
    const prev = postProducerCreatedFn;
    postProducerCreatedFn = fn;
    return prev;
}
function defaultEquals(a, b) {
    return Object.is(a, b);
}
function createComputed(computation, equal) {
    const node = Object.create(COMPUTED_NODE);
    node.computation = computation;
    if (equal !== void 0) {
        node.equal = equal;
    }
    const computed = () => {
        producerUpdateValueVersion(node);
        producerAccessed(node);
        if (node.value === ERRORED) {
            throw node.error;
        }
        return node.value;
    };
    computed[SIGNAL] = node;
    if (typeof ngDevMode !== "undefined" && ngDevMode) {
        computed.toString = () => `[Computed${node.debugName ? " (" + node.debugName + ")" : ""}: ${String(node.value)}]`;
    }
    runPostProducerCreatedFn(node);
    return computed;
}
var UNSET = /* @__PURE__ */ Symbol("UNSET");
var COMPUTING = /* @__PURE__ */ Symbol("COMPUTING");
var ERRORED = /* @__PURE__ */ Symbol("ERRORED");
var COMPUTED_NODE = /* @__PURE__ */ (() => {
    return __spreadProps(__spreadValues({}, REACTIVE_NODE), {
        value: UNSET,
        dirty: true,
        error: null,
        equal: defaultEquals,
        kind: "computed",
        producerMustRecompute(node) {
            return node.value === UNSET || node.value === COMPUTING;
        },
        producerRecomputeValue(node) {
            if (node.value === COMPUTING) {
                throw new Error(typeof ngDevMode !== "undefined" && ngDevMode ? "Detected cycle in computations." : "");
            }
            const oldValue = node.value;
            node.value = COMPUTING;
            const prevConsumer = consumerBeforeComputation(node);
            let newValue;
            let wasEqual = false;
            try {
                newValue = node.computation();
                setActiveConsumer(null);
                wasEqual = oldValue !== UNSET && oldValue !== ERRORED && newValue !== ERRORED && node.equal(oldValue, newValue);
            }
            catch (err) {
                newValue = ERRORED;
                node.error = err;
            }
            finally {
                consumerAfterComputation(node, prevConsumer);
            }
            if (wasEqual) {
                node.value = oldValue;
                return;
            }
            node.value = newValue;
            node.version++;
        }
    });
})();
function defaultThrowError() {
    throw new Error();
}
var throwInvalidWriteToSignalErrorFn = defaultThrowError;
function throwInvalidWriteToSignalError(node) {
    throwInvalidWriteToSignalErrorFn(node);
}
function setThrowInvalidWriteToSignalError(fn) {
    throwInvalidWriteToSignalErrorFn = fn;
}
var postSignalSetFn = null;
function createSignal(initialValue, equal) {
    const node = Object.create(SIGNAL_NODE);
    node.value = initialValue;
    if (equal !== void 0) {
        node.equal = equal;
    }
    const getter = () => signalGetFn(node);
    getter[SIGNAL] = node;
    if (typeof ngDevMode !== "undefined" && ngDevMode) {
        getter.toString = () => `[Signal${node.debugName ? " (" + node.debugName + ")" : ""}: ${String(node.value)}]`;
    }
    runPostProducerCreatedFn(node);
    const set = (newValue) => signalSetFn(node, newValue);
    const update = (updateFn) => signalUpdateFn(node, updateFn);
    return [getter, set, update];
}
function setPostSignalSetFn(fn) {
    const prev = postSignalSetFn;
    postSignalSetFn = fn;
    return prev;
}
function signalGetFn(node) {
    producerAccessed(node);
    return node.value;
}
function signalSetFn(node, newValue) {
    if (!producerUpdatesAllowed()) {
        throwInvalidWriteToSignalError(node);
    }
    if (!node.equal(node.value, newValue)) {
        node.value = newValue;
        signalValueChanged(node);
    }
}
function signalUpdateFn(node, updater) {
    if (!producerUpdatesAllowed()) {
        throwInvalidWriteToSignalError(node);
    }
    signalSetFn(node, updater(node.value));
}
function runPostSignalSetFn(node) {
    postSignalSetFn?.(node);
}
var SIGNAL_NODE = /* @__PURE__ */ (() => {
    return __spreadProps(__spreadValues({}, REACTIVE_NODE), {
        equal: defaultEquals,
        value: void 0,
        kind: "signal"
    });
})();
function signalValueChanged(node) {
    node.version++;
    producerIncrementEpoch();
    producerNotifyConsumers(node);
    postSignalSetFn?.(node);
}
var BASE_EFFECT_NODE = /* @__PURE__ */ (() => __spreadProps(__spreadValues({}, REACTIVE_NODE), {
    consumerIsAlwaysLive: true,
    consumerAllowSignalWrites: true,
    dirty: true,
    kind: "effect"
}))();
function runEffect(node) {
    node.dirty = false;
    if (node.version > 0 && !consumerPollProducersForChange(node)) {
        return;
    }
    node.version++;
    const prevNode = consumerBeforeComputation(node);
    try {
        node.cleanup();
        node.fn();
    }
    finally {
        consumerAfterComputation(node, prevNode);
    }
}
// node_modules/@angular/core/fesm2022/_untracked-chunk.mjs
function createLinkedSignal(sourceFn, computationFn, equalityFn) {
    const node = Object.create(LINKED_SIGNAL_NODE);
    node.source = sourceFn;
    node.computation = computationFn;
    if (equalityFn != void 0) {
        node.equal = equalityFn;
    }
    const linkedSignalGetter = () => {
        producerUpdateValueVersion(node);
        producerAccessed(node);
        if (node.value === ERRORED) {
            throw node.error;
        }
        return node.value;
    };
    const getter = linkedSignalGetter;
    getter[SIGNAL] = node;
    if (typeof ngDevMode !== "undefined" && ngDevMode) {
        getter.toString = () => `[LinkedSignal${node.debugName ? " (" + node.debugName + ")" : ""}: ${String(node.value)}]`;
    }
    runPostProducerCreatedFn(node);
    return getter;
}
function linkedSignalSetFn(node, newValue) {
    producerUpdateValueVersion(node);
    signalSetFn(node, newValue);
    producerMarkClean(node);
}
function linkedSignalUpdateFn(node, updater) {
    producerUpdateValueVersion(node);
    if (node.value === ERRORED) {
        throw node.error;
    }
    signalUpdateFn(node, updater);
    producerMarkClean(node);
}
var LINKED_SIGNAL_NODE = /* @__PURE__ */ (() => {
    return __spreadProps(__spreadValues({}, REACTIVE_NODE), {
        value: UNSET,
        dirty: true,
        error: null,
        equal: defaultEquals,
        kind: "linkedSignal",
        producerMustRecompute(node) {
            return node.value === UNSET || node.value === COMPUTING;
        },
        producerRecomputeValue(node) {
            if (node.value === COMPUTING) {
                throw new Error(typeof ngDevMode !== "undefined" && ngDevMode ? "Detected cycle in computations." : "");
            }
            const oldValue = node.value;
            node.value = COMPUTING;
            const prevConsumer = consumerBeforeComputation(node);
            let newValue;
            let wasEqual = false;
            try {
                const newSourceValue = node.source();
                const oldValueValid = oldValue !== UNSET && oldValue !== ERRORED;
                const prev = oldValueValid ? {
                    source: node.sourceValue,
                    value: oldValue
                } : void 0;
                newValue = node.computation(newSourceValue, prev);
                node.sourceValue = newSourceValue;
                setActiveConsumer(null);
                wasEqual = oldValueValid && newValue !== ERRORED && node.equal(oldValue, newValue);
            }
            catch (err) {
                newValue = ERRORED;
                node.error = err;
            }
            finally {
                consumerAfterComputation(node, prevConsumer);
            }
            if (wasEqual) {
                node.value = oldValue;
                return;
            }
            node.value = newValue;
            node.version++;
        }
    });
})();
function untracked(nonReactiveReadsFn) {
    const prevConsumer = setActiveConsumer(null);
    try {
        return nonReactiveReadsFn();
    }
    finally {
        setActiveConsumer(prevConsumer);
    }
}
// node_modules/@angular/core/fesm2022/_weak_ref-chunk.mjs
function setAlternateWeakRefImpl(impl) {
}
// node_modules/@angular/core/fesm2022/primitives-signals.mjs
var formatter = {
    header: (sig, config) => {
        if (!isSignal(sig) || config?.ngSkipFormatting)
            return null;
        let value;
        try {
            value = sig();
        }
        catch (e) {
            return ["span", `Signal(\u26A0\uFE0F Error)${e.message ? `: ${e.message}` : ""}`];
        }
        const kind = "computation" in sig[SIGNAL] ? "Computed" : "Signal";
        const isPrimitive = value === null || !Array.isArray(value) && typeof value !== "object";
        return ["span", {}, ["span", {}, `${kind}(`], (() => {
                if (isSignal(value)) {
                    return formatter.header(value, config);
                }
                else if (isPrimitive && value !== void 0 && typeof value !== "function") {
                    return ["object", {
                            object: value
                        }];
                }
                else {
                    return prettifyPreview(value);
                }
            })(), ["span", {}, `)`]];
    },
    hasBody: (sig, config) => {
        if (!isSignal(sig))
            return false;
        try {
            sig();
        }
        catch {
            return false;
        }
        return !config?.ngSkipFormatting;
    },
    body: (sig, config) => {
        const color = "var(--sys-color-primary)";
        return ["div", {
                style: `background: #FFFFFF10; padding-left: 4px; padding-top: 2px; padding-bottom: 2px;`
            }, ["div", {
                    style: `color: ${color}`
                }, "Signal value: "], ["div", {
                    style: `padding-left: .5rem;`
                }, ["object", {
                        object: sig(),
                        config
                    }]], ["div", {
                    style: `color: ${color}`
                }, "Signal function: "], ["div", {
                    style: `padding-left: .5rem;`
                }, ["object", {
                        object: sig,
                        config: __spreadProps(__spreadValues({}, config), {
                            ngSkipFormatting: true
                        })
                    }]]];
    }
};
function prettifyPreview(value) {
    if (value === null)
        return "null";
    if (Array.isArray(value))
        return `Array(${value.length})`;
    if (value instanceof Element)
        return `<${value.tagName.toLowerCase()}>`;
    if (value instanceof URL)
        return `URL`;
    switch (typeof value) {
        case "undefined": {
            return "undefined";
        }
        case "function": {
            if ("prototype" in value) {
                return "class";
            }
            else {
                return "() => {\u2026}";
            }
        }
        case "object": {
            if (value.constructor.name === "Object") {
                return "{\u2026}";
            }
            else {
                return `${value.constructor.name} {}`;
            }
        }
        default: {
            return ["object", {
                    object: value,
                    config: {
                        ngSkipFormatting: true
                    }
                }];
        }
    }
}
function isSignal(value) {
    return value[SIGNAL] !== void 0;
}
function installDevToolsSignalFormatter() {
    globalThis.devtoolsFormatters ??= [];
    if (!globalThis.devtoolsFormatters.some((f) => f === formatter)) {
        globalThis.devtoolsFormatters.push(formatter);
    }
}
function createWatch(fn, schedule, allowSignalWrites) {
    const node = Object.create(WATCH_NODE);
    if (allowSignalWrites) {
        node.consumerAllowSignalWrites = true;
    }
    node.fn = fn;
    node.schedule = schedule;
    const registerOnCleanup = (cleanupFn) => {
        node.cleanupFn = cleanupFn;
    };
    function isWatchNodeDestroyed(node2) {
        return node2.fn === null && node2.schedule === null;
    }
    function destroyWatchNode(node2) {
        if (!isWatchNodeDestroyed(node2)) {
            consumerDestroy(node2);
            node2.cleanupFn();
            node2.fn = null;
            node2.schedule = null;
            node2.cleanupFn = NOOP_CLEANUP_FN;
        }
    }
    const run = () => {
        if (node.fn === null) {
            return;
        }
        if (isInNotificationPhase()) {
            throw new Error(typeof ngDevMode !== "undefined" && ngDevMode ? "Schedulers cannot synchronously execute watches while scheduling." : "");
        }
        node.dirty = false;
        if (node.version > 0 && !consumerPollProducersForChange(node)) {
            return;
        }
        node.version++;
        const prevConsumer = consumerBeforeComputation(node);
        try {
            node.cleanupFn();
            node.cleanupFn = NOOP_CLEANUP_FN;
            node.fn(registerOnCleanup);
        }
        finally {
            consumerAfterComputation(node, prevConsumer);
        }
    };
    node.ref = {
        notify: () => consumerMarkDirty(node),
        run,
        cleanup: () => node.cleanupFn(),
        destroy: () => destroyWatchNode(node),
        [SIGNAL]: node
    };
    return node.ref;
}
var NOOP_CLEANUP_FN = () => {
};
var WATCH_NODE = /* @__PURE__ */ (() => {
    return __spreadProps(__spreadValues({}, REACTIVE_NODE), {
        consumerIsAlwaysLive: true,
        consumerAllowSignalWrites: false,
        consumerMarkedDirty: (node) => {
            if (node.schedule !== null) {
                node.schedule(node.ref);
            }
        },
        cleanupFn: NOOP_CLEANUP_FN
    });
})();
if (typeof ngDevMode === "undefined" || ngDevMode) {
    installDevToolsSignalFormatter();
}
export { SIGNAL, setActiveConsumer, getActiveConsumer, isInNotificationPhase, isReactive, REACTIVE_NODE, producerAccessed, producerIncrementEpoch, producerUpdateValueVersion, producerNotifyConsumers, producerUpdatesAllowed, consumerMarkDirty, producerMarkClean, consumerBeforeComputation, resetConsumerBeforeComputation, consumerAfterComputation, finalizeConsumerAfterComputation, consumerPollProducersForChange, consumerDestroy, runPostProducerCreatedFn, setPostProducerCreatedFn, defaultEquals, createComputed, setThrowInvalidWriteToSignalError, createSignal, setPostSignalSetFn, signalGetFn, signalSetFn, signalUpdateFn, runPostSignalSetFn, SIGNAL_NODE, BASE_EFFECT_NODE, runEffect, createLinkedSignal, linkedSignalSetFn, linkedSignalUpdateFn, untracked, setAlternateWeakRefImpl, installDevToolsSignalFormatter, createWatch };
/*! Bundled license information:

@angular/core/fesm2022/_effect-chunk.mjs:
@angular/core/fesm2022/_untracked-chunk.mjs:
@angular/core/fesm2022/_weak_ref-chunk.mjs:
@angular/core/fesm2022/primitives-signals.mjs:
  (**
   * @license Angular v22.1.6
   * (c) 2010-2026 Google LLC. https://angular.dev/
   * License: MIT
   *)
*/
//# sourceMappingURL=chunk-A4FDR3DH.js.map
