import { notFound } from "next/navigation";
import { getArticleForPreview } from "@/lib/services/articles";
import { ArticleView } from "@/components/site/ArticleView";

export const metadata = { title: "Preview Artikel", robots: { index: false, follow: false } };

export default async function ArticlePreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const article = await getArticleForPreview(id);
  if (!article) notFound();

  return (
    <div className="-m-4 md:-m-8">
      <ArticleView article={article} isPreview />
    </div>
  );
}
