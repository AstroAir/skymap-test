import { render, screen } from "@testing-library/react";
import Home from "./page";

describe("Home Page", () => {
  it("renders the Next.js logo", () => {
    render(<Home />);
    const logo = screen.getByAltText("Next.js logo");
    expect(logo).toBeInTheDocument();
  });

  it("renders the main heading", () => {
    render(<Home />);
    // Mock returns translation key
    const heading = screen.getByRole("heading", {
      name: /home\.title/i,
    });
    expect(heading).toBeInTheDocument();
  });

  it("renders the description text", () => {
    render(<Home />);
    // Mock returns translation key
    const description = screen.getByText(/home\.description/i);
    expect(description).toBeInTheDocument();
  });

  it("renders links with correct hrefs", () => {
    render(<Home />);
    // Check that Vercel deployment link exists
    const links = screen.getAllByRole("link");
    const deployLink = links.find(link => link.getAttribute('href')?.includes('vercel.com/new'));
    expect(deployLink).toBeDefined();
  });

  it("renders links to Next.js resources", () => {
    render(<Home />);
    const links = screen.getAllByRole("link");
    // Check that there are external links present
    expect(links.length).toBeGreaterThan(0);
  });

  it("renders the Deploy Now button", () => {
    render(<Home />);
    // Mock returns translation key, so look for that
    const deployButton = screen.getByRole("link", { name: /home\.deployNow/i });
    expect(deployButton).toBeInTheDocument();
    expect(deployButton).toHaveAttribute(
      "href",
      expect.stringContaining("vercel.com/new")
    );
    expect(deployButton).toHaveAttribute("target", "_blank");
    expect(deployButton).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("renders the Documentation button", () => {
    render(<Home />);
    // Mock returns translation key, so look for that
    const docsButton = screen.getByRole("link", { name: /home\.documentation/i });
    expect(docsButton).toBeInTheDocument();
    expect(docsButton).toHaveAttribute(
      "href",
      expect.stringContaining("nextjs.org/docs")
    );
    expect(docsButton).toHaveAttribute("target", "_blank");
    expect(docsButton).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("renders the Vercel logomark", () => {
    render(<Home />);
    const vercelLogo = screen.getByAltText("Vercel logomark");
    expect(vercelLogo).toBeInTheDocument();
  });

  it("has correct layout structure", () => {
    const { container } = render(<Home />);
    const main = container.querySelector("main");
    expect(main).toBeInTheDocument();
    expect(main).toHaveClass("flex", "min-h-screen");
  });

  it("applies dark mode classes", () => {
    const { container } = render(<Home />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass("dark:bg-black");
  });
});
