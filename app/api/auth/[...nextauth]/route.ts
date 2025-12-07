// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import Spotify from "next-auth/providers/spotify";

const handler = NextAuth({
  providers: [
    Spotify({
      clientId: process.env.SPOTIFY_CLIENT_ID!,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    jwt({ token, account }) {
      if (account) token.access_token = account.access_token;
      return token;
    },
    session({ session, token }) {
      // @ts-expect-error
      session.access_token = token.access_token;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };