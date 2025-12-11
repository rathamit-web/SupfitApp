import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { TrendingUp, Users, Wallet, AlertCircle } from 'lucide-react';
import { XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import Footer from '@/components/Footer';
import PageContainer from '@/components/PageContainer';

const RevenueTracker = () => {
  const stats = [
    {
      label: 'Total Revenue',
      value: '₹67,322',
      change: '+32% this month',
      changeColor: 'text-green-500',
      icon: Wallet,
    },
    {
      label: 'Active Clients',
      value: '48',
      change: '+17%',
      changeColor: 'text-green-500',
      icon: Users,
    },
    { label: 'Revenue', value: '₹2,400', change: '', changeColor: '', icon: TrendingUp },
    {
      label: 'Upcoming Payments',
      value: '₹7,500',
      change: '•2 overdue',
      changeColor: 'text-red-500',
      icon: AlertCircle,
    },
  ];

  const chartData = [
    { month: 'Jan', revenue: 18800 },
    { month: 'Feb', revenue: 19500 },
    { month: 'Mar', revenue: 20200 },
    { month: 'Apr', revenue: 21800 },
    { month: 'May', revenue: 24400 },
    { month: 'Jun', revenue: 24400 },
  ];

  const topClients = [
    {
      id: 1,
      name: 'Archit Patil',
      revenue: '₹12,300',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80',
    },
    {
      id: 2,
      name: 'Priya Sharma',
      revenue: '₹10,500',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80',
    },
    {
      id: 3,
      name: 'Rahul Verma',
      revenue: '₹8,200',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
    },
  ];

  const packagePopularity = [
    { name: 'Premium', percentage: 85, color: 'bg-blue-500' },
    { name: 'Standard', percentage: 65, color: 'bg-green-500' },
    { name: 'Basic', percentage: 45, color: 'bg-orange-400' },
  ];

  const paymentMethods = [
    { name: 'UPI', icon: '💳', color: 'text-orange-500' },
    { name: 'PayPal', icon: '🅿️', color: 'text-blue-600' },
    { name: 'Card', icon: '💳', color: 'text-blue-500' },
    { name: 'Cash', icon: '💵', color: 'text-red-500' },
  ];

  return (
    <main className="bg-gradient-to-br from-purple-50/50 via-background to-cyan-50/50 pb-20">
      <PageContainer>
        <div className="page-container mx-auto px-0">
          <h1 className="text-3xl font-bold text-foreground mb-8">Revenue Tracker</h1>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            {stats.map((stat) => (
              <Card key={stat.label} className="glass-card hover-lift">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  {stat.change && <p className={`text-xs ${stat.changeColor}`}>{stat.change}</p>}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Revenue Chart */}
          <Card className="glass-card mb-8">
            <CardContent className="p-4">
              <h2 className="text-lg font-bold text-foreground mb-4">Revenue</h2>
              <div className="flex justify-between text-sm text-muted-foreground mb-2">
                <span>₹24,400</span>
                <span className="font-bold text-foreground">₹24,400</span>
              </div>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis hide />
                    <Tooltip
                      formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Revenue']}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      fill="url(#revenueGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Top Clients & Package Popularity */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <Card className="glass-card">
              <CardContent className="p-4">
                <h2 className="text-lg font-bold text-foreground mb-4">Top Clients</h2>
                {topClients.map((client) => (
                  <div
                    key={client.id}
                    className="flex items-center justify-between gap-3 mb-3 last:mb-0"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={client.avatar} />
                        <AvatarFallback>{client.name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-foreground">{client.name}</p>
                      </div>
                    </div>
                    <p className="text-xs text-primary">{client.revenue}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardContent className="p-4">
                <h2 className="text-lg font-bold text-foreground mb-4">Package Popularity</h2>
                <div className="space-y-3">
                  {packagePopularity.map((pkg) => (
                    <div key={pkg.name} className="space-y-1">
                      <div className="h-3 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full ${pkg.color} rounded-full transition-all duration-500`}
                          style={{ width: `${pkg.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Methods */}
          <Card className="glass-card mb-8">
            <CardContent className="p-4">
              <h2 className="text-lg font-bold text-foreground mb-4">Payment Methods</h2>
              <div className="flex justify-around">
                {paymentMethods.map((method) => (
                  <div key={method.name} className="flex items-center gap-2">
                    <span className="text-lg">{method.icon}</span>
                    <span className="text-sm font-medium text-foreground">{method.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Motivational Footer */}
          <div className="text-center py-4">
            <p className="text-lg text-muted-foreground">Your effort = Your growth 🚀</p>
          </div>
        </div>
      </PageContainer>
      <Footer />
    </main>
  );
};

export default RevenueTracker;
