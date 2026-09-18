"use client";

import type { FormEvent } from "react";
import Link from "next/link";
import {
  Suspense,
  useState,
} from "react";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import { AuthCard } from "@/components/auth/AuthCard";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { getApiError } from "@/lib/errors";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950" />
      }
    >
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] =
    useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] =
    useState(false);

  const submit = async (
    event: FormEvent,
  ) => {
    event.preventDefault();
    setError("");

    if (!email || !password) {
      setError(
        "Enter your email and password.",
      );
      return;
    }

    setLoading(true);

    try {
      const { user } = await login({
        email,
        password,
      });

      const next = params.get("next");

      router.replace(
        next ||
          (user.role === "ADMIN"
            ? "/admin"
            : user.role === "PARTNER"
              ? "/partner"
              : "/parking"),
      );
    } catch (err) {
      setError(getApiError(err).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      eyebrow="Welcome back"
      title="Log in to Parkkar"
      footer={
        <span>
          New to Parkkar?{" "}
          <Link
            className="font-semibold text-cyan-600 hover:text-cyan-500"
            href="/register"
          >
            Create an account
          </Link>
        </span>
      }
    >
      <form
        onSubmit={submit}
        className="space-y-4"
      >
        {error && <Alert message={error} />}

        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(event) =>
            setEmail(event.target.value)
          }
          autoComplete="email"
          placeholder="you@example.com"
        />

        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(event) =>
            setPassword(event.target.value)
          }
          autoComplete="current-password"
          placeholder="Your password"
        />

        <Button
          type="submit"
          loading={loading}
          className="mt-2 w-full"
        >
          Log in
        </Button>
      </form>

      <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-xs leading-5 text-slate-500">
        Your session is secured by the
        existing Parkkar JWT authentication
        flow.
      </div>
    </AuthCard>
  );
}