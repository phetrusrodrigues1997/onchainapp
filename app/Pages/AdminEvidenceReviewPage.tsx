import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { FileText, Clock, AlertTriangle, CheckCircle, XCircle, ChevronDown, ChevronUp, Shield, Eye, Calendar, User } from 'lucide-react';
import { getAllEvidenceSubmissions } from '../Database/actions';
import { getProvisionalOutcome } from '../Database/OwnerActions';
import { getMarkets } from '../Constants/markets';
import { getTranslation } from '../Languages/languages';

// Table mapping for market types
const tableMapping = {
  "0xb526c2Ee313f9D4866D8e5238C148f35EF73ed9F": "featured",
  "0x53B8Cbc599142b29D92eA4eC74fCC4f59454AcD8": "crypto",
} as const;

type TableType = typeof tableMapping[keyof typeof tableMapping];

interface EvidenceSubmission {
  id: number;
  walletAddress: string;
  marketType: string;
  outcomeDate: string;
  evidence: string;
  submittedAt: Date;
  paymentTxHash: string | null;
  status: string;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  reviewNotes: string | null;
  refundTxHash: string | null;
}

interface MarketOutcome {
  outcome: 'positive' | 'negative';
  setAt: string;
  evidenceWindowExpires: string;
  finalOutcome?: 'positive' | 'negative' | null;
  isDisputed: boolean;
}

interface AdminEvidenceReviewPageProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

const AdminEvidenceReviewPage: React.FC<AdminEvidenceReviewPageProps> = ({ 
  activeSection, 
  setActiveSection 
}) => {
  const { address, isConnected } = useAccount();
  
  // State management
  const [selectedMarket, setSelectedMarket] = useState<TableType>('featured');
  const [evidenceSubmissions, setEvidenceSubmissions] = useState<EvidenceSubmission[]>([]);
  const [marketOutcome, setMarketOutcome] = useState<MarketOutcome | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [expandedEvidence, setExpandedEvidence] = useState<Set<number>>(new Set());
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  
  // Check if user is admin/owner
  const isAdmin = (): boolean => {
    if (!address || !isConnected) return false;
    
    // Add specific admin wallet addresses here
    const adminAddresses: string[] = [
      // Add your admin wallet addresses here (lowercase)
      // Example: '0x1234567890123456789012345678901234567890'
    ];
    
    const normalizedAddress = address.toLowerCase();
    return adminAddresses.includes(normalizedAddress);
  };

  // Load market outcome for selected market
  const loadMarketOutcome = async (marketType: TableType) => {
    try {
      const provisionalOutcomeData = await getProvisionalOutcome(marketType);
      
      if (provisionalOutcomeData) {
        setMarketOutcome({
          outcome: provisionalOutcomeData.outcome,
          setAt: provisionalOutcomeData.setAt,
          evidenceWindowExpires: provisionalOutcomeData.evidenceWindowExpires,
          finalOutcome: provisionalOutcomeData.finalOutcome,
          isDisputed: provisionalOutcomeData.isDisputed || false
        });
      } else {
        setMarketOutcome(null);
      }
    } catch (error) {
      console.error('Error loading market outcome:', error);
      setMarketOutcome(null);
    }
  };

  // Load evidence submissions for selected market
  const loadEvidenceSubmissions = async (marketType: TableType) => {
    if (!marketOutcome) return;
    
    setIsLoading(true);
    try {
      const outcomeDate = new Date(marketOutcome.setAt).toISOString().split('T')[0];
      const submissions = await getAllEvidenceSubmissions(marketType, outcomeDate);
      setEvidenceSubmissions(submissions);
    } catch (error) {
      console.error('Error loading evidence submissions:', error);
      setEvidenceSubmissions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load data when market changes or component mounts
  useEffect(() => {
    const loadData = async () => {
      await loadMarketOutcome(selectedMarket);
    };
    loadData();
  }, [selectedMarket]);

  useEffect(() => {
    if (marketOutcome) {
      loadEvidenceSubmissions(selectedMarket);
    }
  }, [marketOutcome, selectedMarket]);

  // Toggle evidence expansion
  const toggleEvidenceExpansion = (evidenceId: number) => {
    const newExpanded = new Set(expandedEvidence);
    if (newExpanded.has(evidenceId)) {
      newExpanded.delete(evidenceId);
    } else {
      newExpanded.add(evidenceId);
    }
    setExpandedEvidence(newExpanded);
  };

  // Filter evidence submissions
  const filteredSubmissions = evidenceSubmissions.filter(submission => {
    if (filterStatus === 'all') return true;
    return submission.status === filterStatus;
  });

  // Get status styling
  const getStatusStyling = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  // Redirect non-admin users
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-4">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-3xl p-10 shadow-2xl shadow-gray-900/10">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Shield className="w-10 h-10 text-gray-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Connect Wallet</h1>
            <p className="text-gray-600">Please connect your wallet to access admin features</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin()) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-4">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-3xl p-10 shadow-2xl shadow-gray-900/10">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Shield className="w-10 h-10 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600 mb-8">You don't have permission to access this admin panel</p>
            <button
              onClick={() => setActiveSection('home')}
              className="bg-gray-900 text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-800 transition-colors"
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 p-4">
      <div className="max-w-6xl mx-auto pt-8">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <FileText className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Evidence Review Panel</h1>
          <p className="text-gray-600 font-light text-lg">
            Review and manage dispute evidence submissions
          </p>
        </div>

        {/* Market Selector */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8 shadow-lg">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Select Market
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => setSelectedMarket('featured')}
              className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                selectedMarket === 'featured'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              }`}
            >
              <div className="font-semibold">Featured Market</div>
              <div className="text-sm opacity-75">Main prediction market</div>
            </button>
            <button
              onClick={() => setSelectedMarket('crypto')}
              className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                selectedMarket === 'crypto'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              }`}
            >
              <div className="font-semibold">Crypto Market</div>
              <div className="text-sm opacity-75">Cryptocurrency predictions</div>
            </button>
          </div>
        </div>

        {/* Market Outcome Status */}
        {marketOutcome && (
          <div className={`bg-gradient-to-r backdrop-blur-xl border-2 rounded-2xl p-6 mb-8 shadow-xl ${
            marketOutcome.outcome === 'positive' 
              ? 'from-green-50 to-green-100 border-green-200' 
              : 'from-red-50 to-red-100 border-red-200'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Current Outcome Status</h3>
                <div className={`inline-flex items-center px-4 py-2 rounded-xl font-bold text-lg ${
                  marketOutcome.outcome === 'positive' 
                    ? 'bg-green-200 text-green-800' 
                    : 'bg-red-200 text-red-800'
                }`}>
                  {marketOutcome.outcome === 'positive' ? 'POSITIVE' : 'NEGATIVE'}
                </div>
              </div>
              <div className="text-right">
                <div className="text-gray-600 text-sm">Set on</div>
                <div className="font-semibold">{new Date(marketOutcome.setAt).toLocaleString()}</div>
                <div className="text-gray-600 text-sm mt-2">Evidence window expires</div>
                <div className="font-semibold">{new Date(marketOutcome.evidenceWindowExpires).toLocaleString()}</div>
              </div>
            </div>
            
            {marketOutcome.finalOutcome && marketOutcome.finalOutcome !== marketOutcome.outcome && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mt-4">
                <div className="flex items-center gap-2 text-yellow-800">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="font-semibold">Outcome Updated</span>
                </div>
                <p className="text-yellow-700 mt-1">
                  Final outcome changed to: <span className="font-bold">
                    {marketOutcome.finalOutcome.toUpperCase()}
                  </span>
                </p>
              </div>
            )}
          </div>
        )}

        {!marketOutcome && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 mb-8 text-center">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No Outcome Set</h3>
            <p className="text-gray-600">No provisional outcome has been set for this market yet.</p>
          </div>
        )}

        {/* Filter Controls */}
        {marketOutcome && evidenceSubmissions.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8 shadow-lg">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Filter Evidence</h3>
            <div className="flex flex-wrap gap-2">
              {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filterStatus === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                  {status !== 'all' && (
                    <span className="ml-1 text-xs">
                      ({evidenceSubmissions.filter(e => e.status === status).length})
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Evidence Submissions */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-lg">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-6 h-6" />
              Evidence Submissions
              {filteredSubmissions.length > 0 && (
                <span className="text-sm font-normal text-gray-600">
                  ({filteredSubmissions.length} {filteredSubmissions.length === 1 ? 'submission' : 'submissions'})
                </span>
              )}
            </h2>
          </div>

          <div className="p-6">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center gap-3 text-blue-600">
                  <div className="w-6 h-6 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin"></div>
                  <span className="font-medium">Loading evidence submissions...</span>
                </div>
              </div>
            ) : filteredSubmissions.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No Evidence Submissions</h3>
                <p className="text-gray-600">
                  {evidenceSubmissions.length === 0 
                    ? "No evidence has been submitted for this market yet."
                    : `No ${filterStatus} evidence submissions found.`
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredSubmissions.map((submission, index) => (
                  <div key={submission.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                    
                    {/* Submission Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <User className="w-4 h-4 text-gray-600" />
                          <h4 className="font-bold text-gray-900">Evidence #{index + 1}</h4>
                          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold border ${getStatusStyling(submission.status)}`}>
                            {getStatusIcon(submission.status)}
                            {submission.status.toUpperCase()}
                          </div>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div>From: <span className="font-mono">{submission.walletAddress.slice(0, 8)}...{submission.walletAddress.slice(-6)}</span></div>
                          <div>Submitted: {new Date(submission.submittedAt).toLocaleString()}</div>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => toggleEvidenceExpansion(submission.id)}
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium text-sm"
                      >
                        {expandedEvidence.has(submission.id) ? (
                          <>
                            <ChevronUp className="w-4 h-4" />
                            Collapse
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-4 h-4" />
                            Expand
                          </>
                        )}
                      </button>
                    </div>

                    {/* Evidence Content (Collapsible) */}
                    {expandedEvidence.has(submission.id) && (
                      <div className="space-y-4">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h5 className="font-semibold text-gray-700 mb-2">Evidence Details:</h5>
                          <div className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap break-words">
                            {submission.evidence}
                          </div>
                        </div>

                        {submission.reviewNotes && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-center gap-2 text-blue-700 font-semibold mb-2">
                              <FileText className="w-4 h-4" />
                              Admin Review Notes
                            </div>
                            <div className="text-blue-800 text-sm leading-relaxed">
                              {submission.reviewNotes}
                            </div>
                            {submission.reviewedAt && (
                              <div className="text-blue-600 text-xs mt-2">
                                Reviewed: {new Date(submission.reviewedAt).toLocaleString()}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Summary Stats */}
        {evidenceSubmissions.length > 0 && (
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200 p-6 mt-8">
            <h3 className="text-lg font-bold text-blue-900 mb-4">Evidence Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-800">{evidenceSubmissions.length}</div>
                <div className="text-blue-600 text-sm font-medium">Total Submissions</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-700">{evidenceSubmissions.filter(e => e.status === 'pending').length}</div>
                <div className="text-orange-600 text-sm font-medium">Pending Review</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-700">{evidenceSubmissions.filter(e => e.status === 'approved').length}</div>
                <div className="text-green-600 text-sm font-medium">Approved</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-700">{evidenceSubmissions.filter(e => e.status === 'rejected').length}</div>
                <div className="text-red-600 text-sm font-medium">Rejected</div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminEvidenceReviewPage;