import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Briefcase,
  Bot,
  Shield,
  Users,
  Github,
  Zap,
  TrendingUp,
  Code,
  Sparkles,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
          <div className="text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-sm font-medium">
              <Sparkles className="h-4 w-4" />
              AI-Powered Personal Platform
            </div>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                NEXUS
              </span>
              <br />
              <span className="text-gray-900 dark:text-white">
                Your Skills, Amplified
              </span>
            </h1>
            
            <p className="max-w-2xl mx-auto text-xl text-gray-600 dark:text-gray-400">
              Turn skills into money, automation into freedom, and data into power.
              The ultimate platform for developers and tech professionals.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button variant="primary" size="lg" className="group">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button variant="outline" size="lg">
                View Demo
              </Button>
            </div>

            <div className="flex flex-wrap justify-center gap-8 pt-8">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Open Source
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                AI-Powered
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Free to Start
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
              Everything You Need to Succeed
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Four powerful modules designed to supercharge your freelance career
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Feature 1: Smart Portfolio */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-950 flex items-center justify-center mb-4">
                  <Briefcase className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle>Smart Portfolio</CardTitle>
                <CardDescription>A living website that works for you</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <Github className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Auto-sync projects from GitHub
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Track skill growth with analytics
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Sparkles className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      AI-generated custom resumes
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Code className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Live demo dashboard for recruiters
                    </span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Feature 2: AI Business Engine */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-purple-100 dark:bg-purple-950 flex items-center justify-center mb-4">
                  <Bot className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <CardTitle>AI Business Engine</CardTitle>
                <CardDescription>Automate your freelance business</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <Zap className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      AI creates Fiverr/Upwork gigs
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Sparkles className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Auto-generate client proposals
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Track payments and deadlines
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Bot className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      24/7 AI chatbot for clients
                    </span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Feature 3: Hack Lab */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-green-100 dark:bg-green-950 flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle>Hack Lab</CardTitle>
                <CardDescription>Legal & ethical security testing</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <Code className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      CTF-style challenges
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Shield className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Security testing playground
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Bug bounty tracker
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Zap className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Integrated security tools
                    </span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Feature 4: Social + Learning Hub */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-orange-100 dark:bg-orange-950 flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <CardTitle>Social + Learning Hub</CardTitle>
                <CardDescription>Build community and share knowledge</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <Code className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Tech blog for personal branding
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Sparkles className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Mini-course builder
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Users className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Community forum
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Bot className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      AI tutor trained on your projects
                    </span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Career?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of developers already using NEXUS to scale their freelance business
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="default" size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
              Start Free Trial
            </Button>
            <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
              View Documentation
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-white font-bold text-lg mb-4">NEXUS</h3>
              <p className="text-sm">
                AI-powered platform for developers and tech professionals.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li>Features</li>
                <li>Pricing</li>
                <li>Documentation</li>
                <li>Roadmap</li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li>Blog</li>
                <li>Tutorials</li>
                <li>Community</li>
                <li>Support</li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
                <li>License</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            <p>&copy; 2026 NEXUS. Built with ❤️ by developers, for developers.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
