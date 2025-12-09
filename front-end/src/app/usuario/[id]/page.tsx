"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import UserListModal from "../../components/UserListModal";
import Link from "next/link";
import ReportForm from "../../components/ReportForm";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

type UserProfile = {
  id: number;
  username: string;
  name: string;
  avatarUrl: string | null;
  bio: string;
  ocultarInfo: boolean;
  createdAt: string;
  is_following?: boolean;
};

type UserSummary = {
  id: number;
  username: string;
  name: string;
  avatarUrl: string | null;
};

type Post = {
  id: number;
  text: string;
  topic: string;
  image: string | null;
  date: string;
};

type PostBase = {
  id: number;
  topic: string;
  text: string;
  image?: string;
  likeCount?: number;
  likedByMe?: boolean;
  date?: string;
  repostCount?: number;
};

type OriginalContent = PostBase & {
  user: string;
  userId?: number;
};

type Item = OriginalContent & {
  type: 'original' | 'repost';
  repostedBy?: string;
  repostedById?: number;
  repostComment?: string;
  originalPost?: OriginalContent; 
};

type BackendPost = {
  id: number;
  text: string;
  topic?: string | null;
  image?: string | null;
  date?: string | null;
  created_at?: string | null;
  timestamp?: string | null;
  user?: { id: number; username: string; name?: string | null } | null;
  likes?: number;
  liked?: boolean;
  likedByMe?: boolean;
  reposts?: number;

  type?: 'original' | 'repost'; 
  comment_text?: string | null;
  reposted_by?: { id: number; username: string; name?: string | null } | null;
  original_content?: BackendPost;
};

function normalizePost(p: BackendPost): Item {
  const isRepost = p.type === 'repost';
  let sourcePost = p;
  
  if (isRepost && p.original_content) {
    sourcePost = p.original_content;
  }

  const userName =
    typeof sourcePost.user === "string"
      ? sourcePost.user
      : sourcePost.user?.name || sourcePost.user?.username || "Usuari";

  const userId =
    typeof sourcePost.user === "object" && sourcePost.user?.id
      ? sourcePost.user.id
      : undefined;

  const bestDate =
    sourcePost.date ||
    sourcePost.created_at ||
    sourcePost.timestamp ||
    new Date().toISOString(); 
    
  const originalData: OriginalContent = {
    id: sourcePost.id,
    text: sourcePost.text,
    topic: sourcePost.topic ?? "General",
    image: sourcePost.image ?? undefined,
    user: userName,
    userId,
    likeCount: sourcePost.likes ?? 0,
    likedByMe: sourcePost.likedByMe ?? sourcePost.liked ?? false,
    date: bestDate,
    repostCount: sourcePost.reposts ?? 0,
  };
  
  if (isRepost) {
      const reposterName = p.reposted_by?.name || p.reposted_by?.username || "Usuari Desconegut";
      const reposterId = p.reposted_by?.id;
      const repostComment = p.comment_text ?? undefined;
      
      return {
          ...originalData,
          type: 'repost',
          repostedBy: reposterName,
          repostedById: reposterId,
          repostComment: repostComment,
          originalPost: originalData,
          date: p.created_at || p.date || bestDate,
      } as Item;
  }

  return { ...originalData, type: 'original' } as Item;
}


const SafeImage = ({ 
  src, 
  alt, 
  fill, 
  width, 
  height, 
  className 
}: { 
  src: string; 
  alt: string; 
  fill?: boolean; 
  width?: number; 
  height?: number; 
  className?: string;
}) => {
  const [error, setError] = useState(false);

  if (error || !src) {
    return null;
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      width={width}
      height={height}
      className={className}
      onError={() => setError(true)}
      unoptimized={src.includes('bing.com') || src.includes('unsplash.com')}
    />
  );
};

function PostContent({
    post,
    handleRepost
}: {
    post: Item;
    handleRepost: (id: number) => void;
}) {
    return (
        <div className={post.type === 'repost' ? "border border-gray-200 dark:border-slate-700 p-4 rounded-xl" : ""}>
            <div className="flex items-center justify-between mb-2">
                {post.userId ? (
                    <Link
                        href={`/usuario/${post.userId}`}
                        className="font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                        {post.user}
                    </Link>
                ) : (
                    <h2 className="font-semibold text-blue-600 dark:text-blue-400">{post.user}</h2>
                )}
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    {post.topic}
                </span>
            </div>

            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{post.text}</p>

            {post.image && (
                <div className="mt-3 overflow-hidden rounded-xl">
                    <SafeImage
                        src={post.image}
                        alt={post.topic}
                        width={600}
                        height={400}
                        className="w-full h-64 object-cover transform hover:scale-[1.02] transition-transform duration-500"
                    />
                </div>
            )}

            <div className="mt-3 flex items-center gap-3">
                <span className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300">
                    <span>{post.likedByMe ? "💖" : "🤍"}</span>
                    <span>{post.likeCount ?? 0} Me gusta</span>
                </span>
                
                <button
                    onClick={() => handleRepost(post.id)}
                    className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-4 h-4"
                    >
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3.5 12.5a.5.5 0 0 1-.5.5H12a.5.5 0 0 1-.5-.5v-4h-2a.5.5 0 0 1-.5-.5V9a.5.5 0 0 1 .5-.5h2V4.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v4h2a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-2v4a.5.5 0 0 1-.5.5z"/>
                        <path fill="none" d="M0 0h24v24H0z"/>
                    </svg>
                    <span>Repost</span>
                </button>
                
                {post.repostCount !== undefined && post.repostCount >= 0 && (
                    <span className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300">
                        🔁 {post.repostCount} Reposts
                    </span>
                )}
            </div>
        </div>
    );
}

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = params?.id as string;

  const [user, setUser] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Item[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string>("Todos");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  
  const [followersList, setFollowersList] = useState<UserSummary[]>([]);
  const [followingList, setFollowingList] = useState<UserSummary[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"followers" | "following">("followers");
  const [reportPostId, setReportPostId] = useState<number | null>(null);
  const isReportModalOpen = reportPostId !== null;

  const handleOpenReport = (postId: number) => {
    setReportPostId(postId);
  };

  const handleClosePostReport = () => {
    setReportPostId(null);
  };

  useEffect(() => {
    const tokens = localStorage.getItem("ubfitness_tokens");
    let token = "";
    if (tokens) {
      try {
        const parsed = JSON.parse(tokens);
        token = parsed.access_token;
        const payload = JSON.parse(atob(token.split(".")[1]));
        setCurrentUserId(payload.user_id || payload.sub);
      } catch (e) {
        console.error("Error parsing token:", e);
      }
    }

    if (!userId) return;

    const fetchUserData = async () => {
      try {
        setLoading(true);
        setError("");

        const headers: HeadersInit = {};
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        const userRes = await fetch(`${API_BASE}/api/users/${userId}`, { headers });
        if (!userRes.ok) throw new Error("Usuario no encontrado");
        const userData = await userRes.json();
        setUser(userData);
        
        if (userData.is_following !== undefined) {
            setIsFollowing(userData.is_following);
        }

        const postsRes = await fetch(`${API_BASE}/api/users/${userId}/posts`);
        if (!postsRes.ok) throw new Error("Error al cargar publicaciones");
        const postsData: BackendPost[] = await postsRes.json();
        setPosts(postsData.map(normalizePost));

        const followersRes = await fetch(`${API_BASE}/api/users/${userId}/followers`);
        const followersData = await followersRes.json();
        setFollowersList(followersData);
        setFollowersCount(followersData.length);

        const followingRes = await fetch(`${API_BASE}/api/users/${userId}/following`);
        const followingData = await followingRes.json();
        setFollowingList(followingData);
        setFollowingCount(followingData.length);

      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Error al cargar el perfil");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId]);

  const handleFollow = async () => {
    const tokens = localStorage.getItem("ubfitness_tokens");
    if (!tokens) {
      router.push("/login");
      return;
    }
    const parsed = JSON.parse(tokens);
    const token = parsed.access_token;

    try {
      const method = isFollowing ? "DELETE" : "POST";
      const res = await fetch(`${API_BASE}/api/users/${userId}/follow`, {
        method,
        headers: {
            "Authorization": `Bearer ${token}`
        }
      });

      if (!res.ok) throw new Error("Error al actualizar seguimiento");

      const data = await res.json();
      const newIsFollowing = data.is_following;
      
      if (newIsFollowing !== isFollowing) {
          setIsFollowing(newIsFollowing);
          setFollowersCount((prev) => (newIsFollowing ? prev + 1 : prev - 1));
      }
    } catch (err) {
      console.error(err);
      alert("Error al actualizar el seguimiento");
    }
  };

  const handleRepost = async (postId: number) => {
    const raw = localStorage.getItem("ubfitness_tokens");
    let accessToken: string | null = null;
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        accessToken = parsed.access_token;
      } catch (e) {
        console.error("Invalid ubfitness_tokens in localStorage", e);
      }
    }

    if (!accessToken) {
      alert("Has d'iniciar sessió per repostejar.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/posts/${postId}/repost`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({}),
      });

      if (res.status === 201) {
        alert("Repost creat amb èxit!");
        window.location.reload(); 
      } else if (res.status === 200) {
        alert("Ja has reposteat aquest post.");
      }
      else {
        const errorData = await res.json();
        alert(`Error al fer Repost: ${errorData.error || 'Petició fallida'}`);
        console.error("Error al fer Repost:", res.status, errorData);
      }
    } catch (err) {
      console.error("Error durant la petició de Repost:", err);
      alert("Error de xarxa en fer Repost.");
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-4 md:p-8">
        <div className="mx-auto max-w-4xl text-center py-20">
          <p className="text-gray-600">Cargando perfil...</p>
        </div>
      </main>
    );
  }

  if (error || !user) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-4 md:p-8">
        <div className="mx-auto max-w-4xl text-center py-20">
          <p className="text-red-600 mb-4">{error || "Usuario no encontrado"}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Volver
          </button>
        </div>
      </main>
    );
  }

  const uniqueTopics = Array.from(
    new Set(posts.map((p) => p.topic).filter((t) => t && t.trim() !== ""))
  );
  const topics = ["Todos", ...uniqueTopics];
  
  const filteredPosts =
    selectedTopic === "Todos"
      ? posts
      : posts.filter((p) => p.topic === selectedTopic);

  const isOwnProfile = currentUserId === parseInt(userId);

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4 md:p-8">
      <div className="mx-auto max-w-5xl">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="relative w-full h-48 rounded-xl overflow-hidden mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
            {user.avatarUrl && (
              <SafeImage
                src={user.avatarUrl}
                alt="Banner"
                fill
                className="object-cover opacity-50"
              />
            )}
            <div className="absolute top-4 left-4 text-white text-sm font-medium bg-black/30 px-3 py-1 rounded-full">
              BANNER:
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg bg-gray-200">
                {user.avatarUrl ? (
                  <SafeImage
                    src={user.avatarUrl}
                    alt={user.name}
                    width={96}
                    height={96}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-purple-500">
                    <span className="text-3xl text-white font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 text-center md:text-left">
              <h1 className="text-2xl font-bold text-gray-800">{user.name}</h1>
              <p className="text-gray-500 text-sm">@{user.username}</p>
              
              {user.bio && (
                <p className="mt-3 text-gray-700 text-sm leading-relaxed">
                  {user.bio}
                </p>
              )}

              <div className="flex gap-6 mt-4 justify-center md:justify-start">
                <div className="text-center">
                  <p className="text-xl font-bold text-gray-800">{posts.length}</p>
                  <p className="text-xs text-gray-500">Posts</p>
                </div>
                <button 
                  onClick={() => {
                    setModalType("followers");
                    setModalOpen(true);
                  }}
                  className="text-center hover:opacity-70 transition-opacity"
                >
                  <p className="text-xl font-bold text-gray-800">{followersCount}</p>
                  <p className="text-xs text-gray-500">Seguidores</p>
                </button>
                <button 
                  onClick={() => {
                    setModalType("following");
                    setModalOpen(true);
                  }}
                  className="text-center hover:opacity-70 transition-opacity"
                >
                  <p className="text-xl font-bold text-gray-800">{followingCount}</p>
                  <p className="text-xs text-gray-500">Siguiendo</p>
                </button>
              </div>
            </div>

            {!isOwnProfile && (
              <button
                onClick={handleFollow}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  isFollowing
                    ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {isFollowing ? "Siguiendo" : "Seguir"}
              </button>
            )}

            {isOwnProfile && (
              <button
                onClick={() => router.push("/perfil")}
                className="px-6 py-2 rounded-lg font-medium bg-gray-200 text-gray-700 hover:bg-gray-300"
              >
                Editar perfil
              </button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Intereses:</h2>
          <div className="flex flex-wrap gap-3">
            {topics.map((topic, index) => (
              <button
                key={`topic-${index}-${topic}`}
                onClick={() => setSelectedTopic(topic)}
                className={`px-5 py-2 rounded-full font-medium transition-all ${
                  selectedTopic === topic
                    ? "bg-red-500 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {topic}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          {filteredPosts.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <p className="text-gray-500">No hay publicaciones todavía</p>
            </div>
          ) : (
            filteredPosts.map((post) => (
              <div
                key={post.id + post.type + (post.repostedById || 0)}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
              >
                {post.type === 'repost' && (
                    <div className="flex items-center gap-3 p-4 border-b">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="w-4 h-4 text-green-500"
                        >
                            <path fillRule="evenodd" d="M4.755 10.059a7.5 7.5 0 0 1 12.548-3.355 4.5 4.5 0 0 0 4.5 0 7.5 7.5 0 0 1-12.548 3.355Z" clipRule="evenodd" />
                            <path d="M18.75 12a.75.75 0 0 0 0 1.5h.008a.75.75 0 0 0 0-1.5H18.75Z" />
                            <path fillRule="evenodd" d="M4.5 12.75a7.5 7.5 0 0 1 12.548-3.355 4.5 4.5 0 0 0 4.5 0 7.5 7.5 0 0 1-12.548 3.355ZM18.75 15a.75.75 0 0 0 0 1.5h.008a.75.75 0 0 0 0-1.5H18.75Z" clipRule="evenodd" />
                        </svg>
                        
                        <p className="text-sm text-gray-600">
                            Recompartido por{' '}
                            <span className="font-semibold text-gray-800">
                                {post.repostedBy}
                            </span>
                        </p>
                    </div>
                )}
                
                {post.type === 'repost' && post.repostComment && (
                    <div className="p-4 border-b">
                        <p className="italic text-gray-600 border-l-4 border-blue-500 pl-3">
                            `{post.repostComment}`
                        </p>
                    </div>
                )}

                <div className="flex items-center gap-3 p-4 border-b">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200">
                    {(post.type === 'original' ? user.avatarUrl : post.originalPost?.image) ? (
                      <SafeImage
                        src={(post.type === 'original' ? user.avatarUrl : post.originalPost?.image) || ''}
                        alt={(post.type === 'original' ? user.name : post.originalPost?.user) || 'Avatar'}
                        width={40}
                        height={40}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-purple-500">
                        <span className="text-sm text-white font-bold">
                          {(post.type === 'original' ? user.name : post.originalPost?.user)?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">
                        {post.type === 'original' ? user.name : post.originalPost?.user}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date((post.type === 'original' ? post.date : post.originalPost?.date || post.date) ?? "").toLocaleDateString("es-ES", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                <div className="p-4">
                  <p className="text-gray-800 mb-3">{post.type === 'original' ? post.text : post.originalPost?.text}</p>

                  {(post.type === 'original' ? post.image : post.originalPost?.image) && (
                    <div className="relative w-full h-96 rounded-xl overflow-hidden">
                      <SafeImage
                        src={(post.type === 'original' ? post.image : post.originalPost?.image) || ''}
                        alt="Post"
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                </div>

                <div className="px-4 pb-4 flex justify-between items-center">
                  <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                    {post.type === 'original' ? post.topic : post.originalPost?.topic}
                  </span>
                  
                  <button
                    onClick={() => handleRepost(post.type === 'original' ? post.id : post.originalPost?.id || post.id)}
                    className="flex items-center gap-1 text-sm text-gray-600 hover:text-green-600 transition-colors"
                  >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-4 h-4"
                    >
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3.5 12.5a.5.5 0 0 1-.5.5H12a.5.5 0 0 1-.5-.5v-4h-2a.5.5 0 0 1-.5-.5V9a.5.5 0 0 1 .5-.5h2V4.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v4h2a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-2v4a.5.5 0 0 1-.5.5z"/>
                        <path fill="none" d="M0 0h24v24H0z"/>
                    </svg>
                    <span>Repost ({post.repostCount ?? 0})</span>
                  </button>
                  <button
                onClick={() => handleOpenReport(post.id)}
                className="flex items-center gap-1 text-xs text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 ml-auto"
              ><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                Denunciar
                </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <UserListModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalType === "followers" ? "Seguidores" : "Siguiendo"}
        users={modalType === "followers" ? followersList : followingList}
      />
      {isReportModalOpen && reportPostId !== null && (
          <ReportForm
              targetId={reportPostId} 
              targetType="post" 
              isOpen={isReportModalOpen}
              onClose={handleClosePostReport}
          />
      )}
    </main>
  );
}