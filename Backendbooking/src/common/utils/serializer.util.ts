export function serializeBigInt(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (typeof obj === 'bigint') {
    return Number(obj);
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => serializeBigInt(item));
  }
  if (typeof obj === 'object' && !(obj instanceof Date)) {
    const serialized: any = {};
    for (const key of Object.keys(obj)) {
      serialized[key] = serializeBigInt(obj[key]);
    }
    return serialized;
  }
  return obj;
}
