import { Fragment } from "react";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
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

  // Keep link count bounded even when the server has millions of products.
  const pages = [...new Set([1, page - 1, page, page + 1, pageCount])]
    .filter((number) => number >= 1 && number <= pageCount)
    .sort((a, b) => a - b);

  return (
    <Pagination aria-label="Product pages">
      <PaginationContent className="flex-wrap gap-1">
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
        {pages.map((number, index) => (
          <Fragment key={number}>
            {index > 0 && number - pages[index - 1] > 1 && (
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            )}
            <PaginationItem>
              <PaginationLink
                to={pageUrl(number)}
                isActive={number === page}
                aria-label={`Page ${number}`}
                className="size-11 font-normal"
              >
                {number}
              </PaginationLink>
            </PaginationItem>
          </Fragment>
        ))}
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
