import { CreatePost } from "@/components/feed/create-post";
import { PageHero } from "@/components/page-hero";

export default function CreatePage() {
  return (
    <div>
      <PageHero title="Create" subtitle="Post, story, reel, live, page, group, event, or listing" />
      <CreatePost />
    </div>
  );
}
