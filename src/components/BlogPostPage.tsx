import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import LoadingSpinner from './LoadingSpinner';

interface BlogPost {
  title: string;
  slug: string;
  introduction: string;
  sections: { heading: string; content: string }[];
  conclusion: string;
}

const BlogPostPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      if (!slug) return;
      setIsLoading(true);
      try {
        // Em uma aplicação real, buscaríamos o post do nosso backend.
        // Por enquanto, vamos usar a IA para gerar o conteúdo dinamicamente.
        const response = await fetch(`${import.meta.env.VITE_AI_API_URL}/api/generate-blog-post`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }, // Supondo que este endpoint possa ser público
          body: JSON.stringify({ topic: slug.replace(/-/g, ' ') }),
        });
        if (!response.ok) throw new Error('Failed to fetch blog post');
        const data = await response.json();
        setPost(data);
        document.title = data.title;
      } catch (error) {
        console.error("Error fetching blog post:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPost();
  }, [slug]);

  if (isLoading) return <div className="flex justify-center items-center h-screen"><LoadingSpinner /></div>;
  if (!post) return <div className="text-center p-8">Artigo não encontrado.</div>;

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-md my-8">
      <article className="prose lg:prose-xl">
        <h1>{post.title}</h1>
        <p className="lead">{post.introduction}</p>
        {post.sections.map((section, index) => (
          <div key={index}>
            <h2>{section.heading}</h2>
            <p>{section.content}</p>
          </div>
        ))}
        <p>{post.conclusion}</p>
        <Link to="/" state={{ action: 'requestService', category: post.slug.split('-')[post.slug.split('-').length -1] }} className="no-underline inline-block mt-6 px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700">
          Encontrar um Profissional Agora
        </Link>
      </article>
    </div>
  );
};

export default BlogPostPage;