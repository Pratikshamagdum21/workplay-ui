# TODO

## Fix `src/services/invoice.service.ts` bugs

- [x] Create TODO.md
- [ ] Fix `getInvoiceById` to return the HTTP-fetched invoice directly (remove internal subscribe + type mismatch)
- [ ] Fix `updateInvoice` to refresh the local cache after a successful update and fix indentation
- [ ] Verify the changes are compatible with consumers (`invoice-list.ts`, `create-invoice.ts`)
