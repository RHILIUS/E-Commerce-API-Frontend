import { useNavigate, useSearchParams } from "react-router-dom";

import { Button } from "@/app/components/ui/button";
import { Skeleton } from "@/app/components/ui/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/app/components/ui/tabs";
import { useAuth } from "@/authentication/contexts/Auth/useAuth";
import { Header } from "@/ecommerce/components/Header";

import { ChangePasswordPanel } from "../components/ChangePasswordPanel";
import { ProfilePanel } from "../components/ProfilePanel";
import { RecipientManager } from "../components/RecipientManager";
import { useRecipients } from "../hooks/useRecipients";

/** Account entry point for profile, recipients and verified password changes. */
export default function UserAccountPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const requestedTab = params.get("tab");
  const tab =
    requestedTab === "recipients" || requestedTab === "change-password"
      ? requestedTab
      : "profile";
  return (
    <div className="bg-background text-foreground flex min-w-0 flex-col">
      <Header
        searchQuery=""
        onSearch={(query) =>
          navigate(query ? `/?${new URLSearchParams({ q: query })}` : "/")
        }
      />
      <main className="mx-auto w-full max-w-3xl flex-1 space-y-6 px-3 py-6 sm:px-6 sm:py-10">
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl">My account</h1>
          <p className="text-muted-foreground text-sm">
            Manage your profile, delivery recipients and password.
          </p>
        </div>
        {user && (
          <Tabs
            key={user.id}
            value={tab}
            onValueChange={(value) => setParams({ tab: String(value) })}
            className="gap-5"
          >
            <TabsList
              className="h-12 w-full group-data-horizontal/tabs:h-12"
              aria-label="Account sections"
            >
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="recipients">Recipients</TabsTrigger>
              <TabsTrigger
                value="change-password"
                className="min-w-0 text-center leading-4 whitespace-normal"
              >
                Change Password
              </TabsTrigger>
            </TabsList>
            <TabsContent value="change-password" keepMounted>
              <ChangePasswordPanel />
            </TabsContent>
            <TabsContent value="profile">
              <ProfilePanel />
            </TabsContent>
            <TabsContent value="recipients">
              <AccountRecipients />
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}

// Keep account-scoped loading and mutations isolated when the signed-in customer changes.
function AccountRecipients() {
  const { recipients, setRecipients, error, retry } = useRecipients();
  return (
    <section
      className="bg-card space-y-5 rounded-xl border p-4 sm:p-6"
      aria-labelledby="account-recipients-heading"
    >
      <div className="space-y-1">
        <h2 id="account-recipients-heading" className="text-xl">
          Recipients
        </h2>
        <p className="text-muted-foreground text-sm">
          Your default recipient is preselected at checkout. You can choose a
          different recipient for each order.
        </p>
      </div>
      {error ? (
        <div role="alert" className="space-y-3">
          <p className="text-destructive text-sm">{error}</p>
          <Button variant="outline" className="min-h-11" onClick={retry}>
            Try again
          </Button>
        </div>
      ) : recipients === null ? (
        <div role="status" className="space-y-3">
          <span className="sr-only">Loading recipients…</span>
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : (
        <RecipientManager recipients={recipients} onChange={setRecipients} />
      )}
    </section>
  );
}
