import { Bell, Search, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import { Button } from "@/app/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/app/components/ui/input-group";
import { Skeleton } from "@/app/components/ui/skeleton";
import { useAuth } from "@/authentication/contexts/Auth/useAuth";
import avatarImage from "@/ecommerce/assets/avatar.webp";

type HeaderProps = {
  searchQuery: string;
  onSearch: (query: string) => void;
};

/** Shared catalog header with search and account actions. */
export const Header = ({ searchQuery, onSearch }: HeaderProps) => {
  const auth = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await auth.logout();
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="bg-card border-b">
      <div className="mx-auto grid w-full max-w-400 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-4 px-3 py-4 sm:px-6 lg:flex lg:justify-between lg:gap-x-8">
        <Link
          to="/"
          className="text-primary focus-visible:ring-ring/50 w-fit shrink-0 rounded-md text-xl leading-8 font-semibold tracking-[-0.2px] outline-none focus-visible:ring-3 min-[375px]:text-2xl"
        >
          E-Commerce
        </Link>
        <form
          key={searchQuery}
          role="search"
          aria-label="Products"
          className="col-span-2 row-start-2 min-w-0 lg:max-w-180 lg:flex-1"
          onSubmit={(event) => {
            event.preventDefault();
            onSearch(
              String(new FormData(event.currentTarget).get("q") ?? "").trim(),
            );
          }}
        >
          <InputGroup className="bg-secondary dark:bg-secondary border-border h-12 rounded-md">
            <InputGroupInput
              name="q"
              type="search"
              aria-label="Search products"
              placeholder="Search products"
              defaultValue={searchQuery}
              className="h-full pl-4 text-base md:text-base"
            />
            <InputGroupAddon align="inline-end" className="pr-1">
              <InputGroupButton
                type="submit"
                aria-label="Search"
                className="text-foreground size-11"
                size="icon-sm"
              >
                <Search className="size-5" aria-hidden="true" />
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </form>
        <div className="col-start-2 row-start-1 flex h-12 shrink-0 items-center gap-2 justify-self-end">
          {auth.isLoading ? (
            <div role="status" aria-label="Loading account">
              <Skeleton className="h-11 w-32" aria-hidden="true" />
            </div>
          ) : auth.isAuthenticated ? (
            // If Authenticated
            <>
              <Button
                variant="secondary"
                size="icon"
                render={<Link to="/cart" />}
                role="link"
                nativeButton={false}
                aria-label="Shopping cart"
                title="Shopping cart"
                className="border-border size-11 rounded-md disabled:opacity-70"
              >
                <ShoppingCart className="size-5" aria-hidden="true" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                disabled
                aria-label="Notifications (coming soon)"
                title="Notifications — coming soon"
                className="border-border size-11 rounded-md disabled:opacity-70"
              >
                <Bell className="size-5" aria-hidden="true" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Account"
                      disabled={isLoggingOut}
                      className="size-11 overflow-hidden rounded-lg p-0"
                    >
                      <img
                        src={avatarImage}
                        alt=""
                        width={44}
                        height={44}
                        className="size-11 object-cover"
                      />
                    </Button>
                  }
                />
                <DropdownMenuContent
                  align="end"
                  sideOffset={8}
                  className="w-48 p-2"
                  aria-label="Account"
                >
                  <DropdownMenuItem
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    closeOnClick={false}
                    className="bg-secondary text-secondary-foreground min-h-11 justify-center font-medium"
                  >
                    <span aria-live="polite">
                      {isLoggingOut ? "Logging out…" : "Log out"}
                    </span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            // If Unauthenticated
            <>
              <Button
                role="link"
                nativeButton={false}
                variant="ghost"
                className="min-h-11 px-2"
                render={<Link to="/login" />}
              >
                Log in
              </Button>
              <Button
                role="link"
                nativeButton={false}
                className="min-h-11 px-2"
                render={<Link to="/register/enter-email" />}
              >
                Sign up
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
