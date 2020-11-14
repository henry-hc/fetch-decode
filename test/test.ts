import tap from "tap";
import fetch from "node-fetch";
import * as t from "io-ts";
import { fetchAndDecode, FetchError } from "../lib";
import { isLeft, isRight, mapLeft } from "fp-ts/lib/Either";

globalThis.fetch = fetch;

const Todo = t.type(
  {
    userId: t.number,
    id: t.number,
    title: t.string,
    completed: t.boolean,
  },
  "Todo"
);

type Todo = t.TypeOf<typeof Todo>;

tap.test("real fetch works", async (t) => {
  const fetcher = fetchAndDecode(Todo)(
    "https://jsonplaceholder.typicode.com/todos/1"
  );
  const result = await fetcher();
  t.true(isRight(result));
});

const TodoWithError = t.type(
  {
    userId: t.number,
    id: t.string,
    title: t.string,
    completed: t.boolean,
  },
  "Todo"
);

type TodoWithError = t.TypeOf<typeof TodoWithError>;

tap.test("fetch decode returns error", async (t) => {
  const fetcher = fetchAndDecode(TodoWithError)(
    "https://jsonplaceholder.typicode.com/todos/1"
  );
  const result = await fetcher();
  t.true(isLeft(result));
});

tap.test("404 response returns well formed error", async (t) => {
  const fetcher = fetchAndDecode(Todo)(
    "https://httpstat.us/404"
  );
  const result = await fetcher();
  t.true(isLeft(result));
});

tap.test("404 *JSON* response returns well formed error", async (t) => {
  const fetcher = fetchAndDecode(Todo)(
    "https://httpstat.us/404",
    {
      headers: {
        "accept": "application/json",
      },
    }
  );
  const result = await fetcher();
  t.true(isLeft(result));
  mapLeft((error: FetchError) => t.true(("status" in error)))(result)
});
