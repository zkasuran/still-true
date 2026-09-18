---
title: Web search tool type (current, Claude 4.6+)
source: Anthropic API changelog and server-tools docs
period: current
authority: official
---

# Web search server tool

On Claude 4.6 and newer (Opus 4.6/4.7/4.8, Opus 5, Sonnet 5) the web search server
tool type is `web_search_20260209`. This variant has built-in dynamic filtering, so
you do not separately declare a code execution tool alongside it.

Older models use the basic `web_search_20250305` variant instead.
