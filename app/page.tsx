"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { sampleSchema } from "@/lib/validator";
import { getCircularReplacer } from "@/lib/json";
import zod from "zod";
import { setupMSW } from "@/lib/msw";
import { apiClient } from "@/lib/api";
import { useEffect } from "react";
import { forForm } from "@/lib/zod";

export default function Home() {
  const [stringify, validator] = forForm(sampleSchema);
  const {
    register,
    handleSubmit: createHandleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<zod.infer<typeof stringify>, any, zod.infer<typeof validator>>({
    resolver: zodResolver(validator),
  });
  useEffect(() => {
    (async () => {
      await setupMSW();
      apiClient.sample.get().then((res) => {
        const stringedBody = stringify.parse(res.body);
        for (const key in stringedBody) {
          setValue(
            key as keyof typeof stringedBody,
            stringedBody[key as keyof typeof stringedBody],
          );
        }
      });
    })();
  }, []);
  const handleSubmit = createHandleSubmit(async (data) => {
    await apiClient.sample.post({ body: data });
  });
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
        <div className="flex flex-col bg-white rounded-xl p-3 gap-3">
          <h3 className="border-b border-b-gray-300">form</h3>
          <input {...register("name")} placeholder="Name" />
          <input {...register("email")} placeholder="Email" />
          <input {...register("age")} placeholder="Age" />
          <select defaultValue="" {...register("is_adult")}>
            <option value="" disabled className="hidden">
              Select your type
            </option>
            <option value="true">Adult</option>
            <option value="false">Kids</option>
            <option value="hoge">Baby</option>
          </select>
          <fieldset className="flex gap-3 flex-wrap">
            <label>
              Man
              <input type="radio" value="1" {...register("gender")} />
            </label>
            <label>
              Woman
              <input type="radio" value="2" {...register("gender")} />
            </label>
            <label>
              Unknown
              <input type="radio" value="3" {...register("gender")} />
            </label>
            <label>
              Mix
              <input type="radio" value="4" {...register("gender")} />
            </label>
          </fieldset>
          <h4>Hobby</h4>
          <div className="flex gap-3 flex-wrap">
            <label>
              Game
              <input type="checkbox" value="game" {...register("hobby")} />
            </label>
            <label>
              Books
              <input type="checkbox" value="books" {...register("hobby")} />
            </label>
            <label>
              Sports
              <input type="checkbox" value="sports" {...register("hobby")} />
            </label>
            <label>
              Pray
              <input type="checkbox" value="pray" {...register("hobby")} />
            </label>
          </div>

          <input type="submit" />
        </div>
        <div className="flex flex-col bg-white rounded-xl p-3 gap-3">
          <h3 className="border-b border-b-gray-300">data</h3>
          <pre>{JSON.stringify(watch(), getCircularReplacer(), 2)}</pre>
          <h3 className="border-b border-b-gray-300">errors</h3>
          <pre>{JSON.stringify(errors, getCircularReplacer(), 2)}</pre>
        </div>
      </form>
    </main>
  );
}
