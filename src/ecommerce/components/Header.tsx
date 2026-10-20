import {
  Bell,
  LogOut,
  Package,
  Search,
  ShoppingCart,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { ThemeToggle } from "@/app/components/ThemeToggle";
import { Button } from "@/app/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/app/components/ui/input-group";
import { Skeleton } from "@/app/components/ui/skeleton";
import { cn } from "@/app/lib/utils";
import { useAuth } from "@/authentication/contexts/Auth/useAuth";
import avatarImage from "@/ecommerce/assets/avatar.webp";
import { useFloatingHeader } from "@/ecommerce/hooks/useFloatingHeader";

type HeaderProps = {
  searchQuery: string;
  onSearch: (query: string) => void;
};

/** Shared catalog header with search and account actions. */
export const Header = ({ searchQuery, onSearch }: HeaderProps) => {
  const auth = useAuth();
  const { markerRef, isFloating } = useFloatingHeader();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchToggleRef = useRef<HTMLButtonElement>(null);
  const searchId = useId();

  useEffect(() => {
    if (isSearchOpen) searchInputRef.current?.focus();
  }, [isSearchOpen]);

  const closeSearch = () => {
    setIsSearchOpen(false);
    searchToggleRef.current?.focus();
  };
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const imageKey = `${auth.user?.id}:${auth.user?.profile_image}`;
  const accountImage =
    auth.user?.profile_image && failedImage !== imageKey
      ? auth.user.profile_image
      : avatarImage;
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
    <>
      <div className="relative h-0" aria-hidden="true">
        <span
          ref={markerRef}
          className="pointer-events-none absolute top-18 left-0 size-px"
        />
      </div>
      <header
        className="sticky top-0 z-40 w-full shrink-0"
        data-floating={isFloating}
      >
        <div
          className={cn(
            "bg-card motion-safe:transition-[border-radius,box-shadow,transform,width] motion-safe:duration-200",
            isFloating
              ? "mx-auto w-[calc(100%-1.5rem)] max-w-300 translate-y-3 rounded-2xl border shadow-lg"
              : "w-full border border-x-transparent border-t-transparent",
          )}
        >
          <div className="mx-auto grid w-full max-w-400 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 px-3 sm:px-5 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:gap-x-8">
            <Link
              to="/"
              aria-label="E-Commerce home"
              className="text-foreground focus-visible:ring-ring/50 flex min-h-18 w-fit min-w-0 items-center gap-2 rounded-md font-semibold tracking-tight outline-none focus-visible:ring-3"
            >
              <img src="/favicon.svg" alt="" className="size-9 shrink-0" />
              <span className="hidden text-lg min-[430px]:block lg:text-xl">
                E-Commerce
              </span>
            </Link>
            <form
              id={searchId}
              role="search"
              aria-label="Products"
              className={cn(
                "col-span-2 row-start-2 min-w-0 pb-3 lg:col-span-1 lg:col-start-2 lg:row-start-1 lg:block lg:w-full lg:max-w-180 lg:justify-self-center lg:pb-0",
                !isSearchOpen && "hidden",
              )}
              onKeyDown={(event) => {
                if (
                  event.key === "Escape" &&
                  isSearchOpen &&
                  searchToggleRef.current &&
                  getComputedStyle(searchToggleRef.current).display !== "none"
                ) {
                  event.preventDefault();
                  closeSearch();
                }
              }}
              onSubmit={(event) => {
                event.preventDefault();
                onSearch(
                  String(
                    new FormData(event.currentTarget).get("q") ?? "",
                  ).trim(),
                );
              }}
            >
              <InputGroup className="bg-secondary border-border h-11 rounded-xl">
                <InputGroupInput
                  key={searchQuery}
                  ref={searchInputRef}
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
            <div className="col-start-2 row-start-1 flex min-w-0 items-center gap-1 justify-self-end lg:col-start-3 lg:gap-2">
              <Button
                ref={searchToggleRef}
                type="button"
                variant={isSearchOpen ? "secondary" : "ghost"}
                className="size-11 rounded-xl lg:hidden"
                aria-label={isSearchOpen ? "Close search" : "Open search"}
                aria-expanded={isSearchOpen}
                aria-controls={searchId}
                onClick={() =>
                  isSearchOpen ? closeSearch() : setIsSearchOpen(true)
                }
              >
                {isSearchOpen ? (
                  <X className="size-5" aria-hidden="true" />
                ) : (
                  <Search className="size-5" aria-hidden="true" />
                )}
              </Button>
              <ThemeToggle />
              {auth.isLoading ? (
                <div role="status" aria-label="Loading account">
                  <Skeleton className="h-11 w-24 sm:w-32" aria-hidden="true" />
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
                    className="border-border size-11 rounded-xl disabled:opacity-70"
                  >
                    <ShoppingCart className="size-5" aria-hidden="true" />
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
                            key={imageKey}
                            src={accountImage}
                            onError={() => setFailedImage(imageKey)}
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
                      className="w-64 max-w-[calc(100vw-2rem)] p-2"
                      aria-label="Account"
                    >
                      <DropdownMenuGroup>
                        <DropdownMenuLabel className="flex min-w-0 items-center gap-3 px-3 py-3">
                          <img
                            key={imageKey}
                            src={accountImage}
                            onError={() => setFailedImage(imageKey)}
                            alt=""
                            width={40}
                            height={40}
                            className="size-10 shrink-0 rounded-lg object-cover"
                          />
                          <span className="text-foreground min-w-0 text-sm leading-5 font-medium wrap-anywhere">
                            {auth.user?.fullName}
                          </span>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          render={<Link to="/account" />}
                          className="min-h-11 gap-3 px-3 font-medium"
                        >
                          <UserRound className="size-4" aria-hidden="true" />{" "}
                          Account
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          render={<Link to="/orders" />}
                          className="min-h-11 gap-3 px-3 font-medium"
                        >
                          <Package className="size-4" aria-hidden="true" />{" "}
                          Orders
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          disabled
                          className="min-h-11 gap-3 px-3"
                        >
                          <Bell className="size-4" aria-hidden="true" />
                          <span>
                            Notifications
                            <span className="block text-xs">Coming soon</span>
                          </span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={handleLogout}
                          disabled={isLoggingOut}
                          closeOnClick={false}
                          className="mt-1 min-h-11 gap-3 border-t px-3 font-medium"
                        >
                          <LogOut className="size-4" aria-hidden="true" />
                          <span aria-live="polite">
                            {isLoggingOut ? "Logging out…" : "Log out"}
                          </span>
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
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
        </div>
      </header>
    </>
  );
};
