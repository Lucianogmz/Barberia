import 'next-auth';

declare module 'next-auth' {
  interface Session {
    googleAccessToken?: string;
    googleRefreshToken?: string;
    googleTokenExpiry?: string;
    apiToken?: string; // JWT from our NestJS backend
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    googleAccessToken?: string;
    googleRefreshToken?: string;
    googleTokenExpiry?: string;
  }
}
