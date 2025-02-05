// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DeepMergeable = { [key: string]: any };

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null 
    && typeof value === 'object' 
    && Object.getPrototypeOf(value) === Object.prototype;
}

export function deepMerge<T extends DeepMergeable, U extends DeepMergeable>(
  target: T,
  source: U,
): T & U {
  const result: DeepMergeable = { ...target };

  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const sourceValue = source[key];
      const targetValue = result[key];
      
      // Handle arrays - merge them
      if (Array.isArray(sourceValue)) {
        result[key] = Array.isArray(targetValue)
          ? [...targetValue, ...sourceValue]
          : [...sourceValue];
        continue;
      }
      
      // Handle plain objects (not null, not arrays, not class instances)
      if (isPlainObject(sourceValue)) {
        result[key] = Object.prototype.hasOwnProperty.call(result, key) 
          && isPlainObject(result[key])
            ? deepMerge(result[key], sourceValue)
            : deepMerge({}, sourceValue);
        continue;
      }
      
      // Handle primitives and everything else
      result[key] = sourceValue;
    }
  }

  return result as T & U;
}