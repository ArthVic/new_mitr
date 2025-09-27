import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { AuthModal } from "@/components/auth/AuthModal";
import { 
  MessageCircle, 
  Shield, 
  Zap, 
  ArrowRight,
  PlayCircle,
  CheckCircle,
  Star,
  Users,
  Clock,
  TrendingUp,
  Bot,
  Smartphone,
  Instagram,
  Chrome,
  BarChart3,
  Globe,
  HeadphonesIcon,
  Lightbulb,
  Target,
  Award,
  Briefcase,
  Coffee,
  ShoppingBag,
  Utensils,
  Stethoscope,
  GraduationCap,
  Home,
  ChevronRight,
  Phone,
  Mail,
  MapPin,
  IndianRupee
} from "lucide-react";

const Hero = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const features = [
    "Connect WhatsApp & Instagram instantly",
    "70-80% query automation",
    "Privacy-first architecture",
    "Smart human escalation"
  ];

  const detailedFeatures = [
    {
      icon: MessageCircle,
      title: "Multi-Channel Support",
      description: "Connect WhatsApp Business, Instagram DMs, website chat, and email in one dashboard.",
      benefits: ["Unified inbox", "Consistent responses", "No switching platforms"]
    },
    {
      icon: Bot,
      title: "Smart AI Assistant",
      description: "AI learns your business and handles 70-80% of repetitive queries automatically.",
      benefits: ["24/7 availability", "Instant responses", "Continuous learning"]
    },
    {
      icon: Shield,
      title: "Privacy-First Design",
      description: "Your data stays in India. Enterprise-grade security with full GDPR compliance.",
      benefits: ["Data sovereignty", "Encrypted storage", "Regular audits"]
    },
    {
      icon: TrendingUp,
      title: "Advanced Analytics",
      description: "Track performance, customer satisfaction, and AI accuracy with detailed insights.",
      benefits: ["Real-time metrics", "Custom reports", "ROI tracking"]
    },
    {
      icon: Clock,
      title: "Lightning Fast Setup",
      description: "Get started in minutes, not days. Connect your channels and go live instantly.",
      benefits: ["5-minute setup", "No technical skills", "Instant activation"]
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Seamless handoffs between AI and human agents with context preserved.",
      benefits: ["Smart escalation", "Context sharing", "Team efficiency"]
    }
  ];

  const howItWorks = [
    {
      step: "1",
      title: "Connect Your Channels",
      description: "Link your WhatsApp Business, Instagram, and website in under 5 minutes.",
      icon: Smartphone
    },
    {
      step: "2", 
      title: "Train Your AI",
      description: "Our AI learns your business FAQs, products, and brand voice automatically.",
      icon: Bot
    },
    {
      step: "3",
      title: "Go Live",
      description: "Start handling customer queries 24/7 with intelligent AI assistance.",
      icon: Zap
    },
    {
      step: "4",
      title: "Monitor & Improve",
      description: "Track performance, review conversations, and continuously optimize results.",
      icon: BarChart3
    }
  ];

  const useCases = [
    {
      icon: Utensils,
      title: "Restaurants",
      description: "Handle reservations, menu inquiries, delivery status, and special requests.",
      example: "\"What are today's specials?\" → AI responds with updated menu and prices"
    },
    {
      icon: ShoppingBag,
      title: "E-commerce",
      description: "Manage product inquiries, order status, returns, and size recommendations.",
      example: "\"Do you have this in blue?\" → AI checks inventory and suggests alternatives"
    },
    {
      icon: Coffee,
      title: "Cafes & Bakeries",
      description: "Take orders, share daily specials, handle catering requests, and more.",
      example: "\"Can I customize my birthday cake?\" → AI provides options and connects to baker"
    },
    {
      icon: Briefcase,
      title: "Professional Services",
      description: "Schedule appointments, answer service questions, and qualify leads.",
      example: "\"How much does a legal consultation cost?\" → AI provides pricing and books appointment"
    },
    {
      icon: Home,
      title: "Real Estate",
      description: "Property inquiries, viewing schedules, area information, and documentation.",
      example: "\"Is parking available?\" → AI provides property details and schedules viewing"
    },
    {
      icon: Stethoscope,
      title: "Healthcare",
      description: "Appointment booking, basic health queries, and prescription reminders.",
      example: "\"What are your clinic hours?\" → AI provides schedule and books appointment"
    }
  ];

  const testimonials = [
    {
      name: "Rajesh Kumar",
      role: "Restaurant Owner",
      company: "Spice Garden Mumbai",
      content: "Mitr handles 80% of our booking queries automatically. Our staff can focus on cooking instead of answering phones all day. Revenue increased by 25% in just 2 months!",
      rating: 5,
      savings: "₹15,000/month saved on staff costs",
      image: "RK"
    },
    {
      name: "Priya Sharma", 
      role: "E-commerce Manager",
      company: "Fashion Forward",
      content: "Customer satisfaction scores improved from 3.2 to 4.7 after implementing Mitr. The AI understands our products better than most human agents!",
      rating: 5,
      savings: "70% reduction in response time",
      image: "PS"
    },
    {
      name: "Amit Patel",
      role: "Cafe Owner",
      company: "Brew & Beans",
      content: "Best investment for our business. ROI was evident within the first month. Now we handle 3x more orders without additional staff.",
      rating: 5,
      savings: "300% increase in order capacity",
      image: "AP"
    }
  ];

  const stats = [
    { number: "500+", label: "Happy Businesses", icon: Users },
    { number: "2M+", label: "Queries Handled", icon: MessageCircle },
    { number: "78%", label: "Average Automation", icon: Bot },
    { number: "1.2s", label: "Response Time", icon: Clock }
  ];

  const integrations = [
    { name: "WhatsApp Business", icon: Smartphone, status: "Available" },
    { name: "Instagram Business", icon: Instagram, status: "Available" },
    { name: "Website Widget", icon: Chrome, status: "Available" },
    { name: "Facebook Messenger", icon: MessageCircle, status: "Coming Soon" },
    { name: "Telegram", icon: MessageCircle, status: "Coming Soon" },
    { name: "Custom API", icon: Globe, status: "Available" }
  ];

  const faqs = [
    {
      question: "How quickly can I set up Mitr?",
      answer: "Most businesses are up and running in under 10 minutes. Simply connect your WhatsApp Business account, add some basic business information, and you're ready to go!"
    },
    {
      question: "Will the AI understand my specific business?",
      answer: "Yes! Mitr's AI learns from your existing conversations, website content, and FAQs. It understands your products, services, pricing, and brand voice within hours of setup."
    },
    {
      question: "What happens when AI can't answer a query?",
      answer: "Mitr intelligently escalates complex queries to your team with full context. You'll get a notification and can take over the conversation seamlessly."
    },
    {
      question: "Is my customer data secure?",
      answer: "Absolutely. All data is encrypted and stored in India. We're GDPR compliant and undergo regular security audits. Your data never leaves the country."
    },
    {
      question: "Can I customize the AI responses?",
      answer: "Yes! You can train the AI with your preferred responses, set your brand tone, and create custom templates for different types of queries."
    },
    {
      question: "Do you offer support during setup?",
      answer: "Yes! We provide free onboarding support to help you get the most out of Mitr. Our team is available via chat, email, and phone."
    }
  ];


  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="min-h-screen bg-background flex items-center relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Content */}
            <div className="text-center lg:text-left animate-fade-in">
              {/* Badge */}
              <Badge variant="secondary" className="mb-6 bg-primary-light text-primary border-primary/20">
                <Zap className="w-3 h-3 mr-1" />
                AI-Powered Customer Support
              </Badge>

              {/* Headline */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                Support made{" "}
                <span className="mitr-gradient-text">simple</span>{" "}
                for small businesses
              </h1>

              {/* Subheadline */}
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
                Connect WhatsApp, Instagram, and your website. Let Mitr's AI handle 70-80% of repetitive queries instantly, while keeping your data private and secure.
              </p>

              {/* Feature List */}
              <div className="grid sm:grid-cols-2 gap-3 mb-8">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-2 text-left">
                    <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                    <span className="text-foreground font-medium">{feature}</span>
                  </div>
                ))}
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <Button size="lg" className="mitr-glow group hover-scale" onClick={() => setShowAuthModal(true)}>
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button variant="outline" size="lg" className="group hover-scale">
                  <PlayCircle className="mr-2 h-4 w-4" />
                  Watch Demo
                </Button>
              </div>
              {/* Auth Modal */}
              <AuthModal
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
                defaultMode="signup" 
                />

              {/* Social Proof */}
              <div className="flex flex-col sm:flex-row items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <div className="flex space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                    ))}
                  </div>
                  <span className="font-medium">4.9/5 rating</span>
                </div>
                <div className="hidden sm:block w-px h-4 bg-border" />
                <span>Trusted by 500+ small businesses</span>
              </div>
            </div>

            {/* Right Column - Visual */}
            <div className="relative animate-scale-in">
              {/* Mock Dashboard Preview */}
              <div className="bg-card rounded-2xl shadow-mitr-xl border border-border overflow-hidden mitr-card-hover">
                {/* Header */}
                <div className="bg-primary p-4 text-primary-foreground">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <MessageCircle className="h-5 w-5" />
                      <span className="font-semibold">Mitr Dashboard</span>
                    </div>
                    <Badge variant="secondary" className="bg-primary-light text-primary">
                      Live
                    </Badge>
                  </div>
                </div>

                {/* Stats Cards */}
                <div className="p-6 grid grid-cols-2 gap-4">
                  <div className="bg-success-light p-4 rounded-lg">
                    <div className="text-2xl font-bold text-success">847</div>
                    <div className="text-sm text-muted-foreground">Queries Handled</div>
                  </div>
                  <div className="bg-accent-light p-4 rounded-lg">
                    <div className="text-2xl font-bold text-accent-foreground">78%</div>
                    <div className="text-sm text-muted-foreground">AI Resolution</div>
                  </div>
                </div>

                {/* Chat Preview */}
                <div className="px-6 pb-6">
                  <div className="bg-muted rounded-lg p-4 space-y-3">
                    <div className="flex items-start space-x-2">
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                        <MessageCircle className="h-4 w-4 text-primary-foreground" />
                      </div>
                      <div className="bg-primary text-primary-foreground px-3 py-2 rounded-lg text-sm">
                        Hi! What are your store timings?
                      </div>
                    </div>
                    <div className="flex items-start space-x-2 justify-end">
                      <div className="bg-card border px-3 py-2 rounded-lg text-sm max-w-xs">
                        We're open 9 AM - 9 PM, Monday to Saturday. Closed on Sundays. Is there anything specific you'd like to know?
                      </div>
                      <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center">
                        <Shield className="h-4 w-4 text-accent-foreground" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 bg-accent text-accent-foreground px-3 py-1 rounded-full text-sm font-medium shadow-mitr-lg animate-pulse">
                AI Powered
              </div>
              <div className="absolute -bottom-4 -left-4 bg-success text-success-foreground px-3 py-1 rounded-full text-sm font-medium shadow-mitr-lg animate-pulse delay-500">
                Privacy First
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-card/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="text-center animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="h-8 w-8 text-primary" />
                  </div>
                  <div className="text-3xl font-bold text-foreground mb-2">{stat.number}</div>
                  <div className="text-muted-foreground">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Detailed Features Section */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4 bg-primary-light text-primary border-primary/20">
              <Lightbulb className="w-3 h-3 mr-1" />
              Powerful Features
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Everything you need to <span className="mitr-gradient-text">excel</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Mitr combines cutting-edge AI with practical business tools to transform your customer support
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {detailedFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="mitr-card-hover animate-scale-in" style={{ animationDelay: `${index * 0.1}s` }}>
                  <CardHeader>
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {feature.benefits.map((benefit, benefitIndex) => (
                        <li key={benefitIndex} className="flex items-center space-x-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-success flex-shrink-0" />
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-card/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4 bg-primary-light text-primary border-primary/20">
              <Target className="w-3 h-3 mr-1" />
              Simple Process
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Get started in <span className="mitr-gradient-text">4 easy steps</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              From setup to going live, Mitr makes it incredibly simple to transform your customer support
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorks.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={index} className="text-center relative animate-fade-in" style={{ animationDelay: `${index * 0.2}s` }}>
                  <div className="relative mb-6">
                    <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto shadow-mitr-lg">
                      <Icon className="h-10 w-10 text-primary-foreground" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-accent rounded-full flex items-center justify-center text-sm font-bold text-accent-foreground">
                      {step.step}
                    </div>
                    {index < howItWorks.length - 1 && (
                      <div className="hidden lg:block absolute top-10 left-full w-full h-0.5 bg-border -translate-x-1/2">
                        <ChevronRight className="absolute top-1/2 right-4 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4 bg-primary-light text-primary border-primary/20">
              <Briefcase className="w-3 h-3 mr-1" />
              Industry Solutions
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Perfect for <span className="mitr-gradient-text">every business</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              See how businesses like yours are using Mitr to provide better customer support
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {useCases.map((useCase, index) => {
              const Icon = useCase.icon;
              return (
                <Card key={index} className="mitr-card-hover animate-scale-in" style={{ animationDelay: `${index * 0.1}s` }}>
                  <CardHeader>
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{useCase.title}</CardTitle>
                    <CardDescription>{useCase.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-2">Example:</p>
                      <p className="text-sm font-medium">{useCase.example}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Integrations Section */}
      <section className="py-20 bg-card/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4 bg-primary-light text-primary border-primary/20">
              <Globe className="w-3 h-3 mr-1" />
              Integrations
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Connect <span className="mitr-gradient-text">everywhere</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Integrate with all your existing platforms and reach customers wherever they are
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {integrations.map((integration, index) => {
              const Icon = integration.icon;
              return (
                <div key={index} className="flex items-center justify-between p-6 bg-card border border-border rounded-xl hover:bg-card-hover transition-colors mitr-card-hover">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{integration.name}</h3>
                      <p className="text-sm text-muted-foreground">{integration.status}</p>
                    </div>
                  </div>
                  <Badge variant={integration.status === "Available" ? "default" : "secondary"}>
                    {integration.status === "Available" ? <CheckCircle className="w-3 h-3 mr-1" /> : <Clock className="w-3 h-3 mr-1" />}
                    {integration.status}
                  </Badge>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Enhanced Testimonials */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4 bg-primary-light text-primary border-primary/20">
              <Award className="w-3 h-3 mr-1" />
              Success Stories
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Loved by <span className="mitr-gradient-text">businesses</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Real stories from real businesses who transformed their customer support with Mitr
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="mitr-card-hover animate-scale-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <CardContent className="p-8">
                  <div className="flex items-center space-x-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                    ))}
                  </div>
                  <p className="text-foreground mb-6 text-lg leading-relaxed">"{testimonial.content}"</p>
                  
                  <div className="bg-success-light p-4 rounded-lg mb-6">
                    <div className="flex items-center space-x-2">
                      <IndianRupee className="h-4 w-4 text-success" />
                      <span className="font-semibold text-success">{testimonial.savings}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-sm font-bold">
                      {testimonial.image}
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.company}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-card/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4 bg-primary-light text-primary border-primary/20">
              <HeadphonesIcon className="w-3 h-3 mr-1" />
              Support
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Frequently asked <span className="mitr-gradient-text">questions</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Everything you need to know about Mitr
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {faqs.map((faq, index) => (
              <Card key={index} className="mitr-card-hover animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-foreground mb-3 text-lg">
                    {faq.question}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-gradient-card rounded-2xl p-12 shadow-mitr-xl">
            <Badge variant="secondary" className="mb-6 bg-primary-light text-primary border-primary/20">
              <Zap className="w-3 h-3 mr-1" />
              Ready to Get Started?
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              Transform your customer support <span className="mitr-gradient-text">today</span>
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join 500+ small businesses already using Mitr to provide better customer support 
              while saving time and money. Start your free trial now!
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button size="lg" className="mitr-glow hover-scale" onClick={() => setShowAuthModal(true)} >
                <Zap className="mr-2 h-5 w-5" />
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button variant="outline" size="lg" className="hover-scale">
                <Phone className="mr-2 h-4 w-4" />
                Schedule Demo
              </Button>
            </div>
            {/* Auth Modal */}
            <AuthModal
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
                defaultMode="signup" 
                />

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-success" />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-success" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-success" />
                <span>Setup in 5 minutes</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Hero;