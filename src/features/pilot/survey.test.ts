import { describe, expect, it } from "vitest";
import { readSurveyUrl, surveyHref } from "./survey";

describe("survey link", () => {
  it("is off when the variable is absent, blank or unusable", () => {
    for (const v of [undefined, "", "   ", "not a url", "http://forms.example.com/x", "javascript:alert(1)", "https://user:pw@forms.example.com/x", "https://localhost/x"]) {
      expect(readSurveyUrl(v)).toBeNull();
    }
  });
  it("accepts an https URL and appends the participant code, keeping existing parameters", () => {
    const base = readSurveyUrl(" https://forms.example.com/r/abc?lang=ar ");
    expect(base).not.toBeNull();
    const href = new URL(surveyHref(base!, "P-7K3Q"));
    expect(href.origin + href.pathname).toBe("https://forms.example.com/r/abc");
    expect(href.searchParams.get("lang")).toBe("ar");
    expect(href.searchParams.get("code")).toBe("P-7K3Q");
  });
  it("replaces a code already in the URL, never doubles it, and encodes odd values", () => {
    const base = readSurveyUrl("https://forms.example.com/r?code=OLD")!;
    const href = new URL(surveyHref(base, "A B&c=1"));
    expect(href.searchParams.getAll("code")).toEqual(["A B&c=1"]);
    expect(href.searchParams.has("c")).toBe(false);
  });
});
