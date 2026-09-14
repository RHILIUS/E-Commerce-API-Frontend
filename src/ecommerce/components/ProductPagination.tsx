import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/app/components/ui/pagination";

type ProductPaginationProps = {
  page: number;
  pageCount: number;
  searchParams: URLSearchParams;
};

/** URL-backed pagination preserves search filters and browser back/forward navigation. */
export const ProductPagination = ({
  page,
  pageCount,
  searchParams,
}: ProductPaginationProps) => {
  // Preserve the other catalog parameters when changing only the page.
  const pageUrl = (target: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", String(target));
    return `?${params.toString()}`;
  };

  return (
    <Pagination aria-label="Product pages">
      <PaginationContent className="gap-1">
        <PaginationItem>
          <PaginationPrevious
            to={pageUrl(Math.max(1, page - 1))}
            aria-disabled={page === 1}
            tabIndex={page === 1 ? -1 : undefined}
            onClick={(event) => {
              if (page === 1) event.preventDefault();
            }}
            className="size-11 font-normal aria-disabled:pointer-events-none aria-disabled:opacity-40 sm:w-auto sm:px-3"
          />
        </PaginationItem>
        {Array.from({ length: pageCount }, (_, index) => index + 1).map(
          (number) => (
            <PaginationItem key={number}>
              <PaginationLink
                to={pageUrl(number)}
                isActive={number === page}
                aria-label={`Page ${number}`}
                className="size-11 font-normal"
              >
                {number}
              </PaginationLink>
            </PaginationItem>
          ),
        )}
        <PaginationItem>
          <PaginationNext
            to={pageUrl(Math.min(pageCount, page + 1))}
            aria-disabled={page === pageCount}
            tabIndex={page === pageCount ? -1 : undefined}
            onClick={(event) => {
              if (page === pageCount) event.preventDefault();
            }}
            className="size-11 font-normal aria-disabled:pointer-events-none aria-disabled:opacity-40 sm:w-auto sm:px-3"
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
};
