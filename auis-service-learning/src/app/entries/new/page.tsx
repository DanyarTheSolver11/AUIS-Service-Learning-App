import Link from "next/link";
import { EntryForm } from "@/components/EntryForm";

export default function NewEntryPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <Link href="/dashboard" className="text-sm text-slate-500 hover:underline">
        ← Back to dashboard
      </Link>
      <h1 className="mt-2 text-2xl font-semibold">Add Volunteering Entry</h1>
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
        <EntryForm />
      </div>
    </div>
  );
}
