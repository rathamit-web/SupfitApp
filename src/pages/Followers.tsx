import FollowersList from '@/components/FollowersList';

const FollowersPage = () => {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4 text-foreground">Followers</h1>
      <FollowersList />
    </main>
  );
};

export default FollowersPage;
