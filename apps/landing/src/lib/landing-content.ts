export type LandingFeature = {
  id: string
  title: string
  description: string
}

export type LandingStat = {
  id: string
  value: string
  label: string
}

export type LandingStep = {
  id: string
  title: string
  description: string
}

export type LandingTestimonial = {
  id: string
  quote: string
  author: string
  role: string
}

export type LandingFaq = {
  id: string
  question: string
  answer: string
}

export type LandingFooterLink = {
  id: string
  label: string
  href: string
}

export type WhatsAppButton = {
  id: string
  label: string
  message: string
  ariaLabel: string
}

export const LANDING_FEATURES: LandingFeature[] = [
  {
    id: 'agenda',
    title: 'Agenda inteligente',
    description:
      'Visão por dia ou semana, busca rápida e agendamento sem fricção.',
  },
  {
    id: 'crm',
    title: 'CRM de clientes',
    description: 'Histórico, notas e busca por nome ou telefone em segundos.',
  },
  {
    id: 'financeiro',
    title: 'Financeiro integrado',
    description: 'Receitas, despesas e lucro do mês no mesmo painel.',
  },
  {
    id: 'relatorios',
    title: 'Relatórios claros',
    description: 'Acompanhe desempenho e exporte dados quando precisar.',
  },
]

export const LANDING_STATS: LandingStat[] = [
  { id: 'agendamentos', value: '2.400+', label: 'Agendamentos por mês' },
  { id: 'negocios', value: '180+', label: 'Negócios ativos' },
  { id: 'tempo', value: '3h', label: 'Economizadas por semana' },
  { id: 'satisfacao', value: '98%', label: 'Satisfação dos clientes' },
]

export const LANDING_STEPS: LandingStep[] = [
  {
    id: 'cadastro',
    title: 'Crie sua conta',
    description:
      'Cadastre seu negócio em minutos e configure serviços e horários.',
  },
  {
    id: 'agenda',
    title: 'Organize a agenda',
    description:
      'Centralize agendamentos, confirmações e lembretes em um só lugar.',
  },
  {
    id: 'crescimento',
    title: 'Acompanhe resultados',
    description:
      'Veja receitas, desempenho da equipe e exporte relatórios quando quiser.',
  },
]

export const LANDING_TESTIMONIALS: LandingTestimonial[] = [
  {
    id: 'marina',
    quote:
      'Antes eu perdia horas no caderno. Hoje a equipe agenda sozinha e eu foco no atendimento.',
    author: 'Marina Costa',
    role: 'Studio de estética, São Paulo',
  },
  {
    id: 'rafael',
    quote:
      'O financeiro integrado mudou o jogo. Sei exatamente quanto entrou e saiu no mês.',
    author: 'Dr. Rafael Mendes',
    role: 'Consultório odontológico, Curitiba',
  },
  {
    id: 'julia',
    quote:
      'Meus clientes agendam pelo link e recebem lembrete no WhatsApp. Menos faltas, mais receita.',
    author: 'Júlia Almeida',
    role: 'Salão de beleza, Belo Horizonte',
  },
]

export const LANDING_FAQ: LandingFaq[] = [
  {
    id: 'preco',
    question: 'Preciso pagar para começar?',
    answer:
      'Não. Você pode criar sua conta gratuitamente e explorar a plataforma antes de decidir.',
  },
  {
    id: 'equipe',
    question: 'Posso adicionar minha equipe?',
    answer:
      'Sim. Convide profissionais, defina permissões e acompanhe comissões no painel.',
  },
  {
    id: 'whatsapp',
    question: 'Funciona com WhatsApp?',
    answer:
      'Sim. Envie confirmações e lembretes com templates e links diretos para conversa.',
  },
  {
    id: 'portal',
    question: 'Meus clientes agendam sozinhos?',
    answer:
      'Sim. Compartilhe seu link público e receba agendamentos 24 horas por dia.',
  },
]

export const LANDING_FOOTER_LINKS: LandingFooterLink[] = [
  { id: 'recursos', label: 'Recursos', href: '#recursos' },
  { id: 'como-funciona', label: 'Como funciona', href: '#como-funciona' },
  { id: 'depoimentos', label: 'Depoimentos', href: '#depoimentos' },
  { id: 'blog', label: 'Blog', href: '/blog' },
  { id: 'faq', label: 'FAQ', href: '#faq' },
]

export const WHATSAPP_BUTTONS: WhatsAppButton[] = [
  {
    id: 'suporte',
    label: 'Suporte',
    message: 'Olá! Preciso de ajuda com o Agenda Bem.',
    ariaLabel: 'Falar com suporte pelo WhatsApp',
  },
  {
    id: 'vendas',
    label: 'Demonstração',
    message: 'Olá! Gostaria de agendar uma demonstração do Agenda Bem.',
    ariaLabel: 'Agendar demonstração pelo WhatsApp',
  },
]

export function getLandingFeatureIds(features = LANDING_FEATURES): string[] {
  return features.map((feature) => feature.id)
}

export function getAppUrl(path: string, appBaseUrl: string): string {
  const base = appBaseUrl.replace(/\/$/, '')
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${base}${normalizedPath}`
}

export function getWhatsAppUrl(
  phone: string,
  message: string,
  baseUrl = 'https://wa.me',
): string {
  const digits = phone.replace(/\D/g, '')
  const params = new URLSearchParams({ text: message })
  return `${baseUrl}/${digits}?${params.toString()}`
}

export function getWhatsAppLinks(
  phone: string,
  buttons = WHATSAPP_BUTTONS,
): Array<WhatsAppButton & { href: string }> {
  return buttons.map((button) => ({
    ...button,
    href: getWhatsAppUrl(phone, button.message),
  }))
}

export function getLandingMeta() {
  return {
    title: 'Agenda Bem',
    description:
      'Agenda, CRM e financeiro para salões, clínicas e consultórios.',
    kicker: 'Para salões, clínicas e consultórios',
    headline: 'Agenda, clientes e financeiro em um só lugar.',
    subheadline:
      'Substitua a agenda física, permita agendamento online e acompanhe o desempenho do seu negócio com relatórios claros.',
    ctaTitle: 'Pronto para organizar seu negócio?',
    ctaDescription:
      'Comece grátis hoje e veja como é simples centralizar agenda, clientes e financeiro.',
    footerTagline: 'Agenda, CRM e financeiro para negócios que crescem.',
    copyrightYear: new Date().getFullYear(),
  }
}

export function getDefaultWhatsAppPhone(): string {
  return '5521987962324'
}
