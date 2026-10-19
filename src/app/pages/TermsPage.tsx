import { Link } from "react-router-dom";

const linkClassName =
  "text-primary rounded-sm underline underline-offset-4 outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

const TermsPage = () => (
  <div className="flex w-full min-w-0 flex-col">
    <header className="border-b px-6 py-5 sm:px-10">
      <Link
        to="/"
        className="focus-visible:ring-ring/50 inline-flex min-h-11 items-center gap-3 rounded-md outline-none focus-visible:ring-3"
        aria-label="E-Commerce home"
      >
        <img src="/favicon.svg" alt="" className="size-9" />
        <span>
          <span className="block text-lg font-semibold">E-Commerce</span>
          <span className="text-muted-foreground block text-xs">
            by RhiLius Apps
          </span>
        </span>
      </Link>
    </header>

    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10 sm:py-14">
      <h1 className="text-3xl leading-tight sm:text-4xl">Demo Terms of Use</h1>
      <p className="text-muted-foreground mt-3 text-sm">
        Effective <time dateTime="2026-10-20">October 20, 2026</time>
      </p>
      <p className="mt-6 leading-7">
        E-Commerce by RhiLius Apps is a portfolio project built to demonstrate
        software development skills. These terms explain how to explore the
        hosted demo responsibly.
      </p>

      <div className="bg-muted mt-8 rounded-xl border p-5 sm:p-6">
        <h2 className="text-lg font-semibold">
          A demo, with no real purchases
        </h2>
        <p className="mt-3 leading-7">
          This website is currently a demonstration project. Stripe card
          payments use test mode and do not charge real money. Delivery
          operations, product returns, and wallet withdrawals are not currently
          available as complete services.
        </p>
        <p className="mt-3 leading-7">
          All orders, including Cash on Delivery orders, are simulated. No goods
          will be shipped, and no payment will be collected on delivery. Product
          listings and prices are for demonstration purposes.
        </p>
      </div>

      <div className="mt-10 space-y-8 leading-7">
        <section aria-labelledby="test-data">
          <h2 id="test-data" className="text-xl font-semibold">
            Use test information
          </h2>
          <p className="mt-3">
            Use fictional names, addresses, phone numbers, and recipient
            details. Use an email address you control if you register, because
            account verification requires access to that inbox. Choose a unique
            password you do not use elsewhere. Do not upload sensitive documents
            or enter real payment card details; use Stripe test payment details
            only.
          </p>
        </section>
        <section aria-labelledby="responsible-use">
          <h2 id="responsible-use" className="text-xl font-semibold">
            Explore responsibly
          </h2>
          <p className="mt-3">
            You are welcome to explore the shopping, account, and test checkout
            features. Do not impersonate others, access accounts or data without
            permission, send spam, overload the service, or interfere with other
            visitors. A publicly accessible demo is not permission to perform
            intrusive security testing. Access may be restricted to address
            abuse or protect the service.
          </p>
        </section>
        <section aria-labelledby="demo-data">
          <h2 id="demo-data" className="text-xl font-semibold">
            Demo data and availability
          </h2>
          <p className="mt-3">
            Account and order information submitted through the demo is stored
            to support its features. Demo accounts, products, and orders may be
            changed or deleted during maintenance or resets. Do not use this
            service to keep important records. Features may change or become
            unavailable, and uninterrupted access is not guaranteed.
          </p>
        </section>
        <section aria-labelledby="source-code">
          <h2 id="source-code" className="text-xl font-semibold">
            Source code and third-party content
          </h2>
          <p className="mt-3">
            These terms cover use of the hosted demo. Permission to reuse source
            code is governed separately by the license provided in its
            repository. These terms do not grant a license to product images,
            trademarks, or other third-party content.
          </p>
        </section>
        <section aria-labelledby="contact">
          <h2 id="contact" className="text-xl font-semibold">
            Questions and feedback
          </h2>
          <p className="mt-3">
            For general questions or demo feedback, visit the{" "}
            <a
              className={linkClassName}
              href="https://github.com/RHILIUS/E-Commerce-API-Frontend/issues"
            >
              project’s GitHub issues
            </a>
            . GitHub issues are public: do not post passwords, personal
            information, or security vulnerability details there.
          </p>
        </section>
        <section aria-labelledby="updates">
          <h2 id="updates" className="text-xl font-semibold">
            Updates to these terms
          </h2>
          <p className="mt-3">
            These terms may be updated as the demo develops. The effective date
            above identifies the current version. Nothing in these terms
            excludes rights that cannot be excluded under applicable law.
          </p>
        </section>
      </div>
      <nav aria-label="Terms navigation" className="mt-10 border-t pt-6">
        <Link
          to="/"
          className={`${linkClassName} inline-flex min-h-11 items-center`}
        >
          Back to the demo
        </Link>
      </nav>
    </main>
  </div>
);

export default TermsPage;
