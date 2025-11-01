import React from 'react';
import { Link } from 'react-router-dom';

const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md mt-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">Política de Privacidade</h1>

      <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 space-y-4">
        <p><strong>Última atualização:</strong> [Data Efetiva]</p>

        <p>A sua privacidade é importante para nós. Esta Política de Privacidade explica como a SERVIO.AI ("nós", "nosso") coleta, usa e protege suas informações pessoais.</p>

        <h2 className="text-xl font-semibold">1. Informações que Coletamos</h2>
        <p>Coletamos informações que você nos fornece diretamente, como:</p>
        <ul>
          <li><strong>Informações de Cadastro:</strong> Nome, e-mail, senha, localização.</li>
          <li><strong>Informações de Perfil (Prestadores):</strong> CPF, endereço, especialidades, biografia, fotos de portfólio.</li>
          <li><strong>Dados de Transação:</strong> Detalhes dos serviços contratados e pagamentos (processados por nosso parceiro Stripe).</li>
          <li><strong>Comunicações:</strong> Mensagens trocadas através do nosso chat.</li>
        </ul>

        <h2 className="text-xl font-semibold">2. Como Usamos Suas Informações</h2>
        <p>Usamos suas informações para:</p>
        <ul>
          <li>Operar e manter nossa plataforma.</li>
          <li>Conectar Clientes e Prestadores.</li>
          <li>Processar pagamentos de forma segura.</li>
          <li>Enviar notificações importantes sobre seus serviços.</li>
          <li>Melhorar nossos serviços, incluindo o treinamento de nossos modelos de IA.</li>
        </ul>

        <h2 className="text-xl font-semibold">3. Compartilhamento de Informações</h2>
        <p>Não vendemos suas informações pessoais. Podemos compartilhar suas informações com:</p>
        <ul>
          <li>**Clientes e Prestadores:** Informações de perfil (exceto contatos diretos) são compartilhadas para facilitar a contratação.</li>
          <li>**Processadores de Pagamento:** Compartilhamos informações de transação com o Stripe para processar pagamentos.</li>
          <li>**Autoridades Legais:** Se exigido por lei.</li>
        </ul>

        <h2 className="text-xl font-semibold">4. Segurança</h2>
        <p>Implementamos medidas de segurança para proteger suas informações, incluindo criptografia e regras de acesso restritas. No entanto, nenhum sistema é 100% seguro.</p>

        <h2 className="text-xl font-semibold">5. Seus Direitos</h2>
        <p>Você tem o direito de acessar, corrigir ou excluir suas informações pessoais. Você pode fazer isso através das configurações do seu perfil ou entrando em contato conosco.</p>

        <p>Para mais informações, entre em contato conosco em [email de contato].</p>
      </div>

      <div className="mt-8 text-center">
        <Link to="/" className="text-blue-600 hover:underline">Voltar para a página inicial</Link>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;