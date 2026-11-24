/** El usuario que @CurrentUser() y AuthenticationContext devuelven. Nunca lleva el hash de la contraseña. */
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  currency: string;
  locale: string;
}

declare module '@nestjs/authentication' {
  interface AuthenticationTypes {
    user: AuthUser;
  }
}

export const AUTH_USER_SELECT = {
  id: true,
  email: true,
  name: true,
  currency: true,
  locale: true,
} as const;
