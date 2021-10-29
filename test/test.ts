import tap from "tap";
import fetch from "node-fetch";
import * as iots from "io-ts";
import {
  getAndDecode,
  putAndDecode,
  postAndDecode,
  patchAndDecode,
  deleteAndDecode,
} from "../src";
import * as TE from "fp-ts/lib/TaskEither";
import { flow, pipe } from "fp-ts/lib/function";

// This library sets at the seam between fp and a very effectful non-fp API.
// Further it is specific to that API, rather than a generalized abstraction.
// Given this, I am opting for doing integration testing rather than pure unit
// testing with mocking for fetch.  If it breaks with fetch (assuming node-fetch
// to be a reliable proxy for browser fetch), then it is broken.  Downsides are
// that the tests rely on external test APIs and are quite slow.  If this were
// ever put into a CI process, this decision should be revisited.
globalThis.fetch = fetch;

const todoApiUrl = "https://jsonplaceholder.typicode.com/todos";
const bogusUrl = "httpsssss://///xxx.yyy.zzz";
const statUrl = "https://httpstat.us/404";

const Todo = iots.type(
  {
    userId: iots.number,
    id: iots.number,
    title: iots.string,
    completed: iots.boolean,
  },
  "Todo"
);

type Todo = iots.TypeOf<typeof Todo>;

const goodTodo: Todo = { userId: 0, id: 1, title: "title", completed: false };

// not using the `t` instance passed into the tests works (i.e. `Tap.true`), but
// confuses the TAP reporters. So pass it in for nice output from reporters.
const passIfTodo = (tTrue) =>
  flow(Todo.is, (v) => tTrue(v, "Is Todo interface type"));

tap.test("real fetch works", (t) =>
  pipe(
    getAndDecode(Todo)(`${todoApiUrl}/1`),
    TE.map(passIfTodo(t.true)),
    TE.mapLeft(({ message }) => t.fail(message))
  )()
);

const TodoWithError = iots.type(
  {
    userId: iots.number,
    id: iots.string,
    title: iots.string,
    completed: iots.boolean,
  },
  "Todo"
);

type TodoWithError = iots.TypeOf<typeof TodoWithError>;

tap.test("invalid url returns fetch error", (t) =>
  pipe(
    getAndDecode(TodoWithError)(bogusUrl),
    TE.mapLeft(({ _tag }) => t.is(_tag, "FETCH_ERROR"))
  )()
);

tap.test("fetch decode returns decode error", (t) =>
  pipe(
    getAndDecode(TodoWithError)(`${todoApiUrl}/1`),
    TE.mapLeft(({ _tag }) => t.is(_tag, "DECODE_ERROR"))
  )()
);

tap.test("404 response returns well formed error", (t) =>
  pipe(
    getAndDecode(Todo)(statUrl),
    TE.mapLeft((err) => {
      if (err._tag === "HTTP_ERROR") t.is(err.status, 404);
      else t.fail("`err` is not HTTPError type");
    })
  )()
);

tap.test("404 *JSON* response returns well formed error", (t) =>
  pipe(
    getAndDecode(Todo)(statUrl, {
      headers: {
        accept: "application/json",
      },
    }),
    TE.map(() => t.fail("404 result not detected")),
    TE.mapLeft((err) => {
      if (err._tag === "HTTP_ERROR") t.is(err.status, 404);
      else t.fail("`err` is not HTTPError type");
    })
  )()
);

tap.test("real fetch works for post", (t) =>
  pipe(
    postAndDecode(Todo)(todoApiUrl, {
      body: JSON.stringify(goodTodo),
    }),
    TE.map(passIfTodo(t.true)),
    TE.mapLeft(() => t.fail())
  )()
);

tap.test("real fetch works for put", (t) =>
  pipe(
    putAndDecode(Todo)(`${todoApiUrl}/1`, {
      body: JSON.stringify(goodTodo),
    }),
    TE.map(passIfTodo(t.true)),
    TE.mapLeft(() => t.fail())
  )()
);

tap.test("real fetch works for patch", (t) =>
  pipe(
    patchAndDecode(Todo)(`${todoApiUrl}/1`, {
      body: JSON.stringify(goodTodo),
    }),
    TE.map(passIfTodo(t.true)),
    TE.mapLeft(() => t.fail())
  )()
);

tap.test("real fetch works for delete", (t) =>
  pipe(
    deleteAndDecode(iots.type({}))(`${todoApiUrl}/1`, {
      body: JSON.stringify(goodTodo),
    }),
    TE.map(() => t.pass("request returns 200")),
    TE.mapLeft(() => t.fail())
  )()
);
