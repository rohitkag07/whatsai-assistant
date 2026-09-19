export type ShellBusiness = {
  id: string;
  name: string;
  category: string;
  status: string;
};

export type ShellReadResult<T> =
  | { status: "ready" | "empty"; data: T }
  | { status: "error" | "disconnected" | "unknown"; data: null };

export type ShellReadState = {
  businesses: ShellReadResult<ShellBusiness[]>;
  unread: ShellReadResult<number>;
};
