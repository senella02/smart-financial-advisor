import { expect, it } from "vitest";
import th from "./th.json";
import en from "./en.json";

it("has matching, nonempty Thai and English UI keys", () => {
  expect(Object.keys(en).sort()).toEqual(Object.keys(th).sort());
  for (const dictionary of [th, en]) {
    expect(Object.values(dictionary).every((value) => value.trim().length > 0)).toBe(true);
  }
});
