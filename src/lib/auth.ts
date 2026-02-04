import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma.js";
import { oAuthProxy } from "better-auth/plugins";

export const auth = betterAuth({
  appName: "skill bridge",
  baseURL: process.env.BETTER_AUTH_URL,
  basePath: "/api/v1/auth",

  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      redirectURI: "https://skill-bridge-client-five.vercel.app/api/v1/auth/callback/google",
    },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
      },
    },
  },
  trustedOrigins: [
    process.env.FRONTEND_URL as string,
    "https://skill-bridge-client-five.vercel.app",
    "https://skill-bridge-client-git-main-rakibuls-projects-2d528a38.vercel.app",
  ],
  plugins: [oAuthProxy()],
  advanced: {
    useSecureCookies: true,
  },
  cookie: {
    namePrefix: "skill-bridge",
    sameSite: "lax",
  },
});
