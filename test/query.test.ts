/**
 * Unit tests for the Gmail query builder.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildQuery } from "../src/query.js";

test("returns '' when no filters are given", () => {
  assert.equal(buildQuery({}), "");
  assert.equal(buildQuery({ query: "   " }), "");
});

test("passes a raw query through", () => {
  assert.equal(buildQuery({ query: "from:bob invoice" }), "from:bob invoice");
});

test("maps structured filters to Gmail operators", () => {
  assert.equal(buildQuery({ from: "acme.com" }), "from:acme.com");
  assert.equal(buildQuery({ label: "sales" }), "label:sales");
  assert.equal(buildQuery({ newer_than: "30d" }), "newer_than:30d");
  assert.equal(buildQuery({ after: "2026/01/01" }), "after:2026/01/01");
  assert.equal(buildQuery({ has_attachment: true }), "has:attachment");
  assert.equal(buildQuery({ is_unread: true }), "is:unread");
});

test("quotes values containing whitespace", () => {
  assert.equal(buildQuery({ subject: "demo request" }), 'subject:"demo request"');
  assert.equal(buildQuery({ from: "Jane Doe" }), 'from:"Jane Doe"');
});

test("combines raw query with structured filters in order", () => {
  const q = buildQuery({
    query: "urgent",
    from: "acme.com",
    subject: "invoice",
    newer_than: "30d",
    has_attachment: true,
  });
  assert.equal(q, 'urgent from:acme.com subject:invoice newer_than:30d has:attachment');
});

test("omits falsy booleans", () => {
  assert.equal(buildQuery({ label: "x", has_attachment: false, is_unread: false }), "label:x");
});
