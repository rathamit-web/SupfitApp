import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft,
  Phone,
  Mail,
  MessageSquare,
  Calendar,
  FileText,
  Utensils,
  CheckCircle,
  Scale,
  MessageCircle,
  ChevronRight,
  Dumbbell,
  Apple,
  Activity,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PageContainer from '@/components/PageContainer';
import Footer from '@/components/Footer';

const ClientDetail = () => {
  const navigate = useNavigate();

  // Mock client data
  const client = {
    name: 'Amit Rath',
    program: 'Weight Loss Program',
    phone: '+91 98765 43210',
    email: 'amit.rath@email.com',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80',
    status: 'Active',
    week: 'Week 8/12',
    plan: 'Premium',
    progress: {
      currentWeight: '78 kg',
      targetWeight: '74 kg',
      weightLoss: '↓ 8 kg loss',
      toGo: '4 kg to go',
      sessionsDone: '32/48',
      sessionsProgress: '67% complete',
      attendance: '94%',
      attendanceStatus: 'Excellent',
    },
    bodyMetrics: {
      bodyFat: { value: '18%', change: '↓ 5%' },
      muscleMass: { value: '35 kg', change: '↑ 2kg' },
      bmi: { value: '24.2', status: 'Normal' },
    },
    weightProgress: 67,
    dietPlan: {
      dailyCalories: '2,000 kcal',
      macroSplit: '40% C / 30% P / 30% F',
      meals: [
        {
          type: 'Breakfast',
          icon: '🍳',
          description: 'Oatmeal, eggs, fruit',
          calories: '450 kcal',
        },
        {
          type: 'Lunch',
          icon: '🥗',
          description: 'Grilled chicken, quinoa, veggies',
          calories: '650 kcal',
        },
        {
          type: 'Dinner',
          icon: '🍽️',
          description: 'Fish, sweet potato, salad',
          calories: '600 kcal',
        },
      ],
    },
    recentActivity: [
      {
        id: 1,
        type: 'workout',
        title: 'Completed Workout',
        description: 'Strength Training - Upper Body',
        date: 'Nov 15, 2025 • 9:30 AM',
        completed: true,
      },
      {
        id: 2,
        type: 'weight',
        title: 'Weight Check-In',
        description: '78 kg (↓ 1 kg from last week)',
        date: 'Nov 13, 2025 • 7:00 AM',
        completed: false,
      },
      {
        id: 3,
        type: 'message',
        title: 'Sent Message',
        description: '"Can we adjust tomorrow\'s session time?"',
        date: 'Nov 12, 2025 • 6:45 PM',
        completed: false,
      },
    ],
    paymentHistory: [
      {
        id: 1,
        description: 'Monthly Subscription',
        date: '15 Oct 2024',
        amount: '₹150.00',
        status: 'Paid',
      },
      {
        id: 2,
        description: 'Monthly Subscription',
        date: '15 Sep 2024',
        amount: '₹150.00',
        status: 'Paid',
      },
      {
        id: 3,
        description: 'Monthly Subscription',
        date: '15 Aug 2024',
        amount: '₹150.00',
        status: 'Paid',
      },
    ],
    suggestions: [
      {
        id: 1,
        icon: Dumbbell,
        title: 'Protein Recommendations',
        color: 'bg-green-100 text-green-600',
      },
      { id: 2, icon: Activity, title: 'Workout Guidance', color: 'bg-blue-100 text-blue-600' },
      { id: 3, icon: Apple, title: 'Diet Plans', color: 'bg-red-100 text-red-600' },
    ],
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'workout':
        return (
          <div className="p-2 rounded-full bg-purple-100">
            <Dumbbell className="w-4 h-4 text-purple-600" />
          </div>
        );
      case 'weight':
        return (
          <div className="p-2 rounded-full bg-blue-100">
            <Scale className="w-4 h-4 text-blue-600" />
          </div>
        );
      case 'message':
        return (
          <div className="p-2 rounded-full bg-orange-100">
            <MessageCircle className="w-4 h-4 text-orange-600" />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <main className="min-h-screen bg-background pb-32">
      <PageContainer>
        {/* Header with gradient background */}
        <header className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-green-400/30 via-blue-400/20 to-purple-400/30 blur-3xl" />
          <div className="container mx-auto px-4 py-6 relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="mb-4 text-foreground hover:text-primary"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            {/* Profile Section */}
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-4">
                <Avatar
                  className="w-24 h-24 border-4 border-white/50 shadow-xl"
                  style={{
                    background: 'rgba(255,255,255,0.35)',
                    backdropFilter: 'blur(24px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                    border: '1.5px solid rgba(255,255,255,0.35)',
                    borderRadius: '50%',
                    overflow: 'hidden',
                  }}
                >
                  <AvatarImage src={client.avatar} />
                  <AvatarFallback>{client.name[0]}</AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-foreground">{client.name}</h1>
              <p className="text-muted-foreground">{client.program}</p>

              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Phone className="w-4 h-4" />
                  {client.phone}
                </span>
                <span className="flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  {client.email}
                </span>
              </div>

              <div className="flex gap-2 mt-4">
                <Badge className="bg-green-500 text-white">{client.status}</Badge>
                <Badge variant="outline">{client.week}</Badge>
                <Badge className="bg-purple-500 text-white">{client.plan}</Badge>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-6 space-y-6">
          {/* Progress Overview */}
          <section>
            <h2 className="text-lg font-bold text-foreground mb-4">Progress Overview</h2>
            <div className="grid grid-cols-4 gap-3">
              <Card className="glass-card">
                <CardContent className="p-3 text-center">
                  <p className="text-xs text-muted-foreground">Current Weight</p>
                  <p className="text-xl font-bold text-foreground">
                    {client.progress.currentWeight}
                  </p>
                  <p className="text-xs text-red-500">{client.progress.weightLoss}</p>
                </CardContent>
              </Card>
              <Card className="glass-card">
                <CardContent className="p-3 text-center">
                  <p className="text-xs text-muted-foreground">Target Weight</p>
                  <p className="text-xl font-bold text-foreground">
                    {client.progress.targetWeight}
                  </p>
                  <p className="text-xs text-muted-foreground">{client.progress.toGo}</p>
                </CardContent>
              </Card>
              <Card className="glass-card">
                <CardContent className="p-3 text-center">
                  <p className="text-xs text-muted-foreground">Sessions Done</p>
                  <p className="text-xl font-bold text-foreground">
                    {client.progress.sessionsDone}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {client.progress.sessionsProgress}
                  </p>
                </CardContent>
              </Card>
              <Card className="glass-card">
                <CardContent className="p-3 text-center">
                  <p className="text-xs text-muted-foreground">Attendance</p>
                  <p className="text-xl font-bold text-foreground">{client.progress.attendance}</p>
                  <p className="text-xs text-green-500">{client.progress.attendanceStatus}</p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Body Metrics */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground">Body Metrics</h2>
              <Button variant="ghost" size="sm" className="text-primary">
                View History
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <Card className="glass-card">
                <CardContent className="p-3 text-center">
                  <p className="text-xs text-muted-foreground">Body Fat</p>
                  <p className="text-xl font-bold text-primary">
                    {client.bodyMetrics.bodyFat.value}
                  </p>
                  <p className="text-xs text-red-500">{client.bodyMetrics.bodyFat.change}</p>
                </CardContent>
              </Card>
              <Card className="glass-card">
                <CardContent className="p-3 text-center">
                  <p className="text-xs text-muted-foreground">Muscle Mass</p>
                  <p className="text-xl font-bold text-primary">
                    {client.bodyMetrics.muscleMass.value}
                  </p>
                  <p className="text-xs text-blue-500">{client.bodyMetrics.muscleMass.change}</p>
                </CardContent>
              </Card>
              <Card className="glass-card">
                <CardContent className="p-3 text-center">
                  <p className="text-xs text-muted-foreground">BMI</p>
                  <p className="text-xl font-bold text-primary">{client.bodyMetrics.bmi.value}</p>
                  <p className="text-xs text-green-500">{client.bodyMetrics.bmi.status}</p>
                </CardContent>
              </Card>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Weight Progress</span>
                <span className="text-primary">{client.weightProgress}% to goal</span>
              </div>
              <Progress value={client.weightProgress} className="h-2" />
            </div>
          </section>

          {/* Diet Plan */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground">Diet Plan</h2>
              <Button variant="ghost" size="sm" className="text-primary">
                View Full Plan
              </Button>
            </div>
            <Card className="glass-card">
              <CardContent className="p-4 space-y-4">
                <div className="flex justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Daily Calorie Target</p>
                    <p className="text-2xl font-bold text-foreground">
                      {client.dietPlan.dailyCalories}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Macro Split</p>
                    <p className="text-sm font-medium text-foreground">
                      {client.dietPlan.macroSplit}
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  {client.dietPlan.meals.map((meal) => (
                    <div
                      key={meal.type}
                      className="flex items-center justify-between p-2 rounded-lg glass"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{meal.icon}</span>
                        <div>
                          <p className="font-medium text-foreground">{meal.type}</p>
                          <p className="text-xs text-muted-foreground">{meal.description}</p>
                        </div>
                      </div>
                      <span className="text-sm text-muted-foreground">{meal.calories}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Recent Activity */}
          <section>
            <h2 className="text-lg font-bold text-foreground mb-4">Recent Activity</h2>
            <div className="space-y-3">
              {client.recentActivity.map((activity) => (
                <Card key={activity.id} className="glass-card">
                  <CardContent className="p-4 flex items-start gap-3">
                    {getActivityIcon(activity.type)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-foreground">{activity.title}</p>
                        {activity.completed && <CheckCircle className="w-5 h-5 text-green-500" />}
                      </div>
                      <p className="text-sm text-muted-foreground">{activity.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">{activity.date}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Coach Notes */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground">Coach Notes</h2>
              <Button variant="ghost" size="sm" className="text-primary">
                Add Note
              </Button>
            </div>
          </section>

          {/* Subscription & Payment */}
          <section>
            <h2 className="text-lg font-bold text-foreground mb-4">Subscription & Payment</h2>
            <Card className="glass-card">
              <CardContent className="p-4 space-y-4">
                <h3 className="font-medium text-foreground">Payment History</h3>
                {client.paymentHistory.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">{payment.description}</p>
                      <p className="text-xs text-muted-foreground">{payment.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-foreground">{payment.amount}</p>
                      <p className="text-xs text-green-500">{payment.status}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>

          {/* Suggestions */}
          <section>
            <h2 className="text-lg font-bold text-foreground mb-4">Suggestions</h2>
            <div className="space-y-3">
              {client.suggestions.map((suggestion) => {
                const Icon = suggestion.icon;
                return (
                  <Card key={suggestion.id} className="glass-card hover-lift cursor-pointer">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${suggestion.color}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className="font-medium text-foreground">{suggestion.title}</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>

          {/* Action Buttons */}
          <section className="space-y-3">
            <Button className="w-full bg-primary text-primary-foreground">
              <MessageSquare className="w-4 h-4 mr-2" />
              Message Client
            </Button>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="border-primary text-primary">
                <Calendar className="w-4 h-4 mr-2" />
                Schedule Session
              </Button>
              <Button variant="outline" className="border-primary text-primary">
                <FileText className="w-4 h-4 mr-2" />
                View Reports
              </Button>
            </div>
            <Button variant="outline" className="w-full border-primary text-primary">
              <Utensils className="w-4 h-4 mr-2" />
              Update Diet
            </Button>
          </section>
        </div>
      </PageContainer>

      <Footer />
    </main>
  );
};

export default ClientDetail;
