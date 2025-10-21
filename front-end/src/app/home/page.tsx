import Feed from "../components/Feed"; 
import FollowedCommunities from "../components/FollowedCommunities";

export default function HomePage() {
  return (
    <div className="max-w-5xl mx-auto px-4 lg:px-6 py-6 lg:py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Feed />
        </div>
        <div className="lg:col-span-1">
          <FollowedCommunities />
        </div>
      </div>
    </div>
  );
}