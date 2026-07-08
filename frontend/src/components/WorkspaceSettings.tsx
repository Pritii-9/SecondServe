import React, { useState } from 'react';
import { Building2, UserPlus, Shield, Trash2, CheckCircle2 } from 'lucide-react';

export const WorkspaceSettings: React.FC = () => {
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteSent, setInviteSent] = useState(false);

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (inviteEmail) {
      // In a real app, this would hit POST /api/workspace/invite
      setInviteSent(true);
      setInviteEmail('');
      setTimeout(() => setInviteSent(false), 3000);
    }
  };

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 w-full text-white shadow-xl max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8 border-b border-gray-800 pb-4">
        <Building2 className="text-blue-400" size={28} />
        <div>
          <h2 className="text-2xl font-bold text-gray-100">Workspace Settings</h2>
          <p className="text-sm text-gray-400">Manage your organization and team members.</p>
        </div>
      </div>

      {/* Invite Member Section */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <UserPlus size={18} className="text-gray-400" />
          Invite Team Member
        </h3>
        <form onSubmit={handleInvite} className="flex gap-3">
          <input 
            type="email" 
            placeholder="colleague@restaurant.com" 
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
          />
          <button 
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Send Invite
          </button>
        </form>
        {inviteSent && (
          <p className="text-emerald-400 text-sm mt-2 flex items-center gap-1">
            <CheckCircle2 size={16} /> Invitation sent successfully!
          </p>
        )}
      </div>

      {/* Team Members List */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Shield size={18} className="text-gray-400" />
          Active Members
        </h3>
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <div className="flex justify-between items-center p-4 border-b border-gray-700">
            <div>
              <p className="font-medium text-white">John Doe (You)</p>
              <p className="text-sm text-gray-400">john@restaurant.com</p>
            </div>
            <span className="bg-blue-900/50 text-blue-400 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide">Admin</span>
          </div>
          <div className="flex justify-between items-center p-4">
            <div>
              <p className="font-medium text-white">Jane Smith</p>
              <p className="text-sm text-gray-400">jane@restaurant.com</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="bg-gray-700 text-gray-300 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide">Member</span>
              <button className="text-red-400 hover:text-red-300 transition-colors p-1" title="Remove Member">
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
