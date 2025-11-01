import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface RelatedPost {
  slug: string;
  title: string;
  featuredImageUrl?: string;
}

interface RelatedArticlesProps {
  category: string;
  currentPostSlug: string;
}

const RelatedArticles: React.FC<RelatedArticlesProps> = ({ category, currentPostSlug }) => {
  const [relatedPosts, setRelatedPosts] = useState<RelatedPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRelated = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/blog-posts/related?category=${category}&exclude=${currentPostSlug}&limit=3`);
        const data = await response.json();
        setRelatedPosts(data);
      } catch (error) {
        console.error("Failed to fetch related posts:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRelated();
  }, [category, currentPostSlug]);

  if (isLoading || relatedPosts.length === 0) {
    return null; // Don't render anything if loading or no related posts
  }

  return (
    <div className="mt-16 pt-8 border-t">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Artigos Relacionados</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {relatedPosts.map(post => (
          <Link to={`/blog/${post.slug}`} key={post.slug} className="group block">
            <img src={post.featuredImageUrl || 'https://picsum.photos/400/250'} alt={post.title} className="w-full h-40 object-cover rounded-lg mb-4 transition-transform group-hover:scale-105" />
            <h3 className="text-lg font-semibold text-gray-700 group-hover:text-blue-600">{post.title}</h3>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default RelatedArticles;