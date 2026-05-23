if (typeof globalThis.DOMException !== "undefined") {
  module.exports = globalThis.DOMException;
} else {
  module.exports = Error;
}
