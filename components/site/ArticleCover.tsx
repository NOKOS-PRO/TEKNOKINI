import Image from "next/image";
import { CoverArt } from "./CoverArt";

/** Featured image when there is one, otherwise the category's generated cover. */
export function ArticleCover({
  src,
  alt,
  seed,
  category,
  sizes,
  priority = false,
  artWidth = 400,
  artHeight = 250,
}: {
  src: string | null;
  alt: string;
  seed: string;
  category?: string | null;
  sizes: string;
  priority?: boolean;
  artWidth?: number;
  artHeight?: number;
}) {
  if (src) {
    return <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" />;
  }
  return <CoverArt seed={seed} category={category} width={artWidth} height={artHeight} />;
}
