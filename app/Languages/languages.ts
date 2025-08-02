export type Language = 'en' | 'pt-BR';

export interface Translations {
  // Hero Section
  heroTitle: string;
  heroSubtitle: string;
  
  // Markets Section
  marketsTitle: string;
  currentPrice: string;
  players: string;
  potSize: string;
  higher: string;
  lower: string;
  comingSoon: string;
  
  // Market Questions
  bitcoinQuestion: string;
  ethereumQuestion: string;
  solanaQuestion: string;
  teslaQuestion: string;
  nvidiaQuestion: string;
  sp500Question: string;
  
  // How It Works Section
  howItWorksTitle: string;
  howItWorksSubtitle: string;
  step1Title: string;
  step1Description: string;
  step2Title: string;
  step2Description: string;
  step3Title: string;
  step3Description: string;
  searchPlaceholder: string;
  noMarketsFound: string;

  // PredictionPotTest specific
  bitcoinPotTitle: string;
  connectWalletPrompt: string;
  alreadyInPot: string;
  enteredPotMessage: string;
  goToBetting: string;
  entryAmount?: string;
  amountBalance?: string; // Added for consistency with other sections
  approveSpending?: string; // Added for the approve spending section
  allowContracts?: string; // Added for the allowance message
  enterPot?: string; // Added for the enter pot section 
  pay10USDC?: string; // Added for the payment instruction in the enter pot section 
  approveProcessing?: string; // Added for the processing state of the approve button
  alreadyApproved?: string; // Added for the already approved state of the approve button
  approveUSDC?: string; // Added for the approve USDC button text
  enterPotProcessing?: string; // Added for the processing state of the enter pot button
  enterPotButton?: string; // Added for the enter pot button text
  insufficientUSDC?: string; // Added for the insufficient balance message
  pleaseApproveFirst?: string; // Added for the message to approve USDC spending first  
  appleQuestion?: string; // Added for the Apple stock question
  googleQuestion?: string; // Added for the Google stock question
  microsoftQuestion?: string; // Added for the Microsoft stock question
  amazonQuestion?: string; // Added for the Amazon stock question
  metaQuestion?: string; // Added for the Meta stock question
  dogecoinQuestion?: string; // Added for the Dogecoin question
  cardanoQuestion?: string; // Added for the Cardano question
  xrpQuestion?: string; // Added for the XRP question
  ftse100Question?: string; // Added for the FTX token question
  goldQuestion?: string; // Added for the Gold question
  howItWorksLink?: string; // Added for the link to the How It Works section
  chelseaManUtdQuestion?: string; // Added for the Chelsea
  barcaMadridQuestion?: string; // Added for the Barcelona vs Real Madrid question
  lakersCelticsQuestion?: string; // Added for the Lakers vs Celtics question
  brazilArgentinaQuestion?: string; // Added for the Brazil vs Argentina question
  litecoinQuestion?: string; // Added for the Litecoin question
  polkadotQuestion?: string; // Added for the Polkadot question
  chainlinkQuestion?: string; // Added for the Chainlink question
  
  
  // Footer
  footerText: string;
}

export const translations: Record<Language, Translations> = {
  'en': {
    // Hero Section
    heroTitle: 'Will you predict higher or lower?',
    heroSubtitle: 'Choose your market and make your prediction',
    
    // Markets Section
    marketsTitle: 'Will you predict higher or lower?',
    currentPrice: 'Current Price',
    players: 'Players',
    potSize: 'Pot Size',
    higher: '📈 Higher',
    lower: '📉 Lower',
    comingSoon: 'market coming soon!',
    
    // Market Questions
    bitcoinQuestion: 'Will Bitcoin end the day higher?',
    ethereumQuestion: 'Will Ethereum end the day higher?',
    solanaQuestion: 'Will Solana end the day higher?',
    teslaQuestion: 'Will Tesla stock end the day higher?',
    nvidiaQuestion: 'Will NVIDIA stock end the day higher?',
    sp500Question: 'Will S&P 500 end the day higher?',
    
    // How It Works Section
    howItWorksTitle: 'How It Works',
    howItWorksSubtitle: 'Simple 3-step process to start winning',
    step1Title: 'Choose Your Market',
    step1Description: 'Pick from Bitcoin, Ethereum, Tesla, and more. Each market has its own daily pot.',
    step2Title: 'Make Your Prediction',
    step2Description: 'Will it end higher or lower? Pay the entry fee and lock in your prediction for the day.',
    step3Title: 'Win or Lose',
    step3Description: 'If your prediction is correct, you share the pot with other winners. Wrong guess? Try again tomorrow.',
    searchPlaceholder: "Search markets...",
    noMarketsFound: "No markets found. Please try a different search.",

    // PredictionPotTest specific
    bitcoinPotTitle: 'The ₿itcoin Pot',
    connectWalletPrompt: 'Please connect your wallet to interact with the contract.',
    alreadyInPot: "🎉 You're in the Pot!",
    enteredPotMessage: "You've successfully entered the Bitcoin Pot. You can now place your daily Bitcoin price predictions!",
    goToBetting: 'Go to Betting Page',
    entryAmount: 'Entry Amount',
    amountBalance: 'Pot Balance', // Added for consistency with other sections
    approveSpending: '1. Approve USDC Spending',
    allowContracts: 'Allow the contract to spend your USDC. Current allowance:',
    enterPot: '2. Enter Prediction Pot',
    pay10USDC: 'Pay 10 USDC to enter the pot. Make sure you have approved USDC spending first.',
    approveProcessing: 'Processing...',
    alreadyApproved: 'Already Approved',
    approveUSDC: 'Approve USDC',
    enterPotProcessing: 'Processing...',
    enterPotButton: 'Enter Pot (10 USDC)',
    insufficientUSDC: 'Insufficient USDC balance',
    pleaseApproveFirst: 'Please approve USDC spending first',
    amazonQuestion: 'Will Amazon stock end the day higher?',
    appleQuestion: 'Will Apple stock end the day higher?',
    googleQuestion: 'Will Google stock end the day higher?',
    microsoftQuestion: 'Will Microsoft stock end the day higher?',
    metaQuestion: 'Will Meta stock end the day higher?',
    dogecoinQuestion: 'Will Dogecoin end the day higher?',
    cardanoQuestion: 'Will Cardano end the day higher?',
    xrpQuestion: 'Will XRP end the day higher?',
    ftse100Question: 'Will FTSE 100 end the day higher?',
    goldQuestion: 'Will Gold end the day higher?',
    howItWorksLink: 'How it works >', // Added for the link to the How It Works section
    chelseaManUtdQuestion: 'Will Chelsea vs Manchester United end with a higher score for Chelsea?',
    barcaMadridQuestion: 'Will Barcelona vs Real Madrid end with a higher score for Barcelona?',
    lakersCelticsQuestion: 'Will Lakers vs Celtics end with a higher score for Lakers?',
    brazilArgentinaQuestion: 'Will Brazil vs Argentina end with a higher score for Brazil?',
    litecoinQuestion: 'Will Litecoin end the day higher?',
    polkadotQuestion: 'Will Polkadot end the day higher?',
    chainlinkQuestion: 'Will Chainlink end the day higher?',

    

    // Footer
    footerText: 'Foresight Markets — All rights reserved.',
  },
  'pt-BR': {
    // Hero Section
    heroTitle: 'Você prevê alta ou baixa?',
    heroSubtitle: 'Escolha seu mercado e faça sua previsão',
    
    // Markets Section
    marketsTitle: 'Você prevê alta ou baixa?',
    currentPrice: 'Preço Atual',
    players: 'Jogadores',
    potSize: 'Valor do Pote',
    higher: '📈 Alta',
    lower: '📉 Baixa',
    comingSoon: 'mercado em breve!',
    
    // Market Questions
    bitcoinQuestion: 'O Bitcoin vai terminar o dia em alta?',
    ethereumQuestion: 'O Ethereum vai terminar o dia em alta?',
    solanaQuestion: 'O Solana vai terminar o dia em alta?',
    teslaQuestion: 'A ação da Tesla vai terminar o dia em alta?',
    nvidiaQuestion: 'A ação da NVIDIA vai terminar o dia em alta?',
    sp500Question: 'O S&P 500 vai terminar o dia em alta?',
    
    // How It Works Section
    howItWorksTitle: 'Como Funciona',
    howItWorksSubtitle: 'Processo simples de 3 passos para começar a ganhar',
    step1Title: 'Escolha Seu Mercado',
    step1Description: 'Escolha entre Bitcoin, Ethereum, Tesla e muito mais. Cada mercado tem seu próprio pote diário.',
    step2Title: 'Faça Sua Previsão',
    step2Description: 'Vai terminar em alta ou baixa? Pague a taxa de entrada e confirme sua previsão para o dia.',
    step3Title: 'Ganhe ou Perca',
    step3Description: 'Se sua previsão estiver correta, você divide o pote com outros vencedores. Errou? Tente novamente amanhã.',
    searchPlaceholder: "Pesquisar mercados...",
    noMarketsFound: "Nenhum mercado encontrado. Por favor, tente uma pesquisa diferente.",

    // PredictionPotTest specific
    bitcoinPotTitle: 'O Pote ₿itcoin',
    connectWalletPrompt: 'Por favor, conecte sua carteira para interagir com o contrato.',
    alreadyInPot: "🎉 Você está no Pote!",
    enteredPotMessage: "Você entrou com sucesso no Pote Bitcoin. Agora pode fazer suas previsões diárias do preço do Bitcoin!",
    goToBetting: 'Ir para a Página de Apostas',
    entryAmount: 'Valor de Entrada',
    amountBalance: 'Saldo do Pote', // Added for consistency with other sections
    approveSpending: '1. Aprovar gastos de USDC',
    allowContracts: 'Permitir que o contrato gaste seu USDC. Limite atual:',
    enterPot: '2. Entrar no Pote de Previsões',
    pay10USDC: 'Pague 10 USDC para entrar no pote. Certifique-se de ter aprovado os gastos de USDC primeiro.',
    approveProcessing: 'Processando...',
    alreadyApproved: 'Já Aprovado',
    approveUSDC: 'Aprovar USDC',
    enterPotProcessing: 'Processando...',
    enterPotButton: 'Entrar no Pote (10 USDC)',
    insufficientUSDC: 'Saldo insuficiente de USDC',
    pleaseApproveFirst: 'Por favor, aprove primeiro os gastos de USDC',
    amazonQuestion: 'A ação da Amazon vai terminar o dia em alta?',
    appleQuestion: 'A ação da Apple vai terminar o dia em alta?',
    googleQuestion: 'A ação do Google vai terminar o dia em alta?',
    microsoftQuestion: 'A ação da Microsoft vai terminar o dia em alta?',
    metaQuestion: 'A ação da Meta vai terminar o dia em alta?',
    dogecoinQuestion: 'O Dogecoin vai terminar o dia em alta?',
    cardanoQuestion: 'O Cardano vai terminar o dia em alta?',
    xrpQuestion: 'O XRP vai terminar o dia em alta?',
    ftse100Question: 'O FTSE 100 vai terminar o dia em alta?',
    goldQuestion: 'O Ouro vai terminar o dia em alta?',
    howItWorksLink: 'Como funciona?', // Added for the link to the How It Works section
    chelseaManUtdQuestion: 'Chelsea vai ganhar do Machester United?',
    barcaMadridQuestion: 'Barcelona vai ganhar do Real Madrid?',
    lakersCelticsQuestion: 'Lakers vai ganhar do Celtics?',
    brazilArgentinaQuestion: 'Brasil vai ganhar da Argentina?',
    litecoinQuestion: 'O Litecoin vai terminar o dia em alta?',
    polkadotQuestion: 'O Polkadot vai terminar o dia em alta?',
    chainlinkQuestion: 'O Chainlink vai terminar o dia em alta?',

    // Footer
    footerText: 'Foresight Markets — Todos os direitos reservados.',
  },
};

export const getTranslation = (language: Language): Translations => {
  return translations[language] || translations['en'];
};

export const supportedLanguages: { code: Language; name: string; flag: string }[] = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'pt-BR', name: 'Português', flag: '🇧🇷' },
];
