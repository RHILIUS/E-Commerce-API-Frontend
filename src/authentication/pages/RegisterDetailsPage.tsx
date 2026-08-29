import type { SyntheticEvent } from "react";
import { Link } from "react-router-dom";

import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import AddressCountryField from "@/authentication/components/AddressCountryField";
import PhoneNumberField from "@/authentication/components/PhoneNumberField";

const RegisterDetailsPage = () => {
  const temporaryEmail = "rhian@gmail.com";

  const handleSubmit = (
    event: SyntheticEvent<HTMLFormElement, SubmitEvent>,
  ) => {
    event.preventDefault();
  };

  return (
    <main className="flex items-start justify-center px-4 py-12 sm:px-6 lg:py-25">
      <Card
        role="region"
        aria-labelledby="register-details-title"
        className="w-full max-w-145 gap-6 rounded-lg border py-6 shadow-sm ring-0 [--card-spacing:--spacing(6)]"
      >
        <CardHeader className="min-w-0 gap-1.5">
          <CardTitle
            id="register-details-title"
            role="heading"
            aria-level={1}
            className="text-xl font-bold"
          >
            Register
          </CardTitle>
          <CardDescription className="min-w-0 text-xs leading-4 wrap-break-word">
            Please provide your personal information to set up your account.
          </CardDescription>
        </CardHeader>

        <CardContent className="min-w-0">
          <form className="min-w-0 space-y-6" onSubmit={handleSubmit}>
            <label className="block min-w-0 space-y-2">
              <span className="block text-sm font-medium">Email</span>
              <Input
                name="email"
                type="email"
                value={temporaryEmail}
                autoComplete="email"
                aria-readonly="true"
                className="h-10"
                required
                disabled
              />
            </label>

            <label className="block min-w-0 space-y-2">
              <span className="block text-sm font-medium">Username</span>
              <Input
                name="username"
                type="text"
                autoComplete="username"
                placeholder="Choose a username"
                className="h-10"
                required
              />
            </label>

            <label className="block min-w-0 space-y-2">
              <span className="block text-sm font-medium">Full name</span>
              <Input
                name="fullName"
                type="text"
                autoComplete="name"
                placeholder="Enter your full name"
                className="h-10"
                required
              />
            </label>

            <PhoneNumberField />

            <section
              aria-labelledby="address-section-title"
              className="border-border min-w-0 space-y-4 border-y py-4"
            >
              <h2 id="address-section-title" className="text-sm font-medium">
                Address
              </h2>

              <AddressCountryField />
            </section>

            <label className="block min-w-0 space-y-2">
              <span className="block text-sm font-medium">Password</span>
              <Input
                name="password"
                type="password"
                autoComplete="new-password"
                placeholder="Create a password"
                className="h-10"
                required
              />
            </label>

            <label className="block min-w-0 space-y-2">
              <span className="block text-sm font-medium">
                Confirm Password
              </span>
              <Input
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder="Confirm your password"
                className="h-10"
                required
              />
            </label>

            <Button type="submit" size="lg" className="w-full">
              Create account
            </Button>
          </form>
        </CardContent>

        <div className="flex min-w-0 justify-center px-6">
          <Link
            to="/terms"
            className="text-primary hover:text-primary/80 inline-flex h-9 items-center rounded-lg px-4 text-center text-xs font-medium transition-colors"
          >
            Terms of Service
          </Link>
        </div>
      </Card>
    </main>
  );
};

export default RegisterDetailsPage;
