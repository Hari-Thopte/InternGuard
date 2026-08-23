import { describe, expect, it } from "vitest";
import { decodeHtmlEntities, htmlPageTitle, visibleHtmlText } from "./htmlText";

describe("HTML text extraction", () => {
  it("decodes named, decimal, and hexadecimal entities", () => {
    expect(
      decodeHtmlEntities("A&amp;B &#8377;500 &#x20AC;20 &quot;role&quot;"),
    ).toBe('A&B ₹500 €20 "role"');
  });

  it("removes executable and non-visible blocks", () => {
    expect(
      visibleHtmlText(
        "<style>hidden</style><script>alert(1)</script><p>Visible&nbsp;role</p>",
      ),
    ).toBe("Visible role");
  });

  it("extracts a clean page title", () => {
    expect(
      htmlPageTitle("<title>Engineering &amp; Design Internship</title>"),
    ).toBe("Engineering & Design Internship");
  });
});
