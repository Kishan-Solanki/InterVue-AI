// app/(root)/dashboard/ProfileCard.jsx
import React from 'react';
import Image from 'next/image';

const ProfileCard = ({ user }) => {
    if (!user) return null;

    return (
        <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border border-slate-700 flex flex-col items-center text-center">
            <Image
                src={user.profileImageURL}
                alt={user.username || 'User profile'}
                width={100}
                height={100}
                className="rounded-md object-cover border-4 border-slate-600"
            />
            <h2 className="mt-4 text-xl font-semibold text-white">{user.username}</h2>
            <p className="text-sm text-neutral-400 break-all">{user.email}</p>
            <span
                className={`mt-3 px-3 py-1 text-xs font-medium rounded-full ${user.isVerified
                    ? 'bg-green-500/20 text-green-300'
                    : 'bg-yellow-500/20 text-yellow-300'
                    }`}
            >
                {user.isVerified ? 'Verified Account' : 'Not Verified'}
            </span>
        </div>
    );
};

export default ProfileCard;