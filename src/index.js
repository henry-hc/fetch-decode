"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
exports.__esModule = true;
exports.deleteAndDecode = exports.patchAndDecode = exports.putAndDecode = exports.postAndDecode = exports.fetchAndDecode = exports.getAndDecode = exports.initFetchAndDecode = void 0;
var TaskEither_1 = require("fp-ts/lib/TaskEither");
var function_1 = require("fp-ts/lib/function");
var Either_1 = require("fp-ts/lib/Either");
var PathReporter_1 = require("io-ts/lib/PathReporter");
var toFetchError = function (reason) { return ({
    _tag: "FETCH_ERROR",
    message: reason,
    name: "fetch error"
}); };
var fetchTE = function (input, init) {
    return TaskEither_1.tryCatch(function () { return fetch(input, init); }, toFetchError);
};
var consumeJsonStream = function (response) {
    return function_1.pipe(function () {
        return response
            .json()["catch"](function (_) { return null; })
            .then(function (json) { return ({ response: response, json: json }); });
    }, TaskEither_1.rightTask);
};
var parseFetchResponse = function (_a) {
    var response = _a.response, json = _a.json;
    return response.ok
        ? Either_1.right(json)
        : Either_1.left({
            _tag: "HTTP_ERROR",
            name: "HTTPError",
            status: response.status,
            message: "" + (json || response.statusText)
        });
};
var validationErrorsToError = function (errors) { return ({
    _tag: "DECODE_ERROR",
    message: PathReporter_1.failure(errors).join("/n"),
    name: "decode error"
}); };
/**
 * Wraps fetch request in TaskEither.  When request succeeds (`ok === true`),
 * attempts to decode the result using `responseType` instance of `io-ts`
 * `Type`.
 *
 * If the request fails, `left` will be an HTTPError, which provides the
 * respone's `status` code.  If decode fails, will provide details in `message`
 * prop of Error.
 *
 * The init param of `fetch` is the cominiation of `baseInit` and `init`--such
 * that the values of `baseInit` act as the defaults and `init` value are the
 * request specific settings, i.e.:
 * `{..baseInit, ...init}`
 *
 * @since 0.2.0
 */
exports.initFetchAndDecode = function (baseInit) { return function (responseType) { return function (input, init) {
    return function_1.pipe(fetchTE(input, __assign(__assign({}, baseInit), init)), TaskEither_1.chain(consumeJsonStream), TaskEither_1.chainEitherKW(parseFetchResponse), TaskEither_1.chainEitherKW(function_1.flow(responseType.decode, Either_1.mapLeft(validationErrorsToError))));
}; }; };
var jsonContentHeader = {
    headers: {
        "Content-type": "application/json; charset=UTF-8"
    }
};
/**
 * No defaults for `init`, which will default to GET for HTTP. Does not set
 * `accepts` or other headers, which some API's may require.
 *
 * [see also initFetchAndDecode](#initfetchanddecode)
 * @since 0.2.0
 */
exports.getAndDecode = exports.initFetchAndDecode();
/**
 * Same as getAndDecode, for backwards compatibility.
 *
 * [see also initFetchAndDecode](#initfetchanddecode)
 * @since 0.1.0
 */
exports.fetchAndDecode = exports.getAndDecode;
/**
 * Defaults `init` to `method: "POST"` + `"Content-type":
 * "application/json; charset=UTF-8"` header.
 *
 * [see also initFetchAndDecode](#initfetchanddecode)
 * @since 0.2.0
 */
exports.postAndDecode = exports.initFetchAndDecode(__assign({ method: "POST" }, jsonContentHeader));
/**
 * Defaults `init` to `method: "PUT"` + `"Content-type":
 * "application/json; charset=UTF-8"` header.
 *
 * [see also initFetchAndDecode](#initfetchanddecode)
 * @since 0.2.0
 */
exports.putAndDecode = exports.initFetchAndDecode(__assign({ method: "PUT" }, jsonContentHeader));
/**
 * Defaults `init` to `method: "PATCH"` + `"Content-type":
 * "application/json; charset=UTF-8"` header.
 *
 * [see also initFetchAndDecode](#initfetchanddecode)
 * @since 0.2.0
 */
exports.patchAndDecode = exports.initFetchAndDecode(__assign({ method: "PATCH" }, jsonContentHeader));
/**
 * Defaults `init` to `method: "DELETE"`.
 *
 * [see also initFetchAndDecode](#initfetchanddecode)
 * @since 0.2.0
 */
exports.deleteAndDecode = exports.initFetchAndDecode({
    method: "DELETE"
});
