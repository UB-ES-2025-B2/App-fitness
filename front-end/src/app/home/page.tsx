import Feed from "../components/Feed"; 
import FollowedCommunities from "../components/FollowedCommunities";
import HomeCityProgressPanel from "../components/HomeCityProgressPanel";

export default function HomePage() {
  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-8 py-6 lg:py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        <div className="lg:col-span-2">
          <Feed />
        </div>

        <div className="lg:col-span-1 flex flex-col gap-6">
          <FollowedCommunities />
          <HomeCityProgressPanel />
        </div>
      </div>
      {/* Chat is now mounted globally in RootLayout */}
    </div>
  );
}