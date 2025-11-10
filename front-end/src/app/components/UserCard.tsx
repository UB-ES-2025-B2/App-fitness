"use client";

import Link from "next/link";
import Image from "next/image";

type UserCardProps = {
  id: number;
  username: string;
  name: string;
  avatarUrl: string | null;
  bio?: string;
  postsCount?: number;
  followersCount?: number;
  compact?: boolean;
};

export default function UserCard({
  id,
  username,
  name,
  avatarUrl,
  bio,
  postsCount,
  followersCount,
  compact = false,
}: UserCardProps) {
  return (
    <Link
      href={`/usuario/${id}`}
      className="block bg-white rounded-xl shadow-md hover:shadow-xl transition-all p-4 hover:scale-[1.02]"
    >
      <div className={`flex items-center gap-4 ${compact ? "" : "flex-col sm:flex-row"}`}>
        {/* Avatar */}
        <div className={`${compact ? "w-12 h-12" : "w-16 h-16"} rounded-full overflow-hidden bg-gray-200 flex-shrink-0`}>
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={name}
              width={compact ? 48 : 64}
              height={compact ? 48 : 64}
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-purple-500">
              <span className={`${compact ? "text-lg" : "text-2xl"} text-white font-bold`}>
                {name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className={`${compact ? "text-sm" : "text-lg"} font-semibold text-gray-800 truncate`}>
            {name}
          </h3>
          <p className={`${compact ? "text-xs" : "text-sm"} text-gray-500 truncate`}>
            @{username}
          </p>
          
          {!compact && bio && (
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{bio}</p>
          )}

          {!compact && (postsCount !== undefined || followersCount !== undefined) && (
            <div className="flex gap-4 mt-2 text-xs text-gray-500">
              {postsCount !== undefined && (
                <span>
                  <strong className="text-gray-800">{postsCount}</strong> posts
                </span>
              )}
              {followersCount !== undefined && (
                <span>
                  <strong className="text-gray-800">{followersCount}</strong> seguidores
                </span>
              )}
            </div>
          )}
        </div>

        {/* Icono de flecha */}
        <div className="text-gray-400">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>
      </div>
    </Link>
  );
}
