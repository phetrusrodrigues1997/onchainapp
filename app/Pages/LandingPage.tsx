import React, { useState, useEffect } from 'react';
import { TrendingUp, Brain, Shield, Users, ChevronRight, Play, Star, ArrowRight } from 'lucide-react';

interface LandingPageProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

const LandingPage =  ({ activeSection, setActiveSection }: LandingPageProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const features = [
    {
      icon: <Brain className="w-8 h-8" />,
      title: "AI-Powered Insights",
      description: "Advanced algorithms analyze market sentiment and historical data to provide intelligent predictions."
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Secure & Transparent",
      description: "Blockchain-backed security with complete transparency. Your funds are always protected."
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: "Real-Time Markets",
      description: "Live market data with instant execution. Trade on everything from crypto to politics."
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Community Driven",
      description: "Join thousands of traders sharing insights and strategies in our vibrant community."
    }
  ];

  const marketTabs = [
    { name: "Crypto", volume: "$2.4M", change: "+12.3%" },
    { name: "Politics", volume: "$1.8M", change: "+8.7%" },
    { name: "Sports", volume: "$3.1M", change: "+15.2%" },
    { name: "Finance", volume: "$4.2M", change: "+6.9%" }
  ];

  const testimonials = [
    {
      name: "Alex Chen",
      role: "Crypto Trader",
      content: "Made $15K in my first month. The insights are incredible.",
      rating: 5
    },
    {
      name: "Sarah Williams",
      role: "Political Analyst",
      content: "Most accurate prediction platform I've used. Highly recommend.",
      rating: 5
    },
    {
      name: "Marcus Johnson",
      role: "Day Trader",
      content: "The real-time data and execution speed is unmatched.",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800 text-white overflow-hidden">
      {/* Animated background elements */}
      {/* <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse delay-500"></div>
      </div> */}

      {/* Navigation */}
      {/* <nav className="relative z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Foresight
            </span>
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            <a href="#" className="text-gray-300 hover:text-white transition-colors">Markets</a>
            <a href="#" className="text-gray-300 hover:text-white transition-colors">Analytics</a>
            <a href="#" className="text-gray-300 hover:text-white transition-colors">Community</a>
            <a href="#" className="text-gray-300 hover:text-white transition-colors">About</a>
          </div>
          
          <div className="flex items-center space-x-4">
            <button className="text-gray-300 hover:text-white transition-colors">
              Sign In
            </button>
            <button className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 px-6 py-2 rounded-full font-semibold transition-all transform hover:scale-105">
              Get Started
            </button>
          </div>
        </div>
      </nav> */}

      {/* Hero Section */}
      <section className="relative z-10 px-6 pt-20 pb-32">
        <div className="max-w-7xl mx-auto">
          <div className={`text-center transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full mb-8 border border-white/20">
              <Star className="w-4 h-4 text-yellow-400 mr-2" />
              <span className="text-sm">Trusted by your trader next door</span>
            </div>
            
            <h1 className="text-6xl md:text-7xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent">
                Predict the Future,
              </span>
              <br />
              <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Earn the Rewards
              </span>
            </h1>
            
            <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              Join the most advanced prediction market platform. Trade on real-world events with 
              institutional-grade tools and earn rewards for your foresight.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-16">
              <button className="group bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 px-8 py-4 rounded-full font-bold text-lg transition-all transform hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/25 flex items-center">
                Start Trading Now
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </button>
              
              <button className="group flex items-center px-8 py-4 border-2 border-white/20 hover:border-white/40 rounded-full font-bold text-lg transition-all hover:bg-white/5 backdrop-blur-sm">
                <Play className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" />
                Watch Demo
              </button>
            </div>
            
            {/* Stats */}
            
          </div>
        </div>
      </section>

      {/* Live Markets Preview */}
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Live Markets</h2>
            <p className="text-xl text-gray-300">Real-time prediction markets across multiple categories</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 p-8">
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              {marketTabs.map((tab, index) => (
                <button
                  key={index}
                  onClick={() => setActiveTab(index)}
                  className={`px-6 py-3 rounded-full font-semibold transition-all ${
                    activeTab === index 
                      ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white' 
                      : 'bg-white/5 text-gray-300 hover:bg-white/10'
                  }`}
                >
                  {tab.name}
                  <span className="ml-2 text-sm opacity-80">
                    {tab.volume}
                  </span>
                </button>
              ))}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white/5 rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all hover:transform hover:scale-105">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-semibold text-lg">Bitcoin to reach $100K by 2025?</h3>
                    <span className="text-green-400 text-sm font-bold">+12.3%</span>
                  </div>
                  <div className="flex justify-between items-center mb-4">
                    <div className="text-3xl font-bold text-green-400">67%</div>
                    <div className="text-sm text-gray-400">
                      Volume: $2.4M
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button className="flex-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 py-2 rounded-lg font-semibold transition-colors">
                      Yes $0.67
                    </button>
                    <button className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 py-2 rounded-lg font-semibold transition-colors">
                      No $0.33
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Why Choose Foresight?</h2>
            <p className="text-xl text-gray-300">Advanced tools and features designed for serious traders</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-white/20 transition-all hover:transform hover:scale-105 group"
              >
                <div className="bg-gradient-to-r from-purple-500 to-blue-500 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-4">{feature.title}</h3>
                <p className="text-gray-300 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

     

      {/* CTA Section */}
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 backdrop-blur-lg rounded-3xl border border-white/20 p-12">
            <h2 className="text-5xl font-bold mb-6">
              Ready to Start Predicting?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Join thousands of traders earning rewards for their foresight
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <button className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 px-8 py-4 rounded-full font-bold text-lg transition-all transform hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/25 flex items-center">
                Create Account - It's Free
                <ChevronRight className="w-5 h-5 ml-2" />
              </button>
              <div className="text-sm text-gray-400">
                No credit card required • Start with $10 bonus
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-12 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Foresight
              </span>
            </div>
            
            <div className="flex items-center space-x-8 text-gray-400">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Support</a>
              <span>&copy; 2025 Foresight. All rights reserved.</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;