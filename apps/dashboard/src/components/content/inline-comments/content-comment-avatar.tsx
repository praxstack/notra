import Image from "@/components/framework/image";
import type { ContentCommentAvatarProps } from "@/types/content/inline-comments";

export function ContentCommentAvatar({
  name,
  image,
}: ContentCommentAvatarProps) {
  return (
    <span
      aria-hidden="true"
      className="bg-foreground/10 text-foreground relative inline-flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-sm text-sm"
      data-comment-avatar="square"
    >
      {name.slice(0, 1).toUpperCase()}
      {image ? (
        <Image
          alt=""
          src={image}
          width={24}
          height={24}
          unoptimized
          className="absolute inset-0 size-full object-cover"
          onError={(event) => {
            event.currentTarget.hidden = true;
          }}
        />
      ) : null}
    </span>
  );
}
