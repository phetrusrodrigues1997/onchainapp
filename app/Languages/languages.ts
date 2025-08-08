export type Language = 'en' | 'pt-BR';

export interface Translations {
  // Hero Section
  heroTitle: string;
  heroSubtitle: string;
  
  // Markets Section
  marketsTitle: string;
  currentPrice: string;
  availability: string;
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

  // Tutorial Section
  tutorialStep1Title: string;
  tutorialStep1Description: string;
  tutorialStep2Title: string;
  tutorialStep2Description: string;
  tutorialStep3Title: string;
  tutorialStep3Description: string;
  tutorialStep4Title: string;
  tutorialStep4Description: string;
  tutorialStep5Title: string;
  tutorialStep5Description: string;
  skipTutorial: string;
  previous: string;
  next: string;
  startPlaying: string;
  tutorialTip: string;

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
    availability: 'Available',
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
    howItWorksSubtitle: 'Join prediction markets with real rewards and consequences',
    step1Title: 'Enter the Pot',
    step1Description: 'Join weekly prediction markets. Each market has its own growing pot of participants.',
    step2Title: 'Make Your Prediction',
    step2Description: 'Predict tomorrow\'s outcome - will Bitcoin go up or down? Lock in your prediction before the deadline.',
    step3Title: 'Winners Take All',
    step3Description: 'Correct predictors at the end of the week split the entire pot equally. Wrong predictors get temporarily blocked from betting until next week.',
    searchPlaceholder: "Search markets...",
    noMarketsFound: "No markets found. Please try a different search.",

    // Tutorial Section
    tutorialStep1Title: 'Welcome to Prediction Markets',
    tutorialStep1Description: 'Join thousands of players in daily prediction competitions where skill and strategy win real rewards.',
    tutorialStep2Title: 'Enter the Pot (Weekends-Tuesday)',
    tutorialStep2Description: 'Pay 0.01 USDC to join the prediction pot. Pot entry is open Saturday through Tuesday. Invite friends with your referral code to earn free entries!',
    tutorialStep3Title: 'Make Your Predictions (Tue-Thu)',
    tutorialStep3Description: 'Betting opens Tuesday through Thursday. Predict if Bitcoin will go up or down the next day. Choose wisely - your prediction determines your fate.',
    tutorialStep4Title: 'Results Day Friday',
    tutorialStep4Description: 'Winners are determined Friday at midnight UTC. Correct predictors split the pot equally. Wrong predictors get temporarily blocked from the next round.',
    tutorialStep5Title: 'Ready to Play?',
    tutorialStep5Description: 'You now understand the rules. Connect your wallet and make your first prediction to start winning!',
    skipTutorial: 'Skip Tutorial',
    previous: 'Previous',
    next: 'Next',
    startPlaying: 'Start Playing',
    tutorialTip: 'The more accurate your predictions, the more you\'ll win!',

    // PredictionPotTest specific
    bitcoinPotTitle: 'Pot Details',
    connectWalletPrompt: 'Please connect your wallet to interact with the contract.',
    alreadyInPot: "🎉 You're in the Pot!",
    enteredPotMessage: "You've successfully entered the pot. You can now place your predictions!",
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
    availability: 'Disponível',
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
    howItWorksSubtitle: 'Participe de mercados de previsão com recompensas e consequências reais',
    step1Title: 'Entre no Pote',
    step1Description: 'Pague 0.01 USDC para participar dos mercados de previsão diários. Cada mercado tem seu próprio pote crescente de participantes.',
    step2Title: 'Faça Sua Previsão',
    step2Description: 'Preveja o resultado de amanhã - Bitcoin vai subir ou descer? Confirme sua previsão antes do prazo.',
    step3Title: 'Vencedores Levam Tudo',
    step3Description: 'Preditores corretos dividem todo o pote igualmente. Preditores errados ficam temporariamente bloqueados de apostar até a próxima rodada.',
    searchPlaceholder: "Pesquisar mercados...",
    noMarketsFound: "Nenhum mercado encontrado. Por favor, tente uma pesquisa diferente.",

    // Tutorial Section
    tutorialStep1Title: 'Bem-vindo aos Mercados de Previsão',
    tutorialStep1Description: 'Junte-se a milhares de jogadores em competições diárias de previsão onde habilidade e estratégia ganham recompensas reais.',
    tutorialStep2Title: 'Entre no Pote (Fins de Semana-Terça)',
    tutorialStep2Description: 'Pague 0.01 USDC para participar do pote de previsão. Entrada no pote está aberta de sábado a terça-feira. Convide amigos com seu código de referência para ganhar entradas grátis!',
    tutorialStep3Title: 'Faça Suas Previsões (Ter-Qui)',
    tutorialStep3Description: 'Apostas abrem de terça a quinta-feira. Preveja se Bitcoin vai subir ou descer no próximo dia. Escolha sabiamente - sua previsão determina seu destino.',
    tutorialStep4Title: 'Dia dos Resultados Sexta',
    tutorialStep4Description: 'Vencedores são determinados sexta à meia-noite UTC. Preditores corretos dividem o pote igualmente. Preditores errados ficam temporariamente bloqueados da próxima rodada.',
    tutorialStep5Title: 'Pronto para Jogar?',
    tutorialStep5Description: 'Agora você entende as regras. Conecte sua carteira e faça sua primeira previsão para começar a ganhar!',
    skipTutorial: 'Pular Tutorial',
    previous: 'Anterior',
    next: 'Próximo',
    startPlaying: 'Começar a Jogar',
    tutorialTip: 'Quanto mais precisas suas previsões, mais você ganhará!',

    // PredictionPotTest specific
    bitcoinPotTitle: 'Detalhes do Pote',
    connectWalletPrompt: 'Por favor, conecte sua carteira para interagir com o contrato.',
    alreadyInPot: "🎉 Você está no Pote!",
    enteredPotMessage: "Você entrou com sucesso no pote. Agora pode fazer suas previsões!",
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
