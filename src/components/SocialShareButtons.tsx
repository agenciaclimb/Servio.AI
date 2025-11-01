import React from 'react';

interface SocialShareButtonsProps {
  postUrl: string;
  title: string;
}

const SocialShareButtons: React.FC<SocialShareButtonsProps> = ({ postUrl, title }) => {
  const encodedUrl = encodeURIComponent(postUrl);
  const encodedTitle = encodeURIComponent(title);

  const socialLinks = [
    {
      name: 'Facebook',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      className: 'bg-blue-600 hover:bg-blue-700',
    },
    {
      name: 'Twitter',
      url: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      className: 'bg-sky-500 hover:bg-sky-600',
    },
    {
      name: 'LinkedIn',
      url: `https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodedTitle}`,
      className: 'bg-blue-800 hover:bg-blue-900',
    },
    {
      name: 'WhatsApp',
      url: `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`,
      className: 'bg-green-500 hover:bg-green-600',
    },
  ];

  return (
    <div className="my-8 text-center">
      <h3 className="text-lg font-semibold text-gray-700 mb-4">Compartilhe este artigo</h3>
      <div className="flex justify-center items-center space-x-4">
        {socialLinks.map((link) => (
          <a
            key={link.name}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Compartilhar no ${link.name}`}
            className={`text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300 ${link.className}`}
          >
            {/* Em um projeto real, usaríamos ícones aqui */}
            {link.name}
          </a>
        ))}
      </div>
    </div>
  );
};

export default SocialShareButtons;