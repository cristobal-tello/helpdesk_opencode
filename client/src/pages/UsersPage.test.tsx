import { screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import axios from "axios";
import { renderWithQuery } from "@/test/render";
import UsersPage from "./UsersPage";

vi.mock("axios", () => {
  const mockAxios = {
    get: vi.fn(),
    create: vi.fn(() => mockAxios),
  };
  return { default: mockAxios };
});

const mockedAxios = vi.mocked(axios);

const mockUsers = [
  {
    id: "1",
    name: "Admin User",
    email: "admin@helpdesk.com",
    role: "admin" as const,
    createdAt: "2026-01-15T10:00:00Z",
  },
  {
    id: "2",
    name: "Agent User",
    email: "agent@helpdesk.com",
    role: "agent" as const,
    createdAt: "2026-02-20T14:30:00Z",
  },
];

describe("UsersPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading skeleton while fetching", () => {
    mockedAxios.get.mockReturnValue(new Promise(() => {}));
    renderWithQuery(<UsersPage />);
    expect(screen.getAllByRole("row")).toHaveLength(6); // 1 header + 5 skeleton rows
  });

  it("renders users list", async () => {
    mockedAxios.get.mockResolvedValue({ data: { users: mockUsers } });
    renderWithQuery(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByText("Admin User")).toBeInTheDocument();
    });

    expect(screen.getByText("agent@helpdesk.com")).toBeInTheDocument();
    expect(screen.getByText("2 users")).toBeInTheDocument();
  });

  it("displays admin badge", async () => {
    mockedAxios.get.mockResolvedValue({ data: { users: mockUsers } });
    renderWithQuery(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByText("admin")).toBeInTheDocument();
    });
  });

  it("displays agent badge", async () => {
    mockedAxios.get.mockResolvedValue({ data: { users: mockUsers } });
    renderWithQuery(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByText("agent")).toBeInTheDocument();
    });
  });

  it("shows error message on fetch failure", async () => {
    mockedAxios.get.mockRejectedValue(new Error("Network error"));
    renderWithQuery(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByText("Network error")).toBeInTheDocument();
    });
  });

  it("shows empty state when no users", async () => {
    mockedAxios.get.mockResolvedValue({ data: { users: [] } });
    renderWithQuery(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByText("No users found")).toBeInTheDocument();
    });

    expect(screen.getByText("0 users")).toBeInTheDocument();
  });

  it("shows singular count for one user", async () => {
    mockedAxios.get.mockResolvedValue({ data: { users: [mockUsers[0]] } });
    renderWithQuery(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByText("1 user")).toBeInTheDocument();
    });
  });

  it("renders table headers", async () => {
    mockedAxios.get.mockResolvedValue({ data: { users: mockUsers } });
    renderWithQuery(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByText("Name")).toBeInTheDocument();
    });

    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByText("Role")).toBeInTheDocument();
    expect(screen.getByText("Joined")).toBeInTheDocument();
  });

  it("formats dates correctly", async () => {
    mockedAxios.get.mockResolvedValue({ data: { users: mockUsers } });
    renderWithQuery(<UsersPage />);

    const expectedDate = new Date(mockUsers[0].createdAt).toLocaleDateString();
    await waitFor(() => {
      expect(screen.getByText(expectedDate)).toBeInTheDocument();
    });
  });
});