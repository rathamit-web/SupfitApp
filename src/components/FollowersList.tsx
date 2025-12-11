import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useFollowers } from '@/hooks/useFollowers';
import { useFollowUser } from '@/hooks/useFollowUser';
import { useState } from 'react';

const FollowersList = () => {
  const [page, setPage] = useState(1);
  const { data: followersPage, isFetching } = useFollowers(page, 6);
  const followMutation = useFollowUser();

  return (
    <div className="space-y-3">
      {(followersPage?.data ?? []).map((follower, index) => (
        <Card
          key={follower.id}
          className="glass-card hover:border-primary/50 transition-all duration-300 hover-lift"
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                {index === 0 && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-accent to-primary rounded-full flex items-center justify-center text-xs font-bold text-white shadow-lg">
                    1
                  </div>
                )}
                <Avatar className="w-12 h-12 border-2 border-white/30 backdrop-blur-sm glass">
                  <AvatarImage src={follower.avatar} />
                  <AvatarFallback>{follower.name[0]}</AvatarFallback>
                </Avatar>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground truncate">{follower.name}</p>
                <p className="text-xs text-muted-foreground truncate">{follower.username}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => followMutation.mutate(follower.id)}
                  disabled={followMutation.isPending}
                >
                  {followMutation.isPending ? 'Following…' : 'Follow'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      <div className="flex items-center justify-between mt-2">
        <Button
          size="sm"
          variant="ghost"
          disabled={page <= 1 || isFetching}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          Prev
        </Button>
        <span className="text-xs text-muted-foreground">Page {page}</span>
        <Button
          size="sm"
          variant="ghost"
          disabled={
            isFetching ||
            (followersPage ? page * followersPage.pageSize >= followersPage.total : false)
          }
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export default FollowersList;
