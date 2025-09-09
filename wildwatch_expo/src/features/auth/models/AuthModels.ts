export type AuthTokens = {
  accessToken: string;
};

export type AuthUser = {
  id: string | number;
  firstName: string;
  lastName: string;
  email: string;
};

export type AuthSession = {
  user: AuthUser;
  tokens: AuthTokens;
};


