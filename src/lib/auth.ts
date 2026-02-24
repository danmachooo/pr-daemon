import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";
import { appConfig } from "../config/appConfig";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  baseURL: appConfig.app.url,
  trustedOrigins: ["http://localhost:8080"],
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
      // These scopes request access to email even if private
      scope: ["user:email", "read:user"],
      // Custom mapper to handle GitHub's private email
      mapProfileToUser: async (profile) => {
        // GitHub provides a noreply email even when private
        const email =
          profile.email ||
          `${profile.id}+${profile.login}@users.noreply.github.com`;

        return {
          id: profile.id.toString(),
          name: profile.name || profile.login,
          email: email,
          image: profile.avatar_url,
          emailVerified: !!profile.email,
        };
      },
    },
  },
});
