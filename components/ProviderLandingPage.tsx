import React from 'react';

interface ProviderLandingPageProps {
  onRegisterClick: () => void;
}

const FeatureCard: React.FC<{ icon: string; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
    <div className="flex items-center space-x-4">
      <div className="flex-shrink-0 bg-blue-100 text-blue-600 rounded-lg w-12 h-12 flex items-center justify-center">
        <span className="text-2xl">{icon}</span>
      </div>
      <div>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
    </div>
    <p className="mt-4 text-gray-600">{children}</p>
  </div>
);

const StepCard: React.FC<{ number: string; title: string; children: React.ReactNode }> = ({ number, title, children }) => (
    <div className="text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-2xl font-bold shadow-lg">
            {number}
        </div>
        <h3 className="mt-4 text-xl font-bold text-gray-800">{title}</h3>
        <p className="mt-2 text-gray-600">{children}</p>
    </div>
);


const ProviderLandingPage: React.FC<ProviderLandingPageProps> = ({ onRegisterClick }) => {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="text-center py-20 px-4 sm:px-6 lg:px-8 bg-slate-50 rounded-lg">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tighter">
          Sua expertise, nossos clientes.
          <span className="block text-blue-600">Junte-se à revolução dos serviços.</span>
        </h1>
        <p className="mt-4 max-w-md mx-auto text-lg text-gray-600 sm:text-xl md:mt-5 md:max-w-3xl">
          Conectamos seu talento a milhares de clientes que precisam de você. Foque no que você faz de melhor, e deixe que a SERVIO.AI cuide do resto.
        </p>
        <div className="mt-8">
          <button
            onClick={onRegisterClick}
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-8 py-4 text-base font-medium text-white shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition transform hover:scale-105"
          >
            Quero ser um Parceiro
          </button>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-20">
        <h2 className="text-3xl font-bold text-center text-gray-900">Simples, rápido e eficiente</h2>
        <p className="text-center mt-2 text-gray-600">Comece a receber propostas em 3 passos:</p>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-12">
            <StepCard number="1" title="Crie seu Perfil Grátis">
                Mostre suas habilidades, adicione sua localização e deixe nossa IA otimizar seu perfil para atrair os clientes certos.
            </StepCard>
             <StepCard number="2" title="Receba Oportunidades">
                Seja notificado sobre novos serviços na sua área de atuação. Escolha os jobs que mais te interessam.
            </StepCard>
             <StepCard number="3" title="Realize o Serviço e Receba">
                Envie sua proposta, realize o trabalho e receba seu pagamento de forma segura através da nossa plataforma.
            </StepCard>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-slate-50 rounded-lg">
        <h2 className="text-3xl font-bold text-center text-gray-900">Vantagens que fazem a diferença</h2>
         <p className="text-center mt-2 text-gray-600">Ferramentas para impulsionar seu negócio.</p>
        <div className="mt-12 max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          <FeatureCard icon="🎯" title="Clientes Qualificados">
            Chega de perder tempo. Conectamos você a clientes que realmente precisam dos seus serviços e estão prontos para contratar.
          </FeatureCard>
          <FeatureCard icon="🔒" title="Pagamento Seguro e Garantido">
            Com nosso sistema de custódia, o pagamento do cliente fica retido e é liberado para você assim que o serviço é concluído. Mais segurança e zero calote.
          </FeatureCard>
          <FeatureCard icon="✨" title="Perfil Otimizado por IA">
            Nossa inteligência artificial ajuda a criar um perfil campeão, destacando seus pontos fortes para que você seja encontrado mais facilmente.
          </FeatureCard>
          <FeatureCard icon=" calendar-alt" title="Flexibilidade Total">
            Você está no controle. Defina seus próprios horários, escolha os serviços que quer atender e trabalhe de onde estiver.
          </FeatureCard>
        </div>
      </section>
      
        {/* Testimonials Section */}
      <section className="py-20">
        <h2 className="text-3xl font-bold text-center text-gray-900">O que nossos parceiros dizem</h2>
        <div className="mt-12 max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100">
                <p className="text-gray-600 italic">"Desde que entrei na SERVIO.AI, minha agenda está sempre cheia. A plataforma realmente me conecta com clientes sérios e organizados. O pagamento seguro é um diferencial enorme."</p>
                <p className="mt-4 font-bold text-gray-800">- Carlos Pereira</p>
                <p className="text-sm text-blue-600">Eletricista</p>
            </div>
             <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100">
                <p className="text-gray-600 italic">"A ferramenta de IA para criar propostas me economiza muito tempo. Consigo enviar orçamentos personalizados em segundos. Recomendo para todos os colegas de profissão."</p>
                <p className="mt-4 font-bold text-gray-800">- Mariana Costa</p>
                <p className="text-sm text-blue-600">Pintora Decorativa</p>
            </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-blue-600 text-white text-center rounded-lg">
        <h2 className="text-3xl font-extrabold">Pronto para elevar seu negócio a outro nível?</h2>
        <p className="mt-4 max-w-2xl mx-auto text-blue-100">
            Junte-se a centenas de profissionais que já estão crescendo com a SERVIO.AI. O cadastro é rápido, gratuito e abre um mundo de oportunidades.
        </p>
        <div className="mt-8">
          <button
            onClick={onRegisterClick}
            className="inline-flex items-center justify-center rounded-lg bg-white px-8 py-4 text-base font-bold text-blue-600 shadow-lg hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600 transition transform hover:scale-105"
          >
            Cadastrar meu serviço agora
          </button>
        </div>
      </section>
    </div>
  );
};

export default ProviderLandingPage;
