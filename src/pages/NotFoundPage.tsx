import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Compass } from 'lucide-react';
import { NeoNattleLogo } from '../components/common/AvenzaLogo';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen w-full bg-[#F8FAFC] text-[#172033] flex flex-col justify-between p-6 sm:p-12 font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Top Bar */}
      <div className="max-w-6xl w-full mx-auto flex items-center justify-between">
        <Link to="/" className="cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-lg">
          <NeoNattleLogo size="md" showBadge badgeText="PROTOTYPE" />
        </Link>
        <div className="text-xs font-mono text-slate-500">
          HTTP 404 · ROUTE NOT FOUND
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-xl w-full mx-auto my-auto text-center space-y-8 py-16">
        <div className="inline-flex p-4 rounded-2xl bg-blue-50 border border-blue-200/80 text-blue-600">
          <Compass className="w-8 h-8 stroke-[1.5]" />
        </div>

        <div className="space-y-3">
          <div className="text-xs font-mono font-semibold uppercase tracking-wider text-blue-700">
            Unrecognized Route Endpoint
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold text-[#172033] tracking-tight">
            Page Not Found
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed font-normal">
            The requested URL path does not exist within the NeoNattle monitoring console or research workspaces.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            to="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          >
            <span>Return to Overview</span>
          </Link>
          <Link
            to="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-medium rounded-lg transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Landing Page</span>
          </Link>
        </div>
      </div>

      {/* Footer Disclaimer */}
      <div className="max-w-6xl w-full mx-auto text-center text-xs font-mono text-slate-500 border-t border-slate-200 pt-6">
        NeoNattle Research Prototype · Developed by Avenza · Educational Evaluation Only
      </div>
    </div>
  );
};

export default NotFoundPage;
