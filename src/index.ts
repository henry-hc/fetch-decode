/**
 * For usage examples, please see the project
 * [readme](https://github.com/henry-hc/fetch-decode)
 * @since 0.1.0
 */
import * as t from "io-ts";
import {
  TaskEither,
  chain,
  tryCatch,
  rightTask,
  chainEitherKW,
} from "fp-ts/lib/TaskEither";
import { flow, pipe } from "fp-ts/lib/function";
import { Either, mapLeft, left, right } from "fp-ts/lib/Either";
import { failure } from "io-ts/lib/PathReporter";

/**
 * @since 0.2.0
 */
export interface HTTPError extends Error {
  readonly _tag: "HTTP_ERROR";
  status: number;
}

/**
 * @since 0.3.0
 */
export interface DecodeError extends Error {
  readonly _tag: "DECODE_ERROR";
}

/**
 * @since 0.3.0
 */
export interface FetchError extends Error {
  readonly _tag: "FETCH_ERROR";
}

const toFetchError = (reason): FetchError => ({
  _tag: "FETCH_ERROR",
  message: reason,
  name: "fetch error",
});

const fetchTE = (input: RequestInfo, init?: RequestInit) =>
  tryCatch(() => fetch(input, init), toFetchError);

const consumeJsonStream = (
  response: Response
): TaskEither<FetchError, { response: Response; json: any }> =>
  pipe(
    () =>
      response
        .json()
        // always try to parse JSON, but if it throws,
        // swallow and make json prop null
        .catch((_) => null)
        .then((json) => ({ response, json })),
    rightTask
  );

const parseFetchResponse = ({
  response,
  json,
}: {
  response: Response;
  json: any;
}): Either<HTTPError, unknown> => {
  return response.ok
    ? right(json)
    : left({
        _tag: "HTTP_ERROR",
        name: "HTTPError",
        status: response.status,
        message: `${json || response.statusText}`,
      });
};

const validationErrorsToError = (errors: t.Errors): DecodeError => ({
  _tag: "DECODE_ERROR",
  message: failure(errors).join("/n"),
  name: "decode error",
});

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
export const initFetchAndDecode = (baseInit?: RequestInit) => <R>(
  responseType: t.Type<R>
) => (input: RequestInfo, init?: RequestInit) => {
  return pipe(
    fetchTE(input, { ...baseInit, ...init }),
    chain(consumeJsonStream),
    chainEitherKW(parseFetchResponse),
    chainEitherKW(flow(responseType.decode, mapLeft(validationErrorsToError)))
  );
};

const jsonContentHeader = {
  headers: {
    "Content-type": "application/json; charset=UTF-8",
  },
};

/**
 * No defaults for `init`, which will default to GET for HTTP. Does not set
 * `accepts` or other headers, which some API's may require.
 *
 * [see also initFetchAndDecode](#initfetchanddecode)
 * @since 0.2.0
 */
export const getAndDecode = initFetchAndDecode();
/**
 * Same as getAndDecode, for backwards compatibility.
 *
 * [see also initFetchAndDecode](#initfetchanddecode)
 * @since 0.1.0
 */
export const fetchAndDecode = getAndDecode;

/**
 * Defaults `init` to `method: "POST"` + `"Content-type":
 * "application/json; charset=UTF-8"` header.
 *
 * [see also initFetchAndDecode](#initfetchanddecode)
 * @since 0.2.0
 */
export const postAndDecode = initFetchAndDecode({
  method: "POST",
  ...jsonContentHeader,
});
/**
 * Defaults `init` to `method: "PUT"` + `"Content-type":
 * "application/json; charset=UTF-8"` header.
 *
 * [see also initFetchAndDecode](#initfetchanddecode)
 * @since 0.2.0
 */
export const putAndDecode = initFetchAndDecode({
  method: "PUT",
  ...jsonContentHeader,
});
/**
 * Defaults `init` to `method: "PATCH"` + `"Content-type":
 * "application/json; charset=UTF-8"` header.
 *
 * [see also initFetchAndDecode](#initfetchanddecode)
 * @since 0.2.0
 */
export const patchAndDecode = initFetchAndDecode({
  method: "PATCH",
  ...jsonContentHeader,
});
/**
 * Defaults `init` to `method: "DELETE"`.
 *
 * [see also initFetchAndDecode](#initfetchanddecode)
 * @since 0.2.0
 */
export const deleteAndDecode = initFetchAndDecode({
  method: "DELETE",
});
