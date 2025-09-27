import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import axios from "axios";
import { 
  Check, 
  MessageCircle, 
  Users, 
  BarChart3, 
  Shield,
  Sparkles,
  Star,
  ArrowRight,
  Zap
} from "lucide-react";
import { useEffect } from "react";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const Pricing = () => {
  useEffect(() => {
    if (!document.querySelector("#razorpay-sdk")) {
      const script = document.createElement("script");
      script.id = "razorpay-sdk";
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => console.log("Razorpay script loaded");
      document.body.appendChild(script);
    }
  }, []);
  const handleCheckout = async (planName: string) => {
    try {
      const token = localStorage.getItem("auth_token");
      const res = await axios.post("http://localhost:3000/api/checkout/create-order", {
        amount: planName === "Starter" ? 49900 : planName === "Growth" ? 149900 : 299900, // in paise
        planName, // send which plan was selected
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
      const { amount, id: order_id, currency, key } = res.data;


      const options = {
        key: key, // from backend (or process.env.VITE_RAZORPAY_KEY_ID)
        amount: amount.toString(),
        currency: currency,
        name: "Mitr",
        description: `${planName} Subscription`,
        order_id: order_id,
        handler: async function (response: any) {
          // 3. Verify payment on backend
          const verifyRes = await axios.post("http://localhost:3000/api/checkout/verify-payment", {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            plan: planName,
          });

          if (verifyRes.data.success) {
            alert("Payment Successful 🎉");
            // redirect or update UI
          } else {
            alert("Payment verification failed ❌");
          }
        },
        prefill: {
          name: "Your Customer",
          email: "customer@example.com",
          contact: "9999999999",
        },
        theme: {
          color: "#4F46E5",
        },
      };

      const rzp1 = new window.Razorpay(options);
      rzp1.open();
    }catch (err) {
      console.error("Checkout error:", err);
      if (err.response) {
        console.error("Error data:", err.response.data);
        console.error("Error status:", err.response.status);
        console.error("Error headers:", err.response.headers.toJSON());
      } else if (err.request) {
        console.error("Error request:", err.request);
      } else {
        console.error("Error message:", err.message);
      }
      //console.error("Error config:", err.config);
    }
  };

  const plans = [
      {
        name: "Starter",
        price: "₹499",
        period: "/month",
        description: "Perfect for small businesses getting started",
        popular: false,
        features: [
          "Up to 500 queries/month",
          "WhatsApp integration",
          "Basic AI responses",
          "Email support",
          "Dashboard analytics",
          "Data retention: 30 days"
        ],
        limitations: [
          "Single channel only",
          "Basic templates",
          "No custom integrations"
        ]
      },
      {
        name: "Growth",
        price: "₹1,499",
        period: "/month",
        description: "Best for growing businesses with multiple channels",
        popular: true,
        features: [
          "Up to 2,500 queries/month",
          "WhatsApp + Instagram + Website",
          "Advanced AI with learning",
          "Priority support",
          "Advanced analytics",
          "Custom response templates",
          "Human escalation",
          "Data retention: 90 days",
          "API access"
        ],
        limitations: []
      },
      {
        name: "Pro",
        price: "₹2,999",
        period: "/month",
        description: "For established businesses needing enterprise features",
        popular: false,
        features: [
          "Unlimited queries",
          "All channels + custom integrations",
          "AI with brand personality",
          "24/7 phone support",
          "Advanced analytics + reporting",
          "Custom AI training",
          "Multi-agent support",
          "Data retention: 1 year",
          "White-label option",
          "Dedicated account manager"
        ],
        limitations: []
      }
    ];


    const testimonials = [
      {
        name: "Rajesh Kumar",
        role: "Restaurant Owner",
        company: "Spice Garden",
        content: "Mitr reduced our support workload by 70%. The WhatsApp integration is seamless!",
        rating: 5
      },
      {
        name: "Priya Sharma",
        role: "E-commerce Manager",
        company: "Fashion Forward",
        content: "Customer satisfaction increased after implementing Mitr. The AI is surprisingly good!",
        rating: 5
      },
      {
        name: "Amit Patel",
        role: "Business Owner",
        company: "Tech Solutions",
        content: "Best investment for our customer support. ROI was evident within the first month.",
        rating: 5
      }
    ];

    const faqs = [
      {
        question: "Can I change plans anytime?",
        answer: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately."
      },
      {
        question: "What happens if I exceed my query limit?",
        answer: "We'll notify you when you reach 80% of your limit. You can upgrade or purchase additional queries."
      },
      {
        question: "Is my data secure?",
        answer: "Absolutely. We use enterprise-grade encryption and follow strict privacy policies. Your data never leaves India."
      },
      {
        question: "Do you offer custom integrations?",
        answer: "Yes, our Pro plan includes custom integrations. We can connect with your existing CRM, e-commerce platform, or any API."
      }
    ];

    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-background py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <Badge variant="secondary" className="mb-6 bg-primary-light text-primary border-primary/20">
              <Sparkles className="w-3 h-3 mr-1" />
              Transparent Pricing
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Choose Your <span className="mitr-gradient-text">Growth</span> Plan
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Start free, scale as you grow. All plans include our privacy-first architecture
              and 24/7 AI support. No hidden fees, cancel anytime.
            </p>
            <div className="flex items-center justify-center space-x-6 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-success" />
                <span>Privacy First</span>
              </div>
              <div className="flex items-center space-x-2">
                <Zap className="h-4 w-4 text-accent" />
                <span>Instant Setup</span>
              </div>
              <div className="flex items-center space-x-2">
                <Star className="h-4 w-4 text-accent" />
                <span>4.9/5 Rating</span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-8 mb-20">
            {plans.map((plan, index) => (
              <Card
                key={index}
                className={`relative mitr-card-hover ${plan.popular
                    ? 'border-primary shadow-mitr-lg scale-105'
                    : 'border-border'
                  }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-accent text-accent-foreground px-4 py-1">
                      <Star className="w-3 h-3 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-8">
                  <CardTitle className="text-2xl font-bold text-foreground mb-2">
                    {plan.name}
                  </CardTitle>
                  <CardDescription className="text-muted-foreground mb-4">
                    {plan.description}
                  </CardDescription>
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-bold text-foreground">
                      {plan.price}
                    </span>
                    <span className="text-muted-foreground ml-1">
                      {plan.period}
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Features */}
                  <div className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-start space-x-3">
                        <Check className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA Button */}
                  <Button
                    onClick={() => handleCheckout(plan.name)}
                    className={`w-full ${plan.popular
                        ? 'mitr-glow'
                        : ''
                      }`}
                    variant={plan.popular ? "default" : "outline"}
                    size="lg"
                  >
                    {plan.name === "Starter" ? "Start Free Trial" : "Choose Plan"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>

                  <p className="text-xs text-muted-foreground text-center">
                    14-day free trial • No credit card required
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Feature Comparison */}
          <div className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Compare Features
              </h2>
              <p className="text-muted-foreground">
                See what's included in each plan
              </p>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left p-4 font-semibold text-foreground">Feature</th>
                        <th className="text-center p-4 font-semibold text-foreground">Starter</th>
                        <th className="text-center p-4 font-semibold text-foreground">Growth</th>
                        <th className="text-center p-4 font-semibold text-foreground">Pro</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      <tr>
                        <td className="p-4 text-foreground">Monthly Queries</td>
                        <td className="p-4 text-center text-muted-foreground">500</td>
                        <td className="p-4 text-center text-muted-foreground">2,500</td>
                        <td className="p-4 text-center text-muted-foreground">Unlimited</td>
                      </tr>
                      <tr>
                        <td className="p-4 text-foreground">Channels</td>
                        <td className="p-4 text-center text-muted-foreground">WhatsApp</td>
                        <td className="p-4 text-center text-muted-foreground">WhatsApp, Instagram, Website</td>
                        <td className="p-4 text-center text-muted-foreground">All + Custom</td>
                      </tr>
                      <tr>
                        <td className="p-4 text-foreground">AI Training</td>
                        <td className="p-4 text-center"><Check className="h-4 w-4 text-success mx-auto" /></td>
                        <td className="p-4 text-center"><Check className="h-4 w-4 text-success mx-auto" /></td>
                        <td className="p-4 text-center"><Check className="h-4 w-4 text-success mx-auto" /></td>
                      </tr>
                      <tr>
                        <td className="p-4 text-foreground">Analytics</td>
                        <td className="p-4 text-center">Basic</td>
                        <td className="p-4 text-center">Advanced</td>
                        <td className="p-4 text-center">Advanced + Reports</td>
                      </tr>
                      <tr>
                        <td className="p-4 text-foreground">Support</td>
                        <td className="p-4 text-center text-muted-foreground">Email</td>
                        <td className="p-4 text-center text-muted-foreground">Priority</td>
                        <td className="p-4 text-center text-muted-foreground">24/7 Phone</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Testimonials */}
          <div className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Loved by Businesses
              </h2>
              <p className="text-muted-foreground">
                See what our customers say about Mitr
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <Card key={index} className="mitr-card-hover">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-1 mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                      ))}
                    </div>
                    <p className="text-foreground mb-4">"{testimonial.content}"</p>
                    <div>
                      <div className="font-semibold text-foreground">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {testimonial.role}, {testimonial.company}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* FAQ */}
          <div>
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Frequently Asked Questions
              </h2>
              <p className="text-muted-foreground">
                Everything you need to know about Mitr
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {faqs.map((faq, index) => (
                <Card key={index} className="mitr-card-hover">
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-foreground mb-3">
                      {faq.question}
                    </h3>
                    <p className="text-muted-foreground">
                      {faq.answer}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* CTA Section */}
          <div className="mt-20 text-center bg-gradient-card rounded-2xl p-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Ready to Transform Your Customer Support?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join 500+ small businesses already using Mitr to provide better customer support
              while saving time and money.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="mitr-glow" onClick={() => handleCheckout("Starter")}>
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button variant="outline" size="lg">
                Schedule Demo
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  export default Pricing;