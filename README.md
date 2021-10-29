# fetch-decode

`fp-ts + io-ts + fetch`

Composition of `io-ts` + `TaskEither` from `fp-ts` + fetch:
- io-ts provides runtime type checking of results from fetch requests in the
  browser, i.e. "decoding".
- `TaskEither` provides a useful layer around Promises, for more
  structured/reliable async code (via the Monad type class).
- `fetch`, just the Web API for HTTP request in browsers. The api to this
  function is exposed as is, even though it is not particulary functional in
  nature.  Headers and URL's and so forth are handled exactly as in unwrapped
  usage of `fetch`, except for the simple addition of the capability set default
  `init` values via High Order Function.

## Installation

`npm install fetch-decode fp-ts io-ts`
or
`yarn add fetch-decode fp-ts io-ts`

## Usage

```ts
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
  getAndDecode(Todo)("https://jsonplaceholder.typicode.com/todossss/1"),
  TE.map(console.log), // { userId: 1, id: 1, title: 'delectus aut autem', completed: false }
  TE.mapLeft(err => {
    // Discriminating union interfaces used for all Errors, discriminating on `_tag` prop.
    const message = err._tag === "HTTP_ERROR" ? `${err.status} - ${err.message}` : err.message ;
    console.error(message);
  })
);

requestTodo();
```

## Error Types

All fetch wrappers return errors of discriminated union type
`FetchError | HTTPError | DecodeError`
, discriminating on `_tag` property.

HTTPError has the additional property of `status` which gives the http status
from the fetch request that failed.  This prop facilitates handling various 4xx
errors like authentication and bad request.

Following snippet would allow you to handle each type of error interface
returned from fetch wrappers:
```ts
  const getMessageForFetchDecodeError = err => {
    switch (err._tag) {
      case "HTTP_ERROR":
        return `Request failed with http status ${err.status}`
      case "DECODE_ERROR":
        return `Response could not be decoded: ${err.message}`
      case "FETCH_ERROR":
        return `Request threw error: ${err.message}`
      default:
        return "Library author added an error type. !#$!%$!$%!$%"
    }
  }
```

## Set Default Init Values

Here is an example of how you could set defaults for headers or other `init`
parameters:

```ts
  const projectHeaders = {
    headers: {
      "apikey": "your project's api key",
    }
  };

  const myProjectsGetFetcher = initFetchAndDecode({ ...projectHeaders });
  const myProjectsPostFetcher = initFetchAndDecode({ ...projectHeaders, method: "POST" });
  // ...
```

## Additional Resources

To learn about using the `fp-ts` datatypes, I recommend this series:
https://rlee.dev/writing/practical-guide-to-fp-ts-part-1 (`TaskEither` is in
part 3), if you prefer to learn with real world examples. If you are comfortable
with math nomenclature and terminology, dive into
https://dev.to/gcanti/functional-design-combinators-14pn and expand your
horizons with the amazing theory behind the magic.

## Notes, Notes, Notes!

_note: Only useful with Typescript, so the transpiled Javascript not included. A downside
to this is that it is written with TS 4.0, but may not work with other versions.
This will be revisited in future version, probably reverting to the more normal
practice of distributing .js + TS types._

_note: tests do not mock requests, instead they hit `typicode.com` and `httpstat.us`
test sites. If those are down, tests will not run._
