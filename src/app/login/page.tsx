import type { Metadata } from "next";

import LoginForm from "./login-form";

export const metadata: Metadata = {
  title: "Login - Grynx",
  description:
    "Sign in to Grynx to track workouts, monitor progress, and manage your training plan.",
};

export default function LoginPage() {
  return <LoginForm />;
}
