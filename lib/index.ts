import * as t from "io-ts";
import {
  chain,
  chainEitherK,
  left,
  right,
  TaskEither,
  tryCatch,
} from "fp-ts/lib/TaskEither";
import { flow, hole, pipe } from "fp-ts/lib/function";
import { mapLeft, toError } from "fp-ts/lib/Either";
import { failure } from "io-ts/lib/PathReporter";

export interface HTTPError extends Error {
  status: number;
}
export type FetchError = Error | HTTPError;

const fetchThunk = (input: RequestInfo, init?: RequestInit) => () =>
  fetch(input, init);
const fetchTE = (input: RequestInfo, init?: RequestInit) =>
  tryCatch(fetchThunk(input, init), toError);

const consumeJsonStreamThunk = (response: Response) =>
  response
    .json()
    // always try to parse JSON, but if it throws,
    // swallow and make json prop null
    .catch((_) => null)
    .then((json) => ({ response, json }));
const consumeJsonStreamTE = (response: Response) =>
  tryCatch(() => consumeJsonStreamThunk(response), toError);

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
        message: `${json || response.statusText}`,
      });
};

const validationErrorsToError = (errors: t.Errors): Error =>
  new Error(failure(errors).join("/n"));

export const fetchAndDecode = <R>(responseType: t.Type<R>) => (
  input: RequestInfo,
  init?: RequestInit
): TaskEither<FetchError, R> => {
  return pipe(
    fetchTE(input, init),
    chain(consumeJsonStreamTE),
    chain(parseFetchResponse),
    chainEitherK(flow(responseType.decode, mapLeft(validationErrorsToError)))
  );
};
