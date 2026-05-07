import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope:
            'openid email profile https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.freebusy',
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      // On initial sign-in, persist Google tokens in the JWT
      if (account) {
        token.googleAccessToken = account.access_token;
        token.googleRefreshToken = account.refresh_token;
        token.googleTokenExpiry = account.expires_at
          ? new Date(account.expires_at * 1000).toISOString()
          : undefined;
        token.email = profile?.email;
        token.name = profile?.name;
        token.picture = profile?.picture;
      }
      return token;
    },
    async session({ session, token }) {
      // Expose Google tokens to the client session
      session.googleAccessToken = token.googleAccessToken as string;
      session.googleRefreshToken = token.googleRefreshToken as string;
      session.googleTokenExpiry = token.googleTokenExpiry as string;
      return session;
    },
  },
  pages: {
    signIn: '/dashboard/login',
  },
  session: {
    strategy: 'jwt',
  },
});
