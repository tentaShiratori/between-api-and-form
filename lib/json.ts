export function getCircularReplacer() {
  const seen = new WeakSet();
  return function (key: string, value: unknown) {
    if (key === "ref") return;
    if (typeof value === "object" && value !== null) {
      if (seen.has(value)) {
        return;
      }
      seen.add(value);
    }
    return value;
  };
}
