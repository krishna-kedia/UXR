import React, { useState, useEffect } from 'react';
import { ArrowRight, Mic, FileText, Brain, Check, Mail, Phone } from 'lucide-react';

const LandingPage = () => {
  const [scrollPosition, setScrollPosition] = useState(0);
  const [selectedPricingTier, setSelectedPricingTier] = useState(1);
  const [demoStep, setDemoStep] = useState(0);
  const [selectedTab, setSelectedTab] = useState('form'); // For tab switching (form or calendly)

  useEffect(() => {
    const handleScroll = () => {
      setScrollPosition(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setDemoStep((prev) => (prev + 1) % 3);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const navigateToLogin = () => {
    window.location.href = '/login';
  };

  const pricingTiers = [
    {
      name: 'Starter',
      price: '$49',
      features: ['Up to 10 transcripts/month', 'Basic insights', 'Email support', '5GB storage', 'API access'],
      popular: false
    },
    {
      name: 'Pro',
      price: '$149',
      features: ['Up to 50 transcripts/month', 'Advanced insights', 'Priority support', '25GB storage', 'API access', 'Custom training'],
      popular: true
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      features: ['Unlimited transcripts', 'Custom AI models', 'Dedicated support', 'Unlimited storage', 'Advanced API access', 'Custom training', 'SLA guarantee'],
      popular: false
    }
  ];

  const demoSteps = [
    {
      title: "Record",
      description: "Live recording with automated note-taking",
      icon: <Mic className="w-12 h-12 text-purple-500" />
    },
    {
      title: "Transcribe",
      description: "AI-powered transcription in real-time",
      icon: <FileText className="w-12 h-12 text-purple-500" />
    },
    {
      title: "Analyze",
      description: "Generate insights instantly",
      icon: <Brain className="w-12 h-12 text-purple-500" />
    }
  ];

  const useCases = [
    {
      title: 'Product Development',
      description: 'Analyze user feedback across multiple interviews to identify key pain points and feature requests.',
      icon: <Brain className="w-12 h-12 text-purple-500" />
    },
    {
      title: 'User Experience Research',
      description: 'Track user sentiment and behavior patterns across different user segments and product versions.',
      icon: <FileText className="w-12 h-12 text-purple-500" />
    },
    {
      title: 'Customer Journey Mapping',
      description: 'Build comprehensive journey maps by analyzing multiple user interactions and touchpoints.',
      icon: <Mic className="w-12 h-12 text-purple-500" />
    }
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className={`fixed w-full z-50 transition-all duration-300 ${scrollPosition > 100 ? 'bg-white shadow-lg' : 'bg-transparent'}`}>
        <nav className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <img src="/logo.png" alt="Papyrus ML Logo" className="h-10" />
            <h1 className={`text-2xl font-bold ${scrollPosition > 100 ? 'text-purple-600' : 'text-white'}`}>Papyrus ML</h1>
          </div>
          <div className="space-x-4">
            <button onClick={navigateToLogin} className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-500">
              Sign Up / Login
            </button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative w-full h-screen bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center bg-cover bg-center overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center bg-[url('/api/placeholder/1920/1080')] opacity-50" />
        <div className="relative max-w-full mx-auto px-6 py-32 text-center text-white">
          <h2 className="text-5xl font-bold mb-6">Transform Your UX Research with AI</h2>
          <p className="text-xl mb-8">Record, transcribe, and discover insights across hundreds of user conversations - automatically.</p>
          <button onClick={navigateToLogin} className="bg-white text-purple-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 inline-flex items-center">
            Get Started <ArrowRight className="ml-2" />
          </button>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-32 bg-gray-50 w-full">
        <div className="max-w-full mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-16 text-gray-800">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {demoSteps.map((step, index) => (
              <div
                key={index}
                className="bg-white p-8 rounded-2xl shadow-lg transform hover:scale-105 transition-all duration-300"
              >
                <div className="mb-6">{step.icon}</div>
                <h3 className="text-2xl font-semibold mb-4 text-gray-800">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-32 w-full">
        <div className="max-w-full mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-16 text-gray-800">Use Cases</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {useCases.map((useCase, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-8 shadow-lg transform hover:-translate-y-2 transition-transform duration-300"
              >
                <div className="mb-6">{useCase.icon}</div>
                <h3 className="text-2xl font-semibold mb-4 text-gray-800">{useCase.title}</h3>
                <p className="text-gray-600">{useCase.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-32 bg-gray-50 w-full">
        <div className="max-w-full mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-16 text-gray-800">Pricing</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingTiers.map((tier, index) => (
              <div
                key={index}
                className={`relative rounded-2xl p-8 transition-all duration-300 ${
                  selectedPricingTier === index
                    ? 'bg-purple-50 shadow-2xl scale-105 border-2 border-purple-500'
                    : 'bg-white shadow-lg hover:shadow-xl'
                }`}
                onMouseEnter={() => setSelectedPricingTier(index)}
              >
                {tier.popular && (
                  <div className="absolute top-0 right-0 bg-purple-500 text-white px-4 py-1 rounded-bl-lg rounded-tr-lg">
                    Popular
                  </div>
                )}
                <h3 className="text-2xl font-semibold mb-2 text-gray-800">{tier.name}</h3>
                <p className="text-4xl font-bold mb-6 text-gray-800">
                  {tier.price}
                  <span className="text-sm font-normal">/month</span>
                </p>
                <ul className="space-y-4 mb-8">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="flex items-center text-gray-600">
                      <Check className="w-5 h-5 text-purple-600 mr-2" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tabs Section */}
<section className="py-10 bg-white w-full">
  <div className="max-w-[70%] mx-auto px-6">
    <div className="flex justify-center space-x-12 mb-8 items-center">
      <button
        className={`px-6 py-2 text-lg font-semibold border-2 rounded-lg transition-all duration-300 ${
          selectedTab === 'form'
            ? 'bg-purple-600 text-white border-purple-600'
            : 'bg-white text-purple-600 border-transparent hover:border-purple-600'
        }`}
        onClick={() => setSelectedTab('form')}
      >
        Contact Us
      </button>
      <button
        className={`px-6 py-2 text-lg font-semibold border-2 rounded-lg transition-all duration-300 ${
          selectedTab === 'calendly'
            ? 'bg-purple-600 text-white border-purple-600'
            : 'bg-white text-purple-600 border-transparent hover:border-purple-600'
        }`}
        onClick={() => setSelectedTab('calendly')}
      >
        Schedule a Meeting
      </button>
    </div>

    <div className="h-[800px] flex flex-col">
      {selectedTab === 'form' ? (
        <div className="bg-white p-8 rounded-lg shadow-lg flex items-center justify-center">
          {/* <h3 className="text-2xl font-semibold mb-4 text-gray-800">Contact Us</h3> */}
          <form>
            <input
              type="Full Name"
              placeholder="Your Name"
              className="w-full p-4 mb-4 border rounded-lg text-gray-800 bg-white"
            />
            <input
              type="Company"
              placeholder="Company Name"
              className="w-full p-4 mb-4 border rounded-lg text-gray-800 bg-white"
            />
            <input
              type="email"
              placeholder="Your email"
              className="w-full p-4 mb-4 border rounded-lg text-gray-800 bg-white"
            />
            <textarea
              placeholder="Your message"
              className="w-full p-4 mb-4 border rounded-lg text-gray-800 bg-white"
              // rows=10
            ></textarea>
            <button className="w-full bg-purple-600 text-white p-4 rounded-lg hover:bg-purple-500">
              Send Message
            </button>
          </form>
        </div>
      ) : (
        <div className="w-full bg-white shadow-lg rounded-lg p-4 flex-1">
          <iframe
            src="https://calendly.com/uxresearch0903/30min"
            className="w-full h-full border-none"
          ></iframe>
        </div>
      )}
    </div>
  </div>
</section>


      {/* Footer */}
      <footer className="bg-purple-600 py-8 w-full">
        <div className="max-w-full mx-auto px-6 text-center text-white">
          <p>&copy; 2025 Papyrus ML. All rights reserved.</p>
          <div className="space-x-6 mt-4">
            <a href="mailto:support@papyrus.ml" className="text-white">Email</a>
            <a href="tel:+1234567890" className="text-white">Phone</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
