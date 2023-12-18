## 型の生成系いろいろ

この記事は[TypeScriptアドベントカレンダー](https://qiita.com/advent-calendar/2023/typescript)21日目の記事です。

## はじめに

弊社ではいろいろ生成して開発の効率化を図っています。
今回はその中でも、OpenAPIからフォームまで一気通貫で型を合わせる方法を紹介します。

この記事の内容を反映したサンプルプロジェクトを以下に置いておきます。

https://github.com/tentaShiratori/between-api-and-form/tree/bd36ed38d63be730180f87695ea6cfb2b3a866f7

## 前提知識

- React
- OpenAPI

## やること一覧

やることは以下です。

- OpenAPIからRequest・Responseの型と、aspidaの型とコードを生成
- Request・Responseの型から、zodのコードを生成
- zodのコードをフォーム用に変換

## 生成の起点となるOpenAPI

生成の起点はOpenAPIなのでまずOpenAPIを作ります。

実際はバックエンドの人が手で書くか、生成をします。

バックエンドでのOpenAPIの生成方法はフレームワーク次第なので、お使いのフレームワークを調査して下さい。

今回使用するOpenAPIは次です。

```json
{
  "openapi": "3.0.0",
  "info": {
    "version": "1.0.0",
    "title": "Sample"
  },
  "servers": [
    {
      "url": "http://localhost:8000",
      "description": "development"
    }
  ],
  "components": {
    "schemas": {
      "sample": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string"
          },
          "email": {
            "type": "string"
          },
          "age": {
            "type": "number"
          },
          "is_adult": {
            "type": "boolean"
          },
          "gender": {
            "type": "number",
            "enum": [1, 2, 3]
          },
          "hobby": {
            "type": "array",
            "items": {
              "type": "string",
              "enum": ["game", "books", "sports"]
            }
          }
        },
        "required": ["name", "email", "age", "is_adult", "gender", "hobby"]
      }
    },
    "parameters": {}
  },
  "paths": {
    "/sample": {
      "get": {
        "parameters": [
          {
            "name": "name",
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/sample"
                }
              }
            }
          }
        }
      },
      "post": {
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/sample"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "OK"
          }
        }
      }
    }
  }
}
```

## ライブラリのインストール

今回使用するライブラリをインストールします。

aspida・zodは必須です。

react-hook-formはzodをバリデーションとして使えるライブラリなら互換可能だと思います。

```sh
pnpm install @aspida/fetch aspida zod react-hook-form @hookform/resolvers
```

細かい使い方についてはリポジトリを参照して下さい。

### OpenAPIからRequest・Responseの型と、apidaの型と実装を生成

以下のツールを使います。

https://github.com/aspida/openapi2aspida

以下の設定ファイルを作成し、コマンドを実行します。

```ts: aspida.config.js
module.exports = {
    input: "lib/api",
    openapi: { inputFile: "./openapi.json" }
}
```

```sh
npx openapi2aspida
```

### Request・Responseの型から、zodのコードを生成

以下のツールを使います。

https://github.com/fabien0102/ts-to-zod

以下の設定ファイルを作成し、コマンドを実行します。

```ts: ts-to-zod.config.js
module.exports = {
    input: "./lib/api/@types/index.ts",
    output: "./lib/validator.ts",
}
```

```sh
npx ts-to-zod
```

## zodのコードをフォーム用に変換

変換は以下のようにランタイムで行います。

`forForm`がこの章の肝となる関数です。

`sampleSchema`というzodのコードを変換してます。

なぜこのような変換をするのかというと、以下の理由からです。
- 入力系の要素(inputやselectなど)は文字列しか扱えない

また、以下の点に注意してください。
- `useForm`の型パラメータに`zod.infer<typeof stringify>, any, zod.infer<typeof validator>`を渡す
- APIからのデータをフォームに入れるときは`stringify.parse`で変換して入れる

```ts
  const [stringify, validator] = forForm(sampleSchema)

  useEffect(() => {
    apiClient.sample.get().then((res) => {
      const stringedBody = stringify.parse(res.body)
      for (const key in stringedBody) {
        setValue(
          key as keyof typeof stringedBody,
          stringedBody[key as keyof typeof stringedBody],
        );
      }
    });
  }, []);
  const {
    register,
    handleSubmit,
    watch,
  } = useForm<zod.infer<typeof stringify>, any, zod.infer<typeof validator>>({
    resolver: zodResolver(validator),
  });
```


`forForm`の実装は以下です。

基本的に`as never`を使って型エラーを握りつぶしてる点に注意して下さい。

```ts
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
```

## 最後に

このようにして、一気通貫で型だったりコードだったりをコネコネして開発効率化してます。

TSの型コネコネは楽しいですね。