export const isAnyArrayBuffer = (value: unknown): value is ArrayBuffer =>
  value instanceof ArrayBuffer;

export const isArrayBufferView = (value: unknown): value is ArrayBufferView =>
  ArrayBuffer.isView(value);

export const isAsyncFunction = (value: unknown): boolean =>
  typeof value === "function" && value.constructor?.name === "AsyncFunction";

export const isDataView = (value: unknown): value is DataView =>
  value instanceof DataView;

export const isDate = (value: unknown): value is Date =>
  value instanceof Date;

export const isMap = (value: unknown): value is Map<unknown, unknown> =>
  value instanceof Map;

export const isRegExp = (value: unknown): value is RegExp =>
  value instanceof RegExp;

export const isSet = (value: unknown): value is Set<unknown> =>
  value instanceof Set;

export const isTypedArray = (value: unknown): boolean =>
  ArrayBuffer.isView(value) && !(value instanceof DataView);

export default {
  isAnyArrayBuffer,
  isArrayBufferView,
  isAsyncFunction,
  isDataView,
  isDate,
  isMap,
  isRegExp,
  isSet,
  isTypedArray,
};
