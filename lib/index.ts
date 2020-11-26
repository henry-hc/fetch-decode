import * as t from "io-ts";
import {
  TaskEither,
  chain,
  chainEitherK,
  tryCatch,
} from "fp-ts/lib/TaskEither";
import { flow, pipe } from "fp-ts/lib/function";
import { Either, mapLeft, toError, left, right } from "fp-ts/lib/Either";
import { failure } from "io-ts/lib/PathReporter";

export interface HTTPError extends Error {
  status: number;
}
export type FetchError = Error | HTTPError;

const fetchTE = (input: RequestInfo, init?: RequestInit) =>
  tryCatch(() => fetch(input, init), toError);

const consumeJsonStreamThunk = (response: Response) => () =>
  response
    .json()
    // always try to parse JSON, but if it throws,
    // swallow and make json prop null
    .catch((_) => null)
    .then((json) => ({ response, json }));
const consumeJsonStreamTE = (response: Response) =>
  tryCatch(consumeJsonStreamThunk(response), toError);

const parseFetchResponse = ({
  response,
  json,
}: {
  response: Response;
  json: any;
}): Either<FetchError, unknown> => {
  return response.ok
    ? right(json)
    : left({
        name: "HTTPError",
        status: response.status,
        message: `${json || response.statusText}`,
      });
};

const validationErrorsToError = (errors: t.Errors): Error =>
  new Error(failure(errors).join("/n"));

export const initFetchAndDecode = (baseInit?: RequestInit) => <R>(
  responseType: t.Type<R>
) => (input: RequestInfo, init?: RequestInit): TaskEither<FetchError, R> => {
  return pipe(
    fetchTE(input, { ...baseInit, ...init }),
    chain(consumeJsonStreamTE),
    chainEitherK(parseFetchResponse),
    chainEitherK(flow(responseType.decode, mapLeft(validationErrorsToError)))
  );
};

const jsonContentHeader = {
  headers: {
    "Content-type": "application/json; charset=UTF-8",
  },
};

export const getAndDecode = initFetchAndDecode();
// for backwards compat
export const fetchAndDecode = getAndDecode;
export const postAndDecode = initFetchAndDecode({
  method: "POST",
  ...jsonContentHeader,
});
export const putAndDecode = initFetchAndDecode({
  method: "PUT",
  ...jsonContentHeader,
});
export const patchAndDecode = initFetchAndDecode({
  method: "PATCH",
  ...jsonContentHeader,
});
export const deleteAndDecode = initFetchAndDecode({
  method: "DELETE",
});
