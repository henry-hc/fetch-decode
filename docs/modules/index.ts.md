---
title: index.ts
nav_order: 1
parent: Modules
---

## index overview

Added in v0.1.0

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [FetchError (type alias)](#fetcherror-type-alias)
  - [HTTPError (interface)](#httperror-interface)
  - [deleteAndDecode](#deleteanddecode)
  - [fetchAndDecode](#fetchanddecode)
  - [getAndDecode](#getanddecode)
  - [initFetchAndDecode](#initfetchanddecode)
  - [patchAndDecode](#patchanddecode)
  - [postAndDecode](#postanddecode)
  - [putAndDecode](#putanddecode)

---

# utils

## FetchError (type alias)

**Signature**

```ts
export type FetchError = Error | HTTPError
```

Added in v0.2.0

## HTTPError (interface)

**Signature**

```ts
export interface HTTPError extends Error {
  status: number
}
```

Added in v0.2.0

## deleteAndDecode

Defaults `init` to `method: "DELETE"`.

**Signature**

```ts
export declare const deleteAndDecode: <R>(
  responseType: t.Type<R, R, unknown>
) => (input: RequestInfo, init?: RequestInit) => TaskEither<FetchError, R>
```

Added in v0.2.0

## fetchAndDecode

Same as getAndDecod, for backwards compatibility.

**Signature**

```ts
export declare const fetchAndDecode: <R>(
  responseType: t.Type<R, R, unknown>
) => (input: RequestInfo, init?: RequestInit) => TaskEither<FetchError, R>
```

Added in v0.1.0

## getAndDecode

No defaults for `init`, which will default to GET for HTTP. Does not set
`accepts` or other headers, which some API's may require.

**Signature**

```ts
export declare const getAndDecode: <R>(
  responseType: t.Type<R, R, unknown>
) => (input: RequestInfo, init?: RequestInit) => TaskEither<FetchError, R>
```

Added in v0.2.0

## initFetchAndDecode

Wraps fetch request in TaskEither. When request succeeds (`ok === true`),
attempts to decode the result using `responseType` instance of `io-ts`
`Type`.

If the request fails, `left` will be an HTTPError, which provides the
respone's `status` code. If decode fails, will provide details in `message`
prop of Error.

The init param of `fetch` is the cominiation of `baseInit` and `init`--such
that the values of `baseInit` act as the defaults and `init` value are the
request specific settings, i.e.:
`{..baseInit, ...init}`

**Signature**

```ts
export declare const initFetchAndDecode: (
  baseInit?: RequestInit
) => <R>(responseType: t.Type<R, R, unknown>) => (input: RequestInfo, init?: RequestInit) => TaskEither<FetchError, R>
```

Added in v0.2.0

## patchAndDecode

Defaults `init` to `method: "PATCH"` and sets `"Content-type": "application/json; charset=UTF-8"` header.

**Signature**

```ts
export declare const patchAndDecode: <R>(
  responseType: t.Type<R, R, unknown>
) => (input: RequestInfo, init?: RequestInit) => TaskEither<FetchError, R>
```

Added in v0.2.0

## postAndDecode

Defaults `init` to `method: "POST"` and sets `"Content-type": "application/json; charset=UTF-8"` header.

**Signature**

```ts
export declare const postAndDecode: <R>(
  responseType: t.Type<R, R, unknown>
) => (input: RequestInfo, init?: RequestInit) => TaskEither<FetchError, R>
```

Added in v0.2.0

## putAndDecode

Defaults `init` to `method: "PUT"` and sets `"Content-type": "application/json; charset=UTF-8"` header.

**Signature**

```ts
export declare const putAndDecode: <R>(
  responseType: t.Type<R, R, unknown>
) => (input: RequestInfo, init?: RequestInit) => TaskEither<FetchError, R>
```

Added in v0.2.0
