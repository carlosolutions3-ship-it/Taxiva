import { requireUser } from "@/lib/actions";
import { getUserTaxContext } from "@/lib/tax";
import { prisma } from "@/lib/prisma";
import { SectionHeader } from "@/components/ui";
import { DocumentUploadForm } from "@/components/DocumentUploadForm";
import { DocumentList } from "@/components/DocumentList";

export default async function DocumentsPage() {
  const user = await requireUser();
  const [documents, { missingDocuments }] = await Promise.all([
    prisma.document.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }),
    getUserTaxContext(user),
  ]);

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Document center"
        title="Your tax documents"
        description={`${documents.length} document${documents.length === 1 ? "" : "s"} found. Upload an image (best-effort local OCR) or paste text — both run the same field extraction and categorization.`}
      />

      <DocumentUploadForm />

      <DocumentList documents={documents} missingDocuments={missingDocuments} />
    </div>
  );
}
