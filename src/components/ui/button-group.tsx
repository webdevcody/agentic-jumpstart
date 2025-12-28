"use client"

import * as React from "react"
import { cn } from "~/lib/utils"

function ButtonGroup({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="button-group"
      className={cn(
        "flex items-center [&>button]:rounded-none [&>button]:border-l-0 [&>button:first-child]:rounded-l-md [&>button:first-child]:border-l [&>button:last-child]:rounded-r-md [&>[data-slot=input-group]]:rounded-none [&>[data-slot=input-group]:first-child]:rounded-l-md [&>[data-slot=input-group]:last-child]:rounded-r-md",
        className
      )}
      {...props}
    />
  )
}

function InputGroup({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="input-group"
      className={cn(
        "flex items-center border border-input bg-background rounded-md focus-within:ring-1 focus-within:ring-ring",
        className
      )}
      {...props}
    />
  )
}

function InputGroupInput({
  className,
  ...props
}: React.ComponentProps<"input">) {
  return (
    <input
      data-slot="input-group-input"
      className={cn(
        "flex-1 bg-transparent px-3 py-1.5 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 min-w-0",
        className
      )}
      {...props}
    />
  )
}

function InputGroupAddon({
  className,
  align = "inline-start",
  ...props
}: React.ComponentProps<"span"> & {
  align?: "inline-start" | "inline-end"
}) {
  return (
    <span
      data-slot="input-group-addon"
      data-align={align}
      className={cn(
        "text-sm text-muted-foreground px-2 select-none shrink-0",
        align === "inline-start" && "order-first",
        align === "inline-end" && "order-last",
        className
      )}
      {...props}
    />
  )
}

export { ButtonGroup, InputGroup, InputGroupInput, InputGroupAddon }
