"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const tap_1 = __importDefault(require("tap"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const iots = __importStar(require("io-ts"));
const src_1 = require("../src");
const TE = __importStar(require("fp-ts/lib/TaskEither"));
const function_1 = require("fp-ts/lib/function");
// This library sets at the seam between fp and a very effectful non-fp API.
// Further it is specific to that API, rather than a generalized abstraction.
// Given this, I am opting for doing integration testing rather than pure unit
// testing with mocking for fetch.  If it breaks with fetch (assuming node-fetch
// to be a reliable proxy for browser fetch), then it is broken.  Downsides are
// that the tests rely on external test APIs and are quite slow.  If this were
// ever put into a CI process, this decision should be revisited.
globalThis.fetch = node_fetch_1.default;
const todoApiUrl = "https://jsonplaceholder.typicode.com/todos";
const bogusUrl = "httpsssss://///xxx.yyy.zzz";
const statUrl = "https://httpstat.us/404";
const Todo = iots.type({
    userId: iots.number,
    id: iots.number,
    title: iots.string,
    completed: iots.boolean,
}, "Todo");
const goodTodo = { userId: 0, id: 1, title: "title", completed: false };
// not using the `t` instance passed into the tests works (i.e. `Tap.true`), but
// confuses the TAP reporters. So pass it in for nice output from reporters.
const passIfTodo = (tTrue) => function_1.flow(Todo.is, (v) => tTrue(v, "Is Todo interface type"));
tap_1.default.test("real fetch works", (t) => function_1.pipe(src_1.getAndDecode(Todo)(`${todoApiUrl}/1`), TE.map(passIfTodo(t.true)), TE.mapLeft(({ message }) => t.fail(message)))());
const TodoWithError = iots.type({
    userId: iots.number,
    id: iots.string,
    title: iots.string,
    completed: iots.boolean,
}, "Todo");
tap_1.default.test("invalid url returns fetch error", (t) => function_1.pipe(src_1.getAndDecode(TodoWithError)(bogusUrl), TE.mapLeft(({ _tag }) => t.is(_tag, "FETCH_ERROR")))());
tap_1.default.test("fetch decode returns decode error", (t) => function_1.pipe(src_1.getAndDecode(TodoWithError)(`${todoApiUrl}/1`), TE.mapLeft(({ _tag }) => t.is(_tag, "DECODE_ERROR")))());
tap_1.default.test("404 response returns well formed error", (t) => function_1.pipe(src_1.getAndDecode(Todo)(statUrl), TE.mapLeft((err) => {
    if (err._tag === "HTTP_ERROR")
        t.is(err.status, 404);
    else
        t.fail("`err` is not HTTPError type");
}))());
tap_1.default.test("404 *JSON* response returns well formed error", (t) => function_1.pipe(src_1.getAndDecode(Todo)(statUrl, {
    headers: {
        accept: "application/json",
    },
}), TE.map(() => t.fail("404 result not detected")), TE.mapLeft((err) => {
    if (err._tag === "HTTP_ERROR")
        t.is(err.status, 404);
    else
        t.fail("`err` is not HTTPError type");
}))());
tap_1.default.test("real fetch works for post", (t) => function_1.pipe(src_1.postAndDecode(Todo)(todoApiUrl, {
    body: JSON.stringify(goodTodo),
}), TE.map(passIfTodo(t.true)), TE.mapLeft(() => t.fail()))());
tap_1.default.test("real fetch works for put", (t) => function_1.pipe(src_1.putAndDecode(Todo)(`${todoApiUrl}/1`, {
    body: JSON.stringify(goodTodo),
}), TE.map(passIfTodo(t.true)), TE.mapLeft(() => t.fail()))());
tap_1.default.test("real fetch works for patch", (t) => function_1.pipe(src_1.patchAndDecode(Todo)(`${todoApiUrl}/1`, {
    body: JSON.stringify(goodTodo),
}), TE.map(passIfTodo(t.true)), TE.mapLeft(() => t.fail()))());
tap_1.default.test("real fetch works for delete", (t) => function_1.pipe(src_1.deleteAndDecode(iots.type({}))(`${todoApiUrl}/1`, {
    body: JSON.stringify(goodTodo),
}), TE.map(() => t.pass("request returns 200")), TE.mapLeft(() => t.fail()))());
