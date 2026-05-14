import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import JsonViewer from "@/components/JsonViewer";

describe("JsonViewer", () => {
  it("should render null value", () => {
    const { container } = render(<JsonViewer data={null} />);
    expect(container.textContent).toContain("No data");
  });

  it("should render undefined value", () => {
    const { container } = render(<JsonViewer data={undefined} />);
    expect(container.textContent).toContain("No data");
  });

  it("should render string value", () => {
    render(<JsonViewer data="hello" />);
    expect(screen.getByText(/"hello"/)).toBeDefined();
  });

  it("should render number value", () => {
    render(<JsonViewer data={42} />);
    expect(screen.getByText("42")).toBeDefined();
  });

  it("should render boolean true", () => {
    render(<JsonViewer data={true} />);
    expect(screen.getByText("true")).toBeDefined();
  });

  it("should render boolean false", () => {
    render(<JsonViewer data={false} />);
    expect(screen.getByText("false")).toBeDefined();
  });

  it("should render flat object with keys", () => {
    render(<JsonViewer data={{ name: "test", count: 123 }} />);
    expect(screen.getByText(/"name"/)).toBeDefined();
    expect(screen.getByText(/"test"/)).toBeDefined();
    expect(screen.getByText(/"count"/)).toBeDefined();
    expect(screen.getByText("123")).toBeDefined();
  });

  it("should render nested object", () => {
    render(<JsonViewer data={{ user: { name: "Alice", age: 30 } }} />);

    expect(screen.getByText(/"user"/)).toBeDefined();
    expect(screen.getByText(/"name"/)).toBeDefined();
    expect(screen.getByText(/"Alice"/)).toBeDefined();
    expect(screen.getByText(/"age"/)).toBeDefined();
    expect(screen.getByText("30")).toBeDefined();
  });

  it("should render array", () => {
    const data = { items: ["a", "b", "c"] };
    render(<JsonViewer data={data} />);

    expect(screen.getByText(/"items"/)).toBeDefined();
    expect(screen.getByText(/"a"/)).toBeDefined();
    expect(screen.getByText(/"b"/)).toBeDefined();
    expect(screen.getByText(/"c"/)).toBeDefined();
  });

  it("should render empty array", () => {
    const data = { empty: [] };
    render(<JsonViewer data={data} />);
    expect(screen.getByText("[]")).toBeDefined();
  });

  it("should render empty object", () => {
    const data = { empty: {} };
    render(<JsonViewer data={data} />);
    expect(screen.getByText("{}")).toBeDefined();
  });

  it("should render root array", () => {
    const data = [1, 2, 3];
    render(<JsonViewer data={data} />);
    // The root array doesn't have a keyName
    expect(screen.getByText("1")).toBeDefined();
    expect(screen.getByText("2")).toBeDefined();
    expect(screen.getByText("3")).toBeDefined();
  });

  it("should render long strings in full", () => {
    const longStr = "x".repeat(600);
    render(<JsonViewer data={{ long: longStr }} />);
    const body = document.body.textContent || "";
    expect(body).toContain(longStr);
  });
});
