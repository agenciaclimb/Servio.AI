import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import LoadingSpinner from './src/components/LoadingSpinner';

interface PostSummary {
  slug: string;
  title: string;
  introduction: string;
  featuredImageUrl?: string;
}

const BlogIndexPage: React.FC = () => {
  const [posts, setPosts] = useState<PostSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_BACKEND_API_URL}/blog-posts`)
      .then(res => res.json())
      .then(data => setPosts(data))
      .catch(err => console.error("Failed to fetch posts", err))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <header className="text-center my-12">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900">Blog & Dicas da SERVIO.AI</h1>
        <p className="mt-4 text-lg text-gray-600">Dicas de especialistas para cuidar da sua casa e contratar os melhores serviços.</p>
      </header>
      <div className="space-y-8">
        {isLoading ? (
          <div className="flex justify-center"><LoadingSpinner /></div>
        ) : (
          posts.map(post => (
            <article key={post.slug} className="group grid md:grid-cols-3 gap-6 items-center">
              {post.featuredImageUrl && (
                <Link to={`/blog/${post.slug}`} className="md:col-span-1 block overflow-hidden rounded-lg">
                  <img src={post.featuredImageUrl} alt={post.title} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300" />
                </Link>
              )}
              <div className="md:col-span-2">
                <h2 className="text-2xl font-bold text-gray-800 group-hover:text-blue-600"><Link to={`/blog/${post.slug}`}>{post.title}</Link></h2>
                <p className="mt-2 text-gray-600 line-clamp-2">{post.introduction}</p>
                <Link to={`/blog/${post.slug}`} className="mt-4 inline-block text-blue-600 font-semibold">Ler artigo &rarr;</Link>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
};

export default BlogIndexPage;