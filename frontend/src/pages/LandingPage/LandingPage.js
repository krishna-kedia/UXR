import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// Import icons from your preferred icon library (you can use react-icons instead of lucide-react)
import { FaMicrophone, FaFileAlt, FaBrain, FaCheck, FaArrowRight, FaChartBar, FaComments, FaPuzzlePiece } from 'react-icons/fa';

const LandingPage = () => {
  const [scrollPosition, setScrollPosition] = useState(0);
  const [selectedPricingTier, setSelectedPricingTier] = useState(1);
  const [selectedTab, setSelectedTab] = useState('form');
  const [formStatus, setFormStatus] = useState('idle');
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScrollPosition(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navigateToLogin = () => {
    navigate('/login');
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
      title: "Organize",
      description: "Create projects to organize your user research sessions, transcripts, and insights in one place",
      icon: <FaFileAlt className="w-12 h-12 text-purple-500" />
    },
    {
      title: "Record & Upload",
      description: "Upload existing transcripts or invite our AI bot to any meeting - Zoom, Teams, or Google Meet",
      icon: <FaMicrophone className="w-12 h-12 text-purple-500" />
    },
    {
      title: "Analyze",
      description: "Get instant conversation summaries, key questions asked, and AI-powered insights",
      icon: <FaBrain className="w-12 h-12 text-purple-500" />
    },
    {
      title: "Aggregate",
      description: "Automatically combine insights across multiple conversations to identify patterns and trends",
      icon: <FaChartBar className="w-12 h-12 text-purple-500" />
    },
    {
      title: "Chat & Explore",
      description: "Chat with your research data to ideate and extract knowledge from projects and transcripts",
      icon: <FaComments className="w-12 h-12 text-purple-500" />
    },
    {
      title: "Coming Soon: Canvas",
      description: "Combine research, insights, and decision-making in our upcoming canvas playground",
      icon: <FaPuzzlePiece className="w-12 h-12 text-purple-500" />
    }
  ];

  const useCases = [
    {
      title: 'Product Development',
      description: 'Analyze user feedback across multiple interviews to identify key pain points and feature requests.',
      icon: <FaBrain className="w-12 h-12 text-purple-500" />
    },
    {
      title: 'User Experience Research',
      description: 'Track user sentiment and behavior patterns across different user segments and product versions.',
      icon: <FaFileAlt className="w-12 h-12 text-purple-500" />
    },
    {
      title: 'Customer Journey Mapping',
      description: 'Build comprehensive journey maps by analyzing multiple user interactions and touchpoints.',
      icon: <FaMicrophone className="w-12 h-12 text-purple-500" />
    }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormStatus('submitting');
    
    const formData = {
      name: e.target.name.value,
      company: e.target.company.value,
      email: e.target.email.value,
      message: e.target.message.value,
    };

    try {
      console.log('Submitting form data:', formData); // Debug log
      const response = await fetch('/api/contact', { // Update URL to match your backend
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setFormStatus('success');
        e.target.reset();
        setTimeout(() => setFormStatus('idle'), 5000); // Show success message for 5 seconds
      } else {
        setFormStatus('error');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setFormStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className={`fixed w-full z-50 transition-all duration-300 ${scrollPosition > 100 ? 'bg-white shadow-lg' : 'bg-transparent'}`}>
        <nav className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <img src="/logo.svg" alt="Papyrus ML Logo" className="h-12 w-12" />
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
      <section className="relative w-full h-screen bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
        <div className="max-w-4xl mx-auto px-6 text-center text-white">
          <h2 className="text-6xl font-bold mb-6">Your AI Research Co-Pilot</h2>
          <p className="text-2xl mb-4">Turn scattered research into actionable insights at scale.</p>
          <p className="text-xl mb-8 text-gray-200">
            Automatically transcribe meetings, analyze conversations, and uncover patterns across all your user research data.
          </p>
          <button 
            onClick={navigateToLogin} 
            className="bg-white text-purple-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 inline-flex items-center"
          >
            Get Started <FaArrowRight className="ml-2" />
          </button>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-32 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-4 text-gray-800">How It Works</h2>
          <p className="text-xl text-center mb-16 text-gray-600">A complete platform for your user research workflow</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
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
      <section className="py-32">
        <div className="max-w-6xl mx-auto px-6">
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
      <section className="py-32 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
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
                      <FaCheck className="w-5 h-5 text-purple-600 mr-2" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact and Calendar Section */}
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
                <form onSubmit={handleSubmit}>
                  <input
                    type="text"
                    placeholder="Your Name"
                    name="name"
                    className="w-full p-4 mb-4 border rounded-lg text-gray-800 bg-white"
                  />
                  <input
                    type="text"
                    placeholder="Company Name"
                    name="company"
                    className="w-full p-4 mb-4 border rounded-lg text-gray-800 bg-white"
                  />
                  <input
                    type="email"
                    placeholder="Your email"
                    name="email"
                    className="w-full p-4 mb-4 border rounded-lg text-gray-800 bg-white"
                  />
                  <textarea
                    placeholder="Your message"
                    name="message"
                    rows={10}
                    className="w-full p-4 mb-4 border rounded-lg text-gray-800 bg-white"
                  ></textarea>
                  <div className="relative">
                    <button 
                      type="submit" 
                      disabled={formStatus === 'submitting'}
                      className={`w-full p-4 rounded-lg transition-all duration-300 ${
                        formStatus === 'submitting' 
                          ? 'bg-gray-400 cursor-not-allowed' 
                          : 'bg-purple-600 hover:bg-purple-500'
                      } text-white font-semibold`}
                    >
                      {formStatus === 'submitting' ? 'Sending...' : 'Send Message'}
                    </button>
                    
                    {/* Feedback Messages */}
                    {formStatus === 'success' && (
                      <div className="mt-4 p-4 bg-green-100 text-green-700 rounded-lg">
                        <p className="font-semibold">Thank you for reaching out!</p>
                        <p>Your message has been saved. We'll get back to you soon.</p>
                      </div>
                    )}
                    
                    {formStatus === 'error' && (
                      <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-lg">
                        <p className="font-semibold">Something went wrong</p>
                        <p>Please try submitting your message again.</p>
                      </div>
                    )}
                  </div>
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
      <footer className="bg-purple-600 py-8">
        <div className="max-w-6xl mx-auto px-6 text-center text-white">
          <p>&copy; 2025 Papyrus ML. All rights reserved.</p>
          <div className="space-x-6 mt-4">
            <a href="mailto:support@papyrus.ml" className="text-white hover:text-gray-200">Email</a>
            <a href="tel:+1234567890" className="text-white hover:text-gray-200">Phone</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;