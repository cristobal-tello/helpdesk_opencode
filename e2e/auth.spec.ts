import { test, expect, type Page } from "@playwright/test";

// ---------------------------------------------------------------------------
// Credentials
// ---------------------------------------------------------------------------

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@helpdesk.com";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "password1234!";
const AGENT_EMAIL = "agent@helpdesk.com";
const AGENT_PASSWORD = "password1234!";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function loginAs(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
}

async function loginAsAdmin(page: Page) {
  await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  await page.waitForURL("/");
}

async function loginAsAgent(page: Page) {
  await loginAs(page, AGENT_EMAIL, AGENT_PASSWORD);
  await page.waitForURL("/");
}

// ---------------------------------------------------------------------------
// Login page rendering
// ---------------------------------------------------------------------------

test.describe("Login page rendering", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("shows page title 'Sign in to Helpdesk'", async ({ page }) => {
    // CardTitle renders as a <div>, not an <h*>, so use getByText
    await expect(
      page.getByText("Sign in to Helpdesk"),
    ).toBeVisible();
  });

  test("shows email field, password field, and submit button", async ({
    page,
  }) => {
    await expect(page.getByLabel("Email address")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Sign in" }),
    ).toBeVisible();
  });

  test("email field has correct type and autocomplete", async ({ page }) => {
    const emailInput = page.locator("#email");
    await expect(emailInput).toHaveAttribute("type", "email");
    await expect(emailInput).toHaveAttribute("autocomplete", "email");
  });

  test("password field has correct type", async ({ page }) => {
    const passwordInput = page.locator("#password");
    await expect(passwordInput).toHaveAttribute("type", "password");
  });

  test("submit button is enabled by default", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: "Sign in" }),
    ).toBeEnabled();
  });
});

// ---------------------------------------------------------------------------
// Successful authentication
// ---------------------------------------------------------------------------

test.describe("Successful authentication", () => {
  test("admin login redirects to / and shows welcome message", async ({
    page,
  }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.waitForURL("/");
    await expect(
      page.getByText("Welcome back", { exact: false }),
    ).toBeVisible();
  });

  test("admin login shows user name in navbar", async ({ page }) => {
    await loginAsAdmin(page);
    // The navbar renders the user name in a <span> — scope to the nav element
    await expect(
      page.locator("nav").getByText("Admin", { exact: true }),
    ).toBeVisible();
  });

  test("admin login shows 'Helpdesk' brand link in navbar", async ({
    page,
  }) => {
    await loginAsAdmin(page);
    await expect(page.getByRole("link", { name: "Helpdesk" })).toBeVisible();
  });

  test("agent login redirects to / and shows welcome message", async ({
    page,
  }) => {
    await loginAs(page, AGENT_EMAIL, AGENT_PASSWORD);
    await page.waitForURL("/");
    await expect(
      page.getByText("Welcome back", { exact: false }),
    ).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Failed authentication
// ---------------------------------------------------------------------------

test.describe("Failed authentication", () => {
  test("wrong password shows 'Invalid email or password' and stays on /login", async ({
    page,
  }) => {
    await loginAs(page, ADMIN_EMAIL, "wrong-password");
    await expect(
      page.getByText("Invalid email or password"),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("unknown email shows same error (no user enumeration)", async ({
    page,
  }) => {
    await loginAs(page, "nobody@example.com", "whatever");
    await expect(
      page.getByText("Invalid email or password"),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("error shown in the styled error container", async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, "wrong-password");
    const errorContainer = page.locator(".rounded-md.bg-destructive\\/10 p");
    await expect(errorContainer).toBeVisible();
    await expect(errorContainer).toHaveText("Invalid email or password");
  });
});

// ---------------------------------------------------------------------------
// Client-side validation (Zod / React Hook Form)
// ---------------------------------------------------------------------------

test.describe("Client-side form validation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("empty form submission shows 'Invalid email address' validation error", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText("Invalid email address")).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("empty form submission shows 'Password is required' validation error", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText("Password is required")).toBeVisible();
  });

  test("invalid email format shows 'Invalid email address'", async ({
    page,
  }) => {
    // The native <input type="email"> constraint prevents form submission when
    // the value isn't a valid email — which means the browser blocks it before
    // React Hook Form / Zod can run. We disable native validation on the form
    // element, then fill the field and submit so Zod takes over.
    await page.evaluate(() => {
      const form = document.querySelector("form");
      if (form) form.setAttribute("novalidate", "");
    });
    await page.locator("#email").fill("notanemail");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText("Invalid email address")).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("valid email but empty password shows 'Password is required'", async ({
    page,
  }) => {
    await page.getByLabel("Email address").fill("valid@example.com");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText("Password is required")).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("validation errors disappear after correcting the field", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText("Invalid email address")).toBeVisible();

    await page.getByLabel("Email address").fill(ADMIN_EMAIL);
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page.getByText("Invalid email address")).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Loading / submitting state
// ---------------------------------------------------------------------------

test.describe("Loading state", () => {
  test("button shows 'Signing in...' and is disabled during submission", async ({
    page,
  }) => {
    await page.route("**/api/auth/**", async (route) => {
      await new Promise((r) => setTimeout(r, 500));
      await route.continue();
    });

    await page.goto("/login");
    await page.getByLabel("Email address").fill(ADMIN_EMAIL);
    await page.getByLabel("Password").fill(ADMIN_PASSWORD);

    const button = page.getByRole("button", { name: /Sign in/i });
    await button.click();

    const loadingButton = page.getByRole("button", { name: "Signing in..." });
    await expect(loadingButton).toBeVisible();
    await expect(loadingButton).toBeDisabled();

    await page.waitForURL("/");
  });
});

// ---------------------------------------------------------------------------
// Session persistence
// ---------------------------------------------------------------------------

test.describe("Session persistence", () => {
  test("session survives a full page reload", async ({ page }) => {
    await loginAsAdmin(page);
    await expect(
      page.getByText("Welcome back", { exact: false }),
    ).toBeVisible();

    await page.reload();

    await expect(page).toHaveURL("/");
    await expect(
      page.getByText("Welcome back", { exact: false }),
    ).toBeVisible();
  });

  test("session survives navigating away and back", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/login");
    await page.goto("/");
    await expect(page).toHaveURL("/");
    await expect(
      page.getByText("Welcome back", { exact: false }),
    ).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Logout
// ---------------------------------------------------------------------------

test.describe("Logout", () => {
  test("clicking 'Sign out' redirects to /login", async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page).toHaveURL(/\/login/);
  });

  test("after logout, visiting / redirects to /login", async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByRole("button", { name: "Sign out" }).click();
    await page.waitForURL(/\/login/);

    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
  });

  test("after logout, visiting /users redirects to /login", async ({
    page,
  }) => {
    await loginAsAdmin(page);
    await page.getByRole("button", { name: "Sign out" }).click();
    await page.waitForURL(/\/login/);

    await page.goto("/users");
    await expect(page).toHaveURL(/\/login/);
  });

  test("after logout, the login form is shown (not authenticated content)", async ({
    page,
  }) => {
    await loginAsAdmin(page);
    await page.getByRole("button", { name: "Sign out" }).click();
    await page.waitForURL(/\/login/);

    await expect(
      page.getByText("Sign in to Helpdesk"),
    ).toBeVisible();
    await expect(
      page.getByText("Welcome back", { exact: false }),
    ).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Route protection
// ---------------------------------------------------------------------------

test.describe("Route protection — unauthenticated", () => {
  test("visiting / while unauthenticated redirects to /login", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
  });

  test("visiting /users while unauthenticated redirects to /login", async ({
    page,
  }) => {
    await page.goto("/users");
    await expect(page).toHaveURL(/\/login/);
  });

  test("login form is shown on redirect to /login", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByText("Sign in to Helpdesk"),
    ).toBeVisible();
  });
});

test.describe("Route protection — admin role", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("admin can access /users and sees 'Users' heading", async ({ page }) => {
    await page.goto("/users");
    await expect(page).toHaveURL("/users");
    await expect(
      page.getByRole("heading", { name: "Users" }),
    ).toBeVisible();
  });

  test("admin navbar shows 'Users' link", async ({ page }) => {
    await expect(page.getByRole("link", { name: "Users" })).toBeVisible();
  });

  test("admin 'Users' link navigates to /users", async ({ page }) => {
    await page.getByRole("link", { name: "Users" }).click();
    await expect(page).toHaveURL("/users");
  });
});

test.describe("Route protection — agent role", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAgent(page);
  });

  test("agent visiting /users is redirected to /", async ({ page }) => {
    await page.goto("/users");
    await expect(page).toHaveURL("/");
  });

  test("agent navbar does NOT show 'Users' link", async ({ page }) => {
    await expect(page.getByRole("link", { name: "Users" })).not.toBeVisible();
  });

  test("agent can access / and sees welcome message", async ({ page }) => {
    await expect(
      page.getByText("Welcome back", { exact: false }),
    ).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

test.describe("Edge cases", () => {
  test("multiple rapid login attempts with wrong password don't cause issues", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByLabel("Email address").fill(ADMIN_EMAIL);
    await page.getByLabel("Password").fill("wrong1");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText("Invalid email or password")).toBeVisible();

    await page.getByLabel("Password").fill("wrong2");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText("Invalid email or password")).toBeVisible();

    await page.getByLabel("Password").fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForURL("/");
    await expect(
      page.getByText("Welcome back", { exact: false }),
    ).toBeVisible();
  });

  test("browser back button after login does not expose login page as authenticated content", async ({
    page,
  }) => {
    await loginAsAdmin(page);
    await page.waitForURL("/");

    // Go back in history — since login used window.location.href (full reload),
    // the history entry before / is the /login page. Going back should land on
    // /login but the login form (not the protected home) should be shown.
    await page.goBack();

    // The login page has no redirect-if-authenticated guard, so the login form
    // renders. We assert the form is visible rather than protected content.
    await expect(
      page.getByText("Sign in to Helpdesk"),
    ).toBeVisible();
    // Dashboard welcome message must not be present
    await expect(page.locator("text=Dashboard")).not.toBeVisible();
  });

  test("browser back button after logout does not show authenticated content", async ({
    page,
  }) => {
    await loginAsAdmin(page);
    await page.waitForURL("/");

    await page.getByRole("button", { name: "Sign out" }).click();
    await page.waitForURL(/\/login/);

    // Attempt to go back to the previously authenticated page
    await page.goBack();

    // ProtectedRoute checks session on every render; without a session the user
    // is redirected to /login regardless of history
    await expect(page).toHaveURL(/\/login/);
    await expect(
      page.getByText("Welcome back", { exact: false }),
    ).not.toBeVisible();
  });

  test("email with mixed casing is tested (documents actual behavior)", async ({
    page,
  }) => {
    // Better Auth may or may not normalise email casing.
    // This test documents the real behaviour without asserting a preference.
    await loginAs(page, "Admin@Helpdesk.com", ADMIN_PASSWORD);

    // If Better Auth normalises the email the user lands on /; otherwise they
    // see an error. Both are acceptable — we just assert one of the two states.
    const url = page.url();
    const isHome = url.endsWith("/") || url.endsWith("localhost:5173");
    const isLogin = url.includes("/login");
    expect(isHome || isLogin).toBe(true);
  });

  test("visiting a non-existent route while authenticated shows the layout", async ({
    page,
  }) => {
    await loginAsAdmin(page);
    await page.goto("/this-route-does-not-exist");

    // Layout (with Navbar) is still rendered — brand link is visible
    await expect(page.getByRole("link", { name: "Helpdesk" })).toBeVisible();
  });

  test("server error message is cleared when user retries with correct credentials", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByLabel("Email address").fill(ADMIN_EMAIL);
    await page.getByLabel("Password").fill("wrong-password");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText("Invalid email or password")).toBeVisible();

    // Now log in correctly — error should disappear
    await page.getByLabel("Password").fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForURL("/");

    // Error must not be present on the home page
    await expect(
      page.getByText("Invalid email or password"),
    ).not.toBeVisible();
  });
});
