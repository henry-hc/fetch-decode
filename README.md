# fetch-decode
fp-ts + io-ts + fetch

_*preproduction work in progress*_

Intent is to use io-ts to provide run time type checking for results from 
fetch requests in browser.  Responses are returned in the `fp-ts` datatype `TaskEither`,
which provides a useful layer around Promises, for more structured/reliable async code.

Runs inside of `TaskEither` monad.

Only useful with Typescript.  Transpiled Javascript not included.

_note: tests do not mock requests, instead they hit `typicode.com` and `httpstat.us`
test sites.  If those are down, tests will not run._
