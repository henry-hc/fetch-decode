import * as t from "io-ts";
import {
  chain,
  chainEitherK,
  left,
  right,
  TaskEither,
  tryCatch,
} from "fp-ts/lib/TaskEither";
import { flow, pipe } from "fp-ts/lib/function";
import {
  mapLeft,
  toError,
} from "fp-ts/lib/Either";
import { failure } from "io-ts/lib/PathReporter";

interface HTTPError extends Error {
  status: number;
}
type FetchError = Error | HTTPError;

const fetchUrlThunk = (input: RequestInfo, init?: RequestInit) => () => {
  return fetch(input, init).then(async (response) => {
    const json = await response.json().catch((_) => null);
    return { response, json };
  });
};

const parseFetchResponse = ({
  response,
  json,
}: {
  response: Response;
  json: any;
}): TaskEither<FetchError, any> => {
  return response.ok
    ? right(json)
    : left({
        name: "HTTPError",
        status: response.status,
        message: `${response.statusText}`, // TODO: check if there is a usable body and return that if there is
      });
};

const validationErrorsToError = (errors: t.Errors): Error =>
  new Error(failure(errors).join("/n"));

export const fetchAndDecode = <R>(responseType: t.Type<R>) => (
  input: RequestInfo,
  init?: RequestInit
): TaskEither<FetchError, R> => {
  return pipe(
    tryCatch(fetchUrlThunk(input, init), toError),
    chain(parseFetchResponse),
    chainEitherK(flow(responseType.decode, mapLeft(validationErrorsToError)))
  );
};
