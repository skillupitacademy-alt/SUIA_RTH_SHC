import { Course } from '../CoursesCardData';
import { FaBrain } from 'react-icons/fa';

export const algorithmicTradingCourse: Course = {
  id: 10,
  category: "Specialist",
  format: "LIVE ONLINE",
  title: "Algorithmic Trading",
  description: "Build automated trading systems using Python, machine learning, and quantitative financial analysis.",
  features: [
    "Quantitative Finance",
    "Trading Algorithms",
    "Machine Learning",
    "Financial Data",
    "Backtesting",
    "Risk Management"
  ],
  image: "/Sixth.webp",
  slug: "algorithmic-trading",
  heroTitle: "Algorithmic Trading",
  heroSubtitle: "with AI & Finance",
  heroDescription: "Master Python, Trading Algorithms, Quantitative Analysis, Backtesting, Risk Management & ML in Finance.",
  heroSubDescription: "Build profitable trading systems and land high-paying roles in top financial institutions.",
  companies: ["Two Sigma", "Jane Street", "Citadel", "Goldman Sachs", "Morgan Stanley", "Point72"],
  ctaButtons: {
    primary: "Enroll Now - Limited Seats",
    secondary: "Explore Full Curriculum"
  },
  assessmentCertification: {
    assessmentCards: [
      {
        id: 0,
        title: "Weekly Trading Labs",
        description: "Hands-on exercises writing and optimizing trading algorithms in Python",
        features: ["Python Scripts", "Data Analysis", "Alpha Generation"],
        backContent: {
          points: [
            "Data ingestion and processing tasks",
            "Building basic technical indicators",
            "Implementing mean-reversion strategies",
            "Time-series analysis exercises",
            "Risk modeling calculations"
          ],
          frequency: "Every Week",
          weightage: "20% of final grade"
        }
      },
      {
        id: 1,
        title: "Module Assessments",
        description: "Comprehensive end-of-module exams covering quantitative finance concepts",
        features: ["Financial Math", "Risk Management", "ML Theory"],
        backContent: {
          points: [
            "Modern Portfolio Theory (MPT) calculations",
            "Options pricing and Black-Scholes model",
            "Machine learning model evaluation for finance",
            "Performance metric analysis (Sharpe/Sortino)",
            "Market microstructure and execution logic"
          ],
          frequency: "After Each Module",
          weightage: "30% of final grade"
        }
      },
      {
        id: 2,
        title: "Project Evaluations",
        description: "Expert review of complete backtested trading strategies and live bots",
        features: ["Backtest Reports", "Code Review", "Live Deployment"],
        backContent: {
          points: [
            "Vectorized backtesting accuracy review",
            "Handling of transaction costs and slippage",
            "Out-of-sample data validation",
            "Live trading API integration (Paper Trading)",
            "Overall strategy profitability and drawdown"
          ],
          frequency: "Per Project",
          weightage: "40% of final grade"
        }
      },
      {
        id: 3,
        title: "Certification Benefits",
        description: "Industry-recognized Quantitative Finance certificate with hiring partner access",
        features: ["Industry Recognized", "Global Validity", "Hiring Partner Access"],
        backContent: {
          points: [
            "Quantitative Finance & Trading certificate",
            "Global recognition by hedge funds and banks",
            "Hiring partner network access",
            "Verified by industry experts",
            "LinkedIn digital badge included"
          ],
          frequency: "Program Completion",
          weightage: "Official Certification"
        }
      }
    ],
    certificateData: {
      title: "Industry-Recognized Algorithmic Trading Certification",
      description: "Our certificate validates your ability to apply quantitative finance concepts, develop robust trading algorithms, and utilize machine learning for alpha generation.",
      benefits: [
        "Algorithmic Trading specialization certificate",
        "Global recognition and validity",
        "Hiring partner acceptance",
        "Verified by quant industry experts",
        "LinkedIn digital badge included",
        "Career placement network access"
      ],
      certificateDetails: {
        title: "Certificate of Completion",
        subtitle: "Quantitative Finance & Algorithmic Trading",
        subSubtitle: "Covering Python, Financial Time Series, Modern Portfolio Theory, Backtesting, Risk Management, and Machine Learning for Trading.",
        rating: 5
      }
    }
  },
  curriculum: {
    title: "Comprehensive Curriculum",
    description: "6-8 Months · 450-550 Hours",
    phases: [
      {
        id: 0,
        title: "Phase 1",
        subtitle: "Foundations: Python & Financial Data",
        icon: "Code",
        duration: "5-6 Weeks",
        gradient: "from-blue-500 to-indigo-600",
        bgColor: "bg-gradient-to-br from-blue-50 to-indigo-50",
        borderColor: "border-blue-200",
        topics: [
          {
            title: "Python for Finance (3 Weeks)",
            color: "blue-500",
            items: [
              "Python syntax, data structures, and OOP",
              "Numerical analysis with NumPy",
              "Data manipulation with Pandas and DataFrames",
              "Data visualization with Matplotlib and Seaborn",
              "Handling date and time objects",
              "Best practices for scientific computing"
            ]
          },
          {
            title: "Financial Data Management (2-3 Weeks)",
            color: "indigo-500",
            items: [
              "Sourcing data via APIs (Yahoo Finance, Alpha Vantage)",
              "Handling tick, minute, and daily OHLCV data",
              "Cleaning and preprocessing financial data",
              "Resampling and forward/backward filling",
              "Calculating financial returns (Simple vs. Log)",
              "Storing data using SQLite and HDF5"
            ]
          }
        ],
        projects: [
          { title: "Mini Project:", description: "Building a Custom Financial Data Downloader", color: "blue" },
          { title: "Mini Project:", description: "Interactive Stock Market Dashboard", color: "indigo" }
        ]
      },
      {
        id: 1,
        title: "Phase 2",
        subtitle: "Quantitative Finance & Portfolio Theory",
        icon: "TrendingUp",
        duration: "5-6 Weeks",
        gradient: "from-green-500 to-emerald-600",
        bgColor: "bg-gradient-to-br from-green-50 to-emerald-50",
        borderColor: "border-green-200",
        topics: [
          {
            title: "Financial Markets & Instruments (2 Weeks)",
            color: "green-500",
            items: [
              "Equities, Bonds, Forex, and Cryptocurrencies",
              "Derivatives: Options, Futures, and Swaps",
              "Market microstructure and order book dynamics",
              "Margin trading and short selling mechanics",
              "Understanding bid-ask spreads and liquidity"
            ]
          },
          {
            title: "Portfolio Theory & Risk Management (3-4 Weeks)",
            color: "emerald-500",
            items: [
              "Modern Portfolio Theory (MPT) & Efficient Frontier",
              "Capital Asset Pricing Model (CAPM) and Beta",
              "Calculating Risk Metrics: VaR, Expected Shortfall",
              "Performance Metrics: Sharpe, Sortino, Treynor Ratios",
              "Kelly Criterion and position sizing",
              "Drawdown analysis and risk limits"
            ]
          }
        ],
        projects: [
          { title: "Project 1:", description: "Portfolio Optimization and Efficient Frontier Generator", color: "green" },
          { title: "Project 2:", description: "Value-at-Risk (VaR) Calculation Engine", color: "emerald" }
        ]
      },
      {
        id: 2,
        title: "Phase 3",
        subtitle: "Algorithmic Trading Strategies",
        icon: "Activity",
        duration: "6-7 Weeks",
        gradient: "from-purple-500 to-violet-600",
        bgColor: "bg-gradient-to-br from-purple-50 to-violet-50",
        borderColor: "border-purple-200",
        topics: [
          {
            title: "Technical & Statistical Strategies (3 Weeks)",
            color: "purple-500",
            items: [
              "Trend Following: Moving Averages, MACD, ADX",
              "Mean Reversion: Bollinger Bands, RSI, Z-Scores",
              "Statistical Arbitrage and Pairs Trading",
              "Cointegration vs. Correlation",
              "Volatility Breakout strategies (ATR)",
              "Regime-based switching models"
            ]
          },
          {
            title: "Advanced Financial Modeling (3-4 Weeks)",
            color: "violet-500",
            items: [
              "Time Series Analysis (ARIMA, GARCH models)",
              "Stationarity testing (Augmented Dickey-Fuller)",
              "Monte Carlo simulations for pricing and risk",
              "Black-Scholes-Merton option pricing model",
              "Implied volatility and the volatility smile",
              "Greeks (Delta, Gamma, Theta, Vega) hedging"
            ]
          }
        ],
        projects: [
          { title: "Project 1:", description: "Developing a Statistical Arbitrage Pairs Trading Bot", color: "purple" },
          { title: "Project 2:", description: "Monte Carlo Option Pricing and Greeks Calculator", color: "violet" }
        ]
      },
      {
        id: 3,
        title: "Phase 4",
        subtitle: "Backtesting Frameworks",
        icon: "BarChart2",
        duration: "4-5 Weeks",
        gradient: "from-red-500 to-rose-600",
        bgColor: "bg-gradient-to-br from-red-50 to-rose-50",
        borderColor: "border-red-200",
        topics: [
          {
            title: "Vectorized Backtesting (2 Weeks)",
            color: "red-500",
            items: [
              "Building a vectorized backtester in Pandas",
              "Avoiding look-ahead bias and survivorship bias",
              "Vectorized performance evaluation",
              "Optimizing strategy parameters",
              "Limitations of vectorized backtesting"
            ]
          },
          {
            title: "Event-Driven Backtesting (3 Weeks)",
            color: "rose-500",
            items: [
              "Architecture of event-driven trading systems",
              "Handling Market, Signal, Order, and Fill events",
              "Simulating transaction costs (commissions, slippage)",
              "Using professional libraries (Backtrader, Zipline)",
              "Walk-forward optimization and out-of-sample testing",
              "Cloud-based backtesting platforms (QuantConnect)"
            ]
          }
        ],
        projects: [
          { title: "Project:", description: "Building an Event-Driven Backtesting Engine from Scratch", color: "red" },
          { title: "Project:", description: "Deploying and Testing Strategies on QuantConnect", color: "rose" }
        ]
      },
      {
        id: 4,
        title: "Phase 5",
        subtitle: "Machine Learning in Finance",
        icon: "Cpu",
        duration: "6-7 Weeks",
        gradient: "from-teal-500 to-cyan-600",
        bgColor: "bg-gradient-to-br from-teal-50 to-cyan-50",
        borderColor: "border-teal-200",
        topics: [
          {
            title: "Supervised & Unsupervised Learning (3 Weeks)",
            color: "teal-500",
            items: [
              "Feature engineering for financial time series",
              "Predicting market direction with Logistic Regression",
              "Tree-based models (Random Forest, XGBoost, LightGBM)",
              "Support Vector Machines (SVM) for classification",
              "Clustering algorithms (K-Means) for regime detection",
              "Dimensionality reduction (PCA) for yield curves"
            ]
          },
          {
            title: "Deep Learning & NLP (3-4 Weeks)",
            color: "cyan-500",
            items: [
              "Neural Networks basics (TensorFlow/Keras)",
              "Time-series forecasting with RNNs and LSTMs",
              "Natural Language Processing (NLP) for sentiment analysis",
              "Parsing financial news and Twitter feeds (FinBERT)",
              "Reinforcement Learning for trading (Q-Learning)",
              "Preventing overfitting in financial ML models"
            ]
          }
        ],
        projects: [
          { title: "Project 1:", description: "XGBoost Classifier for Predicting Next-Day Returns", color: "teal" },
          { title: "Project 2:", description: "Sentiment Analysis Trading Bot using FinBERT", color: "cyan" }
        ]
      },
      {
        id: 5,
        title: "Phase 6",
        subtitle: "Live Trading & Automation Implementation",
        icon: "Server",
        duration: "4-5 Weeks",
        gradient: "from-orange-500 to-amber-600",
        bgColor: "bg-gradient-to-br from-orange-50 to-amber-50",
        borderColor: "border-orange-200",
        topics: [
          {
            title: "Broker API Integration (2 Weeks)",
            color: "orange-500",
            items: [
              "Connecting to Interactive Brokers (TWS API / ib_insync)",
              "OANDA API for Forex trading",
              "Binance/Coinbase APIs for Crypto trading",
              "Handling real-time websocket data streams",
              "Order execution types (Market, Limit, Stop, TWAP)"
            ]
          },
          {
            title: "System Deployment & Monitoring (2-3 Weeks)",
            color: "amber-500",
            items: [
              "Deploying trading bots to AWS (EC2) or DigitalOcean",
              "Containerization with Docker",
              "Setting up cron jobs and task scheduling",
              "Logging, exception handling, and alerting (Telegram/Slack)",
              "Database management for live order tracking",
              "System security and API key management"
            ]
          }
        ],
        projects: [
          { title: "Project:", description: "Connecting and Paper Trading via Interactive Brokers API", color: "orange" },
          { title: "Project:", description: "Deploying a Fully Autonomous Crypto Trading Bot on AWS", color: "amber" }
        ]
      },
      {
        id: 6,
        title: "Phase 7",
        subtitle: "Capstone Projects & Quant Interview Prep",
        icon: "Award",
        duration: "4-6 Weeks",
        gradient: "from-gray-700 to-gray-900",
        bgColor: "bg-gradient-to-br from-gray-100 to-gray-200",
        borderColor: "border-gray-400",
        topics: [
          {
            title: "Capstone Development (3 Weeks)",
            color: "gray-700",
            items: [
              "End-to-end development of a production-grade strategy",
              "Comprehensive backtesting with out-of-sample data",
              "Implementation of strict risk management rules",
              "Live paper-trading deployment",
              "Writing a formal research report"
            ]
          },
          {
            title: "Quant Interview Preparation (2-3 Weeks)",
            color: "gray-800",
            items: [
              "Brain teasers, probability, and statistics questions",
              "Coding challenges (Python, C++, SQL)",
              "Finance and options pricing interview questions",
              "System design for low-latency trading",
              "Building a quantitative portfolio on GitHub",
              "Navigating the prop shop and hedge fund interview process"
            ]
          }
        ],
        projects: [
          { title: "Capstone Project:", description: "End-to-End ML-Driven Statistical Arbitrage System", color: "gray" },
          { title: "Interview Outcome:", description: "Crack Quantitative Analyst or Algorithmic Trader roles", color: "gray" }
        ]
      }
    ],
    projects: [
      {
        id: 0,
        title: "Statistical Arbitrage Pairs Trader",
        description: "Develop a mean-reverting pairs trading algorithm using cointegration tests and deploy it on live market data.",
        icon: "Activity",
        gradient: "from-blue-500 to-cyan-500",
        bgColor: "bg-gradient-to-br from-blue-50 to-cyan-50",
        borderColor: "border-blue-200",
        tags: ["Python", "Statsmodels", "Pairs Trading", "Mean Reversion"]
      },
      {
        id: 1,
        title: "Event-Driven Backtesting Engine",
        description: "Build a robust event-driven backtester from scratch to simulate realistic trading environments including slippage and commissions.",
        icon: "BarChart2",
        gradient: "from-purple-500 to-pink-500",
        bgColor: "bg-gradient-to-br from-purple-50 to-pink-50",
        borderColor: "border-purple-200",
        tags: ["OOP", "Pandas", "Backtesting", "Order Management"]
      },
      {
        id: 2,
        title: "XGBoost Price Predictor",
        description: "Engineer technical and fundamental features to train an XGBoost model predicting short-term asset price direction.",
        icon: "Cpu",
        gradient: "from-green-500 to-emerald-500",
        bgColor: "bg-gradient-to-br from-green-50 to-emerald-50",
        borderColor: "border-green-200",
        tags: ["Machine Learning", "XGBoost", "Feature Engineering", "Scikit-Learn"]
      },
      {
        id: 3,
        title: "Sentiment Analysis Trading Bot",
        description: "Use NLP (FinBERT) to analyze financial news headlines and execute trades based on real-time market sentiment.",
        icon: "MessageSquare",
        gradient: "from-red-500 to-rose-500",
        bgColor: "bg-gradient-to-br from-red-50 to-rose-50",
        borderColor: "border-red-200",
        tags: ["NLP", "Deep Learning", "APIs", "Transformers"]
      },
      {
        id: 4,
        title: "Portfolio Optimization Dashboard",
        description: "Create an interactive web application that calculates the Efficient Frontier and suggests optimal portfolio weightings.",
        icon: "PieChart",
        gradient: "from-orange-500 to-amber-500",
        bgColor: "bg-gradient-to-br from-orange-50 to-amber-50",
        borderColor: "border-orange-200",
        tags: ["Streamlit", "SciPy", "Markowitz", "CAPM"]
      },
      {
        id: 5,
        title: "Autonomous Crypto Trader on AWS",
        description: "Deploy a live trading bot connected to the Binance API, running 24/7 on an AWS EC2 instance with Telegram alerts.",
        icon: "Server",
        gradient: "from-teal-500 to-cyan-500",
        bgColor: "bg-gradient-to-br from-teal-50 to-cyan-50",
        borderColor: "border-teal-200",
        tags: ["AWS EC2", "Docker", "Binance API", "Automation"]
      }
    ],
    techStack: [
      {
        category: "Programming & Data Analysis",
        icon: "Code",
        borderColor: "border-blue-200",
        bgColor: "bg-gradient-to-r from-blue-50 to-cyan-50",
        technologies: [
          { label: "Python", iconSrc: "/DAT1.webp" },
          { label: "Pandas", iconSrc: "/DAT3.webp" },
          { label: "NumPy", iconSrc: "/AI1.webp" },
          { label: "SQL", iconSrc: "/DAT4.webp" },
          { label: "Matplotlib", iconSrc: "/DAT5.webp" },
          { label: "C++ (Concepts)", iconSrc: "/BE1.webp" }
        ]
      },
      {
        category: "Machine Learning & Stats",
        icon: "Cpu",
        borderColor: "border-purple-200",
        bgColor: "bg-gradient-to-r from-purple-50 to-violet-50",
        technologies: [
          { label: "Scikit-Learn", iconSrc: "/AI2.webp" },
          { label: "TensorFlow", iconSrc: "/AI4.webp" },
          { label: "PyTorch", iconSrc: "/AI3.webp" },
          { label: "XGBoost", iconSrc: "/AI5.webp" },
          { label: "Statsmodels", iconSrc: "/AI6.webp" },
          { label: "NLTK/Spacy", iconSrc: "/DAT2.webp" }
        ]
      },
      {
        category: "Trading & Backtesting Libraries",
        icon: "TrendingUp",
        borderColor: "border-green-200",
        bgColor: "bg-gradient-to-r from-green-50 to-emerald-50",
        technologies: [
          { label: "Backtrader", iconSrc: "/DDW1.webp" },
          { label: "QuantConnect", iconSrc: "/DDW3.webp" },
          { label: "Zipline", iconSrc: "/DDW4.webp" },
          { label: "TA-Lib", iconSrc: "/DAT1.webp" },
          { label: "ib_insync", iconSrc: "/DDW5.svg" },
          { label: "CCXT", iconSrc: "/BE5.webp" }
        ]
      },
      {
        category: "Deployment & Infrastructure",
        icon: "Cloud",
        borderColor: "border-orange-200",
        bgColor: "bg-gradient-to-r from-orange-50 to-amber-50",
        technologies: [
          { label: "AWS EC2", iconSrc: "/CP1.webp" },
          { label: "Docker", iconSrc: "/DD4.webp" },
          { label: "Linux CLI", iconSrc: "/DevOps3.webp" },
          { label: "Git", iconSrc: "/DAT3.webp" },
          { label: "SQLite/Postgres", iconSrc: "/DDW2.webp" },
          { label: "Redis", iconSrc: "/DD1.webp" }
        ]
      }
    ],
    careerOutcomes: [
      {
        title: "Quantitative Analyst",
        salary: "$120k-$200k+",
        icon: "TrendingUp",
        gradient: "from-blue-500 to-cyan-500",
        bgColor: "bg-gradient-to-br from-blue-50 to-cyan-50",
        borderColor: "border-blue-200",
        description: "Develop mathematical models and apply statistical methods to identify profitable trading opportunities."
      },
      {
        title: "Algorithmic Trader",
        salary: "$100k-$180k+",
        icon: "Activity",
        gradient: "from-purple-500 to-pink-500",
        bgColor: "bg-gradient-to-br from-purple-50 to-pink-50",
        borderColor: "border-purple-200",
        description: "Design, backtest, and deploy automated trading systems across various asset classes."
      },
      {
        title: "Quantitative Developer",
        salary: "$130k-$190k+",
        icon: "Code",
        gradient: "from-green-500 to-emerald-500",
        bgColor: "bg-gradient-to-br from-green-50 to-emerald-50",
        borderColor: "border-green-200",
        description: "Build the high-performance software infrastructure required for algorithmic trading systems."
      }
    ],
    capstoneData: {
      title: "Capstone Development",
      icon: "FileText",
      bgColor: "bg-white",
      borderColor: "border-gray-200",
      projects: ["End-to-End ML Trading System", "Statistical Arbitrage Bot", "Live Paper-Trading Deployment"],
      outcome: "A professional portfolio of backtested strategies to showcase to hedge funds and prop trading firms"
    },
    interviewPrep: {
      title: "Interview Preparation",
      icon: "Users",
      bgColor: "bg-white",
      borderColor: "border-gray-200",
      technical: ["Brain Teasers", "Probability & Stats", "Python/C++ Coding", "Options Pricing"],
      career: ["Resume + GitHub Portfolio", "Prop Shop Interviews", "Salary Negotiation"],
      outcome: "Crack quant interviews at top tier hedge funds, banks, and proprietary trading firms"
    }
  },
  icon: FaBrain
};