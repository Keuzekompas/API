export interface LoginResponse {
  token?: string;
  user?: {
    id: string;
  };
  requires2FA?: boolean;
  tempToken?: string;
}