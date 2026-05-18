export type User = {
  id: string;
  username: string;
  name: string;
  email?: string | null;
  avatar_url?: string | null;
  department?: string | null;
  job_title?: string | null;
  status: string;
  is_superuser: boolean;
  last_login_at?: string | null;
};

export type PortalModule = {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  route: string;
  icon: string;
  enabled: boolean;
  order_index: number;
  version: string;
};

export type LoginResponse = {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
};

export type Notification = {
  id: string;
  title: string;
  message: string;
  type: string;
  read_at?: string | null;
  created_at: string;
};

export type Permission = {
  id: string;
  key: string;
  description: string;
  module_key?: string | null;
};
