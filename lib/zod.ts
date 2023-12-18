import zod, {
  ZodArray,
  ZodFirstPartyTypeKind,
  ZodLiteral,
  ZodObject,
  ZodRawShape,
  ZodString,
  ZodType,
  ZodTypeDef,
  ZodUnion,
} from "zod";

type ZodUnknownDef = { typeName: ZodFirstPartyTypeKind } & ZodTypeDef;
type ZodUnknown = ZodType<any, ZodUnknownDef>;

function isObject(
  schema: ZodUnknown,
): schema is ZodObject<ZodRawShape> {
  return schema._def.typeName === ZodFirstPartyTypeKind.ZodObject;
}

function isArray(
  schema: ZodUnknown,
): schema is ZodArray<ZodUnknown> {
  return schema._def.typeName === ZodFirstPartyTypeKind.ZodArray;
}

function isUnion(
  schema: ZodUnknown,
): schema is ZodUnion<[ZodUnknown, ZodUnknown]> {
  return schema._def.typeName === ZodFirstPartyTypeKind.ZodUnion;
}

function isLiteral(
  schema: ZodUnknown,
): schema is ZodLiteral<unknown> {
  return schema._def.typeName === ZodFirstPartyTypeKind.ZodLiteral;
}

type Stringify<T extends ZodUnknown> = T extends ZodObject<infer U> ? ZodObject<{[K in keyof U]: Stringify<U[K]>}>: T extends ZodArray<infer U> ? ZodArray<Stringify<U>> : ZodString;

function coerce<T extends ZodUnknown>(schema: T): T {
  if (schema._def.typeName === ZodFirstPartyTypeKind.ZodString) {
    return zod.coerce.string().pipe(schema) as never;
  }
  if (schema._def.typeName === ZodFirstPartyTypeKind.ZodNumber) {
    return zod.coerce.number().pipe(schema) as never;
  }
  if (schema._def.typeName === ZodFirstPartyTypeKind.ZodBoolean) {
    return zod
      .boolean()
      .or(zod.literal("true"))
      .or(zod.literal("false"))
      .transform((value) => (value == "false" ? false : !!value)) as never;
  }
  if (isLiteral(schema)) {
    if (typeof schema.value === "number") {
      return coerce(zod.number()).pipe(schema) as never;
    }
    if (typeof schema.value === "string") {
      return coerce(zod.string()).pipe(schema) as never;
    }
    if (typeof schema.value === "boolean") {
      return coerce(zod.boolean()).pipe(schema) as never;
    }
  }
  if (isObject(schema)) {
    return zod.object(
      Object.fromEntries(
        Object.entries(schema.shape).map(
          ([key, value]): [
            string,
            ZodType<unknown, { typeName: ZodFirstPartyTypeKind } & ZodTypeDef>,
          ] => {
            return [key, coerce(value)];
          },
        ),
      ),
    ) as never;
  }
  if (isArray(schema)) {
    return zod.array(coerce(schema.element)) as never;
  }
  if (isUnion(schema)) {
    return zod.union(schema.options.map((value) => coerce(value)) as never) as never;
  }
  throw new Error("not implemented");
}

function stringify<T extends ZodUnknown>(schema: T): Stringify<T> {
  if (isObject(schema)) {
    return zod.object(
      Object.fromEntries(
        Object.entries(schema.shape).map(
          ([key, value]): [
            string,
            ZodType<unknown, { typeName: ZodFirstPartyTypeKind } & ZodTypeDef>,
          ] => {
            return [key, stringify(value)];
          },
        ),
      ),
    ) as never
  }
  
  if (isArray(schema)) {
    return zod.array(zod.coerce.string()) as never
  }

  return zod.coerce.string() as never;
}

export function forForm<T extends ZodUnknown>(schema: T): [form:Stringify<T>,validator:T] {
  return [stringify(schema),coerce(schema)]
}