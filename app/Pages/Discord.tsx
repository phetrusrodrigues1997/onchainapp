import React, { useState } from "react";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";

interface FAQItem {
  question: string;
  answer: string;
}

const HowItWorksSection: React.FC = () => {
  const [openItems, setOpenItems] = useState<Set<number>>(new Set());

  const toggleItem = (index: number) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(index)) {
      newOpenItems.delete(index);
    } else {
      newOpenItems.add(index);
    }
    setOpenItems(newOpenItems);
  };

  const faqItems: FAQItem[] = [
    {
      question: "How does PrediWin work?",
      answer: "PrediWin.com is a prediction market platform where users compete to predict various world events and outcomes. Every week, users enter prediction markets beginning on Sundays, make predictions about tomorrow's global events everyday of the week, and winners split the reward equally on Saturday."
    },
    {
      question: "Why do I need Ethereum to place predictions?",
      answer: "You need ETH for gas fees on the Base network (usually ~$0.01-0.05 per transaction). This covers the blockchain transaction costs for entering markets, making predictions, and claiming winnings. You'll also need USDC to pay the actual market's entry fees."
    },
    {
      question: "What is the weekly schedule?",
      answer: "Sunday-Friday: Market entry and predictions are open. Entry fees increase daily from 0.01 USDC (Sunday) to 0.06 USDC (Friday). Saturday: Results day - markets are closed and winners are determined at midnight UTC with market distribution."
    },
    {
      question: "How are entry fees calculated?",
      answer: "Entry fees follow a dynamic pricing model to encourage early participation: Sunday (0.01 USDC), Monday (0.02 USDC), Tuesday (0.03 USDC), Wednesday (0.04 USDC), Thursday (0.05 USDC), Friday (0.06 USDC). Saturday is closed for results."
    },
    {
      question: "What happens if I make a wrong prediction?",
      answer: "If you predict incorrectly, you'll be blocked from future prediction rounds. However, you can re-enter by paying the current day's entry fee. This gives you another chance to participate in the markets."
    },
    {
      question: "How does the referral system work?",
      answer: "Each user gets a unique 8-character referral code. When 3 friends enter markets using your code and make confirmed USDC payments, you earn 1 free market entry. This system includes fraud protection to ensure legitimate referrals."
    },
    {
      question: "What types of events can I predict?",
      answer: "The platform supports predictions on various world events including cryptocurrency price movements, stock market outcomes, sports events, political developments, and other measurable real-world occurrences. New event categories are regularly added based on user interest."
    },
    {
      question: "How do I make predictions?",
      answer: "After entering a market, you can make predictions about specific event outcomes (such as whether a price will go up/down, a team will win/lose, or an event will occur). You can make one prediction per event per day and update it before the cutoff time."
    },
    {
      question: "When are winners determined?",
      answer: "Winners are determined every Saturday at midnight UTC based on actual event outcomes. If the event result matches what you predicted, you're a winner and share the reward equally with other correct predictors."
    },
    {
      question: "How do I get my winnings?",
      answer: "Winnings are automatically distributed through smart contracts on the Base network. Once you're determined as a winner, the USDC is sent directly to your connected wallet - no manual claiming required."
    },
    {
      question: "Can I participate without crypto experience?",
      answer: "Yes and no! The platform includes a comprehensive 5-step tutorial and a built-in buy page where you can easily purchase USDC and ETH using Coinbase OnChainKit. The interface is designed to be user-friendly for crypto beginners. We recommend users familiarize themselves with basic crypto concepts like wallets, gas fees, and USDC before participating."
    },
    {
      question: "Is this gambling?",
      answer: "PrediWin is a prediction market platform focused on forecasting skills rather than gambling. Users make informed predictions about real-world events using their knowledge and analysis, similar to platforms like Polymarket or Kalshi."
    }
  ];

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md border border-gray-300">
      <h2 className="text-2xl font-bold text-black text-center mb-8">
        How PrediWin Works - Frequently Asked Questions
      </h2>
      
      <div className="space-y-4">
        {faqItems.map((item, index) => (
          <div key={index} className="border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleItem(index)}
              className="w-full px-6 py-4 text-left bg-gray-50 hover:bg-gray-100 transition-colors duration-200 flex justify-between items-center"
            >
              <span className="text-black font-semibold pr-4">{item.question}</span>
              {openItems.has(index) ? (
                <FaChevronUp className="text-gray-600 flex-shrink-0" />
              ) : (
                <FaChevronDown className="text-gray-600 flex-shrink-0" />
              )}
            </button>
            
            {openItems.has(index) && (
              <div className="px-6 py-4 bg-white border-t border-gray-300">
                <p className="text-gray-800 leading-relaxed">{item.answer}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 text-center">
        <p className="text-gray-600 text-sm mb-4">
          Still have questions? Join our community for more support.
        </p>
        <div className="flex justify-center space-x-4">
          <a
            href="https://discord.gg/8H9Hxc4Y"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            Discord Support
          </a>
          <a
            href="https://x.com/Prediwin"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
          >
            Follow on X
          </a>
        </div>
      </div>
    </div>
  );
};

export default HowItWorksSection;
