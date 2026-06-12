'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectLoadingItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { OptionPage } from '@/lib/api/client'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useRef, useState } from 'react'

const SCROLL_BOTTOM_THRESHOLD_PX = 32
const ALL = '__all__'

export function InfiniteSelect({
  label,
  value,
  onChange,
  selectedLabel,
  allLabel,
  queryKey,
  queryFn,
}: {
  label: string
  value: string | undefined
  onChange: (value: string | undefined) => void
  selectedLabel?: string
  allLabel: string
  queryKey: string
  queryFn: (cursor?: string) => Promise<OptionPage>
}) {
  const [open, setOpen] = useState(false)
  const prevScrollTop = useRef(0)

  const { data, fetchNextPage, hasNextPage, isFetching, isPending } =
    useInfiniteQuery({
      queryKey: ['options', queryKey],
      queryFn: ({ pageParam }) => queryFn(pageParam),
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (last) => last.nextCursor ?? undefined,
      enabled: open,
      staleTime: 5 * 60_000,
    })

  const options = data?.pages.flatMap((p) => p.items) ?? []

  function handleViewportScroll(e: React.UIEvent<HTMLDivElement>) {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
    const scrollingDown = scrollTop > prevScrollTop.current
    prevScrollTop.current = scrollTop
    if (
      scrollingDown &&
      hasNextPage &&
      !isFetching &&
      scrollTop + clientHeight >= scrollHeight - SCROLL_BOTTOM_THRESHOLD_PX
    ) {
      void fetchNextPage()
    }
  }

  return (
    <Select
      open={open}
      onOpenChange={setOpen}
      value={value ?? ALL}
      onValueChange={(v) => onChange(v === ALL ? undefined : v)}
    >
      <SelectTrigger
        aria-label={label}
        className={value ? 'bg-accent-soft text-accent' : undefined}
      >
        <span className="flex items-center gap-1.5">
          <span className={value ? 'font-semibold' : undefined}>{label}</span>
          {value && (
            <>
              <span aria-hidden="true">·</span>
              <SelectValue>{selectedLabel ?? value}</SelectValue>
            </>
          )}
        </span>
      </SelectTrigger>
      <SelectContent onViewportScroll={handleViewportScroll}>
        <SelectItem value={ALL}>{allLabel}</SelectItem>
        {value && !options.some((o) => o.value === value) && (
          <SelectItem value={value}>{selectedLabel ?? value}</SelectItem>
        )}
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
        {(isPending || isFetching) &&
          Array.from({ length: isPending ? 8 : 3 }).map((_, i) => (
            <SelectLoadingItem key={`skeleton-${i}`} />
          ))}
      </SelectContent>
    </Select>
  )
}

export function StaticSelect({
  label,
  value,
  onChange,
  allLabel,
  options,
}: {
  label: string
  value: string | undefined
  onChange: (value: string | undefined) => void
  allLabel: string
  options: { value: string; label: string }[]
}) {
  return (
    <Select
      value={value ?? ALL}
      onValueChange={(v) => onChange(v === ALL ? undefined : v)}
    >
      <SelectTrigger
        aria-label={label}
        className={value ? 'bg-accent-soft text-accent' : undefined}
      >
        <span className="flex items-center gap-1.5">
          <span className={value ? 'font-semibold' : undefined}>{label}</span>
          {value && (
            <>
              <span aria-hidden="true">·</span>
              <SelectValue />
            </>
          )}
        </span>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{allLabel}</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
