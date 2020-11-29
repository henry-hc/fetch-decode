# fetch-decode

`fp-ts + io-ts + fetch`

_*preproduction work in progress*_

Intent is to use io-ts to provide run time type checking for results from fetch
requests in browser. Responses are returned in the `fp-ts` datatype
`TaskEither`, which provides a useful layer around Promises, for more
structured/reliable async code.

Runs inside of `TaskEither` monad.

## Usage

```TypeScript
import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";
import * as t from "io-ts";
import { getAndDecode } from "fetch-decode";

// using `io-ts` to define the return type interface for the API request
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

// `getAndDecode` will return a TaskEither type (fp-ts), which wraps the promise
// returned by fetch.  Passing in the `Todo` type created above tells
// `fetch-decode` to verify the resulting JSON conforms to this interface.
// Function passed to `TE.map` will receive the Todo object on succeses.
// `TE.mapLeft` will pass any error to the function provided.
const requestTodo = pipe(
  getAndDecode(Todo)("https://jsonplaceholder.typicode.com/todos/1"),
  TE.map(console.log), // { userId: 1, id: 1, title: 'delectus aut autem', completed: false }
  TE.mapLeft(err => {
    const message = err instanceof "HTTPError" ? getHttpErrorMessage(err) :  
    console.error
  })
);

// requestTodo is a `TaskEither` which will resolve the underlying promise from fetch to
// `Either<FetchError, Todo>` when invoked.
requestTodo();
```

## Error Types

`type FetchError = Error | HTTPError;` where `HTTPError` is simply:

```TypeScript
interface HTTPError extends Error {
  status: number;
}
```

Essentially this just gives you easy access to the HTTP response status code,
facilitate handling various 4xx errors and so forth.

## Additional Resources

To learn about using the `fp-ts` datatypes, I recommend this series:
https://rlee.dev/writing/practical-guide-to-fp-ts-part-1 (`TaskEither` is in
part 3), if you prefer to learn with real world examples. If you are comfortable
with math nomenclature and terminology, dive into
https://dev.to/gcanti/functional-design-combinators-14pn and expand your
horizons with the amazing theory behind the magic.

## Notes, Notes, Notes!

_note: Only useful with Typescript. Transpiled Javascript not included. Downside
to this is that it is written with TS 4.0, but may not work with other versions.
This will be revisited in future version, probably reverting to the more normal
practice of distributing .js + TS types._

_note: tests do not mock requests, instead they hit `typicode.com` and `httpstat.us`
test sites. If those are down, tests will not run._
