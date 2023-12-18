import { sampleSchema } from "./validator";
import { forForm } from "./zod";
import zod from "zod";

test("basic", () => {
  const [stringify, validator] = forForm(sampleSchema);
  expect(
    validator.parse({
      name: "",
      age: "1",
      is_adult: "false",
      email: "",
      gender: "3",
      hobby: ["sports"],
    }),
  ).toEqual({
    name: "",
    age: 1,
    is_adult: false,
    email: "",
    gender: 3,
    hobby: ["sports"],
  });

  expect(
    stringify.parse({
      name: "",
      age: 1,
      is_adult: false,
      email: "",
      gender: 3,
      hobby: ["sports"],
    }),
  ).toEqual({
    name: "",
    age: "1",
    is_adult: "false",
    email: "",
    gender: "3",
    hobby: ["sports"],
  });
});

test("format validation", () => {
  const [_1, schema1] = forForm(zod.string().email());
  schema1.parse("test@gmail.com");
  expect(() => {
    schema1.parse("hoge");
  }).toThrow();

  const [_2, schema2] = forForm(zod.number().max(10));
  schema2.parse("1");
  expect(() => {
    schema2.parse("11");
  }).toThrow();
});
