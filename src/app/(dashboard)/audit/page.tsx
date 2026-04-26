import { PageHeader } from "@/components/ui";
import { AuditClient } from "./client";

export default function AuditPage() {
  return (
    <div className="px-10 py-10 max-w-4xl">
      <PageHeader
        title="On-page audit"
        subtitle="Score any URL on title, meta, headings, internal links, structured data, and more."
      />
      <AuditClient />
    </div>
  );
}
