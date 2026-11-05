import { AuthForm } from "@/components/auth-form";

type LoginPageProps = {
  searchParams: Promise<{ callbackUrl?: string | string[]; verified?: string | string[] }>;
};

const notices: Record<string, string> = {
  verified: "Email confirmed. Sign in to get started.",
  "already-verified": "This email is already confirmed. Sign in with your password."
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { callbackUrl, verified } = await searchParams;

  return (
    <AuthForm
      mode="login"
      callbackUrl={typeof callbackUrl === "string" ? callbackUrl : undefined}
      notice={typeof verified === "string" ? notices[verified] : undefined}
    />
  );
}
