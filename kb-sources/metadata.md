---
title: Setting page metadata in the App Router
source: Next.js docs, Metadata API
authority: official
period: current
---

# Metadata

In the App Router you set page metadata with the **Metadata API**. Export a
static `metadata` object for fixed tags or a `generateMetadata` function for
dynamic ones from a layout or page. Next.js renders the tags into the document
head.

You do **not** use `next/head` in the App Router. `next/head` belongs to the
Pages Router and has no effect inside a Server Component.
