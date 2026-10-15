import { describe, expect, it } from "vitest";
import { FEEDBACK_MAX, cleanNote, noteLength } from "./feedback";

describe("feedback note", () => {
  it("trims, and refuses blank text", () => {
    expect(cleanNote("  hello  ")).toBe("hello");
    expect(cleanNote("   \n ")).toBeNull();
  });
  it("accepts exactly the maximum and refuses one more, counting characters not UTF-16 units", () => {
    expect(cleanNote("x".repeat(FEEDBACK_MAX))).not.toBeNull();
    expect(cleanNote("x".repeat(FEEDBACK_MAX + 1))).toBeNull();
    expect(cleanNote("😀".repeat(FEEDBACK_MAX))).not.toBeNull();
    expect(noteLength("ملاحظة")).toBe(6);
  });
});
