import { AuthForm } from "@/components/auth-form";

type LoginPageProps = {
  searchParams: Promise<{ callbackUrl?: string | string[] }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { callbackUrl } = await searchParams;

  return <AuthForm mode="login" callbackUrl={typeof callbackUrl === "string" ? callbackUrl : undefined} />;
}
