import React, { useState } from "react";
import { FaChevronDown, FaChevronUp, FaDiscord } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";

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
      answer: "PrediWin.com is a prediction market platform that offers two main experiences. The first are Public Markets, which are weekly competitions where users make daily predictions on global events. These competitions run from Sunday to Friday, and the entry fee starts low at the beginning of the week and gradually increases. Players get eliminated daily for making a wrong prediction. They may choose to re-enter the tournament by paying a re-entry fee. The second are Private Markets, which allow you to create your own custom prediction topics. You can then invite friends to join by sharing a link."
    },
    {
      question: "What is the weekly schedule for Public Markets?",
      answer: "Sunday-Friday: Market entry and predictions are open. Entry fees increase daily from 0.01 USDC (Sunday) to 0.06 USDC (Friday). Saturday: Results day - markets are closed and winners are determined at midnight UTC with market distribution. Private Markets have no schedule - you control when they open and close."
    },
    {
      question: "What happens if I make a wrong prediction?",
      answer: "In Public Markets: If you predict incorrectly, you'll be eliminated but can re-enter by paying the current day's entry fee, the goal is to stay in the tournament until friday when the last prediction is made and the winners are determined on Saturday. In Private Markets: The market creator decides the final date, outcome and winners- you cannot re-enter a private market after the winners have been determined."
    },
    {
      question: "What are Private Markets and how do they work?",
      answer: "Private Markets are custom prediction markets you create on any topic - crypto prices, sports outcomes, world events, or fun questions with friends. As the creator, you set the entry fee, invite participants via a shareable link, and decide the winners. It's perfect for friend groups, teams, or communities who want their own prediction competitions."
    },
    {
      question: "How do I create and share a Private Market?",
      answer: "Go to 'Private Markets' in the navigation menu, set your market name and description, then deploy it for minimal gas fees (~$0.01-0.05 on Base). You'll receive a shareable URL that you can send to friends via text, social media, or email. Anyone with the link can join your market by paying the entry fee you set."
    },
    {
      question: "Who controls Private Markets?",
      answer: "As the market creator, you have full control. You set the entry amount, manage participants, decide when to close entries, determine the winning outcome, and distribute rewards to winners. The platform provides tools to see all participants and their predictions in a beautiful interface."
    },
    {
      question: "How do Private Market participants join?",
      answer: "Friends click your shared link, connect their wallet, pay the entry fee in USDC, and make their prediction. They can see all other participants (by wallet address or email if submitted), entry amounts, and prediction status. It's fully transparent so everyone can see who predicted what."
    },
    {
      question: "Why do I need Ethereum to place predictions?",
      answer: "You need ETH for gas fees on the Base network (usually ~$0.01-0.05 per transaction). This covers the blockchain transaction costs for entering markets, making predictions, and claiming winnings. You'll also need USDC to pay the actual market's entry fees."
    },
    
    {
      question: "How are entry fees calculated in Public Markets?",
      answer: "Public Markets follow a dynamic pricing model to encourage early participation: Sunday (0.01 USDC), Monday (0.02 USDC), Tuesday (0.03 USDC), Wednesday (0.04 USDC), Thursday (0.05 USDC), Friday (0.06 USDC). Saturday is closed for results. Private Markets let you set any entry fee you want."
    },
  
    {
      question: "How does the referral system work?",
      answer: "Each user gets a unique 8-character referral code. When 3 friends enter markets using your code and make confirmed USDC payments, you earn 1 free market entry. This system includes fraud protection to ensure legitimate referrals and works for both Public and Private Markets."
    },
    {
      question: "What types of events can I predict?",
      answer: "Public Markets cover cryptocurrency prices, stock movements, sports, and world events. Private Markets are unlimited - create markets on anything: 'Will it rain tomorrow?', 'Who wins the office fantasy league?', 'Will our friend get the job?', crypto prices, sports bets with friends, or any measurable outcome you can think of."
    },
    {
      question: "How do I make predictions?",
      answer: "After entering a market, you choose YES or NO for the outcome (or positive/negative for price movements). In Public Markets, you can make one prediction per day and update it before cutoff. In Private Markets, you typically make one prediction per market topic set by the creator."
    },
    {
      question: "When and how are winners determined?",
      answer: "Public Markets: Winners are determined every Saturday at midnight UTC based on actual event outcomes. Private Markets: The market creator decides when to close predictions, determines the actual outcome, and distributes rewards to winners through the smart contract."
    },
    {
      question: "How do I get my winnings?",
      answer: "Winnings are automatically distributed through smart contracts on the Base network. Once you're determined as a winner, the USDC is sent directly to your connected wallet - no manual claiming required. This works the same for both Public and Private Markets."
    },
    {
      question: "What's the difference between Public and Private Markets?",
      answer: "Public Markets: Weekly competitions, set schedule, automatic outcomes, compete with everyone. Private Markets: You create custom topics, set your own rules, invite specific friends, control timing and outcomes. Both use the same USDC payment system and smart contracts for security."
    },
    {
      question: "Can I participate without crypto experience?",
      answer: "Yes and no! The platform includes a comprehensive 5-step tutorial and a built-in buy page where you can easily purchase USDC and ETH using Coinbase OnChainKit. The interface is designed to be user-friendly for crypto beginners. We recommend users familiarize themselves with basic crypto concepts like wallets, gas fees, and USDC before participating."
    },
    {
      question: "What are Live Markets?",
      answer: "Live Markets are hourly prediction rounds that activate after entering a live pot. Once you pay the entry fee, you'll participate in structured hourly question sessions covering various topics. It's a time-based format designed for users who enjoy regular prediction challenges with scheduled results every hour."
    },
    {
      question: "Is this gambling?",
      answer: "PrediWin is a prediction market platform focused on forecasting skills rather than gambling. Users make informed predictions about real-world events using their knowledge and analysis, similar to platforms like Polymarket or Kalshi. Private Markets add a social element where friends compete on topics they care about."
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
            className="flex items-center space-x-2 px-4 py-2 bg-[#5865F2] text-white rounded-lg hover:bg-[#4752C4] transition-colors text-sm"
          >
            <FaDiscord size={16} />
            <span>Discord Support</span>
          </a>
          <a
            href="https://x.com/Prediwin"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-sm"
          >
            <FaXTwitter size={16} />
            <span>Follow on X</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default HowItWorksSection;
